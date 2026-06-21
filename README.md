# @miethe/ui

A collection of reusable React components for viewing, editing, and navigating file content. Provides an adapter abstraction pattern that decouples components from any specific backend API, allowing flexible integration with custom data sources.

## Overview

This package (formerly `@skillmeat/content-viewer`) was extracted from the SkillMeat web application during a UI refactoring effort. It provides production-ready components for:

### Content Viewing & Editing
- **File tree browser** — Hierarchical navigation with keyboard support
- **File content viewer** — Display files with markdown editing and split preview
- **Diff viewer** — Side-by-side unified diff display with conflict resolution
- **File preview pane** — Quick file preview with markdown rendering and tier badges
- **Frontmatter display** — Collapsible YAML frontmatter viewer
- **Markdown editor** — CodeMirror-based editor with live preview

### Consolidated Modal System (Phase 3)
- **Tab registry** — Declarative tab configuration with entity type / edition / lens / feature-flag gating
- **Metadata grid** — Key-value metadata display with collapsible sections
- **Timeline view** — Ordered history or event timeline rendering

### Artifact Type Visualization (Tiered Card System)
- **Type-aware badges** — ColoredBadge and TypeIndicator with color mapping
- **Tag color provider** — Context-based type-to-color mapping
- **Type-color utilities** — Artifact/entity type to Tailwind color class resolution

### Filtering & Operations
- **Filter components** — Tag/Tool filter popovers, Filters dropdown with AND/OR toggle, Sort dropdown
- **Utilities** — Frontmatter parsing, README extraction, type-color resolution, and more

The package uses an **adapter pattern** to remain backend-agnostic. You implement a simple `ContentViewerAdapter` interface and connect your own data-fetching hooks, making the components reusable across different APIs and applications.

## Installation

### From GitHub Packages (published package)

`@miethe/ui` is published to GitHub Packages at `npm.pkg.github.com`. Consuming it requires a GitHub token with `read:packages` scope.

**Step 1 — Configure the registry** in `.npmrc` at your project root:

```
@miethe:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set the `GITHUB_TOKEN` environment variable to a [personal access token](https://github.com/settings/tokens) with `read:packages` scope. Do not hard-code the token in `.npmrc` — use the env var reference as shown.

**Step 2 — Install:**

```bash
npm install @miethe/ui@0.1.0
# or
pnpm add @miethe/ui@0.1.0
```

### Within the SkillMeat monorepo (workspace)

```bash
pnpm add @miethe/ui --filter your-package
```

Or reference the workspace package directly in `package.json`:

```json
{
  "dependencies": {
    "@miethe/ui": "workspace:*"
  }
}
```

## Subpath Imports

The package is organized into eight submodules with tree-shakeable exports.

**IMPORTANT: Server Component Rule**

Never import from the root barrel (`@miethe/ui`) in a React Server Component. All re-exports lack a `'use client'` directive and will fail in server-component-only files. Use subpath imports instead:

```typescript
// ✗ Server component — do not use root barrel
import { FileTree, ContentPane } from '@miethe/ui';

// ✓ Server component — use subpath imports
import { FileTree, ContentPane } from '@miethe/ui/content-viewer';
```

Client components can safely use root barrel imports (the `'use client'` directive in submodules propagates to consumers).

**Available Subpaths**:

```typescript
// Content viewer components
import { FileTree, ContentPane, ArticleViewer, ContentViewerProvider } from '@miethe/ui/content-viewer';

// Diff viewing components
import { DiffViewer, DiffViewerSkeleton } from '@miethe/ui/diff';

// Discovery card (compact artifact discovery / search contexts)
import { DiscoveryCard } from '@miethe/ui/discovery';
import type { DiscoveryCardProps, AgentDiscoveryCandidate } from '@miethe/ui/discovery';

// Editor components
import { MarkdownEditor, SplitPreview, CodeEditor } from '@miethe/ui/editor';

// Display components
import { FrontmatterDisplay, FilePreviewPane } from '@miethe/ui/display';

// Filter components
import {
  TagFilterPopover, TagFilterBar,
  ToolFilterPopover, ToolFilterBar,
  FiltersDropdown,
  SortDropdown,
} from '@miethe/ui/filters';

// Bulk action toolbar
import { BulkActionBar } from '@miethe/ui/bulk-actions';
import type { BulkActionBarProps, BulkAction } from '@miethe/ui/bulk-actions';

// UI primitives
import { BaseArtifactModal, ModalHeader, TabNavigation, EnterpriseOwnerBadge, LockIcon } from '@miethe/ui/primitives';

// Tab registry system (consolidated modals)
import { TabRegistry, getTabsForContext, type TabConfig, type TabConditions } from '@miethe/ui/tab-registry';

// Metadata & timeline (Phase 3 extractions)
import { MetadataGrid, TimelineView } from '@miethe/ui/components';

// Card system (type-aware badges & indicators)
import { TagColorProvider, ColoredBadge, TypeIndicator } from '@miethe/ui/card-system';

// Utilities
import { parseFrontmatter, stripFrontmatter, extractFirstParagraph, getTypeBarColor, getCardTint, artifactTypeCardTints } from '@miethe/ui/utils';
```

## Prerequisites

### Tailwind CSS

Components use Tailwind CSS utility classes for all styling. Your build pipeline must have tailwindcss configured:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@miethe/ui/dist/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Important**: Without Tailwind CSS configured, components will render with no styles. Components use semantic Tailwind classes like `text-muted-foreground` and `bg-background` — ensure your Tailwind config includes these classes (standard in shadcn/ui projects).

### Required shadcn-Compatible CSS Variables

Define these CSS variables at `:root` or an appropriate ancestor element. These variables control the color palette for all UI components:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.6%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.6%;
  --border: 0 0% 89.8%;
  --ring: 0 0% 3.6%;
  --primary: 0 0% 9%;
  --accent: 0 84.6% 60.2%;
  --accent-foreground: 0 0% 100%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 100%;
  --destructive: 0 84.3% 60.2%;
  --input: 0 0% 89.8%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --card: 0 0% 3.6%;
    --card-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --ring: 0 84.6% 60.2%;
    --primary: 0 0% 98%;
    --accent: 0 84.6% 60.2%;
    --accent-foreground: 0 0% 9%;
    --secondary: 0 0% 85.1%;
    --secondary-foreground: 0 0% 9%;
    --destructive: 0 84.3% 60.2%;
    --input: 0 0% 14.9%;
  }
}
```

All components degrade gracefully if some variables are missing — the browser will use default colors. Define only the ones you need to customize.

### Dark Mode

Components support dark mode via the Tailwind `dark:` variant. Enable dark mode in your Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@miethe/ui/dist/**/*.js',
  ],
  // ... rest of config
};
```

Then add the `dark` class to your root HTML element to activate dark mode styles:

```html
<!-- Dark mode enabled -->
<html class="dark">
  <body>...</body>
</html>
```

Or use a theme provider component that toggles the class dynamically based on user preference.

### CodeMirror Deduplication

CodeMirror 6 requires exactly **one** `@codemirror/state` instance in the dependency tree. If multiple versions are installed, the editor will fail silently or behave unpredictably.

**Verify Installation**:

```bash
npm ls @codemirror/state
# or
yarn why @codemirror/state
# or
pnpm ls @codemirror/state
```

If you see multiple versions, force deduplication in `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "@codemirror/state": "^6.4.0"
    }
  }
}
```

For yarn, use `resolutions`:

```json
{
  "resolutions": {
    "@codemirror/state": "^6.4.0"
  }
}
```

For npm, add an `overrides` field (npm v8.3.0+):

```json
{
  "overrides": {
    "@codemirror/state": "^6.4.0"
  }
}
```

After updating, reinstall and verify the deduplicated list shows only one entry.

## Quick Start

### 1. Create an Adapter

Implement the `ContentViewerAdapter` interface by wrapping your application's data-fetching hooks:

```typescript
// lib/my-content-viewer-adapter.ts
import type { ContentViewerAdapter, AdapterHookOptions } from '@miethe/ui/content-viewer';
import { useFetchFileTree, useFetchFileContent } from '@/hooks';

