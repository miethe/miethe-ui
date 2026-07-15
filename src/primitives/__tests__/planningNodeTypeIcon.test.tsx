/**
 * Unit tests for the PlanningNodeTypeIcon primitive.
 *
 * New test added during PCP-709 extraction — CCDash flagged this component
 * as having no unit test coverage (implicit coverage only via parent components).
 *
 * Covers:
 * - All 7 named node types render without throwing
 * - Default case renders without throwing (cast unknown type)
 * - Size prop is passed to the rendered SVG element
 * - Custom className is forwarded to the SVG element
 * - Distinct icon types produce different SVG markup
 */

import * as React from 'react';
import { render } from '@testing-library/react';
import { PlanningNodeTypeIcon } from '../PlanningNodeTypeIcon';
import type { PlanningNodeType } from '../PlanningNodeTypeIcon';

// All seven explicitly mapped node types
const NODE_TYPES: PlanningNodeType[] = [
  'design_spec',
  'prd',
  'implementation_plan',
  'progress',
  'context',
  'tracker',
  'report',
];

describe('PlanningNodeTypeIcon — all node types render', () => {
  NODE_TYPES.forEach(type => {
    it(`renders without throwing for type="${type}"`, () => {
      expect(() => render(<PlanningNodeTypeIcon type={type} />)).not.toThrow();
    });
  });

  it('renders without throwing for an unknown/default type (cast)', () => {
    const unknown = 'unknown_type' as PlanningNodeType;
    expect(() => render(<PlanningNodeTypeIcon type={unknown} />)).not.toThrow();
  });
});

describe('PlanningNodeTypeIcon — produces non-empty SVG output', () => {
  NODE_TYPES.forEach(type => {
    it(`produces SVG markup for type="${type}"`, () => {
      const { container } = render(<PlanningNodeTypeIcon type={type} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });
  });
});

describe('PlanningNodeTypeIcon — prop forwarding', () => {
  it('applies custom size to the svg width and height', () => {
    const { container } = render(<PlanningNodeTypeIcon type="prd" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('defaults size to 13', () => {
    const { container } = render(<PlanningNodeTypeIcon type="prd" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('13');
    expect(svg?.getAttribute('height')).toBe('13');
  });

  it('applies custom className to the svg element', () => {
    const { container } = render(
      <PlanningNodeTypeIcon type="prd" className="text-blue-400 custom-icon" />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-blue-400');
    expect(svg?.getAttribute('class')).toContain('custom-icon');
  });

  it('defaults className to shrink-0 text-muted-foreground', () => {
    const { container } = render(<PlanningNodeTypeIcon type="prd" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('shrink-0');
    expect(svg?.getAttribute('class')).toContain('text-muted-foreground');
  });
});

describe('PlanningNodeTypeIcon — distinct icon coverage', () => {
  it('design_spec and prd produce different SVG content', () => {
    const { container: c1 } = render(<PlanningNodeTypeIcon type="design_spec" />);
    const { container: c2 } = render(<PlanningNodeTypeIcon type="prd" />);
    expect(c1.innerHTML).not.toEqual(c2.innerHTML);
  });

  it('implementation_plan and progress produce different SVG content', () => {
    const { container: c1 } = render(<PlanningNodeTypeIcon type="implementation_plan" />);
    const { container: c2 } = render(<PlanningNodeTypeIcon type="progress" />);
    expect(c1.innerHTML).not.toEqual(c2.innerHTML);
  });

  it('context (Tag icon) and tracker (AlertCircle icon) produce different SVG content', () => {
    const { container: c1 } = render(<PlanningNodeTypeIcon type="context" />);
    const { container: c2 } = render(<PlanningNodeTypeIcon type="tracker" />);
    expect(c1.innerHTML).not.toEqual(c2.innerHTML);
  });
});
