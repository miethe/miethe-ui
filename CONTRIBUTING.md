# Contributing to @miethe/ui

## Overview

`@miethe/ui` is a tree-shakeable React component library located at `skillmeat/web/packages/ui/` within the SkillMeat monorepo.

## Development Setup

```bash
# Install dependencies (from skillmeat/web/)
pnpm install

# Build the package
cd packages/ui
pnpm build

# Type check
pnpm run type-check

# Run tests (from skillmeat/web/)
cd ../..
pnpm test -- --testPathPattern="packages/ui/src"
```

## Adding a Component

1. **Choose the right submodule**:
   - `content-viewer/` — File tree, content pane, adapter
   - `diff/` — Diff viewing
   - `editor/` — Markdown editing, split preview
   - `display/` — Frontmatter display, file preview
   - `primitives/` — UI primitives (modals, tabs, badges)
   - `utils/` — Utilities (frontmatter parsing, perf marks)

2. **Create component** at `src/<submodule>/ComponentName.tsx`

3. **Export** from `src/<submodule>/index.ts`

4. **Zero coupling policy**: No `@/` path aliases, no `/api/v1/` strings, no `useQuery`/`useMutation`, no SkillMeat-specific types

## Required Tests

For every new component:
- **Minimum 10 parity tests** (render, props, variants, callbacks, edge cases)
- **Minimum 3 a11y tests** (ARIA roles, keyboard navigation, focus management)
- File naming: `src/__tests__/<component-name>.parity.test.tsx`

## Release Process

1. Bump version in `package.json` following semver
2. Update `CHANGELOG.md`: move items from `[Unreleased]` to new version section
3. Commit, push, create PR, merge to main
4. Tag: `git tag vX.Y.Z -m "Release @miethe/ui vX.Y.Z"`
5. Push tag: `git push origin vX.Y.Z`
6. CI publish job runs automatically

## Coupling Policy

Before adding any component, verify zero SkillMeat coupling:
- [ ] No `@/` path aliases
- [ ] No `/api/v1/` strings
- [ ] No `useQuery`/`useMutation` direct usage
- [ ] No SkillMeat-specific type imports
- [ ] All dependencies are either in package.json or peer dependencies
