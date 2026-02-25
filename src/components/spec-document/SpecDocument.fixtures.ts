import type { ServiceNode } from '@/types'

export const alphaServiceNode = {
  'type': 'http_service',
  'uri': '/',
  'name': 'Spec with tags',
  'data': {
    'id': 'undefined',
    'version': '0.1.0',
    'name': 'Spec with tags',
    'description': 'This is a specification document with tags for organizing endpoints.',
    'extensions': {},
    'infoExtensions': {},
    'tags': [
      {
        'id': '85d5b4a0a594c',
        'name': 'First Tag',
        'description': 'This is the first tag',
      },
    ],
    'servers': [
      {
        'id': '1c08f959b65b5',
        'url': 'https://konghq.com',
        'name': 'Spec with tags',
      },
    ],
  },
  'tags': [
    'First Tag',
  ],
  'children': [
    {
      'type': 'http_operation',
      'uri': '/operations/getAlpha',
      'data': {
        'id': '2e9146a964a8d',
        'method': 'get',
        'path': '/alpha',
        'tags': [
          {
            'id': '85d5b4a0a594c',
            'name': 'First Tag',
          },
        ],
        'extensions': {},
        'iid': 'getAlpha',
        'description': 'Alpha endpoint.',
        'summary': 'Get request for alpha endpoint',
        'securityDeclarationType': 'inheritedFromService',
        'responses': [
          {
            'id': '298db75e3acd6',
            'code': '200',
            'headers': [],
            'contents': [
              {
                'id': 'b249580bdf6f0',
                'mediaType': 'application/json',
                'examples': [],
                'encodings': [],
                'schema': {
                  '$schema': 'http://json-schema.org/draft-07/schema#',
                  'type': 'object',
                  'properties': {
                    '_custom': {
                      'type': 'reactive',
                      'stateTypeName': 'Reactive',
                      'value': {
                        'message': {
                          'type': 'string',
                          'example': 'Alpha endpoint reached successfully.',
                        },
                      },
                    },
                  },
                  'x-stoplight': {
                    'id': 'f0fad1cfa9951',
                  },
                },
              },
            ],
            'description': 'OK',
          },
        ],
        'request': {
          'headers': [],
          'query': [],
          'cookie': [],
          'path': [],
        },
        'security': [],
        'servers': [
          {
            'id': '1c08f959b65b5',
            'url': 'https://konghq.com',
            'name': 'Spec with tags',
          },
        ],
      },
      'name': 'Get request for alpha endpoint',
      'tags': [
        'First Tag',
      ],
    },
  ],
  'specVersion': 'OAS 3.1',
} as unknown as ServiceNode