export const myAdapter: ContentViewerAdapter = {
  useFileTree(artifactId: string, options?: AdapterHookOptions) {
    // Wrap your hook and normalize the return shape
    const result = useFetchFileTree(artifactId, {
      enabled: options?.enabled !== false,
    });

    return {
      data: result.data,
      isLoading: result.isLoading,
      error: result.error ?? null,
    };
  },

  useFileContent(artifactId: string, filePath: string, options?: AdapterHookOptions) {
    const result = useFetchFileContent(artifactId, filePath, {
      enabled: options?.enabled !== false,
    });

    return {
      data: result.data,
      isLoading: result.isLoading,
      error: result.error ?? null,
    };
  },
};
```

### 2. Provide the Adapter

Wrap your component tree with `ContentViewerProvider`:

```typescript
// app/layout.tsx
import { ContentViewerProvider } from '@miethe/ui/content-viewer';
import { myAdapter } from '@/lib/my-content-viewer-adapter';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ContentViewerProvider adapter={myAdapter}>
      {children}
    </ContentViewerProvider>
  );
}
```

### 3. Use Components

Now components can fetch data through your adapter:

```typescript
// components/MyViewer.tsx
'use client';

import { useState } from 'react';
import { FileTree, ContentPane } from '@miethe/ui/content-viewer';
import { DiffViewer, FilePreviewPane } from '@miethe/ui/display';

export function MyViewer({ artifactId }: { artifactId: string }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <div className="flex h-screen gap-4">
      <div className="w-64 border-r">
        <FileTree
          entityId={artifactId}
          files={[]} // Loaded via adapter
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
        />
      </div>
      <div className="flex-1">
        <ContentPane
          path={selectedPath}
          content={null} // Loaded via adapter
          isLoading={false}
          onSave={(content) => console.log('Save:', content)}
        />
      </div>
    </div>
  );
}

// Example: Diff Viewer for comparing versions
export function DiffExample() {
  return (
    <DiffViewer
      files={[]}
      leftLabel="Collection"
      rightLabel="Project"
    />
  );
}

// Example: File preview with tier information
export function FilePreviewExample() {
  return (
    <FilePreviewPane
      filePath="README.md"
      content={null}
      tier="collection"
      isLoading={false}
    />
  );
}
```

## Components API

### DiscoveryCard

Compact single-tier artifact card for discovery and search result contexts. Designed for reuse across `/discover` and marketplace search results pages.

**Props:**

```typescript
interface DiscoveryCardProps {
  candidate: AgentDiscoveryCandidate;        // The discovery candidate to display
  isSelected: boolean;                        // Selection state (affects styling)
  onToggleSelect: (candidate) => void;       // Called when checkbox is toggled
  onOpenDetail: (candidate) => void;         // Called when card is clicked
  onImport: (candidate) => void;             // Called when Import button is clicked
  onDeploy: (candidate) => void;             // Called when Deploy button is clicked
  isImporting?: boolean;                     // Show loading state on Import
  isDeploying?: boolean;                     // Show loading state on Deploy
  importDisabled?: boolean;                  // Disable Import button
  deployDisabled?: boolean;                  // Disable Deploy button
  className?: string;                        // Additional className
}
```

**Features:**

- Fixed-height card (min 160px) with left-border type color from `typeBarColors`
- Three zones: header (type icon + name + badges) | content (description + marketplace source + score bar) | actions (checkbox + import/deploy buttons)
- Source-aware rendering: shows collection/marketplace/web badges and source links
- Trust tier badge with icon (trusted, candidate, unverified, quarantined)
- Relevance score bar (0.0–1.0 displayed as 0–100%)
- Selection state with ring styling
- No app-hook coupling: all data and handlers passed as props

**Design Contract:**

- Parent grid must use `auto-rows-fr` for uniform row heights
- Type colors from `@miethe/ui/utils` (`typeBarColors`, `TYPE_BAR_FALLBACK`)
- Icon colors from component-local `TYPE_ICON_*` maps (semi-transparent variants)

**Example:**

```typescript
import { DiscoveryCard } from '@miethe/ui/discovery';

<div className="grid grid-cols-3 auto-rows-fr gap-4">
  {candidates.map((candidate) => (
    <DiscoveryCard
      key={candidate.name}
      candidate={candidate}
      isSelected={selected.has(candidate.name)}
      onToggleSelect={handleSelect}
      onOpenDetail={handleDetail}
      onImport={handleImport}
      onDeploy={handleDeploy}
      isImporting={importing === candidate.name}
    />
  ))}
</div>
```

**Full Documentation:** See `src/discovery/README.md` for complete API reference, zone architecture, accessibility notes, and marketplace reuse guidance.

### DiffViewer

A side-by-side unified diff viewer with file browser sidebar and optional sync conflict resolution actions.

**Props:**

```typescript
interface DiffViewerProps {
  files: FileDiff[];                    // Array of file diffs to display
  leftLabel?: string;                   // Label for left (before) panel
  rightLabel?: string;                  // Label for right (after) panel
  onClose?: () => void;                 // Callback when user closes the viewer
  showResolutionActions?: boolean;      // Show resolution action buttons (for sync conflicts)
  onResolve?: (resolution: ResolutionType) => void; // Callback for resolution selection
  localLabel?: string;                  // Custom label for local version (default: "Local (Project)")
  remoteLabel?: string;                 // Custom label for remote version (default: "Remote (Collection)")
  previewMode?: boolean;                // Show preview mode UI before applying resolution
  isResolving?: boolean;                // Show loading state during resolution
  isLoading?: boolean;                  // Show skeleton loading state
}

type ResolutionType = 'keep_local' | 'keep_remote' | 'merge';
```

**Features:**

- Side-by-side unified diff display with syntax-colored additions and deletions
- File list sidebar for navigating multiple diffs
- Summary badges showing file counts by status (added, modified, deleted, unchanged)
- Optional conflict resolution actions for sync workflows
- Large diff handling with lazy-loading (diffs > 50KB or 1000 lines collapsed by default)
- Full keyboard navigation and accessibility support

**Loading State:**

Use `DiffViewerSkeleton` to show a loading state while diff data is being fetched:

```typescript
import { DiffViewer, DiffViewerSkeleton } from '@miethe/ui/diff';

{isLoading ? (
  <DiffViewerSkeleton />
) : (
  <DiffViewer
    files={diffs}
    leftLabel="Collection"
    rightLabel="Project"
    showResolutionActions={true}
    onResolve={(resolution) => handleResolve(resolution)}
  />
)}
```

**Example with Mock Data:**

```typescript
import { DiffViewer } from '@miethe/ui/diff';
import type { FileDiff } from '@miethe/ui/diff';

const mockDiffs: FileDiff[] = [
  {
    file_path: 'src/index.ts',
    status: 'modified',
    collection_hash: 'abc123',
    project_hash: 'def456',
    unified_diff: `--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 export function hello() {
-  return 'world';
+  return 'world!';
 }`
  },
  {
    file_path: 'README.md',
    status: 'added',
    collection_hash: null,
    project_hash: '789abc',
    unified_diff: `--- /dev/null
+++ b/README.md
@@ -0,0 +1 @@
+# My Project`
  }
];

export function DiffExample() {
  return (
    <DiffViewer
      files={mockDiffs}
      leftLabel="Collection"
      rightLabel="Project"
      showResolutionActions={true}
      onResolve={(resolution) => console.log('Resolution:', resolution)}
    />
  );
}
```

**Resolution Actions:**

When `showResolutionActions` is true, users can choose from:
- `keep_local` - Keep the local (project) version
- `keep_remote` - Keep the remote (collection) version
- `merge` - Merge changes from both versions

### FilePreviewPane

File content preview with markdown rendering, code display, and plain text support. Includes a tier badge showing the source context (source, collection, or project).

**Props:**

```typescript
interface FilePreviewPaneProps {
  filePath: string | null;              // Path of file being previewed
  content: string | null;               // File content to display
  tier: 'source' | 'collection' | 'project'; // Context tier for badge display
  isLoading: boolean;                   // Show loading skeleton
}
```

**Features:**

- Auto-detects file type (markdown, code, text) based on extension
- Markdown files rendered with basic HTML conversion (headers, bold, italic, code blocks, links, lists)
- Code files displayed in monospace with line numbers
- Tier badge indicating file source (Source, Collection, or Project)
- Scrollable container for large files
- Loading skeleton during fetch

**Example with Markdown Preview:**

```typescript
import { FilePreviewPane } from '@miethe/ui/display';

