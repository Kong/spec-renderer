import { InvalidArgumentError } from 'commander'
import { describe, expect, it } from 'vitest'
import { parseIntFlag } from './parse-int-flag.js'

describe('parseIntFlag', () => {
  it('parses a valid non-negative integer string', () => {
    expect(parseIntFlag('--port')('5000')).toBe(5000)
  })

  it('parses zero', () => {
    expect(parseIntFlag('--port')('0')).toBe(0)
  })

  it('throws an InvalidArgumentError for non-numeric input', () => {
    expect(() => parseIntFlag('--port')('abc')).toThrow(InvalidArgumentError)
  })

  it('throws for a negative number', () => {
    expect(() => parseIntFlag('--port')('-1')).toThrow(InvalidArgumentError)
  })

  it('includes the flag name in the error message', () => {
    expect(() => parseIntFlag('--max-expanded-depth')('abc')).toThrow(/--max-expanded-depth/)
  })

  it('enforces an optional max bound', () => {
    expect(() => parseIntFlag('--port', { max: 65535 })('70000')).toThrow(InvalidArgumentError)
    expect(parseIntFlag('--port', { max: 65535 })('65535')).toBe(65535)
  })

  it('has no max bound by default', () => {
    expect(parseIntFlag('--max-expanded-depth')('999999')).toBe(999999)
  })

  it('throws rather than truncating trailing non-digit characters', () => {
    expect(() => parseIntFlag('--port')('5000abc')).toThrow(InvalidArgumentError)
  })

  it('throws rather than truncating a decimal value', () => {
    expect(() => parseIntFlag('--max-expanded-depth')('2.9')).toThrow(InvalidArgumentError)
  })
})
