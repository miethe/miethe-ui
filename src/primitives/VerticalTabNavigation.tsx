/**
 * Vertical Tab Navigation Component
 *
 * A standalone vertical tab list with keyboard navigation and ARIA attributes.
 * Unlike TabNavigation (which wraps Radix TabsList), this component manages its
 * own focus and activation logic so it can be used outside a Radix Tabs context —
 * useful for sidebar navigation panels where the tab panel is rendered elsewhere.
 *
 * @example Basic usage
 * ```tsx
 * const [activeTab, setActiveTab] = React.useState('overview');
 *
 * <VerticalTabNavigation
 *   tabs={[
 *     { value: 'overview', label: 'Overview', icon: Info },
 *     { value: 'settings', label: 'Settings', icon: Settings },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   ariaLabel="Artifact detail navigation"
 * />
 * ```
 *
 * @example With badges and disabled tabs
 * ```tsx
 * <VerticalTabNavigation
 *   tabs={[
 *     { value: 'files', label: 'Files', icon: FileText, badge: 12 },
 *     { value: 'preview', label: 'Coming Soon', disabled: true },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from './utils';
import { Badge } from './Badge';

// ============================================================================
// Types
// ============================================================================

// Re-export Tab from TabNavigation so consumers can import from one place.
export type { Tab } from './TabNavigation';
import type { Tab } from './TabNavigation';

export interface VerticalTabNavigationProps {
  /** Array of tab configurations */
  tabs: Tab[];
  /** Currently active tab value */
  activeTab: string;
  /** Callback invoked when the user selects a tab */
  onTabChange: (tabId: string) => void;
  /** Additional CSS classes for the container */
  className?: string;
  /** Accessible label for the tab list */
  ariaLabel?: string;
}

/** Imperative handle exposed via forwardRef for programmatic focus control. */
export interface VerticalTabNavigationHandle {
  /** Focus the first enabled tab button without changing the active tab. */
  focusFirstTab: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * VerticalTabNavigation — standalone vertical tab list with full keyboard support.
 *
 * Implements the WAI-ARIA Tabs pattern with vertical orientation:
 * - ArrowDown / ArrowUp navigate between enabled tabs (wraps around).
 * - Home / End jump to first / last enabled tab.
 * - Focus automatically activates the tab (roving tabindex pattern).
 * - Tab key exits the tab list entirely (standard browser behavior).
 *
 * @param tabs        - Array of tab configurations (value, label, icon, badge, disabled)
 * @param activeTab   - Controlled active tab value
 * @param onTabChange - Callback fired when a tab becomes active
 * @param className   - Additional CSS classes for the container div
 * @param ariaLabel   - Accessible label for the tab list element
 *
 * Exposes a `VerticalTabNavigationHandle` via `forwardRef` with:
 * - `focusFirstTab()` — moves focus to the first enabled tab without changing
 *   the active tab value. Useful when the tab list is swapped (e.g. lens change)
 *   and focus needs to follow the new content.
 */
const VerticalTabNavigationInner = React.forwardRef<
  VerticalTabNavigationHandle,
  VerticalTabNavigationProps
>(function VerticalTabNavigation(
  {
    tabs,
    activeTab,
    onTabChange,
    className,
    ariaLabel = 'Navigation tabs',
  }: VerticalTabNavigationProps,
  ref
) {
  // Refs for each button so we can programmatically move focus.
  const buttonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const enabledTabs = React.useMemo(() => tabs.filter((t) => !t.disabled), [tabs]);

  // Expose imperative handle so parents can focus the first tab on demand
  // (e.g. when a lens change swaps the visible tab list).
  React.useImperativeHandle(
    ref,
    () => ({
      focusFirstTab: () => {
        const first = enabledTabs[0];
        if (first) {
          buttonRefs.current.get(first.value)?.focus();
        }
      },
    }),
    [enabledTabs]
  );

  const focusAndActivate = React.useCallback(
    (tabValue: string) => {
      onTabChange(tabValue);
      buttonRefs.current.get(tabValue)?.focus();
    },
    [onTabChange]
  );

  // WAI-ARIA Tabs pattern keyboard handler.
  // Implements arrow key navigation (wraps around), Home/End jumping, and focus-activates
  // the roving tabindex pattern (only one tab is ever in the tab order at a time).
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentValue: string) => {
      const currentIndex = enabledTabs.findIndex((t) => t.value === currentValue);

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          const next = enabledTabs[(currentIndex + 1) % enabledTabs.length];
          if (next) focusAndActivate(next.value);
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          const prev =
            enabledTabs[(currentIndex - 1 + enabledTabs.length) % enabledTabs.length];
          if (prev) focusAndActivate(prev.value);
          break;
        }
        case 'Home': {
          event.preventDefault();
          const first = enabledTabs[0];
          if (first) focusAndActivate(first.value);
          break;
        }
        case 'End': {
          event.preventDefault();
          const last = enabledTabs[enabledTabs.length - 1];
          if (last) focusAndActivate(last.value);
          break;
        }
        default:
          break;
      }
    },
    [enabledTabs, focusAndActivate]
  );

  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      className={cn('flex flex-col', className)}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.value === activeTab;

        return (
          <button
            key={tab.value}
            ref={(el) => {
              if (el) {
                buttonRefs.current.set(tab.value, el);
              } else {
                buttonRefs.current.delete(tab.value);
              }
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.value}`}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.value)}
            onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab.value)}
            aria-label={
              tab.badge !== undefined && tab.badge > 0
                ? `${tab.label}, ${tab.badge} items`
                : undefined
            }
            className={cn(
              // Base
              'flex items-center gap-2 px-3 py-2 text-sm rounded-r-md w-full text-left',
              // Transition
              'transition-colors',
              // Active state
              isActive
                ? 'border-l-2 border-primary bg-accent text-foreground font-medium'
                : 'border-l-2 border-transparent text-muted-foreground hover:bg-accent/50',
              // Disabled state
              tab.disabled && 'cursor-not-allowed opacity-50',
              // Focus ring
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
            <span className="flex-1 text-sm">{tab.label}</span>
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs"
                aria-hidden="true"
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
});

/**
 * VerticalTabNavigation — forward-ref enabled version of the component.
 *
 * Allows consumers to access the imperative handle for programmatic focus control
 * via the `ref` prop.
 *
 * @example
 * ```tsx
 * const navRef = React.useRef<VerticalTabNavigationHandle>(null);
 *
 * // Focus the first tab when lens changes, without changing activeTab
 * React.useEffect(() => {
 *   navRef.current?.focusFirstTab();
 * }, [activeLens]);
 *
 * return <VerticalTabNavigation ref={navRef} tabs={tabs} activeTab={activeTab} ... />
 * ```
 */
export const VerticalTabNavigation = VerticalTabNavigationInner;
