import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AsyncMessage from './AsyncMessage.vue'
import SchemaExample from '@/components/common/SchemaExample.vue'

describe('<AsyncMessage />', () => {
  it('should render and switch between inline message payload examples', async () => {
    const wrapper = mount(AsyncMessage, {
      props: {
        title: 'Account Event',
        data: {
          payload: { type: 'object' },
          messageExamples: [
            { name: 'Accrual', payload: { event: 'ACCRUAL' } },
            { name: 'Profile update', payload: { event: 'PROFILE' } },
          ],
        },
      },
      attachTo: document.body,
    })

    expect(wrapper.findComponent(SchemaExample).props('schemaExampleJson')).toContain('ACCRUAL')
    expect(wrapper.findTestId('async-message-example-selector').exists()).toBe(true)

    await wrapper.findTestId('trigger-button').trigger('click')
    await wrapper.findTestId('async-message-example-1-item-trigger').trigger('click')

    expect(wrapper.findComponent(SchemaExample).props('schemaExampleJson')).toContain('PROFILE')
    wrapper.unmount()
  })
})
