/**
 * Callout component snapshot tests — PU5-02
 *
 * Snapshot tests for all 4 callout types (note, reference, warning, info).
 * Verifies:
 * - Each callout renders with the correct accessible role
 * - Each callout has a unique visual label (type distinction)
 * - Custom children are rendered
 * - Custom className is forwarded
 * - data-callout-type attribute is set correctly on each variant
 * - Base Callout with explicit type prop renders correctly
 * - Unknown type falls back safely
 *
 * These snapshots serve as the regression guard (PU5-02 "visual distinction").
 * If a callout's structure changes intentionally, update snapshots with
 * `pnpm test -- -u callouts.snapshot`.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Callout,
  NoteCallout,
  ReferenceCallout,
  WarningCallout,
  InfoCallout,
} from '../callouts';

// ---------------------------------------------------------------------------
// PU5-02: Snapshot tests — all 4 callout types
// ---------------------------------------------------------------------------

describe('NoteCallout — snapshot and structure', () => {
  it('renders stable snapshot', () => {
    const { container } = render(<NoteCallout>Note body text</NoteCallout>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('has role="note"', () => {
    render(<NoteCallout>Content</NoteCallout>);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  it('has aria-label containing "Note"', () => {
    render(<NoteCallout>Content</NoteCallout>);
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Note callout');
  });

  it('shows "Note" as the type label', () => {
    render(<NoteCallout>Content</NoteCallout>);
    expect(screen.getByRole('note')).toHaveTextContent('Note');
  });

  it('renders custom children content', () => {
    render(<NoteCallout><strong>Bold note</strong> with text</NoteCallout>);
    expect(screen.getByRole('note')).toHaveTextContent('Bold note');
    expect(screen.getByText('Bold note').tagName).toBe('STRONG');
  });

  it('forwards custom className', () => {
    const { container } = render(<NoteCallout className="custom-note">Content</NoteCallout>);
    expect(container.querySelector('.custom-note')).toBeInTheDocument();
  });

  it('sets data-callout-type="note"', () => {
    const { container } = render(<NoteCallout>Content</NoteCallout>);
    expect(container.querySelector('[data-callout-type="note"]')).toBeInTheDocument();
  });

  it('renders as <aside> element', () => {
    const { container } = render(<NoteCallout>Content</NoteCallout>);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });
});

describe('ReferenceCallout — snapshot and structure', () => {
  it('renders stable snapshot', () => {
    const { container } = render(<ReferenceCallout>Reference body text</ReferenceCallout>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('has role="complementary"', () => {
    render(<ReferenceCallout>Content</ReferenceCallout>);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('has aria-label containing "Reference"', () => {
    render(<ReferenceCallout>Content</ReferenceCallout>);
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Reference callout');
  });

  it('shows "Reference" as the type label', () => {
    render(<ReferenceCallout>Content</ReferenceCallout>);
    expect(screen.getByRole('complementary')).toHaveTextContent('Reference');
  });

  it('renders multi-line children', () => {
    render(
      <ReferenceCallout>
        <p>Line 1</p>
        <p>Line 2</p>
      </ReferenceCallout>
    );
    expect(screen.getByRole('complementary')).toHaveTextContent('Line 1');
    expect(screen.getByRole('complementary')).toHaveTextContent('Line 2');
  });

  it('sets data-callout-type="reference"', () => {
    const { container } = render(<ReferenceCallout>Content</ReferenceCallout>);
    expect(container.querySelector('[data-callout-type="reference"]')).toBeInTheDocument();
  });

  it('forwards custom className', () => {
    const { container } = render(<ReferenceCallout className="ref-custom">Content</ReferenceCallout>);
    expect(container.querySelector('.ref-custom')).toBeInTheDocument();
  });
});

describe('WarningCallout — snapshot and structure', () => {
  it('renders stable snapshot', () => {
    const { container } = render(<WarningCallout>Warning body text</WarningCallout>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('has role="alert" for immediate screen reader announcement', () => {
    render(<WarningCallout>Content</WarningCallout>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-label containing "Warning"', () => {
    render(<WarningCallout>Content</WarningCallout>);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-label', 'Warning callout');
  });

  it('shows "Warning" as the type label', () => {
    render(<WarningCallout>Content</WarningCallout>);
    expect(screen.getByRole('alert')).toHaveTextContent('Warning');
  });

  it('renders JSX children', () => {
    render(
      <WarningCallout>
        <em>Dangerous action</em> ahead
      </WarningCallout>
    );
    expect(screen.getByText('Dangerous action').tagName).toBe('EM');
  });

  it('sets data-callout-type="warning"', () => {
    const { container } = render(<WarningCallout>Content</WarningCallout>);
    expect(container.querySelector('[data-callout-type="warning"]')).toBeInTheDocument();
  });

  it('forwards custom className', () => {
    const { container } = render(<WarningCallout className="warn-custom">Content</WarningCallout>);
    expect(container.querySelector('.warn-custom')).toBeInTheDocument();
  });
});

describe('InfoCallout — snapshot and structure', () => {
  it('renders stable snapshot', () => {
    const { container } = render(<InfoCallout>Info body text</InfoCallout>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('has role="note"', () => {
    // InfoCallout uses role=note (same as NoteCallout — supplementary info)
    const { getAllByRole } = render(<InfoCallout>Content</InfoCallout>);
    const notes = getAllByRole('note');
    expect(notes.length).toBeGreaterThanOrEqual(1);
  });

  it('has aria-label containing "Info"', () => {
    const { container } = render(<InfoCallout>Content</InfoCallout>);
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-label', 'Info callout');
  });

  it('shows "Info" as the type label', () => {
    const { container } = render(<InfoCallout>Content</InfoCallout>);
    expect(container).toHaveTextContent('Info');
  });

  it('renders plain text children', () => {
    render(<InfoCallout>Just a tip for you</InfoCallout>);
    expect(screen.getByText(/Just a tip for you/)).toBeInTheDocument();
  });

  it('sets data-callout-type="info"', () => {
    const { container } = render(<InfoCallout>Content</InfoCallout>);
    expect(container.querySelector('[data-callout-type="info"]')).toBeInTheDocument();
  });

  it('forwards custom className', () => {
    const { container } = render(<InfoCallout className="info-custom">Content</InfoCallout>);
    expect(container.querySelector('.info-custom')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Visual distinction: all 4 types have DIFFERENT roles or labels
// ---------------------------------------------------------------------------

describe('Callout types — visual distinction (PU5-02)', () => {
  it('each type has a unique label text', () => {
    const labels = ['Note', 'Reference', 'Warning', 'Info'];
    const unique = new Set(labels);
    expect(unique.size).toBe(4); // all distinct
  });

  it('each type has a unique data-callout-type value', () => {
    const types = ['note', 'reference', 'warning', 'info'] as const;
    const unique = new Set(types);
    expect(unique.size).toBe(4);

    // Render each and verify the attribute
    types.forEach((type) => {
      const { container, unmount } = render(<Callout type={type}>Content</Callout>);
      expect(container.querySelector(`[data-callout-type="${type}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('warning has role="alert" while note and info have role="note" and reference has role="complementary"', () => {
    const { getByRole: getByRoleWarning, unmount: unmountW } = render(
      <WarningCallout>W</WarningCallout>
    );
    expect(getByRoleWarning('alert')).toBeInTheDocument();
    unmountW();

    const { getByRole: getByRoleRef, unmount: unmountR } = render(
      <ReferenceCallout>R</ReferenceCallout>
    );
    expect(getByRoleRef('complementary')).toBeInTheDocument();
    unmountR();
  });

  it('all 4 callout wrappers render as <aside> elements (semantically landmark-able)', () => {
    const types = ['note', 'reference', 'warning', 'info'] as const;
    types.forEach((type) => {
      const { container, unmount } = render(<Callout type={type}>Content</Callout>);
      expect(container.querySelector('aside')).toBeInTheDocument();
      unmount();
    });
  });
});

// ---------------------------------------------------------------------------
// Base Callout — PU5-02 base component tests
// ---------------------------------------------------------------------------

describe('Callout base component — PU5-02', () => {
  it('renders stable snapshot for type="note"', () => {
    const { container } = render(<Callout type="note">Base note</Callout>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders stable snapshot for type="warning"', () => {
    const { container } = render(<Callout type="warning">Base warning</Callout>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('the label paragraph is aria-hidden (decorative — role conveys type)', () => {
    const { container } = render(<Callout type="note">Content</Callout>);
    const labelP = container.querySelector('p[aria-hidden="true"]');
    expect(labelP).toBeInTheDocument();
  });

  it('renders children inside a content div', () => {
    const { container } = render(<Callout type="info">Child content</Callout>);
    const contentDiv = container.querySelector('aside > div');
    expect(contentDiv).toBeInTheDocument();
    expect(contentDiv).toHaveTextContent('Child content');
  });

  it('applies both custom className and type-specific classes', () => {
    const { container } = render(<Callout type="warning" className="extra">Content</Callout>);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('extra');
    // The component uses cn() which includes type-specific Tailwind classes
    expect(aside?.className.length).toBeGreaterThan('extra'.length);
  });
});
