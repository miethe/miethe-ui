# Changelog

All notable changes to `@miethe/ui` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-06-21

### Added

- **Form Components** — react-hook-form + zod based form primitives (peer dependencies optional)
  - Schema-driven form builders for rapid CRUD interfaces
  - Integrated validation and error handling
  - Requires `react-hook-form` and `zod` as optional peer dependencies

- **ContentPane `codeHighlight` prop** (NEW) — Opt-in syntax highlighting for non-markdown code files
  - Uses **lowlight** (same optional peer dependency as ArticleViewer's `codeHighlight`)
  - Single highlighting engine across the package for consistency
  - Gracefully degrades to plain text when lowlight is not installed
  - Enable by installing `lowlight` (v2 or v3) and passing `codeHighlight={true}`

- **ContentPane `renderBinaryPreview` render-prop** (NEW) — Consumer-supplied binary/image/PDF preview slot
  - Signature: `(ext: string, content: string | Uint8Array) => ReactNode | null`
  - Returning `null` falls through to default text view
  - Allows consumers to integrate react-pdf, next/image, or custom viewers without adding hard dependencies to @miethe/ui

- **CodeEditor** (NEW export from `@miethe/ui/editor`) — CodeMirror 6 editor for non-markdown files
  - Accepts `language?: LanguageSupport` prop for syntax highlighting
  - Lazy-loaded via dynamic import for optimal bundle size
  - ContentPane now routes editable non-markdown files (.ts, .tsx, .js, .jsx, .py, .json, .css) to CodeEditor when editing
  - New dependencies: `@codemirror/lang-javascript`, `@codemirror/lang-python`, `@codemirror/lang-json`, `@codemirror/lang-css`, `@codemirror/language`

- **MarkdownEditor reactive dark-mode** (CHANGED/fixed) — Editor now tracks OS `prefers-color-scheme` changes at runtime
  - Uses CodeMirror Compartment for theme switching without re-initializing editor state
  - Improved UX when system theme changes during editing session

### Changed

- ArticleViewer now ships in 0.6.0 (documented in 0.5.0 for v0.3.0 → 0.6.0 transitions)

## [0.5.0] - 2026-04-24

### Added

- **ArticleViewer** component — read-only markdown + HTML renderer with callout support, frontmatter display, typography variants, and sanitization
  - Supports CommonMark + GitHub-Flavored Markdown (tables, task lists, strikethrough, blockquotes, code blocks, links, lists)
  - Callout directives (`::: note`, `::: reference`, `::: warning`, `::: info`) with customizable components
  - YAML frontmatter parsing and optional collapsible display via `FrontmatterHeader`
  - HTML input path with `rehype-sanitize@6` (XSS protection, default ON for HTML input)
  - Typography variants (`editorial`, `compact`, `technical`) driven by CSS custom properties
  - Optional syntax highlighting via lowlight (`codeHighlight` prop, opt-in)
  - Auto-generated heading IDs for anchor navigation
  - Loading and error states
  - Fully typed TypeScript exports; zero `any` types at module boundary
- New dependencies: `gray-matter@4.0.3`, `remark-directive@2.0.1`
- Comprehensive test suite: 387 content-viewer tests covering all features, callouts, sanitization, variants, frontmatter

## [0.3.0] - 2026-04-17

### Added

- **Planning Primitives** (`@miethe/ui/primitives`) — extracted from CCDash Planning Control Plane (PCP-709)
  - `StatusChip`: Five-variant status chip (neutral/ok/warn/error/info) with optional tooltip. Pure presentational; accepts `label`, `variant`, `tooltip` props.
  - `EffectiveStatusChips`: Composes `StatusChip` to render raw + effective status pair with hover provenance tooltip. Shows `eff:` chip only when statuses differ.
  - `MismatchBadge`: Amber mismatch indicator in two modes — compact inline chip and full banner with evidence chips. Accepts `state`, `reason`, `evidenceLabels`, `compact` props.
  - `BatchReadinessPill`: Wraps `StatusChip` for batch readiness state (`ready`/`blocked`/`waiting`/`unknown`) with optional blocking node/task ID display.
  - `PlanningNodeTypeIcon`: Maps `PlanningNodeType` string to a lucide-react icon. Supports 7 node types: `design_spec`, `prd`, `implementation_plan`, `progress`, `context`, `tracker`, `report`.
  - `variants.ts`: Exported helper types (`StatusChipVariant`, `ReadinessVariant`) and mapping functions (`statusVariant()`, `readinessVariant()`) for domain status → chip variant conversion.
  - Supporting types: `PlanningStatusProvenance`, `PlanningStatusProvenanceSource`, `PlanningStatusEvidence`, `PlanningPhaseBatchReadinessState`, `PlanningNodeType`.
  - 43 new unit tests across 5 test files covering all variants, prop forwarding, edge cases, and SVG rendering.

## [0.2.0] - 2026-04-16

### Added

- **Bulk Actions** (`@miethe/ui/bulk-actions`)
  - `BulkActionBar` component: Selection-aware toolbar with configurable actions, count badge, and keyboard shortcuts
  - Backward-compatible re-export from root `@miethe/ui` barrel

- **Entity Pickers** (`@miethe/ui/pickers`)
  - `EntityPickerDialog`: Modal-based entity picker with search, pagination, and multi-select support
  - `EntityPickerViewToggle`: Grid/list view toggle for picker layouts
  - Accessibility-audited; keyboard navigable, focus-managed

- **Filter & Sort Controls** (`@miethe/ui/filters`)
  - `FiltersDropdown`: Composable filter panel with multi-value support
  - `SortDropdown`: Sort-by selector with direction toggle
  - `TagFilterPopover`: Popover-based tag multi-select filter
  - `ToolFilterPopover`: Popover-based tool/type filter

- **WizardShell** (`@miethe/ui/primitives`)
  - Multi-step wizard frame with progress indicator and step validation hooks

- **Vertical Tab Navigation** (`@miethe/ui/primitives`)
  - `VerticalTabNavigation`: ARIA-compliant vertical tab list with keyboard nav (ArrowUp/Down/Home/End)

- **Phase 3 Extractions — Consolidated Modal System**
  - `TabRegistry` system: Declarative tab configuration with entity-type/edition/lens/feature-flag gating
  - `TabConfig`, `TabConditions`, `TabContext` interfaces; `getTabsForContext()` utility
  - `MetadataGrid` component: Key-value metadata display with collapsible sections
  - `TimelineView` component: Ordered history/event timeline with timestamps

- **Tiered Card System**
  - `TagColorProvider`, `ColoredBadge`, `TypeIndicator`
  - Card zone system: composable header/metadata/actions/footer layout zones

- **Type-Color Utilities** (extended `@miethe/ui/utils`)
  - `typeBarColors`, `TYPE_BAR_FALLBACK`, `getTypeBarColor()`
  - `artifactTypeCardTints`, `getCardTint()`

### Changed

- `exports` map updated: all subpath entries now resolve to `dist/` (compiled output) rather than `src/`
  — this is a correctness fix for npm consumers; workspace consumers were already patched to use source directly
- Added `"type": "module"` to package.json to correctly identify ESM output
- `publishConfig` set to `registry.npmjs.org` with `access: public` — package moves from GitHub Packages to npmjs.org
- Version bump 0.1.0 → 0.2.0

## [0.1.0] - 2026-03-15

### Added
- `@miethe/ui` package (evolved from `@skillmeat/content-viewer` v0.0.1)
- Build pipeline: `tsc` compilation to `dist/` with declaration files
- Six subpath exports: `./content-viewer`, `./diff`, `./editor`, `./display`, `./primitives`, `./utils`
- Components: `FileTree`, `ContentPane`, `DiffViewer`, `DiffViewerSkeleton`, `MarkdownEditor`, `SplitPreview`, `FrontmatterDisplay`, `FilePreviewPane`
- New primitives: `BaseArtifactModal`, `ModalHeader`, `TabNavigation` (extracted from SkillMeat)
- UI primitives: `Badge`, `ScrollArea`, `Dialog`, `Tabs`, `Button`
- 288 tests: original parity/a11y + new modal primitive parity + a11y tests
- GitHub Actions CI pipeline (build, type-check, test, publish)
- `ContentViewerProvider` adapter pattern for backend-agnostic data fetching
- Tree-shakeable subpath exports for optimal bundle size

### Changed
- Package renamed from `@skillmeat/content-viewer` to `@miethe/ui`
- Source reorganized into six submodule directories

[Unreleased]: https://github.com/miethe/homelab/compare/meaty-ui-v0.2.0...HEAD
[0.2.0]: https://github.com/miethe/homelab/compare/meaty-ui-v0.1.0...meaty-ui-v0.2.0
[0.1.0]: https://github.com/miethe/homelab/releases/tag/meaty-ui-v0.1.0
