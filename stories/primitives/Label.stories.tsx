/**
 * Label stories — demonstrates the Label primitive in default
 * and peer-disabled states.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '../../src/primitives/Label';

const meta = {
  title: 'Primitives/Label',
  component: Label,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Thin label wrapper with CVA base classes. Pairs with any input via `htmlFor`. Inherits `peer-disabled` opacity when a sibling input is disabled.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

/** Label paired with a text input. */
export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5" style={{ maxWidth: '280px' }}>
      <Label htmlFor="demo-input">Email address</Label>
      <input
        id="demo-input"
        type="email"
        placeholder="you@example.com"
        style={{
          height: '2.25rem',
          padding: '0 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid var(--border, #e2e8f0)',
          fontSize: '0.875rem',
          width: '100%',
        }}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

/**
 * When the sibling input carries the `peer` class and is `disabled`, the
 * `peer-disabled` Tailwind variants dim the label automatically. This story
 * wires that pattern explicitly.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5" style={{ maxWidth: '280px' }}>
      <Label htmlFor="disabled-input" className="peer-disabled:opacity-70">
        Username
      </Label>
      <input
        id="disabled-input"
        type="text"
        placeholder="jdoe"
        disabled
        className="peer"
        style={{
          height: '2.25rem',
          padding: '0 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid var(--border, #e2e8f0)',
          fontSize: '0.875rem',
          width: '100%',
          opacity: 0.5,
          cursor: 'not-allowed',
        }}
      />
    </div>
  ),
};
