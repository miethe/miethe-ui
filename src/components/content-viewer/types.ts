/**
 * @miethe/ui — ArticleViewer type definitions
 *
 * All public types exported from the content-viewer component.
 * No `any` types at module boundaries.
 */

import type { ComponentType, ReactNode } from 'react';

// ============================================================================
// Variant Types (PU2-04)
// ============================================================================

/**
 * Typography variant applied to the ArticleViewer.
 *
 * Each variant maps to a CSS class (`cv-variant-{name}`) that expects
 * CSS custom properties at document root. Consumers (e.g., Portal) define
 * the actual values in their `globals.css`; the component only applies
 * the class. See the CSS-Variable Contract in the content-viewer README.
 *
 * - `"editorial"` — long-form reading; display serif headings, generous line-height
 * - `"compact"` — dense information display; smaller type scale, tighter spacing
 * - `"technical"` — code-heavy content; monospace body available, clear heading hierarchy
 */
export type ArticleVariant = 'editorial' | 'compact' | 'technical';

/**
 * Shape of the CSS-variable slot names for a single variant.
 * Used by the variant utility to document and validate the contract.
 * All slots are optional — missing variables fall back to browser defaults.
 */
export interface VariantTokenShape {
  /** CSS var for h1 font family, e.g. `--cv-editorial-h1-font` */
  h1Font: string;
  /** CSS var for h1 font size, e.g. `--cv-editorial-h1-size` */
  h1Size: string;
  /** CSS var for h2 font family */
  h2Font: string;
  /** CSS var for h2 font size */
  h2Size: string;
  /** CSS var for body font family */
  bodyFont: string;
  /** CSS var for body font size */
  bodySize: string;
  /** CSS var for body line-height */
  bodyLineHeight: string;
  /** CSS var for blockquote text color */
  quoteColor: string;
  /** CSS var for blockquote font-style (e.g. "italic") */
  quoteFontStyle: string;
  /** CSS var for `note` callout accent color */
  calloutNoteAccent: string;
  /** CSS var for `note` callout background */
  calloutNoteBg: string;
  /** CSS var for `reference` callout accent color */
  calloutReferenceAccent: string;
  /** CSS var for `reference` callout background */
  calloutReferenceBg: string;
  /** CSS var for `warning` callout accent color */
  calloutWarningAccent: string;
  /** CSS var for `warning` callout background */
  calloutWarningBg: string;
  /** CSS var for `info` callout accent color */
  calloutInfoAccent: string;
  /** CSS var for `info` callout background */
  calloutInfoBg: string;
}

// ============================================================================
// Frontmatter Types (PU2-01 / PU2-02 / PU2-03)
// ============================================================================

/**
 * Visibility mode for the frontmatter header.
 *
 * - `"show"` — render FrontmatterHeader in expanded state
 * - `"collapse"` — render FrontmatterHeader in collapsed state
 * - `"hide"` — omit FrontmatterHeader entirely (default)
 */
export type FrontmatterDisplayMode = 'show' | 'collapse' | 'hide';

/**
 * Parsed YAML frontmatter object extracted from the markdown content.
 * Values are typed as `unknown` at the boundary; use type guards before rendering.
 */
export type FrontmatterData = Record<string, unknown>;

/**
 * Props for the FrontmatterHeader component.
 */
