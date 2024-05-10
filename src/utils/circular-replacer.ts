export const getCircularReplacer = (): (key: string, value: any) => Record<string, any> | undefined => {
  // form a closure and use this
  // weakset to monitor object reference.
  const seen = new WeakSet()

  // return the replacer function
  return (key: string, value: any): Record<string, any>|undefined => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}
