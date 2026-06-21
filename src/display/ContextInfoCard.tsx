'use client';

import { useState, useId } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../primitives/utils';

// ============================================================================
// Types
// ============================================================================

export interface ContextInfoCardMetadataItem {
  label: string;
  value: React.ReactNode;
}

export interface ContextInfoCardProps {
  /** Card heading text */
  title: string;
  /**
   * Optional icon rendered in the header.
   * Accepts any component that takes a `className` prop — no lucide coupling.
   * @example icon={SomeIcon}
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Key/value pairs rendered as a label→value grid below the header.
   * Grid is omitted when the array is empty or undefined.
   */
  metadata?: ContextInfoCardMetadataItem[];
  /** Action nodes rendered at the trailing edge of the header (e.g. buttons, badges). */
  actions?: React.ReactNode;
  /**
   * Whether the card starts in the collapsed state.
   * @default true
   */
  defaultCollapsed?: boolean;
  /** Additional body content rendered below the metadata grid. */
  children?: React.ReactNode;
  /** Additional CSS classes applied to the outer container. */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ContextInfoCard — domain-agnostic collapsible info card.
 *
 * Renders a titled card with an optional icon, a metadata label/value grid,
 * an actions slot, and an arbitrary children body. The body (metadata + children)
 * is toggled via a fully accessible `<button>` that carries `aria-expanded` and
 * `aria-controls` attributes; the collapsible region uses `hidden` so it is
 * removed from the a11y tree when collapsed.
 *
 * @example
 * ```tsx
 * import { Info } from 'lucide-react';
 *
 * <ContextInfoCard
 *   title="Artifact Details"
 *   icon={Info}
 *   metadata={[
 *     { label: 'Type', value: 'skill' },
 *     { label: 'Version', value: '1.2.0' },
 *   ]}
 *   actions={<button>Edit</button>}
 *   defaultCollapsed={false}
 * >
 *   <p>Additional context here.</p>
 * </ContextInfoCard>
 * ```
 */
export function ContextInfoCard({
  title,
  icon: Icon,
  metadata,
  actions,
  defaultCollapsed = true,
  children,
  className,
}: ContextInfoCardProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const bodyId = useId();

  const hasBody =
    (metadata !== undefined && metadata.length > 0) ||
    children !== undefined;

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-muted/30',
        className
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Collapse toggle — only rendered when there is body content */}
        {hasBody ? (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={bodyId}
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
              'flex flex-1 items-center gap-2 text-left',
              'rounded-sm focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-1'
            )}
          >
            {/* Chevron indicator */}
            {isOpen ? (
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}

            {/* Optional icon */}
            {Icon && (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}

            {/* Title */}
            <span className="text-sm font-medium text-foreground">{title}</span>
          </button>
        ) : (
          /* Non-interactive header when there is no body */
          <div className="flex flex-1 items-center gap-2">
            {Icon && (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">{title}</span>
          </div>
        )}

        {/* Actions slot */}
        {actions && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {actions}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Body (hidden from a11y tree when collapsed)                         */}
      {/* ------------------------------------------------------------------ */}
      {hasBody && (
        <div id={bodyId} hidden={!isOpen}>
          <div className="border-t border-border px-3 pb-3 pt-2">
            {/* Metadata grid */}
            {metadata && metadata.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                {metadata.map((item, index) => (
                  <div key={index} className="contents">
                    <dt className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-xs text-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Separator between metadata and extra children */}
            {metadata && metadata.length > 0 && children && (
              <div className="my-2 border-t border-border/50" />
            )}

            {/* Extra body content */}
            {children && <div className="text-sm">{children}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
