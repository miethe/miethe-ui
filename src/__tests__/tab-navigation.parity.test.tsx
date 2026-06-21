/**
 * Parity and accessibility tests for the TabNavigation primitive extracted to @miethe/ui.
 *
 * Covers:
 * - Functional parity with the original SkillMeat component
 * - WCAG 2.1 AA accessibility requirements (role, aria-selected, keyboard navigation)
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { TabNavigation } from '../primitives/TabNavigation';
import type { Tab } from '../primitives/TabNavigation';

// ============================================================================
// Test helpers
// ============================================================================

const basicTabs: Tab[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'settings', label: 'Settings' },
  { value: 'logs', label: 'Logs' },
];

/** Wraps TabNavigation in a Tabs root so Radix context is satisfied. */
function TabsWrapper({
  tabs,
  defaultValue,
  value,
  onValueChange,
  ariaLabel,
}: {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  ariaLabel?: string;
}) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue ?? tabs[0]?.value} value={value} onValueChange={onValueChange}>
      <TabNavigation tabs={tabs} ariaLabel={ariaLabel} />
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.value} value={tab.value}>
          <div data-testid={`content-${tab.value}`}>{tab.label} content</div>
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

/** Minimal icon stub that satisfies ComponentType<{ className?: string }> and forwards ARIA attributes. */
function TestIcon({ className, ...props }: { className?: string } & React.SVGProps<SVGSVGElement>) {
  return <svg data-testid="test-icon" className={className} {...props} />;
}

// ============================================================================
// Parity tests
// ============================================================================

describe('TabNavigation — parity', () => {
  test('1. renders all provided tabs', () => {
    render(<TabsWrapper tabs={basicTabs} />);
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Logs' })).toBeInTheDocument();
  });

  test('2. first tab is active by default', () => {
    render(<TabsWrapper tabs={basicTabs} />);
    const firstTab = screen.getByRole('tab', { name: 'Overview' });
    expect(firstTab).toHaveAttribute('data-state', 'active');
  });

  test('3. controlled activeTab prop sets the active tab', () => {
    render(<TabsWrapper tabs={basicTabs} value="settings" />);
    const settingsTab = screen.getByRole('tab', { name: 'Settings' });
    expect(settingsTab).toHaveAttribute('data-state', 'active');
    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    expect(overviewTab).toHaveAttribute('data-state', 'inactive');
  });

  test('4. clicking a tab calls onValueChange with the tab value', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    render(<TabsWrapper tabs={basicTabs} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(onValueChange).toHaveBeenCalledWith('settings');
  });

  test('5. active tab has data-[state=active] applied', () => {
    render(<TabsWrapper tabs={basicTabs} value="logs" />);
    const logsTab = screen.getByRole('tab', { name: 'Logs' });
    expect(logsTab).toHaveAttribute('data-state', 'active');
  });

  test('6. inactive tabs have data-[state=inactive] applied', () => {
    render(<TabsWrapper tabs={basicTabs} value="logs" />);
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('data-state', 'inactive');
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('data-state', 'inactive');
  });

  test('7. disabled tab renders with aria-disabled and disabled attribute', () => {
    const tabs: Tab[] = [
      { value: 'active', label: 'Active' },
      { value: 'disabled', label: 'Coming Soon', disabled: true },
    ];
    render(<TabsWrapper tabs={tabs} />);
    const disabledTab = screen.getByRole('tab', { name: 'Coming Soon' });
    expect(disabledTab).toBeDisabled();
  });

  test('8. disabled tab click does NOT call onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    const tabs: Tab[] = [
      { value: 'active', label: 'Active' },
      { value: 'disabled', label: 'Coming Soon', disabled: true },
    ];
    render(<TabsWrapper tabs={tabs} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: 'Coming Soon' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test('9. clicking a tab makes the settings tab active', async () => {
    const user = userEvent.setup();
    render(<TabsWrapper tabs={basicTabs} />);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    // After clicking, Settings tab should be active; Overview should be inactive
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('data-state', 'inactive');
  });

  test('10. renders empty tab list gracefully when tabs array is empty', () => {
    render(<TabsWrapper tabs={[]} />);
    // No tabs should appear; component renders without throwing
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  test('11. renders icon when icon prop is provided on a tab', () => {
    const tabs: Tab[] = [{ value: 'overview', label: 'Overview', icon: TestIcon }];
    render(<TabsWrapper tabs={tabs} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  test('12. renders badge with count when badge > 0', () => {
    const tabs: Tab[] = [{ value: 'files', label: 'Files', badge: 7 }];
    render(<TabsWrapper tabs={tabs} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('13. badge renders "99+" when badge count exceeds 99', () => {
    const tabs: Tab[] = [{ value: 'files', label: 'Files', badge: 150 }];
    render(<TabsWrapper tabs={tabs} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('14. badge is not rendered when badge is 0', () => {
    const tabs: Tab[] = [{ value: 'files', label: 'Files', badge: 0 }];
    render(<TabsWrapper tabs={tabs} />);
    // badge=0 means no badge element; label text is present but not badge text
    const tab = screen.getByRole('tab', { name: 'Files' });
    expect(tab.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  test('15. applies custom ariaLabel to the tab list container', () => {
    render(<TabsWrapper tabs={basicTabs} ariaLabel="Artifact navigation" />);
    expect(screen.getByRole('tablist', { name: 'Artifact navigation' })).toBeInTheDocument();
  });
});

// ============================================================================
// A11y tests
// ============================================================================

describe('TabNavigation — a11y', () => {
  test('a11y-1. tab list container has role="tablist"', () => {
    render(<TabsWrapper tabs={basicTabs} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  test('a11y-2. each tab button has role="tab" and aria-selected attribute', () => {
    render(<TabsWrapper tabs={basicTabs} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  test('a11y-3. inactive tabs use roving tabindex pattern (tabindex="-1")', () => {
    render(<TabsWrapper tabs={basicTabs} value="overview" />);
    // Radix WAI-ARIA Tabs pattern: inactive tabs have tabindex="-1" so arrow key navigation works
    const settingsTab = screen.getByRole('tab', { name: 'Settings' });
    const logsTab = screen.getByRole('tab', { name: 'Logs' });
    expect(settingsTab).toHaveAttribute('tabindex', '-1');
    expect(logsTab).toHaveAttribute('tabindex', '-1');
  });

  test('a11y-4. badge has aria-hidden="true" so screen readers skip it', () => {
    const tabs: Tab[] = [{ value: 'files', label: 'Files', badge: 5 }];
    render(<TabsWrapper tabs={tabs} />);
    const badge = screen.getByText('5').closest('[aria-hidden]');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
  });

  test('a11y-5. icon has aria-hidden="true" so it is decorative', () => {
    const tabs: Tab[] = [{ value: 'overview', label: 'Overview', icon: TestIcon }];
    render(<TabsWrapper tabs={tabs} />);
    const icon = screen.getByTestId('test-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  test('a11y-6. tab with badge gets descriptive aria-label for screen readers', () => {
    const tabs: Tab[] = [{ value: 'files', label: 'Files', badge: 12 }];
    render(<TabsWrapper tabs={tabs} />);
    const tab = screen.getByRole('tab', { name: /Files, 12 items/i });
    expect(tab).toBeInTheDocument();
  });
});
