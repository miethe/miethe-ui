# @miethe/ui — Public API Contract

**Contract version**: v0.2.0
**Package version**: 0.1.0+
**Status**: Phases 1–3 & Tiered Card System complete; Phase 4 entity-browser work planned

This document is the approved export map for `@miethe/ui`. It is the authoritative reference for what is exported, in which phase, and under what signature.

---

## Export Map

### Components

| Export | Phase | Source file |
|--------|-------|-------------|
| `FileTree` | 2 | `components/entity/file-tree.tsx` |
| `FileTreeProps` | 2 | `components/entity/file-tree.tsx` |
| `FrontmatterDisplay` | 2 | `components/entity/frontmatter-display.tsx` |
| `FrontmatterDisplayProps` | 2 | `components/entity/frontmatter-display.tsx` |
| `DiffViewer` | WAVE-002 | `components/sync-status/diff-viewer.tsx` |
| `DiffViewerSkeleton` | WAVE-002 | `components/sync-status/diff-viewer.tsx` |
| `DiffViewerProps` | WAVE-002 | `components/sync-status/diff-viewer.tsx` |
| `ResolutionType` | WAVE-002 | `components/sync-status/diff-viewer.tsx` |
| `FilePreviewPane` | WAVE-002 | `components/sync-status/file-preview-pane.tsx` |
| `FilePreviewPaneProps` | WAVE-002 | `components/sync-status/file-preview-pane.tsx` |
| `BaseArtifactModal` | 0.1.0 | `primitives/BaseArtifactModal.tsx` |
| `BaseArtifactModalProps` | 0.1.0 | `primitives/BaseArtifactModal.tsx` |
| `ModalHeader` | 0.1.0 | `primitives/ModalHeader.tsx` |
| `ModalHeaderProps` | 0.1.0 | `primitives/ModalHeader.tsx` |
| `TabNavigation` | 0.1.0 | `primitives/TabNavigation.tsx` |
| `TabNavigationProps` | 0.1.0 | `primitives/TabNavigation.tsx` |
| `EnterpriseOwnerBadge` | Current | `primitives/EnterpriseOwnerBadge.tsx` |
| `EnterpriseOwnerBadgeProps` | Current | `primitives/EnterpriseOwnerBadge.tsx` |
| `LockIcon` | Current | `primitives/LockIcon.tsx` |
| `LockIconProps` | Current | `primitives/LockIcon.tsx` |
| `TabRegistry` | Phase 3 | `artifacts/tab-registry.ts` |
| `TabConfig` | Phase 3 | `artifacts/tab-registry.ts` |
| `TabConditions` | Phase 3 | `artifacts/tab-registry.ts` |
| `getTabsForContext` | Phase 3 | `artifacts/tab-registry.ts` |
| `MetadataGrid` | Phase 3 | `components/metadata-grid.tsx` |
| `MetadataGridProps` | Phase 3 | `components/metadata-grid.tsx` |
| `TimelineView` | Phase 3 | `components/timeline-view.tsx` |
| `TimelineViewProps` | Phase 3 | `components/timeline-view.tsx` |
| `TagColorProvider` | Tiered Card System | `card-system/tag-color-provider.tsx` |
| `ColoredBadge` | Tiered Card System | `card-system/colored-badge.tsx` |
| `ColoredBadgeProps` | Tiered Card System | `card-system/colored-badge.tsx` |
| `TypeIndicator` | Tiered Card System | `card-system/type-indicator.tsx` |
| `TypeIndicatorProps` | Tiered Card System | `card-system/type-indicator.tsx` |

**FileTree**

A file browser tree component for navigating artifact directory structures.

```typescript
interface FileTreeProps {
  entityId: string;
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onAddFile?: () => void;
  onDeleteFile?: (path: string) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}
```

**FrontmatterDisplay**

Renders parsed YAML frontmatter as a collapsible key/value display.

```typescript
interface FrontmatterDisplayProps {
  frontmatter: Record<string, unknown>;
  defaultCollapsed?: boolean;
  className?: string;
}
```

**BaseArtifactModal**

Controlled composition-based modal for artifact dialogs with tabbed content support.

