import { describe, it, expect } from 'vitest'
import { slugify } from './slugify' // Adjust the import path as necessary

describe('slugify', () => {
  it('should convert string to lowercase', () => {
    expect(slugify('Hello')).toBe('hello')
  })

  it('should remove special characters', () => {
    expect(slugify('Hello@World!')).toBe('helloworld')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('should handle multiple spaces', () => {
    expect(slugify('Hello   World')).toBe('hello-world')
  })

  it('should handle leading and trailing spaces', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world')
  })

  it('should handle mixed cases and special characters', () => {
    expect(slugify('HeLLo-WorLD!!!')).toBe('hello-world')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('should handle string with only special characters', () => {
    expect(slugify('!@#$%^&*()')).toBe('')
  })

  it('should handle string with numbers', () => {
    expect(slugify('Hello 123 World')).toBe('hello-123-world')
  })

  it('should handle string with only numbers', () => {
    expect(slugify('1234567890')).toBe('1234567890')
  })

  it('should handle undefined value', () => {
    expect(slugify(undefined!)).toBe('')
  })
})
