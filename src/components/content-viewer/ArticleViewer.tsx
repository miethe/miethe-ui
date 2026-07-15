'use client';

/**
 * ArticleViewer — read-only markdown/HTML rendering component (PU1–PU4)
 *
 * Renders a markdown string through the full remark pipeline:
 * - CommonMark (base markdown)
 * - GitHub Flavored Markdown via remark-gfm (tables, task lists, strikethrough)
 * - Callout directives via remark-directive + custom remarkCallouts plugin
 *
 * Also accepts pre-compiled HTML strings (`format="html"`) for Portal artifacts.
 * HTML input is sanitized by default via `rehype-sanitize@6` (PU3-02).
 *
 * YAML frontmatter is extracted via `gray-matter` (PU2-01). It is stripped
 * from the body before rendering and optionally displayed as a collapsible
 * header via the `frontmatter` prop (PU2-03).
 *
 * Typography variants are applied as CSS classes (`cv-variant-{name}`) that
 * read CSS custom properties from document root (PU2-05). See the
 * CSS-Variable Contract section in the content-viewer README.
 *
 * External links are hardened with `target="_blank" rel="noopener noreferrer"`
 * on both markdown and HTML paths (PU3-04).
 *
 * Callout components and FrontmatterHeader can be overridden per-type via the
 * `components` prop, allowing Portal and other consumers to inject their own
 * renderers without forking the component.
 *
 * Phase 4 additions:
 * - `codeHighlight` (default false) — opt-in syntax highlighting via lowlight
 * - `generateHeadingIds` (default true) — auto-generates anchor IDs on headings
 * - `isLoading` — shows accessible skeleton placeholder; suppresses content render
 * - `error` — shows accessible error message; takes priority over normal render
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ArticleViewer content={markdownString} />
 *
 * // Loading skeleton
 * <ArticleViewer content="" isLoading />
 *
 * // Error state
 * <ArticleViewer content="" error="Failed to load document" />
 *
 * // With code highlighting + variant + frontmatter display
 * <ArticleViewer
 *   content={markdownWithFrontmatter}
 *   variant="editorial"
 *   frontmatter="show"
 *   codeHighlight
 * />
 *
 * // Pre-compiled HTML (sanitized by default)
 * <ArticleViewer content={htmlString} format="html" />
 *
 * // Trusted engine output — skip sanitization (Portal only)
 * <ArticleViewer content={trustedHtml} format="html" sanitize={false} />
 *
 * // With callout + header overrides
 * <ArticleViewer
 *   content={markdownString}
 *   components={{
 *     warning: MyWarningBanner,
 *     FrontmatterHeader: MyFrontmatterHeader,
 *   }}
 * />
 * ```
 */

import React, { Component, useMemo } from 'react';
import type { ComponentPropsWithoutRef, ErrorInfo, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import matter from 'gray-matter';
import { cn } from '../../primitives/utils';
import type {
  ArticleViewerProps,
  CalloutType,
  FrontmatterData,
} from './types';
import {
  remarkCallouts as _remarkCallouts,
  createHighlightPlugin,
  createHeadingIdsPlugin,
} from './plugins';
import { variantClass } from './variants';
import { FrontmatterHeader as DefaultFrontmatterHeader } from './FrontmatterHeader';
import { sanitizeHtml } from './sanitize';
// Cast avoids unified vfile version mismatch between remark-directive@2 and react-markdown@9
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const remarkCallouts = _remarkCallouts as any;
import {
  NoteCallout,
  ReferenceCallout,
  WarningCallout,
  InfoCallout,
} from './callouts';

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  onError?: (error: Error) => void;
  children: ReactNode;
}

/**
 * Error boundary that catches rendering errors from the remark pipeline
 * and reports them via the `onError` callback.
 */
class ArticleViewerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p className="font-semibold">Failed to render content</p>
          {this.state.error && (
            <p className="mt-1 font-mono text-xs opacity-75">{this.state.error.message}</p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// Loading skeleton (PU4-02)
// ============================================================================

/**
 * Accessible skeleton placeholder rendered when `isLoading=true`.
 * Uses Tailwind `animate-pulse` for the shimmer effect.
 * Suppresses content rendering while active.
 */
function ArticleViewerSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      className="article-viewer-skeleton space-y-3"
    >
      {/* Simulate heading */}
      <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
      {/* Simulate paragraph lines */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
      </div>
      {/* Simulate second paragraph */}
      <div className="space-y-2 pt-2">
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
      </div>
      {/* Visually hidden text for screen readers */}
      <span className="sr-only">Loading article content, please wait.</span>
    </div>
  );
}

// ============================================================================
// Error display (PU4-03)
// ============================================================================

/**
 * Accessible error message rendered when the `error` prop is set.
 * Takes priority over normal render and boundary-caught errors.
 */
function ArticleViewerError({ error }: { error: string | Error }) {
  const message = error instanceof Error ? error.message : error;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="article-viewer-error rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
    >
      <p className="font-semibold">Failed to load content</p>
      {message && (
        <p className="mt-1 font-mono text-xs opacity-75">{message}</p>
      )}
    </div>
  );
}

