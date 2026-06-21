/**
 * Unit tests for the StatusChip primitive.
 *
 * Ported from CCDash Planning/primitives/__tests__/statusChip.test.tsx (PCP-709).
 * Adapted to use Jest + @testing-library/react.
 *
 * Covers:
 * - Label text rendering
 * - All five color variants (neutral, ok, warn, error, info)
 * - Tooltip via title attribute
 * - Base structural CSS classes
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusChip } from '../StatusChip';

describe('StatusChip', () => {
  it('renders the label text', () => {
    render(<StatusChip label="pending" />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('applies neutral classes by default', () => {
    const { container } = render(<StatusChip label="neutral-test" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-slate-700/60');
    expect(span?.className).toContain('text-slate-300');
  });

  it('applies ok classes for variant=ok', () => {
    const { container } = render(<StatusChip label="done" variant="ok" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-emerald-600/20');
    expect(span?.className).toContain('text-emerald-400');
  });

  it('applies warn classes for variant=warn', () => {
    const { container } = render(<StatusChip label="waiting" variant="warn" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-amber-600/20');
    expect(span?.className).toContain('text-amber-400');
  });

  it('applies error classes for variant=error', () => {
    const { container } = render(<StatusChip label="blocked" variant="error" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-rose-600/20');
    expect(span?.className).toContain('text-rose-400');
  });

  it('applies info classes for variant=info', () => {
    const { container } = render(<StatusChip label="info-label" variant="info" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-blue-600/20');
    expect(span?.className).toContain('text-blue-400');
  });

  it('renders tooltip as title attribute when provided', () => {
    render(<StatusChip label="some-status" tooltip="This is the reason" />);
    const span = screen.getByTitle('This is the reason');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('some-status');
  });

  it('renders the base structural classes', () => {
    const { container } = render(<StatusChip label="x" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('inline-flex');
    expect(span?.className).toContain('rounded');
    expect(span?.className).toContain('text-xs');
    expect(span?.className).toContain('font-medium');
  });
});
