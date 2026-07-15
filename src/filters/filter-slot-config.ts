/**
 * FilterBar declarative slot/props API for @miethe/ui
 *
 * Mirrors the TabConfig[] → FilterSlotConfig[] declarative pattern from the
 * tab-registry (consolidated-entity-modal). Each slot is a self-contained
 * React node with an optional condition predicate evaluated at render time.
 *
 * **Design rationale**:
 * - `FilterSlotConfig[]` drives the middle zone between the search input and
 *   the sort dropdown, analogous to how `TabConfig[]` drives tab visibility.
 * - Condition predicates receive a `FilterSlotConditionContext` (not a DOM
 *   event) so that gating logic is declarative and testable outside React.
 * - Core controls (search, sort, view toggle) are first-class props rather
 *   than slots — they are always present and their internal layout is owned
 *   by FilterBar.
 * - Chips, filter-mode toggles, and active-count badges are intentionally
 *   excluded from this API revision; they are candidates for a future slot
 *   zone or a `children` escape hatch.
 *
 * @see FilterBarProps — full props contract for the FilterBar component
 * @see SortOption, SortDropdownProps — re-exported from sort-dropdown.tsx
 */

import type * as React from 'react';
import type { SortOption } from './sort-dropdown';

// Re-export so callers can import both types from the same module.
export type { SortOption };

// ---------------------------------------------------------------------------
// Condition context
// ---------------------------------------------------------------------------

/**
 * Runtime context passed to each `FilterSlotConfig.condition()` predicate.
 *
 * Extend this interface (not `FilterSlotConfig`) when a new axis of gating
 * is needed (e.g. lens, featureFlag). Keeping context narrow prevents slots
 * from hard-coding SkillMeat domain knowledge inside @miethe/ui.
 */
export interface FilterSlotConditionContext {
  /**
   * Stable identifier for the page or view that owns this FilterBar.
   * Slots use this to restrict themselves to relevant surfaces — e.g. a
   * "Type" filter slot may only render on the artifacts page.
   *
   * @example "artifacts" | "marketplace" | "sources"
   */
  pageId: string;

  /**
   * Backend edition string forwarded from the parent page.
   * When undefined the slot must treat its condition as permissive
   * (backward-compatible default — show in all editions).
   *
   * @example "local" | "enterprise"
   */
  edition?: string;
}

// ---------------------------------------------------------------------------
// Slot config
// ---------------------------------------------------------------------------

/**
 * Declarative descriptor for a single conditional slot in the FilterBar's
 * middle zone (rendered after the search input, before the sort dropdown).
 *
 * Slots are registered by the consumer as a static `FilterSlotConfig[]`
 * array — FilterBar iterates the list, evaluates each `condition`, and
 * renders the `component` for every slot whose condition returns `true`
 * (or is absent).
 *
 * **Ordering**: FilterBar renders slots in array order. The consumer
 * controls visual priority by ordering the array.
 *
 * @example
 * ```tsx
 * const slots: FilterSlotConfig[] = [
 *   {
 *     id: 'type-filter',
 *     label: 'Type',
 *     component: <TypeFilter selected={types} onChange={setTypes} />,
 *   },
 *   {
 *     id: 'tier-filter',
 *     label: 'Tier',
 *     component: <TierFilter selected={tiers} onChange={setTiers} />,
 *     condition: (ctx) => ctx.pageId === 'artifacts',
 *   },
 * ];
 * ```
 */
export interface FilterSlotConfig {
  /**
   * Stable identifier for this slot.
   * Used as the React `key` when rendering the slot list; must be unique
   * within a given `FilterBarProps.filterSlots` array.
   */
  id: string;

  /**
   * Human-readable label describing the slot's filter domain.
   * FilterBar does not render the label directly — it is available for
   * accessibility wrappers, tooltips, or future slot-header zones.
   *
   * @example "Type" | "Tier" | "Tag"
   */
  label: string;

  /**
   * The React node to render when the slot is active.
   * Typically a controlled filter component (popover, select, etc.) whose
   * state is managed by the consumer outside FilterBar.
   *
   * FilterBar provides no state plumbing for slot components — the consumer
   * owns the filter state and passes it down via closure.
   */
  component: React.ReactNode;

  /**
   * Optional predicate evaluated at render time to determine whether this
   * slot should appear.
   *
   * When absent (or when the predicate returns `true`) the slot is rendered.
   * When the predicate returns `false` the slot is omitted from the DOM —
   * FilterBar does not apply CSS visibility; it skips rendering entirely.
   *
   * **Constraints**:
   * - Must be a pure function of `ctx` — do not close over mutable state.
   * - Do not perform async work; condition is evaluated synchronously.
   *
   * @param ctx - Condition context forwarded from `FilterBarProps.conditionContext`
   * @returns `true` to show the slot, `false` to hide it
   */
  condition?: (ctx: FilterSlotConditionContext) => boolean;
}

