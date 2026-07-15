/**
 * Sanitize tests for ContentPane — FU-01 / P6-01
 *
 * Verifies the `sanitize` prop is forwarded from ContentPane → SplitPreview.
 * SplitPreview is mocked; we capture its props to assert the forwarding.
 *
 * The unit-level test for SplitPreview's rehypePlugins wiring lives in
 * content-viewer.sanitize-unit.test.tsx.
 */

// ---------------------------------------------------------------------------
// Module-level mocks — hoisted by Jest before any imports
// ---------------------------------------------------------------------------

// Capture props passed to SplitPreview on each render
let capturedSplitPreviewProps: Record<string, unknown> = {};

jest.mock('../editor/SplitPreview', () => ({
  SplitPreview: (props: Record<string, unknown>) => {
    capturedSplitPreviewProps = props;
    return <div data-testid="mock-split-preview" />;
  },
}));

jest.mock('../editor/MarkdownEditor', () => ({
  MarkdownEditor: () => <div data-testid="mock-markdown-editor" />,
}));

// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentPane } from '../content-viewer/ContentPane';

// ============================================================================
// ContentPane — sanitize prop forwarding
// ============================================================================

describe('ContentPane — sanitize prop forwarded to SplitPreview', () => {
  beforeEach(() => {
    capturedSplitPreviewProps = {};
  });

  it('sanitize=false (default): SplitPreview receives sanitize=false — byte-identical to pre-prop behavior', async () => {
    render(
      <ContentPane path="README.md" content="# Hello" readOnly={true} sanitize={false} />
    );
    await screen.findByTestId('mock-split-preview');
    expect(capturedSplitPreviewProps['sanitize']).toBe(false);
  });

  it('sanitize prop omitted: SplitPreview receives sanitize=false (backward-compat default)', async () => {
    render(<ContentPane path="README.md" content="# Hello" readOnly={true} />);
    await screen.findByTestId('mock-split-preview');
    expect(capturedSplitPreviewProps['sanitize']).toBe(false);
  });

  it('sanitize=true: SplitPreview receives sanitize=true', async () => {
    render(
      <ContentPane path="README.md" content="# Hello" readOnly={true} sanitize={true} />
    );
    await screen.findByTestId('mock-split-preview');
    expect(capturedSplitPreviewProps['sanitize']).toBe(true);
  });

  it('non-markdown file: SplitPreview not rendered (sanitize has no effect on plain text)', () => {
    render(
      <ContentPane path="src/index.ts" content="const x = 1;" readOnly={true} sanitize={true} />
    );
    // Non-markdown files use ContentDisplay, not SplitPreview
    expect(screen.queryByTestId('mock-split-preview')).not.toBeInTheDocument();
  });
});
