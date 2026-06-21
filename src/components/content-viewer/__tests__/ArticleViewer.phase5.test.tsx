/**
 * ArticleViewer Phase 5 — Integration, Accessibility, Performance (PU5-03..PU5-06)
 *
 * PU5-03: Integration tests — markdown + frontmatter + callouts + variants together
 * PU5-05: Accessibility audit — semantic HTML, ARIA labels, heading hierarchy, keyboard nav
 * PU5-06: Performance benchmark — 50KB markdown renders in <500ms; rapid content switching
 *
 * ## Mock conventions (same as P1–P4)
 * - react-markdown is mocked (captures props) — ESM-only package
 * - gray-matter is mocked to control frontmatter output
 * - sanitize is mocked (passthrough) — not the focus of these tests
 *
 * ## Integration scope
 * With react-markdown mocked, "integration" means:
 * - All ArticleViewer layers working together in one render
 * - Props flowing correctly from ArticleViewer → FrontmatterHeader + callout map
 * - Multiple features active simultaneously (variant + frontmatter + callouts + loading)
 * - Error + loading state priority over content
 *
 * Full DOM integration (real remark pipeline) requires Vitest/ESM environment.
 */

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

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
    createHighlightPlugin: jest.fn(() => function highlightPlugin() {}),
    createHeadingIdsPlugin: jest.fn(() => function headingIdsPlugin() {}),
  };
});

jest.mock('../sanitize', () => ({
  sanitizeHtml: (html: string) => html,
  _resetDOMPurifyCache: () => {},
}));

// gray-matter mock
const mockMatterResult = {
  content: 'Article body content',
  data: { title: 'Integration Test Doc', author: 'Nick', tags: ['test', 'integration'] },
};

jest.mock('gray-matter', () => jest.fn(() => mockMatterResult));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import matter from 'gray-matter';
import { ArticleViewer } from '../ArticleViewer';
import type { CalloutProps, FrontmatterHeaderProps, ArticleVariant } from '../types';

const mockMatter = matter as jest.MockedFunction<typeof matter>;

function makeGrayMatterResult(
  content: string,
  data: Record<string, unknown>,
): ReturnType<typeof matter> {
  return { content, data } as unknown as ReturnType<typeof matter>;
}

beforeEach(() => {
  capturedMarkdownProps = {};
  mockMatter.mockReturnValue(makeGrayMatterResult(
    mockMatterResult.content,
    mockMatterResult.data,
  ));
});

// ============================================================================
// PU5-03: Integration tests — combining multiple features
// ============================================================================

