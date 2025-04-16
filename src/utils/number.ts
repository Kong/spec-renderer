export const convertToNumber = (value: string | number) => {
  if (typeof value === 'number') {
    return value
  }

  return Number.parseInt(value)
}

export const NUMBER_VALIDATOR = (value: string | number): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value) // Handle Infinity and NaN
  }

  if (typeof value === 'string') {
    const num = Number.parseInt(value)
    return !Number.isNaN(num) && Number.isFinite(num)
  }

  return false // Not a string or number
}
