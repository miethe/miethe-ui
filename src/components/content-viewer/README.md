# ArticleViewer — Content Viewer Submodule

`ArticleViewer` is the read-only markdown renderer for `@miethe/ui`. It ships
with GFM support, callout directives, YAML frontmatter display, and a
CSS-variable-driven typography variant system.

## Quick Start

```tsx
import { ArticleViewer } from '@miethe/ui';

// Basic
<ArticleViewer content={markdownString} />

// With variant + frontmatter
<ArticleViewer
  content={markdownWithFrontmatter}
  variant="editorial"
  frontmatter="show"
/>

// With component overrides
<ArticleViewer
  content={markdownString}
  components={{
    warning: MyWarningBanner,
    FrontmatterHeader: MyFrontmatterHeader,
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | required | Raw markdown (or HTML) string to render |
| `format` | `"markdown" \| "html" \| "auto"` | `"auto"` | Force format or auto-detect |
| `variant` | `"editorial" \| "compact" \| "technical"` | — | Typography variant (applies CSS class + reads CSS vars) |
| `frontmatter` | `"show" \| "collapse" \| "hide"` | `"hide"` | FrontmatterHeader visibility |
| `sanitize` | `boolean` | `true` for HTML, `false` for markdown | Strip XSS vectors from HTML input via rehype-sanitize |
| `useDOMPurify` | `boolean` | `false` | Use `isomorphic-dompurify` (optional peer dep) instead of rehype-sanitize |
| `components` | `ArticleViewerComponents` | — | Override callout or FrontmatterHeader renderers |
| `onError` | `(error: Error) => void` | — | Error boundary callback |
| `className` | `string` | — | Additional classes on root element |

---

## CSS-Variable Contract (Typography Variants)

Each variant applies a class (`cv-variant-editorial`, `cv-variant-compact`,
`cv-variant-technical`) to the root element. The component reads CSS custom
properties you define at `:root`. No default values are baked in — if a
variable is missing, the browser applies its natural default.

### Why CSS variables?

- Consumers (Portal, apps) define their brand tokens in `globals.css`
- The component stays token-agnostic
- Light/dark mode is handled at the consumer level via selector overrides

### Variable Naming Convention

```
--cv-{variant}-{slot}       ← typography slots (per-variant prefix)
--cv-callout-{type}-{slot}  ← callout accent/bg (shared across variants)
```

### Editorial Variant (`cv-variant-editorial`)

Long-form reading: display serif headings, generous line-height.

```css
:root {
  /* Headings */
  --cv-editorial-h1-font: Fraunces, Georgia, serif;
  --cv-editorial-h1-size: 2.25rem;
  --cv-editorial-h2-font: Fraunces, Georgia, serif;
  --cv-editorial-h2-size: 1.875rem;

  /* Body */
  --cv-editorial-body-font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --cv-editorial-body-size: 1rem;
  --cv-editorial-body-line-height: 1.75;

  /* Blockquote */
  --cv-editorial-quote-color: #64748b;
  --cv-editorial-quote-font-style: italic;
}
```

### Compact Variant (`cv-variant-compact`)

Dense information display: smaller type scale, tighter spacing.

```css
:root {
  --cv-compact-h1-font: inherit;
  --cv-compact-h1-size: 1.5rem;
  --cv-compact-h2-font: inherit;
  --cv-compact-h2-size: 1.25rem;
  --cv-compact-body-font: inherit;
  --cv-compact-body-size: 0.875rem;
  --cv-compact-body-line-height: 1.5;
  --cv-compact-quote-color: #94a3b8;
  --cv-compact-quote-font-style: normal;
}
```

### Technical Variant (`cv-variant-technical`)

Code-heavy content: monospace body available, clear heading hierarchy.

```css
:root {
  --cv-technical-h1-font: "IBM Plex Mono", "Fira Code", monospace;
  --cv-technical-h1-size: 1.75rem;
  --cv-technical-h2-font: "IBM Plex Mono", "Fira Code", monospace;
  --cv-technical-h2-size: 1.375rem;
  --cv-technical-body-font: inherit;
  --cv-technical-body-size: 0.9375rem;
  --cv-technical-body-line-height: 1.6;
  --cv-technical-quote-color: #64748b;
  --cv-technical-quote-font-style: normal;
}
```

### Callout Variables (Shared Across Variants)

These callout color variables are not variant-prefixed — they apply to all
callout types regardless of variant:

```css
:root {
  --cv-callout-note-accent: #0ea5e9;
  --cv-callout-note-bg: #f0f9ff;
  --cv-callout-reference-accent: #64748b;
  --cv-callout-reference-bg: #f1f5f9;
  --cv-callout-warning-accent: #f59e0b;
  --cv-callout-warning-bg: #fffbeb;
  --cv-callout-info-accent: #0ea5e9;
  --cv-callout-info-bg: #f0f9ff;
}
```

### Dark Mode

Override variables inside your dark-mode selector:

```css
.dark {
  --cv-editorial-quote-color: #94a3b8;
  --cv-callout-note-accent: #38bdf8;
  --cv-callout-note-bg: #0c4a6e20;
  /* ... etc */
}
```

The component itself applies no hard-coded color values — all theming is
delegated to the consumer stylesheet.

---

## Frontmatter Display

YAML frontmatter is extracted via `gray-matter` before rendering. The body
(with frontmatter stripped) is passed to the remark pipeline — frontmatter
content is never duplicated in the rendered markdown output.

The `frontmatter` prop controls visibility:

| Value | Behaviour |
|-------|-----------|
| `"hide"` | No header rendered (default) |
| `"show"` | FrontmatterHeader rendered, expanded |
| `"collapse"` | FrontmatterHeader rendered, collapsed |

If the content has no frontmatter, no header is rendered regardless of the
`frontmatter` prop value.

**Edge cases**:
- Missing frontmatter: no header, body renders normally
- Malformed YAML: warning logged, body rendered as-is (no crash)
- 1-level YAML nesting: displayed as indented key-value rows
- Deeper nesting: JSON-stringified

---

## Component Overrides

Pass an `ArticleViewerComponents` object to override sub-components:

```tsx
<ArticleViewer
  content={markdown}
  components={{
    // Callout overrides (by type)
    note: MyNoteCallout,
    warning: MyWarningBanner,
    // FrontmatterHeader override
    FrontmatterHeader: MyFrontmatterHeader,
  }}
