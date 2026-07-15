/**
 * Parity tests for FilePreviewPane — WAVE-003
 *
 * Scenario 1 — Markdown rendering:
 *   When filePath ends in .md and content is provided the component renders the
 *   file header with "File Preview: <name>" and the markdown HTML is injected via
 *   dangerouslySetInnerHTML (h1/h2/h3/strong/em tags).
 *
 * Scenario 2 — Code rendering:
 *   When filePath has a recognised code extension (.ts, .tsx, .py, .json, …) the
 *   component renders a <code> block and a language badge.
 *
 * Scenario 3 — Plain text fallback:
 *   Unknown file extensions render content in a <pre> block without a language badge.
 *
 * Scenario 4 — Tier badge:
 *   The tier prop ("source" | "collection" | "project") is reflected in a visible
 *   Badge with the corresponding label text.
 *
 * Scenario 5 — Loading state:
 *   When isLoading=true the skeleton is rendered; no header or content is shown.
 *
 * Scenario 6 — Empty state:
 *   When filePath is null the component shows "No file selected".
 *
 * Scenario 7 — Error / unavailable content:
 *   When filePath is set but content is null the error state is shown
 *   ("Content unavailable").
 */

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import { FilePreviewPane } from '../../display/FilePreviewPane';

// ---------------------------------------------------------------------------
// Scenario 1 — Markdown rendering
// ---------------------------------------------------------------------------

describe('FilePreviewPane — markdown rendering (scenario 1)', () => {
  it('renders the file header with filename when a markdown file is loaded', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="README.md"
          content="# Hello world"
          tier="collection"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('renders an h1 element from a # heading in the content', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="README.md"
          content="# My Heading"
          tier="collection"
          isLoading={false}
        />
      );
    });

    // renderMarkdown converts `# My Heading` → <h1>My Heading</h1>
    const heading = screen.getByRole('heading', { level: 1, name: /My Heading/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders an h2 element from a ## heading in the content', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="guide.md"
          content="## Section Title"
          tier="source"
          isLoading={false}
        />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: /Section Title/i })).toBeInTheDocument();
  });

  it('renders bold text from **…** markdown syntax', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="notes.md"
          content="This is **important** text."
          tier="project"
          isLoading={false}
        />
      );
    });

    // renderMarkdown converts **important** → <strong>important</strong>
    const bold = document.querySelector('strong');
    expect(bold).not.toBeNull();
    expect(bold?.textContent).toBe('important');
  });

  it('renders a link element from [text](url) markdown syntax', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="links.md"
          content="See [GitHub](https://github.com) for more."
          tier="collection"
          isLoading={false}
        />
      );
    });

    const link = screen.getByRole('link', { name: /GitHub/i });
    expect(link).toHaveAttribute('href', 'https://github.com');
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 — Code rendering
// ---------------------------------------------------------------------------

