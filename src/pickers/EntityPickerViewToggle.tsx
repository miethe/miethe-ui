'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '../primitives/utils';

export type ViewMode = 'grid' | 'list';

export interface EntityPickerViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const OPTIONS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { mode: 'list', icon: List, label: 'List view' },
];

export function EntityPickerViewToggle({
  value,
  onChange,
  className,
}: EntityPickerViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn('inline-flex items-center rounded-md border border-input bg-background p-0.5 shadow-sm', className)}
    >
      {OPTIONS.map(({ mode, icon: Icon, label }) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => onChange(mode)}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
