'use client';

import * as React from 'react';
import { Filter, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../primitives/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../primitives/DropdownMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/Tooltip';
import { cn } from '../primitives/utils';

export type FilterMode = 'and' | 'or';

export interface FilterCategoryOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterCategory {
  id: string;
  label: string;
  options: FilterCategoryOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export interface FiltersDropdownProps {
  /** Filter categories to render as sub-menus */
  categories: FilterCategory[];
  /** AND/OR mode for combining values within each category */
  filterMode?: FilterMode;
  /** Handler for filter mode changes */
  onFilterModeChange?: (mode: FilterMode) => void;
  className?: string;
}

export function FiltersDropdown({
  categories,
  filterMode = 'and',
  onFilterModeChange,
  className,
}: FiltersDropdownProps) {
  const activeFilterCount = categories.reduce(
    (total, category) => total + category.selected.length,
    0
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Filter By</span>
          {onFilterModeChange && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center rounded-md border bg-muted/50 p-0.5"
                    role="radiogroup"
                    aria-label="Filter combination mode"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={filterMode === 'and'}
                      className={cn(
                        'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                        filterMode === 'and'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFilterModeChange('and');
                      }}
                    >
                      AND
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={filterMode === 'or'}
                      className={cn(
                        'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                        filterMode === 'or'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFilterModeChange('or');
                      }}
                    >
                      OR
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                  Applies within each filter. Across filters is always AND.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {onFilterModeChange && (
          <p className="px-2 pb-1 text-[10px] leading-tight text-muted-foreground">
            {filterMode === 'and' ? 'Match all' : 'Match any'} selected values within each filter.
            Across filters is always AND.
          </p>
        )}
        <DropdownMenuSeparator />

        {categories.map((category) => (
          <React.Fragment key={category.id}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className="flex items-center gap-2">
                  {category.label}
                  {category.selected.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto h-5 min-w-[1.25rem] px-1 text-[10px]"
                    >
                      {category.selected.length}
                    </Badge>
                  )}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 max-h-60 overflow-y-auto">
                {category.selected.length > 0 && (
                  <>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={() => category.onChange([])}
                    >
                      <span className="text-xs text-muted-foreground">Clear all</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {category.options.map((option) => {
                  const isSelected = category.selected.includes(option.value);
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={(e) => e.preventDefault()}
                      onClick={() => {
                        if (isSelected) {
                          category.onChange(
                            category.selected.filter((v) => v !== option.value)
                          );
                        } else {
                          category.onChange([...category.selected, option.value]);
                        }
                      }}
                    >
                      <span className="flex w-full items-center gap-2">
                        <div
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            isSelected ? 'border-primary bg-primary' : 'border-input'
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="truncate">{option.label}</span>
                        {option.count != null && option.count > 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {option.count}
                          </span>
                        )}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
