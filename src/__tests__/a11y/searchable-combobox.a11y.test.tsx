/**
 * Accessibility Tests for SearchableCombobox
 * @jest-environment jsdom
 *
 * ============================================================================
 * AUDIT SUMMARY — WCAG 2.1 AA Review
 * ============================================================================
 *
 * SearchableCombobox
 * ------------------
 * PASS  Input carries role="combobox" with aria-expanded, aria-controls,
 *       aria-autocomplete="list", and aria-activedescendant.
 * PASS  Dropdown carries role="listbox" with a unique id that matches
 *       the input's aria-controls value.
 * PASS  Each item carries role="option" with an id matching the
 *       activedescendant pattern and aria-selected.
 * PASS  aria-label on input provides an accessible name (required for
 *       combobox role; no visible label is used in the headless primitive).
 * PASS  Loading placeholder option carries role="option" aria-selected="false"
 *       so the listbox has no empty-content violations.
 * PASS  Empty-state option carries aria-disabled="true" to signal non-
 *       interactive content without removing it from the accessibility tree.
 * NOTE  No Radix primitives are used — all ARIA is hand-applied to native
 *       elements, giving full control over the ARIA contract.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SearchableCombobox } from '../../primitives/SearchableCombobox';

expect.extend(toHaveNoViolations as never);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface Option {
  id: string;
  label: string;
}

const OPTIONS: Option[] = [
  { id: 'opt-1', label: 'Option One' },
  { id: 'opt-2', label: 'Option Two' },
  { id: 'opt-3', label: 'Option Three' },
];

function DefaultCombobox(overrides: Partial<Parameters<typeof SearchableCombobox<Option>>[0]> = {}) {
  return (
    <SearchableCombobox<Option>
      onSearch={jest.fn()}
      onSelect={jest.fn()}
      renderItem={(item) => <span>{item.label}</span>}
      getItemKey={(item) => item.id}
      items={OPTIONS}
      aria-label="Choose an option"
      placeholder="Search options"
      {...overrides}
    />
  );
}

// ---------------------------------------------------------------------------
// A11y tests
// ---------------------------------------------------------------------------

describe('SearchableCombobox — a11y (axe)', () => {
  // 1. Default (closed) state — no violations
  it('has no axe violations in the default (closed) state', async () => {
    const { container } = render(<DefaultCombobox />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // 2. Open with items — no violations
  it('has no axe violations when dropdown is open with items', async () => {
    const user = userEvent.setup();
    const { container } = render(<DefaultCombobox />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // 3. Loading state — no violations
  it('has no axe violations in the loading state', async () => {
    const user = userEvent.setup();
    const { container } = render(<DefaultCombobox items={[]} loading={true} />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // 4. Empty (no results) state — no violations
  it('has no axe violations in the empty (no results) state', async () => {
    const user = userEvent.setup();
    const { container } = render(<DefaultCombobox items={[]} />);

    await user.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // 5. Keyboard navigation state — no violations with activedescendant set
  it('has no axe violations when an item is highlighted via keyboard', async () => {
    const user = userEvent.setup();
    const { container } = render(<DefaultCombobox />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // 6. Disabled state — no violations
  it('has no axe violations when disabled', async () => {
    const { container } = render(<DefaultCombobox disabled={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
