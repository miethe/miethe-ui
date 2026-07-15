/**
 * Spinner stories — demonstrates the three size variants and a custom aria-label.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../../src/primitives/Spinner';

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading indicator with `role="status"` and a visually-hidden accessible label. Three size variants: `sm`, `md` (default), `lg`.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Story 1: SizeSm
// ---------------------------------------------------------------------------

/** Small loading spinner, useful inside buttons or compact UI. */
export const SizeSm: Story = {
  render: () => <Spinner size="sm" aria-label="Loading" />,
};

// ---------------------------------------------------------------------------
// Story 2: SizeMd
// ---------------------------------------------------------------------------

/** Medium loading spinner — the default size. */
export const SizeMd: Story = {
  render: () => <Spinner size="md" aria-label="Loading" />,
};

// ---------------------------------------------------------------------------
// Story 3: SizeLg
// ---------------------------------------------------------------------------

/** Large loading spinner, suitable for full-page or section loading states. */
export const SizeLg: Story = {
  render: () => <Spinner size="lg" aria-label="Loading" />,
};

// ---------------------------------------------------------------------------
// Story 4: AllSizes
// ---------------------------------------------------------------------------

/** All three sizes side-by-side for quick visual comparison. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <Spinner size="sm" aria-label="Small loading" />
      <Spinner size="md" aria-label="Medium loading" />
      <Spinner size="lg" aria-label="Large loading" />
    </div>
  ),
};
