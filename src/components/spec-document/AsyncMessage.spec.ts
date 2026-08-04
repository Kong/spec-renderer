import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AsyncMessage from './AsyncMessage.vue'
import CodeBlock from '@/components/common/CodeBlock.vue'

const messageExample = (name: string, payload: Record<string, any>) => ({
  hasName: () => true,
  name: () => name,
  hasSummary: () => false,
  summary: () => undefined,
  hasHeaders: () => false,
  headers: () => undefined,
  hasPayload: () => true,
  payload: () => payload,
  extensions: () => ({}),
})

describe('<AsyncMessage />', () => {
  it('should render and switch between inline message payload examples', async () => {
    const wrapper = mount(AsyncMessage, {
      props: {
        title: 'Account Event',
        data: {
          payload: { type: 'object' },
          messageExamples: [
            messageExample('Accrual', { event: 'ACCRUAL' }),
            messageExample('Profile update', { event: 'PROFILE' }),
          ],
        },
      },
      attachTo: document.body,
    })

    expect(wrapper.findComponent(CodeBlock).props('code')).toContain('ACCRUAL')
    expect(wrapper.findTestId('async-message-example-selector').exists()).toBe(true)

    await wrapper.findTestId('trigger-button').trigger('click')
    await wrapper.findTestId('async-message-example-1-item-trigger').trigger('click')

    expect(wrapper.findComponent(CodeBlock).props('code')).toContain('PROFILE')
    wrapper.unmount()
  })
})
