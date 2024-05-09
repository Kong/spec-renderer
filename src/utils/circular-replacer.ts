export const getCircularReplacer = () => {
  // form a closure and use this
  // weakset to monitor object reference.
  const seen = new WeakSet()

  // return the replacer function
  return (key: any, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}
