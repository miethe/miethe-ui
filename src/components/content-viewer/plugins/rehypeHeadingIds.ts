/**
 * rehypeHeadingIds — auto-generate `id` attributes on heading elements.
 *
 * Implements OQ-UCV-D / A-UCV-08 (generateHeadingIds prop, default true).
 *
 * Algorithm:
 * 1. Walk the hast tree for h1–h6 elements.
 * 2. Extract plain text content by recursively collecting Text node values.
 * 3. Slugify the text using a GitHub-compatible slug algorithm:
 *    - Lowercase
 *    - Replace non-alphanumeric (non-space) chars with nothing
 *    - Replace spaces with hyphens
 *    - Strip leading/trailing hyphens
 * 4. Deduplicate: if the slug already exists, append `-1`, `-2`, … until unique.
 * 5. Set `id` on the element (skipping elements that already have an `id`).
 *
 * The deduplication counter is per-document (plugin instance). Each page render
 * creates a fresh plugin instance via `createHeadingIdsPlugin()`.
 *
 * @module rehypeHeadingIds
 */

import type { Root, Element, Text, RootContent, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';
import { slugify } from './slugify';

export { slugify } from './slugify';

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Extract plain text from a hast node by recursively collecting text nodes.
 */
function extractText(nodes: ReadonlyArray<RootContent | ElementContent>): string {
  let text = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      text += (node as Text).value;
    } else if ('children' in node && Array.isArray(node.children)) {
      text += extractText(node.children as ReadonlyArray<ElementContent>);
    }
  }
  return text;
}

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------

/**
 * Create a rehype plugin that adds `id` attributes to h1–h6 elements.
 *
 * A fresh plugin instance (and thus a fresh deduplication map) must be created
 * for each render to avoid cross-render contamination.
 *
 * @example
 * ```ts
 * const headingIdsPlugin = createHeadingIdsPlugin();
 * // pass to ReactMarkdown rehypePlugins
 * ```
 */
export function createHeadingIdsPlugin(): () => (tree: Root) => void {
  return function rehypeHeadingIdsPlugin() {
    return function transformer(tree: Root): void {
      const seen = new Map<string, number>();

      visit(tree, 'element', (node: Element) => {
        if (!HEADING_TAGS.has(node.tagName)) return;

        // Skip elements that already have an id
        if (node.properties?.id) return;

        const rawText = extractText(node.children as ReadonlyArray<ElementContent>);
        const base = slugify(rawText);
        if (!base) return;

        // Deduplicate
        const count = seen.get(base) ?? 0;
        const id = count === 0 ? base : `${base}-${count}`;
        seen.set(base, count + 1);

        node.properties = { ...node.properties, id };
      });
    };
  };
}