// ---------------------------------------------------------------------------
// Sort props (subset of SortDropdownProps without className)
// ---------------------------------------------------------------------------

/**
 * Controlled sort state passed to FilterBar.
 * Mirrors the `SortDropdown` prop contract so FilterBar can forward these
 * directly to `<SortDropdown>` without an adapter layer.
 */
export interface FilterBarSortProps {
  /**
   * Available sort fields presented in the sort dropdown.
   * Must contain at least one option; FilterBar does not validate this.
   */
  options: SortOption[];

  /**
   * Currently active sort field value. Must match one of the `options[].value`
   * entries for the sort dropdown to show the active indicator correctly.
   */
  sortField: string;

  /**
   * Current sort direction.
   */
  sortOrder: 'asc' | 'desc';

  /**
   * Called when the user selects a new sort field or toggles the direction.
   *
   * @param field - The selected `SortOption.value`
   * @param order - The resulting sort direction
   */
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
}

// ---------------------------------------------------------------------------
// FilterBar props
// ---------------------------------------------------------------------------

/**
 * Full props contract for the FilterBar component.
 *
 * FilterBar renders a horizontal toolbar with three zones:
 *
 * ```
 * [ Search input ] [ ...filterSlots ] [ spacer ] [ Sort dropdown ] [ View toggle ]
 * ```
 *
 * - **Search** (left-anchored, flex-1): controlled text input with clear button.
 * - **Filter slots** (inline, after search): conditional slot components from
 *   `filterSlots`, rendered in array order.
 * - **Sort** (right zone): `SortDropdown` rendered when `sort` prop is provided.
 * - **View toggle** (right zone, after sort): grid/list buttons rendered when
 *   `viewToggle` prop is provided.
 *
 * All zones are optional except search. Pass `undefined` to omit a zone.
 */
export interface FilterBarProps {
  // ── Search ────────────────────────────────────────────────────────────────

  /**
   * Controlled search input value.
   * FilterBar may debounce internally before calling `search.onChange` —
   * consumers should treat `search.onChange` as a debounced signal.
   */
  searchValue: string;

  /**
   * Called when the search value changes (may be debounced).
   *
   * @param value - New search string (empty string on clear)
   */
  onSearchChange: (value: string) => void;

  /**
   * Placeholder text for the search input.
   * Defaults to `"Search…"` when omitted.
   */
  searchPlaceholder?: string;

  /**
   * ARIA label for the search input and its wrapping `role="search"` landmark.
   * Defaults to `"Search"` when omitted. Provide a domain-specific label for
   * better screen-reader context (e.g. `"Search artifacts"`).
   */
  searchAriaLabel?: string;

  // ── Conditional filter slots ──────────────────────────────────────────────

  /**
   * Ordered list of conditional slot descriptors rendered between the search
   * input and the spacer. Each slot's `condition` is evaluated against
   * `conditionContext`; slots whose condition returns `false` are omitted.
   *
   * Pass an empty array (or omit) to render no slots.
   */
  filterSlots?: FilterSlotConfig[];

  /**
   * Context forwarded to every `FilterSlotConfig.condition()` call.
   * Required when `filterSlots` contains any slots with a `condition`.
   * Ignored when no slots define conditions.
   */
  conditionContext?: FilterSlotConditionContext;

  // ── Sort ─────────────────────────────────────────────────────────────────

  /**
   * Sort control configuration. When provided, a `SortDropdown` is rendered
   * in the right zone of the toolbar. Omit to hide the sort control entirely.
   */
  sort?: FilterBarSortProps;

  // ── View toggle ───────────────────────────────────────────────────────────

  /**
   * View toggle configuration. When provided, grid/list toggle buttons are
   * rendered to the right of the sort dropdown.
   * Omit to hide the view toggle entirely.
   */
  viewToggle?: {
    /**
     * Currently active view mode.
     */
    value: 'grid' | 'list';

    /**
     * Called when the user selects a different view mode.
     *
     * @param mode - The newly selected view mode
     */
    onChange: (mode: 'grid' | 'list') => void;

    /**
     * When `false`, both toggle buttons are rendered but non-interactive
     * (disabled state). Useful for surfaces where view switching is
     * contextually unavailable. Defaults to `true`.
     */
    enabled?: boolean;
  };

  // ── Layout ────────────────────────────────────────────────────────────────

  /**
   * Additional CSS class names applied to the outermost container element.
   * Use for per-page layout overrides (padding, border, background).
   */
  className?: string;
}
