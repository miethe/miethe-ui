/**
 * HTML sanitization for ArticleViewer — PU3-02 / PU3-03
 *
 * Two sanitization paths, selected via the `useDOMPurify` prop:
 *
 * 1. **Default (rehype-sanitize)** — unified pipeline:
 *    `rehypeParse → rehypeExternalLinks → rehypeSanitize(schema) → rehypeStringify`
 *    Uses GitHub's default allowlist (`defaultSchema`) with minor additions for
 *    callout div wrappers (class attr) and standard data attributes.
 *
 * 2. **Optional (DOMPurify)** — dynamically imports `isomorphic-dompurify`.
 *    `isomorphic-dompurify` is NOT a hard dependency; it must be installed by the
 *    consumer. If unavailable, falls back to path 1 with a console warning.
 *
 * Both paths:
 * - Strip `<script>`, event handler attributes (`on*`), `javascript:` and unsafe
 *   `data:` URLs, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<base>`.
 * - Preserve safe HTML: headings, paragraphs, lists, blockquotes, tables,
 *   `<code>`, `<pre>`, `<a>` (http/https/mailto href), `<img>` (http/https src),
 *   `<div>`, `<span>` (with class), `<strong>`, `<em>`, `<del>`, `<details>`,
 *   `<summary>`, `<figure>`, `<figcaption>`, `<hr>`, `<br>`.
 * - Apply external link hardening (`target="_blank" rel="noopener noreferrer"`).
 *
 * ## Custom schema rationale
 *
 * `rehype-sanitize`'s `defaultSchema` (mirroring GitHub's allowlist) is strict
 * enough for most use cases. We extend it to allow:
 * - `class` on `div` and `span` — callout wrappers use `data-callout-type` and
 *   Tailwind utility classes.
 * - `data-callout-type` on `div` — semantic attribute written by the remark
 *   callout plugin.
 * - `id` on headings — anchor links in compiled wiki documents.
 * - `rel` and `target` on `a` — preserved after the external-link plugin sets
 *   them (rehype-sanitize would otherwise strip `target`).
 *
 * ## Allowlist vs blocklist
 *
 * We use an **allowlist** (default-deny) approach — only explicitly listed tags
 * and attributes pass through. This is safer than blocklist-based sanitization
 * which requires enumerating every possible XSS vector.
 */

import { unified } from 'unified';
import type { Processor } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Options as SanitizeSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

// PropertyDefinition mirrors the hast-util-sanitize type (transitive dep — not directly importable).
type PropertyDefinition = [string, ...Array<string | RegExp>] | string;

import { rehypeExternalLinks } from './plugins/rehypeExternalLinks';

/**
 * Cast `unified` to a simple callable so TypeScript doesn't balk at the
 * complex overloaded union on `Processor.use()`. The actual runtime behaviour
 * is identical — we just widen the type to avoid TS2349.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeProcessor = unified as unknown as () => Processor<any, any, any, any, any>;

// Convenience alias for casting externally-typed plugins into any-ified Processor.use().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPlugin = Parameters<ReturnType<typeof makeProcessor>['use']>[0];

// ---------------------------------------------------------------------------
// Custom schema — extends GitHub's defaultSchema for Portal HTML
// ---------------------------------------------------------------------------

/**
 * Extended sanitization schema for Portal-compiled HTML.
 *
 * Extends `defaultSchema` (GitHub's allowlist) to preserve:
 * - `class` on `div`, `span` — callout wrappers + utility classes
 * - `data-callout-type` on `div` — semantic callout attribute
 * - `id` on `h1`–`h6` — anchor link targets in wiki documents
 * - `target` on `a` — set by the external-link plugin (`_blank`)
 * - `rel` on `a` — set by the external-link plugin (`noopener noreferrer`)
 */
const defaultAttrs = (defaultSchema.attributes ?? {}) as Record<string, Array<PropertyDefinition>>;

export const ARTICLE_VIEWER_SCHEMA: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultAttrs,
    // Allow class on div/span for callout wrappers and Tailwind utilities
    div: [...(defaultAttrs['div'] ?? []), 'className', 'class', 'data-callout-type'],
    span: [...(defaultAttrs['span'] ?? []), 'className', 'class'],
    // Allow id on headings for anchor links
    h1: [...(defaultAttrs['h1'] ?? []), 'id'],
    h2: [...(defaultAttrs['h2'] ?? []), 'id'],
    h3: [...(defaultAttrs['h3'] ?? []), 'id'],
    h4: [...(defaultAttrs['h4'] ?? []), 'id'],
    h5: [...(defaultAttrs['h5'] ?? []), 'id'],
    h6: [...(defaultAttrs['h6'] ?? []), 'id'],
    // Preserve target and rel set by rehypeExternalLinks (before sanitize runs)
    a: [...(defaultAttrs['a'] ?? []), 'target', 'rel'],
  },
};

// ---------------------------------------------------------------------------
// DOMPurify config (for the optional path)
// ---------------------------------------------------------------------------

/**
 * DOMPurify config that mirrors our rehype-sanitize allowlist:
 * - Permit safe tags only
 * - Strip event handlers and javascript: / data: URLs
 * - Preserve class, id, data-callout-type, target, rel
 */
const DOMPURIFY_CONFIG = {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'a', 'img',
    'strong', 'em', 'del', 's', 'u', 'sup', 'sub',
    'div', 'span', 'section', 'article', 'aside',
    'details', 'summary',
    'figure', 'figcaption',
    'dl', 'dt', 'dd',
    'input', // task list checkboxes (type=checkbox, disabled)
  ],
  ALLOWED_ATTR: [
    'class', 'id', 'data-callout-type',
    'href', 'src', 'alt', 'title',
    'target', 'rel',
    'type', 'checked', 'disabled', // for task list checkboxes
    'colspan', 'rowspan', 'align',
    'width', 'height',
    'lang', 'dir',
  ],
  FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'form', 'base', 'meta', 'link'],
  FORBID_ATTR: [] as string[],
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: false,
};

