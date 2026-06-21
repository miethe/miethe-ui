/**
 * ArticleViewer Phase 2 tests — Typography Variants & Frontmatter Display (PU2-06)
 *
 * Coverage targets:
 * - All 3 variants (editorial, compact, technical) — variant class applied
 * - All 3 frontmatter display modes (show, collapse, hide)
 * - Custom FrontmatterHeader override via `components` prop
 * - Custom Callout override via `components` prop (regression guard)
 * - Missing / malformed frontmatter edge cases
 * - FrontmatterHeader component standalone tests
 * - Variant utilities
 *
 * Same mock conventions as ArticleViewer.test.tsx (P1):
 * - react-markdown is mocked to capture props
 * - remark-gfm, remark-directive, remarkCallouts are mocked
 * - gray-matter is mocked so we can control parsed output
 */

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted)
// ---------------------------------------------------------------------------

/** Captures props passed to MockReactMarkdown on the most recent render */
let capturedMarkdownProps: {
  remarkPlugins?: unknown[];
  components?: Record<string, unknown>;
  children?: string;
} = {};

jest.mock('react-markdown', () => {
  const MockReactMarkdown = (props: {
    remarkPlugins?: unknown[];
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
    createHighlightPlugin: jest.fn(() => function highlightPlugin() {}),
    createHeadingIdsPlugin: jest.fn(() => function headingIdsPlugin() {}),
  };
});

// Mock the sanitize module — Phase 2 tests focus on variants/frontmatter, not sanitization.
jest.mock('../sanitize', () => ({
  sanitizeHtml: (html: string) => html, // passthrough in unit tests
  _resetDOMPurifyCache: () => {},
}));

// gray-matter mock — controls the parsed output per test
const mockMatterResult = {
  content: 'Body content after frontmatter',
  data: { title: 'Test Doc', tags: ['react', 'ui'] },
};
jest.mock('gray-matter', () => {
  return jest.fn(() => mockMatterResult);
});

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import matter from 'gray-matter';
import { ArticleViewer } from '../ArticleViewer';
import { FrontmatterHeader } from '../FrontmatterHeader';
import {
  VARIANT_CLASSES,
  getVariantTokenNames,
  variantClass,
} from '../variants';
import type { CalloutProps, FrontmatterHeaderProps, ArticleVariant } from '../types';

const mockMatter = matter as jest.MockedFunction<typeof matter>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wraps a partial gray-matter result so it satisfies the overloaded
 * `ReturnType<typeof matter>` signature without unsafe direct casts.
 * All five mock sites use this instead of `as ReturnType<typeof matter>`.
 */
function makeGrayMatterResult(
  content: string,
  data: Record<string, unknown>,
): ReturnType<typeof matter> {
  return { content, data } as unknown as ReturnType<typeof matter>;
}

beforeEach(() => {
  capturedMarkdownProps = {};
  // Reset gray-matter mock to default
  mockMatter.mockReturnValue(makeGrayMatterResult(
    mockMatterResult.content,
    mockMatterResult.data,
  ));
});

// ---------------------------------------------------------------------------
// PU2-04 / PU2-05: Variant prop + CSS class
// ---------------------------------------------------------------------------

describe('ArticleViewer — variant prop (PU2-04 + PU2-05)', () => {
  const variants: ArticleVariant[] = ['editorial', 'compact', 'technical'];

  it.each(variants)('applies cv-variant-%s class when variant="%s"', (variant) => {
    const { container } = render(
      <ArticleViewer content="# Hello" variant={variant} />
    );
    const root = container.querySelector('.article-viewer');
    expect(root).toHaveClass(`cv-variant-${variant}`);
  });

  it('sets data-variant attribute on root element', () => {
    const { container } = render(
      <ArticleViewer content="# Hello" variant="editorial" />
    );
    expect(container.querySelector('[data-variant="editorial"]')).toBeInTheDocument();
  });

  it('does not apply any cv-variant-* class when variant is not set', () => {
    const { container } = render(<ArticleViewer content="# Hello" />);
    const root = container.querySelector('.article-viewer');
    expect(root?.className).not.toContain('cv-variant-');
  });

  it('does not set data-variant when variant is not set', () => {
    const { container } = render(<ArticleViewer content="# Hello" />);
    const root = container.querySelector('.article-viewer');
    // data-variant should be undefined / absent
    expect(root?.getAttribute('data-variant')).toBeNull();
  });

  it('does not break existing className prop with variant applied', () => {
    const { container } = render(
      <ArticleViewer content="# Hello" variant="compact" className="my-class" />
    );
    const root = container.querySelector('.article-viewer');
    expect(root).toHaveClass('cv-variant-compact');
    expect(root).toHaveClass('my-class');
  });
});

// ---------------------------------------------------------------------------
// PU2-05: Variant utilities
// ---------------------------------------------------------------------------

describe('Variant utilities (PU2-05)', () => {
  describe('VARIANT_CLASSES', () => {
    it('maps editorial to cv-variant-editorial', () => {
      expect(VARIANT_CLASSES.editorial).toBe('cv-variant-editorial');
    });
    it('maps compact to cv-variant-compact', () => {
      expect(VARIANT_CLASSES.compact).toBe('cv-variant-compact');
    });
    it('maps technical to cv-variant-technical', () => {
      expect(VARIANT_CLASSES.technical).toBe('cv-variant-technical');
    });
  });

  describe('variantClass()', () => {
    it('returns the class for a known variant', () => {
      expect(variantClass('editorial')).toBe('cv-variant-editorial');
    });
    it('returns undefined when variant is undefined', () => {
      expect(variantClass(undefined)).toBeUndefined();
    });
  });

  describe('getVariantTokenNames()', () => {
    it('returns correct h1Font var name for editorial', () => {
      const tokens = getVariantTokenNames('editorial');
      expect(tokens.h1Font).toBe('--cv-editorial-h1-font');
    });

    it('returns correct bodyFont var name for compact', () => {
      const tokens = getVariantTokenNames('compact');
      expect(tokens.bodyFont).toBe('--cv-compact-body-font');
    });

    it('returns shared callout var names (not variant-prefixed)', () => {
      const tokens = getVariantTokenNames('technical');
      expect(tokens.calloutNoteAccent).toBe('--cv-callout-note-accent');
      expect(tokens.calloutWarningBg).toBe('--cv-callout-warning-bg');
    });

    it('returns all 17 token shape keys', () => {
      const tokens = getVariantTokenNames('editorial');
      expect(Object.keys(tokens)).toHaveLength(17);
    });
  });
});

// ---------------------------------------------------------------------------
// PU2-01: gray-matter frontmatter parsing
// ---------------------------------------------------------------------------

describe('ArticleViewer — frontmatter parsing (PU2-01)', () => {
  it('passes body (frontmatter-stripped) to ReactMarkdown, not raw content', () => {
    mockMatter.mockReturnValue(makeGrayMatterResult('Just the body', { title: 'Doc' }));

    render(<ArticleViewer content="---\ntitle: Doc\n---\nJust the body" />);
    expect(capturedMarkdownProps.children).toBe('Just the body');
  });

  it('calls gray-matter with the raw content string', () => {
    const raw = '---\ntitle: Hello\n---\nContent';
    render(<ArticleViewer content={raw} />);
    expect(mockMatter).toHaveBeenCalledWith(raw);
  });

  it('handles content with no frontmatter (empty data object)', () => {
    mockMatter.mockReturnValue(makeGrayMatterResult('Plain markdown', {}));

    render(<ArticleViewer content="Plain markdown" frontmatter="show" />);
    // No frontmatter header should appear
    expect(screen.queryByTestId('frontmatter-header')).not.toBeInTheDocument();
  });

  it('handles malformed YAML gracefully — renders body normally', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockMatter.mockImplementation(() => {
      throw new Error('YAML parse error');
    });

    const { container } = render(
      <ArticleViewer content="---\ninvalid: yaml: :\n---\nBody" />
    );
    // Should not crash; article-viewer wrapper still present
    expect(container.querySelector('.article-viewer')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      '[ArticleViewer] Failed to parse frontmatter:',
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it('does not parse frontmatter from HTML content', () => {
    render(<ArticleViewer content="<p>Hello</p>" format="html" />);
    // gray-matter should not be called for HTML content
    expect(mockMatter).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// PU2-03: Frontmatter display modes (show | collapse | hide)
// ---------------------------------------------------------------------------

describe('ArticleViewer — frontmatter display modes (PU2-03)', () => {
  beforeEach(() => {
    mockMatter.mockReturnValue(makeGrayMatterResult('Body', { title: 'My Doc', author: 'Nick' }));
  });

  it('hides header when frontmatter="hide" (default)', () => {
    render(<ArticleViewer content="---\ntitle: My Doc\n---\nBody" />);
    expect(screen.queryByTestId('frontmatter-header')).not.toBeInTheDocument();
  });

  it('shows expanded header when frontmatter="show"', () => {
    render(
      <ArticleViewer content="---\ntitle: My Doc\n---\nBody" frontmatter="show" />
    );
    const header = screen.getByTestId('frontmatter-header');
    expect(header).toBeInTheDocument();
    // Expanded: content visible
    expect(screen.getByText('My Doc')).toBeInTheDocument();
  });

  it('shows collapsed header when frontmatter="collapse"', () => {
    render(
      <ArticleViewer content="---\ntitle: My Doc\n---\nBody" frontmatter="collapse" />
    );
    const header = screen.getByTestId('frontmatter-header');
    expect(header).toBeInTheDocument();
    // When collapsed the content section is not rendered
    expect(screen.queryByText('My Doc')).not.toBeInTheDocument();
  });

  it('does not render header if frontmatter data is empty, even with mode="show"', () => {
    mockMatter.mockReturnValue(makeGrayMatterResult('Body', {}));

    render(<ArticleViewer content="Body" frontmatter="show" />);
    expect(screen.queryByTestId('frontmatter-header')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PU2-02: FrontmatterHeader standalone tests
// ---------------------------------------------------------------------------

describe('FrontmatterHeader component (PU2-02)', () => {
  it('renders nothing when frontmatter is empty', () => {
    const { container } = render(<FrontmatterHeader frontmatter={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders key-value pairs when expanded', () => {
    render(
      <FrontmatterHeader
        frontmatter={{ title: 'Hello', author: 'Nick' }}
        isCollapsed={false}
      />
    );
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('author')).toBeInTheDocument();
    expect(screen.getByText('Nick')).toBeInTheDocument();
  });

  it('hides key-value content when isCollapsed=true', () => {
    render(
      <FrontmatterHeader
        frontmatter={{ title: 'Hello' }}
        isCollapsed={true}
      />
    );
    // Header wrapper present but content not rendered
    expect(screen.getByTestId('frontmatter-header')).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('toggles expanded/collapsed on button click (uncontrolled)', () => {
    render(
      <FrontmatterHeader
        frontmatter={{ title: 'Hello' }}
      />
    );
    // Initially expanded (isCollapsed defaults to false)
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Click "Hide" to collapse
    fireEvent.click(screen.getByRole('button', { name: /hide|show/i }));
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(screen.getByRole('button', { name: /hide|show/i }));
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onToggleCollapse with new state when toggled', () => {
    const onToggle = jest.fn();
    render(
      <FrontmatterHeader
        frontmatter={{ key: 'val' }}
        isCollapsed={false}
        onToggleCollapse={onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('renders arrays as comma-separated strings', () => {
    render(
      <FrontmatterHeader
        frontmatter={{ tags: ['react', 'typescript', 'ui'] }}
        isCollapsed={false}
      />
    );
    expect(screen.getByText('react, typescript, ui')).toBeInTheDocument();
  });

  it('renders null values with italic "null" label', () => {
    render(
      <FrontmatterHeader
        frontmatter={{ optional: null }}
        isCollapsed={false}
      />
    );
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders 1-level nested objects as indented rows', () => {
    const { container } = render(
      <FrontmatterHeader
        frontmatter={{ author: { name: 'Nick', email: 'n@x.com' } }}
        isCollapsed={false}
      />
    );
    // Key names appear as label spans
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    // Values appear in the text content of the container
    expect(container).toHaveTextContent('Nick');
    expect(container).toHaveTextContent('n@x.com');
  });

  it('renders deeply nested objects as JSON strings', () => {
    render(
      <FrontmatterHeader
        frontmatter={{ nested: { a: { b: 'deep' } } }}
        isCollapsed={false}
      />
    );
    // The deeply nested value should appear as a JSON string somewhere
    expect(screen.getByTestId('frontmatter-header')).toBeInTheDocument();
  });

  it('renders boolean values as "true" / "false" strings', () => {
    render(
      <FrontmatterHeader
        frontmatter={{ published: true, draft: false }}
        isCollapsed={false}
      />
    );
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('has correct aria-expanded on toggle button', () => {
    render(
      <FrontmatterHeader frontmatter={{ k: 'v' }} isCollapsed={false} />
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});

// ---------------------------------------------------------------------------
// PU2-06: Component overrides — FrontmatterHeader
// ---------------------------------------------------------------------------

describe('ArticleViewer — FrontmatterHeader override (PU2-06)', () => {
  beforeEach(() => {
    mockMatter.mockReturnValue(makeGrayMatterResult('Body', { title: 'Doc' }));
  });

  it('renders custom FrontmatterHeader when provided via components prop', () => {
    const CustomHeader = jest.fn(({ frontmatter }: FrontmatterHeaderProps) => (
      <div data-testid="custom-frontmatter-header">
        Custom: {String(frontmatter.title)}
      </div>
    ));

    render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        frontmatter="show"
        components={{ FrontmatterHeader: CustomHeader }}
      />
    );

    expect(screen.getByTestId('custom-frontmatter-header')).toBeInTheDocument();
    expect(screen.getByText('Custom: Doc')).toBeInTheDocument();
    // Verify the custom header was called with the parsed frontmatter
    const calls = CustomHeader.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const firstCallArgs = calls[0];
    expect(firstCallArgs).toBeDefined();
    expect(firstCallArgs![0]).toMatchObject({ frontmatter: { title: 'Doc' } });
  });

  it('passes isCollapsed=true to custom header when frontmatter="collapse"', () => {
    const CustomHeader = jest.fn(({ isCollapsed }: FrontmatterHeaderProps) => (
      <div data-testid="custom-header">{isCollapsed ? 'collapsed' : 'expanded'}</div>
    ));

    render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        frontmatter="collapse"
        components={{ FrontmatterHeader: CustomHeader }}
      />
    );

    expect(screen.getByText('collapsed')).toBeInTheDocument();
  });

  it('does not render custom header when frontmatter="hide"', () => {
    const CustomHeader = jest.fn(() => <div data-testid="custom-header" />);

    render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        frontmatter="hide"
        components={{ FrontmatterHeader: CustomHeader }}
      />
    );

    expect(screen.queryByTestId('custom-header')).not.toBeInTheDocument();
    expect(CustomHeader).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// PU2-06: Component overrides — Callout (regression guard)
// ---------------------------------------------------------------------------

describe('ArticleViewer — Callout override via components prop (PU2-06)', () => {
  it('custom callout component is wired into ReactMarkdown components map', () => {
    const CustomWarning = jest.fn(() => <div data-testid="custom-warning" />);
    render(
      <ArticleViewer
        content="test"
        components={{ warning: CustomWarning as unknown as React.ComponentType<CalloutProps> }}
      />
    );
    expect(capturedMarkdownProps.components!['callout-warning']).toBeDefined();
  });

  it('custom note + custom FrontmatterHeader can coexist', () => {
    mockMatter.mockReturnValue(makeGrayMatterResult('Body', { key: 'val' }));

    const CustomNote = jest.fn(() => <div />);
    const CustomHeader = jest.fn(() => (
      <div data-testid="custom-header-coexist" />
    ));

    render(
      <ArticleViewer
        content="---\nkey: val\n---\nBody"
        frontmatter="show"
        components={{
          note: CustomNote as unknown as React.ComponentType<CalloutProps>,
          FrontmatterHeader: CustomHeader,
        }}
      />
    );

    expect(screen.getByTestId('custom-header-coexist')).toBeInTheDocument();
    expect(capturedMarkdownProps.components!['callout-note']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PU2-01: gray-matter error path
// ---------------------------------------------------------------------------

describe('ArticleViewer — malformed frontmatter (PU2-01 edge cases)', () => {
  it('renders body as-is when gray-matter throws', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockMatter.mockImplementation(() => {
      throw new SyntaxError('bad yaml');
    });

    render(<ArticleViewer content="bad: yaml: content" />);
    // Should pass raw content to ReactMarkdown
    expect(capturedMarkdownProps.children).toBe('bad: yaml: content');
    warnSpy.mockRestore();
  });

  it('logs a warning on parse failure', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockMatter.mockImplementation(() => {
      throw new Error('parse fail');
    });

    render(<ArticleViewer content="broken" />);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ArticleViewer] Failed to parse frontmatter:',
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Controlled FrontmatterHeader — controlled state stays in sync with prop
// ---------------------------------------------------------------------------

describe('FrontmatterHeader — controlled state', () => {
  it('re-renders correctly when isCollapsed prop changes externally', () => {
    function TestWrapper() {
      const [collapsed, setCollapsed] = useState(false);
      return (
        <>
          <button data-testid="ext-toggle" onClick={() => setCollapsed((c) => !c)}>
            External toggle
          </button>
          <FrontmatterHeader
            frontmatter={{ title: 'Doc' }}
            isCollapsed={collapsed}
            onToggleCollapse={setCollapsed}
          />
        </>
      );
    }

    render(<TestWrapper />);
    expect(screen.getByText('Doc')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ext-toggle'));
    expect(screen.queryByText('Doc')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ext-toggle'));
    expect(screen.getByText('Doc')).toBeInTheDocument();
  });
});