// ============================================================================
// Format detection
// ============================================================================

/**
 * Detect whether content is markdown or HTML.
 *
 * Heuristic: content is treated as HTML if, after stripping optional YAML
 * frontmatter (lines between `---` delimiters at the very start), the
 * remaining text begins with an HTML opening tag.
 *
 * Examples that resolve to "html":
 *   `<p>Hello</p>`
 *   `  <div class="callout">...</div>`
 *   `---\ntitle: doc\n---\n<article>...</article>`
 */
export function detectFormat(content: string): 'markdown' | 'html' {
  let trimmed = content.trimStart();

  // Strip YAML frontmatter before detection so `---\ntitle: x\n---\n<p>` → html
  if (trimmed.startsWith('---')) {
    const endFm = trimmed.indexOf('\n---', 3);
    if (endFm !== -1) {
      trimmed = trimmed.slice(endFm + 4).trimStart();
    }
  }

  if (trimmed.startsWith('<') && /^<[a-zA-Z]/.test(trimmed)) {
    return 'html';
  }
  return 'markdown';
}

// ============================================================================
// Frontmatter parsing (PU2-01)
// ============================================================================

interface ParsedContent {
  /** Body of the document with frontmatter stripped */
  body: string;
  /** Parsed frontmatter key-value map; empty object if none present */
  frontmatterData: FrontmatterData;
}

/**
 * Extract YAML frontmatter from a markdown string using `gray-matter`.
 *
 * - If no frontmatter is present, returns the original string as body.
 * - If frontmatter is malformed, logs a warning and returns the original string.
 * - Never throws; calling code always receives a valid `ParsedContent`.
 */
function parseMarkdownFrontmatter(content: string): ParsedContent {
  try {
    const result = matter(content);
    return {
      body: result.content,
      frontmatterData: result.data as FrontmatterData,
    };
  } catch (err) {
    // Malformed YAML — warn and fall through to render body as-is
    console.warn('[ArticleViewer] Failed to parse frontmatter:', err);
    return { body: content, frontmatterData: {} };
  }
}

// ============================================================================
// Callout component builder
// ============================================================================

/** The 4 callout types we handle */
const CALLOUT_TYPES: readonly CalloutType[] = ['note', 'reference', 'warning', 'info'];

/** Default callout component map */
const DEFAULT_CALLOUT_COMPONENTS = {
  note: NoteCallout,
  reference: ReferenceCallout,
  warning: WarningCallout,
  info: InfoCallout,
} as const;

// ============================================================================
// ReactMarkdown component map
// ============================================================================

/**
 * Build the `components` map for ReactMarkdown.
 * Maps custom element names (e.g. `callout-note`) to the appropriate callout component.
 * Also wires up link hardening for external URLs.
 */
function buildComponentMap(
  overrides: ArticleViewerProps['components'],
  legacyFallback: ArticleViewerProps['calloutComponent']
): Record<string, React.ComponentType<Record<string, unknown>>> {
  const map: Record<string, React.ComponentType<Record<string, unknown>>> = {};

  // Wire callout elements: `callout-note`, `callout-reference`, etc.
  for (const calloutType of CALLOUT_TYPES) {
    const elementName = `callout-${calloutType}` as string;

    // Priority: `components[type]` > `calloutComponent` (legacy) > default
    const CalloutComponent =
      overrides?.[calloutType] ??
      legacyFallback ??
      DEFAULT_CALLOUT_COMPONENTS[calloutType];

    // ReactMarkdown passes all hast element props; we forward children + className
    const Wrapper = ({ children, className }: ComponentPropsWithoutRef<'div'>) => (
      <CalloutComponent type={calloutType} className={className ?? undefined}>
        {children}
      </CalloutComponent>
    );
    Wrapper.displayName = `CalloutWrapper(${calloutType})`;

    map[elementName] = Wrapper as React.ComponentType<Record<string, unknown>>;
  }

  // External link hardening (A-UCV-06)
  const LinkComponent = ({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) => {
    const isExternal =
      typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        {...rest}
      >
        {children}
      </a>
    );
  };
  LinkComponent.displayName = 'ArticleViewerLink';
  map['a'] = LinkComponent as React.ComponentType<Record<string, unknown>>;

  return map;
}

// ============================================================================
// ArticleViewer
// ============================================================================

/**
 * ArticleViewer renders a markdown or pre-compiled HTML string with full GFM
 * support, callout directive handling, typography variants, and frontmatter
 * display.
 *
 * **Markdown rendering pipeline**:
 * 1. `gray-matter` — extracts YAML frontmatter; strips from body
 * 2. `remark-gfm` — tables, task lists, strikethrough, autolinks
 * 3. `remark-directive` — parses `:::type` container directives
 * 4. `remarkCallouts` — converts container directives to `<callout-type>` elements
 * 5. `ReactMarkdown` + `components` map — maps custom elements to React components
 *    (also applies external link hardening via the `a` component override)
 *
 * **HTML rendering pipeline** (`format="html"` or auto-detected):
 * 1. When `sanitize={true}` (default): `sanitizeHtml()` runs the content through
 *    `rehypeParse → rehypeExternalLinks → rehypeSanitize → rehypeStringify`
 * 2. When `sanitize={false}`: content is rendered as-is via `dangerouslySetInnerHTML`
 *    (only safe for fully trusted, engine-compiled HTML)
 *
 * **Variant**: a CSS class is applied based on `variant` prop; consumer defines
 * `--cv-{variant}-*` variables at document root for theming.
 *
 * **Accessibility**: external links get `rel="noopener noreferrer"` on both paths.
 * Error boundary catches pipeline failures and calls `onError`.
 */
