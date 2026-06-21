/**
 * Unit tests for BulkActionBar
 * @jest-environment jsdom
 *
 * Coverage targets:
 * - Rendering: visible/hidden state, selected count label, action buttons, clear button
 * - Interactions: action callbacks (sync + async), clear selection, disabled state
 * - Async loading: per-action spinner, global disabled-while-loading
 * - Accessibility: toolbar role, aria-hidden, aria-live, aria-label on buttons
 * - Edge cases: empty actions array, single item vs. plural label
 */

import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionBar } from '../bulk-action-bar';
import type { BulkAction, BulkActionBarProps } from '../index';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeAction(overrides: Partial<BulkAction> = {}): BulkAction {
  return {
    id: 'test-action',
    label: 'Test Action',
    onClick: jest.fn(),
    ...overrides,
  };
}

function renderBar(overrides: Partial<BulkActionBarProps> = {}) {
  const onClearSelection = jest.fn();
  const props: BulkActionBarProps = {
    selectedCount: 3,
    hasSelection: true,
    actions: [makeAction()],
    onClearSelection,
    ...overrides,
  };
  const utils = render(<BulkActionBar {...props} />);
  return { ...utils, onClearSelection, props };
}

// ---------------------------------------------------------------------------
// 1. Renders correctly with selectedCount > 0 and hasSelection=true
// ---------------------------------------------------------------------------

