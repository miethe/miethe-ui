/**
 * Unit tests for the editor submodule
 *
 * Covers:
 * a) CodeEditor mounts and renders a container div without crashing
 * b) CodeEditor with a `language` prop mounts without throwing
 * c) MarkdownEditor reactive theme: dispatching a matchMedia 'change' event
 *    triggers view.dispatch (reconfigure)
 * d) MarkdownEditor cleanup removes the matchMedia listener
 *
 * CodeMirror cannot run in jsdom — EditorView, EditorState and the lang packs
 * are all mocked. We test the React integration layer (mount, listener wiring,
 * cleanup) rather than CM6 internals.
 *
 * matchMedia strategy: jest.setup.js already defines window.matchMedia with
 * `writable: true`. We simply reassign `window.matchMedia` in beforeEach to
 * point at our controllable mock object — no defineProperty needed.
 */

// ---------------------------------------------------------------------------
// CM6 mocks — hoisted before any imports
// ---------------------------------------------------------------------------

// A stable sentinel object returned by the mock lang functions so the tests
// can assert the return value is defined.
const MOCK_LANG_SUPPORT = { _isMockLangSupport: true };

// Stable dispatch spy shared across all mock EditorView instances
const mockDispatch = jest.fn();

// Stable destroy spy
const mockDestroy = jest.fn();

// Mock EditorView
jest.mock('@codemirror/view', () => {
  const actual = jest.requireActual('@codemirror/view');
  return {
    ...actual,
    EditorView: class MockEditorView {
      static updateListener = { of: jest.fn((cb: unknown) => ({ updateListener: cb })) };
      static editable = { of: jest.fn((v: unknown) => ({ editable: v })) };
      static lineWrapping = { lineWrapping: true };
      static theme = jest.fn((_spec: unknown, _opts: unknown) => ({ theme: 'mock' }));
      constructor(_config: unknown) {}
      dispatch = mockDispatch;
      destroy = mockDestroy;
      get state() {
        return { doc: { toString: () => '' } };
      }
    },
    keymap: { of: jest.fn(() => ({ keymap: true })) },
  };
});

jest.mock('@codemirror/state', () => {
  const actual = jest.requireActual('@codemirror/state');
  return {
    ...actual,
    EditorState: {
      create: jest.fn(() => ({})),
    },
    Compartment: class MockCompartment {
      of = jest.fn((ext: unknown) => ({ compartmentOf: ext }));
      reconfigure = jest.fn((ext: unknown) => ({ reconfigure: ext }));
    },
  };
});

jest.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  history: jest.fn(() => ({ history: true })),
  historyKeymap: [],
}));

jest.mock('@codemirror/lang-markdown', () => ({
  markdown: jest.fn(() => ({ markdown: true })),
}));

// Lang pack mocks — each factory returns MOCK_LANG_SUPPORT so tests can assert
// the resolved value is defined without depending on resetMocks clearing impls.
jest.mock('@codemirror/lang-javascript', () => ({
  javascript: jest.fn(() => MOCK_LANG_SUPPORT),
}));

jest.mock('@codemirror/lang-python', () => ({
  python: jest.fn(() => MOCK_LANG_SUPPORT),
}));

jest.mock('@codemirror/lang-json', () => ({
  json: jest.fn(() => MOCK_LANG_SUPPORT),
}));

jest.mock('@codemirror/lang-css', () => ({
  css: jest.fn(() => MOCK_LANG_SUPPORT),
}));

// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

import React from 'react';
import { render, act } from '@testing-library/react';
import { CodeEditor } from '../editor/CodeEditor';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { resolveCodeMirrorLanguage } from '../editor/codeLanguages';
import { javascript } from '@codemirror/lang-javascript';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const noop = () => {};

/** Listeners registered via mql.addEventListener('change', ...) */
let capturedMqlListeners: Array<() => void> = [];

/**
 * Controllable matchMedia mock factory.
 *
 * Returns a fresh mock object with live listener wiring each time it's called.
 * We re-install it in each beforeEach so resetMocks:true doesn't clear the
 * addEventListener implementation that captures listeners into capturedMqlListeners.
 */
function buildMqlMock() {
  return {
    matches: false,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn((event: string, cb: () => void) => {
      if (event === 'change') capturedMqlListeners.push(cb);
    }),
    removeEventListener: jest.fn((event: string, cb: () => void) => {
      if (event === 'change') {
        capturedMqlListeners = capturedMqlListeners.filter((l) => l !== cb);
      }
    }),
    dispatchEvent: jest.fn(),
  };
}

/** The active mql mock for the current test. Re-assigned in each beforeEach. */
let currentMqlMock = buildMqlMock();

/** Installs our controllable matchMedia mock on window. */
function installMqlMock() {
  currentMqlMock = buildMqlMock();
  // jest.setup.js defines window.matchMedia with writable:true so direct
  // assignment works without needing defineProperty.
  window.matchMedia = jest.fn().mockReturnValue(currentMqlMock);
}