export function ArticleViewer({
  content,
  format = 'auto',
  variant,
  frontmatter: frontmatterMode = 'hide',
  components: componentOverrides,
  calloutComponent,
  sanitize: sanitizeProp,
  useDOMPurify = false,
  codeHighlight = false,
  generateHeadingIds = true,
  isLoading = false,
  error,
  onError,
  className,
}: ArticleViewerProps) {
  // All hooks must be called unconditionally (Rules of Hooks).
  // Loading/error early returns happen AFTER all hooks.

  const resolvedFormat = useMemo(() => {
    if (format === 'auto') return detectFormat(content);
    return format;
  }, [content, format]);

  // PU2-01: Parse frontmatter out of markdown content
  const { body, frontmatterData } = useMemo(() => {
    // Only parse frontmatter from markdown (HTML passthrough has no frontmatter)
    if (resolvedFormat === 'html') {
      return { body: content, frontmatterData: {} as FrontmatterData };
    }
    return parseMarkdownFrontmatter(content);
  }, [content, resolvedFormat]);

  // PU3-02: Resolve sanitize flag.
  // Default: ON for HTML input, OFF for markdown (remark never emits raw HTML).
  const shouldSanitize = sanitizeProp !== undefined
    ? sanitizeProp
    : resolvedFormat === 'html';

  // PU3-02 / PU3-03: Sanitize HTML when required (synchronous via rehype or warm DOMPurify cache)
  const htmlContent = useMemo(() => {
    if (resolvedFormat !== 'html') return '';
    if (!shouldSanitize) return content;
    return sanitizeHtml(content, { useDOMPurify });
  }, [content, resolvedFormat, shouldSanitize, useDOMPurify]);

  const componentMap = useMemo(
    () => buildComponentMap(componentOverrides, calloutComponent),
    [componentOverrides, calloutComponent]
  );

  // PU4-01: Build rehype plugin list (opt-in code highlighting + heading IDs)
  // createHighlightPlugin() and createHeadingIdsPlugin() both create fresh instances
  // per render to prevent cross-render state contamination.
  const rehypePlugins = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugins: any[] = [];
    if (generateHeadingIds) {
      plugins.push(createHeadingIdsPlugin());
    }
    if (codeHighlight) {
      plugins.push(createHighlightPlugin());
    }
    return plugins;
  }, [codeHighlight, generateHeadingIds]);

  // PU2-05: Resolve variant class
  const variantClassName = variantClass(variant);

  // PU2-03: Resolve frontmatter header visibility
  const hasFrontmatter = Object.keys(frontmatterData).length > 0;
  const showHeader = hasFrontmatter && frontmatterMode !== 'hide';
  const headerCollapsed = frontmatterMode === 'collapse';

  // PU2-06: Resolve FrontmatterHeader component (override or default)
  const FrontmatterHeaderComponent =
    componentOverrides?.FrontmatterHeader ?? DefaultFrontmatterHeader;

  // PU4-02: Loading state — suppress all content, show skeleton
  if (isLoading) {
    return <ArticleViewerSkeleton />;
  }

  // PU4-03: Error prop — show accessible error message
  if (error != null) {
    return <ArticleViewerError error={error} />;
  }

  return (
    <ArticleViewerErrorBoundary onError={onError}>
      <div
        className={cn(
          'article-viewer prose prose-sm max-w-none',
          'dark:prose-invert',
          variantClassName,
          className
        )}
        data-format={resolvedFormat}
        data-variant={variant}
        data-sanitized={resolvedFormat === 'html' ? String(shouldSanitize) : undefined}
        data-code-highlight={codeHighlight ? 'true' : undefined}
      >
        {/* Frontmatter header (PU2-03) */}
        {showHeader && (
          <FrontmatterHeaderComponent
            frontmatter={frontmatterData}
            isCollapsed={headerCollapsed}
          />
        )}

        {resolvedFormat === 'html' ? (
          // HTML path (PU3-01): render sanitized (or trusted) HTML string
          // dangerouslySetInnerHTML is acceptable here because:
          // - When sanitize=true: content has been cleaned by rehype-sanitize / DOMPurify
          // - When sanitize=false: caller explicitly asserts content is trusted
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          // Markdown pipeline — use body with frontmatter stripped
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts]}
            rehypePlugins={rehypePlugins.length > 0 ? rehypePlugins : undefined}
            components={componentMap as Parameters<typeof ReactMarkdown>[0]['components']}
          >
            {body}
          </ReactMarkdown>
        )}
      </div>
    </ArticleViewerErrorBoundary>
  );
}

export default ArticleViewer;
