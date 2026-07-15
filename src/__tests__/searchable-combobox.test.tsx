/**
 * Unit Tests for SearchableCombobox
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableCombobox } from '../primitives/SearchableCombobox';

// ---------------------------------------------------------------------------
// Test helpers / fixtures
// ---------------------------------------------------------------------------

interface Fruit {
  id: string;
  name: string;
}

const FRUITS: Fruit[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'banana', name: 'Banana' },
  { id: 'cherry', name: 'Cherry' },
];

function renderCombobox(overrides: Partial<React.ComponentProps<typeof SearchableCombobox<Fruit>>> = {}) {
  const onSearch = jest.fn();
  const onSelect = jest.fn();

  const utils = render(
    <SearchableCombobox<Fruit>
      onSearch={onSearch}
      onSelect={onSelect}
      renderItem={(item) => <span>{item.name}</span>}
      getItemKey={(item) => item.id}
      items={FRUITS}
      placeholder="Search fruits"
      aria-label="Fruit picker"
      {...overrides}
    />
  );

  const input = screen.getByRole('combobox', { name: /fruit picker/i });

  return { ...utils, input, onSearch, onSelect };
}

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

describe('SearchableCombobox — rendering', () => {
  it('renders the input with the given placeholder', () => {
    renderCombobox();
    expect(screen.getByPlaceholderText('Search fruits')).toBeInTheDocument();
  });

  it('renders with role="combobox" on the input', () => {
    renderCombobox();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not show the dropdown on initial render', () => {
    renderCombobox();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    renderCombobox({ disabled: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Dropdown open / close
// ---------------------------------------------------------------------------

describe('SearchableCombobox — dropdown visibility', () => {
  it('opens the dropdown when input is focused', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders items using renderItem when dropdown is open', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('closes the dropdown when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// onSearch debounce
// ---------------------------------------------------------------------------

describe('SearchableCombobox — onSearch debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('calls onSearch after 300ms debounce when user types', async () => {
    const { input, onSearch } = renderCombobox();

    fireEvent.change(input, { target: { value: 'app' } });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('app');
  });

  it('debounces rapid successive keystrokes — fires once with final value', () => {
    const { input, onSearch } = renderCombobox();

    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ap' } });
    fireEvent.change(input, { target: { value: 'app' } });

    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('app');
  });
});

// ---------------------------------------------------------------------------
// Item selection
// ---------------------------------------------------------------------------

describe('SearchableCombobox — item selection', () => {
  it('calls onSelect with the item when clicking it', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCombobox();

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Banana'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(FRUITS[1]);
  });

  it('closes the dropdown after selection', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Apple'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('SearchableCombobox — keyboard navigation', () => {
  it('highlights next item on ArrowDown', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('highlights previous item on ArrowUp from second item', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('selects highlighted item on Enter', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCombobox();

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(FRUITS[0]);
  });

  it('closes dropdown on Enter selection', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('wraps ArrowDown from last item to first', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole('combobox'));
    // Three items — go past last
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}'); // Should wrap to index 0

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('SearchableCombobox — loading state', () => {
  it('shows searching indicator when loading=true and input is focused', async () => {
    const user = userEvent.setup();
    renderCombobox({ items: [], loading: true });

    await user.click(screen.getByRole('combobox'));
    // Loading state renders a "Searching…" text
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
  });

  it('renders a listbox in loading state', async () => {
    const user = userEvent.setup();
    renderCombobox({ items: [], loading: true });

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('SearchableCombobox — empty state', () => {
  it('shows default empty message when no items and not loading', async () => {
    const user = userEvent.setup();
    renderCombobox({ items: [] });

    await user.click(screen.getByRole('combobox'));
    // Need to type something so the dropdown shows
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } });

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('shows custom emptyMessage when provided', async () => {
    const user = userEvent.setup();
    renderCombobox({ items: [], emptyMessage: 'Nothing here' });

    await user.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } });

    await waitFor(() => {
      expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('SearchableCombobox — ARIA', () => {
  it('input has role="combobox"', () => {
    renderCombobox();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('input has aria-expanded=false when closed', () => {
    renderCombobox();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('input has aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
  });

  it('dropdown has role="listbox"', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('items have role="option"', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole('combobox'));

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(FRUITS.length);
  });

  it('input has aria-controls pointing to the listbox id', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole('combobox'));

    const input = screen.getByRole('combobox');
    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
  });

  it('aria-activedescendant updates when item is highlighted', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');

    const input = screen.getByRole('combobox');
    const options = screen.getAllByRole('option');
    expect(options[0]).toBeDefined();
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
  });

  it('aria-activedescendant is absent when no item is highlighted', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole('combobox'));

    const input = screen.getByRole('combobox');
    // No navigation yet — activedescendant should be absent or empty
    const desc = input.getAttribute('aria-activedescendant');
    expect(desc == null || desc === '').toBe(true);
  });

  it('input has aria-autocomplete="list"', () => {
    renderCombobox();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-autocomplete', 'list');
  });
});
