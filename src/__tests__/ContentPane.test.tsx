/**
 * ContentPane tests
 *
 * Covers:
 * (1) codeHighlight=true highlights a .ts file (assert hljs token class present)
 * (2) unknown extension .xyz with codeHighlight falls through to plain ContentDisplay
 * (3) renderBinaryPreview for photo.png renders the provided node inside the region;
 *     returning null falls through to ContentDisplay
 * (4) an editable text ext (.ts) is never routed through renderBinaryPreview
 *
 * Mock conventions mirror ArticleViewer phase4/phase5 tests.
 */

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

// lowlight is intentionally NOT installed — mock it here as the tests do in
// ArticleViewer.phase4.test.tsx.  The mock shapes the hast tree that
// highlightCodeToHast will process.
jest.mock('lowlight', () => {
  const mockHighlightResult = {
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['hljs-keyword'] },
        children: [{ type: 'text', value: 'const' }],
      },
      {
        type: 'text',
        value: ' x = 1;',
      },
    ],
  };

  return {
    // v2 shape — instance with highlight() + listLanguages()
    lowlight: {
      highlight: jest.fn((_lang: string, _code: string) => mockHighlightResult),
      highlightAuto: jest.fn((_code: string) => mockHighlightResult),
      listLanguages: jest.fn(() => ['typescript', 'javascript', 'python', 'json', 'yaml', 'ini']),
    },
  };
}, { virtual: true });

// Mock the lowlightLoader module so we can control what highlightCodeToHast returns
// without the async dynamic import hitting the (mocked) lowlight.
// ContentPane imports highlightCodeToHast from lowlightLoader (not rehypeCodeHighlight).
// We expose a `__setNextResult` helper so individual tests can shape the response.
let nextHighlightResult: import('hast').Root | null = null;

jest.mock('../components/content-viewer/plugins/lowlightLoader', () => ({
  highlightCodeToHast: jest.fn(async (_code: string, _lang: string | null) => {
    return nextHighlightResult;
  }),
  getLowlightInstance: jest.fn(() => null),
  warmHighlightCache: jest.fn(async () => {}),
  _resetHighlightCache: jest.fn(),
}));

// Mock SplitPreview to avoid pulling in CodeMirror during tests
jest.mock('../editor/SplitPreview', () => ({
  SplitPreview: ({ content }: { content: string; onChange: () => void; isEditing: boolean }) => (
    <div data-testid="mock-split-preview">{content}</div>
  ),
}));

// Mock CodeEditor + codeLanguages to avoid CodeMirror in tests
jest.mock('../editor/CodeEditor', () => ({
  CodeEditor: ({ initialContent }: { initialContent: string }) => (
    <div data-testid="mock-code-editor">{initialContent}</div>
  ),
}));

jest.mock('../editor/codeLanguages', () => ({
  resolveCodeMirrorLanguage: jest.fn((_path: string) => undefined),
}));

// Mock FrontmatterDisplay to keep tests focused on ContentPane behavior
jest.mock('../display/FrontmatterDisplay', () => ({
  FrontmatterDisplay: () => <div data-testid="mock-frontmatter-display" />,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Root as HastRoot } from 'hast';
import { ContentPane } from '../content-viewer/ContentPane';
import * as lowlightLoaderMod from '../components/content-viewer/plugins/lowlightLoader';

const highlightCodeToHast = lowlightLoaderMod.highlightCodeToHast as jest.MockedFunction<
  typeof lowlightLoaderMod.highlightCodeToHast
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal hast Root that simulates a successful lowlight highlight result */
function makeHastRoot(): HastRoot {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['hljs-keyword'] },
        children: [{ type: 'text', value: 'const' }],
      } as HastRoot['children'][0],
      {
        type: 'text',
        value: ' x = 1;',
      } as HastRoot['children'][0],
    ],
  };
}

beforeEach(() => {
  nextHighlightResult = null;
  highlightCodeToHast.mockClear();
});

// ============================================================================
// Test (1): codeHighlight highlights a .ts file
// ============================================================================

