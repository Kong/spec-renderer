/**
 * @description Converts a string to a slug.
 * Example: "Hello, World!" -> "hello-world"
 * @param input
 * @returns {string}
 */
export function slugify(input: string): string {
  if (!input) {
    return ''
  }

  return input
    .toLowerCase() // Convert to lowercase
    .trim() // Remove any leading or trailing whitespace
    .replace(/[^a-z0-9\s-]/g, '') // Remove characters other than [a-z], [0-9], spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
}
