# DiscoveryCard

Compact artifact card component for discovery and search result contexts. Designed as a props-only component with no app-hook coupling, making it reusable across `/discover` and future marketplace search results pages.

## Overview

`DiscoveryCard` displays a single `AgentDiscoveryCandidate` (returned by the agent discovery engine) in a compact, self-contained format. Unlike the tiered `ArtifactCard` (which supports multiple display densities from xs-minified to expanded), `DiscoveryCard` is intentionally a single, fixed-size card with a consistent visual treatment.

**Current usage**: `/discover` page, shown in a grid with uniform row heights.
**Planned reuse**: Marketplace search results page (same component, different data source and handlers).

## Visual Design

### Container Styling

The card outer container combines:
- Base: `border bg-card text-card-foreground shadow-sm rounded-lg`
- Sizing: `h-full min-h-[160px]` — grows to fill grid row height (requires parent grid to use `auto-rows-fr`)
- Border treatment:
  - Left edge: `border-l-4` in solid type color (from `typeBarColors` via `candidate.artifact_type`)
  - Top, right, bottom: neutral `border` token only
  - Fallback for unknown types: `TYPE_BAR_FALLBACK` (gray-400)
- Hover/focus: `hover:shadow-md hover:border-border/80` and `focus-visible:ring-2 ring-ring ring-offset-1`
- Selected state: `ring-2 ring-ring ring-offset-1 bg-primary/5` when `isSelected={true}`

### Type Bar Colors

Type identification bar uses the same color system as `ArtifactCard`:
- Source: `@miethe/ui/utils` export `typeBarColors` — a record mapping artifact type strings to `border-l-{color}-{shade}` Tailwind classes
- Maps all 17 artifact types (skill, command, agent, mcp, hook, workflow, composite, context_module, template, group, bundle, deployment_set, project_config, spec_file, rule_file, context_file, progress_template)
- Fallback: `TYPE_BAR_FALLBACK = 'border-l-gray-400'` for unknown types

Do not duplicate the color values — reference `skillmeat/web/packages/ui/src/utils/type-colors.ts` for the authoritative mapping.

### Icon Chip Styling

The type icon sits in a small bordered chip in the header:
- Background: Semi-transparent type-specific color from `TYPE_ICON_BG` map (e.g., `bg-purple-500/10`)
- Border: Semi-transparent type-specific color from `TYPE_ICON_BORDER` map (e.g., `border-purple-500/40`)
- Icon color: Solid type-specific color from `TYPE_ICON_COLOR` map (e.g., `text-purple-500`)

These are local to `discovery-card.tsx` (not exported). They use the `/40` opacity variant for semi-transparency, distinct from the outer container's solid left border.

### Sizing & Grid Uniformity

The `min-h-[160px]` height ensures all cards in a row grow uniformly. The parent grid container must use `auto-rows-fr` (or equivalent equal-row mechanism like `grid-auto-rows: 1fr`) to stretch rows and fill available vertical space. Without this, cards will be shorter than the grid height.

Example grid setup:
```tsx
<div className="grid grid-cols-3 auto-rows-fr gap-4">
  {candidates.map((c) => <DiscoveryCard key={c.name} candidate={c} />)}
</div>
```

### Selected State

When `isSelected={true}`, the card applies:
- `ring-2 ring-ring ring-offset-1` — focused outline ring
- `bg-primary/5` — subtle primary tint

This is in addition to the left type-color border.

## Props API

```typescript
export interface DiscoveryCardProps {
  /** The discovery candidate to display */
  candidate: AgentDiscoveryCandidate;

  /** Whether the card is currently selected (affects styling) */
  isSelected: boolean;

  /** Called when user toggles the checkbox */
  onToggleSelect: (candidate: AgentDiscoveryCandidate) => void;

  /** Called when user clicks the card (outside action buttons) or presses Enter/Space */
  onOpenDetail: (candidate: AgentDiscoveryCandidate) => void;

  /** Called when user clicks the Import button */
  onImport: (candidate: AgentDiscoveryCandidate) => void;

  /** Called when user clicks the Deploy button */
  onDeploy: (candidate: AgentDiscoveryCandidate) => void;

  /** Show loading state on Import button (animated spinner) */
  isImporting?: boolean;

  /** Show loading state on Deploy button (animated spinner) */
  isDeploying?: boolean;

  /** Disable Import button and prevent clicks */
  importDisabled?: boolean;

  /** Disable Deploy button and prevent clicks */
  deployDisabled?: boolean;

  /** Additional className for card root (composed with base styles) */
  className?: string;
}
```

### AgentDiscoveryCandidate Type

```typescript
export interface AgentDiscoveryCandidate {
  source: string;              // One of: 'collection' | 'marketplace' | 'web'
  name: string;                // Artifact name
  artifact_type: string;       // Type key (e.g., 'skill', 'agent')
  url: string | null;          // External URL (nullable)
  trust_tier: TrustTier;       // One of: 'trusted' | 'candidate' | 'unverified' | 'quarantined'
  score: number;               // Relevance score [0.0, 1.0]
  metadata: Record<string, unknown>; // Additional data (description, marketplace_source, etc.)
}

export type TrustTier = 'trusted' | 'candidate' | 'unverified' | 'quarantined';
```

## Source Variants

The `candidate.source` field controls which fields render and how they appear:

| Source | Rendering |
|--------|-----------|
| `collection` | Shows "Collection" badge; no external URL link |
| `marketplace` | Shows "Marketplace" badge; extracts source name from `metadata.marketplace_source` or URL hostname; renders as link with hover tooltip for URL |
| `web` | Shows "Web" badge; uses `candidate.url` for external link |

