// @miethe/ui — content-viewer submodule
export { FileTree } from './FileTree';
export type { FileTreeProps } from './FileTree';
export { ContentPane } from './ContentPane';
export type { ContentPaneProps, TruncationInfo } from './ContentPane';
export {
  ContentViewerProvider,
  useContentViewerAdapter,
} from './ContentViewerProvider';
export type { ContentViewerProviderProps } from './ContentViewerProvider';
export type {
  AdapterHookOptions,
  AdapterQueryResult,
  FileTreeAdapter,
  FileContentAdapter,
  ContentViewerAdapter,
} from './adapters';

// ArticleViewer — read-only markdown rendering component (Unified Content Viewer v1, PU1–PU4)
export {
  ArticleViewer,
  Callout,
  NoteCallout,
  ReferenceCallout,
  WarningCallout,
  InfoCallout,
  FrontmatterHeader,
  remarkCallouts,
  CALLOUT_TYPES,
  rehypeExternalLinks,
  isExternalHref,
  createHighlightPlugin,
  warmHighlightCache,
  createHeadingIdsPlugin,
  slugify,
  sanitizeWithRehype,
  sanitizeWithDOMPurify,
  warmDOMPurifyCache,
  ARTICLE_VIEWER_SCHEMA,
  detectFormat,
  VARIANT_CLASSES,
  getVariantTokenNames,
  variantClass,
} from '../components/content-viewer';
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
} from '../components/content-viewer';
