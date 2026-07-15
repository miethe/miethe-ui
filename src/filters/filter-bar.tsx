'use client';

import * as React from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { Input } from '../primitives/Input';
import { cn } from '../primitives/utils';
import type {
  FilterBarProps,
  FilterSlotConditionContext,
  FilterSlotConfig,
} from './filter-slot-config';
import { SortDropdown } from './sort-dropdown';

// ---------------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------------

interface ViewToggleProps {
  value: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
  enabled?: boolean;
}

const VIEW_MODES: Array<{
  value: 'grid' | 'list';
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  label: string;
}> = [
  { value: 'grid', Icon: LayoutGrid, label: 'Grid view' },
  { value: 'list', Icon: List, label: 'List view' },
];

function ViewToggle({ value, onChange, enabled = true }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex rounded-md border border-input bg-background p-0.5 shadow-sm"
    >
      {VIEW_MODES.map(({ value: modeValue, Icon, label }) => {
        const isActive = value === modeValue;
        return (
          <button
            key={modeValue}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            disabled={!enabled}
            onClick={() => onChange(modeValue)}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'disabled:pointer-events-none disabled:opacity-50',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slot visibility predicate
// ---------------------------------------------------------------------------

function isSlotVisible(
  slot: FilterSlotConfig,
  conditionContext: FilterSlotConditionContext | undefined
): boolean {
  if (!slot.condition) return true;
  if (conditionContext === undefined) return false;
  return slot.condition(conditionContext);
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

/**
 * Horizontal toolbar with four zones (left → right):
 *
 * 1. Search input  — always rendered
 * 2. Filter slots  — conditional, driven by `filterSlots[]`
 * 3. Sort dropdown — rendered when `sort` prop is provided
 * 4. View toggle   — rendered when `viewToggle` prop is provided and `enabled !== false`
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchAriaLabel = 'Search',
  filterSlots,
  conditionContext,
  sort,
  viewToggle,
  className,
}: FilterBarProps) {
  const visibleSlots = React.useMemo(
    () => (filterSlots ?? []).filter((slot) => isSlotVisible(slot, conditionContext)),
    [filterSlots, conditionContext]
  );

  const showViewToggle =
    viewToggle !== undefined && viewToggle.enabled !== false;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        className
      )}
    >
      {/* Zone 1: Search input */}
      <div role="search" aria-label={searchAriaLabel} className="relative min-w-[200px] flex-1">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          className="pl-9"
        />
      </div>

      {/* Zone 2: Conditional filter slots */}
      {visibleSlots.map((slot) => (
        <div key={slot.id} aria-label={slot.label}>
          {slot.component}
        </div>
      ))}

      {/* Spacer — pushes sort + view toggle to the right when slots are sparse */}
      <div className="flex-1" aria-hidden="true" />

      {/* Zone 3: Sort dropdown */}
      {sort !== undefined && (
        <SortDropdown
          options={sort.options}
          sortField={sort.sortField}
          sortOrder={sort.sortOrder}
          onSortChange={sort.onSortChange}
        />
      )}

      {/* Zone 4: View toggle */}
      {showViewToggle && (
        <ViewToggle
          value={viewToggle.value}
          onChange={viewToggle.onChange}
          enabled={viewToggle.enabled}
        />
      )}
    </div>
  );
}

FilterBar.displayName = 'FilterBar';
