import { describe, it, expect } from 'vitest'
import { stringifyUnknownValue } from './strings'

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
