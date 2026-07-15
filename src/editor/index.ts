// @miethe/ui — editor submodule
export { MarkdownEditor } from './MarkdownEditor';
export type { MarkdownEditorProps } from './MarkdownEditor';
export { SplitPreview } from './SplitPreview';
export type { SplitPreviewProps } from './SplitPreview';
export { CodeEditor } from './CodeEditor';
export type { CodeEditorProps } from './CodeEditor';
// NOTE: `resolveCodeMirrorLanguage` is intentionally NOT re-exported here.
// Its module statically imports the @codemirror/lang-* grammar packs; re-exporting
// it from this barrel would pull those packs into every consumer of `@miethe/ui/editor`
// (e.g. importers of MarkdownEditor), defeating the lazy-chunk isolation. ContentPane
// imports it via a dynamic `import('./codeLanguages')` boundary instead.
