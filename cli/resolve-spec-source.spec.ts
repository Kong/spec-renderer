import { describe, expect, it } from 'vitest'
import { resolveSpecSource } from './resolve-spec-source.js'

describe('resolveSpecSource', () => {
  it('classifies an http URL as a url source', () => {
    expect(resolveSpecSource('http://localhost:3000/spec.json')).toEqual({
      kind: 'url',
      value: 'http://localhost:3000/spec.json',
    })
  })

  it('classifies an https URL as a url source', () => {
    expect(resolveSpecSource('https://example.com/openapi.yaml')).toEqual({
      kind: 'url',
      value: 'https://example.com/openapi.yaml',
    })
  })

  it('classifies a relative file path as a file source', () => {
    expect(resolveSpecSource('./specs/openapi.yaml')).toEqual({
      kind: 'file',
      value: './specs/openapi.yaml',
    })
  })

  it('classifies an absolute file path as a file source', () => {
    expect(resolveSpecSource('/Users/adam/openapi.yaml')).toEqual({
      kind: 'file',
      value: '/Users/adam/openapi.yaml',
    })
  })

  it('classifies a bare filename as a file source', () => {
    expect(resolveSpecSource('openapi.yaml')).toEqual({
      kind: 'file',
      value: 'openapi.yaml',
    })
  })

  it('classifies a non-http(s) protocol as a file source', () => {
    expect(resolveSpecSource('ftp://example.com/spec.yaml')).toEqual({
      kind: 'file',
      value: 'ftp://example.com/spec.yaml',
    })
  })
})