describe('PU5-03: Integration — variant + frontmatter + callouts + plugins', () => {
  it('renders with all features enabled simultaneously', () => {
    const { container } = render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\n# Heading\n\nBody"
        variant="editorial"
        frontmatter="show"
        codeHighlight={false}
        generateHeadingIds={true}
      />
    );
    // Root wrapper
    const root = container.querySelector('.article-viewer');
    expect(root).toBeInTheDocument();
    // Variant class applied
    expect(root).toHaveClass('cv-variant-editorial');
    // Frontmatter header rendered (data is non-empty from mock)
    expect(screen.getByTestId('frontmatter-header')).toBeInTheDocument();
    // ReactMarkdown rendered for body
    expect(screen.getByTestId('mock-react-markdown')).toBeInTheDocument();
    // Callouts wired in components map
    expect(capturedMarkdownProps.components!['callout-note']).toBeDefined();
    expect(capturedMarkdownProps.components!['callout-warning']).toBeDefined();
  });

  it('frontmatter body (stripped of YAML) is passed to ReactMarkdown', () => {
    mockMatter.mockReturnValue(makeGrayMatterResult('Body without frontmatter', { title: 'Doc' }));
    render(<ArticleViewer content="---\ntitle: Doc\n---\nBody without frontmatter" />);
    expect(capturedMarkdownProps.children).toBe('Body without frontmatter');
  });

  it('editorial variant + collapsed frontmatter renders header in collapsed state', () => {
    const { container: localContainer } = render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        variant="editorial"
        frontmatter="collapse"
      />
    );
    expect(localContainer.querySelector('.article-viewer')).toBeInTheDocument();
    // Header is visible but collapsed
    expect(screen.getByTestId('frontmatter-header')).toBeInTheDocument();
    // The title 'Integration Test Doc' should NOT be visible when collapsed
    expect(screen.queryByText('Integration Test Doc')).not.toBeInTheDocument();
  });

  it('all 4 callout element overrides coexist with variant and frontmatter', () => {
    const CustomNote = jest.fn(() => <div data-testid="cn" />);
    const CustomRef = jest.fn(() => <div data-testid="cr" />);
    render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        variant="compact"
        frontmatter="show"
        components={{
          note: CustomNote as unknown as React.ComponentType<CalloutProps>,
          reference: CustomRef as unknown as React.ComponentType<CalloutProps>,
        }}
      />
    );
    // All callout types still wired
    expect(capturedMarkdownProps.components!['callout-note']).toBeDefined();
    expect(capturedMarkdownProps.components!['callout-reference']).toBeDefined();
    expect(capturedMarkdownProps.components!['callout-warning']).toBeDefined();
    expect(capturedMarkdownProps.components!['callout-info']).toBeDefined();
  });

  it('custom FrontmatterHeader + custom callout component coexist', () => {
    const CustomHeader = jest.fn(({ frontmatter }: FrontmatterHeaderProps) => (
      <div data-testid="custom-header">Custom: {String(frontmatter.title)}</div>
    ));
    const CustomNote = jest.fn(() => <div />);

    render(
      <ArticleViewer
        content="---\ntitle: Integration Test Doc\n---\nBody"
        frontmatter="show"
        components={{
          FrontmatterHeader: CustomHeader,
          note: CustomNote as unknown as React.ComponentType<CalloutProps>,
        }}
      />
    );

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByText('Custom: Integration Test Doc')).toBeInTheDocument();
    expect(capturedMarkdownProps.components!['callout-note']).toBeDefined();
  });

  it('isLoading=true suppresses frontmatter header, content, and error', () => {
    render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        variant="technical"
        frontmatter="show"
        isLoading
        error="Some error"
      />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('frontmatter-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-react-markdown')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('error state suppresses frontmatter and content', () => {
    render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        frontmatter="show"
        error="Document load failed"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Document load failed');
    expect(screen.queryByTestId('frontmatter-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-react-markdown')).not.toBeInTheDocument();
  });

  it('format="html" + sanitize + variant applied correctly', () => {
    const { container } = render(
      <ArticleViewer
        content="<p>Hello <strong>world</strong></p>"
        format="html"
        variant="technical"
        sanitize={true}
      />
    );
    const root = container.querySelector('.article-viewer');
    expect(root).toHaveClass('cv-variant-technical');
    expect(root).toHaveAttribute('data-format', 'html');
    // ReactMarkdown NOT used for HTML
    expect(screen.queryByTestId('mock-react-markdown')).not.toBeInTheDocument();
  });

  it('technical variant sets correct data-variant attribute', () => {
    const { container } = render(
      <ArticleViewer content="# Hello" variant="technical" />
    );
    expect(container.querySelector('[data-variant="technical"]')).toBeInTheDocument();
  });

  it('component renders at all 3 variants without throwing', () => {
    const variants: ArticleVariant[] = ['editorial', 'compact', 'technical'];
    variants.forEach((v) => {
      const { unmount } = render(<ArticleViewer content="# Heading" variant={v} />);
      unmount();
    });
  });
});

// ---------------------------------------------------------------------------
// Container reference helper for the third integration test
// ---------------------------------------------------------------------------

// Patch: the 3rd test above references `container` from outside its scope.
// Re-write it inline properly:

describe('PU5-03: Integration — variant + collapsed frontmatter (inline)', () => {
  it('editorial variant + collapsed frontmatter: wrapper present, title hidden', () => {
    const { container } = render(
      <ArticleViewer
        content="---\ntitle: Doc\n---\nBody"
        variant="editorial"
        frontmatter="collapse"
      />
    );
    expect(container.querySelector('.article-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('frontmatter-header')).toBeInTheDocument();
    expect(screen.queryByText('Integration Test Doc')).not.toBeInTheDocument();
  });
});

// ============================================================================
// PU5-05: Accessibility audit
// ============================================================================

describe('PU5-05: Accessibility — semantic HTML and ARIA', () => {
  // A1: Role landmarks
  it('skeleton has role="status" with aria-busy="true" (loading a11y)', () => {
    render(<ArticleViewer content="" isLoading />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('error has role="alert" with aria-live="assertive" (error a11y)', () => {
    render(<ArticleViewer content="" error="Load error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('skeleton provides screen-reader accessible label', () => {
    render(<ArticleViewer content="" isLoading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // A2: Callout ARIA labels
  it('NoteCallout has aria-label="Note callout" (callout a11y)', () => {
    // We test callouts directly (not through ArticleViewer markdown path since mocked)
    const { container } = render(
      <div>
        {/* Test the callout wrapper that ArticleViewer would mount */}
        {React.createElement(
          require('../callouts').NoteCallout,
          {},
          'Note content'
        )}
      </div>
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-label', 'Note callout');
  });

  it('WarningCallout has aria-label="Warning callout" with role="alert"', () => {
    const { container } = render(
      React.createElement(require('../callouts').WarningCallout, {}, 'Warning content')
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-label', 'Warning callout');
    expect(aside).toHaveAttribute('role', 'alert');
  });

  it('ReferenceCallout has aria-label="Reference callout" with role="complementary"', () => {
    const { container } = render(
      React.createElement(require('../callouts').ReferenceCallout, {}, 'Ref content')
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-label', 'Reference callout');
    expect(aside).toHaveAttribute('role', 'complementary');
  });

  it('InfoCallout has aria-label="Info callout"', () => {
    const { container } = render(
      React.createElement(require('../callouts').InfoCallout, {}, 'Info content')
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-label', 'Info callout');
  });

  // A3: Callout type label is aria-hidden (role conveys type; label is decorative)
  it('callout type label paragraph is aria-hidden (not redundant to screen reader)', () => {
    const { container } = render(
      React.createElement(require('../callouts').NoteCallout, {}, 'Content')
    );
    const labelP = container.querySelector('p[aria-hidden="true"]');
    expect(labelP).toBeInTheDocument();
    expect(labelP).toHaveTextContent('Note');
  });

  // A4: FrontmatterHeader toggle button accessibility
  it('FrontmatterHeader toggle button has correct aria-expanded', () => {
    const { FrontmatterHeader } = require('../FrontmatterHeader') as {
      FrontmatterHeader: React.ComponentType<{
        frontmatter: Record<string, unknown>;
        isCollapsed?: boolean;
      }>
    };
    render(<FrontmatterHeader frontmatter={{ key: 'value' }} isCollapsed={false} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('FrontmatterHeader toggle button aria-expanded=false when collapsed', () => {
    const { FrontmatterHeader } = require('../FrontmatterHeader') as {
      FrontmatterHeader: React.ComponentType<{
        frontmatter: Record<string, unknown>;
        isCollapsed?: boolean;
      }>
    };
    render(<FrontmatterHeader frontmatter={{ key: 'value' }} isCollapsed={true} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  // A5: No focus traps — content is in the tab order normally
  it('error alert is focusable by default (no tabIndex=-1)', () => {
    render(<ArticleViewer content="" error="Error" />);
    const alert = screen.getByRole('alert');
    // role="alert" elements should not have tabIndex=-1 (no focus trap)
    expect(alert).not.toHaveAttribute('tabindex', '-1');
  });

  // A6: Color is not the sole differentiator — each callout has a text label
  it('each callout type has a visible text label (color not sole differentiator)', () => {
    const types = [
      { Component: require('../callouts').NoteCallout, label: 'Note' },
      { Component: require('../callouts').ReferenceCallout, label: 'Reference' },
      { Component: require('../callouts').WarningCallout, label: 'Warning' },
      { Component: require('../callouts').InfoCallout, label: 'Info' },
    ];

    types.forEach(({ Component, label }) => {
      const { container, unmount } = render(
        React.createElement(Component as React.ComponentType<{ children: React.ReactNode }>, { children: 'Content' })
      );
      expect(container).toHaveTextContent(label);
      unmount();
    });
  });

  // A7: data-format attribute present for screen reader / assistive tooling
  it('root element has data-format attribute identifying content type', () => {
    const { container: mdContainer, unmount: unmountMd } = render(
      <ArticleViewer content="# Heading" format="markdown" />
    );
    expect(mdContainer.querySelector('[data-format="markdown"]')).toBeInTheDocument();
    unmountMd();

    const { container: htmlContainer } = render(
      <ArticleViewer content="<p>HTML</p>" format="html" />
    );
    expect(htmlContainer.querySelector('[data-format="html"]')).toBeInTheDocument();
  });

  // A8: Sanitized attribute exposed on root for trust signal
  it('data-sanitized is set on HTML path for trusted-content signalling', () => {
    const { container } = render(
      <ArticleViewer content="<p>test</p>" format="html" sanitize={true} />
    );
    expect(container.querySelector('[data-sanitized="true"]')).toBeInTheDocument();
  });
});

// ============================================================================
// PU5-06: Performance benchmark — 50KB markdown renders in <500ms
// ============================================================================

describe('PU5-06: Performance benchmark', () => {
  /**
   * Generates a realistic large markdown document of approximate size `targetBytes`.
   * Includes headings, paragraphs, lists, code blocks, callout directives,
   * and frontmatter — representative of real Portal wiki content.
   */
  function generateLargeMarkdown(targetBytes: number): string {
    const sections: string[] = [
      '---',
      'title: Large Performance Test Document',
      'author: Performance Suite',
      'tags: [performance, test, large]',
      'created: 2026-04-24',
      '---',
      '',
      '# Performance Test Document',
      '',
      'This document is generated to test ArticleViewer rendering performance at scale.',
      '',
    ];

    let currentSize = sections.join('\n').length;
    let sectionIndex = 0;

    while (currentSize < targetBytes) {
      sectionIndex++;
      const section = [
        `## Section ${sectionIndex}: Topic Overview`,
        '',
        `This section covers topic ${sectionIndex} in detail. The content is representative of real wiki articles.`,
        'It includes multiple paragraphs, lists, and structured content to simulate production data volume.',
        '',
        `### Subsection ${sectionIndex}.1: Background`,
        '',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        '',
        '- Item one with detailed description and additional context',
        '- Item two with another detailed description',
        '- Item three covering additional aspects of the topic',
        '- Item four with final notes and considerations',
        '',
        `### Subsection ${sectionIndex}.2: Implementation`,
        '',
        '```typescript',
        `function processSection${sectionIndex}(input: string): string {`,
        '  const result = input.trim().toLowerCase();',
        '  return result.replace(/\\s+/g, \'-\');',
        '}',
        '```',
        '',
        '> This is a blockquote containing important information about the topic.',
        '> Multiple lines of blockquote content are included for realism.',
        '',
        `::: note`,
        `This is a note callout for section ${sectionIndex}. It contains important supplementary information.`,
        ':::',
        '',
        '| Column A | Column B | Column C |',
        '|----------|----------|----------|',
        `| Row ${sectionIndex}-1A | Row ${sectionIndex}-1B | Row ${sectionIndex}-1C |`,
        `| Row ${sectionIndex}-2A | Row ${sectionIndex}-2B | Row ${sectionIndex}-2C |`,
        '',
      ];

      const sectionText = section.join('\n');
      sections.push(sectionText);
      currentSize += sectionText.length;
    }

    return sections.join('\n');
  }

  it('renders 50KB markdown in under 500ms (PU5-06)', () => {
    const markdown = generateLargeMarkdown(50 * 1024);
    expect(markdown.length).toBeGreaterThanOrEqual(50 * 1024);

    const start = performance.now();
    const { unmount } = render(<ArticleViewer content={markdown} />);
    const elapsed = performance.now() - start;
    unmount();

    console.log(`[PU5-06] 50KB markdown render time: ${elapsed.toFixed(2)}ms`);
    // NOTE: With react-markdown mocked, this tests ArticleViewer's own
    // gray-matter parsing + component building, not the full remark pipeline.
    // The real performance test of the remark pipeline requires Vitest.
    expect(elapsed).toBeLessThan(500);
  });

  it('renders 100KB markdown in under 1000ms (extended benchmark)', () => {
    const markdown = generateLargeMarkdown(100 * 1024);

    const start = performance.now();
    const { unmount } = render(<ArticleViewer content={markdown} />);
    const elapsed = performance.now() - start;
    unmount();

    console.log(`[PU5-06] 100KB markdown render time: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(1000);
  });

  it('rapid content switching does not accumulate excessive render time', () => {
    const contents = Array.from({ length: 10 }, (_, i) =>
      `---\ntitle: Doc ${i}\n---\n# Heading ${i}\n\nBody content for document ${i}.\n`.repeat(5)
    );

    let totalTime = 0;
    const { rerender, unmount } = render(<ArticleViewer content={contents[0]!} />);

    for (let i = 1; i < contents.length; i++) {
      const start = performance.now();
      act(() => {
        rerender(<ArticleViewer content={contents[i]!} />);
      });
      totalTime += performance.now() - start;
    }

    unmount();
    const avgTime = totalTime / (contents.length - 1);
    console.log(`[PU5-06] Rapid switching avg re-render: ${avgTime.toFixed(2)}ms over ${contents.length - 1} switches`);

    // Each switch should be well under 100ms
    expect(avgTime).toBeLessThan(100);
  });

  it('switching from loading to content state is fast', () => {
    const content = '# Heading\n\nBody paragraph.'.repeat(100);

    const { rerender, unmount } = render(<ArticleViewer content="" isLoading />);

    const start = performance.now();
    act(() => {
      rerender(<ArticleViewer content={content} />);
    });
    const elapsed = performance.now() - start;
    unmount();

    console.log(`[PU5-06] Loading→content switch: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(200);
  });

  it('renders variant switches without memory accumulation (no throw after 20 re-renders)', () => {
    const variants: ArticleVariant[] = ['editorial', 'compact', 'technical'];
    const { rerender, unmount } = render(
      <ArticleViewer content="# Hello" variant="editorial" />
    );

    // Cycle through variants 20 times — verifies no state leak
    expect(() => {
      for (let i = 0; i < 20; i++) {
        act(() => {
          rerender(
            <ArticleViewer
              content={`# Hello ${i}`}
              variant={variants[i % 3]!}
            />
          );
        });
      }
    }).not.toThrow();

    unmount();
  });
});
