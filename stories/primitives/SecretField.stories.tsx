'use client';

/**
 * SecretField stories — demonstrates the write-only secret entry primitive.
 *
 * IMPORTANT: none of these stories pass a real or fake stored secret VALUE
 * into the component. There is no such prop — that is the security point of
 * the component. Only `isSet: boolean` is passed to indicate whether a value
 * exists on the server.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SecretField } from '../../src/primitives/SecretField';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Primitives/SecretField',
  component: SecretField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Write-only secret entry field (DEC-FE-5). The component NEVER receives or displays the stored secret value — only a boolean `isSet` flag indicating whether one exists. Typed input is cleared immediately on Save or Cancel.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
} satisfies Meta<typeof SecretField>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Story 1: IsSet — secret already configured
// ---------------------------------------------------------------------------

/**
 * When `isSet` is true the component renders a "Configured" badge and a
 * "Replace" button. The stored secret value is NEVER shown or passed in —
 * the component only knows one exists. Click "Replace" to reveal the masked
 * input for entering a new value.
 */
export const IsSet: Story = {
  args: {
    label: 'ANTHROPIC_API_KEY',
    isSet: true,
    description: 'Used for all Claude API calls. Stored encrypted server-side.',
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isSet, setIsSet] = React.useState(args.isSet);

    return (
      <div style={{ maxWidth: '480px', padding: '1.5rem' }}>
        <SecretField
          {...args}
          isSet={isSet}
          onSubmit={async (newValue) => {
            // Simulate an API call — the value arrives here but is never stored
            // in component state or logged.
            await new Promise((r) => setTimeout(r, 600));
            void newValue; // acknowledged by caller, not retained
            setIsSet(true);
          }}
        />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 2: NotSet — no secret configured yet
// ---------------------------------------------------------------------------

/**
 * When `isSet` is false the masked input is shown immediately (no "Replace"
 * flow needed). Save button is disabled until the user types something.
 * After saving the field transitions to the `isSet=true` state showing the
 * "Configured" badge — still no stored value is displayed.
 */
export const NotSet: Story = {
  args: {
    label: 'OPENAI_API_KEY',
    isSet: false,
    description: 'Optional. Used as a fallback LLM provider.',
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isSet, setIsSet] = React.useState(false);

    return (
      <div style={{ maxWidth: '480px', padding: '1.5rem' }}>
        <SecretField
          {...args}
          isSet={isSet}
          onSubmit={async (newValue) => {
            await new Promise((r) => setTimeout(r, 600));
            void newValue; // acknowledged by caller, not retained
            setIsSet(true);
          }}
        />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 3: InputClearsAfterSave — security demonstration
// ---------------------------------------------------------------------------

/**
 * Interactive demonstration that the input is cleared immediately after Save.
 *
 * 1. Type any value into the masked input.
 * 2. Click "Save" (or press Enter).
 * 3. The input clears — the typed value no longer exists in local state.
 * 4. The "Last submitted at" timestamp updates, proving onSubmit was called.
 *
 * This story also demonstrates the Cancel path: click "Replace" then "Cancel"
 * to verify the typed value is cleared without calling onSubmit.
 */
export const InputClearsAfterSave: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isSet, setIsSet] = React.useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [lastSubmitAt, setLastSubmitAt] = React.useState<Date | null>(null);

    return (
      <div
        style={{
          maxWidth: '480px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <SecretField
          label="SECRET_TOKEN"
          isSet={isSet}
          description="Type anything and click Save. The input clears immediately after."
          onSubmit={async (newValue) => {
            // The value is received here by the caller. We do NOT store it in
            // any React state — we only record that a submission happened.
            void newValue;
            await new Promise((r) => setTimeout(r, 400));
            setIsSet(true);
            setLastSubmitAt(new Date());
          }}
        />

        {/* Proof-of-submission indicator — shows time, not the value */}
        {lastSubmitAt && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted-foreground, #64748b)',
              fontFamily: 'monospace',
            }}
          >
            onSubmit called at {lastSubmitAt.toLocaleTimeString()} — input was
            cleared immediately after.
          </p>
        )}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 4: WithError — error state
// ---------------------------------------------------------------------------

/**
 * Demonstrates the error display. The error string is rendered with
 * `role="alert"` so screen readers announce it immediately.
 */
export const WithError: Story = {
  args: {
    label: 'PORTAL_API_KEY',
    isSet: false,
    error: 'Invalid API key format. Expected a 32-character hexadecimal string.',
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 200));
    },
  },
};

// ---------------------------------------------------------------------------
// Story 5: Disabled — all controls inactive
// ---------------------------------------------------------------------------

/**
 * Both the `isSet=true` Replace button and the `isSet=false` Save button are
 * disabled. Used when the parent form is in a read-only or loading state.
 */
export const Disabled: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '480px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <SecretField
        label="CONFIGURED_AND_DISABLED"
        isSet
        disabled
        description="This field is disabled while the form is saving."
        onSubmit={() => {}}
      />
      <SecretField
        label="UNSET_AND_DISABLED"
        isSet={false}
        disabled
        description="This field is disabled while the form is saving."
        onSubmit={() => {}}
      />
    </div>
  ),
};
