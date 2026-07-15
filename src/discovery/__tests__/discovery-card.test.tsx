/**
 * Unit tests for DiscoveryCard component.
 *
 * Covers:
 * - Renders required fields for a collection candidate
 * - Renders marketplace source name with hover tooltip
 * - Renders trust badge and score bar
 * - Checkbox stopPropagation (does not bubble to onOpenDetail)
 * - Import / Deploy button callbacks (also stopPropagation)
 * - Disabled states honored
 * - Card-level click calls onOpenDetail
 */

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoveryCard } from '../discovery-card';
import type { AgentDiscoveryCandidate } from '../discovery-card';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCandidate(overrides: Partial<AgentDiscoveryCandidate> = {}): AgentDiscoveryCandidate {
  return {
    name: 'canvas-design',
    artifact_type: 'skill',
    source: 'collection',
    trust_tier: 'trusted',
    score: 0.85,
    url: null,
    metadata: {},
    ...overrides,
  };
}

function makeProps(
  candidate: AgentDiscoveryCandidate,
  overrides: Partial<React.ComponentProps<typeof DiscoveryCard>> = {}
) {
  return {
    candidate,
    isSelected: false,
    onToggleSelect: jest.fn(),
    onOpenDetail: jest.fn(),
    onImport: jest.fn(),
    onDeploy: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Renders required fields for a collection candidate
// ---------------------------------------------------------------------------

describe('DiscoveryCard — collection candidate', () => {
  test('renders artifact name prominently', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByText('canvas-design')).toBeInTheDocument();
  });

  test('renders type label badge', () => {
    const candidate = makeCandidate({ artifact_type: 'skill' });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    // Badge with uppercase "SKILL" text
    expect(screen.getByText(/skill/i)).toBeInTheDocument();
  });

  test('renders source badge', () => {
    const candidate = makeCandidate({ source: 'collection' });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByLabelText(/source: collection/i)).toBeInTheDocument();
  });

  test('renders relevance score label', () => {
    const candidate = makeCandidate({ score: 0.85 });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByText(/relevance/i)).toBeInTheDocument();
    // Score displayed as 0.85
    expect(screen.getByText('0.85')).toBeInTheDocument();
  });

  test('renders score progressbar with correct aria-valuenow', () => {
    const candidate = makeCandidate({ score: 0.85 });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '85');
  });

  test('renders Import and Deploy buttons', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByRole('button', { name: /import canvas-design/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deploy canvas-design/i })).toBeInTheDocument();
  });

  test('renders multi-select checkbox', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByRole('checkbox', { name: /select canvas-design/i })).toBeInTheDocument();
  });

  test('role="article" with aria-label', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(
      screen.getByRole('article', { name: /discovery candidate: canvas-design/i })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Marketplace source name with hover tooltip
// ---------------------------------------------------------------------------

describe('DiscoveryCard — marketplace source', () => {
  test('renders marketplace source name when metadata.marketplace_source is present', () => {
    const candidate = makeCandidate({
      source: 'marketplace',
      metadata: { marketplace_source: 'Awesome MCP Hub' },
      url: 'https://awesome-mcp.example.com/skill/canvas',
    });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByText('Awesome MCP Hub')).toBeInTheDocument();
  });

  test('falls back to hostname from url when marketplace_source is absent', () => {
    const candidate = makeCandidate({
      source: 'marketplace',
      metadata: {},
      url: 'https://mcp.registry.dev/skill/canvas',
    });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByText('mcp.registry.dev')).toBeInTheDocument();
  });

  test('hides marketplace source row when source is not marketplace', () => {
    const candidate = makeCandidate({ source: 'collection', metadata: {} });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.queryByText(/source:/i)).not.toBeInTheDocument();
  });

  test('source link has href pointing to the url', () => {
    const candidate = makeCandidate({
      source: 'marketplace',
      metadata: { marketplace_source: 'SkillHub' },
      url: 'https://skillhub.example.com/canvas',
    });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    const link = screen.getByRole('link', { name: /marketplace source: skillhub/i });
    expect(link).toHaveAttribute('href', 'https://skillhub.example.com/canvas');
  });
});

