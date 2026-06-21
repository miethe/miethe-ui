/**
 * Unit tests for the EffectiveStatusChips primitive.
 *
 * Ported from CCDash Planning/primitives/__tests__/effectiveStatusChips.test.tsx (PCP-709).
 * Adapted to use Jest + @testing-library/react.
 *
 * Covers:
 * - Raw status chip always rendered
 * - Effective status chip shown only when it differs from rawStatus
 * - isMismatch applies warn variant to eff chip
 * - Provenance hover panel rendered when provenance is supplied
 * - No provenance panel when provenance is absent
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { EffectiveStatusChips } from '../EffectiveStatusChips';

describe('EffectiveStatusChips', () => {
  it('always renders the raw status chip', () => {
    render(<EffectiveStatusChips rawStatus="pending" />);
    expect(screen.getByText('raw: pending')).toBeInTheDocument();
  });

  it('does not render the eff: chip when effectiveStatus equals rawStatus', () => {
    render(<EffectiveStatusChips rawStatus="done" effectiveStatus="done" />);
    expect(screen.queryByText(/eff:/)).not.toBeInTheDocument();
  });

  it('renders the eff: chip when effectiveStatus differs from rawStatus', () => {
    render(<EffectiveStatusChips rawStatus="pending" effectiveStatus="blocked" />);
    expect(screen.getByText('eff: blocked')).toBeInTheDocument();
  });

  it('hides eff: chip when effectiveStatus is undefined', () => {
    render(<EffectiveStatusChips rawStatus="pending" />);
    expect(screen.queryByText(/eff:/)).not.toBeInTheDocument();
  });

  it('applies warn variant to eff: chip when isMismatch is true', () => {
    const { container } = render(
      <EffectiveStatusChips
        rawStatus="done"
        effectiveStatus="blocked"
        isMismatch={true}
      />,
    );
    expect(screen.getByText('eff: blocked')).toBeInTheDocument();
    // warn variant uses amber classes — find eff chip span by text then check parent classes
    const effSpan = screen.getByText('eff: blocked');
    expect(effSpan.className).toContain('bg-amber-600/20');
    expect(effSpan.className).toContain('text-amber-400');
    // Satisfy the linter — container is used for structural inspection if needed
    expect(container).toBeTruthy();
  });

  it('renders provenance tooltip content in the hover panel', () => {
    const { container } = render(
      <EffectiveStatusChips
        rawStatus="in_progress"
        provenance={{
          source: 'derived',
          reason: 'Status inferred from progress document',
          evidence: [],
        }}
      />,
    );
    expect(container.innerHTML).toContain('Provenance');
    expect(container.innerHTML).toContain('Source: derived');
    expect(container.innerHTML).toContain('Status inferred from progress document');
  });

  it('does not render provenance panel when provenance is absent', () => {
    const { container } = render(<EffectiveStatusChips rawStatus="done" />);
    expect(container.innerHTML).not.toContain('Provenance');
  });
});
