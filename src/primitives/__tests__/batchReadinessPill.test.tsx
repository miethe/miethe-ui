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
    expect(chip.className).toContain('bg-emerald-600/20');
    expect(chip.className).toContain('text-emerald-400');
  });

  it('uses error (rose) classes for blocked state', () => {
    render(<BatchReadinessPill readinessState="blocked" />);
    const chip = screen.getByText('blocked');
    expect(chip.className).toContain('bg-rose-600/20');
    expect(chip.className).toContain('text-rose-400');
  });

  it('uses warn (amber) classes for waiting state', () => {
    render(<BatchReadinessPill readinessState="waiting" />);
    const chip = screen.getByText('waiting');
    expect(chip.className).toContain('bg-amber-600/20');
    expect(chip.className).toContain('text-amber-400');
  });

  it('uses neutral (slate) classes for unknown state', () => {
    render(<BatchReadinessPill readinessState="unknown" />);
    const chip = screen.getByText('unknown');
    expect(chip.className).toContain('bg-slate-700/60');
    expect(chip.className).toContain('text-slate-300');
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