// ---------------------------------------------------------------------------
// 3. Trust badge
// ---------------------------------------------------------------------------

describe('DiscoveryCard — trust badge', () => {
  test.each([
    ['trusted', /trust tier: trusted/i],
    ['candidate', /trust tier: candidate/i],
    ['unverified', /trust tier: unverified/i],
    ['quarantined', /trust tier: quarantined/i],
  ] as const)('%s trust tier renders badge', (tier, pattern) => {
    const candidate = makeCandidate({ trust_tier: tier });
    render(<DiscoveryCard {...makeProps(candidate)} />);
    expect(screen.getByLabelText(pattern)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. Checkbox stopPropagation — does not call onOpenDetail
// ---------------------------------------------------------------------------

describe('DiscoveryCard — checkbox interaction', () => {
  test('clicking checkbox calls onToggleSelect, not onOpenDetail', () => {
    const candidate = makeCandidate();
    const onToggleSelect = jest.fn();
    const onOpenDetail = jest.fn();
    render(
      <DiscoveryCard
        {...makeProps(candidate, { onToggleSelect, onOpenDetail })}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /select canvas-design/i });
    fireEvent.click(checkbox);

    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(onToggleSelect).toHaveBeenCalledWith(candidate);
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  test('checkbox shows selected aria-label when isSelected=true', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate, { isSelected: true })} />);
    expect(
      screen.getByRole('checkbox', { name: /deselect canvas-design/i })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5. Import / Deploy button callbacks
// ---------------------------------------------------------------------------

describe('DiscoveryCard — action buttons', () => {
  test('clicking Import calls onImport with candidate', () => {
    const candidate = makeCandidate();
    const onImport = jest.fn();
    const onOpenDetail = jest.fn();
    render(
      <DiscoveryCard {...makeProps(candidate, { onImport, onOpenDetail })} />
    );

    fireEvent.click(screen.getByRole('button', { name: /import canvas-design/i }));

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledWith(candidate);
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  test('clicking Deploy calls onDeploy with candidate', () => {
    const candidate = makeCandidate();
    const onDeploy = jest.fn();
    const onOpenDetail = jest.fn();
    render(
      <DiscoveryCard {...makeProps(candidate, { onDeploy, onOpenDetail })} />
    );

    fireEvent.click(screen.getByRole('button', { name: /deploy canvas-design/i }));

    expect(onDeploy).toHaveBeenCalledTimes(1);
    expect(onDeploy).toHaveBeenCalledWith(candidate);
    expect(onOpenDetail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 6. Disabled states
// ---------------------------------------------------------------------------

describe('DiscoveryCard — disabled states', () => {
  test('importDisabled disables Import button', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate, { importDisabled: true })} />);
    expect(screen.getByRole('button', { name: /import canvas-design/i })).toBeDisabled();
  });

  test('deployDisabled disables Deploy button', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate, { deployDisabled: true })} />);
    expect(screen.getByRole('button', { name: /deploy canvas-design/i })).toBeDisabled();
  });

  test('isImporting disables Import button', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate, { isImporting: true })} />);
    expect(screen.getByRole('button', { name: /importing canvas-design/i })).toBeDisabled();
  });

  test('isDeploying disables Deploy button', () => {
    const candidate = makeCandidate();
    render(<DiscoveryCard {...makeProps(candidate, { isDeploying: true })} />);
    expect(screen.getByRole('button', { name: /deploying canvas-design/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 7. Card-level click calls onOpenDetail (when not clicking interactive child)
// ---------------------------------------------------------------------------

describe('DiscoveryCard — card click', () => {
  test('clicking card body calls onOpenDetail', () => {
    const candidate = makeCandidate();
    const onOpenDetail = jest.fn();
    const { container } = render(
      <DiscoveryCard {...makeProps(candidate, { onOpenDetail })} />
    );

    // Click the article element directly (simulates clicking non-interactive area)
    const article = container.querySelector('[role="article"]') as HTMLElement;
    // We fire on the article itself — the handler checks target.closest()
    // Using a direct fireEvent on the article bypasses child propagation checks
    fireEvent.click(article);

    expect(onOpenDetail).toHaveBeenCalledWith(candidate);
  });
});