export function PreviewExample() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <FilePreviewPane
      filePath="README.md"
      content={content}
      tier="collection"
      isLoading={isLoading}
    />
  );
}
```

**Tier Badges:**

The `tier` prop controls the badge appearance and label:
- `source` - Outline badge labeled "Source"
- `collection` - Secondary variant labeled "Collection"
- `project` - Default/primary variant labeled "Project"

### FileTree

A hierarchical file browser with keyboard navigation and selection support.

**Props:**

```typescript
interface FileTreeProps {
  entityId: string;              // Unique identifier for the entity (used as adapter key)
  files: FileNode[];             // Array of file tree nodes
  selectedPath: string | null;   // Currently selected file path
  onSelect: (path: string) => void; // Called when user selects a file
  onAddFile?: () => void;        // Optional: called when user clicks "Add File"
  onDeleteFile?: (path: string) => void; // Optional: called when user deletes a file
  isLoading?: boolean;           // Show loading skeleton
  readOnly?: boolean;            // Hide create/delete buttons (default: false)
  ariaLabel?: string;            // Accessible label (default: "File browser")
}
```

**Features:**

- Expandable/collapsible directories
- File type icons (markdown, code, JSON, etc.)
- Full keyboard navigation (arrows, home/end, enter/space)
- ARIA tree pattern with roving tabindex
- Optional file creation and deletion
- Read-only mode for view-only interfaces

**Example:**

```typescript
<FileTree
  entityId="skill-123"
  files={[
    { name: 'src', type: 'directory', path: 'src', children: [
      { name: 'index.ts', type: 'file', path: 'src/index.ts' }
    ] }
  ]}
  selectedPath="src/index.ts"
  onSelect={(path) => handleSelect(path)}
  onDeleteFile={(path) => handleDelete(path)}
  readOnly={false}
/>
```

### ArticleViewer

Read-only markdown and HTML renderer with frontmatter support, callouts, and typography variants.

**Props:**

```typescript
interface ArticleViewerProps {
  /**
   * The raw content string to render.
   * For markdown, the full remark pipeline (GFM + directives) is applied.
   * YAML frontmatter (if present) is extracted and not rendered as content.
   */
  content: string;

  /**
   * Format of the content. Defaults to `"auto"` which detects markdown
   * by looking for common markdown patterns.
   * @default "auto"
   */
  format?: 'markdown' | 'html' | 'auto';

  /**
   * Typography variant. Applies a CSS class (`cv-variant-{name}`) to the root
   * element. Each variant relies on CSS custom properties at document root.
   * See the CSS-Variable Contract below for the full list of expected variables.
   * @default undefined (no variant class applied)
   */
  variant?: 'editorial' | 'compact' | 'technical';

  /**
   * Controls visibility of the YAML frontmatter header above article content.
   * - `"show"` — header rendered, expanded by default
   * - `"collapse"` — header rendered, collapsed by default
   * - `"hide"` — header omitted entirely
   * Has no effect if the content has no frontmatter.
   * @default "hide"
   */
  frontmatter?: 'show' | 'collapse' | 'hide';

  /**
   * Override map for sub-components rendered by ArticleViewer.
   * - Callout keys (`note`, `reference`, `warning`, `info`): override default callout renderers
   * - `FrontmatterHeader`: override the default frontmatter header component
   *
   * Any key not provided falls back to the default implementation.
   */
  components?: {
    note?: React.ComponentType<CalloutProps>;
    reference?: React.ComponentType<CalloutProps>;
    warning?: React.ComponentType<CalloutProps>;
    info?: React.ComponentType<CalloutProps>;
    FrontmatterHeader?: React.ComponentType<FrontmatterHeaderProps>;
  };

  /**
   * Whether to sanitize HTML content (applies to `format="html"` and auto-detected HTML).
   * When `true` (default for HTML input), `rehype-sanitize@6` strips XSS vectors:
   * `<script>`, event handlers (`onclick`, `onerror`, …), `javascript:` and unsafe
   * `data:` URLs, `<iframe>`, `<object>`, `<embed>`, and `<svg>` containing scripts.
   *
   * Set to `false` **only** when the HTML source is fully trusted (e.g., content
   * compiled by the MeatyWiki engine through Portal's controlled pipeline).
   * Never set `false` for user-supplied or third-party content.
   *
   * @default true (for format="html" / auto-detected HTML), false (for format="markdown")
   */
  sanitize?: boolean;

  /**
   * Enable opt-in syntax highlighting for fenced code blocks via lowlight.
   * When `false` (default), code blocks render as styled monospace plain text.
   * When `true`, dynamically imports lowlight (~15KB gzip) and applies highlighting.
   *
   * @default false
   */
  codeHighlight?: boolean;

  /**
   * Automatically generate `id` attributes on heading elements (h1–h6)
   * using a GitHub-compatible slug algorithm.
   * @default true
   */
  generateHeadingIds?: boolean;

  /**
   * When `true`, suppress all content rendering and show an accessible
   * skeleton/placeholder instead.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Render an accessible error message instead of content.
   * Accepts either a `string` message or an `Error` object.
   * @default undefined
   */
  error?: string | Error | null;

  /**
   * Callback invoked when a rendering error occurs.
   */
  onError?: (error: Error) => void;

  /**
   * Additional CSS class names applied to the root wrapper element.
   */
  className?: string;
}
```

**Features:**

- Full CommonMark + GitHub-Flavored Markdown (tables, task lists, strikethrough, blockquotes, code blocks, links, lists)
- Callout directives: `::: note`, `::: reference`, `::: warning`, `::: info` with customizable components
- YAML frontmatter parsing and optional display via collapsible header
- HTML input support with XSS sanitization (default ON; opt-out for trusted sources)
- Typography variants (CSS-variable-driven): editorial, compact, technical
- Syntax highlighting (opt-in, lowlight-based)
- Heading anchor links (auto-generated IDs)
- Loading and error states
- Fully typed TypeScript exports
- Zero React Markdown coupling (pure remark pipeline)

**CSS-Variable Contract:**

When using `variant="editorial"`, define these variables at `:root` or a suitable ancestor:

```css
:root {
  /* Typography */
  --cv-editorial-h1-font: Fraunces, Georgia, serif;
  --cv-editorial-h1-size: 2.25rem;
  --cv-editorial-h2-font: Fraunces, Georgia, serif;
  --cv-editorial-h2-size: 1.875rem;
  --cv-editorial-body-font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --cv-editorial-body-size: 1rem;
  --cv-editorial-body-line-height: 1.75;
  
  /* Quotes & blockquotes */
  --cv-editorial-quote-color: #64748b;
  --cv-editorial-quote-font-style: italic;
  
  /* Callout colors */
  --cv-callout-note-accent: #0ea5e9;
  --cv-callout-note-bg: #f0f9ff;
  --cv-callout-reference-accent: #64748b;
  --cv-callout-reference-bg: #f1f5f9;
  --cv-callout-warning-accent: #f59e0b;
  --cv-callout-warning-bg: #fffbeb;
  --cv-callout-info-accent: #0ea5e9;
  --cv-callout-info-bg: #f0f9ff;
}
```

Analogous `--cv-compact-*` and `--cv-technical-*` sets follow the same pattern. Missing variables are silently ignored — browser defaults apply.

**Examples:**

```typescript
import { ArticleViewer } from '@miethe/ui/content-viewer';

// Basic markdown rendering
<ArticleViewer
  content="# Hello\n\nThis is **bold** and *italic*."
  format="markdown"
/>

// With frontmatter display
<ArticleViewer
  content={`---
title: My Article
date: 2026-04-24
tags: [markdown, ui]
---

# Article title

Content here...`}
  frontmatter="show"
  variant="editorial"
/>

