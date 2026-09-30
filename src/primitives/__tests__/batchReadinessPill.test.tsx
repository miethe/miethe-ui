/**
 * Unit tests for the BatchReadinessPill primitive.
 *
 * Ported from CCDash Planning/primitives/__tests__/batchReadinessPill.test.tsx (PCP-709).
 * Adapted to use Jest + @testing-library/react.
 *
 * Covers:
 * - Readiness state label rendering
 * - All four variant states: ready (ok/emerald), blocked (error/rose), waiting (warn/amber), unknown (neutral/slate)
 * - Blocking node IDs display
 * - Blocking task IDs display
 * - No blocker section when arrays are empty or absent
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { BatchReadinessPill } from '../BatchReadinessPill';

describe('BatchReadinessPill', () => {
  it('renders the readiness state label', () => {
    render(<BatchReadinessPill readinessState="ready" />);
    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  it('uses ok (emerald) classes for ready state', () => {
    render(<BatchReadinessPill readinessState="ready" />);
    const chip = screen.getByText('ready');
    expect(chip.className).toContain('bg-[hsl(var(--success)/0.14)]');
    expect(chip.className).toContain('text-[hsl(var(--success-foreground))]');
  });

  it('uses error (rose) classes for blocked state', () => {
    render(<BatchReadinessPill readinessState="blocked" />);
    const chip = screen.getByText('blocked');
    expect(chip.className).toContain('bg-destructive/14');
    expect(chip.className).toContain('text-destructive');
  });

  it('uses warn (amber) classes for waiting state', () => {
    render(<BatchReadinessPill readinessState="waiting" />);
    const chip = screen.getByText('waiting');
    expect(chip.className).toContain('bg-[hsl(var(--warning)/0.14)]');
    expect(chip.className).toContain('text-[hsl(var(--warning-foreground))]');
  });

  it('uses neutral (slate) classes for unknown state', () => {
    render(<BatchReadinessPill readinessState="unknown" />);
    const chip = screen.getByText('unknown');
    expect(chip.className).toContain('bg-muted');
    expect(chip.className).toContain('text-muted-foreground');
  });

  it('renders blocking node IDs when provided', () => {
    render(
      <BatchReadinessPill
        readinessState="blocked"
        blockingNodeIds={['node-1', 'node-2']}
      />,
    );
    expect(screen.getByText('Blocking nodes: node-1, node-2')).toBeInTheDocument();
  });

  it('renders blocking task IDs when provided', () => {
    render(
      <BatchReadinessPill
        readinessState="blocked"
        blockingTaskIds={['TASK-1.1', 'TASK-1.2']}
      />,
    );
    expect(screen.getByText('Blocking tasks: TASK-1.1, TASK-1.2')).toBeInTheDocument();
  });

  it('does not render blocker details when arrays are empty', () => {
    render(
      <BatchReadinessPill
        readinessState="ready"
        blockingNodeIds={[]}
        blockingTaskIds={[]}
      />,
    );
    expect(screen.queryByText(/Blocking/)).not.toBeInTheDocument();
  });

  it('does not render blocker sections when arrays are absent', () => {
    render(<BatchReadinessPill readinessState="ready" />);
    expect(screen.queryByText(/Blocking/)).not.toBeInTheDocument();
  });
});
