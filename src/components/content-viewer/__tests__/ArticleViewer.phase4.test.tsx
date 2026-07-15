/**
 * ArticleViewer Phase 4 tests — Polish, Code Highlighting & Exports (PU4-01..PU4-06)
 *
 * Coverage targets:
 * - PU4-01: codeHighlight prop — default false (plain text); true triggers plugin wiring
 * - PU4-01: generateHeadingIds prop — default true; heading ID plugin is wired
 * - PU4-02: isLoading prop — skeleton renders with correct a11y attributes
 * - PU4-03: error prop — error message renders with correct a11y attributes
 * - PU4-03: error priority over normal render
 * - PU4-02: isLoading suppresses error and content render
 * - PU4-04: TypeScript exports — all public types accessible (verified via import below)
 * - PU4-06: bundle/tree-shaking (verified structurally — we confirm codeHighlight=false
 *           does NOT call createHighlightPlugin)
 * - A-UCV-08: heading ID slug algorithm
 *
 * Same mock conventions as PU1–PU3 tests.
 */

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

/** Captures the props passed to MockReactMarkdown on the most recent render */
let capturedMarkdownProps: {
  remarkPlugins?: unknown[];
  rehypePlugins?: unknown[];
  components?: Record<string, unknown>;
  children?: string;
} = {};

jest.mock('react-markdown', () => {
  const MockReactMarkdown = (props: {
    remarkPlugins?: unknown[];
    rehypePlugins?: unknown[];
    components?: Record<string, unknown>;
    children?: string;
  }) => {
    capturedMarkdownProps = props;
    return <div data-testid="mock-react-markdown">{props.children}</div>;
  };
  MockReactMarkdown.displayName = 'MockReactMarkdown';
  return MockReactMarkdown;
});

jest.mock('remark-gfm', () => function remarkGfmMock() {});
jest.mock('remark-directive', () => function remarkDirectiveMock() {});

jest.mock('../plugins/remarkCallouts', () => {
  const mockPlugin = function remarkCalloutsPlugin() {};
  return {
    default: mockPlugin,
    remarkCallouts: mockPlugin,
    CALLOUT_TYPES: new Set(['note', 'reference', 'warning', 'info']),
  };
});

jest.mock('../plugins', () => {
  const mockPlugin = function remarkCalloutsPlugin() {};
  return {
    remarkCallouts: mockPlugin,
    CALLOUT_TYPES: new Set(['note', 'reference', 'warning', 'info']),
    rehypeExternalLinks: function rehypeExternalLinksMock() {},
    // Real implementations — we let these be tested below
    createHighlightPlugin: jest.fn(() => function highlightPlugin() {}),
    createHeadingIdsPlugin: jest.fn(() => function headingIdsPlugin() {}),
  };
});

jest.mock('../sanitize', () => ({
  sanitizeHtml: (html: string) => html,
  _resetDOMPurifyCache: () => {},
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ArticleViewer } from '../ArticleViewer';
// Import the mocked module so we can assert on it
import * as pluginsMod from '../plugins';

// PU4-04: Verify all public types are importable — no `any` at module boundary
import type {
  ArticleViewerProps,
  ArticleViewerComponents,
  CalloutProps,
  CalloutType,
  CalloutComponents,
  ContentFormat,
  ArticleVariant,
  VariantTokenShape,
  FrontmatterDisplayMode,
  FrontmatterData,
  FrontmatterHeaderProps,
} from '../types';

// Slug utility — imported from the pure (no ESM deps) module for Jest compatibility
import { slugify } from '../plugins/slugify';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  capturedMarkdownProps = {};
});

// ---------------------------------------------------------------------------
// PU4-02: isLoading state
// ---------------------------------------------------------------------------

