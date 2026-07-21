import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TryItResponse from './TryItResponse.vue'
import CodeBlock from '@/components/common/CodeBlock.vue'

/**
 * Builds a minimal fake `Response` exposing only what TryItResponse consumes.
 */
const makeResponse = (opts: {
  headers?: Record<string, string>
  status?: number
  ok?: boolean
  json?: () => Promise<unknown>
  text?: () => Promise<string>
  blob?: () => Promise<Blob>
}) => {
  const headers = new Map(
    Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
  )
  return {
    status: opts.status ?? 200,
    ok: opts.ok ?? true,
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
      entries: () => headers.entries(),
    },
    json: opts.json ?? vi.fn(),
    text: opts.text ?? vi.fn(),
    blob: opts.blob ?? vi.fn(),
  } as unknown as Response
}

const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()

describe('<TryItResponse />', () => {
  beforeEach(() => {
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
    window.URL.createObjectURL = mockCreateObjectURL
    window.URL.revokeObjectURL = mockRevokeObjectURL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a JSON response as a code block', async () => {
    const response = makeResponse({
      headers: { 'content-type': 'application/json' },
      json: () => Promise.resolve({ hello: 'world' }),
    })
    const wrapper = mount(TryItResponse, {
      props: { dataId: 'op1', response },
    })
    await flushPromises()

    expect(wrapper.findTestId('tryit-response-binary-op1').exists()).toBe(false)
    // CodeBlock highlights asynchronously via Shiki, so assert on the code prop rather than rendered text
    const codeBlock = wrapper.findComponent(CodeBlock)
    expect(codeBlock.exists()).toBe(true)
    expect(codeBlock.props('code')).toContain('hello')
  })

  it('renders a download card for a binary response and does not decode it as text', async () => {
    const text = vi.fn()
    const response = makeResponse({
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="report.pdf"',
      },
      text,
      // size is derived from blob.size, so pad it to 2048 bytes
      blob: () => Promise.resolve(new Blob([new Uint8Array(2048)], { type: 'application/pdf' })),
    })
    const wrapper = mount(TryItResponse, {
      props: { dataId: 'op2', response },
    })
    await flushPromises()

    const card = wrapper.findTestId('tryit-response-binary-op2')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('report.pdf')
    expect(card.text()).toContain('2 KB')

    const link = wrapper.findTestId('tryit-response-download-op2')
    expect(link.exists()).toBe(true)
    expect(link.attributes('download')).toBe('report.pdf')
    expect(link.attributes('href')).toBe('blob:mock-url')

    // binary bytes must never be run through res.text()
    expect(text).not.toHaveBeenCalled()
  })

  it('synthesizes a filename from the content type when no Content-Disposition is present', async () => {
    const response = makeResponse({
      headers: { 'content-type': 'application/octet-stream' },
      blob: () => Promise.resolve(new Blob(['abc'], { type: 'application/octet-stream' })),
    })
    const wrapper = mount(TryItResponse, {
      props: { dataId: 'op3', response },
    })
    await flushPromises()

    const link = wrapper.findTestId('tryit-response-download-op3')
    expect(link.attributes('download')).toBe('op3.bin')
  })

  it('renders an image response via an object URL', async () => {
    const response = makeResponse({
      headers: { 'content-type': 'image/png' },
      blob: () => Promise.resolve(new Blob(['img'], { type: 'image/png' })),
    })
    const wrapper = mount(TryItResponse, {
      props: { dataId: 'op4', response },
    })
    await flushPromises()

    expect(mockCreateObjectURL).toHaveBeenCalled()
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('blob:mock-url')
  })

  it('revokes the object URL when the response is cleared', async () => {
    const response = makeResponse({
      headers: { 'content-type': 'application/octet-stream' },
      blob: () => Promise.resolve(new Blob(['abc'], { type: 'application/octet-stream' })),
    })
    const wrapper = mount(TryItResponse, {
      props: { dataId: 'op5', response },
    })
    await flushPromises()
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ response: undefined })
    await flushPromises()

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
