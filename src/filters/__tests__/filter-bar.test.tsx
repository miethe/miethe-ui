/**
 * Unit tests for FilterBar
 * @jest-environment jsdom
 *
 * Coverage targets:
 * 1. Search input rendering — role="search" landmark, searchValue binding, onSearchChange callback
 * 2. Filter slot condition filtering — no condition, true condition, false condition, undefined context
 * 3. Sort dropdown — renders when sort prop is defined, absent when undefined
 * 4. View toggle — renders when viewToggle is defined + enabled; hidden when undefined or enabled===false
 * 5. View toggle onChange — fires 'grid' / 'list' when buttons are clicked
 * 6. Accessible labels — search aria-label, slot aria-label, view toggle button labels
 * 7. Keyboard navigation — Tab order through interactive zones
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../filter-bar';
import type {
  FilterBarProps,
  FilterSlotConfig,
  FilterSlotConditionContext,
} from '../filter-slot-config';

// ---------------------------------------------------------------------------
// SortDropdown renders a Radix DropdownMenu — mock it to avoid portal/pointer
// complexity in jsdom while still verifying "is present / is absent".
// ---------------------------------------------------------------------------

jest.mock('../sort-dropdown', () => ({
  SortDropdown: ({ sortField }: { sortField: string }) => (
    <div data-testid="sort-dropdown" data-sort-field={sortField} />
  ),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const defaultContext: FilterSlotConditionContext = {
  pageId: 'artifacts',
  edition: 'local',
};

const defaultSortProps: FilterBarProps['sort'] = {
  options: [
    { value: 'name', label: 'Name' },
    { value: 'updated', label: 'Updated' },
  ],
  sortField: 'name',
  sortOrder: 'asc',
  onSortChange: jest.fn(),
};

function renderBar(overrides: Partial<FilterBarProps> = {}) {
  const onSearchChange = jest.fn();
  const props: FilterBarProps = {
    searchValue: '',
    onSearchChange,
    ...overrides,
  };
  const utils = render(<FilterBar {...props} />);
  return { ...utils, onSearchChange };
}

function makeSlot(overrides: Partial<FilterSlotConfig> = {}): FilterSlotConfig {
  return {
    id: 'test-slot',
    label: 'Test Slot',
    component: <button type="button">Slot content</button>,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Search input rendering
// ---------------------------------------------------------------------------

describe('FilterBar — search input', () => {
  it('renders a role="search" landmark', () => {
    renderBar();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('role="search" has the default aria-label "Search"', () => {
    renderBar();
    expect(screen.getByRole('search', { name: 'Search' })).toBeInTheDocument();
  });

  it('role="search" uses the custom searchAriaLabel when provided', () => {
    renderBar({ searchAriaLabel: 'Search artifacts' });
    expect(screen.getByRole('search', { name: 'Search artifacts' })).toBeInTheDocument();
  });

  it('renders a text input inside the search landmark', () => {
    renderBar({ searchValue: 'hello' });
    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('hello');
  });

  it('calls onSearchChange with the new value when the user types', async () => {
    const user = userEvent.setup();
    const { onSearchChange } = renderBar({ searchValue: '' });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'abc');

    // Called once per character typed
    expect(onSearchChange).toHaveBeenCalledTimes(3);
    // Because searchValue is a controlled prop held at '' the input never
    // accumulates; each keystroke fires onChange with a single character.
    expect(onSearchChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onSearchChange).toHaveBeenNthCalledWith(2, 'b');
    expect(onSearchChange).toHaveBeenNthCalledWith(3, 'c');
  });

  it('reflects the searchValue prop as the input value', () => {
    renderBar({ searchValue: 'preset' });
    expect(screen.getByRole('searchbox')).toHaveValue('preset');
  });

  it('renders the searchPlaceholder in the input', () => {
    renderBar({ searchPlaceholder: 'Find something…' });
    expect(screen.getByPlaceholderText('Find something…')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Filter slot condition filtering
// ---------------------------------------------------------------------------

describe('FilterBar — filter slot conditions', () => {
  it('renders a slot with no condition always', () => {
    const slot = makeSlot({ id: 'unconditional', label: 'Always On' });
    renderBar({ filterSlots: [slot], conditionContext: defaultContext });
    expect(screen.getByLabelText('Always On')).toBeInTheDocument();
  });

  it('renders a slot whose condition returns true', () => {
    const slot = makeSlot({
      id: 'conditional-true',
      label: 'Visible Slot',
      condition: () => true,
    });
    renderBar({ filterSlots: [slot], conditionContext: defaultContext });
    expect(screen.getByLabelText('Visible Slot')).toBeInTheDocument();
  });

  it('hides a slot whose condition returns false', () => {
    const slot = makeSlot({
      id: 'conditional-false',
      label: 'Hidden Slot',
      condition: () => false,
    });
    renderBar({ filterSlots: [slot], conditionContext: defaultContext });
    expect(screen.queryByLabelText('Hidden Slot')).not.toBeInTheDocument();
  });

  it('hides a conditional slot when conditionContext is undefined', () => {
    const slot = makeSlot({
      id: 'needs-context',
      label: 'Needs Context',
      condition: (ctx) => ctx.pageId === 'artifacts',
    });
    renderBar({ filterSlots: [slot], conditionContext: undefined });
    expect(screen.queryByLabelText('Needs Context')).not.toBeInTheDocument();
  });

  it('passes the conditionContext to the condition predicate', () => {
    const condition = jest.fn(() => true);
    const slot = makeSlot({ id: 'ctx-spy', label: 'Context Spy', condition });
    renderBar({ filterSlots: [slot], conditionContext: defaultContext });

    expect(condition).toHaveBeenCalledWith(defaultContext);
  });

  it('renders slots in the order they appear in the filterSlots array', () => {
    const slots: FilterSlotConfig[] = [
      makeSlot({ id: 'first', label: 'First Slot', component: <span>First</span> }),
      makeSlot({ id: 'second', label: 'Second Slot', component: <span>Second</span> }),
    ];
    renderBar({ filterSlots: slots, conditionContext: defaultContext });

    const slotWrappers = screen
      .getAllByRole('generic')
      // Find wrappers that carry an aria-label matching a slot label
      .filter((el) =>
        el.getAttribute('aria-label') === 'First Slot' ||
        el.getAttribute('aria-label') === 'Second Slot'
      );

    expect(slotWrappers).toHaveLength(2);
    // First Slot must appear before Second Slot in the DOM
    expect(slotWrappers[0]).toHaveAttribute('aria-label', 'First Slot');
    expect(slotWrappers[1]).toHaveAttribute('aria-label', 'Second Slot');
  });

  it('renders nothing in the slot zone when filterSlots is undefined', () => {
    // No filterSlots prop — should not throw and only the search is present
    renderBar();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('renders nothing in the slot zone when filterSlots is an empty array', () => {
    renderBar({ filterSlots: [], conditionContext: defaultContext });
    expect(screen.getByRole('search')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Sort dropdown
// ---------------------------------------------------------------------------

describe('FilterBar — sort dropdown', () => {
  it('renders the sort dropdown when the sort prop is provided', () => {
    renderBar({ sort: defaultSortProps });
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
  });

  it('does NOT render the sort dropdown when sort is undefined', () => {
    renderBar({ sort: undefined });
    expect(screen.queryByTestId('sort-dropdown')).not.toBeInTheDocument();
  });

  it('forwards sortField to the SortDropdown', () => {
    renderBar({ sort: { ...defaultSortProps, sortField: 'updated' } });
    expect(screen.getByTestId('sort-dropdown')).toHaveAttribute(
      'data-sort-field',
      'updated'
    );
  });
});

// ---------------------------------------------------------------------------
// 4. View toggle rendering
// ---------------------------------------------------------------------------

describe('FilterBar — view toggle rendering', () => {
  it('renders the view toggle group when viewToggle is provided and enabled is unset', () => {
    renderBar({
      viewToggle: { value: 'grid', onChange: jest.fn() },
    });
    expect(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument();
  });

  it('renders the view toggle group when viewToggle.enabled is true', () => {
    renderBar({
      viewToggle: { value: 'grid', onChange: jest.fn(), enabled: true },
    });
    expect(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument();
  });

  it('does NOT render the view toggle group when viewToggle is undefined', () => {
    renderBar({ viewToggle: undefined });
    expect(screen.queryByRole('group', { name: 'View mode' })).not.toBeInTheDocument();
  });

  it('does NOT render the view toggle group when viewToggle.enabled is false', () => {
    renderBar({
      viewToggle: { value: 'grid', onChange: jest.fn(), enabled: false },
    });
    expect(screen.queryByRole('group', { name: 'View mode' })).not.toBeInTheDocument();
  });

  it('renders both Grid view and List view buttons inside the view toggle', () => {
    renderBar({ viewToggle: { value: 'grid', onChange: jest.fn() } });
    expect(screen.getByRole('button', { name: 'Grid view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument();
  });

  it('marks the active mode with aria-pressed="true"', () => {
    renderBar({ viewToggle: { value: 'list', onChange: jest.fn() } });
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

// ---------------------------------------------------------------------------
// 5. View toggle onChange callbacks
// ---------------------------------------------------------------------------

describe('FilterBar — view toggle interactions', () => {
  it('calls onChange with "grid" when the Grid view button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderBar({ viewToggle: { value: 'list', onChange } });

    await user.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('calls onChange with "list" when the List view button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderBar({ viewToggle: { value: 'grid', onChange } });

    await user.click(screen.getByRole('button', { name: 'List view' }));
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('does not call onChange when a toggle button is clicked while disabled', async () => {
    const onChange = jest.fn();
    renderBar({ viewToggle: { value: 'grid', onChange, enabled: false } });

    // enabled:false prevents the group from rendering at all — buttons are not in DOM
    expect(screen.queryByRole('button', { name: 'Grid view' })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange exactly once per click', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderBar({ viewToggle: { value: 'grid', onChange } });

    await user.click(screen.getByRole('button', { name: 'List view' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 6. Accessible labels
// ---------------------------------------------------------------------------

describe('FilterBar — accessibility labels', () => {
  it('search input has aria-label matching searchAriaLabel', () => {
    renderBar({ searchAriaLabel: 'Search marketplace' });
    expect(
      screen.getByRole('searchbox', { name: 'Search marketplace' })
    ).toBeInTheDocument();
  });

  it('each visible slot wrapper carries aria-label equal to slot.label', () => {
    const slots: FilterSlotConfig[] = [
      makeSlot({ id: 'type', label: 'Type' }),
      makeSlot({ id: 'tier', label: 'Tier' }),
    ];
    renderBar({ filterSlots: slots, conditionContext: defaultContext });

    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Tier')).toBeInTheDocument();
  });

  it('Grid view button has aria-label="Grid view"', () => {
    renderBar({ viewToggle: { value: 'grid', onChange: jest.fn() } });
    expect(screen.getByRole('button', { name: 'Grid view' })).toBeInTheDocument();
  });

  it('List view button has aria-label="List view"', () => {
    renderBar({ viewToggle: { value: 'grid', onChange: jest.fn() } });
    expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument();
  });

  it('view toggle group has aria-label="View mode"', () => {
    renderBar({ viewToggle: { value: 'grid', onChange: jest.fn() } });
    expect(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument();
  });

  it('search input aria-label defaults to "Search" when searchAriaLabel is omitted', () => {
    renderBar();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7. Keyboard navigation (Tab order)
// ---------------------------------------------------------------------------

describe('FilterBar — keyboard navigation', () => {
  it('Tab moves focus from the search input to a slot component', async () => {
    const user = userEvent.setup();
    const slotButton = <button type="button">Slot Button</button>;
    const slot = makeSlot({ id: 'kb-slot', label: 'KB Slot', component: slotButton });
    renderBar({ filterSlots: [slot], conditionContext: defaultContext });

    const input = screen.getByRole('searchbox');
    input.focus();
    expect(input).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Slot Button' })).toHaveFocus();
  });

  it('Tab moves focus from search to Grid view button when no slots are present', async () => {
    const user = userEvent.setup();
    renderBar({
      viewToggle: { value: 'grid', onChange: jest.fn() },
    });

    const input = screen.getByRole('searchbox');
    input.focus();
    expect(input).toHaveFocus();

    await user.tab();
    // Next interactive element is the Grid view button (List view follows)
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveFocus();
  });

  it('Tab moves focus from Grid view button to List view button', async () => {
    const user = userEvent.setup();
    renderBar({ viewToggle: { value: 'grid', onChange: jest.fn() } });

    screen.getByRole('button', { name: 'Grid view' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'List view' })).toHaveFocus();
  });
});
