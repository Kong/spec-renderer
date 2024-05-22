import { describe, it, expect } from 'vitest'
import { removeCircularReferences } from './circular-remover'
import test from 'node:test'

describe('circular-remover', () => {
  it('should detect no circular references in object', () => {

    const childObj = { c1: 10, c2: 20 }

    const testObj = {
      a: 1,
      b: null,
      c: new Date(),
      d: childObj,
      e: /a/,
      f: { child: childObj },
    }
    const resObj = removeCircularReferences(testObj)
    expect(resObj).toEqual(testObj)
  })

  it('should detect circular references in object', () => {

    const childObj = { c1: 10, c2: 20, c3: {} }

    const testObj = {
      a: { b: childObj },
    }
    testObj.a.b.c3 = { z: childObj }
    // console.log(JSON.stringify(testObj, null, 2))
    const resObj = removeCircularReferences(testObj)
    expect(resObj).toEqual({ a: { b: { c1: 10, c2: 20, c3: {} } } })
  })

})
