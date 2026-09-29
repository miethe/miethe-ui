import * as React from 'react';
import { cn } from '../primitives/utils';

export type TelemetryState = 'available' | 'unavailable' | 'partial' | 'stale' | 'estimated' | 'last-known';
export interface TelemetryValueProps { value: React.ReactNode; state?: TelemetryState; provenance?: React.ReactNode; className?: string; }
export function TelemetryValue({ value, state = 'available', provenance, className }: TelemetryValueProps) { return <div className={cn('space-y-1', className)}><div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{state === 'unavailable' ? '—' : value}</div>{state !== 'available' && <div className="text-[11px] font-medium text-muted-foreground">{state.replace('-', ' ')}</div>}{provenance && <div className="text-[11px] text-muted-foreground">{provenance}</div>}</div>; }

export interface MetricTileProps extends TelemetryValueProps { label: React.ReactNode; context?: React.ReactNode; selected?: boolean; onSelect?: () => void; }
export function MetricTile({ label, context, selected, onSelect, ...value }: MetricTileProps) { return <button type="button" onClick={onSelect} className={cn('min-h-[96px] rounded-md border border-border bg-card p-4 text-left outline-none transition hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring', selected && 'ring-2 ring-ring')} aria-pressed={onSelect ? selected : undefined}><div className="mb-2 text-xs font-semibold text-muted-foreground">{label}</div><TelemetryValue {...value}/>{context && <div className="mt-2 text-xs text-muted-foreground">{context}</div>}</button>; }

export interface MetricStripProps { children: React.ReactNode; className?: string; }
export function MetricStrip({ children, className }: MetricStripProps) { return <section className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</section>; }

export interface ProvenanceLineProps { children: React.ReactNode; className?: string; }
export function ProvenanceLine({ children, className }: ProvenanceLineProps) { return <p className={cn('text-[11px] leading-4 text-muted-foreground', className)}>{children}</p>; }

export interface CoverageStripProps { total: number; issues: Array<{ id: string; label: string; count: number; onSelect?: () => void }>; className?: string; }
export function CoverageStrip({ total, issues, className }: CoverageStripProps) { return <div className={cn('flex flex-wrap items-center gap-2 text-xs', className)}><span className="font-semibold tabular-nums text-foreground">{total}% coverage</span>{issues.map(issue => <button key={issue.id} type="button" disabled={!issue.count} onClick={issue.onSelect} className="rounded border border-border px-2 py-1 text-muted-foreground disabled:cursor-default disabled:opacity-50">{issue.label} <span className="tabular-nums">{issue.count}</span></button>)}</div>; }

export interface ExpandableBreakdownProps { summary: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; }
export function ExpandableBreakdown({ summary, children, defaultOpen = false }: ExpandableBreakdownProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="rounded-md border border-border bg-card"><summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">{summary}</summary><div className="border-t border-border p-3">{children}</div></details>;
}
