'use client';

import * as React from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './Dialog';
import { Input } from './Input';
import { cn } from './utils';

export interface SearchablePickerDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function SearchablePickerDialogInner<T>(
  props: SearchablePickerDialogProps<T>,
  _ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    open,
    onOpenChange,
    title,
    searchPlaceholder = 'Search…',
    emptyMessage = 'No items found',
    items,
    renderItem,
    getItemId,
    getItemLabel,
    onConfirm,
    onCancel,
    isLoading = false,
  } = props;

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIds(new Set());
    }
  }, [open]);

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const lower = searchQuery.toLowerCase();
    return items.filter((item) => getItemLabel(item).toLowerCase().includes(lower));
  }, [items, searchQuery, getItemLabel]);

  const allFilteredIds = React.useMemo(
    () => filteredItems.map(getItemId),
    [filteredItems, getItemId]
  );

  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  const toggleItem = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = React.useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allFilteredIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allFilteredIds]);

  const clearAll = React.useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allFilteredIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [allFilteredIds]);

  const handleConfirm = React.useCallback(() => {
    onConfirm(Array.from(selectedIds));
  }, [selectedIds, onConfirm]);

  const handleCancel = React.useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    },
    [handleCancel]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] w-full max-w-md flex-col gap-0 p-0"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="border-b px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label={searchPlaceholder}
              autoFocus
            />
          </div>
        </div>

        {/* Select all / Clear all toolbar */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <button
              type="button"
              onClick={allSelected ? clearAll : selectAll}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
            {selectedIds.size > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        )}

        {/* Item list */}
        <div
          className="flex-1 overflow-y-auto px-4 py-2"
          role="list"
          aria-label={title}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <span
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
              />
              Loading…
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            filteredItems.map((item) => {
              const id = getItemId(item);
              const isSelected = selectedIds.has(id);
              return (
                <div
                  key={id}
                  role="listitem"
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent/50'
                  )}
                  onClick={() => toggleItem(id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleItem(id);
                    }
                  }}
                  tabIndex={0}
                  aria-selected={isSelected}
                >
                  {isSelected ? (
                    <CheckSquare
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <Square
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <span className="min-w-0 flex-1">{renderItem(item)}</span>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <button
            type="button"
            onClick={handleCancel}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm font-medium',
              'bg-background hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors'
            )}
          >
            Confirm
            {selectedIds.size > 0 && (
              <span className="ml-1.5 tabular-nums">({selectedIds.size})</span>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Generic forwardRef workaround — same pattern as SearchableCombobox
const SearchablePickerDialog = React.forwardRef(SearchablePickerDialogInner) as <T>(
  props: SearchablePickerDialogProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null;

export { SearchablePickerDialog };
