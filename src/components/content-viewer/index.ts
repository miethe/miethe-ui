/**
 * @miethe/ui — content-viewer component submodule
 *
 * Exports ArticleViewer + default callout components + frontmatter utilities.
 * Import via:
 *   import { ArticleViewer } from '@miethe/ui';
 *   import { ArticleViewer } from '@miethe/ui/content-viewer';  // submodule path
 */

// Main component
export { ArticleViewer } from './ArticleViewer';
export { default as ArticleViewerDefault } from './ArticleViewer';

// Callout components
export { Callout, NoteCallout, ReferenceCallout, WarningCallout, InfoCallout } from './callouts';

// FrontmatterHeader (PU2-02)
export { FrontmatterHeader } from './FrontmatterHeader';

// Plugins (exported for testing and advanced composition)
export { remarkCallouts, CALLOUT_TYPES } from './plugins';
export { rehypeExternalLinks, isExternalHref } from './plugins/rehypeExternalLinks';
// Code highlighting helpers (PU4-01) — import these to warm the highlight cache at app startup
export { createHighlightPlugin, warmHighlightCache } from './plugins/rehypeCodeHighlight';
// Heading ID plugin (PU4-04 / A-UCV-08)
export { createHeadingIdsPlugin, slugify } from './plugins/rehypeHeadingIds';

// Sanitization utilities (PU3-02 / PU3-03)
export { sanitizeWithRehype, sanitizeWithDOMPurify, warmDOMPurifyCache, ARTICLE_VIEWER_SCHEMA } from './sanitize';

// Format detection utility (PU3-01) — also re-exported from ArticleViewer
export { detectFormat } from './ArticleViewer';

// Variant utilities (PU2-05)
export { VARIANT_CLASSES, getVariantTokenNames, variantClass } from './variants';

// Types
export type {
  ArticleViewerProps,
  ArticleViewerComponents,
  CalloutProps,
  CalloutType,
  CalloutComponents,
  ContentFormat,
  ArticleVariant,
  VariantTokenShape,
  FrontmatterDisplayMode,
  FrontmatterData,
  FrontmatterHeaderProps,
} from './types';
