// @ts-nocheck external file
import { NodeType } from '@stoplight/types'

import type { ServiceChildNode, ServiceNode } from '@/types'

import type { TableOfContentsGroup, TableOfContentsItem } from '../../../elements-core/components/Docs/types'
import { isHttpOperation, isHttpService, isHttpWebhookOperation } from '../../../elements-core/utils/guards'
import type { OperationNode, SchemaNode, WebhookNode } from '../../utils/oas/types'
import { slugify } from '../../../elements-core/utils/string'


const defaults = (...args) => args.reverse().reduce((acc, obj) => ({ ...acc, ...obj }), {})

type GroupableNode = OperationNode | WebhookNode | SchemaNode

export type TagGroup<T extends GroupableNode> = { title: string, items: T[], initiallyExpanded: boolean }
type XTagGroup = { title: string, items: Array<TagGroup<OperationNode>> }

const nodeToTocItem = (node: GroupableNode) => ({
  id: node.uri,
  slug: node.uri,
  title: node.name,
  type: node.type,
  meta: isHttpOperation(node.data) || isHttpWebhookOperation(node.data) ? node.data.method : '',
  ...(isDeprecated(node) ? { deprecated: true } : {}),
})

export function computeTagGroups<T extends GroupableNode>(
  serviceNode: ServiceNode,
  nodeType: T['type'],
  currentPath: string,
) {
  const groupsByTagId: { [tagId: string]: TagGroup<T> } = {}
  const ungrouped: T[] = []

  const lowerCaseServiceTags = serviceNode.tags.map(tn => tn.toLowerCase())

  const groupableNodes = serviceNode.children.filter(n => n.type === nodeType) as T[]

  for (const node of groupableNodes) {

    if (node.tags.length > 0) {
      for (let i = 0; i < node.tags.length; i++) {
        const tagName = node.tags[i]
        /*
          if the section has multiple-tags, we need to inject the slugified tag name into section's uri.
          eg:
          section has uri: /paths/list/get
          and two tags: system and mesh

          we will keep first occurrence (toc item) with url: /paths/list/get. but inject tag into second occurrence (/paths/mesh/list/get)
        */
        const nodeUri = i === 0 ? node.uri : node.uri.split('/').toSpliced(2, 0, slugify(tagName).toLowerCase()).join('/')
        const tagId = tagName.toLowerCase()
        if (groupsByTagId[tagId]) {
          groupsByTagId[tagId].items.push({ ...node, ...{ uri: nodeUri } })
          groupsByTagId[tagId].initiallyExpanded = groupsByTagId[tagId].initiallyExpanded
            ? true
            : nodeUri === currentPath
        } else {
          const serviceTagIndex = lowerCaseServiceTags.findIndex(tn => tn === tagId)
          const serviceTagName = serviceNode.tags[serviceTagIndex]
          groupsByTagId[tagId] = {
            title: serviceTagName || tagName,
            items: [{ ...node, ...{ uri: nodeUri } }],
            initiallyExpanded: nodeUri === currentPath,
          }
        }
      }
    } else {
      ungrouped.push(node)
    }
  }

  const orderedTagGroups = Object.entries(groupsByTagId)
    .sort(([g1], [g2]) => {
      const g1LC = g1.toLowerCase()
      const g2LC = g2.toLowerCase()
      const g1Idx = lowerCaseServiceTags.findIndex(tn => tn === g1LC)
      const g2Idx = lowerCaseServiceTags.findIndex(tn => tn === g2LC)

      // Move not-tagged groups to the bottom
      if (g1Idx < 0 && g2Idx < 0) return 0
      if (g1Idx < 0) return 1
      if (g2Idx < 0) return -1

      // sort tagged groups according to the order found in HttpService
      return g1Idx - g2Idx
    })
    .map(([, tagGroup]) => tagGroup)

  return { groups: orderedTagGroups, ungrouped }
}

/**
 * Reorders existing operation tag groups according to top-level x-tagGroups.
 *
 * This intentionally starts from computeTagGroups output instead of raw operations
 * so multi-tag URI rewriting and active-path expansion stay in one place.
 */
