import { InvalidArgumentError } from 'commander'

export interface ParseIntFlagOptions {
  /** Upper bound (inclusive). No upper bound is enforced when omitted. */
  max?: number
}

/**
 * Builds a commander option parser for a non-negative integer flag.
 *
 * Throws a commander `InvalidArgumentError` for non-numeric or out-of-range
 * input, which commander turns into a clean CLI error - rather than letting
 * `Number.parseInt` silently produce `NaN` (which `??` does not treat as
 * nullish, and which `JSON.stringify` silently serializes to `null`).
 */
export function parseIntFlag(flagName: string, options: ParseIntFlagOptions = {}): (value: string) => number {
  return (value: string): number => {
    // `Number.parseInt` stops at the first non-digit rather than requiring
    // the whole string to be numeric (e.g. `parseInt('5000abc', 10) === 5000`,
    // `parseInt('2.9', 10) === 2`) - reject anything that isn't purely
    // digits up front so trailing garbage or a decimal point can't silently
    // produce a value the user never typed.
    if (!/^\d+$/.test(value.trim())) {
      const bound = options.max === undefined ? '' : ` up to ${options.max}`

      throw new InvalidArgumentError(`${flagName} must be a non-negative integer${bound}.`)
    }

    const parsed = Number.parseInt(value, 10)

    if (options.max !== undefined && parsed > options.max) {
      throw new InvalidArgumentError(`${flagName} must be a non-negative integer up to ${options.max}.`)
    }

    return parsed
  }
}