describe('FilePreviewPane — code rendering (scenario 2)', () => {
  it('renders a <code> block for a TypeScript file', async () => {
    const content = 'export const x = 1;';

    await act(async () => {
      render(
        <FilePreviewPane
          filePath="src/index.ts"
          content={content}
          tier="project"
          isLoading={false}
        />
      );
    });

    const codeBlock = document.querySelector('code');
    expect(codeBlock).not.toBeNull();
    expect(codeBlock?.textContent).toBe(content);
  });

  it('renders a language badge for a recognised code extension', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="src/app.tsx"
          content="export default function App() {}"
          tier="collection"
          isLoading={false}
        />
      );
    });

    // Language badge shows the extension ("tsx")
    expect(screen.getByText('tsx')).toBeInTheDocument();
  });

  it('renders a language badge for a .py file', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="main.py"
          content="print('hello')"
          tier="source"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('py')).toBeInTheDocument();
  });

  it('renders a language badge for a .json file', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="package.json"
          content='{"name":"test"}'
          tier="project"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('json')).toBeInTheDocument();
  });

  it('renders the file header with just the filename (not full path)', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="nested/deep/utils.ts"
          content="export const util = () => {};"
          tier="collection"
          isLoading={false}
        />
      );
    });

    // Header shows the filename portion only
    expect(screen.getByText('utils.ts')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Scenario 3 — Plain text fallback
// ---------------------------------------------------------------------------

describe('FilePreviewPane — plain text fallback (scenario 3)', () => {
  it('renders content in a <pre> block for an unknown file extension', async () => {
    const content = 'plain text content here';

    await act(async () => {
      render(
        <FilePreviewPane
          filePath="data.csv"
          content={content}
          tier="source"
          isLoading={false}
        />
      );
    });

    // TextContent renders a <pre> element
    const pre = document.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain(content);
  });

  it('does not render a language badge for a plain text file', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="notes.txt"
          content="just some notes"
          tier="project"
          isLoading={false}
        />
      );
    });

    // The tier badge is present; a language badge should not be present for .txt
    // Language badge would show "txt" — verify it is absent
    // (The tier badge "Project" is rendered by getTierConfig, not as a language badge)
    const codePre = document.querySelector('pre');
    expect(codePre).not.toBeNull();
    // No badge with text "txt" should exist — only the tier badge
    const tierBadge = screen.getByText('Project');
    expect(tierBadge).toBeInTheDocument();
    // Confirm no language badge overlaying the pre block
    expect(screen.queryByText('txt')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Scenario 4 — Tier badge
// ---------------------------------------------------------------------------

describe('FilePreviewPane — tier badge (scenario 4)', () => {
  it('shows "Source" badge for tier="source"', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="README.md"
          content="# Hello"
          tier="source"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('shows "Collection" badge for tier="collection"', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="README.md"
          content="# Hello"
          tier="collection"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('Collection')).toBeInTheDocument();
  });

  it('shows "Project" badge for tier="project"', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="README.md"
          content="# Hello"
          tier="project"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('Project')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — Loading state
// ---------------------------------------------------------------------------

describe('FilePreviewPane — loading state (scenario 5)', () => {
  it('renders the loading skeleton when isLoading is true', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="README.md"
          content={null}
          tier="collection"
          isLoading={true}
        />
      );
    });

    // Header and content are not rendered while loading
    expect(screen.queryByText('README.md')).not.toBeInTheDocument();
    expect(screen.queryByText('Collection')).not.toBeInTheDocument();
    expect(screen.queryByText('No file selected')).not.toBeInTheDocument();
    expect(screen.queryByText('Content unavailable')).not.toBeInTheDocument();
  });

  it('renders content once isLoading transitions to false', async () => {
    const { rerender } = render(
      <FilePreviewPane
        filePath="README.md"
        content={null}
        tier="collection"
        isLoading={true}
      />
    );

    // Still loading — no content visible
    expect(screen.queryByText('Collection')).not.toBeInTheDocument();

    await act(async () => {
      rerender(
        <FilePreviewPane
          filePath="README.md"
          content="# Loaded"
          tier="collection"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Scenario 6 — Empty state (no file selected)
// ---------------------------------------------------------------------------

describe('FilePreviewPane — empty state (scenario 6)', () => {
  it('shows "No file selected" when filePath is null', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath={null}
          content={null}
          tier="collection"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('No file selected')).toBeInTheDocument();
  });

  it('shows instructional text when filePath is null', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath={null}
          content={null}
          tier="source"
          isLoading={false}
        />
      );
    });

    expect(
      screen.getByText(/Select a file from the file list/i)
    ).toBeInTheDocument();
  });

  it('does not render the tier badge in empty state', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath={null}
          content={null}
          tier="project"
          isLoading={false}
        />
      );
    });

    // The tier badge only appears in the file-loaded header — not in empty state
    expect(screen.queryByText('Project')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Scenario 7 — Error / unavailable content
// ---------------------------------------------------------------------------

describe('FilePreviewPane — error state (scenario 7)', () => {
  it('shows "Content unavailable" when filePath is set but content is null', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="src/broken.ts"
          content={null}
          tier="collection"
          isLoading={false}
        />
      );
    });

    expect(screen.getByText('Content unavailable')).toBeInTheDocument();
  });

  it('shows explanatory description in error state', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="src/broken.ts"
          content={null}
          tier="source"
          isLoading={false}
        />
      );
    });

    expect(
      screen.getByText(/Unable to load file content/i)
    ).toBeInTheDocument();
  });

  it('does not render the tier badge in error state', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="src/broken.ts"
          content={null}
          tier="project"
          isLoading={false}
        />
      );
    });

    // Tier badge only appears in the file-loaded header
    expect(screen.queryByText('Project')).not.toBeInTheDocument();
  });

  it('does not render code or text content in error state', async () => {
    await act(async () => {
      render(
        <FilePreviewPane
          filePath="src/broken.ts"
          content={null}
          tier="collection"
          isLoading={false}
        />
      );
    });

    expect(document.querySelector('code')).toBeNull();
    expect(document.querySelector('pre')).toBeNull();
  });
});
