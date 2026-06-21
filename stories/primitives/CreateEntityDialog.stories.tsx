'use client';

/**
 * CreateEntityDialog stories — demonstrates all three form modes (simple,
 * tabs, composite) and the standalone CollectionPicker component.
 *
 * Stories use local useState wrappers so dialogs are fully interactive in
 * the Storybook canvas. No external API calls are made — all data is mocked.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  CreateEntityDialog,
  type EntityFormSchema,
  type CollectionItem,
} from '../../src/primitives/CreateEntityDialog';
import { CollectionPicker } from '../../src/primitives/CollectionPicker';
import type { CollectionPickerProps } from '../../src/primitives/CollectionPicker';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MOCK_COLLECTIONS: CollectionItem[] = [
  {
    id: 'col-1',
    name: 'Personal Skills',
    description: 'My curated skill collection',
  },
  {
    id: 'col-2',
    name: 'Team Agents',
    description: 'Shared agent library for the platform team',
  },
  {
    id: 'col-3',
    name: 'Experimental Workflows',
    description: 'WIP workflows under active development',
  },
  {
    id: 'col-4',
    name: 'Production MCP Servers',
  },
];

/** Minimal Zod-compatible validator (no zod dependency in the package) */
function makeMinLengthValidator(min: number, label: string) {
  return {
    safeParse(v: unknown) {
      const s = typeof v === 'string' ? v : '';
      if (s.length < min) {
        return {
          success: false as const,
          error: {
            issues: [
              {
                message: `${label} must be at least ${min} characters`,
              },
            ],
          },
        };
      }
      return { success: true as const };
    },
  };
}

const SIMPLE_SCHEMA: EntityFormSchema = {
  mode: 'simple',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'e.g. canvas-design',
      description: 'Unique identifier for this artifact within your collection.',
      validation: makeMinLengthValidator(3, 'Name'),
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Briefly describe what this artifact does…',
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'tags',
      placeholder: 'Add tags and press Enter',
      description: 'Comma-separated keywords for search and filtering.',
    },
  ],
};

const TABS_SCHEMA: EntityFormSchema = {
  mode: 'tabs',
  tabs: [
    {
      id: 'general',
      label: 'General',
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. my-agent',
          validation: makeMinLengthValidator(3, 'Name'),
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Describe what this agent does…',
        },
      ],
    },
    {
      id: 'advanced',
      label: 'Advanced',
      fields: [
        {
          name: 'tags',
          label: 'Tags',
          type: 'tags',
          placeholder: 'Add tags…',
        },
        {
          name: 'scope',
          label: 'Scope',
          type: 'select',
          options: [
            { value: 'user', label: 'User (global)' },
            { value: 'local', label: 'Local (project only)' },
          ],
          defaultValue: 'user',
          description: 'Where this artifact is stored and available.',
        },
        {
          name: 'experimental',
          label: 'Mark as experimental',
          type: 'boolean',
          description: 'Experimental artifacts are excluded from production deployments.',
        },
      ],
    },
  ],
};

const COMPOSITE_SCHEMA: EntityFormSchema = {
  mode: 'composite',
  tabs: [
    {
      id: 'details',
      label: 'Details',
      fields: [
        {
          name: 'name',
          label: 'Bundle Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. platform-foundation',
          validation: makeMinLengthValidator(3, 'Bundle Name'),
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'What does this bundle contain and when should it be used?',
        },
        {
          name: 'version',
          label: 'Initial Version',
          type: 'text',
          placeholder: '1.0.0',
          defaultValue: '1.0.0',
        },
      ],
    },
    {
      id: 'metadata',
      label: 'Metadata',
      fields: [
        {
          name: 'tags',
          label: 'Tags',
          type: 'tags',
          placeholder: 'Add tags…',
        },
        {
          name: 'tier',
          label: 'Artifact Tier',
          type: 'select',
          options: [
            { value: '0', label: 'Tier 0 — Atomic' },
            { value: '1', label: 'Tier 1 — Composite' },
            { value: '2', label: 'Tier 2 — Collection' },
            { value: '3', label: 'Tier 3 — Distribution' },
          ],
          defaultValue: '3',
        },
        {
          name: 'platforms',
          label: 'Target Platforms',
          type: 'multiselect',
          options: [
            { value: 'ui', label: 'Web UI' },
            { value: 'cli', label: 'CLI' },
            { value: 'claude', label: 'Claude Desktop' },
            { value: 'marketplace', label: 'Marketplace' },
          ],
          defaultValue: [],
        },
      ],
    },
  ],
  members: {
    entityType: 'artifact',
    label: 'Bundle Members',
    validateMin: 1,
    validateMax: 50,
  },
};

