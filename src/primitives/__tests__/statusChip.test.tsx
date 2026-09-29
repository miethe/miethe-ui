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
    expect(span?.className).toContain('bg-muted');
    expect(span?.className).toContain('text-muted-foreground');
  });

  it('applies ok classes for variant=ok', () => {
    const { container } = render(<StatusChip label="done" variant="ok" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-[hsl(var(--success)/0.14)]');
    expect(span?.className).toContain('text-[hsl(var(--success-foreground))]');
  });

  it('applies warn classes for variant=warn', () => {
    const { container } = render(<StatusChip label="waiting" variant="warn" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-[hsl(var(--warning)/0.14)]');
    expect(span?.className).toContain('text-[hsl(var(--warning-foreground))]');
  });

  it('applies error classes for variant=error', () => {
    const { container } = render(<StatusChip label="blocked" variant="error" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-destructive/14');
    expect(span?.className).toContain('text-destructive');
  });

  it('applies info classes for variant=info', () => {
    const { container } = render(<StatusChip label="info-label" variant="info" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-[hsl(var(--info)/0.14)]');
    expect(span?.className).toContain('text-[hsl(var(--info-foreground))]');
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
