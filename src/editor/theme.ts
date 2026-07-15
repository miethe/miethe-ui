import { EditorView } from '@codemirror/view';

// ============================================================================
// Theme Extensions
// ============================================================================

/**
 * Light theme extension for CodeMirror.
 * Uses CSS custom properties so it adapts to any Tailwind/shadcn token set.
 */
export const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      height: '100%',
    },
    '.cm-content': {
      caretColor: 'hsl(var(--foreground))',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '16px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'hsl(var(--foreground))',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'hsl(var(--accent))',
    },
    '.cm-activeLine': {
      backgroundColor: 'hsl(var(--accent) / 0.1)',
    },
    '.cm-gutters': {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'hsl(var(--accent) / 0.1)',
    },
  },
  { dark: false }
);

/**
 * Dark theme extension for CodeMirror.
 * Uses CSS custom properties so it adapts to any Tailwind/shadcn token set.
 */
export const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      height: '100%',
    },
    '.cm-content': {
      caretColor: 'hsl(var(--foreground))',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '16px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'hsl(var(--foreground))',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'hsl(var(--accent))',
    },
    '.cm-activeLine': {
      backgroundColor: 'hsl(var(--accent) / 0.1)',
    },
    '.cm-gutters': {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'hsl(var(--accent) / 0.1)',
    },
  },
  { dark: true }
);

/**
 * Returns true when the OS/browser is currently in dark mode.
 * Safe to call in SSR contexts — returns false when `window` is unavailable.
 */
export function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
