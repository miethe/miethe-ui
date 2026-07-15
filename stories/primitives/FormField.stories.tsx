/**
 * FormField stories — demonstrates the composable form-field wrapper
 * in default, error, and required-field states.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from '../../src/primitives/FormField';

/** Minimal text input for story scaffolding — not a package export. */
function DemoInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      style={{
        height: '2.25rem',
        padding: '0 0.75rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--border, #e2e8f0)',
        fontSize: '0.875rem',
        width: '100%',
      }}
      {...props}
    />
  );
}

const meta = {
  title: 'Primitives/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composable wrapper rendering an optional Label, child control, optional error (`role="alert"`), and optional hint text.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

/** Label + hint text below the control. No validation state. */
export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: '320px' }}>
      <FormField
        label="Display name"
        htmlFor="display-name"
        hint="This appears publicly on your profile."
      >
        <DemoInput id="display-name" placeholder="Jane Doe" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// WithError
// ---------------------------------------------------------------------------

/**
 * When `error` is provided the message is rendered with `role="alert"` so
 * assistive technology announces it immediately. The hint is hidden while an
 * error is active to avoid visual clutter.
 */
export const WithError: Story = {
  render: () => (
    <div style={{ maxWidth: '320px' }}>
      <FormField
        label="Email"
        htmlFor="email-error"
        error="Enter a valid email address."
        hint="We'll never share your email."
      >
        <DemoInput
          id="email-error"
          type="email"
          defaultValue="not-an-email"
          style={{
            height: '2.25rem',
            padding: '0 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--destructive, #ef4444)',
            fontSize: '0.875rem',
            width: '100%',
          }}
        />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// RequiredField
// ---------------------------------------------------------------------------

/**
 * The `required` prop appends a decorative asterisk to the label (hidden from
 * AT via `aria-hidden`) and sets `data-required="true"` on the control
 * wrapper for downstream CSS hooks.
 */
export const RequiredField: Story = {
  render: () => (
    <div style={{ maxWidth: '320px' }}>
      <FormField
        label="Password"
        htmlFor="password-required"
        required
        hint="Must be at least 8 characters."
      >
        <DemoInput id="password-required" type="password" placeholder="••••••••" />
      </FormField>
    </div>
  ),
};