// ---------------------------------------------------------------------------
// Wrapper helpers
// ---------------------------------------------------------------------------

/** Renders a button that opens the dialog on click, keeping stories self-contained */
function DialogLauncher({
  label,
  children,
}: {
  label: string;
  children: (open: boolean, setOpen: (v: boolean) => void) => React.ReactNode;
}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '2.5rem',
          padding: '0 1rem',
          borderRadius: '0.375rem',
          background: 'var(--primary, #0f172a)',
          color: 'var(--primary-foreground, #f8fafc)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          border: 'none',
        }}
      >
        {label}
      </button>
      {children(open, setOpen)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Primitives/CreateEntityDialog',
  component: CreateEntityDialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Schema-driven creation dialog supporting three modes: simple (single field list), tabs (grouped fields), and composite (tabs + member picker + review step). All modes integrate with CollectionPicker for collection scoping.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CreateEntityDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Story 1: SimpleMode
// ---------------------------------------------------------------------------

/**
 * The minimal configuration: name (required), description (textarea), and
 * tags fields. Demonstrates basic field rendering, required-field validation,
 * and Zod-compatible per-field validators.
 *
 * Click "Create Skill" to open the dialog. Submit without filling Name to
 * trigger the inline validation error.
 */
export const SimpleMode: Story = {
  render: () => (
    <DialogLauncher label="Create Skill">
      {(open, setOpen) => (
        <CreateEntityDialog
          open={open}
          onOpenChange={setOpen}
          title="Create Skill"
          description="Add a new skill to your personal collection."
          submitLabel="Create Skill"
          schema={SIMPLE_SCHEMA}
          onSubmit={async (values) => {
            await new Promise((r) => setTimeout(r, 800));
            // eslint-disable-next-line no-console
            console.log('[SimpleMode] submitted:', values);
            setOpen(false);
          }}
        />
      )}
    </DialogLauncher>
  ),
};

// ---------------------------------------------------------------------------
// Story 2: SimpleModeWithCollection
// ---------------------------------------------------------------------------

/**
 * Simple form with CollectionPicker enabled and `col-2` pre-filled as the
 * default. The picker is collapsible — click "Collection" to expand or
 * collapse it. Demonstrates how `defaultCollectionId` seeds the picker and
 * how the selection is included in the submitted payload as `_collectionId`.
 */
export const SimpleModeWithCollection: Story = {
  render: () => (
    <DialogLauncher label="Add to Collection">
      {(open, setOpen) => (
        <CreateEntityDialog
          open={open}
          onOpenChange={setOpen}
          title="Add Agent"
          description="Create an agent and assign it to a collection."
          submitLabel="Add Agent"
          schema={{
            ...SIMPLE_SCHEMA,
            collection: {
              enabled: true,
              required: true,
              collapsible: true,
              defaultCollectionId: 'col-2',
            },
          }}
          collections={MOCK_COLLECTIONS}
          defaultCollectionId="col-2"
          onSubmit={async (values) => {
            await new Promise((r) => setTimeout(r, 600));
            // eslint-disable-next-line no-console
            console.log('[SimpleModeWithCollection] submitted:', values);
            setOpen(false);
          }}
        />
      )}
    </DialogLauncher>
  ),
};

// ---------------------------------------------------------------------------
// Story 3: TabsMode
// ---------------------------------------------------------------------------

/**
 * Two-tab form: General (name + description) and Advanced (tags + scope +
 * experimental toggle). Demonstrates tab switching, cross-tab validation
 * (submit without filling Name — the General tab gets an error badge), and
 * the select / boolean field renderers.
 */
export const TabsMode: Story = {
  render: () => (
    <DialogLauncher label="Create Agent">
      {(open, setOpen) => (
        <CreateEntityDialog
          open={open}
          onOpenChange={setOpen}
          title="Create Agent"
          description="Configure your agent across General and Advanced settings."
          submitLabel="Create Agent"
          schema={TABS_SCHEMA}
          onSubmit={async (values) => {
            await new Promise((r) => setTimeout(r, 700));
            // eslint-disable-next-line no-console
            console.log('[TabsMode] submitted:', values);
            setOpen(false);
          }}
        />
      )}
    </DialogLauncher>
  ),
};

// ---------------------------------------------------------------------------
// Story 4: CompositeMode
// ---------------------------------------------------------------------------

/**
 * Full bundle-wizard flow: Details tab, Metadata tab, Members tab (pill-style
 * input, min 1 member required), and a Review tab showing a default field
 * summary. Submit without adding members to see the members error state and
 * automatic navigation to the Members tab.
 */
export const CompositeMode: Story = {
  render: () => (
    <DialogLauncher label="Create Bundle">
      {(open, setOpen) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [memberIds, setMemberIds] = React.useState<string[]>([
          'skill:canvas-design',
          'agent:research-assistant',
        ]);
        return (
          <CreateEntityDialog
            open={open}
            onOpenChange={setOpen}
            title="Create Bundle"
            description="Compose a bundle from existing artifacts."
            submitLabel="Create Bundle"
            schema={COMPOSITE_SCHEMA}
            collections={MOCK_COLLECTIONS}
            memberIds={memberIds}
            onMemberIdsChange={setMemberIds}
            onSubmit={async (values) => {
              await new Promise((r) => setTimeout(r, 900));
              // eslint-disable-next-line no-console
              console.log('[CompositeMode] submitted:', values);
              setOpen(false);
            }}
          />
        );
      }}
    </DialogLauncher>
  ),
};

