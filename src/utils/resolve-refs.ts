import { resolveInlineRef, isLocalRef } from '@stoplight/json'

export const resolveRefs = (fragment: Record<string, any>, specJson: Record<string, any>) => {
  Object.keys(fragment).forEach(key => {

    if (typeof fragment[key] === 'object' && fragment[key] !== null) {
      fragment[key] = resolveRefs(fragment[key], specJson)
    } else if (fragment[key] && isLocalRef(fragment[key])) {
      const res = resolveInlineRef(specJson, fragment[key])
      delete fragment[key]
      fragment = { ...fragment, ...<Record<string, any>>res }
    }
  })
  return fragment
}
