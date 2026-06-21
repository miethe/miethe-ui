/**
 * Card stories — demonstrates the composable Card subcomponents
 * (Card, CardHeader, CardContent, CardFooter) in isolation and combined.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter } from '../../src/primitives/Card';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composable card primitives (Card, CardHeader, CardContent, CardFooter). Each subcomponent accepts className and forwards a ref.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

/** Bare card with only CardContent — the minimal usage. */
export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: '360px' }}>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This is a default card with only content.
        </p>
      </CardContent>
    </Card>
  ),
};

// ---------------------------------------------------------------------------
// WithHeader
// ---------------------------------------------------------------------------

/** Card with a header section above the body content. */
export const WithHeader: Story = {
  render: () => (
    <Card style={{ maxWidth: '360px' }}>
      <CardHeader>
        <h3 className="text-lg font-semibold leading-none tracking-tight">Card Title</h3>
        <p className="text-sm text-muted-foreground">Optional subtitle or description.</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Card body — add any content here. The header provides visual separation via
          spacing utilities inherited from the design tokens.
        </p>
      </CardContent>
    </Card>
  ),
};

// ---------------------------------------------------------------------------
// WithFooter
// ---------------------------------------------------------------------------

/** Card with a header, content body, and a footer action row. */
export const WithFooter: Story = {
  render: () => (
    <Card style={{ maxWidth: '360px' }}>
      <CardHeader>
        <h3 className="text-lg font-semibold leading-none tracking-tight">Confirm Action</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. Proceed with caution.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <button
          type="button"
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border, #e2e8f0)',
            background: 'transparent',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            border: 'none',
            background: 'var(--primary, #0f172a)',
            color: 'var(--primary-foreground, #f8fafc)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Confirm
        </button>
      </CardFooter>
    </Card>
  ),
};