/>
```

The `FrontmatterHeader` override receives `FrontmatterHeaderProps`:

```tsx
interface FrontmatterHeaderProps {
  frontmatter: Record<string, unknown>;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  className?: string;
}
```

---

---

## Security Considerations

### Sanitization strategy (PU3-02 / PU3-03)

`ArticleViewer` uses an **allowlist-based** sanitization approach — only
explicitly listed tags and attributes pass through. This is safer than blocklist
approaches which require enumerating every possible XSS vector.

#### Default path: `rehype-sanitize@6`

When `format="html"` (or auto-detected HTML) and `sanitize={true}` (the
default), ArticleViewer runs the HTML string through a unified pipeline:

```
rehypeParse → rehypeExternalLinks → rehypeSanitize(schema) → rehypeStringify
```

The pipeline uses GitHub's `defaultSchema` (the same allowlist GitHub applies
to rendered Markdown) extended with:

- `class` on `div` and `span` — callout wrappers + Tailwind utility classes
- `data-callout-type` on `div` — semantic callout attribute from remark pipeline
- `id` on `h1`–`h6` — anchor link targets in compiled wiki documents
- `target` and `rel` on `a` — set by the external-link plugin before sanitization

#### What is stripped

| Category | Examples |
|----------|---------|
| Script tags | `<script>`, `<script type="module">` |
| Event handlers | `onclick`, `onerror`, `onload`, `onmouseover`, all `on*` attrs |
| Dangerous URLs | `javascript:` hrefs, `data:` hrefs (non-image) |
| Unsafe embeds | `<iframe>`, `<object>`, `<embed>`, `<frame>`, `<frameset>` |
| Script in SVG | `<svg>` elements containing `<script>` |
| CSS injection | `style="expression(…)"`, `style="background:url(javascript:…)"` |
| Meta/base tags | `<meta>`, `<base>`, `<link>`, `<form>` |

#### What is preserved

Safe structural HTML: headings (`h1`–`h6`), paragraphs, lists (`ul`, `ol`,
`li`), blockquotes, `<pre>`, `<code>`, tables, `<a>` with `http`/`https`/
`mailto` hrefs, `<img>` with `http`/`https` src, `<div>`, `<span>` with class,
`<strong>`, `<em>`, `<del>`, `<details>`, `<summary>`, `<figure>`,
`<figcaption>`, `<hr>`, `<br>`, and task-list `<input type="checkbox">`.

#### Optional path: `isomorphic-dompurify`

Set `useDOMPurify={true}` to use DOMPurify instead of rehype-sanitize.
`isomorphic-dompurify` is an **optional peer dependency** — not bundled with
`@miethe/ui`. Install it separately:

```sh
npm install isomorphic-dompurify
```

If the package is not installed, ArticleViewer logs a warning and falls back
to rehype-sanitize. The DOMPurify path uses the same allowlist (ALLOWED_TAGS /
ALLOWED_ATTR config) and also applies external-link hardening before sanitizing.

When to prefer DOMPurify:
- You need DOM-based sanitization (e.g. in a browser extension context)
- You already have `isomorphic-dompurify` as a project dependency

When to prefer rehype-sanitize (default):
- SSR / server-side rendering (rehype runs in Node.js natively)
- You want zero additional runtime deps
- The unified pipeline is already part of your build

#### Opting out: `sanitize={false}`

```tsx
// ONLY for content you fully control and trust
<ArticleViewer
  content={engineCompiledHtml}
  format="html"
  sanitize={false}
