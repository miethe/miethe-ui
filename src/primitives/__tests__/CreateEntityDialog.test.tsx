/**
 * Unit tests for CreateEntityDialog and CollectionPicker primitives.
 *
 * Covers all three dialog modes (simple, tabs, composite) and the
 * CollectionPicker component across its key behaviours.
 *
 * Test runner: Jest + @testing-library/react (jsdom).
 * Interaction model: userEvent v14 for realistic user gestures.
 *
 * Note on Radix UI Dialog portals: DialogContent renders into document.body
 * via a Portal, so all queries run against the full document by default —
 * no special container scope is needed.
 */

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CreateEntityDialog, type EntityFormSchema } from '../CreateEntityDialog';
import { CollectionPicker, type CollectionPickerConfig, type CollectionItem } from '../CollectionPicker';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const COLLECTIONS: CollectionItem[] = [
  { id: 'col-1', name: 'Alpha Collection', description: 'First collection' },
  { id: 'col-2', name: 'Beta Collection', description: 'Second collection' },
];

const SINGLE_COLLECTION: CollectionItem[] = [
  { id: 'col-only', name: 'Only Collection' },
];

// ---------------------------------------------------------------------------
// CollectionPicker tests
// ---------------------------------------------------------------------------

describe('CollectionPicker', () => {
  const baseConfig: CollectionPickerConfig = { enabled: true };

  function renderPicker(
    overrides: Partial<CollectionPickerConfig> = {},
    props: {
      value?: string;
      onChange?: (id: string) => void;
      defaultCollectionId?: string;
      collections?: CollectionItem[];
    } = {}
  ) {
    const onChange = props.onChange ?? jest.fn();
    render(
      <CollectionPicker
        config={{ ...baseConfig, ...overrides }}
        collections={props.collections ?? COLLECTIONS}
        value={props.value}
        onChange={onChange}
        defaultCollectionId={props.defaultCollectionId}
      />
    );
    return { onChange };
  }

  it('renders the Collection label', () => {
    renderPicker({ collapsible: false });
    // Non-collapsible renders a <label> with "Collection" text
    expect(screen.getByText('Collection')).toBeInTheDocument();
  });

  it('renders a combobox when enabled', () => {
    renderPicker({ collapsible: false });
    expect(screen.getByRole('combobox', { name: /select collection/i })).toBeInTheDocument();
  });

  it('pre-fills from defaultCollectionId on mount', async () => {
    const onChange = jest.fn();
    render(
      <CollectionPicker
        config={{ enabled: true, collapsible: false }}
        collections={COLLECTIONS}
        onChange={onChange}
        defaultCollectionId="col-1"
      />
    );
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('col-1');
    });
  });

  it('auto-selects when only one collection is available', async () => {
    const onChange = jest.fn();
    render(
      <CollectionPicker
        config={{ enabled: true, collapsible: false }}
        collections={SINGLE_COLLECTION}
        onChange={onChange}
      />
    );
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('col-only');
    });
  });

  it('shows required indicator when required=true', () => {
    renderPicker({ collapsible: false, required: true });
    // The * asterisk is aria-hidden; the sr-only span says "(required)"
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('collapsible picker starts collapsed when no value is set', () => {
    renderPicker({ collapsible: true });
    // When collapsed the combobox should not be visible
    expect(screen.queryByRole('combobox', { name: /select collection/i })).not.toBeInTheDocument();
  });

  it('collapsible picker expands on trigger click', async () => {
    const user = userEvent.setup();
    renderPicker({ collapsible: true });

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.getByRole('combobox', { name: /select collection/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// CreateEntityDialog — Simple mode
// ---------------------------------------------------------------------------

describe('CreateEntityDialog — Simple mode', () => {
  const simpleSchema: EntityFormSchema = {
    mode: 'simple',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  };

  function renderSimple(overrides: Partial<React.ComponentProps<typeof CreateEntityDialog>> = {}) {
    const onSubmit = overrides.onSubmit ?? jest.fn();
    const onOpenChange = overrides.onOpenChange ?? jest.fn();
    render(
      <CreateEntityDialog
        open={true}
        schema={simpleSchema}
        title="Create Skill"
        description="Add a new skill"
        {...overrides}
        onSubmit={onSubmit}
        onOpenChange={onOpenChange}
      />
    );
    return { onSubmit, onOpenChange };
  }

  it('renders all fields from schema', () => {
    renderSimple();
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Description/)).toBeInTheDocument();
  });

  it('shows required asterisk on required fields', () => {
    renderSimple();
    // The sr-only "(required)" text appears next to required fields
    const requiredHints = screen.getAllByText('(required)');
    expect(requiredHints.length).toBeGreaterThanOrEqual(1);
  });

  it('validates required fields on submit and shows error messages', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderSimple({ onSubmit });

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form values on valid submit', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderSimple({ onSubmit });

    await user.type(screen.getByLabelText(/^Name/), 'My Skill');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Skill' })
      );
    });
  });

  it('cancel button closes the dialog', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderSimple({ onOpenChange });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows error banner when error prop is set', () => {
    renderSimple({ error: 'Something went wrong' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
  });

  it('disables submit button when isSubmitting is true', () => {
    renderSimple({ isSubmitting: true });
    const submitBtn = screen.getByRole('button', { name: /saving/i });
    expect(submitBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// CreateEntityDialog — Tabs mode
// ---------------------------------------------------------------------------

describe('CreateEntityDialog — Tabs mode', () => {
  const tabsSchema: EntityFormSchema = {
    mode: 'tabs',
    tabs: [
      {
        id: 'basic',
        label: 'Basic',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        fields: [
          { name: 'version', label: 'Version', type: 'text' },
        ],
      },
    ],
  };

  function renderTabs(overrides: Partial<React.ComponentProps<typeof CreateEntityDialog>> = {}) {
    const onSubmit = overrides.onSubmit ?? jest.fn();
    const onOpenChange = overrides.onOpenChange ?? jest.fn();
    render(
      <CreateEntityDialog
        open={true}
        schema={tabsSchema}
        title="Create Artifact"
        {...overrides}
        onSubmit={onSubmit}
        onOpenChange={onOpenChange}
      />
    );
    return { onSubmit, onOpenChange };
  }

  it('renders tab triggers from schema', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: /^Basic/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Details/i })).toBeInTheDocument();
  });

  it('switches tab content on click', async () => {
    const user = userEvent.setup();
    renderTabs();

    // First tab is active by default — its field is visible
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^Details/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^Version/)).toBeInTheDocument();
    });
  });

  it('shows error badge on tab with validation errors after failed submit', async () => {
    const user = userEvent.setup();
    renderTabs();

    // Submit without filling required "name" field (on Basic tab)
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      // The error badge has an aria-label like "1 error" or "1 errors"
      const badge = screen.getByLabelText(/1 error/i);
      expect(badge).toBeInTheDocument();
    });
  });

  it('keeps submit button enabled after switching tabs without errors', async () => {
    const user = userEvent.setup();
    renderTabs();

    // Fill the required name field while on the Basic tab
    await user.type(screen.getByLabelText(/^Name/), 'Filled');

    // Switch to Details tab — submit should remain enabled (no errors)
    await user.click(screen.getByRole('tab', { name: /^Details/i }));
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /^Details/i })).toHaveAttribute('aria-selected', 'true')
    );

    // Submit button should be enabled and not in a busy/loading state
    const submitBtn = screen.getByRole('button', { name: /create/i });
    expect(submitBtn).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// CreateEntityDialog — Composite mode
