'use client';

import { useEffect, useRef } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { cn } from '../primitives/utils';
import { darkTheme, lightTheme, prefersDark } from './theme';

// ============================================================================
// Types
// ============================================================================

export interface MarkdownEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MarkdownEditor - CodeMirror 6 based markdown editor
 *
 * Features:
 * - Markdown syntax highlighting
 * - Basic keymaps (undo/redo, etc.)
 * - Reactive theme support (updates instantly on OS light↔dark switch)
 * - onChange callback for content changes
 * - ReadOnly mode support
 * - React 19 StrictMode safe (destroy-guard prevents double-mount leaks)
 * - Proper cleanup on unmount (view.destroy + matchMedia listener)
 *
 * @example
 * ```tsx
 * <MarkdownEditor
 *   initialContent="# Hello World"
 *   onChange={(content) => setContent(content)}
 *   readOnly={false}
 * />
 * ```
 */
export function MarkdownEditor({
  initialContent,
  onChange,
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  // Stored so the matchMedia change-handler can dispatch a reconfigure without
  // capturing a stale closure over the Compartment created during mount.
  const themeCompartmentRef = useRef<Compartment | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // StrictMode guard: destroy any existing view before creating a new one
    // so we never leak a second editor or a second matchMedia listener.
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }

    const themeCompartment = new Compartment();
    themeCompartmentRef.current = themeCompartment;

    // Create editor state with all extensions
    const startState = EditorState.create({
      doc: initialContent,
      extensions: [
        // Language support
        markdown(),

        // History (undo/redo)
        history(),

        // Keymaps
        keymap.of([...defaultKeymap, ...historyKeymap]),

        // Update listener for onChange callback
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),

        // ReadOnly mode
        EditorView.editable.of(!readOnly),

        // Reactive theme compartment — starts with the current OS preference
        themeCompartment.of(prefersDark() ? darkTheme : lightTheme),

        // Line wrapping
        EditorView.lineWrapping,
      ],
    });

    // Create editor view
    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorRef.current = view;

    // Reactive dark-mode: reconfigure the theme compartment whenever the OS
    // preference changes while the editor is mounted.
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = () => {
      editorRef.current?.dispatch({
        effects: themeCompartment.reconfigure(prefersDark() ? darkTheme : lightTheme),
      });
    };
    mql.addEventListener('change', handleColorSchemeChange);

    // Cleanup on unmount: remove listener before destroying the view
    return () => {
      mql.removeEventListener('change', handleColorSchemeChange);
      view.destroy();
      editorRef.current = null;
      themeCompartmentRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentional mount-once

  // Update content when initialContent changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.state.doc.toString() !== initialContent) {
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: initialContent,
        },
      });
    }
  }, [initialContent]);

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full overflow-auto rounded-md border', className)}
    />
  );
}