describe('ArticleViewer — isLoading state (PU4-02)', () => {
  it('renders skeleton with role="status" when isLoading=true', () => {
    render(<ArticleViewer content="# Hello" isLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('skeleton has aria-busy="true"', () => {
    render(<ArticleViewer content="# Hello" isLoading />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('does NOT render ReactMarkdown while loading', () => {
    render(<ArticleViewer content="# Hello" isLoading />);
    expect(screen.queryByTestId('mock-react-markdown')).not.toBeInTheDocument();
  });

  it('does NOT render error UI while isLoading=true (loading takes priority)', () => {
    render(<ArticleViewer content="" isLoading error="Something went wrong" />);
    // Loading skeleton shown, not the error
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders content normally when isLoading=false (default)', () => {
    render(<ArticleViewer content="Hello" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-react-markdown')).toBeInTheDocument();
  });

  it('skeleton contains screen-reader text for accessibility', () => {
    render(<ArticleViewer content="" isLoading />);
    // The sr-only span provides context for screen readers
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PU4-03: error state
// ---------------------------------------------------------------------------

describe('ArticleViewer — error state (PU4-03)', () => {
  it('renders role="alert" when error string is provided', () => {
    render(<ArticleViewer content="" error="Document not found" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders error message text when error is a string', () => {
    render(<ArticleViewer content="" error="Something failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
  });

  it('renders error.message when error is an Error object', () => {
    const err = new Error('Network error: 503');
    render(<ArticleViewer content="" error={err} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network error: 503');
  });

  it('does NOT render ReactMarkdown when error prop is set', () => {
    render(<ArticleViewer content="# Hello" error="Load failed" />);
    expect(screen.queryByTestId('mock-react-markdown')).not.toBeInTheDocument();
  });

  it('renders content normally when error prop is null', () => {
    render(<ArticleViewer content="Hello" error={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-react-markdown')).toBeInTheDocument();
  });

  it('renders content normally when error prop is undefined (default)', () => {
    render(<ArticleViewer content="Hello" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('error alert has aria-live="assertive"', () => {
    render(<ArticleViewer content="" error="Critical failure" />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('does not crash when error prop is an empty Error', () => {
    expect(() => render(<ArticleViewer content="" error={new Error('')} />)).not.toThrow();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PU4-01: codeHighlight prop
// ---------------------------------------------------------------------------

describe('ArticleViewer — codeHighlight prop (PU4-01)', () => {
  const createHighlightPlugin = pluginsMod.createHighlightPlugin as jest.Mock;
  const createHeadingIdsPlugin = pluginsMod.createHeadingIdsPlugin as jest.Mock;

  beforeEach(() => {
    createHighlightPlugin.mockClear();
    createHeadingIdsPlugin.mockClear();
  });

  it('does NOT call createHighlightPlugin when codeHighlight=false (default)', () => {
    render(<ArticleViewer content="# Hello" />);
    expect(createHighlightPlugin).not.toHaveBeenCalled();
  });

  it('calls createHighlightPlugin when codeHighlight=true', () => {
    render(<ArticleViewer content="# Hello" codeHighlight />);
    expect(createHighlightPlugin).toHaveBeenCalled();
  });

  it('passes rehypePlugins to ReactMarkdown when codeHighlight=true', () => {
    render(<ArticleViewer content="# Hello" codeHighlight />);
    expect(capturedMarkdownProps.rehypePlugins).toBeDefined();
    expect((capturedMarkdownProps.rehypePlugins ?? []).length).toBeGreaterThan(0);
  });

  it('does NOT pass rehypePlugins when codeHighlight=false and generateHeadingIds=false', () => {
    render(<ArticleViewer content="# Hello" codeHighlight={false} generateHeadingIds={false} />);
    // No rehypePlugins when both flags off
    expect(capturedMarkdownProps.rehypePlugins).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PU4-01 / A-UCV-08: generateHeadingIds prop
// ---------------------------------------------------------------------------

describe('ArticleViewer — generateHeadingIds prop (PU4-01 / A-UCV-08)', () => {
  const createHeadingIdsPlugin = pluginsMod.createHeadingIdsPlugin as jest.Mock;

  beforeEach(() => {
    createHeadingIdsPlugin.mockClear();
  });

  it('calls createHeadingIdsPlugin by default (generateHeadingIds defaults to true)', () => {
    render(<ArticleViewer content="# Hello" />);
    expect(createHeadingIdsPlugin).toHaveBeenCalled();
  });

  it('calls createHeadingIdsPlugin when generateHeadingIds=true', () => {
    render(<ArticleViewer content="# Hello" generateHeadingIds />);
    expect(createHeadingIdsPlugin).toHaveBeenCalled();
  });

  it('does NOT call createHeadingIdsPlugin when generateHeadingIds=false', () => {
    render(<ArticleViewer content="# Hello" generateHeadingIds={false} />);
    expect(createHeadingIdsPlugin).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// A-UCV-08: slugify algorithm correctness
// ---------------------------------------------------------------------------

describe('slugify — heading ID algorithm (A-UCV-08)', () => {
  it('lowercases the input', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('Getting Started')).toBe('getting-started');
  });

  it('removes non-word characters', () => {
    expect(slugify('What is @miethe/ui?')).toBe('what-is-mietheui');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('foo  --  bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles already-slugified string', () => {
    expect(slugify('hello-world')).toBe('hello-world');
  });

  it('handles numbers in headings', () => {
    // em dash '—' is stripped (non-word); surrounding spaces collapse to one hyphen
    expect(slugify('Phase 4 — Polish')).toBe('phase-4-polish');
  });

  it('produces correct slugs for common heading patterns', () => {
    // '&' is stripped; surrounding spaces collapse to one hyphen
    expect(slugify('Installation & Setup')).toBe('installation-setup');
    expect(slugify('API Reference')).toBe('api-reference');
    expect(slugify("What's new in v2.0")).toBe('whats-new-in-v20');
  });
});

// ---------------------------------------------------------------------------
// PU4-04: TypeScript type smoke-tests
// ---------------------------------------------------------------------------

describe('PU4-04: TypeScript exports — type accessibility', () => {
  it('ArticleViewerProps includes all Phase 4 props', () => {
    // Compile-time check: create a typed object referencing all new P4 props
    const props: Partial<ArticleViewerProps> = {
      codeHighlight: true,
      generateHeadingIds: false,
      isLoading: true,
      error: 'msg',
    };
    expect(props).toBeDefined();
  });

  it('all exported types are reference-able without runtime error', () => {
    // These references exist purely to ensure the TS compiler sees them as used
    const _types = [
      'ArticleViewerProps' as keyof { ArticleViewerProps: ArticleViewerProps },
      'ArticleViewerComponents' as keyof { ArticleViewerComponents: ArticleViewerComponents },
      'CalloutProps' as keyof { CalloutProps: CalloutProps },
      'CalloutType' as keyof { CalloutType: CalloutType },
      'CalloutComponents' as keyof { CalloutComponents: CalloutComponents },
      'ContentFormat' as keyof { ContentFormat: ContentFormat },
      'ArticleVariant' as keyof { ArticleVariant: ArticleVariant },
      'VariantTokenShape' as keyof { VariantTokenShape: VariantTokenShape },
      'FrontmatterDisplayMode' as keyof { FrontmatterDisplayMode: FrontmatterDisplayMode },
      'FrontmatterData' as keyof { FrontmatterData: FrontmatterData },
      'FrontmatterHeaderProps' as keyof { FrontmatterHeaderProps: FrontmatterHeaderProps },
    ];
    expect(_types.length).toBe(11);
  });
});

// ---------------------------------------------------------------------------
// Regression: P1–P3 behavior not broken
// ---------------------------------------------------------------------------

describe('Phase 4 — P1–P3 regression guard', () => {
  it('still renders the article-viewer wrapper', () => {
    const { container } = render(<ArticleViewer content="# Hello" />);
    expect(container.querySelector('.article-viewer')).toBeInTheDocument();
  });

  it('still passes 3 remark plugins (remark-gfm, remark-directive, remarkCallouts)', () => {
    render(<ArticleViewer content="test" />);
    expect(capturedMarkdownProps.remarkPlugins).toHaveLength(3);
  });

  it('still wires callout-note in components map', () => {
    render(<ArticleViewer content="test" />);
    expect(capturedMarkdownProps.components!['callout-note']).toBeDefined();
  });

  it('still applies variant class', () => {
    const { container } = render(<ArticleViewer content="test" variant="editorial" />);
    expect(container.querySelector('.cv-variant-editorial')).toBeInTheDocument();
  });

  it('still auto-detects HTML format', () => {
    const { container } = render(<ArticleViewer content="<p>Hi</p>" />);
    expect(screen.queryByTestId('mock-react-markdown')).not.toBeInTheDocument();
    expect(container.querySelector('p')).toBeInTheDocument();
  });
});
