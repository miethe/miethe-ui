/**
 * GitHub-compatible heading slug utility.
 *
 * Exported separately from rehypeHeadingIds so consumers can:
 * 1. Import slugify without pulling in the full hast/unist dependency graph.
 * 2. Test the slug algorithm in Jest without ESM transformation issues.
 *
 * Algorithm:
 * - Lowercase the text
 * - Remove characters that are not word chars ([\w]), hyphens, or spaces
 * - Replace whitespace runs with a single hyphen
 * - Collapse multiple consecutive hyphens
 * - Strip leading and trailing hyphens
 */

/**
 * Produce a GitHub-compatible URL slug from a heading text string.
 *
 * @example
 * slugify('Hello World')       // → 'hello-world'
 * slugify('API Reference')     // → 'api-reference'
 * slugify('What is @miethe?')  // → 'what-is-miethe'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // remove non-word, non-space, non-hyphen chars
    .replace(/[\s]+/g, '-')      // spaces → hyphens
    .replace(/-{2,}/g, '-')      // collapse multiple consecutive hyphens
    .replace(/^-+|-+$/g, '');    // strip leading/trailing hyphens
}