// ---------------------------------------------------------------------------
// Story 5: CompositeModeWithReviewStep
// ---------------------------------------------------------------------------

/**
 * Same composite schema but with a custom `renderReviewStep` that renders a
 * styled summary card instead of the default field list. Switch to the Review
 * tab to see the bespoke summary panel. Demonstrates the `renderReviewStep`
 * escape hatch for domain-specific review UIs.
 */
export const CompositeModeWithReviewStep: Story = {
  render: () => (
    <DialogLauncher label="Create Bundle (Custom Review)">
      {(open, setOpen) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [memberIds, setMemberIds] = React.useState<string[]>([
          'skill:canvas-design',
          'agent:research-assistant',
          'hook:pre-commit-lint',
        ]);
        const schemaWithReview: EntityFormSchema = {
          ...COMPOSITE_SCHEMA,
          mode: 'composite' as const,
          renderReviewStep: ({ values, memberIds: ids }) => (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border, #e2e8f0)',
                background: 'var(--muted, #f1f5f9)',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--muted-foreground, #64748b)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Bundle Summary
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {String(values.name || 'Unnamed Bundle')}
                </p>
                {Boolean(values.description) && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground, #64748b)',
                      marginTop: '0.25rem',
                    }}
                  >
                    {String(values.description)}
                  </p>
                )}
              </div>

              <div>
                <p
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--muted-foreground, #64748b)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {ids.length} Member{ids.length === 1 ? '' : 's'}
                </p>
                <ul
                  role="list"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                  }}
                >
                  {ids.map((id) => (
                    <li
                      key={id}
                      role="listitem"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '0.375rem',
                          height: '0.375rem',
                          borderRadius: '50%',
                          background: 'var(--primary, #0f172a)',
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      {id}
                    </li>
                  ))}
                </ul>
              </div>

              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground, #64748b)',
                  marginTop: '0.25rem',
                }}
              >
                Ready to create. Click &ldquo;Create Bundle&rdquo; to confirm.
              </p>
            </div>
          ),
        };
        return (
          <CreateEntityDialog
            open={open}
            onOpenChange={setOpen}
            title="Create Bundle"
            description="Compose a bundle and review before creating."
            submitLabel="Create Bundle"
            schema={schemaWithReview}
            collections={MOCK_COLLECTIONS}
            memberIds={memberIds}
            onMemberIdsChange={setMemberIds}
            onSubmit={async (values) => {
              await new Promise((r) => setTimeout(r, 900));
              // eslint-disable-next-line no-console
              console.log('[CompositeModeWithReviewStep] submitted:', values);
              setOpen(false);
            }}
          />
        );
      }}
    </DialogLauncher>
  ),
};

// ---------------------------------------------------------------------------
// Story 6: WithError
// ---------------------------------------------------------------------------

/**
 * Simple mode with a pre-set `error` prop showing an inline error banner at
 * the top of the dialog. This is the pattern used when an API call fails after
 * the user submits — the parent catches the error and passes it back as a
 * string prop.
 */