```typescript
interface BaseArtifactModalProps {
  artifact: Artifact;
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  aboveTabsContent?: React.ReactNode;
  returnTo?: string;
  onReturn?: () => void;
}

interface Tab {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}
```

**ModalHeader**

Header component displaying artifact metadata with icon, name, and action slot.

```typescript
interface ModalHeaderProps {
  artifact?: Artifact;
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}
```

**TabNavigation**

Horizontal tab list with icon support and full keyboard navigation.

```typescript
interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}
```

**EnterpriseOwnerBadge**

Badge indicating enterprise organization ownership.

```typescript
interface EnterpriseOwnerBadgeProps {
  className?: string;
}
```

Displays a violet-themed badge with a building icon and "Enterprise Managed" label.

**LockIcon**

Tooltip-wrapped lock indicator for enforced artifacts.

```typescript
interface LockIconProps {
  className?: string;
  tooltip?: string;
}
```

Default tooltip: "This artifact cannot be modified — enforced by your organization"

**TabRegistry & getTabsForContext** (Phase 3)

Declarative tab configuration system for consolidated entity modals. Define tabs once in a registry; filter and sort by context (entity type, edition, lens, discovered status) at render time.

```typescript
interface TabConfig {
  id: string;                                  // Stable identifier
  label: string;                               // Display label
  icon?: string;                               // Lucide icon name
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  conditions?: TabConditions;                  // Visibility rules
  defaultPriority: number;                     // Sort order
}

interface TabConditions {
  entityTypes?: string[];       // Restrict to specific entity types
  editions?: ('local' | 'enterprise')[];
  lenses?: ('library' | 'operations')[];
  excludeDiscovered?: boolean;
  featureFlags?: string[];
  featureEnabled?: boolean;
}

function getTabsForContext(ctx: TabContext): TabConfig[];
```

**MetadataGrid** (Phase 3)

Key-value metadata display with optional collapsible sections.

```typescript
interface MetadataGridProps {
  items: Array<{ key: string; value: React.ReactNode }>;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}
```

**TimelineView** (Phase 3)

Ordered history or event timeline component with timestamps and descriptions.

```typescript
interface TimelineViewProps {
  events: Array<{ timestamp: string; title: string; description?: React.ReactNode }>;
  className?: string;
}
```

**TagColorProvider, ColoredBadge, TypeIndicator** (Tiered Card System)

Type-aware card badge and indicator system for consistent artifact/entity type visualization.

```typescript
// TagColorProvider wraps descendants and provides type-to-color context
<TagColorProvider typeColorMap={customMap}>
  <ColoredBadge type="skill" />
</TagColorProvider>

interface ColoredBadgeProps {
  type: string;
  className?: string;
}

interface TypeIndicatorProps {
  type: string;
  icon?: React.ReactNode;
  className?: string;
}
```

Provides background tints and border colors for artifact/entity types. Integrates with zone-based card layout.

---

### Utilities

| Export | Phase | Source file |
|--------|-------|-------------|
| `parseFrontmatter` | 2 | `lib/frontmatter.ts` |
| `stripFrontmatter` | 2 | `lib/frontmatter.ts` |
| `detectFrontmatter` | 2 | `lib/frontmatter.ts` |
| `extractFirstParagraph` | 2 | `lib/folder-readme-utils.ts` |
| `extractFolderReadme` | 2 | `lib/folder-readme-utils.ts` |
| `typeBarColors` | Tiered Card System | `lib/type-colors.ts` |
| `artifactTypeCardTints` | Tiered Card System | `lib/type-colors.ts` |
| `getTypeBarColor` | Tiered Card System | `lib/type-colors.ts` |
| `getCardTint` | Tiered Card System | `lib/type-colors.ts` |
| `TYPE_BAR_FALLBACK` | Tiered Card System | `lib/type-colors.ts` |

```typescript
function detectFrontmatter(content: string): boolean;

function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  content: string;
};

function stripFrontmatter(content: string): string;

function extractFirstParagraph(content: string): string | null;

// NOTE: signature will be genericized before export — see Discrepancies section
function extractFolderReadme(
  folderPath: string,
  entries: { path: string; content?: string }[]
): string | null;
```

**Type-Color Utilities** (Tiered Card System)

