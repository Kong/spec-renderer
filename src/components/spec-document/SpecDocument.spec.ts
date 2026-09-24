import { describe, it, vi, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecDocument from './SpecDocument.vue'
import { alphaServiceNode } from './SpecDocument.fixtures'
import type { ServiceNode } from '@/types'

window.scrollTo = vi.fn()
window.HTMLElement.prototype.scrollIntoView = vi.fn()

describe('<SpecDocument />', () => {
  it('Should fire path-not-found event', () => {
    const wrapper = mount(SpecDocument, {
      props: {
        document: {
          children: [],
          tags: [],
        } as unknown as ServiceNode,
        currentPath: '/some-bogus-path',
      },
    })

    expect(wrapper.emitted('path-not-found')?.toString()).toBe('/some-bogus-path')
  })

  it('should use proper server URL', () => {
    const wrapper = mount(SpecDocument, {
      props: {
        document: {
          'type': 'http_service',
          'uri': '/',
          'name': 'Coffee API',
          'data': {
            'version': '1.0.0',
            'name': 'Coffee API',
            'description': 'API for managing coffee orders',
            'servers': [
              {
                'id': '42f8f57f70108',
                'url': '{protocol}://{hostname}:{port}{path}',
                'name': 'Coffee API',
                'description': 'Default Admin API URL',
                'variables': {
                  'hostname': {
                    'default': 'localhost',
                    'description': "Hostname for Kong's Admin API",
                  },
                  'path': {
                    'default': '/',
                    'description': "Base path for Kong's Admin API",
                  },
                  'port': {
                    'default': '8001',
                    'description': "Port for Kong's Admin API",
                  },
                  'protocol': {
                    'default': 'http',
                    'description': "Protocol for requests to Kong's Admin API",
                    'enum': [
                      'http',
                      'https',
                    ],
                  },
                },
              },
            ],
          },
          'children': [
            {
              'type': 'http_operation',
              'uri': '/operations/listHotCoffees',
              'data': {
                'id': 'd8e3b0a562cdf',
                'method': 'get',
                'path': '/coffee/hot',
                'description': 'Retrieves a list of available hot coffee options with pagination.',
                'summary': 'List hot coffee options',
                'securityDeclarationType': 'declared',
                'request': {
                  'headers': [],
                  'query': [
                    {
                      'id': 'a7962ba0b42b3',
                      'name': 'limit',
                      'style': 'form',
                      'examples': [],
                      'description': 'Maximum number of items to return per page',
                      'schema': {
                        '$schema': 'http://json-schema.org/draft-07/schema#',
                        'type': 'integer',
                        'format': 'int32',
                        'minimum': 1,
                        'maximum': 100,
                        'default': 20,
                        'x-stoplight': {
                          'id': '142eea663e26b',
                        },
                        'description': 'Maximum number of items to return per page',
                      },
                      'explicitProperties': [
                        'name',
                        'in',
                        'description',
                        'schema',
                      ],
                    },
                    {
                      'id': '8e94220a8c4cf',
                      'name': 'offset',
                      'style': 'form',
                      'examples': [],
                      'description': 'Number of items to skip for pagination',
                      'schema': {
                        '$schema': 'http://json-schema.org/draft-07/schema#',
                        'type': 'integer',
                        'format': 'int32',
                        'minimum': 0,
                        'default': 0,
                        'x-stoplight': {
                          'id': '24d8c3bb53830',
                        },
                        'description': 'Number of items to skip for pagination',
                      },
                      'explicitProperties': [
                        'name',
                        'in',
                        'description',
                        'schema',
                      ],
                    },
                  ],
                  'cookie': [],
                  'path': [],
                },
                'responses': [{
                  code: '200',
                },
                ],
              },
              'name': 'List hot coffee options',
            },
          ],
          'specVersion': 'OAS 3.1',
        } as unknown as ServiceNode,
        currentPath: '/',
      },
    })
    expect(wrapper.findTestId('42f8f57f70108-hostname-input').exists()).toBe(true)
    // correct URL shows in operation's server list
    expect(wrapper.findTestId('server-url-get-http://localhost:8001/coffee/hot').exists()).toBe(true)
  })

  it('should render scoped server urls for operations with their own servers blocks', () => {
    const wrapper = mount(SpecDocument, {
      props: {
        document: {
          'type': 'http_service',
          'uri': '/',
          'name': 'Multi-Server API',
          'data': {
            'version': '1.0.0',
            'name': 'Multi-Server API',
            'servers': [
              {
                'id': 'root-server-id',
                'url': 'https://api.example.com/v1',
                'description': 'Primary API server',
              },
            ],
          },
          'children': [
            {
              // no override - resolves to the root server
              'type': 'http_operation',
              'uri': '/operations/getUsers',
              'data': {
                'id': 'op-users',
                'method': 'get',
                'path': '/users',
                'responses': [],
                'servers': [
                  {
                    'id': 'root-server-id',
                    'url': 'https://api.example.com/v1',
                  },
                ],
              },
              'name': 'Get user list',
            },
            {
              // operation level override
              'type': 'http_operation',
              'uri': '/operations/postFiles',
              'data': {
                'id': 'op-files',
                'method': 'post',
                'path': '/files',
                'responses': [],
                'servers': [
                  {
                    'id': 'uploads-server-id',
                    'url': 'https://uploads.example.com',
                  },
                ],
              },
              'name': 'Upload file',
            },
          ],
          'specVersion': 'OAS 3.1',
        } as unknown as ServiceNode,
        currentPath: '/',
      },
    })

    // operation without override uses the root server
    expect(wrapper.findTestId('server-url-get-https://api.example.com/v1/users').exists()).toBe(true)
    // operation with a scoped server block uses its own server
    expect(wrapper.findTestId('server-url-post-https://uploads.example.com/files').exists()).toBe(true)
  })

  it('should not seed the global server list with a deep-linked operation\'s scoped servers', async () => {
    const wrapper = mount(SpecDocument, {
      props: {
        document: {
          'type': 'http_service',
          'uri': '/',
          'name': 'Scoped Servers API',
          // no root servers block
          'data': {
            'version': '1.0.0',
            'name': 'Scoped Servers API',
          },
          'children': [
            {
              // operation with scoped servers
              'type': 'http_operation',
              'uri': '/operations/postFiles',
              'data': {
                'id': 'op-files',
                'method': 'post',
                'path': '/files',
                'responses': [],
                'servers': [
                  {
                    'id': 'uploads-server-id',
                    'url': 'https://uploads.example.com',
                  },
                ],
              },
              'name': 'Upload file',
            },
            {
              // operation without its own servers
              'type': 'http_operation',
              'uri': '/operations/getStatus',
              'data': {
                'id': 'op-status',
                'method': 'get',
                'path': '/status',
                'responses': [],
              },
              'name': 'Get status',
            },
          ],
          'specVersion': 'OAS 3.1',
        } as unknown as ServiceNode,
        // deep-link to the operation with scoped servers
        currentPath: '/operations/postFiles',
      },
    })

    // the deep-linked operation still resolves against its own scoped servers
    expect(wrapper.findTestId('server-url-post-https://uploads.example.com/files').exists()).toBe(true)
    // the sibling operation without its own servers must not offer the scoped server
    expect(wrapper.findTestId('server-url-get-https://uploads.example.com/status').exists()).toBe(false)

    // the global server list must stay unseeded when navigating to the sibling operation
    await wrapper.setProps({ currentPath: '/operations/getStatus' })
    expect(wrapper.findTestId('server-url-get-https://uploads.example.com/status').exists()).toBe(false)
  })

  it('should render operation tags', () => {
    const wrapper = mount(SpecDocument, {
      props: {
        document: alphaServiceNode,
        tableOfContents: [{ 'id': '/', 'slug': '/', 'title': 'Overview', 'type': 'overview', 'meta': '' }, { 'title': 'Endpoints', 'items': [{ 'title': 'First Tag', 'items': [{ 'id': '/operations/getAlpha', 'slug': '/operations/getAlpha', 'title': 'Get request for alpha endpoint', 'type': 'http_operation', 'meta': 'get' }], 'itemsType': 'http_operation', 'initiallyExpanded': false }], 'hideTitle': false, 'initiallyExpanded': true }],
        currentPath: '/',
      },
    })

    expect(wrapper.find('#tag-first-tag').exists()).toBe(true)
  })

  describe('permalink button visibility', () => {
    it('shows permalink button on operations when enableOperationLinks is true', () => {
      const wrapper = mount(SpecDocument, {
        props: {
          document: alphaServiceNode,
          currentPath: '/operations/getAlpha',
          enableOperationLinks: true,
        },
      })
      expect(wrapper.findTestId('operation-permalink-button').exists()).toBe(true)
    })

    it('does not show permalink button when enableOperationLinks is false', () => {
      const wrapper = mount(SpecDocument, {
        props: {
          document: alphaServiceNode,
          currentPath: '/operations/getAlpha',
          enableOperationLinks: false,
        },
      })
      expect(wrapper.findTestId('operation-permalink-button').exists()).toBe(false)
    })
  })

  describe('overview title/description suppression', () => {
    it('hides the overview title and description when the hide props are set', () => {
      const wrapper = mount(SpecDocument, {
        props: {
          document: alphaServiceNode,
          currentPath: '/',
          // string values exercise the BOOL_VALIDATOR/IS_TRUE normalization
          hideOverviewTitle: 'true',
          hideOverviewDescription: 'true',
        },
      })

      // scope to the overview header: operations below also render PageHeader titles
      expect(wrapper.find('.overview-page-header [data-testid="spec-renderer-page-header-title"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('This is a specification document with tags for organizing endpoints.')
      // version badges remain visible
      expect(wrapper.find('.overview-page-versions').exists()).toBe(true)
    })

    it('hides only the title when hideOverviewTitle is set', () => {
      const wrapper = mount(SpecDocument, {
        props: {
          document: alphaServiceNode,
          currentPath: '/',
          hideOverviewTitle: true,
        },
      })

      // scope to the overview header: operations below also render PageHeader titles
      expect(wrapper.find('.overview-page-header [data-testid="spec-renderer-page-header-title"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('This is a specification document with tags for organizing endpoints.')
    })

    it('hides only the description when hideOverviewDescription is set', () => {
      const wrapper = mount(SpecDocument, {
        props: {
          document: alphaServiceNode,
          currentPath: '/',
          hideOverviewDescription: true,
        },
      })

      expect(wrapper.find('.overview-page-header [data-testid="spec-renderer-page-header-title"]').text()).toBe('Spec with tags')
      expect(wrapper.text()).not.toContain('This is a specification document with tags for organizing endpoints.')
    })

    // 'false' as a string is the normal value for a web-component attribute; a plain-truthiness
    // regression in the IS_TRUE normalization would wrongly hide the title here
    it('renders the title and description when the hide props are the string "false"', () => {
      const wrapper = mount(SpecDocument, {
        props: {
          document: alphaServiceNode,
          currentPath: '/',
          hideOverviewTitle: 'false',
          hideOverviewDescription: 'false',
        },
      })

      expect(wrapper.find('.overview-page-header [data-testid="spec-renderer-page-header-title"]').text()).toBe('Spec with tags')
      expect(wrapper.text()).toContain('This is a specification document with tags for organizing endpoints.')
    })

    it('renders the overview title and description by default', () => {
      const wrapper = mount(SpecDocument, {
        props: {
          document: alphaServiceNode,
          currentPath: '/',
        },
      })

      expect(wrapper.find('.overview-page-header [data-testid="spec-renderer-page-header-title"]').text()).toBe('Spec with tags')
      expect(wrapper.text()).toContain('This is a specification document with tags for organizing endpoints.')
    })
  })

})
