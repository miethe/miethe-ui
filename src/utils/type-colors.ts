/**
 * Type-color utilities
 *
 * Generic color-coding helpers for artifact/entity type indicators.
 * Maps string type keys to Tailwind CSS classes for left-border accents
 * and subtle background tints.
 *
 * These utilities are intentionally agnostic to any specific type system —
 * they accept plain strings and fall back gracefully for unknown values.
 */

// ---------------------------------------------------------------------------
// Type bar colors (left border accent)
// ---------------------------------------------------------------------------

/**
 * Default left-border color class for artifact types.
 *
 * Maps type strings to Tailwind `border-l-{color}-{shade}` classes.
 * Combine with `border-l-4` on the card root to produce a colour-coded
 * left accent bar.
 *
 * Extend or override this map in consumer applications by spreading into
 * a new record and passing it to `getTypeBarColor`.
 */
export const typeBarColors: Record<string, string> = {
  skill: 'border-l-purple-500',
  command: 'border-l-blue-500',
  agent: 'border-l-green-500',
  hook: 'border-l-pink-500',
  mcp: 'border-l-orange-500',
  workflow: 'border-l-cyan-500',
  composite: 'border-l-indigo-500',
  context_module: 'border-l-sky-400',
  template: 'border-l-purple-400',
  group: 'border-l-green-400',
  deployment_set: 'border-l-orange-400',
  context_pack: 'border-l-teal-500',
  bundle: 'border-l-violet-500',
  project_config: 'border-l-slate-400',
  spec_file: 'border-l-slate-400',
  rule_file: 'border-l-slate-400',
  context_file: 'border-l-slate-300',
  progress_template: 'border-l-slate-300',
  // Orchestration scripts (orchestration-artifact-type-v1)
  orchestration: 'border-l-purple-600',
};

/** Fallback border color for unrecognised / unknown type strings. */
export const TYPE_BAR_FALLBACK = 'border-l-gray-400';

/**
 * Resolve the left-border color class for a given type string.
 *
 * Safe to call with arbitrary strings — unknown types receive the neutral
 * gray fallback rather than throwing.
 *
 * @param type - Artifact or entity type string (e.g. 'skill', 'agent')
 * @param colorMap - Optional custom map; defaults to the built-in `typeBarColors`
 *
 * @example
 * ```ts
 * getTypeBarColor('skill')   // 'border-l-purple-500'
 * getTypeBarColor('unknown') // 'border-l-gray-400'
 * ```
 */
export function getTypeBarColor(
  type: string,
  colorMap: Record<string, string> = typeBarColors,
): string {
  return colorMap[type] ?? TYPE_BAR_FALLBACK;
}

// ---------------------------------------------------------------------------
// Card background tints
// ---------------------------------------------------------------------------

/**
 * Subtle background tint classes per type string.
 *
 * Applied at larger display sizes (compact, standard, expanded).
 * At smaller sizes the left-border accent alone provides sufficient
 * type differentiation.
 *
 * Values use very low opacity so the tint is visible but non-distracting.
 */
export const artifactTypeCardTints: Record<string, string> = {
  skill: 'bg-purple-500/[0.02] dark:bg-purple-500/[0.03]',
  command: 'bg-blue-500/[0.02] dark:bg-blue-500/[0.03]',
  agent: 'bg-green-500/[0.02] dark:bg-green-500/[0.03]',
  hook: 'bg-pink-500/[0.02] dark:bg-pink-500/[0.03]',
  mcp: 'bg-orange-500/[0.02] dark:bg-orange-500/[0.03]',
  workflow: 'bg-cyan-500/[0.02] dark:bg-cyan-500/[0.03]',
  composite: 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.03]',
  context_module: 'bg-sky-400/[0.02] dark:bg-sky-400/[0.03]',
  template: 'bg-purple-400/[0.02] dark:bg-purple-400/[0.03]',
  group: 'bg-green-400/[0.02] dark:bg-green-400/[0.03]',
  deployment_set: 'bg-orange-400/[0.02] dark:bg-orange-400/[0.03]',
  context_pack: 'bg-teal-500/[0.02] dark:bg-teal-500/[0.03]',
  bundle: 'bg-violet-500/[0.02] dark:bg-violet-500/[0.03]',
  project_config: 'bg-slate-500/[0.02] dark:bg-slate-500/[0.03]',
  spec_file: 'bg-slate-500/[0.02] dark:bg-slate-500/[0.03]',
  rule_file: 'bg-slate-500/[0.02] dark:bg-slate-500/[0.03]',
  context_file: 'bg-slate-400/[0.02] dark:bg-slate-400/[0.03]',
  progress_template: 'bg-slate-400/[0.02] dark:bg-slate-400/[0.03]',
  // Orchestration scripts (orchestration-artifact-type-v1)
  orchestration: 'bg-purple-600/[0.02] dark:bg-purple-600/[0.03]',
};

/**
 * Resolve the background tint class for a given type string.
 *
 * Returns an empty string for unrecognised types, making it safe to call
 * with arbitrary input.
 *
 * Note: tier-based suppression (e.g. omitting the tint at xs-minified) is
 * the responsibility of the consumer. This function only resolves the class
 * for the type; it does not filter by tier.
 *
 * @param type - Artifact or entity type string (e.g. 'skill', 'agent')
 * @param tintMap - Optional custom map; defaults to `artifactTypeCardTints`
 *
 * @example
 * ```ts
 * getCardTint('skill')    // 'bg-purple-500/[0.02] dark:bg-purple-500/[0.03]'
 * getCardTint('unknown')  // ''
 * ```
 */
export function getCardTint(
  type: string,
  tintMap: Record<string, string> = artifactTypeCardTints,
): string {
  return tintMap[type] ?? '';
}