// ---------------------------------------------------------------------------
// rehype-sanitize pipeline (default path) — PU3-02
// ---------------------------------------------------------------------------

/**
 * Build a unified processor for HTML sanitization.
 *
 * Pipeline:
 * 1. `rehypeParse` — parse HTML fragment to hast
 * 2. `rehypeExternalLinks` — add target/rel to external links
 * 3. `rehypeSanitize(ARTICLE_VIEWER_SCHEMA)` — strip XSS vectors
 * 4. `rehypeStringify` — serialize back to HTML string
 *
 * We build fresh processors rather than sharing one instance to avoid vfile
 * state leaking between calls (rehype-parse attaches vfile metadata).
 */
function buildSanitizeProcessor() {
  return makeProcessor()
    .use(rehypeParse, { fragment: true })
    .use(rehypeExternalLinks as AnyPlugin)
    .use(rehypeSanitize, ARTICLE_VIEWER_SCHEMA)
    .use(rehypeStringify);
}

/**
 * Sanitize an HTML string using `rehype-sanitize@6`.
 *
 * Pipeline: rehypeParse → rehypeExternalLinks → rehypeSanitize → rehypeStringify
 */
export function sanitizeWithRehype(html: string): string {
  const processor = buildSanitizeProcessor();
  return processor.processSync(html).toString();
}

// ---------------------------------------------------------------------------
// DOMPurify optional path — PU3-03
// ---------------------------------------------------------------------------

/** Cache the dynamic import result so we only attempt it once per session */
let domPurifyModule: { sanitize(html: string, config?: Record<string, unknown>): string } | null = null;
let domPurifyLoadAttempted = false;

/**
 * Attempt to load `isomorphic-dompurify` dynamically.
 * Returns the module if available; `null` if not installed.
 */
async function tryLoadDOMPurify(): Promise<typeof domPurifyModule> {
  if (domPurifyLoadAttempted) return domPurifyModule;
  domPurifyLoadAttempted = true;

  try {
    // Dynamic import — isomorphic-dompurify is an optional peer dep with no bundled types.
    // @ts-expect-error — optional package; not in node_modules at build time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import(/* webpackIgnore: true */ 'isomorphic-dompurify') as any;
    const dp = mod.default ?? mod;
    if (typeof dp?.sanitize === 'function') {
      domPurifyModule = dp as typeof domPurifyModule;
    } else {
      console.warn('[ArticleViewer] isomorphic-dompurify loaded but has unexpected shape; falling back to rehype-sanitize');
    }
  } catch {
    // Package not installed — expected; fallback handled at call site
    domPurifyModule = null;
  }

  return domPurifyModule;
}

/**
 * Sanitize an HTML string, preferring DOMPurify if available (async).
 *
 * On first call it may do a dynamic import; subsequent calls use the cache.
 * If DOMPurify is unavailable, falls back to `sanitizeWithRehype`.
 */
export async function sanitizeWithDOMPurify(html: string): Promise<string> {
  const dp = await tryLoadDOMPurify();

  if (!dp) {
    console.warn(
      '[ArticleViewer] useDOMPurify=true requested but isomorphic-dompurify is not installed. ' +
      'Falling back to rehype-sanitize. ' +
      'Install isomorphic-dompurify to use the DOMPurify path: npm install isomorphic-dompurify'
    );
    return sanitizeWithRehype(html);
  }

  // Apply external link hardening before handing to DOMPurify
  const withLinks = makeProcessor()
    .use(rehypeParse, { fragment: true })
    .use(rehypeExternalLinks as AnyPlugin)
    .use(rehypeStringify)
    .processSync(html);

  return dp.sanitize(withLinks.toString(), DOMPURIFY_CONFIG as unknown as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Synchronous sanitize dispatcher — used by the component render path
// ---------------------------------------------------------------------------

/**
 * Synchronously sanitize `html`.
 *
 * When `useDOMPurify=true` and DOMPurify has already been loaded (warm cache),
 * uses DOMPurify. If the cache is cold (first render), falls back to
 * rehype-sanitize synchronously and triggers the async load in the background
 * so subsequent renders can use DOMPurify.
 */
export function sanitizeHtml(
  html: string,
  opts: { useDOMPurify: boolean },
): string {
  if (opts.useDOMPurify) {
    if (domPurifyModule) {
      // Warm cache — use DOMPurify synchronously
      const withLinks = makeProcessor()
        .use(rehypeParse, { fragment: true })
        .use(rehypeExternalLinks as AnyPlugin)
        .use(rehypeStringify)
        .processSync(html);

      return domPurifyModule.sanitize(
        withLinks.toString(),
        DOMPURIFY_CONFIG as unknown as Record<string, unknown>,
      );
    }

    // Cold cache — kick off the async load and fall through to rehype for this render
    if (!domPurifyLoadAttempted) {
      void tryLoadDOMPurify();
    }
  }

  return sanitizeWithRehype(html);
}

/**
 * Warm the DOMPurify cache. Call this once at app startup if you plan to use
 * `useDOMPurify={true}` to avoid the rehype fallback on the first render.
 */
export async function warmDOMPurifyCache(): Promise<void> {
  await tryLoadDOMPurify();
}

/** Exposed for testing — resets the module-level load state */
export function _resetDOMPurifyCache(): void {
  domPurifyModule = null;
  domPurifyLoadAttempted = false;
}
