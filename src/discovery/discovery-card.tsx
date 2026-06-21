'use client';

/**
 * DiscoveryCard — @miethe/ui/discovery
 *
 * Compact card for displaying a single AgentDiscoveryCandidate returned by the
 * agent discovery engine. Designed for reuse across /discover and the marketplace
 * search page.
 *
 * Props-only component: no app hooks, no React Query, no router imports.
 *
 * Accessibility: WCAG 2.1 AA. Card is keyboard-navigable (Tab/Enter), uses
 * role="article", proper aria-labels on all interactive regions.
 */

import * as React from 'react';
import { useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../primitives/utils';
import { typeBarColors, TYPE_BAR_FALLBACK } from '../utils/type-colors';
import { Badge } from '../primitives/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/Tooltip';

// ---------------------------------------------------------------------------
// AgentDiscoveryCandidate — matches types/discovery.ts shape exactly.
// Re-declared here so the package stays standalone (no web-app imports).
// ---------------------------------------------------------------------------

export type TrustTier = 'trusted' | 'candidate' | 'unverified' | 'quarantined';

export interface AgentDiscoveryCandidate {
  source: string;
  name: string;
  artifact_type: string;
  url: string | null;
  trust_tier: TrustTier;
  score: number;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DiscoveryCardProps {
  candidate: AgentDiscoveryCandidate;
  isSelected: boolean;
  onToggleSelect: (candidate: AgentDiscoveryCandidate) => void;
  onOpenDetail: (candidate: AgentDiscoveryCandidate) => void;
  onImport: (candidate: AgentDiscoveryCandidate) => void;
  onDeploy: (candidate: AgentDiscoveryCandidate) => void;
  isImporting?: boolean;
  isDeploying?: boolean;
  importDisabled?: boolean;
  deployDisabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Minimal type-icon lookup — mirrors ARTIFACT_TYPES without importing the
// full web-app type registry.
// ---------------------------------------------------------------------------

const TYPE_ICON_NAME: Record<string, string> = {
  skill: 'Sparkles',
  command: 'Terminal',
  agent: 'Bot',
  hook: 'Webhook',
  mcp: 'Plug',
  workflow: 'GitBranch',
  composite: 'Layers',
  context_module: 'BookOpen',
  template: 'FileTemplate',
  group: 'Group',
  bundle: 'Package',
  deployment_set: 'ServerCog',
  project_config: 'Settings',
  spec_file: 'FileText',
  rule_file: 'Shield',
  context_file: 'File',
  progress_template: 'ListChecks',
  context_pack: 'Archive',
};

const TYPE_LABELS: Record<string, string> = {
  skill: 'Skill',
  command: 'Command',
  agent: 'Agent',
  hook: 'Hook',
  mcp: 'MCP Server',
  workflow: 'Workflow',
  composite: 'Composite',
  context_module: 'Context Module',
  template: 'Template',
  group: 'Group',
  bundle: 'Bundle',
  deployment_set: 'Deployment Set',
  project_config: 'Project Config',
  spec_file: 'Spec File',
  rule_file: 'Rule File',
  context_file: 'Context File',
  progress_template: 'Progress Template',
  context_pack: 'Context Pack',
};

const TYPE_ICON_BORDER: Record<string, string> = {
  skill: 'border-purple-500/40',
  command: 'border-blue-500/40',
  agent: 'border-green-500/40',
  hook: 'border-pink-500/40',
  mcp: 'border-orange-500/40',
  workflow: 'border-cyan-500/40',
  composite: 'border-indigo-500/40',
  context_module: 'border-sky-400/40',
  bundle: 'border-violet-500/40',
  deployment_set: 'border-emerald-500/40',
};

const TYPE_ICON_BG: Record<string, string> = {
  skill: 'bg-purple-500/10',
  command: 'bg-blue-500/10',
  agent: 'bg-green-500/10',
  hook: 'bg-pink-500/10',
  mcp: 'bg-orange-500/10',
  workflow: 'bg-cyan-500/10',
  composite: 'bg-indigo-500/10',
  context_module: 'bg-sky-400/10',
  bundle: 'bg-violet-500/10',
  deployment_set: 'bg-emerald-500/10',
};

const TYPE_ICON_COLOR: Record<string, string> = {
  skill: 'text-purple-500',
  command: 'text-blue-500',
  agent: 'text-green-500',
  hook: 'text-pink-500',
  mcp: 'text-orange-500',
  workflow: 'text-cyan-500',
  composite: 'text-indigo-500',
  context_module: 'text-sky-400',
  bundle: 'text-violet-500',
  deployment_set: 'text-emerald-500',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  skill: '#7c3aed',
  command: '#2563eb',
  agent: '#16a34a',
  hook: '#db2777',
  mcp: '#ea580c',
  workflow: '#0891b2',
  composite: '#4338ca',
  context_module: '#0284c7',
  bundle: '#6d28d9',
  deployment_set: '#059669',
};

// ---------------------------------------------------------------------------
// Source badge configuration
// ---------------------------------------------------------------------------

type SourceKey = 'collection' | 'marketplace' | 'web';

const SOURCE_CONFIG: Record<SourceKey, { label: string; badgeColor: string }> = {
  collection: {
    label: 'Collection',
    badgeColor: '#2563eb',
  },
  marketplace: {
    label: 'Marketplace',
    badgeColor: '#7e22ce',
  },
  web: {
    label: 'Web',
    badgeColor: '#059669',
  },
};

function getSourceConfig(source: string): { label: string; badgeColor: string } {
  return (
    SOURCE_CONFIG[source as SourceKey] ?? {
      label: source,
      badgeColor: '#64748b',
    }
  );
}

// ---------------------------------------------------------------------------
// Trust tier configuration
// ---------------------------------------------------------------------------

type TrustTierKey = 'trusted' | 'candidate' | 'unverified' | 'quarantined';

const TRUST_CONFIG: Record<
  TrustTierKey,
  {
    label: string;
    iconName: string;
    badgeColor: string;
    ariaLabel: string;
  }
> = {
  trusted: {
    label: 'Trusted',
    iconName: 'ShieldCheck',
    badgeColor: '#16a34a',
    ariaLabel: 'Trust tier: Trusted',
  },
  candidate: {
    label: 'Candidate',
    iconName: 'Info',
    badgeColor: '#d97706',
    ariaLabel: 'Trust tier: Candidate',
  },
  unverified: {
    label: 'Unverified',
    iconName: 'HelpCircle',
    badgeColor: '#64748b',
    ariaLabel: 'Trust tier: Unverified',
  },
  quarantined: {
    label: 'Quarantined',
    iconName: 'AlertTriangle',
    badgeColor: '#dc2626',
    ariaLabel: 'Trust tier: Quarantined',
  },
};

function getTrustConfig(trustTier: string) {
  return (
    TRUST_CONFIG[(trustTier ?? 'unverified') as TrustTierKey] ??
    TRUST_CONFIG.unverified
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreToPercent(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

function resolveIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return (
    (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      iconName
    ] ?? LucideIcons.FileText
  );
}

function extractWebSource(
  candidate: AgentDiscoveryCandidate
): { ownerRepo: string | null; hostname: string | null; url: string } | null {
  if (candidate.source !== 'web' || !candidate.url) return null;

  try {
    const parsed = new URL(candidate.url);
    if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
      // Extract owner/repo from pathname: /owner/repo/...
      const parts = parsed.pathname.replace(/^\//, '').split('/');
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return { ownerRepo: `${parts[0]}/${parts[1]}`, hostname: null, url: candidate.url };
      }
    }
    return { ownerRepo: null, hostname: parsed.hostname, url: candidate.url };
  } catch {
    return null;
  }
}

function extractMarketplaceSource(
  candidate: AgentDiscoveryCandidate
): { name: string; url: string | null } | null {
  if (candidate.source !== 'marketplace') return null;

  const meta = candidate.metadata;

  // Preferred: explicit marketplace_source name
  const sourceName =
    typeof meta?.marketplace_source === 'string' && meta.marketplace_source.trim()
      ? meta.marketplace_source.trim()
      : null;

  // Fallback: extract hostname from candidate.url
  if (!sourceName && candidate.url) {
    try {
      const hostname = new URL(candidate.url).hostname;
      return { name: hostname, url: candidate.url };
    } catch {
      // malformed url — hide gracefully
      return null;
    }
  }

  if (!sourceName) return null;

  return { name: sourceName, url: candidate.url };
}

function extractDescription(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const desc = metadata['description'];
  if (typeof desc === 'string' && desc.trim()) return desc.trim();
  return null;
}

// ---------------------------------------------------------------------------
// DiscoveryCard
// ---------------------------------------------------------------------------

export function DiscoveryCard({
  candidate,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onImport,
  onDeploy,
  isImporting = false,
  isDeploying = false,
  importDisabled = false,
  deployDisabled = false,
  className,
}: DiscoveryCardProps) {
  const typeIconName = TYPE_ICON_NAME[candidate.artifact_type] ?? 'FileText';
  const typeLabel = TYPE_LABELS[candidate.artifact_type] ?? candidate.artifact_type;
  const typeBadgeColor = TYPE_BADGE_COLORS[candidate.artifact_type] ?? '#64748b';
  const typeIconBorder = TYPE_ICON_BORDER[candidate.artifact_type] ?? 'border-gray-400/40';
  const typeIconBg = TYPE_ICON_BG[candidate.artifact_type] ?? 'bg-gray-400/10';
  const typeIconColor = TYPE_ICON_COLOR[candidate.artifact_type] ?? 'text-gray-400';

  const TypeIcon = resolveIcon(typeIconName);

  const trust = getTrustConfig(candidate.trust_tier ?? 'unverified');
  const TrustIcon = resolveIcon(trust.iconName);

  const sourceConfig = getSourceConfig(candidate.source);
  const scorePercent = scoreToPercent(candidate.score);
  const description = extractDescription(candidate.metadata);
  const marketplaceSource = extractMarketplaceSource(candidate);
  const webSource = extractWebSource(candidate);

  // Card-level click opens detail — action buttons must stopPropagation
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, [role="menuitem"]')) return;
      onOpenDetail(candidate);
    },
    [candidate, onOpenDetail]
  );

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input')) return;
        e.preventDefault();
        onOpenDetail(candidate);
      }
    },
    [candidate, onOpenDetail]
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onToggleSelect(candidate);
    },
    [candidate, onToggleSelect]
  );

  const handleImport = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onImport(candidate);
    },
    [candidate, onImport]
  );

  const handleDeploy = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onDeploy(candidate);
    },
    [candidate, onDeploy]
  );

  return (
    <div
      role="article"
      aria-label={`Discovery candidate: ${candidate.name}`}
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        // Base card styles
        'relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm',
        'transition-all duration-150 cursor-pointer outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'hover:shadow-md hover:border-border/80',
        // Equal-height: fill grid row + enforce minimum so rows are uniform
        'h-full min-h-[160px]',
        // Left accent bar — type color on left edge only; other sides use default border token
        'border-l-4',
        typeBarColors[candidate.artifact_type] ?? TYPE_BAR_FALLBACK,
        // Selected state
        isSelected && 'ring-2 ring-ring ring-offset-1 bg-primary/5',
        className
      )}
    >
      {/* ----------------------------------------------------------------
          Header zone: type icon | name | badges row
      ---------------------------------------------------------------- */}
      <div className="px-3 pt-4 pb-1.5" data-zone="header">
        {/* Row 1: type icon + name */}
        <div className="flex items-start gap-2 min-w-0">
          {/* Type icon box */}
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center justify-center',
                    'h-5 w-5 rounded border cursor-default mt-0.5',
                    typeIconBorder,
                    typeIconBg
                  )}
                >
                  <TypeIcon className={cn('h-3 w-3', typeIconColor)} aria-hidden="true" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{typeLabel}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Artifact name */}
          <span className="flex-1 text-sm font-semibold leading-tight line-clamp-2 min-w-0">
            {candidate.name}
          </span>
        </div>

        {/* Row 2: type badge + source badge + trust badge */}
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          <Badge
            colorStyle={typeBadgeColor}
            className="text-[10px] px-1.5 py-0 h-4 font-medium uppercase tracking-wide shrink-0"
            aria-label={`Type: ${typeLabel}`}
          >
            {typeLabel}
          </Badge>

          <Badge
            variant="outline"
            colorStyle={sourceConfig.badgeColor}
            className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0"
            style={{ borderColor: sourceConfig.badgeColor, color: sourceConfig.badgeColor, background: 'transparent' }}
            aria-label={`Source: ${sourceConfig.label}`}
          >
            {sourceConfig.label}
          </Badge>

          {/* Trust badge */}
          <Badge
            variant="outline"
            colorStyle={trust.badgeColor}
            className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0 inline-flex items-center gap-0.5"
            style={{ borderColor: trust.badgeColor, color: trust.badgeColor, background: 'transparent' }}
            aria-label={trust.ariaLabel}
          >
            <TrustIcon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            <span>{trust.label}</span>
          </Badge>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Content zone: optional description + marketplace source + score bar
      ---------------------------------------------------------------- */}
      <div className="px-3 pb-1.5 flex-1 flex flex-col gap-1.5 min-h-0" data-zone="content">
        {/* Description — only when present */}
        {description && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
            {description}
          </p>
        )}

        {/* Marketplace source — name with URL on hover */}
        {marketplaceSource && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground shrink-0">Source:</span>
            {marketplaceSource.url ? (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <a
                      href={marketplaceSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'text-[10px] text-muted-foreground hover:text-foreground transition-colors',
                        'inline-flex items-center gap-0.5 truncate max-w-[120px]',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm'
                      )}
                      aria-label={`Marketplace source: ${marketplaceSource.name}`}
                    >
                      <span className="truncate">{marketplaceSource.name}</span>
                      <LucideIcons.ExternalLink className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[240px] break-all">{marketplaceSource.url}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {marketplaceSource.name}
              </span>
            )}
          </div>
        )}

        {/* Web source — GitHub owner/repo or hostname */}
        {webSource && (
          <div className="flex items-center gap-1">
            {webSource.ownerRepo ? (
              <a
                href={webSource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'text-[10px] text-muted-foreground hover:text-foreground transition-colors',
                  'inline-flex items-center gap-0.5 truncate max-w-[160px]',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm'
                )}
                aria-label={`GitHub repository: ${webSource.ownerRepo}`}
              >
                <LucideIcons.Github className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{webSource.ownerRepo}</span>
                <LucideIcons.ExternalLink className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              </a>
            ) : (
              <a
                href={webSource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'text-[10px] text-muted-foreground hover:text-foreground transition-colors',
                  'inline-flex items-center gap-0.5 truncate max-w-[160px]',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm'
                )}
                aria-label={`Web source: ${webSource.hostname}`}
              >
                <span className="truncate">{webSource.hostname}</span>
                <LucideIcons.ExternalLink className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {/* Relevance score bar — always visible */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              Relevance
            </span>
            <span className="text-[10px] font-mono text-foreground tabular-nums">
              {(Math.max(0, Math.min(1, candidate.score))).toFixed(2)}
            </span>
          </div>
          {/* Progress bar — inline implementation (no shadcn Progress in @miethe/ui) */}
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={scorePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Relevance: ${scorePercent}%`}
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Action zone: checkbox | Import | Deploy
      ---------------------------------------------------------------- */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-t border-border/40"
        data-zone="actions"
      >
        {/* Multi-select checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          aria-label={isSelected ? `Deselect ${candidate.name}` : `Select ${candidate.name}`}
          className="h-3.5 w-3.5 shrink-0 rounded border-border accent-primary cursor-pointer"
        />

        <div className="flex-1" />

        {/* Import button */}
        <button
          type="button"
          onClick={handleImport}
          disabled={importDisabled || isImporting}
          aria-label={isImporting ? `Importing ${candidate.name}` : `Import ${candidate.name}`}
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-1',
            'text-[10px] font-medium transition-colors',
            'border border-primary/60 text-primary hover:bg-primary/10',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {isImporting ? (
            <LucideIcons.Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
          ) : (
            <LucideIcons.Download className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          Import
        </button>

        {/* Deploy button */}
        <button
          type="button"
          onClick={handleDeploy}
          disabled={deployDisabled || isDeploying}
          aria-label={isDeploying ? `Deploying ${candidate.name}` : `Deploy ${candidate.name}`}
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-1',
            'text-[10px] font-medium transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {isDeploying ? (
            <LucideIcons.Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
          ) : (
            <LucideIcons.Rocket className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          Deploy
        </button>
      </div>
    </div>
  );
}
