'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, CheckCircle2, Package, Search, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../primitives/Badge';
import { Input } from '../primitives/Input';
import { ScrollArea } from '../primitives/ScrollArea';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../primitives/Dialog';
import { useDebounce } from '../hooks/use-debounce';
import { useIntersectionObserver } from '../hooks/use-intersection-observer';
import { cn } from '../primitives/utils';
import { EntityPickerViewToggle, ViewMode } from './EntityPickerViewToggle';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/**
 * Normalized result shape returned by each tab's `useData` hook.
 * Callers wrap their query hooks to conform to this interface.
 */
export interface InfiniteDataResult<T> {
  /** Flat list of items loaded so far across all pages */
  items: T[];
  /** True while the first page is loading */
  isLoading: boolean;
  /** True when more pages are available */
  hasNextPage: boolean;
  /** Trigger loading the next page */
  fetchNextPage: () => void;
  /** True while a subsequent page is loading */
  isFetchingNextPage: boolean;
}

/**
 * Definition for a single tab inside EntityPickerDialog.
 *
 * @template T - The entity type rendered within this tab
 */
export interface EntityPickerTab<T> {
  /** Unique stable identifier for this tab */
  id: string;
  /** Human-readable label rendered in the tab strip */
  label: string;
  /** Lucide-compatible icon component shown beside the label */
  icon: React.ComponentType<{ className?: string }>;
  /**
   * React hook that returns paginated data for this tab.
   *
   * **Important**: This is called as a hook by TabContent — it MUST follow
   * the Rules of Hooks (called unconditionally at the top of a render function).
   * Do not call this inside conditionals, loops, or callbacks.
   *
   * ESLint cannot detect this as a hook via static analysis because it is stored
   * as an interface field. Callers and implementors are responsible for ensuring
   * compliance with the Rules of Hooks.
   */
  useData: (params: { search: string; typeFilter?: string[] }) => InfiniteDataResult<T>;
  /**
   * Renders a single list card.
   * @param item - The entity to render
   * @param isSelected - Whether this entity is in the current selection
   */
  renderCard: (item: T, isSelected: boolean) => React.ReactNode;
  /** Extracts the stable entity identifier used for selection tracking */
  getId: (item: T) => string;
  /** Optional type filter pill definitions shown below the search bar */
  typeFilters?: {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  /**
   * Optional base type constraint always applied before user pill selections.
   *
   * When set, the effective filter passed to `useData` is:
   * - The active pill selection when the user toggles pills (caller must ensure
   *   `typeFilters` values are a subset of `allowedTypes`).
   * - `allowedTypes` itself when no pills are active (i.e. show all allowed types).
   * - `undefined` when both `allowedTypes` is absent and no pills are active.
   *
   * This removes the need for each `useData` implementation to manually merge a
   * base type constraint with the user's pill selection.
   */
  allowedTypes?: string[];
}

/**
 * Props for EntityPickerDialog.
 *
 * @template T - The entity type handled by the active tab
 */
export interface EntityPickerDialogProps<T = unknown> {
  /** Controls dialog visibility */
  open: boolean;
  /** Called when the dialog requests open state change */
  onOpenChange: (open: boolean) => void;
  /** One or more tabs defining entity types the user can pick from */
  tabs: EntityPickerTab<T>[];
  /** Single-select closes on first pick; multi-select accumulates until "Done" */
  mode: 'single' | 'multi';
  /**
   * Controlled selection value.
   * - `'single'` mode: a single entity ID string (or empty string for none)
   * - `'multi'` mode: an array of entity ID strings
   */
  value: string | string[];
  /**
   * Called when the selection commits.
   * Receives the same shape as `value`.
   */
  onChange: (value: string | string[]) => void;
  /** Dialog title shown in the header */
  title?: string;
  /** Supplementary description shown below the title */
  description?: string;
  /**
   * IDs of entities that already exist in the target context (e.g. already
   * members of a group or set). Items whose ID appears here are rendered with a
   * green checkmark badge, dimmed, and made non-clickable. They are never added
   * to the pending selection. Defaults to empty (no items blocked).
   *
   * Contrast with `excludeIds`: `existingIds` keeps items visible (with a
   * disabled overlay) so the user can see what is already selected; `excludeIds`
   * removes items from the list entirely.
   */
  existingIds?: string[];
  /**
   * IDs of entities that must be hidden entirely from every tab (e.g. the
   * entity being edited, to prevent circular self-references). Items whose ID
   * appears here are filtered out at the display layer — they are never shown
   * to the user regardless of which tab is active. Defaults to empty.
   *
   * Contrast with `existingIds`: `existingIds` keeps items visible with a
   * disabled green overlay; `excludeIds` removes them from the list completely.
   */
  excludeIds?: string[];
  /**
   * Optional single-click-to-add callback.
   *
   * When provided, the dialog operates in instant-add mode: clicking a
   * non-existing item fires this callback immediately with the full item object,
   * shows a brief green success flash (~200ms), and keeps the dialog open.
   * The multi-select accumulator and footer are suppressed in this mode.
   *
   * Items in existingIds are always disabled and never trigger this callback.
   * When absent, the existing multi-select + Done button pattern is unchanged.
   * The two modes are mutually exclusive.
   */
  onItemSelect?: (item: T) => void;
}

/**
 * Props for EntityPickerTrigger.
 */
export interface EntityPickerTriggerProps {
  /** Accessible label and button text used as the field caption */
  label: string;
  /** Current selection value (mirrors EntityPickerDialogProps.value) */
  value: string | string[];
  /** Named items for selected IDs — used to render display names and remove badges */
  items?: { id: string; name: string }[];
  /** Must match the mode of the companion EntityPickerDialog */
  mode: 'single' | 'multi';
  /** Called when the user clicks the trigger to open the picker dialog */
  onClick: () => void;
  /**
   * Multi-mode only: called when the user removes an individual item badge.
   * @param id - The entity ID to remove
   */
  onRemove?: (id: string) => void;
  /** Placeholder text shown when nothing is selected */
  placeholder?: string;
  /** Disables all interactions */
  disabled?: boolean;
  /** Additional CSS classes for the outermost wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

/** Grid or list of skeleton cards shown during initial data load */
function GridSkeleton({ count = 6, viewMode = 'grid' }: { count?: number; viewMode?: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div
        className="flex flex-col gap-1.5"
        aria-label="Loading items"
        aria-busy="true"
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border p-2.5"
          >
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      aria-label="Loading items"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex min-w-[140px] flex-col gap-2 rounded-lg border border-l-[3px] border-l-muted p-3"
        >
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 rounded" />
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
          <div className="mt-auto pt-1">
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty state shown when item list is empty after loading */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-9 w-9 text-muted-foreground/30" aria-hidden="true" />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** Inline search input with search icon and clear button */
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function SearchInput({ value, onChange, placeholder = 'Search\u2026' }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount (dialog already traps focus; this targets the input specifically)
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 rounded-sm',
            'text-muted-foreground hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Toggleable type-filter pill row */
interface TypeFilterPillsProps {
  filters: NonNullable<EntityPickerTab<unknown>['typeFilters']>;
  active: Set<string>;
  onToggle: (value: string) => void;
}

function TypeFilterPills({ filters, active, onToggle }: TypeFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
      {filters.map(({ value, label, icon: Icon }) => {
        const isActive = active.has(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground',
            )}
          >
            {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content inner component — handles data fetching + rendering per tab
// ---------------------------------------------------------------------------

interface TabContentProps<T> {
  tab: EntityPickerTab<T>;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  /** Announcement text for the aria-live region (updates on selection change) */
  liveAnnouncement: string;
  onAnnounce: (text: string) => void;
  /** Set of IDs that are already present in the target context and cannot be re-selected */
  existingIds: Set<string>;
  /**
   * Set of IDs to hide entirely from the rendered list (display-layer filter).
   * Applied after data fetching — the query is unaffected.
   */
  excludeIds: Set<string>;
  /** Grid or list layout for item display */
  viewMode: ViewMode;
  /**
   * When provided, clicking a non-existing item fires this callback immediately
   * and shows a transient green success flash instead of toggling selection state.
   */
  onItemSelect?: (item: T) => void;
}

function TabContent<T>({ tab, selectedIds, onSelect, liveAnnouncement, onAnnounce, existingIds, excludeIds, viewMode, onItemSelect }: TabContentProps<T>) {
  const [search, setSearch] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string>>(new Set());
  // Tracks which card ID was most recently selected, for selection animation
  const [recentlySelected, setRecentlySelected] = useState<string | null>(null);
  // Grid container ref for arrow-key navigation
  const gridRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 300);

  const toggleTypeFilter = useCallback((value: string) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const effectiveTypeFilter: string[] | undefined =
    activeTypeFilters.size > 0
      ? Array.from(activeTypeFilters)
      : (tab.allowedTypes?.length ? tab.allowedTypes : undefined);

  const { items: rawItems, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = tab.useData({
    search: debouncedSearch,
    typeFilter: effectiveTypeFilter,
  });

  // Display-layer filter: hide items whose ID is in excludeIds entirely.
  // This does not affect the underlying query — pagination and fetching are unchanged.
  const items = React.useMemo(
    () => excludeIds.size > 0 ? rawItems.filter((item) => !excludeIds.has(tab.getId(item))) : rawItems,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawItems, excludeIds, tab.getId],
  );

  // Infinite scroll sentinel
  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px',
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  useEffect(() => {
    if (isIntersecting) {
      fetchNextPage();
    }
  }, [isIntersecting, fetchNextPage]);

  // Clear selection animation after 200ms
  useEffect(() => {
    if (recentlySelected) {
      const timer = setTimeout(() => setRecentlySelected(null), 200);
      return () => clearTimeout(timer);
    }
  }, [recentlySelected]);

  // Tracks which card just had an instant-add success flash
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  // Clear instant-add success flash after 200ms
  useEffect(() => {
    if (recentlyAdded) {
      const timer = setTimeout(() => setRecentlyAdded(null), 200);
      return () => clearTimeout(timer);
    }
  }, [recentlyAdded]);

  const handleSelect = useCallback(
    (id: string, name: string) => {
      setRecentlySelected(id);
      onSelect(id);
      const willBeSelected = !selectedIds.has(id);
      onAnnounce(willBeSelected ? `${name} selected` : `${name} deselected`);
    },
    [onSelect, onAnnounce, selectedIds],
  );

  // O(1) lookup map: id -> item — used by handleInstantAdd to retrieve the full object
  const itemById = React.useMemo(() => {
    const map = new Map<string, T>();
    for (const item of items) {
      map.set(tab.getId(item), item);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tab.getId]);

  const handleInstantAdd = useCallback(
    (id: string, name: string) => {
      const item = itemById.get(id);
      if (!item || !onItemSelect) return;
      setRecentlyAdded(id);
      onItemSelect(item);
      onAnnounce(`${name} added`);
    },
    [itemById, onItemSelect, onAnnounce],
  );

  const isInstantAddMode = !!onItemSelect;

  /** Arrow-key navigation: move focus between grid card elements */
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!gridRef.current) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      const cards = Array.from(
        gridRef.current.querySelectorAll<HTMLElement>('[data-picker-card]'),
      );
      const focused = document.activeElement as HTMLElement;
      const currentIndex = cards.indexOf(focused);
      if (currentIndex === -1) return;

      e.preventDefault();

      // Determine columns count from computed style
      const gridStyle = window.getComputedStyle(gridRef.current);
      const colCount = gridStyle.gridTemplateColumns.split(' ').length || 2;

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') nextIndex = currentIndex + 1;
      else if (e.key === 'ArrowLeft') nextIndex = currentIndex - 1;
      else if (e.key === 'ArrowDown') nextIndex = currentIndex + colCount;
      else if (e.key === 'ArrowUp') nextIndex = currentIndex - colCount;

      const target = nextIndex >= 0 && nextIndex < cards.length ? cards[nextIndex] : undefined;
      target?.focus();
    },
    [],
  );

  const isEmpty = !isLoading && items.length === 0;
  const hasTypeFilters = !!tab.typeFilters && tab.typeFilters.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* aria-live region: always mounted so screen readers register it before any announcement fires */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder={`Search ${tab.label.toLowerCase()}\u2026`} />

      {hasTypeFilters && tab.typeFilters && (
        <TypeFilterPills
          filters={tab.typeFilters}
          active={activeTypeFilters}
          onToggle={toggleTypeFilter}
        />
      )}

      <ScrollArea className="h-[min(400px,50vh)]">
        {isLoading ? (
          <GridSkeleton count={8} viewMode={viewMode} />
        ) : isEmpty ? (
          <EmptyState
            message={
              debouncedSearch || activeTypeFilters.size > 0
                ? 'No results match your filters'
                : `No ${tab.label.toLowerCase()} found`
            }
          />
        ) : (
          <>
            <div
              ref={gridRef}
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 gap-3 sm:grid-cols-3'
                  : 'flex flex-col gap-1.5',
              )}
              role="listbox"
              aria-label={tab.label}
              aria-multiselectable="true"
              onKeyDown={handleGridKeyDown}
            >
              {items.map((item) => {
                const id = tab.getId(item);
                const isSelected = selectedIds.has(id);
                const isAnimating = recentlySelected === id;
                const isExisting = existingIds.has(id);
                return (
                  <div
                    key={id}
                    data-picker-card
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isExisting ? true : undefined}
                    aria-description={isExisting ? 'Already added' : undefined}
                    className={cn(
                      'relative rounded-lg',
                      viewMode === 'grid' && 'min-w-[180px]',
                      isExisting
                        ? 'cursor-default opacity-60'
                        : 'cursor-pointer',
                      // Focus ring: apply to all focusable items; existing items still
                      // receive focus so keyboard users can discover what is already added.
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      // Selection flash animation on pick
                      !isExisting && isAnimating && 'animate-picker-flash',
                    )}
                    onClick={isExisting ? undefined : () => {
                      // Derive display name: prefer aria-label on the card element, then
                      // first visible text content, then fall back to the raw id.
                      const el = gridRef.current?.querySelector<HTMLElement>(`[data-picker-card-id="${id}"]`);
                      const name = el?.getAttribute('aria-label') ?? el?.textContent?.trim().split('\n')[0] ?? id;
                      if (isInstantAddMode) {
                        handleInstantAdd(id, name);
                      } else {
                        handleSelect(id, name);
                      }
                    }}
                    onKeyDown={isExisting ? undefined : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const el = gridRef.current?.querySelector<HTMLElement>(`[data-picker-card-id="${id}"]`);
                        const name = el?.getAttribute('aria-label') ?? el?.textContent?.trim().split('\n')[0] ?? id;
                        if (isInstantAddMode) {
                          handleInstantAdd(id, name);
                        } else {
                          handleSelect(id, name);
                        }
                      }
                    }}
                    tabIndex={0}
                    data-picker-card-id={id}
                  >
                    {tab.renderCard(item, isSelected)}
                    {/* "Already exists" overlay — green checkmark badge, non-interactive */}
                    {isExisting && (
                      <div
                        className="pointer-events-none absolute inset-0 flex items-start justify-end rounded-lg p-1.5"
                        aria-hidden="true"
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full',
                            'bg-emerald-500 text-white shadow-sm',
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}
                    {/* Instant-add success flash — transient green overlay (~200ms) */}
                    {!isExisting && isInstantAddMode && recentlyAdded === id && (
                      <>
                        <div
                          className="pointer-events-none absolute inset-0 rounded-lg bg-emerald-500/15 transition-opacity duration-200"
                          aria-hidden="true"
                        />
                        <span
                          className={cn(
                            'pointer-events-none absolute right-2 top-2 z-10',
                            'flex h-5 w-5 items-center justify-center rounded-full',
                            'bg-emerald-500 text-white shadow-sm',
                            'transition-opacity duration-200',
                          )}
                          aria-hidden="true"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <div
                          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-emerald-500 ring-offset-1 transition-opacity duration-200"
                          aria-hidden="true"
                        />
                      </>
                    )}
                    {/* Selection checkmark overlay — WCAG color-not-alone (standard multi-select) */}
                    {!isExisting && !isInstantAddMode && isSelected && (
                      <span
                        className={cn(
                          'pointer-events-none absolute right-2 top-2 z-10',
                          'flex h-5 w-5 items-center justify-center rounded-full',
                          'bg-primary text-primary-foreground shadow-sm',
                        )}
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                    {/* Selection ring overlay (standard multi-select) */}
                    {!isExisting && !isInstantAddMode && isSelected && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-1"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inline skeleton row during pagination fetch */}
            {isFetchingNextPage && (
              <div className="mt-2">
                <GridSkeleton count={4} viewMode={viewMode} />
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasNextPage && !isFetchingNextPage && (
              <div ref={targetRef} className="h-4" aria-hidden="true" />
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EntityPickerDialog
// ---------------------------------------------------------------------------

/**
 * EntityPickerDialog — Generic tabbed entity picker dialog.
 *
 * Supports an arbitrary number of tabs, each backed by its own data hook.
 * In `single` mode, selecting an entity immediately commits the change and
 * closes the dialog. In `multi` mode, selections accumulate and are committed
 * when the user clicks "Done".
 *
 * Features:
 * - Tabbed navigation with icons
 * - Per-tab search with 300ms debounce
 * - Optional type filter pills per tab
 * - Infinite scroll via `useIntersectionObserver`
 * - Skeleton loading + empty state
 * - Selection ring overlay on picked cards
 * - WCAG 2.1 AA: keyboard navigation, ARIA labels, focus management
 *
 * @example
 * ```tsx
 * <EntityPickerDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   tabs={[artifactTab]}
 *   mode="multi"
 *   value={selectedIds}
 *   onChange={setSelectedIds}
 *   title="Select Artifacts"
 * />
 * ```
 */
export function EntityPickerDialog<T = unknown>({
  open,
  onOpenChange,
  tabs,
  mode,
  value,
  onChange,
  title = 'Select',
  description,
  existingIds,
  excludeIds,
  onItemSelect,
}: EntityPickerDialogProps<T>) {
  const existingIdsSet = React.useMemo(
    () => new Set(existingIds ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existingIds?.join(',')],
  );
  const excludeIdsSet = React.useMemo(
    () => new Set(excludeIds ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludeIds?.join(',')],
  );
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? '');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Internal multi-select accumulator; for single mode we bypass this
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(new Set());

  // Screen-reader live announcement (selection changes)
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Sync pendingSelection from external value when dialog opens
  useEffect(() => {
    if (open) {
      const ids = Array.isArray(value) ? value : value ? [value] : [];
      setPendingSelection(new Set(ids));
      setActiveTabId(tabs[0]?.id ?? '');
      setLiveAnnouncement('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (id: string) => {
      if (mode === 'single') {
        onChange(id);
        onOpenChange(false);
      } else {
        setPendingSelection((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      }
    },
    [mode, onChange, onOpenChange],
  );

  const handleDone = useCallback(() => {
    if (mode === 'multi') {
      onChange(Array.from(pendingSelection));
    }
    onOpenChange(false);
  }, [mode, onChange, onOpenChange, pendingSelection]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // In instant-add mode the footer (selection count, Cancel, Done) is hidden
  const isInstantAddMode = !!onItemSelect;

  if (tabs.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[85vh] !grid-rows-[auto_1fr] overflow-hidden"
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex-1">{title}</DialogTitle>
            <EntityPickerViewToggle value={viewMode} onChange={setViewMode} />
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Tabs
          value={activeTabId}
          onValueChange={setActiveTabId}
          className="mt-1 min-h-0 overflow-hidden flex flex-col"
        >
          {/* Tab strip */}
          <TabsList
            className={cn('grid w-full', `grid-cols-${tabs.length}`)}
            aria-label="Entity type"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab panels */}
          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="mt-3 focus-visible:outline-none flex flex-col min-h-0"
            >
              <TabContent
                tab={tab}
                selectedIds={pendingSelection}
                onSelect={handleSelect}
                liveAnnouncement={liveAnnouncement}
                onAnnounce={setLiveAnnouncement}
                existingIds={existingIdsSet}
                excludeIds={excludeIdsSet}
                viewMode={viewMode}
                onItemSelect={onItemSelect}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer actions — hidden in instant-add mode */}
        {!isInstantAddMode && <div className="flex items-center justify-between pt-1">
          {mode === 'multi' && (
            <span className="text-sm text-muted-foreground">
              {pendingSelection.size > 0
                ? `${pendingSelection.size} selected`
                : 'Nothing selected'}
            </span>
          )}
          <div className={cn('flex gap-2', mode === 'single' && 'ml-auto')}>
            {mode === 'multi' && (
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            )}
            <Button variant="outline" onClick={handleDone}>
              Done
            </Button>
          </div>
        </div>}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EntityPickerTrigger
// ---------------------------------------------------------------------------

/**
 * EntityPickerTrigger — Button/field trigger that opens an EntityPickerDialog.
 *
 * Renders a form-field-height button showing the current selection. In
 * `single` mode it shows the selected item name (or placeholder). In `multi`
 * mode it shows removable badge chips and a count summary.
 *
 * @example Single mode
 * ```tsx
 * <EntityPickerTrigger
 *   label="Primary Agent"
 *   value={selectedId}
 *   items={[{ id: selectedId, name: 'My Agent' }]}
 *   mode="single"
 *   onClick={() => setPickerOpen(true)}
 *   placeholder="Select an agent..."
 * />
 * ```
 *
 * @example Multi mode
 * ```tsx
 * <EntityPickerTrigger
 *   label="Supporting Skills"
 *   value={selectedIds}
 *   items={resolvedItems}
 *   mode="multi"
 *   onClick={() => setPickerOpen(true)}
 *   onRemove={(id) => setSelectedIds((prev) => prev.filter((x) => x !== id))}
 * />
 * ```
 */
export function EntityPickerTrigger({
  label,
  value,
  items = [],
  mode,
  onClick,
  onRemove,
  placeholder = 'Select\u2026',
  disabled = false,
  className,
}: EntityPickerTriggerProps) {
  // Normalize value to array for internal logic
  const selectedIds: string[] = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const itemMap = new Map(items.map((i) => [i.id, i.name]));

  // Single-mode display
  if (mode === 'single') {
    const selectedId = selectedIds[0];
    const selectedName = selectedId ? (itemMap.get(selectedId) ?? selectedId.slice(0, 8)) : null;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <span className="text-sm font-medium leading-none">{label}</span>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onClick}
          disabled={disabled}
          aria-label={
            label
              ? selectedName
                ? `${label}: ${selectedName}`
                : `${label}: ${placeholder}`
              : (selectedName ?? placeholder)
          }
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 px-3 font-normal',
            !selectedName && 'text-muted-foreground',
          )}
        >
          <span className="flex-1 truncate text-left text-sm" aria-hidden="true">
            {selectedName ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  // Multi-mode display
  const count = selectedIds.length;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium leading-none">{label}</span>
      )}

      {/* Trigger button */}
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        aria-label={`${label ?? 'Picker'}: ${count > 0 ? `${count} selected` : placeholder}`}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 px-3 font-normal',
          count === 0 && 'text-muted-foreground',
        )}
      >
        <span className="flex items-center gap-1.5 text-sm">
          {count > 0 ? (
            <>
              <span
                className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
                aria-label={`${count} selected`}
              >
                {count}
              </span>
              <span>selected</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Button>

      {/* Removable badges for each selected item */}
      {count > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          role="list"
          aria-label={`${label ?? 'Selected'} items`}
        >
          {selectedIds.map((id) => {
            const name = itemMap.get(id) ?? id.slice(0, 8);
            return (
              <Badge
                key={id}
                variant="secondary"
                className="flex items-center gap-1 pr-1 text-xs"
                role="listitem"
              >
                <span className="max-w-[140px] truncate">{name}</span>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(id);
                    }}
                    disabled={disabled}
                    aria-label={`Remove ${name}`}
                    className={cn(
                      'ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full',
                      'text-muted-foreground transition-colors',
                      'hover:bg-foreground/10 hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <X className="h-2.5 w-2.5" aria-hidden="true" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
