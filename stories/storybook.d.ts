/**
 * Minimal type shim for @storybook/react.
 *
 * @storybook/react is not yet installed as a dependency. This shim provides
 * just enough types for story files to compile cleanly under the web app's
 * tsconfig. Replace with the real package when Storybook is bootstrapped.
 */
declare module '@storybook/react' {
  import type * as React from 'react';

  export interface Parameters {
    layout?: 'centered' | 'fullscreen' | 'padded';
    docs?: {
      description?: { component?: string };
    };
    [key: string]: unknown;
  }

  export interface ArgTypes {
    [key: string]: {
      control?: string | { type: string };
      description?: string;
      action?: string;
      [key: string]: unknown;
    };
  }

  /** CSF3 Meta object */
  export interface Meta<T = unknown> {
    title?: string;
    component?: T;
    parameters?: Parameters;
    tags?: string[];
    argTypes?: ArgTypes;
    args?: T extends (...args: infer A) => unknown
      ? Partial<A[0] extends Record<string, unknown> ? A[0] : Record<string, unknown>>
      : Partial<Record<string, unknown>>;
  }

  /** A single story */
  export type StoryObj<TMeta extends Meta<unknown> = Meta<unknown>> = {
    name?: string;
    args?: TMeta extends Meta<infer T>
      ? T extends React.ComponentType<infer P>
        ? Partial<P>
        : Record<string, unknown>
      : Record<string, unknown>;
    parameters?: Parameters;
    render?: (
      args: TMeta extends Meta<infer T>
        ? T extends React.ComponentType<infer P>
          ? P
          : Record<string, unknown>
        : Record<string, unknown>
    ) => React.ReactNode;
    [key: string]: unknown;
  };
}
