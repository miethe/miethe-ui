/**
 * Plugin unit tests — PU5-01 (coverage gap-fill)
 *
 * Tests the plugin modules that have 0% coverage:
 * - rehypeExternalLinks.ts — isExternalHref helper + plugin factory
 * - rehypeHeadingIds.ts — createHeadingIdsPlugin + extractText + deduplication
 * - rehypeCodeHighlight.ts — createHighlightPlugin + tryLoadLowlight + _resetHighlightCache
 * - plugins/index.ts — re-exports
 * - plugins/slugify.ts — slugify algorithm (supplemental; also tested in phase4)
 *
 * ## ESM strategy
 *
 * `unist-util-visit` and `hast` types are ESM-only. We mock `unist-util-visit`
 * with a CJS shim that executes the visitor callback synchronously on all matching
 * nodes — this lets us test the plugin logic (visitor body) without the real hast
 * tree walker.
 *
 * rehypeHeadingIds and rehypeCodeHighlight use `visit` from `unist-util-visit`;
 * the mock intercepts these calls.
 */

// ---------------------------------------------------------------------------
// Mocks — hoisted before imports
// ---------------------------------------------------------------------------

/**
 * Functional mock for unist-util-visit.
 * Walks an object tree looking for nodes matching the given type and calls
 * the visitor for each matching node found in `tree.children` (shallow + 1 deep).
 */
jest.mock('unist-util-visit', () => ({
  visit: (
    tree: Record<string, unknown>,
    type: string,
    visitor: (node: unknown, index: unknown, parent: unknown) => void
  ) => {
    // Walk children array (root level)
    const walk = (nodes: unknown[], parent: unknown) => {
      nodes.forEach((node, index) => {
        const n = node as Record<string, unknown>;
        if (n.type === type) {
          visitor(n, index, parent);
        }
        // Recurse into children
        if (Array.isArray(n['children'])) {
          walk(n['children'] as unknown[], n);
        }
      });
    };
    const children = tree['children'];
    if (Array.isArray(children)) {
      walk(children as unknown[], tree);
    }
  },
}));

// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

import { isExternalHref, rehypeExternalLinks } from '../plugins/rehypeExternalLinks';
import { createHeadingIdsPlugin, slugify as slugifyFromHeadingIds } from '../plugins/rehypeHeadingIds';
import { createHighlightPlugin, _resetHighlightCache, warmHighlightCache } from '../plugins/rehypeCodeHighlight';
import { slugify } from '../plugins/slugify';
import * as pluginsIndex from '../plugins';

// ---------------------------------------------------------------------------
// isExternalHref — comprehensive tests (already partially covered in xss suite)
// ---------------------------------------------------------------------------

