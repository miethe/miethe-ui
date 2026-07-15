'use client';

/**
 * Switch stories — demonstrates controlled/uncontrolled states, size variants,
 * and the disabled state. Each story is fully interactive in the Storybook canvas.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../../src/primitives/Switch';

const meta = {
  title: 'Primitives/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible toggle switch built on Radix UI. Requires an accessible name via `aria-label` or `aria-labelledby`. Supports controlled and uncontrolled usage, and two size variants: `sm` and `md`.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Story 1: On (controlled, checked)
// ---------------------------------------------------------------------------

/**
 * Switch rendered in the checked/on state. Controlled via local state so the
 * toggle remains interactive in the canvas.
 */
export const On: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = React.useState(true);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Enable notifications"
        />
        <span style={{ fontSize: '0.875rem' }}>
          {checked ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 2: Off (controlled, unchecked)
// ---------------------------------------------------------------------------

/**
 * Switch rendered in the unchecked/off state.
 */
export const Off: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = React.useState(false);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Enable notifications"
        />
        <span style={{ fontSize: '0.875rem' }}>
          {checked ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 3: Disabled
// ---------------------------------------------------------------------------

/**
 * Switch in the disabled state — pointer events are blocked and opacity is
 * reduced. Shown in both checked and unchecked variants side-by-side.
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Switch disabled defaultChecked aria-label="Disabled on" />
        <span style={{ fontSize: '0.875rem', opacity: 0.5 }}>Disabled (on)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Switch disabled aria-label="Disabled off" />
        <span style={{ fontSize: '0.875rem', opacity: 0.5 }}>Disabled (off)</span>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Story 4: SizeSm
// ---------------------------------------------------------------------------

/**
 * Small size variant (`size="sm"`), compared against the default medium size.
 */
export const SizeSm: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Switch size="sm" defaultChecked aria-label="Small switch" />
        <span style={{ fontSize: '0.875rem' }}>sm (checked)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Switch size="md" defaultChecked aria-label="Medium switch" />
        <span style={{ fontSize: '0.875rem' }}>md (checked)</span>
      </div>
    </div>
  ),
};
