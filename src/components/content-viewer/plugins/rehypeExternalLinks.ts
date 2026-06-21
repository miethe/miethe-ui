/**
 * rehypeExternalLinks — shared rehype plugin for external link hardening (PU3-04)
 *
 * Adds `target="_blank"` and `rel="noopener noreferrer"` to every `<a>` element
 * whose `href` is an absolute URL with an http, https, or mailto scheme.
 *
 * This plugin is intentionally written as a pure unified/rehype tree visitor so
 * it works on both the markdown pipeline (via ReactMarkdown's `rehypePlugins`)
 * and the HTML pipeline (unified + rehypeParse + this plugin + rehype-sanitize
 * + rehypeStringify). A single implementation avoids per-component duplication.
 *
 * Scheme detection uses a strict allowlist: `http:`, `https:`, `mailto:`.
 * Protocol-relative URLs (`//example.com`) are also treated as external.
 *
 * Note: The markdown path also uses the `components.a` override in
 * `buildComponentMap()` for link hardening because ReactMarkdown does not
 * thread rehype node attributes through to rendered anchors. The `components.a`
 * override is kept for the markdown path; this plugin is the canonical
 * implementation used for the HTML path and can be tested in isolation.
 */

import type { Plugin, Transformer } from 'unified';
import { visit } from 'unist-util-visit';

// ---------------------------------------------------------------------------
// Minimal hast node types (avoids a direct dep on the deprecated `hast` shim)
// ---------------------------------------------------------------------------

interface HastProperties {
  [key: string]: unknown;
}

interface HastElement {
  type: 'element';
  tagName: string;
  properties?: HastProperties;
  children: HastNode[];
}

interface HastRoot {
  type: 'root';
  children: HastNode[];
}

type HastNode = HastElement | HastRoot | { type: string };

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// Schemes treated as "external" — anything else (relative, #anchor, data:, etc.)
// is left unmodified.
const EXTERNAL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/**
 * Returns true if `href` should be treated as an external link.
 * Protocol-relative URLs (starting with `//`) are also considered external.
 */
export function isExternalHref(href: string): boolean {
  if (href.startsWith('//')) return true;
  try {
    const url = new URL(href);
    return EXTERNAL_SCHEMES.has(url.protocol);
  } catch {
    // Not an absolute URL — treat as relative/internal
    return false;
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * Unified/rehype plugin that adds `target="_blank"` and
 * `rel="noopener noreferrer"` to external `<a>` elements.
 *
 * Usage (HTML pipeline):
 * ```ts
 * unified()
 *   .use(rehypeParse, { fragment: true })
 *   .use(rehypeExternalLinks)
 *   .use(rehypeSanitize)   // sanitize AFTER link attrs are set (allowlist includes rel/target)
 *   .use(rehypeStringify)
 *   .process(htmlString);
 * ```
 */
export const rehypeExternalLinks: Plugin<[], HastRoot> = (): Transformer<HastRoot> => {
  return (tree: HastRoot) => {
    visit(tree as Parameters<typeof visit>[0], 'element', (node: HastNode) => {
      const el = node as HastElement;
      if (el.tagName !== 'a') return;

      const href = el.properties?.['href'];
      if (typeof href !== 'string') return;

      if (isExternalHref(href)) {
        el.properties = el.properties ?? {};
        el.properties['target'] = '_blank';
        el.properties['rel'] = 'noopener noreferrer';
      }
    });
  };
};

export default rehypeExternalLinks;