Map artifact and entity types to Tailwind color classes for consistent card and badge visualization.

```typescript
// Left-border bar colors (e.g., skill → border-l-blue-500)
const typeBarColors: Record<string, string>;
const TYPE_BAR_FALLBACK = 'border-l-gray-400';
function getTypeBarColor(type: string): string;

// Card background tints (e.g., skill → bg-blue-50/50)
const artifactTypeCardTints: Record<string, string>;
function getCardTint(type: string): string;
```

Supported types include: skill, command, agent, mcp, hook, workflow, composite, bundle, deployment_set, context_entity, template, project_config, spec_file, rule_file, context_file, progress_template, hook.

---

### Types

| Export | Phase | Canonical source |
|--------|-------|-----------------|
| `FileNode` | 2 | `types/files.ts` |
| `FileTreeResponse` | 2 | `lib/api/catalog.ts` |
| `FileContentResponse` | 2 | `lib/api/catalog.ts` |
| `FileDiff` | WAVE-002 | `types/diff.ts` |

```typescript
// FileNode — canonical version from types/files.ts (includes optional `size`)
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

// FileTreeResponse — catalog variant (marketplace/GitHub-backed)
interface FileTreeResponse {
  entries: FileTreeEntry[];
  cached: boolean;
  cache_age_seconds?: number;
}

interface FileTreeEntry {
  path: string;
  type: 'file' | 'tree';
  size?: number;
}

// FileContentResponse — catalog variant (marketplace/GitHub-backed)
interface FileContentResponse {
  content: string;
  encoding: string;
  size: number;
  sha: string;
  truncated?: boolean;
  original_size?: number;
  cached: boolean;
  cache_age_seconds?: number;
}
```

```typescript
// FileDiff — generic diff type for DiffViewer
interface FileDiff {
  file_path: string;
  status: 'added' | 'modified' | 'deleted' | 'unchanged';
  collection_hash?: string | null;
  project_hash?: string | null;
  unified_diff?: string | null;
}

// ResolutionType — conflict resolution action
type ResolutionType = 'keep_local' | 'keep_remote' | 'merge';
```

**DiffViewer**

Side-by-side unified diff viewer with file browser sidebar and optional sync conflict resolution actions. Includes loading skeleton and large diff handling.

```typescript
interface DiffViewerProps {
  files: FileDiff[];
  leftLabel?: string;
  rightLabel?: string;
  onClose?: () => void;
  showResolutionActions?: boolean;
  onResolve?: (resolution: ResolutionType) => void;
  localLabel?: string;
  remoteLabel?: string;
  previewMode?: boolean;
  isResolving?: boolean;
  isLoading?: boolean;
}
```

**DiffViewerSkeleton**

Loading skeleton for DiffViewer that mimics the side-by-side diff viewer layout during data fetch.

```typescript
export function DiffViewerSkeleton(): React.ReactNode;
```

**FilePreviewPane**

File content preview with markdown rendering, code display, and plain text support. Includes tier badge showing the file source context.

```typescript
interface FilePreviewPaneProps {
  filePath: string | null;
  content: string | null;
  tier: 'source' | 'collection' | 'project';
  isLoading: boolean;
}
```

---

### Hooks

| Export | Phase | Source file |
|--------|-------|-------------|
| `useCatalogFileTree` | 3 | `hooks/use-catalog-files.ts` |
| `useCatalogFileContent` | 3 | `hooks/use-catalog-files.ts` |
| `catalogKeys` | 3 | `hooks/use-catalog-files.ts` |

Phase 3 hooks require an adapter abstraction layer so that the package is not hard-wired to a specific TanStack Query `QueryClient` instance or a `NEXT_PUBLIC_API_URL` environment variable. The adapter contract will be defined at the start of Phase 3.

```typescript
function useCatalogFileTree(
  sourceId: string | null,
  artifactPath: string | null
): UseQueryResult<FileTreeResponse, Error>;

function useCatalogFileContent(
  sourceId: string | null,
  artifactPath: string | null,
  filePath: string | null
): UseQueryResult<FileContentResponse, Error>;
```

---

### API Client Functions

