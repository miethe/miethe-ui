/**
 * Unit tests for the StatusBadge primitive.
 *
 * Covers:
 * - Status text rendering (capitalized)
 * - Default color map variant resolution
 * - Fallback to "outline" for unknown statuses
 * - Custom statusColorMap override
 * - className passthrough to Badge
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../primitives/StatusBadge';

// ============================================================================
// Helpers
// ============================================================================

/** Returns the variant applied to the rendered Badge div.
 *  Badge renders a <div> whose class contains the variant's Tailwind classes.
 *  We check for presence of the class string we know each variant applies. */
function getRenderedVariantClasses(element: HTMLElement): string {
  return element.getAttribute('class') ?? '';
}

// ============================================================================
// Rendering — status text
// ============================================================================

describe('StatusBadge — status text', () => {
  test('1. renders the status text capitalized (lowercase input)', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  test('2. renders already-capitalized status without double-capitalizing', () => {
    render(<StatusBadge status="Published" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  test('3. capitalizes only the first character, preserving the rest', () => {
    render(<StatusBadge status="in-review" />);
    expect(screen.getByText('In-review')).toBeInTheDocument();
  });

  test('4. renders empty string without throwing', () => {
    const { container } = render(<StatusBadge status="" />);
    // Should render a Badge with empty text; just verify it mounts
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ============================================================================
// Default color map — variant resolution
// ============================================================================

describe('StatusBadge — default color map', () => {
  test('5. "draft" maps to secondary variant (contains bg-secondary class)', () => {
    render(<StatusBadge status="draft" data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('bg-secondary');
  });

  test('6. "published" maps to default variant (contains bg-primary class)', () => {
    render(<StatusBadge status="published" data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('bg-primary');
  });

  test('7. "deprecated" maps to destructive variant (contains bg-destructive class)', () => {
    render(<StatusBadge status="deprecated" data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('bg-destructive');
  });
});

// ============================================================================
// Fallback variant
// ============================================================================

describe('StatusBadge — fallback to outline', () => {
  test('8. unknown status falls back to outline variant (contains text-foreground, no bg-* token)', () => {
    render(<StatusBadge status="active" data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    const classes = getRenderedVariantClasses(badge);
    // outline variant applies text-foreground and no background token
    expect(classes).toContain('text-foreground');
    expect(classes).not.toContain('bg-primary');
    expect(classes).not.toContain('bg-secondary');
    expect(classes).not.toContain('bg-destructive');
  });

  test('9. empty string status falls back to outline variant', () => {
    render(<StatusBadge status="" data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('text-foreground');
  });
});

// ============================================================================
// Custom statusColorMap
// ============================================================================

describe('StatusBadge — custom statusColorMap', () => {
  test('10. custom map overrides a default mapping', () => {
    // Override "draft" to use destructive instead of secondary
    render(
      <StatusBadge
        status="draft"
        statusColorMap={{ draft: 'destructive' }}
        data-testid="badge"
      />
    );
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('bg-destructive');
  });

  test('11. custom map adds a new status mapping', () => {
    render(
      <StatusBadge
        status="archived"
        statusColorMap={{ archived: 'secondary' }}
        data-testid="badge"
      />
    );
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('bg-secondary');
  });

  test('12. custom map does not affect statuses it does not mention', () => {
    // Only defining "archived"; "published" should still resolve to default (bg-primary)
    render(
      <StatusBadge
        status="published"
        statusColorMap={{ archived: 'secondary' }}
        data-testid="badge"
      />
    );
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('bg-primary');
  });

  test('13. unknown status with no custom map entry still falls back to outline', () => {
    render(
      <StatusBadge
        status="unknown-status"
        statusColorMap={{ archived: 'secondary' }}
        data-testid="badge"
      />
    );
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('text-foreground');
  });
});

// ============================================================================
// className passthrough
// ============================================================================

describe('StatusBadge — className passthrough', () => {
  test('14. custom className is applied to the Badge element', () => {
    render(<StatusBadge status="draft" className="my-custom-class" data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(getRenderedVariantClasses(badge)).toContain('my-custom-class');
  });

  test('15. className is merged with variant classes (both present)', () => {
    render(
      <StatusBadge status="deprecated" className="extra-class" data-testid="badge" />
    );
    const badge = screen.getByTestId('badge');
    const classes = getRenderedVariantClasses(badge);
    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('extra-class');
  });
});