describe('BulkActionBar — basic rendering', () => {
  it('renders the selected count label', () => {
    renderBar({ selectedCount: 5, hasSelection: true });
    expect(screen.getByText('5 selected')).toBeInTheDocument();
  });

  it('renders the toolbar container with role="toolbar"', () => {
    renderBar();
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('toolbar aria-label includes the selected count and item label', () => {
    renderBar({ selectedCount: 3, hasSelection: true });
    expect(
      screen.getByRole('toolbar', { name: /bulk actions for 3 selected items/i })
    ).toBeInTheDocument();
  });

  it('renders the clear selection button', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  });

  it('renders action buttons by their label', () => {
    const actions: BulkAction[] = [
      makeAction({ id: 'delete', label: 'Delete' }),
      makeAction({ id: 'archive', label: 'Archive' }),
    ];
    renderBar({ actions });
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Hidden when hasSelection is false
// ---------------------------------------------------------------------------

describe('BulkActionBar — visibility state', () => {
  it('is aria-hidden when hasSelection is false', () => {
    const { container } = renderBar({ hasSelection: false });
    // The outer wrapper carries aria-hidden
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('is NOT aria-hidden when hasSelection is true', () => {
    const { container } = renderBar({ hasSelection: true });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'false');
  });

  it('applies pointer-events-none class when hasSelection is false', () => {
    const { container } = renderBar({ hasSelection: false });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('pointer-events-none');
  });

  it('applies opacity-0 class when hasSelection is false', () => {
    const { container } = renderBar({ hasSelection: false });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('opacity-0');
  });

  it('applies pointer-events-auto class when hasSelection is true', () => {
    const { container } = renderBar({ hasSelection: true });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('pointer-events-auto');
  });
});

// ---------------------------------------------------------------------------
// 3. Calls action callbacks on click
// ---------------------------------------------------------------------------

describe('BulkActionBar — action callbacks', () => {
  it('calls onClick when action button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    renderBar({ actions: [makeAction({ id: 'go', label: 'Go', onClick })] });

    await user.click(screen.getByRole('button', { name: /go/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClearSelection when clear button is clicked', async () => {
    const user = userEvent.setup();
    const { onClearSelection } = renderBar();

    await user.click(screen.getByRole('button', { name: /clear selection/i }));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick when the action button is disabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    renderBar({ actions: [makeAction({ id: 'x', label: 'Blocked', onClick, disabled: true })] });

    const btn = screen.getByRole('button', { name: /blocked/i });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does NOT call onClick when another action is already loading', async () => {
    const user = userEvent.setup();

    let resolveFirst!: () => void;
    const slowAction = jest.fn(
      () => new Promise<void>((resolve) => { resolveFirst = resolve; })
    );
    const secondOnClick = jest.fn();

    renderBar({
      actions: [
        makeAction({ id: 'first', label: 'First', onClick: slowAction }),
        makeAction({ id: 'second', label: 'Second', onClick: secondOnClick }),
      ],
    });

    await user.click(screen.getByRole('button', { name: /first/i }));

    // Try clicking the second button while first is loading — it's disabled
    await user.click(screen.getByRole('button', { name: /second/i }));
    expect(secondOnClick).not.toHaveBeenCalled();

    await act(async () => { resolveFirst(); });
  });
});

// ---------------------------------------------------------------------------
// 4. Displays correct selected count
// ---------------------------------------------------------------------------

describe('BulkActionBar — selected count display', () => {
  it('shows "1 selected" for a single item', () => {
    renderBar({ selectedCount: 1 });
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('uses singular "item" label in toolbar aria-label for count=1', () => {
    renderBar({ selectedCount: 1, hasSelection: true });
    expect(
      screen.getByRole('toolbar', { name: /bulk actions for 1 selected item$/i })
    ).toBeInTheDocument();
  });

  it('uses plural "items" label in toolbar aria-label for count>1', () => {
    renderBar({ selectedCount: 42, hasSelection: true });
    expect(
      screen.getByRole('toolbar', { name: /bulk actions for 42 selected items/i })
    ).toBeInTheDocument();
  });

  it('aria-live region wraps the count text', () => {
    renderBar({ selectedCount: 7 });
    // The aria-live span sits inside the count label
    const liveRegion = screen.getByText('7 selected').closest('[aria-live]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});

// ---------------------------------------------------------------------------
// 5. Select all / clear controls
// ---------------------------------------------------------------------------

describe('BulkActionBar — clear selection control', () => {
  it('renders the clear button with a descriptive aria-label', () => {
    renderBar();
    const clearBtn = screen.getByRole('button', { name: 'Clear selection' });
    expect(clearBtn).toBeInTheDocument();
  });

  it('clear button is keyboard-reachable (not disabled) when no action is loading', () => {
    renderBar();
    const clearBtn = screen.getByRole('button', { name: 'Clear selection' });
    expect(clearBtn).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 6. Multiple actions render
// ---------------------------------------------------------------------------

describe('BulkActionBar — multiple actions', () => {
  const multiActions: BulkAction[] = [
    makeAction({ id: 'deploy', label: 'Deploy', variant: 'default' }),
    makeAction({ id: 'lock', label: 'Lock', variant: 'secondary' }),
    makeAction({ id: 'delete', label: 'Delete', variant: 'destructive' }),
  ];

  it('renders all action buttons', () => {
    renderBar({ actions: multiActions });
    expect(screen.getByRole('button', { name: /deploy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lock/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('renders correct total button count (actions + clear)', () => {
    renderBar({ actions: multiActions });
    // 3 action buttons + 1 clear = 4
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('renders no action buttons when actions array is empty', () => {
    renderBar({ actions: [] });
    // Only the clear button should be present
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7. Async action loading state
// ---------------------------------------------------------------------------

describe('BulkActionBar — async loading state', () => {
  it('shows a loading spinner while an async action is in flight', async () => {
    const user = userEvent.setup();

    let resolveAction!: () => void;
    const slowAction = jest.fn(
      () => new Promise<void>((resolve) => { resolveAction = resolve; })
    );
    renderBar({ actions: [makeAction({ id: 'slow', label: 'Slow', onClick: slowAction })] });

    await user.click(screen.getByRole('button', { name: /slow/i }));

    // Spinner is rendered while promise is pending
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Resolve the promise and wait for cleanup
    await act(async () => { resolveAction(); });
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument()
    );
  });

  it('disables all action buttons while any action is loading', async () => {
    const user = userEvent.setup();

    let resolveFirst!: () => void;
    const slowAction = jest.fn(
      () => new Promise<void>((resolve) => { resolveFirst = resolve; })
    );
    const secondAction = jest.fn();

    renderBar({
      actions: [
        makeAction({ id: 'first', label: 'First', onClick: slowAction }),
        makeAction({ id: 'second', label: 'Second', onClick: secondAction }),
      ],
    });

    await user.click(screen.getByRole('button', { name: /first/i }));

    // Second action should be disabled during loading
    expect(screen.getByRole('button', { name: /second/i })).toBeDisabled();

    await act(async () => { resolveFirst(); });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /second/i })).not.toBeDisabled()
    );
  });

  it('disables the clear button while an action is loading', async () => {
    const user = userEvent.setup();

    let resolveAction!: () => void;
    const slowAction = jest.fn(
      () => new Promise<void>((resolve) => { resolveAction = resolve; })
    );
    renderBar({ actions: [makeAction({ id: 'slow', label: 'Slow', onClick: slowAction })] });

    await user.click(screen.getByRole('button', { name: /slow/i }));
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeDisabled();

    await act(async () => { resolveAction(); });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /clear selection/i })).not.toBeDisabled()
    );
  });

  it('shows loading spinner only for the clicked action, not others', async () => {
    const user = userEvent.setup();

    let resolveFirst!: () => void;
    const slowAction = jest.fn(
      () => new Promise<void>((resolve) => { resolveFirst = resolve; })
    );

    renderBar({
      actions: [
        makeAction({ id: 'slow', label: 'Slow', onClick: slowAction }),
        makeAction({ id: 'fast', label: 'Fast', onClick: jest.fn() }),
      ],
    });

    await user.click(screen.getByRole('button', { name: /slow/i }));

    // Exactly one spinner should be present
    expect(document.querySelectorAll('.animate-spin')).toHaveLength(1);

    await act(async () => { resolveFirst(); });
  });

  it('re-enables buttons after a successful action completes', async () => {
    const user = userEvent.setup();

    let resolveAction!: () => void;
    const slowAction = jest.fn(
      () => new Promise<void>((resolve) => { resolveAction = resolve; })
    );
    renderBar({ actions: [makeAction({ id: 'slow', label: 'Slow', onClick: slowAction })] });

    await user.click(screen.getByRole('button', { name: /slow/i }));
    expect(screen.getByRole('button', { name: /slow/i })).toBeDisabled();

    await act(async () => { resolveAction(); });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /slow/i })).not.toBeDisabled()
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Action button aria-labels
// ---------------------------------------------------------------------------

describe('BulkActionBar — action button aria-labels', () => {
  it('each action button includes the label, count, and item word in aria-label', () => {
    renderBar({
      selectedCount: 2,
      hasSelection: true,
      actions: [makeAction({ id: 'del', label: 'Delete' })],
    });
    expect(
      screen.getByRole('button', { name: 'Delete 2 selected items' })
    ).toBeInTheDocument();
  });

  it('action button aria-label uses singular "item" for count=1', () => {
    renderBar({
      selectedCount: 1,
      hasSelection: true,
      actions: [makeAction({ id: 'del', label: 'Delete' })],
    });
    expect(
      screen.getByRole('button', { name: 'Delete 1 selected item' })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 9. Custom className forwarding
// ---------------------------------------------------------------------------

describe('BulkActionBar — className prop', () => {
  it('applies extra className to the outer wrapper', () => {
    const { container } = renderBar({ className: 'my-custom-class' });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });
});

// ---------------------------------------------------------------------------
// 10. Icon rendering
// ---------------------------------------------------------------------------

describe('BulkActionBar — action icon', () => {
  it('renders an icon when provided in the action definition', () => {
    const icon = <svg data-testid="action-icon" />;
    renderBar({
      actions: [makeAction({ id: 'icon-action', label: 'Icon Action', icon })],
    });
    expect(screen.getByTestId('action-icon')).toBeInTheDocument();
  });

  it('renders no icon wrapper when icon is not provided', () => {
    renderBar({
      actions: [makeAction({ id: 'no-icon', label: 'No Icon', icon: undefined })],
    });
    // The icon wrapper span is only rendered when icon != null; verify absence
    const btn = screen.getByRole('button', { name: /no icon/i });
    expect(btn.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