export interface FrontmatterHeaderProps {
  /**
   * Parsed YAML frontmatter key-value map.
   * 1-level nesting is rendered as indented rows; deeper objects appear as JSON strings.
   */
  frontmatter: FrontmatterData;
  /**
   * Whether the header starts in collapsed state.
   * @default false
   */
  isCollapsed?: boolean;
  /**
   * Callback invoked when the user toggles the collapsed state.
   * Receives the new collapsed value (`true` = collapsed).
   */
  onToggleCollapse?: (collapsed: boolean) => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Custom component overrides for ArticleViewer sub-components.
 * All keys are optional — omitting a key uses the default implementation.
 */
export interface ArticleViewerComponents {
  /**
   * Override for `note` callout components.
   */
  note?: ComponentType<CalloutProps>;
  /**
   * Override for `reference` callout components.
   */
  reference?: ComponentType<CalloutProps>;
  /**
   * Override for `warning` callout components.
   */
  warning?: ComponentType<CalloutProps>;
  /**
   * Override for `info` callout components.
   */
  info?: ComponentType<CalloutProps>;
  /**
   * Override for the FrontmatterHeader component rendered above article content.
   * Receives the same `FrontmatterHeaderProps` as the default implementation.
   */
  FrontmatterHeader?: ComponentType<FrontmatterHeaderProps>;
}

// ============================================================================
// Callout Types
// ============================================================================

/** Supported callout directive types */
export type CalloutType = 'note' | 'reference' | 'warning' | 'info';

/** Props passed to each callout component */
export interface CalloutProps {
  /** The directive type (note, reference, warning, info) */
  type: CalloutType;
  /** Rendered markdown content inside the callout */
  children?: ReactNode;
  /** Additional CSS class names */
  className?: string;
}

// ============================================================================
// ArticleViewer Types
// ============================================================================

/**
 * Format of the incoming content string.
 * - `"markdown"`: Always treat as markdown (render via remark pipeline)
 * - `"html"`: Treat as pre-rendered HTML (renders as-is with dangerouslySetInnerHTML)
 * - `"auto"`: Detect based on content heuristics (default)
 */
export type ContentFormat = 'markdown' | 'html' | 'auto';

/**
 * Map of callout type → custom component.
 * Allows Portal (and other consumers) to override default callout renderers.
 *
 * @deprecated Prefer `ArticleViewerComponents` which also supports `FrontmatterHeader` override.
 *
 * @example
 * ```tsx
 * <ArticleViewer
 *   content={markdown}
 *   components={{
 *     note: MyCustomNoteCallout,
 *     warning: MyWarningBanner,
 *   }}
 * />
 * ```
 */
export type CalloutComponents = Partial<Record<CalloutType, ComponentType<CalloutProps>>>;

/**
 * Props for the ArticleViewer component.
 *
 * @example
 * ```tsx
 * <ArticleViewer
 *   content="# Hello\n\n::: note\nThis is a note\n:::"
 *   format="markdown"
 *   variant="editorial"
 *   frontmatter="show"
 *   onError={(err) => console.error(err)}
 * />
 * ```
 */
export interface ArticleViewerProps {
  /**
   * The raw content string to render.
   * For markdown, the full remark pipeline (GFM + directives) is applied.
   * YAML frontmatter (if present) is extracted and not rendered as content.
   */
  content: string;

  /**
   * Format of the content. Defaults to `"auto"` which detects markdown
   * by looking for common markdown patterns.
   * @default "auto"
   */
  format?: ContentFormat;

  /**
   * Typography variant. Applies a CSS class (`cv-variant-{name}`) to the root
   * element. Each variant relies on CSS custom properties at document root.
   * See the CSS-Variable Contract in the content-viewer README for the full
   * list of expected `--cv-{variant}-*` variables.
   * @default undefined (no variant class applied)
   */
  variant?: ArticleVariant;

  /**
   * Controls visibility of the YAML frontmatter header above article content.
   * - `"show"` — header rendered, expanded by default
   * - `"collapse"` — header rendered, collapsed by default
   * - `"hide"` — header omitted entirely
   * Has no effect if the content has no frontmatter.
   * @default "hide"
   */
  frontmatter?: FrontmatterDisplayMode;

  /**
   * Override map for sub-components rendered by ArticleViewer.
   * - Callout keys (`note`, `reference`, `warning`, `info`): override default callout renderers
   * - `FrontmatterHeader`: override the default frontmatter header component
   *
   * Any key not provided falls back to the default implementation.
   */
  components?: ArticleViewerComponents;