/** Simulates the OS firing a prefers-color-scheme change event. */
function fireColorSchemeChange() {
  capturedMqlListeners.slice().forEach((cb) => cb());
}

// ============================================================================
// a) CodeEditor — mounts and renders a container
// ============================================================================

describe('CodeEditor — mount', () => {
  beforeEach(() => {
    installMqlMock();
    capturedMqlListeners = [];
  });

  it('renders a container div without crashing', () => {
    const { container } = render(<CodeEditor initialContent="const x = 1;" onChange={noop} />);
    // The component renders exactly one div as its root
    expect(container.firstElementChild).not.toBeNull();
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('applies the base border class to the container', () => {
    const { container } = render(<CodeEditor initialContent="" onChange={noop} />);
    expect(container.firstElementChild?.className).toContain('border');
  });

  it('applies className prop to the container', () => {
    const { container } = render(
      <CodeEditor initialContent="" onChange={noop} className="my-code-editor" />
    );
    expect(container.firstElementChild?.className).toContain('my-code-editor');
  });
});

// ============================================================================
// b) CodeEditor — language prop
// ============================================================================

describe('CodeEditor — language prop', () => {
  beforeEach(() => {
    installMqlMock();
    capturedMqlListeners = [];
  });

  it('mounts without throwing when language is provided', () => {
    const lang = javascript({ typescript: true });
    expect(() => {
      render(<CodeEditor initialContent="const x: number = 1;" onChange={noop} language={lang as never} />);
    }).not.toThrow();
  });

  it('mounts without throwing when language is undefined (plain-text mode)', () => {
    expect(() => {
      render(<CodeEditor initialContent="plain text" onChange={noop} language={undefined} />);
    }).not.toThrow();
  });
});

// ============================================================================
// c) MarkdownEditor — reactive dark-mode via matchMedia listener
// ============================================================================

describe('MarkdownEditor — reactive dark-mode', () => {
  beforeEach(() => {
    installMqlMock();
    capturedMqlListeners = [];
    mockDispatch.mockClear();
  });

  it('registers a "change" listener on matchMedia during mount', () => {
    render(<MarkdownEditor initialContent="# Hello" onChange={noop} />);
    expect(currentMqlMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('dispatches a reconfigure effect when the OS fires a color-scheme change', () => {
    render(<MarkdownEditor initialContent="# Hello" onChange={noop} />);

    mockDispatch.mockClear(); // clear any dispatch calls from mount

    act(() => {
      fireColorSchemeChange();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// d) MarkdownEditor — cleanup removes matchMedia listener
// ============================================================================

describe('MarkdownEditor — cleanup', () => {
  beforeEach(() => {
    installMqlMock();
    capturedMqlListeners = [];
    mockDispatch.mockClear();
  });

  it('removes the matchMedia "change" listener on unmount', () => {
    const { unmount } = render(<MarkdownEditor initialContent="# Hello" onChange={noop} />);

    // Should have registered at least one listener on mount
    expect(currentMqlMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(currentMqlMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('no color-scheme change dispatches reach the editor after unmount', () => {
    const { unmount } = render(<MarkdownEditor initialContent="# Hello" onChange={noop} />);

    unmount();
    mockDispatch.mockClear();

    act(() => {
      fireColorSchemeChange();
    });

    // After unmount the listener is removed; no dispatch calls should occur
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

// ============================================================================
// resolveCodeMirrorLanguage — extension mapping
// ============================================================================

describe('resolveCodeMirrorLanguage', () => {
  beforeEach(() => {
    (javascript as jest.Mock).mockReturnValue(MOCK_LANG_SUPPORT);
  });

  it('returns a LanguageSupport for .ts', () => {
    const lang = resolveCodeMirrorLanguage('src/index.ts');
    expect(lang).toBeDefined();
    expect(javascript).toHaveBeenCalledWith({ typescript: true });
  });

  it('returns a LanguageSupport for .tsx (TypeScript + JSX)', () => {
    const lang = resolveCodeMirrorLanguage('src/App.tsx');
    expect(lang).toBeDefined();
    expect(javascript).toHaveBeenCalledWith({ typescript: true, jsx: true });
  });

  it('returns a LanguageSupport for .js (plain JavaScript)', () => {
    const lang = resolveCodeMirrorLanguage('src/index.js');
    expect(lang).toBeDefined();
    expect(javascript).toHaveBeenCalledWith();
  });

  it('returns a LanguageSupport for .jsx (JavaScript + JSX)', () => {
    const lang = resolveCodeMirrorLanguage('src/App.jsx');
    expect(lang).toBeDefined();
    expect(javascript).toHaveBeenCalledWith({ jsx: true });
  });

  it('returns undefined for unknown extensions', () => {
    expect(resolveCodeMirrorLanguage('file.unknown')).toBeUndefined();
    expect(resolveCodeMirrorLanguage('Makefile')).toBeUndefined();
  });

  it('resolves extension case-insensitively (.TS → TypeScript)', () => {
    const lang = resolveCodeMirrorLanguage('src/index.TS');
    expect(lang).toBeDefined();
  });
});