function computeXTagGroups(tagGroups: Array<TagGroup<OperationNode>>, serviceNode: ServiceNode): XTagGroup[] {
  const groupsByTagId = tagGroups.reduce((acc: Record<string, TagGroup<OperationNode>>, group) => {
    acc[group.title.toLowerCase()] = group
    return acc
  }, {})

  return serviceNode.tagGroups.flatMap((tagGroup): XTagGroup[] => {
    const groups = tagGroup.tags.flatMap((tagName): Array<TagGroup<OperationNode>> => {
      const tagId = tagName.toLowerCase()
      const group = groupsByTagId[tagId]

      // x-tagGroups is strict: only tags explicitly listed in a group appear in Endpoints.
      if (!group) {
        console.warn(`@kong/spec-renderer: skipping unknown x-tagGroups tag "${tagName}"`)
        return []
      }

      return [group]
    })

    if (!groups.length) return []

    return [{
      title: tagGroup.name,
      items: groups,
    }]
  })
}

interface ComputeAPITreeConfig {
  hideSchemas?: boolean
  hideInternal?: boolean
  currentPath?: string
  hideDeprecated?: boolean
}

const defaultComputerAPITreeConfig = {
  hideSchemas: false,
  hideInternal: false,
  hideDeprecated: false,
  currentPath: '',
}

export const computeAPITree = (serviceNode: ServiceNode, config: ComputeAPITreeConfig = {}) => {
  const mergedConfig = defaults(config, defaultComputerAPITreeConfig)
  const tree: TableOfContentsItem[] = []

  tree.push({
    id: '/',
    slug: '/',
    title: 'Overview',
    type: 'overview',
    meta: '',
  })

  const hasOperationNodes = serviceNode.children.some(node => node.type === NodeType.HttpOperation)
  if (hasOperationNodes) {
    tree.push({
      title: 'Endpoints',
      items: [],
      hideTitle: mergedConfig.hideSchemas,
      initiallyExpanded: true, // Endpoints are always expanded by default
    })

    // exists if x-tagGroups is present in the spec and
    // has at least one tag group with at least one tag that matches a tag on an operation
    if (serviceNode.tagGroups?.length) {
      // Start from normal tag groups so multi-tag URI handling stays centralized.
      const { groups } = computeTagGroups<OperationNode>(
        serviceNode,
        NodeType.HttpOperation,
        mergedConfig.currentPath,
      )

      addXTagGroupsToTree({
        groups: computeXTagGroups(groups, serviceNode),
        tree: tree.at(-1).items,
        hideInternal: mergedConfig.hideInternal,
        hideDeprecated: mergedConfig.hideDeprecated,
      })
    } else {
      const { groups, ungrouped } = computeTagGroups<OperationNode>(
        serviceNode,
        NodeType.HttpOperation,
        mergedConfig.currentPath,
      )

      addTagGroupsToTree({
        groups,
        ungrouped,
        tree: tree.at(-1).items,
        itemsType: NodeType.HttpOperation,
        hideInternal: mergedConfig.hideInternal,
        hideDeprecated: mergedConfig.hideDeprecated,
      })
    }
  }

  const hasWebhookNodes = serviceNode.children.some(node => node.type === NodeType.HttpWebhook)
  const { groups, ungrouped } = computeTagGroups<WebhookNode>(
    serviceNode,
    NodeType.HttpWebhook,
    mergedConfig.currentPath,
  )

  if (hasWebhookNodes) {
    tree.push({
      title: 'Webhooks',
      items: [],
      initiallyExpanded:
        groups.some(group => group.initiallyExpanded) || ungrouped.some(node => node.uri === mergedConfig.currentPath),
    })

    addTagGroupsToTree({
      groups,
      ungrouped,
      tree: tree.at(-1).items,
      itemsType: NodeType.HttpWebhook,
      hideInternal: mergedConfig.hideInternal,
      hideDeprecated: mergedConfig.hideDeprecated,
    })
  }

  let schemaNodes = serviceNode.children.filter(node => node.type === NodeType.Model)
  if (mergedConfig.hideInternal) {
    schemaNodes = schemaNodes.filter(n => !isInternal(n))
  }

  if (!mergedConfig.hideSchemas && schemaNodes.length) {
    const { groups, ungrouped } = computeTagGroups<SchemaNode>(serviceNode, NodeType.Model, mergedConfig.currentPath)

    tree.push({
      title: 'Schemas',
      items: [],
      initiallyExpanded:
        groups.some(group => group.initiallyExpanded) || ungrouped.some(node => node.uri === mergedConfig.currentPath),
    })

    addTagGroupsToTree({
      groups,
      ungrouped,
      tree: tree.at(-1).items,
      itemsType: NodeType.Model,
      hideInternal: mergedConfig.hideInternal,
    })
  }

  return tree
}

