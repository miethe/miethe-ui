'use client';

/**
 * FrontmatterHeader — collapsible YAML frontmatter display (PU2-02)
 *
 * Renders parsed YAML frontmatter as a compact key-value table above
 * article content. Supports 1-level object nesting; deeper values are
 * stringified as JSON. Arrays are rendered as comma-separated values.
 *
 * The collapsed state can be controlled externally via `isCollapsed` /
 * `onToggleCollapse`, or managed internally when those props are omitted.
 *
 * @example
 * ```tsx
 * <FrontmatterHeader
 *   frontmatter={{ title: 'My Doc', tags: ['react', 'ui'] }}
 *   isCollapsed={false}
 *   onToggleCollapse={(c) => setCollapsed(c)}
 * />
 * ```
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../primitives/utils';
import type { FrontmatterHeaderProps } from './types';

// ============================================================================
// Value renderer (1-level nesting)
// ============================================================================

/**
 * Render a frontmatter value as a React node.
 * - Primitives: rendered inline
 * - Arrays: comma-separated list
 * - Objects (1-level): indented key-value rows
 * - Deeper nesting: JSON stringified
 */
function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return (
      <span className="italic text-muted-foreground" aria-label="null value">
        null
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return <span className="text-muted-foreground">{value ? 'true' : 'false'}</span>;
  }

  if (typeof value === 'number') {
    return <span>{value}</span>;
  }

  if (typeof value === 'string') {
    return <span>{value}</span>;
  }

  if (Array.isArray(value)) {
    const stringValues = value.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return JSON.stringify(item);
      }
      return String(item);
    });
    return <span>{stringValues.join(', ')}</span>;
  }

  if (typeof value === 'object') {
    // 1-level nesting: render as indented rows
    return (
      <div className="ml-4 mt-1 space-y-0.5">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="font-medium text-muted-foreground">{k}</span>
            {': '}
            {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '')}
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

// ============================================================================
// FrontmatterHeader component
// ============================================================================

/**
 * Collapsible header that displays YAML frontmatter above article content.
 *
 * When neither `isCollapsed` nor `onToggleCollapse` are provided, the
 * component manages its own internal open/closed state.
 *
 * If `frontmatter` is empty (`{}`), the component renders nothing.
 */
export function FrontmatterHeader({
  frontmatter,
  isCollapsed,
  onToggleCollapse,
  className,
}: FrontmatterHeaderProps): React.ReactElement | null {
  const entries = Object.entries(frontmatter);

  // Internal state — used only when the caller does not control collapsed state
  const [internalCollapsed, setInternalCollapsed] = useState(isCollapsed ?? false);

  // Derive the effective collapsed state
  const isControlled = isCollapsed !== undefined;
  const effectiveCollapsed = isControlled ? isCollapsed : internalCollapsed;

  const handleToggle = () => {
    const next = !effectiveCollapsed;
    if (!isControlled) {
      setInternalCollapsed(next);
    }
    onToggleCollapse?.(next);
  };

  // Nothing to show
  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'mb-4 rounded-md border border-border bg-muted/30',
        className
      )}
      data-testid="frontmatter-header"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Frontmatter
        </h4>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={!effectiveCollapsed}
          aria-controls="frontmatter-header-content"
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-0.5',
            'text-xs text-muted-foreground',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'transition-colors'
          )}
        >
          {effectiveCollapsed ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Show</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Hide</span>
            </>
          )}
        </button>
      </div>

      {/* Key-value content — conditionally rendered */}
      {!effectiveCollapsed && (
        <div
          id="frontmatter-header-content"
          className="max-h-64 overflow-y-auto border-t border-border px-3 py-2"
        >
          <dl className="space-y-1.5">
            {entries.map(([key, value]) => (
              <div key={key} className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                <dt className="shrink-0 font-medium text-foreground">{key}</dt>
                <dd className="min-w-0 break-words text-muted-foreground">
                  {renderValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

export default FrontmatterHeader;
