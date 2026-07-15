/**
 * Unit tests for the MismatchBadge primitive.
 *
 * Ported from CCDash Planning/primitives/__tests__/mismatchBadge.test.tsx (PCP-709).
 * Adapted to use Jest + @testing-library/react.
 *
 * Covers:
 * - Banner variant (compact=false): title text, reason, evidence chips, amber classes
 * - Compact variant (compact=true): inline state label, no banner title, title attribute, amber chip classes
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MismatchBadge } from '../MismatchBadge';

describe('MismatchBadge — banner variant (compact=false)', () => {
  it('renders the fixed title text', () => {
    render(
      <MismatchBadge state="mismatched" reason="Progress says done but PRD is pending" />,
    );
    expect(screen.getByText('Status mismatch detected')).toBeInTheDocument();
  });

  it('renders the reason text', () => {
    render(<MismatchBadge state="mismatched" reason="Reason text here" />);
    expect(screen.getByText('Reason text here')).toBeInTheDocument();
  });

  it('renders evidence label chips', () => {
    render(
      <MismatchBadge
        state="stale"
        reason="Stale doc"
        evidenceLabels={['PRD-outdated', 'progress-diverged']}
      />,
    );
    expect(screen.getByText('PRD-outdated')).toBeInTheDocument();
    expect(screen.getByText('progress-diverged')).toBeInTheDocument();
  });

  it('does not render evidence chips when evidenceLabels is empty', () => {
    const { container } = render(
      <MismatchBadge state="mismatched" reason="reason" evidenceLabels={[]} />,
    );
    // bg-amber-500/20 is only on the evidence chip spans
    expect(container.innerHTML).not.toContain('bg-amber-500/20');
  });

  it('uses amber border and bg classes on the banner container', () => {
    const { container } = render(<MismatchBadge state="mismatched" reason="x" />);
    const bannerDiv = container.firstChild as HTMLElement;
    expect(bannerDiv.className).toContain('border-amber-500/30');
    expect(bannerDiv.className).toContain('bg-amber-500/10');
  });
});

describe('MismatchBadge — compact variant (compact=true)', () => {
  it('renders the state label inline', () => {
    render(
      <MismatchBadge state="reversed" reason="Reversed at feature level" compact />,
    );
    expect(screen.getByText('reversed')).toBeInTheDocument();
  });

  it('does not render the banner title in compact mode', () => {
    render(<MismatchBadge state="stale" reason="stale reason" compact />);
    expect(screen.queryByText('Status mismatch detected')).not.toBeInTheDocument();
  });

  it('sets reason as title attribute for tooltip', () => {
    render(<MismatchBadge state="stale" reason="hover explanation" compact />);
    const chip = screen.getByTitle('hover explanation');
    expect(chip).toBeInTheDocument();
  });

  it('uses amber chip classes on the compact span', () => {
    const { container } = render(<MismatchBadge state="blocked" reason="x" compact />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('border-amber-500/30');
    expect(span?.className).toContain('bg-amber-500/10');
    expect(span?.className).toContain('text-amber-300');
  });
});