| Export | Phase | Source file |
|--------|-------|-------------|
| `fetchCatalogFileTree` | 3 | `lib/api/catalog.ts` |
| `fetchCatalogFileContent` | 3 | `lib/api/catalog.ts` |

Phase 3 API client functions require an adapter for the base URL so the package is not coupled to `NEXT_PUBLIC_API_URL`.

```typescript
function fetchCatalogFileTree(
  sourceId: string,
  artifactPath: string
): Promise<FileTreeResponse>;

function fetchCatalogFileContent(
  sourceId: string,
  artifactPath: string,
  filePath: string
): Promise<FileContentResponse>;
```

---

## Discrepancies Found During Phase 0

The following conflicts were discovered during inventory and must be resolved before or during extraction.

### 1. FileNode dual definition

`FileNode` is defined in two places with slightly different shapes:

| Location | `size` field | `type` values |
|----------|-------------|---------------|
| `types/files.ts` | `size?: number` (present) | `'file' \| 'directory'` |
| `components/entity/file-tree.tsx` | absent | `'file' \| 'directory'` |

**Resolution**: The exported `FileNode` will use the `types/files.ts` definition (the more complete shape). The in-component definition in `file-tree.tsx` will be removed and the component will import from the package's `./types` module during Phase 2 extraction.

### 2. extractFolderReadme — CatalogEntry coupling

`extractFolderReadme` in `lib/folder-readme-utils.ts` accepts `CatalogEntry[]` (from `@/types/marketplace`). Exporting it as-is would pull the entire marketplace type graph into the package's public API, which is inappropriate for a general-purpose content viewer.

**Resolution**: Before export, the parameter type will be genericized to a duck-typed interface:

```typescript
interface ReadmeSearchEntry {
  path: string;
  content?: string;
  name?: string;
}
```

`CatalogEntry` satisfies this interface structurally, so no call sites need to change. This change will be made during Phase 2 extraction.

### 3. FileTreeResponse — three competing definitions

Three definitions of `FileTreeResponse` exist in the codebase:

| Location | Shape |
|----------|-------|
| `lib/api/catalog.ts` | `{ entries: FileTreeEntry[], cached: boolean, cache_age_seconds?: number }` |
| `sdk/models/FileTreeResponse.ts` (generated) | `{ entries: FileTreeEntry[], artifact_path: string, source_id: string }` |
| `types/files.ts` | Does not define `FileTreeResponse` — only `FileListResponse` (collection endpoint) |

The SDK type is auto-generated from OpenAPI and should not be re-exported as the package's public type; it may drift as the backend evolves. The `lib/api/catalog.ts` definition is the hand-authored, stable shape that hooks actually use.

**Resolution**: The exported `FileTreeResponse` will be the `lib/api/catalog.ts` version. The package will not re-export from `sdk/`.

### 4. FileContentResponse — catalog vs. collection variants

Two `FileContentResponse` shapes exist for different backend endpoints:

| Location | Endpoint | Fields |
|----------|----------|--------|
| `lib/api/catalog.ts` | Marketplace/GitHub catalog (`/marketplace/sources/…`) | `content`, `encoding`, `size`, `sha`, `truncated?`, `cached` |
| `types/files.ts` | Collection files (`/collections/…/files/…`) | `artifact_id`, `artifact_name`, `artifact_type`, `collection_name`, `path`, `content`, `size`, `mime_type?` |

These are responses from different APIs and are not interchangeable.

**Resolution**: The exported `FileContentResponse` will be the catalog variant from `lib/api/catalog.ts`, as the hooks being exported (`useCatalogFileContent`, `fetchCatalogFileContent`) use that endpoint. The collection variant in `types/files.ts` is out of scope for this package and will not be exported.

---

## Out of Scope

The following were considered and explicitly excluded:

- `FileListResponse` (`types/files.ts`) — collection-endpoint response, not catalog
- `FileUpdateRequest` (`types/files.ts`) — mutation type, this package is read-only
- `FileTreeEntry` — internal shape used by `FileTreeResponse`; may be exported as a companion type if consumers need it (deferred to Phase 2)
- `catalogKeys` query key factory — may be exported alongside hooks in Phase 3 if consumers need to perform cache invalidation externally
