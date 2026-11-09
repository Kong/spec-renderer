import { describe, expect, it } from 'vitest'
import { transformOasToServiceNode } from './index'
import { SpecVersion } from './types'

const oasDocument = (openapi: string) => ({
  openapi,
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
})

describe('transformOasToServiceNode', () => {
  it('tags a 3.0 document as OAS3', () => {
    const node = transformOasToServiceNode(oasDocument('3.0.3'))

    expect(node?.specVersion).toBe(SpecVersion.OAS3)
  })

  it('tags a 3.1 document as OAS31', () => {
    const node = transformOasToServiceNode(oasDocument('3.1.0'))

    expect(node?.specVersion).toBe(SpecVersion.OAS31)
  })

  it('tags a 3.2 document as OAS32 instead of falling through to OAS3', () => {
    const node = transformOasToServiceNode(oasDocument('3.2.0'))

    expect(node?.specVersion).toBe(SpecVersion.OAS32)
  })

  it('tags a 2.0 document as OAS2', () => {
    const node = transformOasToServiceNode({
      swagger: '2.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    })

    expect(node?.specVersion).toBe(SpecVersion.OAS2)
  })
})
