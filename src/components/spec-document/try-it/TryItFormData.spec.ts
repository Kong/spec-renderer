import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TryItFormData from './TryItFormData.vue'
import EditableCodeBlock from '@/components/common/EditableCodeBlock.vue'
import type { RequestFormField } from '@/types'

describe('<TryItFormData />', () => {
  const data = {
    id: 'op-1',
    method: 'post',
    path: '/upload',
    responses: [],
    servers: [],
  }

  const fields: RequestFormField[] = [
    { name: 'title', kind: 'text', required: true, value: 'default title' },
    { name: 'avatar', kind: 'file', required: true },
    { name: 'gallery', kind: 'file', multiple: true },
    { name: 'metadata', kind: 'json', value: JSON.stringify({ role: 'role' }, null, 2) },
  ]

  it('renders a native text input for a text field', () => {
    const wrapper = mount(TryItFormData, { props: { data, fields } })
    const input = wrapper.findTestId('tryit-body-formfield-title-op-1')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('default title')
  })

  it('renders a Choose file button for a file field, with no file selected initially', () => {
    const wrapper = mount(TryItFormData, { props: { data, fields } })
    const button = wrapper.findTestId('tryit-body-formfield-choose-file-avatar-op-1')
    expect(button.exists()).toBe(true)
    expect(wrapper.text()).toContain('No file selected')
  })

  it('renders an EditableCodeBlock for a json field', () => {
    const wrapper = mount(TryItFormData, { props: { data, fields } })
    const codeBlocks = wrapper.findAllComponents(EditableCodeBlock)
    expect(codeBlocks).toHaveLength(1)
    expect(codeBlocks[0]?.props('code')).toBe(JSON.stringify({ role: 'role' }, null, 2))
  })

  it('emits an isMultipart RequestBody with the updated value when a text field changes', async () => {
    const wrapper = mount(TryItFormData, { props: { data, fields } })
    const input = wrapper.findTestId('tryit-body-formfield-title-op-1')
    await input.setValue('new title')

    const emitted = wrapper.emitted('request-body-changed')
    expect(emitted).toBeTruthy()
    const lastEmit = emitted![emitted!.length - 1]![0] as { isMultipart: boolean, formFields: RequestFormField[] }
    expect(lastEmit.isMultipart).toBe(true)
    expect(lastEmit.formFields.find(f => f.name === 'title')?.value).toBe('new title')
  })

  it('emits an isMultipart RequestBody with the updated value when a json field changes', async () => {
    const wrapper = mount(TryItFormData, { props: { data, fields } })
    const codeBlock = wrapper.findComponent(EditableCodeBlock)
    await codeBlock.vm.$emit('request-body-changed', '{\n  "role": "admin"\n}')

    const emitted = wrapper.emitted('request-body-changed')
    const lastEmit = emitted![emitted!.length - 1]![0] as { formFields: RequestFormField[] }
    expect(lastEmit.formFields.find(f => f.name === 'metadata')?.value).toBe('{\n  "role": "admin"\n}')
  })

  it('preserves an in-progress edit when the fields prop is re-emitted for the same operation', async () => {
    const wrapper = mount(TryItFormData, { props: { data, fields } })
    const input = wrapper.findTestId('tryit-body-formfield-title-op-1')
    await input.setValue('user typed this')

    // simulate the parent round-tripping the same operation's fields back down (e.g. from the
    // request-body-changed -> TryIt -> HttpOperation -> TryItParams round trip)
    await wrapper.setProps({ fields: [...fields] })

    expect((wrapper.findTestId('tryit-body-formfield-title-op-1').element as HTMLInputElement).value).toBe('user typed this')
  })

  it('resets all field values when the operation changes', async () => {
    const wrapper = mount(TryItFormData, { props: { data, fields } })
    const input = wrapper.findTestId('tryit-body-formfield-title-op-1')
    await input.setValue('user typed this')

    const newData = { ...data, id: 'op-2' }
    const newFields: RequestFormField[] = [
      { name: 'title', kind: 'text', required: true, value: 'fresh default' },
    ]
    await wrapper.setProps({ data: newData, fields: newFields })

    expect((wrapper.findTestId('tryit-body-formfield-title-op-2').element as HTMLInputElement).value).toBe('fresh default')
  })
})
