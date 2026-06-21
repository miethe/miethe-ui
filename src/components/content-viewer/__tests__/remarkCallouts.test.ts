/**
 * remarkCallouts plugin unit tests
 *
 * Tests the plugin logic in isolation without going through the full
 * remark/unified pipeline. The plugin receives a raw mdast tree and
 * transforms containerDirective nodes in-place.
 */

// No ESM imports needed — remarkCallouts is a plain TypeScript module.
// Import it directly (not mocked).
import remarkCalloutsDefault, { CALLOUT_TYPES } from '../plugins/remarkCallouts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal containerDirective node factory */
function makeDirective(name: string, children: unknown[] = []): Record<string, unknown> {
  return {
    type: 'containerDirective',
    name,
    children,
    data: undefined,
  };
}

/** Wrap node in a minimal mdast root */
function makeTree(children: unknown[]): Record<string, unknown> {
  return { type: 'root', children };
}

/** Run the plugin on a tree and return it */
function runPlugin(tree: Record<string, unknown>): Record<string, unknown> {
  const transform = remarkCalloutsDefault();
  transform(tree);
  return tree;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('remarkCallouts — CALLOUT_TYPES', () => {
  it('includes note, reference, warning, info', () => {
    expect(CALLOUT_TYPES.has('note')).toBe(true);
    expect(CALLOUT_TYPES.has('reference')).toBe(true);
    expect(CALLOUT_TYPES.has('warning')).toBe(true);
    expect(CALLOUT_TYPES.has('info')).toBe(true);
  });

  it('has exactly 4 callout types', () => {
    expect(CALLOUT_TYPES.size).toBe(4);
  });
});

describe('remarkCallouts — known directive types', () => {
  const calloutTypes = ['note', 'reference', 'warning', 'info'];

  it.each(calloutTypes)('transforms :%s directive into callout-* hast element', (type) => {
    const node = makeDirective(type);
    const tree = makeTree([node]);
    runPlugin(tree);

    const data = node['data'] as Record<string, unknown>;
    expect(data).toBeDefined();
    expect(data['hName']).toBe(`callout-${type}`);
    expect((data['hProperties'] as Record<string, unknown>)['data-callout-type']).toBe(type);
  });

  it.each(calloutTypes)('is case-insensitive: uppercase %s is recognised', (type) => {
    const node = makeDirective(type.toUpperCase());
    const tree = makeTree([node]);
    runPlugin(tree);

    const data = node['data'] as Record<string, unknown>;
    expect(data?.['hName']).toBe(`callout-${type}`);
  });
});

describe('remarkCallouts — unknown directive types', () => {
  it('ignores unknown directive names', () => {
    const node = makeDirective('unknown-type');
    const tree = makeTree([node]);
    runPlugin(tree);

    // data should remain untouched (undefined or without hName)
    expect((node['data'] as Record<string, unknown> | undefined)?.['hName']).toBeUndefined();
  });

  it('ignores empty name', () => {
    const node = makeDirective('');
    const tree = makeTree([node]);
    expect(() => runPlugin(tree)).not.toThrow();
    expect((node['data'] as Record<string, unknown> | undefined)?.['hName']).toBeUndefined();
  });
});

describe('remarkCallouts — nested nodes', () => {
  it('traverses nested children and transforms directive at depth', () => {
    const innerDirective = makeDirective('note');
    const outerParagraph: Record<string, unknown> = {
      type: 'paragraph',
      children: [innerDirective],
    };
    const tree = makeTree([outerParagraph]);
    runPlugin(tree);

    const data = innerDirective['data'] as Record<string, unknown>;
    expect(data?.['hName']).toBe('callout-note');
  });
});

describe('remarkCallouts — existing data properties are preserved', () => {
  it('merges hProperties with existing data on the node', () => {
    const node = makeDirective('warning');
    node['data'] = { hProperties: { 'aria-live': 'polite' } };
    const tree = makeTree([node]);
    runPlugin(tree);

    const data = node['data'] as Record<string, unknown>;
    const hProperties = data['hProperties'] as Record<string, unknown>;
    // Original props preserved
    expect(hProperties['aria-live']).toBe('polite');
    // New prop added
    expect(hProperties['data-callout-type']).toBe('warning');
  });
});