// With callouts
<ArticleViewer
  content={`# Document

::: note
This is a note callout.
:::

::: warning
This is a warning.
:::`}
  format="markdown"
/>

// With callout override
<ArticleViewer
  content={markdown}
  components={{
    note: CustomNoteCallout,
    warning: CustomWarningCallout,
  }}
/>

// HTML input with sanitization (default ON)
<ArticleViewer
  content="<p>This <script>alert('xss')</script> is <strong>safe</strong>.</p>"
  format="html"
  sanitize={true}
/>

// Trusted engine-compiled HTML (sanitization OFF)
<ArticleViewer
  content={engineOutput}
  format="html"
  sanitize={false}
/>

// With syntax highlighting
<ArticleViewer
  content={`\`\`\`typescript
function hello(name: string) {
  console.log('Hello', name);
}
\`\`\``}
  codeHighlight={true}
/>

// Typography variant with custom CSS variables
<ArticleViewer
  content={markdown}
  variant="editorial"
/>
{/* In your globals.css: */}
{/* :root { --cv-editorial-body-font: 'Libre Baskerville', serif; ... } */}
```

**Sanitization Notes:**

- By default, HTML input is sanitized via `rehype-sanitize@6`, which strips script tags, event handlers, unsafe URLs, and dangerous elements
- Markdown input (via `react-markdown`) is inherently safe — the sanitization prop has no effect on markdown
- For pre-compiled engine output (trusted source), set `sanitize={false}` to skip sanitization overhead
- For user-supplied or third-party HTML, always use `sanitize={true}` (the default)

### ContentPane

Display and edit file content with syntax highlighting, markdown preview, and optional editing.

**Props:**

```typescript
interface ContentPaneProps {
  path: string | null;           // File path being displayed
  content: string | null;        // File content
  isLoading?: boolean;           // Show loading skeleton
  error?: string | null;         // Error message to display
  readOnly?: boolean;            // Hide edit/save buttons (default: false)
  truncationInfo?: TruncationInfo; // Info about truncated files
  codeHighlight?: boolean;       // Enable syntax highlighting (opt-in, requires lowlight)
  renderBinaryPreview?: (ext: string, content: string | Uint8Array) => ReactNode | null; // Custom binary preview
  // Lifted edit state
  isEditing?: boolean;           // True when in edit mode
  editedContent?: string;        // Content being edited
  onEditStart?: () => void;      // Called when user clicks "Edit"
  onEditChange?: (content: string) => void; // Called on every keystroke
  onSave?: (content: string) => void | Promise<void>; // Called on save
  onCancel?: () => void;         // Called on cancel
  ariaLabel?: string;            // Accessible label
}
```

**Features:**

- Breadcrumb navigation for file paths
- Syntax highlighting for code files (opt-in via `codeHighlight` prop)
- Markdown split-preview (editor + preview) for `.md` files
- Optional frontmatter display
- Edit mode for supported file types (.md, .ts, .tsx, .js, .jsx, .py, .json, .css)
- Truncation warning for large files
- Lazy-loaded CodeMirror editor (bundle cost only on demand)
- Custom binary/image preview via `renderBinaryPreview` render-prop

**Code Highlighting (Optional)**:

Enable syntax highlighting for non-markdown code blocks:

```typescript
import { ContentPane } from '@miethe/ui/content-viewer';

<ContentPane
  path="src/utils.ts"
  content={tsCode}
  codeHighlight={true}
/>
```

Requires `lowlight` (v2 or v3) installed:

```bash
npm install lowlight
```

Import a highlight.js theme CSS:

```typescript
// In your app layout or CSS file
import 'highlight.js/styles/github.css';  // Light mode
// or
import 'highlight.js/styles/github-dark.css';  // Dark mode
```

Without lowlight installed, code renders as plain text (no error).

**Custom Binary Previews**:

Provide a render-prop for custom binary/image/PDF previews:

```typescript
<ContentPane
  path={path}
  content={content}
  renderBinaryPreview={(ext, content) => {
    if (ext === 'pdf') {
      return <PdfViewer content={content} />;  // Your custom viewer
    }
    if (ext === 'png' || ext === 'jpg') {
      return <img src={`data:image/${ext};base64,${content}`} />;
    }
    return null;  // Fall through to text view
  }}
/>
```

Returning `null` from the render-prop falls through to the default text display.

**Example:**

```typescript
const [isEditing, setIsEditing] = useState(false);
const [editedContent, setEditedContent] = useState('');

<ContentPane
  path="README.md"
  content={fileContent}
  isLoading={isLoading}
  isEditing={isEditing}
  editedContent={editedContent}
  onEditStart={() => {
    setEditedContent(fileContent);
    setIsEditing(true);
  }}
  onEditChange={setEditedContent}
  onSave={async (content) => {
    await saveFile(content);
    setIsEditing(false);
  }}
  onCancel={() => setIsEditing(false)}
/>
```

### FrontmatterDisplay

Display parsed YAML frontmatter as key-value pairs with collapsible state.

**Props:**

```typescript
interface FrontmatterDisplayProps {
  frontmatter: Record<string, unknown>; // Parsed YAML frontmatter object
  defaultCollapsed?: boolean;           // Start collapsed (default: false)
  className?: string;                   // Additional CSS classes
}
```

**Supports:**

- Strings, numbers, booleans, null
- Arrays (rendered as comma-separated values)
- Nested objects (one level, rendered indented)

**Example:**

```typescript
const frontmatter = {
  title: 'My Document',
  tags: ['react', 'typescript'],
  author: { name: 'John', email: 'john@example.com' }
};

<FrontmatterDisplay
  frontmatter={frontmatter}
  defaultCollapsed={false}
  className="mb-4"
/>
```

### SplitPreview

CodeMirror-based markdown editor with live preview. Lazy-loaded for performance.

**Props:**

```typescript
interface SplitPreviewProps {
  content: string;                      // Current content
  onChange: (content: string) => void;  // Called on every keystroke
  isEditing: boolean;                   // Control editor visibility
}
```

**Note:** This component is lazy-loaded and only fetched when rendering a markdown file in edit mode. Non-markdown files never trigger the download.

### MarkdownEditor

CodeMirror-based markdown editor for editing `.md` files. Also lazy-loaded with reactive dark-mode support.

**Props:**

```typescript
interface MarkdownEditorProps {
  content: string;                      // Current content
  onChange: (content: string) => void;  // Called on every keystroke
  readOnly?: boolean;                   // Disable editing (default: false)
}
```

**Features:**

- Live theme switching (tracks OS `prefers-color-scheme` changes at runtime)
- Full markdown syntax support
- Lazy-loaded for optimal bundle size

### CodeEditor

CodeMirror 6 editor for non-markdown code files (.ts, .tsx, .js, .jsx, .py, .json, .css). Exported from `@miethe/ui/editor`.

**Import:**

```typescript
import { CodeEditor } from '@miethe/ui/editor';
```

**Props:**

```typescript
interface CodeEditorProps {
  initialContent: string;                           // Initial code content
  onChange: (content: string) => void;              // Called on every keystroke
  readOnly?: boolean;                               // Disable editing (default: false)
  language?: LanguageSupport;                       // CodeMirror language extension (optional)
  className?: string;                               // Additional CSS classes
}
```

**Features:**

- Language detection by file extension
- Syntax highlighting (via language extensions)
- Reactive dark-mode support
- Full keyboard navigation
- Lazy-loaded via dynamic import

**Example:**

```typescript
import { CodeEditor } from '@miethe/ui/editor';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';

// With auto-detected language
<CodeEditor
  initialContent="const x = 42;"
  onChange={(content) => console.log(content)}
/>

// With explicit language
<CodeEditor
  initialContent="def hello(): pass"
  onChange={setCode}
  language={python()}
/>
```

**ContentPane Integration:**

ContentPane automatically routes non-markdown editable files to CodeEditor:

```typescript
// ContentPane detects .ts/.tsx/.js/.jsx/.py/.json/.css files
// and uses CodeEditor instead of MarkdownEditor when editing
<ContentPane
  path="src/utils.ts"
  content={tsCode}
  isEditing={true}
  onEditChange={setCode}