export const WithError: Story = {
  render: () => (
    <DialogLauncher label="Open (with server error)">
      {(open, setOpen) => (
        <CreateEntityDialog
          open={open}
          onOpenChange={setOpen}
          title="Create Skill"
          description="This dialog shows a pre-set error banner."
          submitLabel="Create Skill"
          schema={SIMPLE_SCHEMA}
          error="A skill named 'canvas-design' already exists in your collection. Choose a different name."
          onSubmit={async (values) => {
            // eslint-disable-next-line no-console
            console.log('[WithError] submitted:', values);
          }}
        />
      )}
    </DialogLauncher>
  ),
};

// ---------------------------------------------------------------------------
// Story 7: SubmittingState
// ---------------------------------------------------------------------------

/**
 * Simple mode locked into the submitting state (`isSubmitting: true`). All
 * fields and buttons are disabled; the submit button shows "Saving…". Useful
 * for verifying loading-state accessibility and visual treatment.
 */
export const SubmittingState: Story = {
  render: () => (
    <DialogLauncher label="Open (submitting)">
      {(open, setOpen) => (
        <CreateEntityDialog
          open={open}
          onOpenChange={setOpen}
          title="Create Skill"
          description="Fields are locked while saving."
          submitLabel="Create Skill"
          isSubmitting
          schema={SIMPLE_SCHEMA}
          onSubmit={async () => {
            /* no-op — dialog is already in submitting state */
          }}
        />
      )}
    </DialogLauncher>
  ),
};

// ---------------------------------------------------------------------------
// Story 8: CollectionPickerStory — standalone CollectionPicker
// ---------------------------------------------------------------------------

/**
 * Standalone CollectionPicker story showing three states side-by-side:
 *
 * 1. **Collapsed** — collapsible picker in its closed state (no selection)
 * 2. **Expanded with selection** — picker open with a pre-filled collection
 * 3. **Single collection (auto-select)** — only one collection available;
 *    picker renders as read-only with the sole collection pre-selected
 *
 * Each pane is fully interactive — click the trigger to expand/collapse,
 * and search or clear the selection.
 */
export const CollectionPickerStory: Story = {
  name: 'CollectionPicker (standalone)',
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value1, setValue1] = React.useState<string | undefined>(undefined);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value2, setValue2] = React.useState<string | undefined>('col-1');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value3, setValue3] = React.useState<string | undefined>(undefined);

    const sharedStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: '0.6875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--muted-foreground, #64748b)',
    };

    const baseProps: Omit<CollectionPickerProps, 'value' | 'onChange' | 'config'> = {
      collections: MOCK_COLLECTIONS,
    };

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          padding: '1.5rem',
          maxWidth: '960px',
        }}
      >
        {/* State 1: Collapsible, collapsed, no selection */}
        <div style={sharedStyle}>
          <p style={labelStyle}>1. Collapsible — collapsed (no selection)</p>
          <CollectionPicker
            {...baseProps}
            config={{ enabled: true, required: true, collapsible: true }}
            value={value1}
            onChange={(id) => setValue1(id || undefined)}
          />
          {value1 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground, #64748b)' }}>
              Selected: {value1}
            </p>
          )}
        </div>

        {/* State 2: Collapsible, expanded, pre-selected */}
        <div style={sharedStyle}>
          <p style={labelStyle}>2. Collapsible — expanded with pre-selection</p>
          <CollectionPicker
            {...baseProps}
            config={{
              enabled: true,
              required: true,
              collapsible: true,
              defaultCollectionId: 'col-1',
            }}
            defaultCollectionId="col-1"
            value={value2}
            onChange={(id) => setValue2(id || undefined)}
          />
          {value2 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground, #64748b)' }}>
              Selected: {value2}
            </p>
          )}
        </div>

        {/* State 3: Single collection — auto-selected, read-only combobox */}
        <div style={sharedStyle}>
          <p style={labelStyle}>3. Single collection (auto-select, read-only)</p>
          <CollectionPicker
            config={{ enabled: true, required: true, collapsible: false }}
            collections={[MOCK_COLLECTIONS[0]!]}
            value={value3}
            onChange={(id) => setValue3(id || undefined)}
          />
          {value3 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground, #64748b)' }}>
              Auto-selected: {value3}
            </p>
          )}
        </div>
      </div>
    );
  },
};
