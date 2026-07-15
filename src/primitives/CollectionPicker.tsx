'use client';

/**
 * CollectionPicker — @miethe/ui primitive
 *
 * A self-contained collection selection control for use inside creation
 * dialogs. Renders a searchable combobox to pick which collection an artifact
 * belongs to, with optional collapsible wrapping and auto-select when only one
 * collection is available.
 *
 * The component is purely presentational: it accepts a pre-fetched `collections`
 * list and delegates selection state upward via `onChange`. Pre-filling from the
 * active collection context is the consumer's responsibility (pass the resolved
 * ID as `defaultCollectionId`).
 *
 * @example Basic usage
 * ```tsx
 * <CollectionPicker
 *   config={{ enabled: true, required: true, collapsible: true }}
 *   collections={collections}
 *   value={selectedId}
 *   onChange={setSelectedId}
 *   defaultCollectionId={currentCollectionId}
 * />
 * ```
 */

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronRight, Library } from 'lucide-react';
import { SearchableCombobox } from './SearchableCombobox';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for the collection picker section embedded in creation dialogs.
 *
 * Mirrors `CollectionPickerConfig` from `skillmeat/web/lib/entity-form-schema.ts`.
 * Defined locally to keep the @miethe/ui package self-contained.
 */
export interface CollectionPickerConfig {
  /** Show the collection picker section */
  enabled: boolean;
  /**
   * Whether selecting a collection is mandatory before submitting.
   * @default true
   */
  required?: boolean;
  /**
   * Whether the picker section can be collapsed by the user.
   * @default true
   */
  collapsible?: boolean;
  /** Pre-select a specific collection when the dialog opens */
  defaultCollectionId?: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
}

export interface CollectionPickerProps {
  /** Schema-driven configuration from the parent EntityFormSchema */
  config: CollectionPickerConfig;
  /** Currently selected collection ID (controlled) */
  value?: string;
  /** Called when the user selects a collection */
  onChange: (collectionId: string) => void;
  /**
   * Override for the pre-filled default collection. When provided, the picker
   * auto-selects this collection on mount (if not already controlled).
   * Consumers should resolve this from `useCollectionContext()` before passing.
   */
  defaultCollectionId?: string;
  /** Full list of available collections to pick from */
  collections: CollectionItem[];
  /** Optional extra CSS class for the root container */
  className?: string;
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Filter collections by a search query (case-insensitive name/description match) */
function filterCollections(items: CollectionItem[], query: string): CollectionItem[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      (c.description?.toLowerCase().includes(lower) ?? false)
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface CollectionComboboxProps {
  collections: CollectionItem[];
  value?: string;
  onChange: (id: string) => void;
  required: boolean;
  disabled: boolean;
  labelId: string;
}

function CollectionCombobox({
  collections,
  value,
  onChange,
  required,
  disabled,
  labelId,
}: CollectionComboboxProps) {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => filterCollections(collections, query), [collections, query]);

  const selectedCollection = value ? collections.find((c) => c.id === value) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Selected value display */}
      {selectedCollection && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2',
            'text-sm text-foreground'
          )}
          aria-live="polite"
        >
          <Library className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-medium">{selectedCollection.name}</span>
          {selectedCollection.description && (
            <span className="truncate text-muted-foreground">
              &mdash; {selectedCollection.description}
            </span>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setQuery('');
              }}
              className={cn(
                'ml-auto shrink-0 rounded-sm text-muted-foreground',
                'hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              )}
              aria-label="Clear collection selection"
            >
              <span aria-hidden="true" className="text-xs leading-none">
                &times;
              </span>
            </button>
          )}
        </div>
      )}

      {/* Searchable combobox — hidden when read-only (single collection auto-selected) */}
      {!disabled && (
        <SearchableCombobox<CollectionItem>
          items={filtered}
          onSearch={setQuery}
          onSelect={(item) => {
            onChange(item.id);
            setQuery('');
          }}
          renderItem={(item) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{item.name}</span>
              {item.description && (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              )}
            </div>
          )}
          getItemKey={(item) => item.id}
          placeholder="Search collections…"
          emptyMessage="No matching collections"
          aria-label="Select collection"
          aria-required={required}
          aria-labelledby={labelId}
        />
      )}

      {/* Read-only notice when only 1 collection is available */}
      {disabled && !selectedCollection && (
        <p className="text-xs text-muted-foreground">No collections available.</p>
      )}
    </div>
  );
}

