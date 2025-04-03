/**
 * Removes trailing slash from a string
 * @param {string} str
 * @returns string without trailing slash
 */
export function removeTrailingSlash(str: string) {
  return str.replace(/\/$/, '')
}

export const stringifyUnknownValue = (candidate: unknown) => {
  let stringToRender = ''
  if (Array.isArray(candidate)) {
    // can't do a simple Array.toString because items of type Object are
    // converted to [Object Object], hence we need to stringify object items
    candidate.forEach((example, index) => {
      stringToRender +=
        typeof(example) === 'object' ? JSON.stringify(example) : example +
        `${index < candidate.length - 1 ? ', ' : ''}`
    })
  } else if (typeof candidate === 'object') {
    stringToRender = JSON.stringify(candidate)
  }
  return stringToRender || candidate
}

export const safeJSONParse = (candidate: unknown) => {
  try {
    return typeof candidate === 'string' ? JSON.parse(candidate) : candidate
  } catch {
    return candidate
  }
}

export const kebabCase = (candidate: string) => {
  return candidate
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Add hyphen before uppercase letters: myVar -> my-Var
    .replace(/[\s_/]+/g, '-') // Replace spaces, underscores, slashes with hyphens
    .toLowerCase() // Convert to lowercase: my-Var -> my-var
}