  /**
   * @deprecated Use `components` instead. Kept for single-component override
   * compatibility. If `components.note` etc. are also provided, those take precedence.
   */
  calloutComponent?: ComponentType<CalloutProps>;

  /**
   * Whether to sanitize HTML content (applies to `format="html"` and auto-detected HTML).
   *
   * When `true` (default for HTML input), `rehype-sanitize@6` strips XSS vectors:
   * `<script>`, event handlers (`onclick`, `onerror`, …), `javascript:` and unsafe
   * `data:` URLs, `<iframe>`, `<object>`, `<embed>`, `<svg>` containing scripts,
   * and CSS `expression()` / `javascript:` values.
   *
   * Set to `false` **only** when the HTML source is fully trusted (e.g. content
   * compiled by the MeatyWiki engine through the Portal's controlled pipeline).
   * Never set `false` for user-supplied or third-party content.
   *
   * Has no effect on markdown input (the remark pipeline never emits raw HTML
   * unless `allowDangerousHtml` is explicitly set, which this component does not do).
   *
   * @default true (for format="html" / auto-detected HTML), false (for format="markdown")
   */
  sanitize?: boolean;

  /**
   * Whether to use `isomorphic-dompurify` as the HTML sanitizer instead of the
   * default `rehype-sanitize`.
   *
   * `isomorphic-dompurify` is an **optional peer dependency** — it is NOT bundled
   * with `@miethe/ui`. Consumers that want this path must install it separately:
   * ```
   * npm install isomorphic-dompurify
   * ```
   * If the package is unavailable at runtime, ArticleViewer logs a warning and
   * falls back to `rehype-sanitize`. The `sanitize` prop must also be `true`
   * for this prop to have any effect.
   *
   * @default false
   */
  useDOMPurify?: boolean;

  /**
   * Enable opt-in syntax highlighting for fenced code blocks.
   *
   * When `false` (default), code blocks render as styled monospace plain text —
   * zero additional bundle cost.
   *
   * When `true`, the component dynamically imports `lowlight` on first use and
   * applies highlight.js-compatible hast transformations to `pre > code` blocks.
   * `lowlight` is an **optional peer dependency** (~15KB gzip); install separately:
   * ```
   * npm install lowlight
   * ```
   * On the first render with a cold cache the highlighter loads asynchronously;
   * code renders as plain text until the next render. Call `warmHighlightCache()`
   * at app startup to eliminate this delay.
   *
   * To style highlighted code, add a highlight.js CSS theme in your app:
   * ```
   * import 'highlight.js/styles/github.css';
   * ```
   *
   * @default false
   */
  codeHighlight?: boolean;

  /**
   * Automatically generate `id` attributes on heading elements (h1–h6)
   * using a GitHub-compatible slug algorithm.
   *
   * Generated IDs allow in-page anchor navigation (`#section-title`).
   * The `id` attribute is preserved by the sanitization schema for HTML input.
   *
   * When `false`, headings are rendered without `id` attributes.
   *
   * @default true
   */
  generateHeadingIds?: boolean;

  /**
   * When `true`, suppress all content rendering and show an accessible
   * skeleton/placeholder instead. The `onError` callback is NOT invoked
   * while loading is active.
   *
   * @default false
   */
  isLoading?: boolean;

  /**
   * Render an accessible error message instead of content.
   * Accepts either a `string` message or an `Error` object.
   *
   * Priority: `error` prop > error boundary caught error > normal render.
   * Does not crash the component; the error boundary still catches child throws.
   *
   * @default undefined
   */
  error?: string | Error | null;

  /**
   * Callback invoked when a rendering error occurs.
   * Receives the caught Error object.
   */
  onError?: (error: Error) => void;

  /**
   * Additional CSS class names applied to the root wrapper element.
   */
  className?: string;
}