describe('ContentPane — codeHighlight=true on .ts file', () => {
  it('calls highlightCodeToHast with the correct language', async () => {
    nextHighlightResult = makeHastRoot();
    highlightCodeToHast.mockResolvedValue(nextHighlightResult);

    render(
      <ContentPane
        path="src/index.ts"
        content="const x = 1;"
        codeHighlight
      />
    );

    await waitFor(() => {
      expect(highlightCodeToHast).toHaveBeenCalledWith('const x = 1;', 'typescript');
    });
  });

  it('renders highlighted markup with hljs class when lowlight succeeds', async () => {
    nextHighlightResult = makeHastRoot();
    highlightCodeToHast.mockResolvedValue(nextHighlightResult);

    const { container } = render(
      <ContentPane
        path="src/index.ts"
        content="const x = 1;"
        codeHighlight
      />
    );

    // Wait for the async highlight effect to complete
    await waitFor(() => {
      expect(container.querySelector('code.hljs')).toBeInTheDocument();
    });

    // Token span with hljs-keyword class should be present
    expect(container.querySelector('.hljs-keyword')).toBeInTheDocument();
  });

  it('renders hljs-keyword span with correct text', async () => {
    nextHighlightResult = makeHastRoot();
    highlightCodeToHast.mockResolvedValue(nextHighlightResult);

    render(
      <ContentPane
        path="src/index.ts"
        content="const x = 1;"
        codeHighlight
      />
    );

    await waitFor(() => {
      const keywordSpan = screen.getByText('const');
      expect(keywordSpan).toBeInTheDocument();
      expect(keywordSpan.classList.contains('hljs-keyword')).toBe(true);
    });
  });
});

// ============================================================================
// Test (2): unknown extension .xyz with codeHighlight falls through to plain text
// ============================================================================