/>
```

`sanitize={false}` is an explicit escape hatch for content that has already
been sanitized upstream (e.g. HTML output from the MeatyWiki compilation engine
running in a controlled server environment). **Never** set `sanitize={false}`
for user-supplied content, third-party HTML, or any content whose origin you
cannot fully verify.

#### Markdown is inherently safe

The markdown path (remark pipeline) never renders raw HTML unless
`allowDangerousHtml` is explicitly set — which `ArticleViewer` does **not** do.
The `sanitize` prop has no effect on markdown rendering.

#### Known limitations

1. **CSS injection** — The schema strips `style` attributes containing
   `expression()` or `javascript:` but does not fully parse CSS. Avoid
   allowing arbitrary `style` attributes if you extend the schema.

2. **Mutation XSS** — If you post-process the sanitized HTML string with DOM
   APIs before rendering, re-sanitize. The sanitizer output is safe only if
   consumed directly via `dangerouslySetInnerHTML`.

3. **Protocol handlers** — Custom URL schemes beyond `http:`, `https:`, and
   `mailto:` are not in the external-link allowlist. Anchor links, relative
   paths, and `#fragment` links are treated as internal and are not hardened
   with `target="_blank"`.

4. **DOMPurify first-render fallback** — On the first render with
   `useDOMPurify={true}` (cold cache), ArticleViewer uses rehype-sanitize and
   triggers an async load in the background. Subsequent renders use DOMPurify.
   Call `warmDOMPurifyCache()` at app startup to avoid the first-render fallback.

---

## Exports

```ts
// Components
export { ArticleViewer } from './ArticleViewer';
export { FrontmatterHeader } from './FrontmatterHeader';
export { Callout, NoteCallout, ReferenceCallout, WarningCallout, InfoCallout } from './callouts';

// Variant utilities
export { VARIANT_CLASSES, getVariantTokenNames, variantClass } from './variants';

// Types
export type {
  ArticleViewerProps,
  ArticleViewerComponents,
  ArticleVariant,
  VariantTokenShape,
  FrontmatterDisplayMode,
  FrontmatterData,
  FrontmatterHeaderProps,
  CalloutProps,
  CalloutType,
  ContentFormat,
} from './types';
```
