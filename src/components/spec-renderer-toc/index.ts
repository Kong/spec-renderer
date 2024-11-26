import type {
  TableOfContentsItem,
  TableOfContentsNode,
  TableOfContentsNodeGroup,
  TableOfContentsGroup,
  TableOfContentsExternalLink,
} from '@/stoplight/elements-core'

import UnknownItem from './UnknownItem.vue'
import NodeItem from './NodeItem.vue'
import GroupItem from './GroupItem.vue'
import NodeGroupItem from './NodeGroupItem.vue'
import ExternalLinkItem from './ExternalLinkItem.vue'

export function isGroup(item: TableOfContentsItem): item is TableOfContentsGroup {
  return Object.keys(item).length >= 2 && 'title' in item && 'items' in item
}

export function isNodeGroup(item: TableOfContentsItem): item is TableOfContentsNodeGroup {
  return 'title' in item && 'items' in item && 'slug' in item && 'id' in item && 'meta' in item && 'type' in item
}

export function isNode(item: TableOfContentsItem): item is TableOfContentsNode {
  return 'title' in item && 'slug' in item && 'id' in item && 'meta' in item && 'type' in item
}

export function isExternalLink(item: TableOfContentsItem): item is TableOfContentsExternalLink {
  return Object.keys(item).length === 2 && 'title' in item && 'url' in item
}

export const itemComponent = (tableOfContentsItem: TableOfContentsItem) => {
  if (isNodeGroup(tableOfContentsItem)) {
    return NodeGroupItem
  }

  if (isGroup(tableOfContentsItem)) {
    return GroupItem
  }

  if (isNode(tableOfContentsItem)) {
    return NodeItem
  }

  if (isExternalLink(tableOfContentsItem)) {
    return ExternalLinkItem
  }

  return UnknownItem
}
