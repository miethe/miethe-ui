/**
 * Unit tests for SplitPreview sanitize prop — FU-01 / P6-01
 *
 * Verifies that SplitPreview passes the correct rehypePlugins to ReactMarkdown
 * based on the `sanitize` prop:
 *
 * - sanitize=false (default): rehypePlugins is empty (byte-identical to
 *   pre-sanitize-prop behavior — zero overhead, zero DOM change)
 * - sanitize=true: rehypePlugins contains exactly [rehypeSanitize]
 *
 * ReactMarkdown and rehype-sanitize are mocked to avoid ESM/jsdom issues.
 * MarkdownEditor is mocked to keep CodeMirror out of the test environment.
 */

// ---------------------------------------------------------------------------
// Module-level mocks — hoisted by Jest before any imports
// ---------------------------------------------------------------------------

// Capture rehypePlugins passed to ReactMarkdown on each render
let capturedRehypePlugins: unknown[] = [];

jest.mock('react-markdown', () => {
  const MockReactMarkdown = ({
    children,
    rehypePlugins,
  }: {
    children?: React.ReactNode;
    rehypePlugins?: unknown[];
  }) => {
    capturedRehypePlugins = rehypePlugins ?? [];
    return <div data-testid="mock-react-markdown">{children}</div>;
  };
  MockReactMarkdown.displayName = 'MockReactMarkdown';
  return MockReactMarkdown;
});

jest.mock('remark-gfm', () => () => undefined);

// rehype-sanitize mock — factory returns a stable sentinel so we can check identity.
// The factory itself is hoisted by Jest (not the surrounding variable), so we
// need the sentinel to live inside the factory or in a __mocks__ file.
// We use a module-scoped variable initialised to undefined and set it inside
// the factory via a closure on the module cache.
jest.mock('rehype-sanitize', () => {
  // Return a plain function so we can check typeof === 'function'
  return function rehypeSanitizeMock() {};
});

jest.mock('../editor/MarkdownEditor', () => ({
  MarkdownEditor: () => <div data-testid="mock-markdown-editor" />,
}));

// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

import React from 'react';
import { render } from '@testing-library/react';
import { SplitPreview } from '../editor/SplitPreview';
import rehypeSanitize from 'rehype-sanitize';

const noop = () => {};

// ============================================================================
// SplitPreview — rehypePlugins wiring
// ============================================================================

describe('SplitPreview — sanitize=false: rehypePlugins empty (default / passthrough)', () => {
  beforeEach(() => {
    capturedRehypePlugins = [];
  });

  it('omitting sanitize prop: rehypePlugins is empty', () => {
    render(<SplitPreview content="# Hello" onChange={noop} isEditing={false} />);
    expect(capturedRehypePlugins).toHaveLength(0);
  });

  it('sanitize=false explicit: rehypePlugins is empty', () => {
    render(
      <SplitPreview content="# Hello" onChange={noop} isEditing={false} sanitize={false} />
    );
    expect(capturedRehypePlugins).toHaveLength(0);
  });
});

describe('SplitPreview — sanitize=true: rehype-sanitize is injected', () => {
  beforeEach(() => {
    capturedRehypePlugins = [];
  });

  it('sanitize=true: rehypePlugins contains exactly the rehype-sanitize module', () => {
    render(
      <SplitPreview content="# Hello" onChange={noop} isEditing={false} sanitize={true} />
    );
    expect(capturedRehypePlugins).toHaveLength(1);
    // Assert identity — same reference as the mocked module export
    expect(capturedRehypePlugins[0]).toBe(rehypeSanitize);
  });

  it('flipping sanitize false→true adds rehype-sanitize to rehypePlugins', () => {
    const { rerender } = render(
      <SplitPreview content="# Hello" onChange={noop} isEditing={false} sanitize={false} />
    );
    expect(capturedRehypePlugins).toHaveLength(0);

    rerender(
      <SplitPreview content="# Hello" onChange={noop} isEditing={false} sanitize={true} />
    );
    expect(capturedRehypePlugins).toHaveLength(1);
    expect(capturedRehypePlugins[0]).toBe(rehypeSanitize);
  });

  it('flipping sanitize true→false removes rehype-sanitize from rehypePlugins', () => {
    const { rerender } = render(
      <SplitPreview content="# Hello" onChange={noop} isEditing={false} sanitize={true} />
    );
    expect(capturedRehypePlugins).toHaveLength(1);

    rerender(
      <SplitPreview content="# Hello" onChange={noop} isEditing={false} sanitize={false} />
    );
    expect(capturedRehypePlugins).toHaveLength(0);
  });
});
