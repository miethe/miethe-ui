/**
 * @miethe/ui — ArticleViewer CSS-variable variant system (PU2-05)
 *
 * Maps `ArticleVariant` values to Tailwind-compatible CSS class names.
 * Each class is expected to read CSS custom properties from document root,
 * which the consumer (e.g., Portal `globals.css`) must define.
 *
 * ## CSS-Variable Contract
 *
 * When variant="editorial", apply the class `cv-variant-editorial` and
 * define these variables at `:root` (or a suitable ancestor):
 *
 * ```css
 * :root {
 *   --cv-editorial-h1-font: Fraunces, Georgia, serif;
 *   --cv-editorial-h1-size: 2.25rem;
 *   --cv-editorial-h2-font: Fraunces, Georgia, serif;
 *   --cv-editorial-h2-size: 1.875rem;
 *   --cv-editorial-body-font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 *   --cv-editorial-body-size: 1rem;
 *   --cv-editorial-body-line-height: 1.75;
 *   --cv-editorial-quote-color: #64748b;
 *   --cv-editorial-quote-font-style: italic;
 *   --cv-callout-note-accent: #0ea5e9;
 *   --cv-callout-note-bg: #f0f9ff;
 *   --cv-callout-reference-accent: #64748b;
 *   --cv-callout-reference-bg: #f1f5f9;
 *   --cv-callout-warning-accent: #f59e0b;
 *   --cv-callout-warning-bg: #fffbeb;
 *   --cv-callout-info-accent: #0ea5e9;
 *   --cv-callout-info-bg: #f0f9ff;
 * }
 * ```
 *
 * Analogous `--cv-compact-*` and `--cv-technical-*` sets follow the same pattern.
 * Missing variables are silently ignored — browser defaults apply.
 *
 * ## Light / Dark Mode
 *
 * Variables should be declared inside appropriate selectors at the consumer side:
 *
 * ```css
 * :root { --cv-editorial-body-font: "Libre Baskerville", serif; }
 * .dark { --cv-editorial-body-font: "Libre Baskerville", serif; }
 * ```
 *
 * The component itself applies no color values — all theming is delegated to the consumer.
 */

import type { ArticleVariant, VariantTokenShape } from './types';

// ============================================================================
// Variant class names
// ============================================================================

/**
 * Mapping from `ArticleVariant` → the CSS class applied to the root element.
 * The class is expected to read CSS custom properties from document root.
 */
export const VARIANT_CLASSES: Record<ArticleVariant, string> = {
  editorial: 'cv-variant-editorial',
  compact: 'cv-variant-compact',
  technical: 'cv-variant-technical',
};

// ============================================================================
// Token shape documentation
// ============================================================================

/**
 * Returns the CSS custom property names expected for a given variant.
 * Use this as documentation / tooling support — it does not read or set variables.
 *
 * @param variant - The `ArticleVariant` to query
 * @returns An object whose values are the expected `--cv-*` variable names
 */
export function getVariantTokenNames(variant: ArticleVariant): VariantTokenShape {
  const prefix = `--cv-${variant}`;
  return {
    h1Font: `${prefix}-h1-font`,
    h1Size: `${prefix}-h1-size`,
    h2Font: `${prefix}-h2-font`,
    h2Size: `${prefix}-h2-size`,
    bodyFont: `${prefix}-body-font`,
    bodySize: `${prefix}-body-size`,
    bodyLineHeight: `${prefix}-body-line-height`,
    quoteColor: `${prefix}-quote-color`,
    quoteFontStyle: `${prefix}-quote-font-style`,
    calloutNoteAccent: '--cv-callout-note-accent',
    calloutNoteBg: '--cv-callout-note-bg',
    calloutReferenceAccent: '--cv-callout-reference-accent',
    calloutReferenceBg: '--cv-callout-reference-bg',
    calloutWarningAccent: '--cv-callout-warning-accent',
    calloutWarningBg: '--cv-callout-warning-bg',
    calloutInfoAccent: '--cv-callout-info-accent',
    calloutInfoBg: '--cv-callout-info-bg',
  };
}

/**
 * Returns the CSS class name to apply for a given variant,
 * or `undefined` when no variant is specified.
 *
 * @param variant - Optional `ArticleVariant`
 * @returns CSS class string, or `undefined`
 */
export function variantClass(variant: ArticleVariant | undefined): string | undefined {
  if (variant === undefined) return undefined;
  return VARIANT_CLASSES[variant];
}