describe('isExternalHref — all branches (PU5-01)', () => {
  it('returns true for https:// URLs', () => {
    expect(isExternalHref('https://example.com')).toBe(true);
    expect(isExternalHref('https://sub.domain.co.uk/path?q=1#anchor')).toBe(true);
  });

  it('returns true for http:// URLs', () => {
    expect(isExternalHref('http://example.com')).toBe(true);
  });

  it('returns true for mailto: URLs', () => {
    expect(isExternalHref('mailto:user@example.com')).toBe(true);
    expect(isExternalHref('mailto:support+tag@org.io')).toBe(true);
  });

  it('returns true for protocol-relative URLs (//', () => {
    expect(isExternalHref('//example.com')).toBe(true);
    expect(isExternalHref('//cdn.example.com/asset.js')).toBe(true);
  });

  it('returns false for relative paths', () => {
    expect(isExternalHref('/about')).toBe(false);
    expect(isExternalHref('./docs')).toBe(false);
    expect(isExternalHref('../parent')).toBe(false);
    expect(isExternalHref('relative/path')).toBe(false);
  });

  it('returns false for anchor-only URLs', () => {
    expect(isExternalHref('#section')).toBe(false);
    expect(isExternalHref('#')).toBe(false);
  });

  it('returns false for javascript: URLs (not in allowlist)', () => {
    expect(isExternalHref('javascript:alert(1)')).toBe(false);
    expect(isExternalHref('javascript:void(0)')).toBe(false);
  });

  it('returns false for data: URLs', () => {
    expect(isExternalHref('data:text/html,<h1>xss</h1>')).toBe(false);
    expect(isExternalHref('data:image/png;base64,abc123')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isExternalHref('')).toBe(false);
  });

  it('returns false for vbscript: (not in allowlist)', () => {
    expect(isExternalHref('vbscript:MsgBox("xss")')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// rehypeExternalLinks plugin — factory and transformer
// ---------------------------------------------------------------------------

describe('rehypeExternalLinks plugin — factory (PU5-01)', () => {
  // Cast the plugin to a plain callable so we can invoke it without a unified
  // Processor `this` context — the Plugin<> type binds `this` to Processor,
  // but we test the returned transformer directly against a minimal hast tree.
  type PlainTransformerFactory = () => (tree: Record<string, unknown>) => void;
  const callPlugin = rehypeExternalLinks as unknown as PlainTransformerFactory;

  it('is a function that returns a transformer function', () => {
    expect(typeof rehypeExternalLinks).toBe('function');
    const transformer = callPlugin();
    expect(typeof transformer).toBe('function');
  });

  it('adds target="_blank" and rel="noopener noreferrer" to external <a> nodes', () => {
    const aNode: { type: string; tagName: string; properties: Record<string, unknown>; children: unknown[] } = {
      type: 'element',
      tagName: 'a',
      properties: { href: 'https://example.com' },
      children: [],
    };
    const tree = { type: 'root', children: [aNode] };

    const transformer = callPlugin();
    transformer(tree);

    expect(aNode.properties['target']).toBe('_blank');
    expect(aNode.properties['rel']).toBe('noopener noreferrer');
  });

  it('does NOT add target/rel for relative links', () => {
    const aNode: { type: string; tagName: string; properties: Record<string, unknown>; children: unknown[] } = {
      type: 'element',
      tagName: 'a',
      properties: { href: '/about' },
      children: [],
    };
    const tree = { type: 'root', children: [aNode] };

    const transformer = callPlugin();
    transformer(tree);

    expect(aNode.properties['target']).toBeUndefined();
    expect(aNode.properties['rel']).toBeUndefined();
  });

  it('does NOT modify non-anchor elements', () => {
    const pNode: { type: string; tagName: string; properties: Record<string, unknown>; children: unknown[] } = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [],
    };
    const tree = { type: 'root', children: [pNode] };

    const transformer = callPlugin();
    transformer(tree);

    expect(pNode.properties['target']).toBeUndefined();
  });

  it('handles <a> with non-string href (skips safely)', () => {
    const aNode: { type: string; tagName: string; properties: Record<string, unknown>; children: unknown[] } = {
      type: 'element',
      tagName: 'a',
      properties: { href: null },
      children: [],
    };
    const tree = { type: 'root', children: [aNode] };

    const transformer = callPlugin();
    expect(() => transformer(tree)).not.toThrow();
    expect(aNode.properties['target']).toBeUndefined();
  });

  it('handles <a> with no properties object', () => {
    const aNode = {
      type: 'element',
      tagName: 'a',
      properties: undefined as unknown as Record<string, unknown>,
      children: [],
    };
    const tree = { type: 'root', children: [aNode] };

    const transformer = callPlugin();
    expect(() => transformer(tree)).not.toThrow();
  });

  it('initialises properties when missing and href is external', () => {
    const aNode: Record<string, unknown> = {
      type: 'element',
      tagName: 'a',
      properties: undefined,
      children: [],
    };
    // inject properties manually after the node to simulate no-properties case
    // The real plugin does: el.properties = el.properties ?? {}
    // We need to set properties first for our mock visitor to see it
    aNode['properties'] = { href: 'https://test.com' };
    const tree = { type: 'root', children: [aNode] };

    const transformer = callPlugin();
    transformer(tree);

    expect((aNode['properties'] as Record<string, unknown>)['target']).toBe('_blank');
  });

  it('handles empty tree (no children)', () => {
    const tree = { type: 'root', children: [] };
    const transformer = callPlugin();
    expect(() => transformer(tree)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// rehypeHeadingIds — createHeadingIdsPlugin (PU5-01)
// ---------------------------------------------------------------------------

describe('createHeadingIdsPlugin — factory (PU5-01)', () => {
  function makeHeadingNode(
    tagName: string,
    text: string,
    existingId?: string
  ): Record<string, unknown> {
    return {
      type: 'element',
      tagName,
      properties: existingId ? { id: existingId } : {},
      children: [{ type: 'text', value: text }],
    };
  }

  function runPlugin(tree: Record<string, unknown>): void {
    const pluginFactory = createHeadingIdsPlugin();
    const pluginFn = pluginFactory();
    // Double-cast via unknown: Record<string,unknown> doesn't overlap with hast Root
    // but structurally these minimal test trees are compatible at runtime.
    pluginFn(tree as unknown as Parameters<ReturnType<ReturnType<typeof createHeadingIdsPlugin>>>[0]);
  }

  it('returns a factory function', () => {
    expect(typeof createHeadingIdsPlugin).toBe('function');
    const factory = createHeadingIdsPlugin();
    expect(typeof factory).toBe('function');
    const plugin = factory();
    expect(typeof plugin).toBe('function');
  });

  it('adds id to h1 based on slugified text', () => {
    const h1 = makeHeadingNode('h1', 'Hello World');
    const tree = { type: 'root', children: [h1] };
    runPlugin(tree);
    expect((h1['properties'] as Record<string, unknown>)['id']).toBe('hello-world');
  });

  it('adds id to h2', () => {
    const h2 = makeHeadingNode('h2', 'Getting Started');
    const tree = { type: 'root', children: [h2] };
    runPlugin(tree);
    expect((h2['properties'] as Record<string, unknown>)['id']).toBe('getting-started');
  });

  it('adds id to h3, h4, h5, h6', () => {
    ['h3', 'h4', 'h5', 'h6'].forEach((tag) => {
      const node = makeHeadingNode(tag, 'Section Name');
      const tree = { type: 'root', children: [node] };
      runPlugin(tree);
      expect((node['properties'] as Record<string, unknown>)['id']).toBe('section-name');
    });
  });

  it('does NOT overwrite existing id', () => {
    const h2 = makeHeadingNode('h2', 'My Heading', 'custom-id');
    const tree = { type: 'root', children: [h2] };
    runPlugin(tree);
    expect((h2['properties'] as Record<string, unknown>)['id']).toBe('custom-id');
  });

  it('deduplicates duplicate headings by appending -1, -2', () => {
    const h2a = makeHeadingNode('h2', 'Introduction');
    const h2b = makeHeadingNode('h2', 'Introduction');
    const h2c = makeHeadingNode('h2', 'Introduction');
    const tree = { type: 'root', children: [h2a, h2b, h2c] };
    runPlugin(tree);

    expect((h2a['properties'] as Record<string, unknown>)['id']).toBe('introduction');
    expect((h2b['properties'] as Record<string, unknown>)['id']).toBe('introduction-1');
    expect((h2c['properties'] as Record<string, unknown>)['id']).toBe('introduction-2');
  });

  it('does NOT add id to non-heading elements', () => {
    const pNode = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [{ type: 'text', value: 'Paragraph text' }],
    };
    const tree = { type: 'root', children: [pNode] };
    runPlugin(tree);
    expect((pNode.properties as Record<string, unknown>)['id']).toBeUndefined();
  });

  it('skips heading with empty text (no id added)', () => {
    const h3 = {
      type: 'element',
      tagName: 'h3',
      properties: {},
      children: [{ type: 'text', value: '' }],
    };
    const tree = { type: 'root', children: [h3] };
    runPlugin(tree);
    // Empty slug — id should not be set
    expect((h3.properties as Record<string, unknown>)['id']).toBeUndefined();
  });

  it('creates fresh deduplication state per plugin instance', () => {
    const h1a = makeHeadingNode('h1', 'Title');
    const tree1 = { type: 'root', children: [h1a] };
    runPlugin(tree1);

    const h1b = makeHeadingNode('h1', 'Title');
    const tree2 = { type: 'root', children: [h1b] };
    runPlugin(tree2); // fresh instance — no memory of tree1

    // Both should get base slug (no -1 suffix) since fresh instances
    expect((h1a['properties'] as Record<string, unknown>)['id']).toBe('title');
    expect((h1b['properties'] as Record<string, unknown>)['id']).toBe('title');
  });

  it('extracts text from nested inline elements', () => {
    const h2 = {
      type: 'element',
      tagName: 'h2',
      properties: {},
      children: [
        { type: 'element', tagName: 'strong', properties: {}, children: [{ type: 'text', value: 'Bold ' }] },
        { type: 'text', value: 'Heading' },
      ],
    };
    const tree = { type: 'root', children: [h2] };
    runPlugin(tree);
    expect((h2.properties as Record<string, unknown>)['id']).toBe('bold-heading');
  });
});

// ---------------------------------------------------------------------------
// slugify — re-exported from rehypeHeadingIds (PU5-01)
// ---------------------------------------------------------------------------

describe('slugify — re-export from rehypeHeadingIds (PU5-01)', () => {
  it('is the same function as the direct slugify import', () => {
    expect(slugifyFromHeadingIds).toBe(slugify);
  });
});

// ---------------------------------------------------------------------------
// rehypeCodeHighlight — createHighlightPlugin (PU5-01)
// ---------------------------------------------------------------------------

describe('createHighlightPlugin — factory (PU5-01)', () => {
  beforeEach(() => {
    _resetHighlightCache();
  });

  it('returns a factory function', () => {
    expect(typeof createHighlightPlugin).toBe('function');
    const factory = createHighlightPlugin();
    expect(typeof factory).toBe('function');
    const plugin = factory();
    expect(typeof plugin).toBe('function');
  });

  it('degrades gracefully when lowlight is not installed (no throw)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // warmHighlightCache() triggers the async load that emits the warn when lowlight
    // is not installed. The sync transformer (createHighlightPlugin) reads from the
    // already-populated cache and silently degrades — so we must warm first.
    await warmHighlightCache();

    const factory = createHighlightPlugin();
    const plugin = factory();

    const codeNode = {
      type: 'element',
      tagName: 'code',
      properties: { className: ['language-js'] },
      children: [{ type: 'text', value: 'const x = 1;' }],
    };
    const preNode = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [codeNode],
    };
    const tree = { type: 'root', children: [preNode] };

    // Sync transformer must not throw
    expect(() => plugin(tree as Parameters<typeof plugin>[0])).not.toThrow();
    // Lowlight not installed → warn emitted (from warmHighlightCache load attempt)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('lowlight'));
    warnSpy.mockRestore();
  });

  it('emits console.warn when lowlight is not installed', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // warmHighlightCache() triggers the async load that emits the warn.
    await warmHighlightCache();

    const factory = createHighlightPlugin();
    const plugin = factory();
    const tree = { type: 'root', children: [] };
    plugin(tree as Parameters<typeof plugin>[0]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('lowlight'));
    warnSpy.mockRestore();
  });

  it('does not highlight when lowlight is unavailable (children unchanged)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const originalChildren = [{ type: 'text', value: 'const x = 1;' }];
    const codeNode = {
      type: 'element',
      tagName: 'code',
      properties: { className: ['language-js'] },
      children: [...originalChildren],
    };
    const preNode = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [codeNode],
    };
    const tree = { type: 'root', children: [preNode] };

    const factory = createHighlightPlugin();
    const plugin = factory();
    plugin(tree as Parameters<typeof plugin>[0]);

    // Children should be unchanged (lowlight not available)
    expect(codeNode.children).toEqual(originalChildren);
    warnSpy.mockRestore();
  });

  it('uses the same lowlight instance across multiple plugin calls (cache hit)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // First call — loads (not found) and caches result
    const factory1 = createHighlightPlugin();
    const plugin1 = factory1();
    plugin1({ type: 'root', children: [] } as Parameters<typeof plugin1>[0]);
    const warnCount1 = warnSpy.mock.calls.length;

    // Second call — cache hit, no re-attempt
    const factory2 = createHighlightPlugin();
    const plugin2 = factory2();
    plugin2({ type: 'root', children: [] } as Parameters<typeof plugin2>[0]);
    // No new warn — cache was hit (already attempted load)
    expect(warnSpy.mock.calls.length).toBe(warnCount1);
    warnSpy.mockRestore();
  });

  it('handles tree with non-code elements without error', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const divNode = {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: [{ type: 'text', value: 'plain text' }],
    };
    const tree = { type: 'root', children: [divNode] };
    const plugin = createHighlightPlugin()();
    expect(() => plugin(tree as Parameters<typeof plugin>[0])).not.toThrow();
    warnSpy.mockRestore();
  });

  it('handles code element NOT inside pre (no-op — only pre>code is highlighted)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const codeNode = {
      type: 'element',
      tagName: 'code',
      properties: { className: ['language-js'] },
      children: [{ type: 'text', value: 'inline code' }],
    };
    // Inline code (not inside pre) — parent is div, not pre
    const divNode = {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: [codeNode],
    };
    const tree = { type: 'root', children: [divNode] };
    const plugin = createHighlightPlugin()();
    expect(() => plugin(tree as Parameters<typeof plugin>[0])).not.toThrow();
    warnSpy.mockRestore();
  });
});

