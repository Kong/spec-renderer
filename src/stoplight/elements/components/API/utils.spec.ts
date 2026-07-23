import { afterEach, describe, expect, it, vi } from 'vitest'
import { NodeType } from '@stoplight/types'
import { computeAPITree } from './utils'
import type { OperationNode, ServiceNode } from '../../utils/oas/types'
import type { TableOfContentsGroup, TableOfContentsItem, TableOfContentsNode } from '../../../elements-core/components/Docs/types'

const operation = (name: string, uri: string, tags: string[], options: { deprecated?: boolean, internal?: boolean } = {}): OperationNode => ({
  type: NodeType.HttpOperation,
  uri,
  name,
  tags,
  data: {
    id: uri,
    method: 'get',
    path: uri,
    responses: [],
    servers: [],
    ...(options.deprecated ? { deprecated: true } : {}),
    ...(options.internal ? { internal: true } : {}),
  },
} as OperationNode)

const serviceNode = (overrides: Partial<ServiceNode> = {}): ServiceNode => ({
  type: NodeType.HttpService,
  uri: '/',
  name: 'Grouped API',
  tags: [],
  data: {
    id: '/',
    name: 'Grouped API',
    version: '1.0.0',
  },
  children: [],
  specVersion: 'OAS 3.1',
  ...overrides,
} as ServiceNode)

const asGroup = (item: TableOfContentsItem | undefined): TableOfContentsGroup => item as TableOfContentsGroup
const asNode = (item: TableOfContentsItem | undefined): TableOfContentsNode => item as TableOfContentsNode

const endpointItems = (node: ServiceNode, currentPath = ''): TableOfContentsGroup['items'] => asGroup(computeAPITree(node, { currentPath })[1]).items

const operationTitles = (items: TableOfContentsGroup['items']): string[] => items.flatMap((item) => {
  if ('items' in item) return operationTitles(item.items)
  return item.title
})

describe('computeAPITree x-tagGroups', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds nested endpoint groups in declared order', () => {
    const tree = endpointItems(serviceNode({
      tags: ['Billing', 'Customers', 'Invoices'],
      tagGroups: [
        { name: 'Admin', tags: ['Invoices', 'Billing'] },
        { name: 'Public', tags: ['Customers'] },
      ],
      children: [
        operation('List billing', '/paths/billing/get', ['Billing']),
        operation('List customers', '/paths/customers/get', ['Customers']),
        operation('List invoices', '/paths/invoices/get', ['Invoices']),
      ],
    }))

    expect(tree).toEqual([
      {
        title: 'Admin',
        initiallyExpanded: false,
        items: [
          {
            title: 'Invoices',
            itemsType: 'http_operation',
            initiallyExpanded: false,
            items: [{ id: '/paths/invoices/get', slug: '/paths/invoices/get', title: 'List invoices', type: 'http_operation', meta: 'get' }],
          },
          {
            title: 'Billing',
            itemsType: 'http_operation',
            initiallyExpanded: false,
            items: [{ id: '/paths/billing/get', slug: '/paths/billing/get', title: 'List billing', type: 'http_operation', meta: 'get' }],
          },
        ],
      },
      {
        title: 'Public',
        initiallyExpanded: false,
        items: [
          {
            title: 'Customers',
            itemsType: 'http_operation',
            initiallyExpanded: false,
            items: [{ id: '/paths/customers/get', slug: '/paths/customers/get', title: 'List customers', type: 'http_operation', meta: 'get' }],
          },
        ],
      },
    ])
  })

  it('hides operations with unlisted tags and no tags', () => {
    const tree = endpointItems(serviceNode({
      tagGroups: [{ name: 'Visible group', tags: ['Visible'] }],
      children: [
        operation('Visible operation', '/paths/visible/get', ['Visible']),
        operation('Unlisted operation', '/paths/unlisted/get', ['Unlisted']),
        operation('Untagged operation', '/paths/untagged/get', []),
      ],
    }))

    expect(operationTitles(tree)).toEqual(['Visible operation'])
  })

  it('skips unknown tags with a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tree = endpointItems(serviceNode({
      tagGroups: [{ name: 'Known group', tags: ['Known', 'Missing'] }],
      children: [operation('Known operation', '/paths/known/get', ['Known'])],
    }))

    expect(warnSpy).toHaveBeenCalledWith('@kong/spec-renderer: skipping unknown x-tagGroups tag "Missing"')
    expect(operationTitles(tree)).toEqual(['Known operation'])
  })

  it('falls back to existing endpoint grouping when x-tagGroups is absent', () => {
    const tree = endpointItems(serviceNode({
      tags: ['Billing'],
      children: [
        operation('Status operation', '/paths/status/get', []),
        operation('Billing operation', '/paths/billing/get', ['Billing']),
      ],
    }))

    expect(tree).toEqual([
      { id: '/paths/status/get', slug: '/paths/status/get', title: 'Status operation', type: 'http_operation', meta: 'get' },
      {
        title: 'Billing',
        itemsType: 'http_operation',
        initiallyExpanded: false,
        items: [{ id: '/paths/billing/get', slug: '/paths/billing/get', title: 'Billing operation', type: 'http_operation', meta: 'get' }],
      },
    ])
  })

  it('keeps multi-tag operation duplicate URI behavior', () => {
    const tree = endpointItems(serviceNode({
      tagGroups: [{ name: 'Beer group', tags: ['Mesh', 'System'] }],
      children: [operation('Get list of beers', '/paths/beers-ale/get', ['System', 'Mesh'])],
    }))

    const beerGroup = asGroup(tree[0])
    expect(asNode(asGroup(beerGroup.items[0]).items[0]).id).toBe('/paths/mesh/beers-ale/get')
    expect(asNode(asGroup(beerGroup.items[1]).items[0]).id).toBe('/paths/beers-ale/get')
  })

  it('expands parent groups containing the active operation', () => {
    const tree = endpointItems(serviceNode({
      tagGroups: [{ name: 'Active group', tags: ['Active'] }],
      children: [operation('Active operation', '/paths/active/get', ['Active'])],
    }), '/paths/active/get')

    const activeGroup = asGroup(tree[0])
    expect(activeGroup.initiallyExpanded).toBe(true)
    expect(asGroup(activeGroup.items[0]).initiallyExpanded).toBe(true)
  })

  it('filters deprecated and internal operations inside nested groups', () => {
    const tree = asGroup(computeAPITree(serviceNode({
      tagGroups: [{ name: 'Filtered group', tags: ['Filtered'] }],
      children: [
        operation('Visible operation', '/paths/visible/get', ['Filtered']),
        operation('Deprecated operation', '/paths/deprecated/get', ['Filtered'], { deprecated: true }),
        operation('Internal operation', '/paths/internal/get', ['Filtered'], { internal: true }),
      ],
    }), { hideDeprecated: true, hideInternal: true })[1]).items

    expect(operationTitles(tree)).toEqual(['Visible operation'])
  })
})