/>
```

## Primitives API (`@miethe/ui/primitives`)

Reusable UI primitives extracted from SkillMeat components. All primitives are production-ready, fully accessible, and compose with shadcn/ui components.

### BaseArtifactModal

Controlled composition-based modal foundation for artifact-focused dialogs. Encapsulates common structure (dialog wrapper, header, tabs, content area) while delegating domain-specific logic to consumers.

**Props:**

```typescript
interface BaseArtifactModalProps {
  artifact: Artifact;                  // Artifact to display
  open: boolean;                       // Dialog open state
  onClose: () => void;                 // Close handler
  activeTab: string;                   // Controlled tab value
  onTabChange: (tab: string) => void;  // Tab change callback
  tabs: Tab[];                         // Tab definitions for navigation
  headerActions?: React.ReactNode;     // Optional actions in header (right side)
  children: React.ReactNode;           // Tab content (TabContentWrapper elements)
  aboveTabsContent?: React.ReactNode;  // Content between header and tabs
  returnTo?: string;                   // Optional return URL
  onReturn?: () => void;               // Optional return button handler
}

interface Tab {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}
```

**Features:**

- Automatic artifact icon resolution from ARTIFACT_TYPES config
- Composable tab content with TabContentWrapper
- Header action slots for custom controls
- Return navigation support
- Full keyboard navigation and accessibility

**Example:**

```typescript
const tabs: Tab[] = [
  { value: 'status', label: 'Status', icon: Activity },
  { value: 'sync', label: 'Sync', icon: RefreshCcw },
];

<BaseArtifactModal
  artifact={artifact}
  open={isOpen}
  onClose={() => setIsOpen(false)}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={tabs}
  headerActions={<HealthIndicator artifact={artifact} />}
>
  <TabContentWrapper value="status">
    <StatusContent artifact={artifact} />
  </TabContentWrapper>
  <TabContentWrapper value="sync">
    <SyncContent artifact={artifact} />
  </TabContentWrapper>
</BaseArtifactModal>
```

### ModalHeader

Header component for use within BaseArtifactModal or standalone dialogs. Displays artifact metadata with icon, name, and optional action buttons.

**Props:**

```typescript
interface ModalHeaderProps {
  artifact?: Artifact;                 // Optional artifact for icon/name display
  title?: string;                      // Custom title (overrides artifact name)
  icon?: React.ReactNode;              // Custom icon
  actions?: React.ReactNode;           // Action buttons or controls
  className?: string;                  // Additional CSS classes
}
```

**Features:**

- Icon auto-resolution from artifact type
- Artifact name display
- Right-aligned action slot
- Consistent styling with SkillMeat modals
- Accessible heading semantic

### CreateEntityDialog

Schema-driven creation dialog for entities. Dynamically renders form fields from an `EntityFormSchema` definition using react-hook-form for state management and per-field validation.

**Import:**
```typescript
import { CreateEntityDialog } from '@miethe/ui/primitives';
import type { EntityFormSchema, FieldDef } from '@miethe/ui/primitives';
```

**Modes:**

1. **Simple** — Flat list of fields
2. **Tabs** — Fields grouped into tabs
3. **Composite** — Tabs + member picker + review step

**Simple Mode Example:**

```typescript
<CreateEntityDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Create Skill"
  description="Add a new skill to your collection"
  schema={{
    mode: 'simple',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'tags', label: 'Tags', type: 'tags', options: [
        { label: 'Important', value: 'important' },
      ]},
    ],
    collection: { enabled: true, required: true, collapsible: true },
  }}
  collections={[
    { id: 'col-1', name: 'My Collection' },
  ]}
  onSubmit={async (values) => {
    await api.createSkill(values);
  }}
  submitLabel="Create"
/>
```

**Tabs Mode Example:**

```typescript
<CreateEntityDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Create Project"
  schema={{
    mode: 'tabs',
    tabs: [
      {
        id: 'basic',
        label: 'Basic Info',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        fields: [
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
    collection: { enabled: true },
  }}
  collections={collections}
  onSubmit={async (values) => {
    await api.createProject(values);
  }}
/>
```

**Composite Mode:**

Composite mode adds a `members` picker and optional `renderReviewStep`. Selected member IDs are passed to `onMemberIdsChange`.

```typescript
schema={{
  mode: 'composite',
  tabs: [...],
  members: {
    entityType: 'skill',
    label: 'Skills',
    validateMin: 1,
    validateMax: 10,
  },
  renderReviewStep: ({ values, memberIds }) => (
    <div>Review: {values.name} with {memberIds.length} skills</div>
  ),
}}
memberIds={selectedIds}
onMemberIdsChange={setSelectedIds}
```

**CollectionPicker Sub-component:**

The `CollectionPicker` component is embedded in simple/tabs/composite modes when `collection.enabled: true`.

**Props:**
```typescript
interface CollectionPickerConfig {
  enabled: boolean;           // Show picker
  required?: boolean;         // Mandatory before submit
  collapsible?: boolean;      // User can collapse/expand
  defaultCollectionId?: string; // Pre-select a collection
}
```

**Entity Type Registry:**

Some entity types are disabled in the internal type registry (see `src/primitives/CreateEntityDialog.tsx`). Check runtime behavior or the source before creating forms for edge-case entity types.

### TabNavigation

Horizontal tab list component for BaseArtifactModal and custom tab interfaces. Supports icons and keyboard navigation.

**Props:**

```typescript
interface TabNavigationProps {
  tabs: Tab[];                         // Tab definitions
  activeTab: string;                   // Active tab value
  onChange: (tab: string) => void;     // Tab change handler
  className?: string;                  // Additional CSS classes
}

interface Tab {
  value: string;                       // Tab identifier
  label: string;                       // Display label
  icon?: React.ComponentType<{ className?: string }>; // Optional icon component
  disabled?: boolean;                  // Disable tab (optional)
}
```

**Features:**

- Icon display (from lucide-react or custom)
- Full keyboard navigation (ArrowLeft, ArrowRight, Home, End)
- Accessible ARIA attributes
- Auto-activates on focus

### EnterpriseOwnerBadge

Badge component indicating that an artifact is managed by the enterprise organization. Displays inline on artifact cards to signal enterprise governance.

**Props:**

```typescript
interface EnterpriseOwnerBadgeProps {
  className?: string;                  // Additional CSS classes
}
```

**Features:**

- Building2 icon from lucide-react
- Violet color scheme for enterprise branding
- "Enterprise Managed" label text
- Accessible aria-label
- Compact inline styling

**Example:**

```typescript
import { EnterpriseOwnerBadge } from '@miethe/ui/primitives';

<div className="flex items-center gap-2">
  <ArtifactName artifact={artifact} />
  {artifact.owner_type === 'enterprise' && <EnterpriseOwnerBadge />}
</div>
```

### LockIcon

Tooltip-wrapped lock indicator for artifacts with enforce_override=True. Renders a small lock icon with an accessible tooltip explaining the enforced state.

**Props:**

```typescript
interface LockIconProps {
  className?: string;                  // Additional CSS classes
  tooltip?: string;                    // Custom tooltip text (optional)
}
```

**Default tooltip:** "This artifact cannot be modified — enforced by your organization"

**Features:**

- Lock icon from lucide-react
- Radix UI Tooltip for accessible popover
- Keyboard-accessible trigger
- Customizable tooltip message
- Accessible ARIA labels on both trigger and icon

**Example:**

```typescript
import { LockIcon } from '@miethe/ui/primitives';

<div className="flex items-center gap-2">
  <ArtifactName artifact={artifact} />
  {artifact.enforce_override && (
    <LockIcon tooltip="Custom enforcement message" />
  )}
</div>
```

## Planning Primitives (`@miethe/ui/primitives`)

Five status and metadata display primitives extracted from the CCDash Planning Control Plane (PCP-709). These are generic enough to be reused across any planning-adjacent feature.

### StatusChip

Five-variant status chip (neutral / ok / warn / error / info) as an inline-flex badge. Accepts an optional `tooltip` rendered as a `title` attribute.

```typescript
import { StatusChip } from '@miethe/ui/primitives';

<StatusChip label="pending" variant="warn" tooltip="Waiting on upstream" />
```

**Variants:** `neutral` (slate) | `ok` (emerald) | `warn` (amber) | `error` (rose) | `info` (blue)

### EffectiveStatusChips

Renders a raw status chip plus an optional effective status chip when the two differ. The raw chip gains a hover tooltip showing provenance source and reason when `provenance` is supplied.

```typescript
import { EffectiveStatusChips } from '@miethe/ui/primitives';

<EffectiveStatusChips
  rawStatus="pending"
  effectiveStatus="blocked"
  isMismatch
  provenance={{ source: 'derived', reason: 'Blocked by upstream task', evidence: [] }}
/>
```

### MismatchBadge

Amber mismatch indicator in two modes: compact inline chip or full banner with title, reason, and evidence label chips.

```typescript
import { MismatchBadge } from '@miethe/ui/primitives';

// Compact inline chip (for card/list contexts)
<MismatchBadge state="stale" reason="Status diverged from progress" compact />

// Full banner (for detail headers)
<MismatchBadge
  state="mismatched"
  reason="Progress says done but PRD is pending"
  evidenceLabels={['PRD-outdated', 'progress-diverged']}
/>
```

### BatchReadinessPill

Wraps `StatusChip` to show batch readiness state (`ready` / `blocked` / `waiting` / `unknown`) with optional blocking node/task IDs displayed below the chip.

```typescript
import { BatchReadinessPill } from '@miethe/ui/primitives';

<BatchReadinessPill
  readinessState="blocked"
  blockingNodeIds={['prd-auth', 'prd-onboarding']}
  blockingTaskIds={['TASK-2.1']}
/>
```

### PlanningNodeTypeIcon

Maps a `PlanningNodeType` string to a lucide-react icon. Supports 7 node types: `design_spec`, `prd`, `implementation_plan`, `progress`, `context`, `tracker`, `report`. Accepts `size` (default 13) and `className` props.

```typescript
import { PlanningNodeTypeIcon } from '@miethe/ui/primitives';
import type { PlanningNodeType } from '@miethe/ui/primitives';

<PlanningNodeTypeIcon type="prd" size={16} className="text-blue-400" />
```

### Variant Helpers

```typescript
import { statusVariant, readinessVariant } from '@miethe/ui/primitives';
import type { StatusChipVariant, ReadinessVariant } from '@miethe/ui/primitives';

// Map any status string to a StatusChip variant
const variant = statusVariant('in_progress'); // → 'ok'
const readiness = readinessVariant('blocked'); // → 'error'
```

---

## Filters API (`@miethe/ui/filters`)

Reusable filter components for building toolbar filter bars. All components are pure presentational — consumers provide data via props.

### TagFilterPopover

Multi-select tag filter with search, color-coded badges, and artifact counts.

```tsx
import { TagFilterPopover, TagFilterBar } from '@miethe/ui/filters';

<TagFilterPopover
  selectedTags={['design', 'canvas']}
  onChange={(tags) => setTags(tags)}
  availableTags={[
    { name: 'design', artifact_count: 5 },
    { name: 'canvas', artifact_count: 3 },
  ]}
/>

{/* Inline chip bar showing selected tags with remove buttons */}
<TagFilterBar
  selectedTags={selectedTags}
  onChange={setTags}
  availableTags={availableTags}
/>
```

### ToolFilterPopover

Multi-select tool filter with search and counts.

```tsx
import { ToolFilterPopover, ToolFilterBar } from '@miethe/ui/filters';

<ToolFilterPopover
  selectedTools={['Bash', 'Read']}
  onChange={(tools) => setTools(tools)}
  availableTools={[
    { name: 'Bash', artifact_count: 12 },
    { name: 'Read', artifact_count: 8 },
  ]}
/>
```

### FiltersDropdown

Dropdown button with multi-select category sub-menus and AND/OR toggle.

```tsx
import { FiltersDropdown, type FilterCategory } from '@miethe/ui/filters';

const categories: FilterCategory[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'error', label: 'Error' },
    ],
    selected: selectedStatuses,
    onChange: setStatuses,
  },
];

