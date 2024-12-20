import { describe, it, expect } from 'vitest'
import { stringifyUnknownValue, kebabCase } from './strings'

describe('stringifiedExample', () => {
  it('should return stringified object', () => {
    const example = {
      name: 'sample example',
      description: 'sample description',
    }
    expect(stringifyUnknownValue(example)).toEqual('{"name":"sample example","description":"sample description"}')
  })
  it('should return stringified array', () => {
    const example = ['sample example', 'another example', { name: 'sample example' }]
    expect(stringifyUnknownValue(example)).toEqual('sample example, another example, {"name":"sample example"}')
  })
  it('should return simple string unchanged', () => {
    const example = 'sample example string'
    expect(stringifyUnknownValue(example)).toEqual(example)
  })
})

describe('kebabCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(kebabCase('camelCase')).toBe('camel-case')
  })

  it('should convert PascalCase to kebab-case', () => {
    expect(kebabCase('PascalCase')).toBe('pascal-case')
  })

  it('should convert snake_case to kebab-case', () => {
    expect(kebabCase('snake_case')).toBe('snake-case')
  })

  it('should convert spaces to kebab-case', () => {
    expect(kebabCase('space separated')).toBe('space-separated')
  })

  it('should convert underscores to kebab-case', () => {
    expect(kebabCase('underscore_separated')).toBe('underscore-separated')
  })

  it('should handle mixed cases and special characters', () => {
    expect(kebabCase('HeLLo-WorLD')).toBe('he-llo-wor-ld')
  })

  it('should handle empty string', () => {
    expect(kebabCase('')).toBe('')
  })
})
