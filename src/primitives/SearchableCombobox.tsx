'use client';

import * as React from 'react';
import { cn } from './utils';

export interface SearchableComboboxProps<T> {
  /** Called with search query after debounce (300ms) */
  onSearch: (query: string) => void;
  /** Called when user selects an item */
  onSelect: (item: T) => void;
  /** Render function for each item in the dropdown */
  renderItem: (item: T) => React.ReactNode;
  /** Key extractor for React list rendering */
  getItemKey: (item: T) => string;
  /** Items to display in the dropdown */
  items: T[];
  /** Whether search is in progress */
  loading?: boolean;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Message when no results found */
  emptyMessage?: string;
  /** Label for accessibility */
  'aria-label'?: string;
  /** Additional className for the container */
  className?: string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
}

const DEBOUNCE_MS = 300;

function SearchableComboboxInner<T>(
  props: SearchableComboboxProps<T>,
  _ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    onSearch,
    onSelect,
    renderItem,
    getItemKey,
    items,
    loading = false,
    placeholder = 'Search…',
    emptyMessage = 'No results found',
    'aria-label': ariaLabel,
    className,
    disabled = false,
  } = props;

  const [inputValue, setInputValue] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable unique IDs for ARIA attributes
  const idRef = React.useRef(`combobox-${Math.random().toString(36).slice(2, 9)}`);
  const listboxId = `${idRef.current}-listbox`;
  const getOptionId = (index: number) => `${idRef.current}-option-${index}`;

  // Determine whether the dropdown should show
  const showDropdown = isOpen && !disabled && (loading || items.length > 0 || inputValue.length > 0);

  // Reset highlighted index when items change
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [items]);

  // Click-outside handler
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputValue(value);
      setIsOpen(true);
      setHighlightedIndex(-1);

      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, DEBOUNCE_MS);
    },
    [onSearch]
  );

  const handleInputFocus = React.useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleSelect = React.useCallback(
    (item: T) => {
      onSelect(item);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onSelect]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          setIsOpen(true);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev < items.length - 1 ? prev + 1 : 0;
            return next;
          });
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : items.length - 1;
            return next;
          });
          break;
        }
        case 'Enter': {
          if (highlightedIndex >= 0 && highlightedIndex < items.length) {
            event.preventDefault();
            handleSelect(items[highlightedIndex]);
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        }
        default:
          break;
      }
    },
    [showDropdown, items, highlightedIndex, handleSelect]
  );

  const activedescendant =
    highlightedIndex >= 0 && showDropdown ? getOptionId(highlightedIndex) : undefined;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={activedescendant}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors'
        )}
      />

      {/* Dropdown */}
      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ? `${ariaLabel} options` : 'Options'}
          className={cn(
            'absolute z-50 mt-1 max-h-64 w-full overflow-auto',
            'rounded-md border border-border bg-popover text-popover-foreground shadow-md',
            'py-1'
          )}
        >
          {loading ? (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground" role="option" aria-selected={false}>
              {/* Inline spinner — no external dependency */}
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
              />
              Searching…
            </li>
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground" role="option" aria-selected={false} aria-disabled="true">
              {emptyMessage}
            </li>
          ) : (
            items.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={getItemKey(item)}
                  id={getOptionId(index)}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={(e) => {
                    // Prevent blur on the input before the click is processed
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm',
                    'select-none outline-none',
                    isHighlighted
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                >
                  {renderItem(item)}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

// Generic forwardRef workaround — TypeScript requires this pattern for generic components
const SearchableCombobox = React.forwardRef(SearchableComboboxInner) as <T>(
  props: SearchableComboboxProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null;

export { SearchableCombobox };
