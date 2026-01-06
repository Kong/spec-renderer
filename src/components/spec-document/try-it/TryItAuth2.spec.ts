import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TryItAuth2 from './TryItAuth2.vue'


describe('<TryItAuth2 />', () => {

  it('Should handle x-kong-client-credentials-config extension in auth2 clientCredentials', async () => {

    const wrapper = mount(TryItAuth2, {
      props: {
        'dataId': '4b9cfc2271c3f',
        'scheme': {
          'id': 'ca39a16b90492',
          'key': 'oauth2',
          'extensions': {
            'x-kong-client-credentials-config': {
              'extraTokenRequestParameters': [
                {
                  'name': 'organization',
                  'label': 'Organization',
                  'description': 'The organization identifier',
                  'omitIfEmpty': true,
                  'required': true,
                },
                {
                  'name': 'audience',
                  'label': 'Audience',
                  'value': 'https://api.audience.com/v1',
                },
              ],
            },
          },
          'type': 'oauth2',
          'flows': {
            'clientCredentials': {
              'scopes': {
                'read:products': 'Grants read access to products',
                'write:products': 'Grants write access to products',
              },
              'tokenUrl': 'https://example.com/oauth/token',
            },
          },
        },
        'schemeKey': 'oauth2',
      },
      global: {
        provide: {
        },
      },
    })
    expect(wrapper.html()).toContain('auth-input-oauth2-clientCredentials-organization-')
    expect(wrapper.html()).toContain('auth-input-oauth2-clientCredentials-audience-')
  })
})