describe('ContentPane — codeHighlight=true with unknown extension .xyz', () => {
  it('does NOT call highlightCodeToHast (no matching language)', async () => {
    // extensionToLanguage('.xyz') returns null → highlightCodeToHast never called
    render(
      <ContentPane
        path="file.xyz"
        content="some unknown content"
        codeHighlight
      />
    );

    // Give the effect a chance to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // highlightCodeToHast should not be called because the language is null
    expect(highlightCodeToHast).not.toHaveBeenCalled();
  });

  it('falls through to plain ContentDisplay without throwing', async () => {
    const { container } = render(
      <ContentPane
        path="file.xyz"
        content="some unknown content"
        codeHighlight
      />
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Should render a plain <pre> (ContentDisplay), not code.hljs
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code.hljs')).not.toBeInTheDocument();
  });

  it('does not throw when lowlight returns null (graceful degrade)', async () => {
    // Even if called, null return → ContentDisplay
    highlightCodeToHast.mockResolvedValue(null);

    expect(() =>
      render(
        <ContentPane
          path="file.xyz"
          content="some unknown content"
          codeHighlight
        />
      )
    ).not.toThrow();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
  });
});

// ============================================================================
// Test (3): renderBinaryPreview for photo.png
// ============================================================================

describe('ContentPane — renderBinaryPreview', () => {
  it('renders the provided node inside the region for photo.png', () => {
    const { container } = render(
      <ContentPane
        path="photo.png"
        content={null}
        renderBinaryPreview={(ext, _content) =>
          ext === '.png' ? <img data-testid="binary-preview-img" src="data:image/png;base64," alt="" /> : null
        }
      />
    );

    expect(screen.getByTestId('binary-preview-img')).toBeInTheDocument();
    // Should be inside the region
    expect(container.querySelector('[role="region"]')).toBeInTheDocument();
  });

  it('renders the provided node for any matching extension', () => {
    render(
      <ContentPane
        path="document.pdf"
        content={null}
        renderBinaryPreview={(ext, _content) =>
          ext === '.pdf' ? <div data-testid="pdf-viewer">PDF content</div> : null
        }
      />
    );

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('falls through to ContentDisplay when renderBinaryPreview returns null', async () => {
    const { container } = render(
      <ContentPane
        path="photo.png"
        content="raw bytes"
        renderBinaryPreview={(_ext, _content) => null}
      />
    );

    // null return → falls through to ContentDisplay (plain pre)
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(screen.queryByTestId('binary-preview-img')).not.toBeInTheDocument();
  });

  it('receives correct ext (dot-prefixed, lowercase) in render-prop', () => {
    const renderBinaryPreview = jest.fn((_ext: string, _content: string | null) => null);

    render(
      <ContentPane
        path="IMAGE.PNG"
        content={null}
        renderBinaryPreview={renderBinaryPreview}
      />
    );

    expect(renderBinaryPreview).toHaveBeenCalledWith('.png', null);
  });

  it('receives content string in render-prop', () => {
    const renderBinaryPreview = jest.fn((_ext: string, content: string | null) => (
      <div data-testid="content-receiver">{content}</div>
    ));

    render(
      <ContentPane
        path="data.bin"
        content="binary-string-data"
        renderBinaryPreview={renderBinaryPreview}
      />
    );

    expect(renderBinaryPreview).toHaveBeenCalledWith('.bin', 'binary-string-data');
  });
});

// ============================================================================
// Test (4): editable text ext (.ts) is NEVER routed through renderBinaryPreview
// ============================================================================

describe('ContentPane — editable text extensions skip renderBinaryPreview', () => {
  it('.ts is NOT routed through renderBinaryPreview', () => {
    const renderBinaryPreview = jest.fn(() => <div data-testid="should-not-render" />);

    render(
      <ContentPane
        path="src/index.ts"
        content="const x = 1;"
        renderBinaryPreview={renderBinaryPreview}
      />
    );

    expect(renderBinaryPreview).not.toHaveBeenCalled();
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument();
  });

  it('.json is NOT routed through renderBinaryPreview', () => {
    const renderBinaryPreview = jest.fn(() => <div data-testid="should-not-render" />);

    render(
      <ContentPane
        path="config.json"
        content='{"key": "value"}'
        renderBinaryPreview={renderBinaryPreview}
      />
    );

    expect(renderBinaryPreview).not.toHaveBeenCalled();
  });

  it('.py is NOT routed through renderBinaryPreview', () => {
    const renderBinaryPreview = jest.fn(() => <div data-testid="should-not-render" />);

    render(
      <ContentPane
        path="script.py"
        content="print('hello')"
        renderBinaryPreview={renderBinaryPreview}
      />
    );

    expect(renderBinaryPreview).not.toHaveBeenCalled();
  });

  it('.md is NOT routed through renderBinaryPreview', async () => {
    const renderBinaryPreview = jest.fn(() => <div data-testid="should-not-render" />);

    render(
      <ContentPane
        path="README.md"
        content="# Hello"
        renderBinaryPreview={renderBinaryPreview}
      />
    );

    expect(renderBinaryPreview).not.toHaveBeenCalled();
    // Markdown files route to SplitPreview (lazy-loaded, Suspense boundary)
    // Wait for the Suspense boundary to resolve the lazy import
    const splitPreview = await screen.findByTestId('mock-split-preview');
    expect(splitPreview).toBeInTheDocument();
  });

  it('.yml is NOT routed through renderBinaryPreview', () => {
    const renderBinaryPreview = jest.fn(() => <div data-testid="should-not-render" />);

    render(
      <ContentPane
        path=".github/workflows/ci.yml"
        content="name: CI"
        renderBinaryPreview={renderBinaryPreview}
      />
    );

    expect(renderBinaryPreview).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Regression: codeHighlight=false (default) — no highlighting attempted
// ============================================================================

describe('ContentPane — codeHighlight=false default', () => {
  it('does not call highlightCodeToHast when codeHighlight is not set', async () => {
    render(
      <ContentPane
        path="src/index.ts"
        content="const x = 1;"
      />
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(highlightCodeToHast).not.toHaveBeenCalled();
  });

  it('renders plain ContentDisplay pre element by default', () => {
    const { container } = render(
      <ContentPane
        path="src/index.ts"
        content="const x = 1;"
      />
    );

    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code.hljs')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Regression: sanitize and codeHighlight are orthogonal (coexist)
// ============================================================================

describe('ContentPane — sanitize and codeHighlight coexist', () => {
  it('renders with both sanitize=true and codeHighlight=true without error', async () => {
    nextHighlightResult = makeHastRoot();
    highlightCodeToHast.mockResolvedValue(nextHighlightResult);

    expect(() =>
      render(
        <ContentPane
          path="src/index.ts"
          content="const x = 1;"
          sanitize
          codeHighlight
        />
      )
    ).not.toThrow();

    await waitFor(() => {
      expect(highlightCodeToHast).toHaveBeenCalled();
    });
  });
});
