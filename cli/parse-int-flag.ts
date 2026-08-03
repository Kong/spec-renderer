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
    const parsed = Number.parseInt(value, 10)

    if (Number.isNaN(parsed) || parsed < 0 || (options.max !== undefined && parsed > options.max)) {
      const bound = options.max === undefined ? '' : ` up to ${options.max}`

      throw new InvalidArgumentError(`${flagName} must be a non-negative integer${bound}.`)
    }

    return parsed
  }
}
