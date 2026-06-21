'use client';

/**
 * FilterBar stories — demonstrates the four key use cases for the extracted
 * @miethe/ui FilterBar component.
 *
 * Stories use local useState wrappers so search / sort / view controls are
 * fully interactive in the Storybook canvas.
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterBar } from '../../src/filters/filter-bar';
import type { FilterSlotConfig, SortOption } from '../../src/filters/filter-slot-config';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'updated_at', label: 'Last updated' },
  { value: 'artifact_count', label: 'Artifact count' },
];

// ---------------------------------------------------------------------------
// Mock filter slot components
// ---------------------------------------------------------------------------

interface TrustSelectProps {
  value: string;
  onChange: (v: string) => void;
}

/** Minimal inline select — avoids importing shadcn Select from outside the package */
function TrustSelect({ value, onChange }: TrustSelectProps) {
  return (
    <select
      aria-label="Trust level"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: '2rem',
        padding: '0 0.5rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--border, #e2e8f0)',
        background: 'var(--background, #fff)',
        fontSize: '0.875rem',
        color: 'var(--foreground, #0f172a)',
        cursor: 'pointer',
      }}
    >
      <option value="all">All</option>
      <option value="verified">Verified</option>
      <option value="experimental">Experimental</option>
    </select>
  );
}

interface CategorySelectProps {
  value: string;
  onChange: (v: string) => void;
}

function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <select
      aria-label="Category"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: '2rem',
        padding: '0 0.5rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--border, #e2e8f0)',
        background: 'var(--background, #fff)',
        fontSize: '0.875rem',
        color: 'var(--foreground, #0f172a)',
        cursor: 'pointer',
      }}
    >
      <option value="all">All categories</option>
      <option value="tools">Tools</option>
      <option value="agents">Agents</option>
      <option value="workflows">Workflows</option>
    </select>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Filters/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Horizontal toolbar with four zones: search input, conditional filter slots, sort dropdown, and view toggle. Extracted from SkillMeat to @miethe/ui for reuse across marketplace, sources, and artifact pages.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Story 1: Base — search + sort + view-toggle, no filter slots
// ---------------------------------------------------------------------------

/**
 * The minimal FilterBar configuration: search input, sort dropdown, and
 * grid/list view toggle. Suitable for any page that does not need conditional
 * filter slots.
 */
export const Base: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [search, setSearch] = React.useState('');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortField, setSortField] = React.useState('name');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

    return (
      <div className="w-full p-4">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search sources…"
          searchAriaLabel="Search sources"
          sort={{
            options: SORT_OPTIONS,
            sortField,
            sortOrder,
            onSortChange: (field, order) => {
              setSortField(field);
              setSortOrder(order);
            },
          }}
          viewToggle={{
            value: viewMode,
            onChange: setViewMode,
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          search: &quot;{search}&quot; &nbsp;|&nbsp; sort: {sortField} {sortOrder} &nbsp;|&nbsp; view:{' '}
          {viewMode}
        </p>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 2: With Trust filter slot (conditional on pageId === 'sources')
// ---------------------------------------------------------------------------

/**
 * FilterBar with a Trust Level filter slot that renders only when
 * `conditionContext.pageId === 'sources'`. Demonstrates the declarative
 * slot-condition API — the same `filterSlots` array can be reused across
 * pages; slots gate themselves via the `condition` predicate.
 */
export const WithTrustSlot: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [search, setSearch] = React.useState('');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortField, setSortField] = React.useState('name');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [trust, setTrust] = React.useState('all');

    const filterSlots: FilterSlotConfig[] = [
      {
        id: 'trust-filter',
        label: 'Trust',
        component: <TrustSelect value={trust} onChange={setTrust} />,
        condition: (ctx) => ctx.pageId === 'sources',
      },
    ];

    return (
      <div className="w-full p-4">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search sources…"
          searchAriaLabel="Search sources"
          filterSlots={filterSlots}
          conditionContext={{ pageId: 'sources' }}
          sort={{
            options: SORT_OPTIONS,
            sortField,
            sortOrder,
            onSortChange: (field, order) => {
              setSortField(field);
              setSortOrder(order);
            },
          }}
          viewToggle={{
            value: viewMode,
            onChange: setViewMode,
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          trust: {trust} &nbsp;|&nbsp; pageId: sources (slot is visible)
        </p>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 3: With multiple slots (Trust + Category, both unconditional)
// ---------------------------------------------------------------------------

/**
 * Two unconditional filter slots (Trust + Category) rendered side-by-side.
 * Demonstrates multi-slot layout and ordering — FilterBar renders slots in
 * array order.
 */
export const WithMultipleSlots: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [search, setSearch] = React.useState('');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortField, setSortField] = React.useState('updated_at');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [trust, setTrust] = React.useState('all');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [category, setCategory] = React.useState('all');

    const filterSlots: FilterSlotConfig[] = [
      {
        id: 'trust-filter',
        label: 'Trust',
        component: <TrustSelect value={trust} onChange={setTrust} />,
        // No condition — always visible
      },
      {
        id: 'category-filter',
        label: 'Category',
        component: <CategorySelect value={category} onChange={setCategory} />,
        // No condition — always visible
      },
    ];

    return (
      <div className="w-full p-4">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search artifacts…"
          searchAriaLabel="Search artifacts"
          filterSlots={filterSlots}
          sort={{
            options: SORT_OPTIONS,
            sortField,
            sortOrder,
            onSortChange: (field, order) => {
              setSortField(field);
              setSortOrder(order);
            },
          }}
          viewToggle={{
            value: viewMode,
            onChange: setViewMode,
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          trust: {trust} &nbsp;|&nbsp; category: {category}
        </p>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 4: Responsive — narrow-viewport behavior at max-width 640px
// ---------------------------------------------------------------------------

/**
 * FilterBar constrained to 640px to show narrow-viewport flex-wrap behavior.
 * Useful for extraction reviewers checking that zones reflow cleanly without
 * overflow at tablet/mobile widths.
 */
export const Responsive: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [search, setSearch] = React.useState('');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortField, setSortField] = React.useState('name');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [trust, setTrust] = React.useState('all');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [category, setCategory] = React.useState('all');

    const filterSlots: FilterSlotConfig[] = [
      {
        id: 'trust-filter',
        label: 'Trust',
        component: <TrustSelect value={trust} onChange={setTrust} />,
      },
      {
        id: 'category-filter',
        label: 'Category',
        component: <CategorySelect value={category} onChange={setCategory} />,
      },
    ];

    return (
      <div style={{ maxWidth: '640px', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '12px' }}>
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Container: max-width 640px — observe flex-wrap reflow
        </p>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search…"
          searchAriaLabel="Search"
          filterSlots={filterSlots}
          sort={{
            options: SORT_OPTIONS,
            sortField,
            sortOrder,
            onSortChange: (field, order) => {
              setSortField(field);
              setSortOrder(order);
            },
          }}
          viewToggle={{
            value: viewMode,
            onChange: setViewMode,
          }}
        />
      </div>
    );
  },
};