// ============================================================================
// CollectionPicker
// ============================================================================

export function CollectionPicker({
  config,
  value,
  onChange,
  defaultCollectionId,
  collections,
  className,
}: CollectionPickerProps) {
  const required = config.required ?? true;
  const collapsible = config.collapsible ?? true;

  // Auto-select: apply defaultCollectionId on first render if no value is set
  const hasAppliedDefault = React.useRef(false);
  React.useEffect(() => {
    if (!hasAppliedDefault.current && !value && defaultCollectionId) {
      const match = collections.find((c) => c.id === defaultCollectionId);
      if (match) {
        onChange(defaultCollectionId);
      }
      hasAppliedDefault.current = true;
    }
  }, [value, defaultCollectionId, collections, onChange]);

  // When only one collection exists, auto-select and render read-only
  const isSingleCollection = collections.length === 1;
  React.useEffect(() => {
    if (isSingleCollection && !value && collections[0]) {
      onChange(collections[0].id);
    }
  }, [isSingleCollection, value, collections, onChange]);

  // Collapsible open state — starts open when a value is already set
  const [isOpen, setIsOpen] = React.useState(() => !collapsible || Boolean(value));
  React.useEffect(() => {
    // Open automatically if a default gets applied
    if (value && collapsible && !isOpen) {
      setIsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Stable ID for aria-labelledby wiring
  const labelId = React.useId();

  const combobox = (
    <CollectionCombobox
      collections={collections}
      value={value}
      onChange={onChange}
      required={required}
      disabled={isSingleCollection}
      labelId={labelId}
    />
  );

  // ── Non-collapsible layout ──────────────────────────────────────────────────
  if (!collapsible) {
    return (
      <section
        className={cn('flex flex-col gap-2 rounded-lg border border-border p-4', className)}
        aria-label="Collection selection"
      >
        <SectionLabel id={labelId} required={required} />
        {combobox}
      </section>
    );
  }

  // ── Collapsible layout ──────────────────────────────────────────────────────
  return (
    <CollapsiblePrimitive.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('rounded-lg border border-border', className)}
    >
      <CollapsiblePrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between px-4 py-3 text-sm font-medium',
            'rounded-t-lg text-left',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            'transition-colors',
            !isOpen && 'rounded-b-lg'
          )}
          aria-expanded={isOpen}
          aria-controls={`${labelId}-content`}
        >
          <SectionLabel id={labelId} required={required} asSpan />
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </CollapsiblePrimitive.Trigger>

      <CollapsiblePrimitive.Content
        id={`${labelId}-content`}
        className={cn(
          'overflow-hidden px-4 pb-4 pt-1',
          'data-[state=open]:animate-collapsible-down',
          'data-[state=closed]:animate-collapsible-up'
        )}
      >
        {combobox}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}

// ============================================================================
// SectionLabel — renders as <label> or <span> depending on context
// ============================================================================

interface SectionLabelProps {
  id: string;
  required: boolean;
  /** When true renders a <span> (for use inside a <button>) */
  asSpan?: boolean;
}

function SectionLabel({ id, required, asSpan = false }: SectionLabelProps) {
  const content = (
    <>
      <Library className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>
        Collection
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </span>
    </>
  );

  if (asSpan) {
    return (
      <span id={id} className="flex items-center gap-2 font-medium">
        {content}
      </span>
    );
  }

  return (
    <label id={id} className="flex items-center gap-2 text-sm font-medium">
      {content}
    </label>
  );
}