<FiltersDropdown
  categories={categories}
  filterMode="and"
  onFilterModeChange={setFilterMode}
/>
```

**AND/OR mode**: Controls how values *within* each category combine. AND = must match all selected, OR = match any. Across categories is always AND.

### SortDropdown

Sort field + order toggle dropdown.

```tsx
import { SortDropdown } from '@miethe/ui/filters';

<SortDropdown
  options={[
    { value: 'name', label: 'Name' },
    { value: 'updatedAt', label: 'Last Updated' },
  ]}
  sortField="name"
  sortOrder="asc"
  onSortChange={(field, order) => { /* ... */ }}
/>
```

Clicking an already-selected field toggles the order.

### FilterBar & Filter Slot System

Reusable filter bar with search, sort, view toggle, and pluggable slot registry. Renders a horizontal toolbar with four zones (left → right): search input, conditional filter slots, sort dropdown, and view toggle.

**Basic Usage:**

```tsx
import { FilterBar } from '@miethe/ui/filters';

<FilterBar
  searchValue={searchValue}
  onSearchChange={setSearchValue}
  sortField="name"
  sortOrder="asc"
  onSortChange={(field, order) => { /* ... */ }}
  view="grid"
  onViewChange={(mode) => { /* ... */ }}
  filterSlots={slots}
  conditionContext={{ pageId: 'artifacts' }}
/>
```

**Slot Registration Example:**

```tsx
import type { FilterSlotConfig } from '@miethe/ui/filters';

const filterSlots: FilterSlotConfig[] = [
  {
    id: 'trust-filter',
    label: 'Trust Level',
    component: <TrustLevelSelect selected={trust} onChange={setTrust} />,
    condition: (ctx) => ctx.pageId === 'marketplace-sources',
  },
  {
    id: 'type-filter',
    label: 'Type',
    component: <TypeSelect selected={types} onChange={setTypes} />,
  },
];
```

**Interface Definitions:**

```typescript
export interface FilterSlotConditionContext {
  pageId: string;                 // Stable identifier (e.g. "artifacts", "marketplace")
  edition?: string;               // Backend edition: "local" or "enterprise"
}

export interface FilterSlotConfig {
  id: string;                     // Unique slot identifier
  label: string;                  // Human-readable label for accessibility
  component: React.ReactNode;     // React node to render when slot is active
  condition?: (ctx: FilterSlotConditionContext) => boolean;  // Optional visibility predicate
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  filterSlots?: FilterSlotConfig[];
  conditionContext?: FilterSlotConditionContext;
  sort?: FilterBarSortProps;
  viewToggle?: {
    value: 'grid' | 'list';
    onChange: (mode: 'grid' | 'list') => void;
    enabled?: boolean;
  };
  className?: string;
}
```

**Accessibility:**

The FilterBar renders a `role="search"` landmark region with a configurable `aria-label`. Slot authors should include `aria-label` on interactive elements (selects, popovers) to support screen readers. Condition predicates are evaluated synchronously at render time without side effects.

**Source:** `skillmeat/web/packages/ui/src/filters/`

## Bulk Actions API (`@miethe/ui/bulk-actions`)

Floating toolbar component for multi-select interfaces. Displays a bottom-fixed action bar with selection count and action buttons when items are selected.

### BulkActionBar

Generic floating bulk action bar that slides in from the bottom of the viewport. Fully props-driven with no backend dependencies.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedCount` | `number` | Yes | Number of currently selected items |
| `hasSelection` | `boolean` | Yes | Controls visibility (true = visible, false = hidden) |
| `actions` | `BulkAction[]` | Yes | Array of action button definitions |
| `onClearSelection` | `() => void` | Yes | Callback when user clicks the clear/X button |
| `className` | `string` | No | Optional className for custom styling |

**BulkAction Interface:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier used as React key and loading state key |
| `label` | `string` | Yes | Button label text |
| `icon` | `React.ReactNode` | No | Optional icon rendered left of label |
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost'` | No | Button visual style (default: 'ghost') |
| `onClick` | `() => void \| Promise<void>` | Yes | Click handler; may return a Promise for async actions |
| `disabled` | `boolean` | No | When true, button is disabled |

**Basic Usage:**

