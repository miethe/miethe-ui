/**
 * Parity and accessibility tests for the ModalHeader primitive extracted to @miethe/ui.
 *
 * Covers:
 * - Functional parity with the original SkillMeat component
 * - WCAG 2.1 AA accessibility requirements
 *
 * Note: ModalHeader uses DialogTitle/DialogDescription from Radix UI, which require
 * a Dialog context. All renders are wrapped in <Dialog open> to satisfy this constraint.
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Dialog } from '../primitives/Dialog';
import { ModalHeader } from '../primitives/ModalHeader';

// ============================================================================
// Test helpers
// ============================================================================

/** Minimal icon stub that satisfies the ComponentType<{ className?: string }> contract.
 *  Spreads all props so aria-hidden and other attributes reach the DOM element.
 */
function TestIcon({ className, ...rest }: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return <svg data-testid="test-icon" className={className} {...rest} />;
}

/** Wrap in a Dialog so Radix Dialog context is satisfied (DialogTitle requires it). */
function WithDialog({ children }: { children: React.ReactNode }) {
  return <Dialog open>{children}</Dialog>;
}

function renderInDialog(ui: React.ReactElement) {
  return render(<WithDialog>{ui}</WithDialog>);
}

// ============================================================================
// Parity tests
// ============================================================================

describe('ModalHeader — parity', () => {
  test('1. renders title text', () => {
    renderInDialog(<ModalHeader title="Artifact Details" />);
    expect(screen.getByText('Artifact Details')).toBeInTheDocument();
  });

  test('2. renders subtitle/description when provided', () => {
    renderInDialog(<ModalHeader title="Title" description="Some helpful description" />);
    expect(screen.getByText('Some helpful description')).toBeInTheDocument();
  });

  test('3. does not render subtitle element when description is omitted', () => {
    renderInDialog(<ModalHeader title="Title" />);
    // No description text
    expect(screen.queryByText('Some helpful description')).not.toBeInTheDocument();
    // No DialogDescription (p element with description-level class) should appear
    expect(document.querySelector('p.text-sm.text-muted-foreground')).toBeNull();
  });

  test('4. renders icon slot content when icon prop provided', () => {
    renderInDialog(<ModalHeader icon={TestIcon} title="With Icon" />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  test('5. does not render icon when icon prop is omitted', () => {
    renderInDialog(<ModalHeader title="No Icon" />);
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  });

  test('6. renders actions slot content when provided', () => {
    renderInDialog(
      <ModalHeader
        title="With Actions"
        actions={<button type="button">Edit</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  test('7. does not render actions wrapper when actions is omitted', () => {
    renderInDialog(<ModalHeader title="No Actions" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('8. applies custom className to the header container', () => {
    const { container } = renderInDialog(
      <ModalHeader title="Styled" className="custom-header-class" />
    );
    // DialogHeader renders a div; cn merges border-b, px-6 etc. + custom class
    const header = container.querySelector('.custom-header-class');
    expect(header).toBeInTheDocument();
  });

  test('9. long title is truncated via CSS (truncate class applied to title span)', () => {
    const { container } = renderInDialog(
      <ModalHeader title="This is an extraordinarily long title that should be truncated by the component CSS rules" />
    );
    // The <span> wrapping the title text carries the truncate class
    const titleSpan = container.querySelector('span.truncate');
    expect(titleSpan).toBeInTheDocument();
    expect(titleSpan?.textContent).toContain('This is an extraordinarily long title');
  });

  test('10. renders multiple children in the actions slot', () => {
    renderInDialog(
      <ModalHeader
        title="Multi Action"
        actions={
          <>
            <button type="button">Save</button>
            <button type="button">Cancel</button>
          </>
        }
      />
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});

// ============================================================================
// A11y tests
// ============================================================================

describe('ModalHeader — a11y', () => {
  test('a11y-1. title is rendered as a heading element (h2 or role="heading")', () => {
    renderInDialog(<ModalHeader title="Accessible Title" />);
    // DialogTitle from Radix renders as h2 by default
    const heading = screen.getByRole('heading', { name: /Accessible Title/i });
    expect(heading).toBeInTheDocument();
  });

  test('a11y-2. decorative icon has aria-hidden="true"', () => {
    renderInDialog(<ModalHeader icon={TestIcon} title="Icon A11y" />);
    const icon = screen.getByTestId('test-icon');
    // aria-hidden is passed as a prop to the icon component; it lands on the svg element
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  test('a11y-3. iconClassName is forwarded to the icon element (classes are accessible via DOM)', () => {
    renderInDialog(
      <ModalHeader icon={TestIcon} iconClassName="text-primary" title="Icon Class" />
    );
    const icon = screen.getByTestId('test-icon');
    // SVG className is an SVGAnimatedString; use getAttribute or .baseVal
    const classValue = icon.getAttribute('class') ?? '';
    expect(classValue).toContain('text-primary');
  });
});
