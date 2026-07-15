'use client';

import { ArrowUpDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/DropdownMenu';
import { cn } from '../primitives/utils';

export interface SortOption {
  value: string;
  label: string;
}

export interface SortDropdownProps {
  options: SortOption[];
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  className?: string;
}

export function SortDropdown({
  options,
  sortField,
  sortOrder,
  onSortChange,
  className,
}: SortDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              if (sortField === option.value) {
                // Already selected — toggle order
                onSortChange(option.value, sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                onSortChange(option.value, sortOrder);
              }
            }}
            aria-current={sortField === option.value ? 'true' : undefined}
          >
            {option.label}
            {sortField === option.value && (
              <span className="ml-1" aria-hidden="true">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
            <span className="sr-only">
              {sortField === option.value
                ? `, sorted ${sortOrder === 'asc' ? 'ascending' : 'descending'}`
                : ''}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onSortChange(sortField, sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? (
            <>
              Ascending <span aria-hidden="true">↑</span>
              <span className="sr-only">(click to switch to descending)</span>
            </>
          ) : (
            <>
              Descending <span aria-hidden="true">↓</span>
              <span className="sr-only">(click to switch to ascending)</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
