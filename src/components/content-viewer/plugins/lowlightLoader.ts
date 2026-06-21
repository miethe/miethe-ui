/**
 * lowlightLoader — shared, dependency-light lowlight loader for code highlighting.
 *
 * This module owns the single lowlight instance + load state used by BOTH:
 *  - `rehypeCodeHighlight.ts` (markdown fenced-code highlighting via a rehype plugin), and
 *  - `ContentPane`'s `HighlightedDisplay` (raw code-file highlighting, via `highlightCodeToHast`).
 *
 * It is intentionally free of `unist-util-visit` (and any other static ESM-only
 * dependency) so that importing it from a Client Component (ContentPane) does NOT
 * drag the rehype/unist graph into that module's bundle — or into Jest's module
 * loader (which does not transform `unist-util-visit`'s ESM).
 *
 * `lowlight` itself remains an optional peer dep: it is loaded via dynamic
 * `import()` and the loader degrades gracefully to plain text when it is absent.
 * Consumers that want highlighting install lowlight separately (`npm install lowlight`).
 *
 * @module lowlightLoader
 */

import type { Root } from 'hast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal lowlight API surface we rely on.
 * Defined locally to avoid needing @types/lowlight installed.
 */
export interface LowlightAPI {
  highlight(language: string, code: string): { children: unknown[] };
  highlightAuto(code: string): { children: unknown[] };
  listLanguages(): string[];
}

// ---------------------------------------------------------------------------
// Lazy lowlight loader — one attempt per session
// ---------------------------------------------------------------------------

let lowlightInstance: LowlightAPI | null = null;
let lowlightLoadAttempted = false;

/**
 * Attempt to load lowlight via dynamic import().
 *
 * lowlight is an optional peer dep — consumers must install it separately.
 * Using dynamic import() keeps it out of the base chunk while remaining
 * compatible with ESM environments (no require() needed).
 *
 * Supports both lowlight v2 (preconfigured `lowlight` instance) and lowlight v3
 * (`createLowlight(common)` factory). Returns the instance or null if unavailable.
 */
async function tryLoadLowlight(): Promise<LowlightAPI | null> {
  if (lowlightLoadAttempted) return lowlightInstance;
  lowlightLoadAttempted = true;

  try {
    // lowlight is an optional peer dep with no guaranteed types at build time.
    // @ts-expect-error — optional package; consumers install it separately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(/* webpackIgnore: true */ 'lowlight');
    // v2 shape: mod.lowlight or mod.default or mod (has .highlight function directly)
    const ll: unknown = mod?.lowlight ?? mod?.default ?? mod;
    if (
      ll !== null &&
      typeof ll === 'object' &&
      typeof (ll as Record<string, unknown>)['highlight'] === 'function'
    ) {
      // lowlight v2 path — instance has highlight() directly
      lowlightInstance = ll as LowlightAPI;
    } else if (typeof mod?.createLowlight === 'function' && mod?.common) {
      // lowlight v3 path — factory style: createLowlight(common)
      lowlightInstance = mod.createLowlight(mod.common) as LowlightAPI;
    } else {
      console.warn(
        '[@miethe/ui] codeHighlight=true: lowlight loaded but has unexpected shape. ' +
          'Code blocks will render as plain text. Install lowlight: npm install lowlight'
      );
    }
  } catch {
    // Not installed — expected for consumers that don't opt in
    console.warn(
      '[@miethe/ui] codeHighlight=true: lowlight is not installed. ' +
        'Code blocks will render as plain text. Install it: npm install lowlight'
    );
    lowlightInstance = null;
  }

  return lowlightInstance;
}

/**
 * Return the currently-cached lowlight instance synchronously (or null).
 * Used by the rehype plugin's synchronous transformer, which reads from the
 * already-populated cache. Call {@link warmHighlightCache} first to populate it.
 */
export function getLowlightInstance(): LowlightAPI | null {
  return lowlightInstance;
}

/** Exposed for testing — resets the module-level load state */
export function _resetHighlightCache(): void {
  lowlightInstance = null;
  lowlightLoadAttempted = false;
}

/**
 * Warm the lowlight cache by loading it asynchronously.
 * Call at app startup when `codeHighlight=true` to ensure the cache is populated
 * before the first render cycle, preventing the cold-cache plain-text fallback.
 *
 * This is a no-op when lowlight is not installed.
 */
export async function warmHighlightCache(): Promise<void> {
  await tryLoadLowlight();
}

/**
 * Highlight raw code to a hast Root using lowlight, or null if unavailable/unknown lang.
 *
 * Used by ContentPane's HighlightedDisplay to perform on-demand highlighting
 * for non-markdown code files (e.g. .ts, .py, .json).
 *
 * - Returns null when lowlight is not installed (graceful degrade to plain text).
 * - Returns null when languageName is null or not registered in the lowlight instance.
 * - Never throws.
 *
 * @param code - Raw source code string to highlight.
 * @param languageName - highlight.js language identifier (e.g. "typescript"), or null.
 */
export async function highlightCodeToHast(
  code: string,
  languageName: string | null
): Promise<Root | null> {
  try {
    const ll = await tryLoadLowlight();
    if (!ll) return null;
    if (!languageName) return null;
    const known = ll.listLanguages();
    if (!known.includes(languageName)) return null;
    return ll.highlight(languageName, code) as unknown as Root;
  } catch {
    return null;
  }
}