// ---------------------------------------------------------------------------

describe('CreateEntityDialog — Composite mode', () => {
  const compositeSchema: EntityFormSchema = {
    mode: 'composite',
    tabs: [
      {
        id: 'info',
        label: 'Info',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
        ],
      },
    ],
    members: {
      entityType: 'skill',
      label: 'Skills',
      validateMin: 1,
    },
  };

  function renderComposite(
    overrides: Partial<React.ComponentProps<typeof CreateEntityDialog>> = {}
  ) {
    const onSubmit = overrides.onSubmit ?? jest.fn();
    const onOpenChange = overrides.onOpenChange ?? jest.fn();
    render(
      <CreateEntityDialog
        open={true}
        schema={compositeSchema}
        title="Create Bundle"
        {...overrides}
        onSubmit={onSubmit}
        onOpenChange={onOpenChange}
      />
    );
    return { onSubmit, onOpenChange };
  }

  it('renders member picker tab', () => {
    renderComposite();
    expect(screen.getByRole('tab', { name: /Skills/i })).toBeInTheDocument();
  });

  it('renders a Review tab', () => {
    renderComposite();
    expect(screen.getByRole('tab', { name: /Review/i })).toBeInTheDocument();
  });

  it('adds a member via keyboard entry', async () => {
    const user = userEvent.setup();
    renderComposite();

    // Navigate to Skills (members) tab
    await user.click(screen.getByRole('tab', { name: /Skills/i }));

    // The member input has a stable id "composite-member-input"; use placeholder to target it
    const memberInput = await screen.findByPlaceholderText(/Enter skill IDs/i);
    await user.type(memberInput, 'skill-abc{enter}');

    await waitFor(() => {
      expect(screen.getByText('skill-abc')).toBeInTheDocument();
    });
  });

  it('removes a member via the remove button', async () => {
    const user = userEvent.setup();

    // Use an uncontrolled setup: add a member first, then remove it
    // (passing memberIds as a controlled prop without onMemberIdsChange would pin the value)
    renderComposite();

    // Navigate to Skills tab
    await user.click(screen.getByRole('tab', { name: /Skills/i }));

    // Add a member first
    const memberInput = await screen.findByPlaceholderText(/Enter skill IDs/i);
    await user.type(memberInput, 'skill-xyz{enter}');
    await waitFor(() => expect(screen.getByText('skill-xyz')).toBeInTheDocument());

    // Now remove it
    const removeBtn = screen.getByRole('button', { name: /Remove member skill-xyz/i });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('skill-xyz')).not.toBeInTheDocument();
    });
  });

  it('shows member validation error when minimum count is not met on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderComposite({ onSubmit });

    // Fill required name field so form-level validation passes
    await user.type(screen.getByLabelText(/^Name/), 'My Bundle');

    // Submit without adding any members
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/at least 1 member/i);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders review step with form values when Review tab is clicked', async () => {
    const user = userEvent.setup();
    renderComposite();

    // Fill in the Name field
    await user.type(screen.getByLabelText(/^Name/), 'Bundle Alpha');

    // Add a member via the Skills tab
    await user.click(screen.getByRole('tab', { name: /Skills/i }));
    const memberInput = await screen.findByPlaceholderText(/Enter skill IDs/i);
    await user.type(memberInput, 'skill-abc{enter}');
    await waitFor(() => expect(screen.getByText('skill-abc')).toBeInTheDocument());

    // Navigate to Review tab
    await user.click(screen.getByRole('tab', { name: /Review/i }));

    await waitFor(() => {
      // Review step renders a summary list; member ID should appear
      expect(screen.getByText('skill-abc')).toBeInTheDocument();
    });
  });
});
