'use client';

/**
 * Base Callout component and default callout variants.
 *
 * Each variant renders with:
 * - A left accent border (type-specific color via Tailwind + CSS variable hooks)
 * - A type label / icon prefix
 * - Semantic HTML structure
 * - `children` forwarded as-is (ReactMarkdown passes rendered JSX)
 *
 * CSS variable hooks (applied in Phase 2):
 * - `--callout-note-border`     / `--callout-note-bg`
 * - `--callout-reference-border` / `--callout-reference-bg`
 * - `--callout-warning-border`  / `--callout-warning-bg`
 * - `--callout-info-border`     / `--callout-info-bg`
 */

import type { CalloutProps, CalloutType } from '../types';
import { cn } from '../../../primitives/utils';

// ============================================================================
// Icon labels (text-based; icon library optional in P2)
// ============================================================================

const TYPE_CONFIG: Record<
  CalloutType,
  {
    label: string;
    /** Tailwind classes for the left border accent */
    borderClass: string;
    /** Tailwind classes for the background tint */
    bgClass: string;
    /** Tailwind classes for the label text color */
    labelClass: string;
    /** Aria role for the aside element */
    role: string;
  }
> = {
  note: {
    label: 'Note',
    borderClass: 'border-l-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    labelClass: 'text-blue-700 dark:text-blue-300',
    role: 'note',
  },
  reference: {
    label: 'Reference',
    borderClass: 'border-l-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    labelClass: 'text-purple-700 dark:text-purple-300',
    role: 'complementary',
  },
  warning: {
    label: 'Warning',
    borderClass: 'border-l-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    labelClass: 'text-amber-700 dark:text-amber-300',
    role: 'alert',
  },
  info: {
    label: 'Info',
    borderClass: 'border-l-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    labelClass: 'text-teal-700 dark:text-teal-300',
    role: 'note',
  },
};

// ============================================================================
// Base Callout component
// ============================================================================

/**
 * Base callout renderer used by all type-specific variants.
 * Accepts an explicit `type` prop for cases where the component is used
 * without a type-specific wrapper.
 */
export function Callout({ type, children, className }: CalloutProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.note;

  return (
    <aside
      role={config.role}
      aria-label={`${config.label} callout`}
      data-callout-type={type}
      className={cn(
        // Base layout
        'my-4 rounded-r-md border-l-4 px-4 py-3',
        // Type-specific accent
        config.borderClass,
        config.bgClass,
        // CSS variable hooks (override in consumer stylesheet)
        '[border-left-color:var(--callout-border-color,inherit)]',
        '[background-color:var(--callout-bg-color,inherit)]',
        className
      )}
    >
      {/* Type label */}
      <p
        className={cn(
          'mb-1 text-xs font-semibold uppercase tracking-wider',
          config.labelClass,
          '[color:var(--callout-label-color,inherit)]'
        )}
        aria-hidden="true"
      >
        {config.label}
      </p>
      {/* Content */}
      <div className="text-sm text-foreground [&>*:last-child]:mb-0 [&>p]:mb-2">
        {children}
      </div>
    </aside>
  );
}

// ============================================================================
// Type-specific convenience components
// ============================================================================

/**
 * Note callout — informational content that supplements the main text.
 * @example `::: note\n...\n:::`
 */
export function NoteCallout({ children, className }: Omit<CalloutProps, 'type'>) {
  return (
    <Callout type="note" className={className}>
      {children}
    </Callout>
  );
}

/**
 * Reference callout — citations, sources, or cross-references.
 * @example `::: reference\n...\n:::`
 */
export function ReferenceCallout({ children, className }: Omit<CalloutProps, 'type'>) {
  return (
    <Callout type="reference" className={className}>
      {children}
    </Callout>
  );
}

/**
 * Warning callout — potentially destructive or dangerous information.
 * @example `::: warning\n...\n:::`
 */
export function WarningCallout({ children, className }: Omit<CalloutProps, 'type'>) {
  return (
    <Callout type="warning" className={className}>
      {children}
    </Callout>
  );
}

/**
 * Info callout — supplementary information or tips.
 * @example `::: info\n...\n:::`
 */
export function InfoCallout({ children, className }: Omit<CalloutProps, 'type'>) {
  return (
    <Callout type="info" className={className}>
      {children}
    </Callout>
  );
}
