import { describe, it, vi, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecDocument from './SpecDocument.vue'
import type { ServiceNode } from '@/types'

window.scrollTo = vi.fn()

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

})
