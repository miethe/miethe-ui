'use client';

import * as React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from './utils';

export interface ViewModeToggleProps {
  mode: 'card' | 'table';
  onChange: (mode: 'card' | 'table') => void;
  /** localStorage key for persistence. When set, the current mode is saved on change and read on mount. */
  persistKey?: string;
}

const MODES = [
  {
    value: 'card' as const,
    Icon: LayoutGrid,
    label: 'Card view',
  },
  {
    value: 'table' as const,
    Icon: List,
    label: 'Table view',
  },
];

function ViewModeToggle({ mode, onChange, persistKey }: ViewModeToggleProps) {
  // On mount, read persisted value from localStorage if persistKey is set.
  // We fire onChange so the parent can initialise its state from storage.
  const initialised = React.useRef(false);

  React.useEffect(() => {
    if (!persistKey || initialised.current) return;
    initialised.current = true;

    try {
      const stored = localStorage.getItem(persistKey);
      if (stored === 'card' || stored === 'table') {
        onChange(stored);
      }
    } catch {
      // localStorage may not be available (SSR, private browsing, etc.)
    }
  }, [persistKey, onChange]);

  const handleChange = React.useCallback(
    (next: 'card' | 'table') => {
      onChange(next);

      if (persistKey) {
        try {
          localStorage.setItem(persistKey, next);
        } catch {
          // localStorage may not be available
        }
      }
    },
    [onChange, persistKey]
  );

  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex rounded-md border border-input bg-background p-0.5 shadow-sm"
    >
      {MODES.map(({ value, Icon, label }) => {
        const isActive = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => handleChange(value)}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
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

ViewModeToggle.displayName = 'ViewModeToggle';

export { ViewModeToggle };