```tsx
import { BulkActionBar } from '@miethe/ui/bulk-actions';
import { Trash2, Download } from 'lucide-react';
import { useState } from 'react';

export function MyList() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const actions = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'destructive',
      onClick: () => handleDelete(Array.from(selected)),
    },
    {
      id: 'download',
      label: 'Download',
      icon: <Download className="h-3.5 w-3.5" />,
      onClick: async () => {
        await downloadItems(Array.from(selected));
      },
    },
  ];

  return (
    <>
      {/* Your list items with selection checkboxes */}
      <BulkActionBar
        selectedCount={selected.size}
        hasSelection={selected.size > 0}
        actions={actions}
        onClearSelection={() => setSelected(new Set())}
      />
    </>
  );
}
```

**Features:**

- Smooth slide-up/down transitions
- Per-action loading spinners for async operations
- Global disabled state during in-flight requests
- Full keyboard navigation support
- ARIA labels and live region announcements for selection count changes

## Adapter Pattern

The adapter pattern is the core architectural decision that makes this package reusable. Instead of baking in dependencies on a specific API client or state management library, components call `useContentViewerAdapter()` to access injected hooks.

### The `ContentViewerAdapter` Interface

```typescript
import type { ContentViewerAdapter, AdapterHookOptions, AdapterQueryResult, FileTreeResponse, FileContentResponse } from '@miethe/ui/content-viewer';

interface ContentViewerAdapter {
  useFileTree(
    artifactId: string,
    options?: AdapterHookOptions
  ): AdapterQueryResult<FileTreeResponse>;

  useFileContent(
    artifactId: string,
    filePath: string,
    options?: AdapterHookOptions
  ): AdapterQueryResult<FileContentResponse>;
}
```

### Implementing an Adapter

An adapter wraps your application's hooks and normalizes their return shape:

```typescript
const myAdapter: ContentViewerAdapter = {
  useFileTree(artifactId, options) {
    const result = myCustomHook(artifactId, { enabled: options?.enabled });
    return {
      data: result.data,
      isLoading: result.loading,
      error: result.err ?? null, // Normalize error field
    };
  },

  useFileContent(artifactId, filePath, options) {
    const result = myOtherHook(artifactId, filePath, {
      enabled: options?.enabled
    });
    return {
      data: result.data,
      isLoading: result.loading,
      error: result.err ?? null,
    };
  },
};
```

### Return Shape

All adapter hooks return `AdapterQueryResult<T>`:

```typescript
interface AdapterQueryResult<T> {
  data: T | undefined;        // Undefined while loading or on error
  isLoading: boolean;          // True during initial fetch
  error: Error | null;         // Non-null when fetch fails
}
```

### Error Handling

The `error` field can contain any Error object. Normalize errors from different data sources before returning:

**REST API Adapter Example:**

```typescript
import { useQuery } from '@tanstack/react-query';
import type { ContentViewerAdapter } from '@miethe/ui/content-viewer';

export const restAdapter: ContentViewerAdapter = {
  useFileTree(artifactId: string, options) {
    const query = useQuery({
      queryKey: ['file-tree', artifactId],
      queryFn: async () => {
        const res = await fetch(`/api/files/${artifactId}/tree`);
        if (!res.ok) {
          throw new Error(`Failed to load file tree: ${res.status} ${res.statusText}`);
        }
        return res.json();
      },
      enabled: options?.enabled ?? true,
    });

    return {
      data: query.data ?? undefined,
      isLoading: query.isPending,
      error: query.error ?? null,
    };
  },

  useFileContent(artifactId: string, filePath: string, options) {
    const query = useQuery({
      queryKey: ['file-content', artifactId, filePath],
      queryFn: async () => {
        const res = await fetch(`/api/files/${artifactId}/content?path=${filePath}`);
        if (!res.ok) {
          throw new Error(`Failed to load file: ${res.status}`);
        }
        return res.json();
      },
      enabled: options?.enabled ?? true,
    });

    return {
      data: query.data ?? undefined,
      isLoading: query.isPending,
      error: query.error ?? null,
    };
  },
};
```

**GraphQL Adapter Example:**

```typescript
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import type { ContentViewerAdapter } from '@miethe/ui/content-viewer';

const FILE_TREE_QUERY = gql`
  query GetFileTree($id: ID!) {
    fileTree(id: $id) {
      entries {
        name
        path
        type
      }
    }
  }
`;

const FILE_CONTENT_QUERY = gql`
  query GetFileContent($id: ID!, $path: String!) {
    fileContent(id: $id, path: $path) {
      content
      encoding
      size
    }
  }
`;

export const graphqlAdapter: ContentViewerAdapter = {
  useFileTree(artifactId: string, options) {
    const { data, loading, error } = useQuery(FILE_TREE_QUERY, {
      variables: { id: artifactId },
      skip: !(options?.enabled ?? true),
    });

    return {
      data: data?.fileTree ?? undefined,
      isLoading: loading,
      error: error ?? null,
    };
  },

  useFileContent(artifactId: string, filePath: string, options) {
    const { data, loading, error } = useQuery(FILE_CONTENT_QUERY, {
      variables: { id: artifactId, path: filePath },
      skip: !(options?.enabled ?? true),
    });

    return {
      data: data?.fileContent ?? undefined,
      isLoading: loading,
      error: error ?? null,
    };
  },
};
```

**Error Display:**

The `ContentPane` and `FileTree` components automatically display error states when the `error` field is truthy:

```typescript
// Components handle error display automatically
<ContentPane
  path={selectedPath}
  content={content}
  error={fileError} // Will show error UI if non-null
  isLoading={isLoading}
/>

<FileTree
  entityId={artifactId}
  files={files}
  error={treeError} // Will show error UI if non-null
/>
```

**Error Boundary:**

Wrap components with a React error boundary to catch unexpected render errors:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 text-red-600">
      <p>Something went wrong:</p>
      <pre className="text-sm">{error.message}</pre>
    </div>
  );
}

export function MyViewer() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <FileTree entityId={artifactId} files={files} />
    </ErrorBoundary>
  );
}
```

## Utilities

### Type-Color Utilities

Generic color-coding helpers for artifact/entity type indicators. Maps type strings to Tailwind CSS classes for left-border accents and subtle background tints. Type-agnostic and safe to call with arbitrary strings — unknown types receive sensible fallbacks.

```typescript
import {
  typeBarColors,              // Record mapping types to border-l-{color} classes
  TYPE_BAR_FALLBACK,          // Gray fallback for unknown types
  getTypeBarColor,            // Resolve left-border color
  artifactTypeCardTints,      // Record mapping types to subtle bg tint classes
  getCardTint,                // Resolve background tint
} from '@miethe/ui/utils';

// Get left-border color for a type
const borderColor = getTypeBarColor('skill');     // 'border-l-purple-500'
const unknown = getTypeBarColor('unknown');        // 'border-l-gray-400' (fallback)

// Apply with Tailwind class composition
<div className={`border-l-4 ${getTypeBarColor(artifact.type)}`}>
  {artifact.name}
</div>

// Get background tint (for larger display sizes)
const tint = getCardTint('skill');  // 'bg-purple-500/[0.02] dark:bg-purple-500/[0.03]'
const unknown = getCardTint('unknown'); // '' (returns empty string)

// Apply tint to card
<div className={`p-4 rounded ${getCardTint(artifact.type)}`}>
  {artifact.content}
</div>

// Customize color maps
const customColors = {
  ...typeBarColors,
  customType: 'border-l-red-500',
};
const color = getTypeBarColor('customType', customColors); // 'border-l-red-500'
```

**Supported Types**:
- `skill`, `command`, `agent`, `mcp`, `hook` - Core artifact types
- `composite`, `plugin`, `workflow` - Extended types
- `context_entity`, `context_module`, `bundle`, `deployment_set` - Context types
- Unknown types default to gray (`border-l-gray-400`) or empty string (tints)

### Frontmatter Parsing

```typescript
import {
  parseFrontmatter,   // Parse YAML + content
  stripFrontmatter,   // Remove YAML block
  detectFrontmatter,  // Check if content has YAML
} from '@miethe/ui/utils';

