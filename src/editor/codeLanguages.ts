import type { LanguageSupport } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';

// ============================================================================
// Language resolver
// ============================================================================

/**
 * Resolves a CodeMirror `LanguageSupport` instance from a file path.
 *
 * Matches on the lowercased file extension. Returns `undefined` for unknown
 * extensions so callers can fall back to plain-text mode.
 *
 * Supported extensions:
 * - `.ts` → TypeScript
 * - `.tsx` → TypeScript + JSX
 * - `.js` → JavaScript
 * - `.jsx` → JavaScript + JSX
 * - `.py` → Python
 * - `.json` → JSON
 * - `.css` → CSS
 *
 * This module is intended to be loaded only inside a lazy boundary (e.g. a
 * React.lazy wrapper in ContentPane) so the lang-pack weight stays in a
 * deferred chunk and is never part of the initial bundle.
 *
 * @example
 * ```ts
 * const lang = resolveCodeMirrorLanguage('src/index.tsx');
 * // lang === javascript({ typescript: true, jsx: true })
 * ```
 */
export function resolveCodeMirrorLanguage(path: string): LanguageSupport | undefined {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();

  switch (ext) {
    case '.ts':
      return javascript({ typescript: true });
    case '.tsx':
      return javascript({ typescript: true, jsx: true });
    case '.js':
      return javascript();
    case '.jsx':
      return javascript({ jsx: true });
    case '.py':
      return python();
    case '.json':
      return json();
    case '.css':
      return css();
    default:
      return undefined;
  }
}
