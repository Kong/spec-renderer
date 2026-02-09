import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import DownloadSpecDropdown from './DownloadSpecDropdown.vue'
import composables from '@/composables'

describe('<DownloadSpecDropdown />', () => {
  const mockDownloadSpecFile = vi.fn()

  beforeEach(() => {
    mockDownloadSpecFile.mockClear()
    vi.spyOn(composables, 'useSchemaParser').mockImplementation(() => ({
      parseSpecDocument: vi.fn(),
      parseOpenApiSpecDocument: vi.fn(),
      parseAsyncApiSpecDocument: vi.fn(),
      downloadSpecFile: mockDownloadSpecFile,
      parsedDocument: ref(undefined),
      tableOfContents: ref(undefined),
    }))
  })

  describe('rendering', () => {
    it('renders the download button with text "Download"', () => {
      const wrapper = mount(DownloadSpecDropdown, {
        attachTo: document.body,
      })

      const btn = wrapper.findTestId('download-spec-btn')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toBe('Download')
    })

    it('renders the format dropdown', () => {
      const wrapper = mount(DownloadSpecDropdown, {
        attachTo: document.body,
      })

      expect(wrapper.findTestId('download-format-dropdown').exists()).toBe(true)
    })

    it('renders JSON and YAML options when dropdown is opened', async () => {
      const wrapper = mount(DownloadSpecDropdown, {
        attachTo: document.body,
      })

      await wrapper.findTestId('trigger-button').trigger('click')

      const jsonBtn = wrapper.findTestId('download-json-btn')
      const yamlBtn = wrapper.findTestId('download-yaml-btn')

      expect(jsonBtn.exists()).toBe(true)
      expect(jsonBtn.text()).toBe('JSON')
      expect(yamlBtn.exists()).toBe(true)
      expect(yamlBtn.text()).toBe('YAML')
    })
  })

  describe('interactions', () => {
    it('calls downloadSpecFile with "json" when Download button is clicked', async () => {
      const wrapper = mount(DownloadSpecDropdown, {
        attachTo: document.body,
      })

      await wrapper.findTestId('download-spec-btn').trigger('click')

      expect(mockDownloadSpecFile).toHaveBeenCalledOnce()
      expect(mockDownloadSpecFile).toHaveBeenCalledWith('json')
    })

    it('calls downloadSpecFile with "json" when JSON option is clicked', async () => {
      const wrapper = mount(DownloadSpecDropdown, {
        attachTo: document.body,
      })

      await wrapper.findTestId('trigger-button').trigger('click')
      await wrapper.findTestId('download-json-btn').trigger('click')

      expect(mockDownloadSpecFile).toHaveBeenCalledWith('json')
    })

    it('calls downloadSpecFile with "yaml" when YAML option is clicked', async () => {
      const wrapper = mount(DownloadSpecDropdown, {
        attachTo: document.body,
      })

      await wrapper.findTestId('trigger-button').trigger('click')
      await wrapper.findTestId('download-yaml-btn').trigger('click')

      expect(mockDownloadSpecFile).toHaveBeenCalledWith('yaml')
    })

    it('remembers selected format when Download button is clicked after dropdown selection', async () => {
      const wrapper = mount(DownloadSpecDropdown, {
        attachTo: document.body,
      })

      // Select YAML from dropdown
      await wrapper.findTestId('trigger-button').trigger('click')
      await wrapper.findTestId('download-yaml-btn').trigger('click')

      expect(mockDownloadSpecFile).toHaveBeenCalledWith('yaml')
      mockDownloadSpecFile.mockClear()

      // Click Download button, it should use remembered 'yaml' format
      await wrapper.findTestId('download-spec-btn').trigger('click')

      expect(mockDownloadSpecFile).toHaveBeenCalledWith('yaml')
    })
  })
})