export const findFirstNodeSlug = (tree: TableOfContentsItem[]): string | void => {
  for (const item of tree) {
    if ('slug' in item) {
      return item.slug
    }

    if ('items' in item) {
      const slug = findFirstNodeSlug(item.items)
      if (slug) {
        return slug
      }
    }
  }
}

export const isInternal = (node: ServiceChildNode | ServiceNode): boolean => {
  const data = node.data

  if (isHttpOperation(data) || isHttpWebhookOperation(data)) {
    return !!data.internal
  }

  if (isHttpService(data)) {
    return false
  }

  return !!data['x-internal']
}

const isDeprecated = (node: ServiceChildNode | ServiceNode): boolean => {
  const data = node.data

  if (isHttpOperation(data) || isHttpWebhookOperation(data)) {
    return data.deprecated ?? false
  }

  return false
}

interface AddTagGroupsToTreeParams<T extends GroupableNode> {
  groups: Array<TagGroup<T>>
  ungrouped: T[]
  tree: TableOfContentsItem[]
  itemsType: TableOfContentsGroup['itemsType']
  hideInternal: boolean
  hideDeprecated: boolean
}

const addTagGroupsToTree = <T extends GroupableNode>({
  groups,
  ungrouped,
  tree,
  itemsType,
  hideInternal,
  hideDeprecated,
}: AddTagGroupsToTreeParams<T>) => {
  // Show ungrouped nodes above tag groups
  ungrouped.forEach(node => {
    if ((hideInternal && isInternal(node)) || (hideDeprecated && isDeprecated(node))) {
      return
    }

    tree.push({
      ...nodeToTocItem(node),
    })
  })

  groups.forEach(group => {
    const items = group.items.flatMap(node => {
      if ((hideInternal && isInternal(node)) || (hideDeprecated && isDeprecated(node))) {
        return []
      }

      return nodeToTocItem(node)
    })

    if (items.length) {
      tree.push({
        title: group.title,
        items,
        itemsType,
        initiallyExpanded: group.initiallyExpanded,
      })
    }
  })
}

interface AddXTagGroupsToTreeParams {
  groups: XTagGroup[]
  tree: TableOfContentsItem[]
  hideInternal: boolean
  hideDeprecated: boolean
}

const addXTagGroupsToTree = ({
  groups,
  tree,
  hideInternal,
  hideDeprecated,
}: AddXTagGroupsToTreeParams) => {
  groups.forEach(xTagGroup => {
    const tagGroups = xTagGroup.items.flatMap((tagGroup) => {
      const items = tagGroup.items.flatMap(node => {
        if ((hideInternal && isInternal(node)) || (hideDeprecated && isDeprecated(node))) {
          return []
        }

        return nodeToTocItem(node)
      })

      if (!items.length) return []

      return [{
        title: tagGroup.title,
        items,
        itemsType: NodeType.HttpOperation,
        initiallyExpanded: tagGroup.initiallyExpanded,
      }]
    })

    if (!tagGroups.length) return

    // Render the x-tagGroups name as a flat TOC label followed by its tag groups.
    // The label is visual only; tags remain the collapsible navigation items.
    tree.push({
      title: xTagGroup.title,
      type: 'label',
    })
    tree.push(...tagGroups)
  })
}