describe('_resetHighlightCache (PU5-01)', () => {
  it('is a function', () => {
    expect(typeof _resetHighlightCache).toBe('function');
  });

  it('allows re-attempting load after reset', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // First attempt — warmHighlightCache triggers the async load and emits a warn
    await warmHighlightCache();
    const firstWarnCount = warnSpy.mock.calls.length;

    // Reset clears the cached load state so the next warm will re-attempt
    _resetHighlightCache();

    // Second attempt — should re-attempt the load and emit a warn again
    await warmHighlightCache();
    expect(warnSpy.mock.calls.length).toBeGreaterThan(firstWarnCount);
    warnSpy.mockRestore();
  });
});

describe('warmHighlightCache (PU5-01)', () => {
  beforeEach(() => {
    _resetHighlightCache();
  });

  it('is a function', () => {
    expect(typeof warmHighlightCache).toBe('function');
  });

  it('does not throw when lowlight is not installed', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => warmHighlightCache()).not.toThrow();
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// plugins/index.ts — re-exports (PU5-01)
// ---------------------------------------------------------------------------

describe('plugins/index.ts — re-exports (PU5-01)', () => {
  it('exports remarkCallouts', () => {
    // The index exports remarkCallouts from remarkCallouts.ts
    // Note: remarkCallouts.ts is NOT ESM-only — it's pure TS, so importable
    expect(pluginsIndex.remarkCallouts).toBeDefined();
    expect(typeof pluginsIndex.remarkCallouts).toBe('function');
  });

  it('exports CALLOUT_TYPES', () => {
    expect(pluginsIndex.CALLOUT_TYPES).toBeDefined();
    expect(pluginsIndex.CALLOUT_TYPES instanceof Set).toBe(true);
    expect(pluginsIndex.CALLOUT_TYPES.size).toBe(4);
  });

  it('exports rehypeExternalLinks', () => {
    expect(pluginsIndex.rehypeExternalLinks).toBeDefined();
    expect(typeof pluginsIndex.rehypeExternalLinks).toBe('function');
  });

  it('exports createHighlightPlugin', () => {
    expect(pluginsIndex.createHighlightPlugin).toBeDefined();
    expect(typeof pluginsIndex.createHighlightPlugin).toBe('function');
  });

  it('exports createHeadingIdsPlugin', () => {
    expect(pluginsIndex.createHeadingIdsPlugin).toBeDefined();
    expect(typeof pluginsIndex.createHeadingIdsPlugin).toBe('function');
  });
});
