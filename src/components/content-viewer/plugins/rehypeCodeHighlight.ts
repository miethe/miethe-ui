/**
 * rehypeCodeHighlight — opt-in code syntax highlighting via lowlight
 *
 * Design: zero-cost default path.
 *
 * When `codeHighlight=false` (default), this module is NOT imported by ArticleViewer.
 * When `codeHighlight=true`, `createHighlightPlugin()` is called; it returns a
 * rehype plugin that highlights `pre > code` blocks using lowlight.
 *
 * Bundle strategy:
 * - `lowlight` is a small (~15KB gzip) WASM-free highlighter built on highlight.js.
 * - It is NOT listed as a hard dep — it is an optional peer dep gated on codeHighlight.
 * - We load it via dynamic `import()` in `tryLoadLowlight()`, so bundlers can split
 *   it into a lazy chunk and ESM environments have no `require()` issues.
 *   Consumers must install lowlight separately: npm install lowlight
 * - The plugin gracefully degrades to plain-text when lowlight is not available.
 *
 * Supported class convention (react-markdown / remark default):
 *   ```js              → <code class="language-js">
 *   ```typescript      → <code class="language-typescript">
 *   ``` (no lang)      → no class; rendered as plain text
 *
 * @module rehypeCodeHighlight
 */

import type { Root, Element, Text } from 'hast';
import { visit } from 'unist-util-visit';
import { getLowlightInstance } from './lowlightLoader';
import type { LowlightAPI } from './lowlightLoader';

// The lowlight loader (instance cache, dynamic import, graceful degrade) lives in
// `./lowlightLoader` so it can be imported by Client Components (ContentPane) without
// pulling `unist-util-visit` into their module graph. Re-export the shared API here so
// existing import sites (plugins/index.ts, content-viewer/index.ts) keep working.
export {
  _resetHighlightCache,
  warmHighlightCache,
  highlightCodeToHast,
} from './lowlightLoader';
export type { LowlightAPI } from './lowlightLoader';

// ---------------------------------------------------------------------------
// Language extraction
// ---------------------------------------------------------------------------

/**
 * Extract the language identifier from a code element's className.
 * react-markdown generates `language-{lang}` class names for fenced code blocks.
 * Returns null when no language class is present.
 */
function extractLanguage(node: Element): string | null {
  const classNames = (node.properties?.className ?? []) as (string | number)[];
  for (const cls of classNames) {
    if (typeof cls === 'string' && cls.startsWith('language-')) {
      return cls.slice('language-'.length);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Synchronous highlight application
// ---------------------------------------------------------------------------

/**
 * Apply lowlight highlighting to a `pre > code` element's text content.
 * Mutates the code element's children in place.
 * Returns false when lowlight is unavailable or the node has no text.
 */
function applyHighlight(codeNode: Element, language: string | null, ll: LowlightAPI): boolean {
  const textNode = codeNode.children.find((child): child is Text => child.type === 'text');
  const code = textNode?.value ?? '';
  if (!code) return false;

  try {
    const knownLangs = ll.listLanguages();
    const result =
      language && knownLangs.includes(language)
        ? ll.highlight(language, code)
        : ll.highlightAuto(code);

    // Replace children with highlighted hast nodes
    codeNode.children = result.children as Element['children'];

    // Add hljs class for theme CSS compatibility
    const existingClasses = (codeNode.properties?.className ?? []) as (string | number)[];
    codeNode.properties = {
      ...codeNode.properties,
      className: [...existingClasses, 'hljs'],
    };

    return true;
  } catch (err) {
    // Per-block failure is non-fatal — leave children as plain text
    console.warn('[ArticleViewer] Code highlighting failed for block:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------

/**
 * Create a rehype plugin that applies syntax highlighting to `pre > code` blocks.
 *
 * Returns a function compatible with ReactMarkdown's `rehypePlugins` array.
 *
 * The plugin loads lowlight on first call. If lowlight is not installed,
 * code blocks degrade gracefully to unstyled monospace text.
 *
 * @example
 * ```tsx
 * import { createHighlightPlugin } from '@miethe/ui/content-viewer';
 * // Then pass codeHighlight={true} to ArticleViewer — it handles this internally.
 * <ArticleViewer content={markdown} codeHighlight />
 * ```
 */
export function createHighlightPlugin(): () => (tree: Root) => void {
  return function rehypeCodeHighlightPlugin() {
    return function transformer(tree: Root): void {
      // Read from the already-populated cache (synchronous).
      // Call warmHighlightCache() at startup to pre-populate before first render.
      const ll = getLowlightInstance();

      // Lowlight unavailable — silently degrade to plain text
      if (!ll) return;

      visit(tree, 'element', (node: Element, _index, parent) => {
        if (
          node.tagName !== 'code' ||
          !parent ||
          (parent as Element).tagName !== 'pre'
        ) {
          return;
        }
        const lang = extractLanguage(node);
        applyHighlight(node, lang, ll);
      });
    };
  };
}