// Parse frontmatter and content separately
const { frontmatter, content } = parseFrontmatter(fileContent);

// Remove frontmatter before displaying
const contentWithoutFrontmatter = stripFrontmatter(fileContent);

// Check if file has frontmatter
if (detectFrontmatter(fileContent)) {
  // Show frontmatter display component
}
```

### README Utilities

```typescript
import {
  extractFirstParagraph,  // Get first paragraph from markdown
  extractFolderReadme,    // Find README in folder tree
} from '@miethe/ui/utils';

// Extract first paragraph for preview
const description = extractFirstParagraph(content);

// Find README.md in a folder
const readmeEntry = extractFolderReadme(fileTree, 'docs');
```

## Types

The package exports canonical type definitions for all data structures:

```typescript
import type {
  FileNode,                // A file or directory node
  FileTreeEntry,          // A catalog file tree entry
  FileTreeResponse,       // Catalog file tree API response
  FileContentResponse,    // Catalog file content API response
  ContentViewerAdapter,   // The adapter interface
  AdapterQueryResult,     // Normalized query result shape
  AdapterHookOptions,     // Common adapter hook options
} from '@miethe/ui/content-viewer';
```

**FileNode:**

```typescript
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;              // File size in bytes
  children?: FileNode[];      // Directory contents
}
```

**FileTreeResponse (from API):**

```typescript
interface FileTreeResponse {
  entries: FileTreeEntry[];   // List of files/directories
  cached: boolean;            // Served from cache?
  cache_age_seconds?: number; // Cache age in seconds
}
```

**FileContentResponse (from API):**

```typescript
interface FileContentResponse {
  content: string;            // Decoded file content
  encoding: string;           // Encoding (usually "utf-8")
  size: number;               // File size in bytes
  sha: string;                // Git blob SHA
  truncated?: boolean;        // Content was truncated?
  original_size?: number;     // Original size before truncation
  cached: boolean;            // Served from cache?
  cache_age_seconds?: number; // Cache age in seconds
}
```

## Examples

### Modal Integration

Display a file viewer inside a modal dialog:

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileTree, ContentPane } from '@miethe/ui/content-viewer';

export function ViewerModal({ artifactId, open, onClose }: Props) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-96">
        <DialogHeader>
          <DialogTitle>View Files</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
          <div className="w-64 border-r overflow-auto">
            <FileTree
              entityId={artifactId}
              files={[]} // Loaded via adapter
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              readOnly
            />
          </div>
          <div className="flex-1">
            <ContentPane
              path={selectedPath}
              content={null} // Loaded via adapter
              isEditing={isEditing}
              editedContent={editedContent}
              onEditStart={() => setIsEditing(true)}
              onEditChange={setEditedContent}
              onSave={async (content) => {
                // Handle save
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Standalone Viewer

Use components without a modal:

```typescript
'use client';

import { useState } from 'react';
import { FileTree, ContentPane } from '@miethe/ui/content-viewer';

export function FileViewer({ artifactId }: { artifactId: string }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-4 h-screen p-4">
      <div className="col-span-1 border rounded-lg overflow-hidden">
        <FileTree
          entityId={artifactId}
          files={[]}
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
          readOnly
        />
      </div>
      <div className="col-span-2 border rounded-lg overflow-hidden">
        <ContentPane
          path={selectedPath}
          content={null}
          readOnly
        />
      </div>
    </div>
  );
}
```

### Custom Adapter Example (SkillMeat)

See SkillMeat's concrete implementation for reference:

```typescript
// In your application
import { skillmeatContentViewerAdapter, makeCatalogArtifactId } from '@/lib/content-viewer-adapter';
import { ContentViewerProvider } from '@miethe/ui/content-viewer';

const artifactId = makeCatalogArtifactId(sourceId, artifactPath);

<ContentViewerProvider adapter={skillmeatContentViewerAdapter}>
  <FileTree artifactId={artifactId} />
</ContentViewerProvider>
```

The adapter encodes a composite key (sourceId + artifactPath) into a single string for the components to consume, making it easy to bridge between different identity schemes.

## Performance Considerations

### Lazy-Loaded Editor Bundle

The CodeMirror editor (used in `SplitPreview`, `MarkdownEditor`, and `CodeEditor`) is lazy-loaded and only fetched when needed:

- **Markdown files in edit mode**: MarkdownEditor chunk downloaded
- **Non-markdown files in edit mode** (.ts, .tsx, .js, .jsx, .py, .json, .css): CodeEditor chunk downloaded
- **Read-only mode**: Editor chunk may still load for markdown files (preview uses a lighter markdown renderer)

This significantly reduces the initial bundle size for consumers. If you're only using `FileTree` and `ContentPane` for viewing, you may never download the editor.

### Optional Syntax Highlighting

Syntax highlighting via `lowlight` is completely optional:

- **ArticleViewer** `codeHighlight` prop: Defaults to `false`; dynamically imports lowlight (~15KB gzip) when enabled
- **ContentPane** `codeHighlight` prop: Defaults to `false`; gracefully degrades to plain text if lowlight is not installed

Both use **lowlight** (the same optional peer dependency) for a single, consistent highlighting engine across the package.

Install lowlight only if you want to enable code highlighting:

```bash
npm install lowlight
```

Without lowlight, code renders as plain text with no error or warning.

### Component Structure

- **`FileTree`** - ~8 KB gzipped (fully bundled, no lazy loading)
- **`ContentPane`** - ~5 KB gzipped (fully bundled)
- **`FrontmatterDisplay`** - ~2 KB gzipped (fully bundled)
- **`SplitPreview` + `MarkdownEditor`** (lazy) - ~50 KB gzipped (on demand)
- **`CodeEditor`** (lazy) - ~40 KB gzipped (on demand, only for editing non-markdown files)
- **`lowlight`** (optional) - ~15 KB gzipped (only when syntax highlighting is enabled)

## Accessibility

All components follow WCAG 2.1 AA standards:

- **FileTree**: ARIA tree pattern with roving tabindex, keyboard navigation, labels
- **ContentPane**: Region landmarks, breadcrumb navigation, semantic HTML
- **FrontmatterDisplay**: Semantic structure with strong/emphasis for keys
- **Editor**: Full keyboard support and screen reader compatibility via CodeMirror

Test keyboard navigation with your screen reader before deploying.

## TypeScript

The package is fully typed with TypeScript. All components and utilities have complete type definitions. No `@ts-ignore` should be needed.

## Releasing a New Version

> This section is for maintainers of `@miethe/ui`.

Publishing is fully automated via GitHub Actions. When a `meaty-ui-v*` tag is pushed, the CI pipeline builds, tests, and publishes to GitHub Packages automatically.

### Steps

**1. Update `CHANGELOG.md`**

Move entries from `[Unreleased]` into a new version section:

```markdown
## [0.2.0] - 2026-04-01

### Added
- ...

### Changed
- ...
```

**2. Bump the version in `package.json`**

```bash
# From skillmeat/web/packages/ui/
npm version minor   # 0.1.0 → 0.2.0
# or
npm version patch   # 0.1.0 → 0.1.1
```

Or edit `package.json` manually and commit.

**3. Commit**

```bash
git add skillmeat/web/packages/ui/package.json skillmeat/web/packages/ui/CHANGELOG.md
git commit -m "chore(meaty-ui): bump version to v0.2.0"
```

**4. Tag and push**

Tags must use the `meaty-ui-v` prefix to avoid colliding with SkillMeat's own `v*` release tags:

```bash
git tag meaty-ui-v0.2.0 -m "Release @miethe/ui v0.2.0"
git push origin main meaty-ui-v0.2.0
```

The GitHub Actions `publish` job triggers on the tag push, runs CI, then publishes to GitHub Packages. Monitor progress in the **Actions** tab of the repository.

### Required GitHub Secret

The `NPM_TOKEN` secret must be set in the repository's GitHub Actions secrets (Settings → Secrets → Actions). It must be a GitHub Personal Access Token with `write:packages` scope scoped to the `@miethe` namespace on `npm.pkg.github.com`. This is a one-time setup — no action needed per release.

---

## License

See LICENSE file in the package root.
