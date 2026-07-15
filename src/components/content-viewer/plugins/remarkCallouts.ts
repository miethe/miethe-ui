/**
 * remarkCallouts — custom remark plugin
 *
 * Transforms `:::type` container directives produced by `remark-directive`
 * into custom HAST elements that ReactMarkdown's `components` map can render.
 *
 * Directive syntax:
 * ```markdown
 * ::: note
 * Content here.
 * :::
 * ```
 *
 * The plugin visits `containerDirective` nodes whose `name` matches one of
 * the recognised callout types (note, reference, warning, info).  It rewrites
 * the node in-place so that the mdast → hast bridge produces a custom element
 * name (e.g. `callout-note`) which ReactMarkdown maps to a JSX component.
 *
 * Implementation note: remark-directive (v2) produces mdast nodes of type
 * `containerDirective`.  We traverse the tree manually to avoid importing
 * `unist-util-visit` (not in the package's direct deps) while keeping the
 * plugin zero-dependency beyond what remark-directive already provides.
 */

import type { CalloutType } from '../types';

/** Recognised callout directive names */
const CALLOUT_TYPES = new Set<string>(['note', 'reference', 'warning', 'info']);

/**
 * Minimal recursive visitor — walks the mdast tree and invokes `visitor`
 * for every node whose `type` matches `nodeType`.
 */
function visitAll(
  tree: Record<string, unknown>,
  nodeType: string,
  visitor: (node: Record<string, unknown>) => void
): void {
  if (!tree || typeof tree !== 'object') return;

  if (tree['type'] === nodeType) {
    visitor(tree);
  }

  const children = tree['children'];
  if (Array.isArray(children)) {
    for (const child of children) {
      visitAll(child as Record<string, unknown>, nodeType, visitor);
    }
  }
}

/**
 * Remark plugin: walk the tree, find container directives that match a known
 * callout type, and annotate them with hast properties so ReactMarkdown maps
 * them to the correct callout component.
 *
 * ReactMarkdown uses `node.data.hName` as the element tag name and
 * `node.data.hProperties` as the element's props.  By setting `hName` to
 * `"callout-{type}"` we can register a component for each type in the
 * `components` map without name collisions with standard HTML elements.
 */
function remarkCallouts() {
  return (tree: Record<string, unknown>): void => {
    visitAll(tree, 'containerDirective', (node) => {
      const name = (node['name'] as string | undefined)?.toLowerCase();
      if (!name || !CALLOUT_TYPES.has(name)) return;

      const calloutType = name as CalloutType;

      // Ensure data bag exists
      if (!node['data'] || typeof node['data'] !== 'object') {
        node['data'] = {};
      }
      const data = node['data'] as Record<string, unknown>;

      // Map to a custom element name that ReactMarkdown's components prop can target.
      // Using lowercase kebab-case avoids conflicts with standard HTML elements.
      data['hName'] = `callout-${calloutType}`;
      data['hProperties'] = {
        ...((data['hProperties'] as Record<string, unknown>) ?? {}),
        'data-callout-type': calloutType,
      };
    });
  };
}

export default remarkCallouts;
export { CALLOUT_TYPES };