The source determines the badge color and label via the `SOURCE_CONFIG` map in the component.

## Zone Architecture

The card is divided into three zones (top to bottom):

### Header Zone (px-3 pt-4 pb-1.5)
- Row 1: Type icon chip (bordered, 5×5px) | Artifact name (clamped to 2 lines)
- Row 2: Type badge | Source badge | Trust tier badge (with icon)

All badges are small, uppercase, 10px font size.

### Content Zone (px-3 pb-1.5 flex-1)
- Optional description (1 line clamp, muted foreground)
- Optional marketplace source name with external link + URL tooltip (when `source='marketplace'`)
- Relevance score bar with label and percentage display

The flex-1 class ensures the content zone expands to fill available space, pushing the action zone down.

### Action Zone (px-3 py-2 border-t)
- Selection checkbox (left)
- Spacer (flex-1)
- Import button (outline variant, icon + "Import" label)
- Deploy button (primary variant, icon + "Deploy" label)

Buttons show loading spinners (`Loader2` icon animated) when `isImporting` or `isDeploying` is true. Both buttons are disabled when their respective flags are true.

## Usage Example

```typescript
import { DiscoveryCard } from '@miethe/ui/discovery';
import type { AgentDiscoveryCandidate } from '@miethe/ui/discovery';

export function DiscoveryGrid({ candidates }: { candidates: AgentDiscoveryCandidate[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const handleToggleSelect = (candidate: AgentDiscoveryCandidate) => {
    const key = candidate.name;
    const newSet = new Set(selected);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelected(newSet);
  };

  const handleImport = async (candidate: AgentDiscoveryCandidate) => {
    setImporting(true);
    try {
      await apiImportCandidate(candidate);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="grid grid-cols-3 auto-rows-fr gap-4">
      {candidates.map((candidate) => (
        <DiscoveryCard
          key={candidate.name}
          candidate={candidate}
          isSelected={selected.has(candidate.name)}
          onToggleSelect={handleToggleSelect}
          onOpenDetail={(c) => console.log('Open detail:', c.name)}
          onImport={handleImport}
          onDeploy={(c) => console.log('Deploy:', c.name)}
          isImporting={importing && selectedCandidate === candidate.name}
          importDisabled={false}
          deployDisabled={false}
        />
      ))}
    </div>
  );
}
```

## Marketplace Reuse Notes

The component is hook-free and accepts all data and handlers as props, making it ideal for reuse in the marketplace search results page:

1. **Props-only API**: No internal React Query hooks, router usage, or app-context coupling. The consumer is responsible for:
   - Fetching candidates
   - Managing selection state
   - Handling import/deploy actions
   - Routing to detail modals

2. **Type & color contracts**: Type-to-color mappings come from `@miethe/ui/utils`:
   - `typeBarColors` for left-border colors
   - Icon badge colors via `TYPE_ICON_*` maps (local to the component)

   Both are type-agnostic and safe to call with arbitrary artifact type strings.

3. **Grid layout**: Requires parent grid to use `auto-rows-fr` for uniform row heights. Example:
   ```tsx
   <div className="grid grid-cols-auto gap-4 auto-rows-fr">
     {/* cards */}
   </div>
   ```

4. **Modal routing**: The consumer owns modal logic. On `onOpenDetail`, open a detail modal or navigate to a detail page. The `/discover` page uses `discovery-modal-router.tsx` — marketplace can use a similar pattern or a different routing strategy.

5. **Accessibility**: The component is fully WCAG 2.1 AA compliant. All interactive elements (checkbox, buttons, links) have proper `aria-label` and keyboard support. Card itself is a `role="article"` with `tabIndex={0}` for keyboard navigation.

## Relationship to ArtifactCard

| Aspect | DiscoveryCard | ArtifactCard |
|--------|---------------|--------------|
| **Tiers** | Single fixed size (160px min) | Five tiers (xs-minified to expanded) |
| **Zones** | 3 zones (header, content, action) | 5 zones (header, content, relationship, status, action) |
| **Hook coupling** | None — props-only | Tightly coupled to app hooks (useTags, useDeployments, etc.) |
| **Type bar** | Solid left-4 border in type color | Same left-4 border (shared color system) |
| **Tints** | None — left stripe provides differentiation | Subtle bg tints at compact tier and larger |
| **Use case** | Discovery, marketplace search | Main artifact browsing, detailed views |

Both use the same `typeBarColors` utility from `@miethe/ui/utils`, ensuring consistent type identification across surfaces.

## Testing

Tests are located in `skillmeat/web/packages/ui/src/discovery/__tests__/`.

Coverage includes:
- Props validation and rendering
- Source variant rendering (collection, marketplace, web)
- Trust tier badge display and icons
- Selection checkbox and button handlers
- Loading states (isImporting, isDeploying)
- Accessibility (ARIA labels, keyboard navigation)

Run tests with `pnpm test` from the `skillmeat/web` directory.

## Accessibility

The component is fully accessible per WCAG 2.1 AA:

- **Card container**: `role="article"`, `tabIndex={0}`, keyboard-navigable via Enter/Space to open detail
- **Selection checkbox**: Proper `aria-label` (dynamic: "Select {name}" or "Deselect {name}")
- **Type badge**: `aria-label="Type: {label}"`
- **Trust badge**: `aria-label` with tier description (e.g., "Trust tier: Trusted")
- **Source link**: `aria-label` with source name; target="_blank" and "noopener noreferrer"
- **Score bar**: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`
- **All buttons**: Full keyboard support, clear `aria-label` for loading states

Event handling prevents bubbling properly — action button clicks and links call `e.stopPropagation()` so clicking them doesn't trigger the card-level `onOpenDetail` handler.
