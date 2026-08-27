import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../primitives/Dialog';
import { cn } from '../primitives/utils';

export interface PriorityBadgeProps {
  priority?: 0 | 1 | 2 | 3 | null;
  explanation?: string;
  className?: string;
}

const priorityTone: Record<NonNullable<PriorityBadgeProps['priority']>, string> = {
  0: 'border-destructive/30 bg-destructive/10 text-destructive',
  1: 'border-warning/30 bg-warning/10 text-warning-foreground',
  2: 'border-info/30 bg-info/10 text-info-foreground',
  3: 'border-border bg-muted text-muted-foreground',
};

export function PriorityBadge({ priority, explanation, className }: PriorityBadgeProps) {
  if (priority == null) return null;
  return <span className={cn('inline-flex rounded border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums', priorityTone[priority], className)} title={explanation}>P{priority}</span>;
}

export interface AgeIndicatorProps {
  label: string;
  ageMs?: number;
  warnAfterMs?: number;
  criticalAfterMs?: number;
  className?: string;
}

export function AgeIndicator({ label, ageMs = 0, warnAfterMs = 3 * 86400000, criticalAfterMs = 7 * 86400000, className }: AgeIndicatorProps) {
  const tone = ageMs >= criticalAfterMs ? 'border-destructive/40 bg-destructive/10 text-destructive' : ageMs >= warnAfterMs ? 'border-warning/40 bg-warning/10 text-warning-foreground' : 'border-border text-muted-foreground';
  return <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium', tone, className)}><span aria-hidden="true">{ageMs >= warnAfterMs ? '!' : '·'}</span>{label}</span>;
}

export interface FreshnessIndicatorProps extends AgeIndicatorProps {
  state?: 'fresh' | 'stale' | 'last-known' | 'estimated';
}

export function FreshnessIndicator({ state = 'fresh', label, ...props }: FreshnessIndicatorProps) {
  return <AgeIndicator {...props} label={state === 'fresh' ? label : `${label} · ${state.replace('-', ' ')}`} />;
}

export interface OperatorColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  className?: string;
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface OperatorTableProps<T> {
  columns: OperatorColumn<T>[];
  items: T[];
  getRowId: (item: T) => string;
  onRowOpen?: (item: T) => void;
  density?: 'standard' | 'compact';
  caption?: string;
  className?: string;
}

const hideClass = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' };

export function OperatorTable<T>({ columns, items, getRowId, onRowOpen, density = 'standard', caption, className }: OperatorTableProps<T>) {
  const rowHeight = density === 'compact' ? 'h-[38px]' : 'h-[42px]';
  return <div className={cn('overflow-x-auto rounded-md border border-border bg-card', className)}><table className="w-full table-fixed border-collapse text-left text-[13px]"><caption className="sr-only">{caption}</caption><thead className="bg-muted/40"><tr>{columns.map(column => <th key={column.id} className={cn('h-[30px] px-3 text-[11px] font-semibold text-muted-foreground', column.className, column.hideBelow && hideClass[column.hideBelow])}>{column.header}</th>)}</tr></thead><tbody>{items.map(item => <tr key={getRowId(item)} className={cn(rowHeight, onRowOpen && 'cursor-pointer outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset')} tabIndex={onRowOpen ? 0 : undefined} onClick={() => onRowOpen?.(item)} onKeyDown={event => { if (onRowOpen && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onRowOpen(item); } }}>{columns.map(column => <td key={column.id} className={cn('border-t border-border px-3 align-middle', column.className, column.hideBelow && hideClass[column.hideBelow])}>{column.cell(item)}</td>)}</tr>)}</tbody></table></div>;
}

export interface QueueSectionProps {
  title: React.ReactNode;
  count?: number;
  state?: 'ready' | 'loading' | 'unavailable' | 'empty' | 'partial';
  children?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function QueueSection({ title, count, state = 'ready', children, defaultOpen = true, className }: QueueSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return <section className={cn('space-y-2', className)} aria-busy={state === 'loading'}><div className="flex min-h-8 items-center justify-between gap-3"><button type="button" className="flex items-center gap-2 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpen(value => !value)} aria-expanded={open}><span aria-hidden="true" className="text-muted-foreground">{open ? '−' : '+'}</span>{title}{count != null && <span className="text-xs font-medium tabular-nums text-muted-foreground">{count}</span>}</button></div>{open && (state === 'ready' ? children : <StatePanel state={state === 'empty' ? 'empty' : state === 'partial' ? 'partial' : state === 'loading' ? 'loading' : 'unavailable'} />)}</section>;
}

export interface QueueRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  state?: React.ReactNode;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  expanded?: React.ReactNode;
  onOpen?: () => void;
  className?: string;
}

export function QueueRow({ title, description, state, metadata, actions, expanded, onOpen, className }: QueueRowProps) {
  return <article className={cn('rounded-md border border-border bg-card', className)}><div className={cn('flex min-h-[42px] items-center gap-3 px-3 py-2', onOpen && 'cursor-pointer outline-none hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring')} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onClick={onOpen} onKeyDown={event => { if (onOpen && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(); } }}><div className="min-w-0 flex-1"><div className="line-clamp-2 text-[13px] font-semibold leading-[18px] text-foreground">{title}</div>{description && <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</div>}{metadata && <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">{metadata}</div>}</div>{state && <div className="shrink-0">{state}</div>}{actions && <div className="shrink-0" onClick={event => event.stopPropagation()}>{actions}</div>}</div>{expanded && <div className="border-t border-border px-3 py-3">{expanded}</div>}</article>;
}

export interface DecisionBandProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  onKeep: () => void;
  onDrop?: () => void;
  error?: string;
  busy?: boolean;
  dropLabel?: string;
  keepLabel?: string;
}

export function DecisionBand({ label = 'Why should this remain?', value, onValueChange, onKeep, onDrop, error, busy, dropLabel = 'Drop', keepLabel = 'Keep' }: DecisionBandProps) {
  const id = React.useId();
  return <div className="space-y-2 border-t border-warning/40 bg-warning/5 px-3 py-3"><label htmlFor={id} className="block text-xs font-semibold text-foreground">{label}</label><div className="flex flex-col gap-2 sm:flex-row"><input id={id} value={value} onChange={event => onValueChange(event.target.value)} className="min-h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />{onDrop && <button type="button" onClick={onDrop} disabled={busy} className="min-h-9 rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive disabled:opacity-50">{dropLabel}</button>}<button type="button" onClick={onKeep} disabled={busy || !value.trim()} className="min-h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{keepLabel}</button></div>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}

export interface InspectorShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  contextRail?: React.ReactNode;
  mode?: 'drawer' | 'modal' | 'canvas';
}

export function InspectorShell({ open, onOpenChange, title, description, children, contextRail, mode = 'drawer' }: InspectorShellProps) {
  const width = mode === 'canvas' ? 'max-w-[96vw]' : mode === 'drawer' ? 'max-w-2xl sm:ml-auto sm:mr-0 sm:h-full sm:max-w-xl' : 'max-w-3xl';
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={cn('max-h-[92vh] overflow-hidden p-0', width)}><DialogHeader className="border-b border-border px-5 py-4"><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader><div className="grid max-h-[calc(92vh-76px)] min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_280px]"><div className="min-h-0 overflow-y-auto p-5">{children}</div>{contextRail && <aside className="min-h-0 overflow-y-auto border-t border-border p-4 md:border-l md:border-t-0">{contextRail}</aside>}</div></DialogContent></Dialog>;
}

export interface ContextRailProps { children: React.ReactNode; title?: React.ReactNode; className?: string; }
export function ContextRail({ children, title, className }: ContextRailProps) { return <aside aria-label={typeof title === 'string' ? title : 'Context'} className={cn('min-h-0 overflow-y-auto border-l border-border p-4', className)}>{title && <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>}{children}</aside>; }

export interface ScrollSpyOutlineItem { id: string; label: string; depth?: 2 | 3; }
export interface ScrollSpyOutlineProps { items: ScrollSpyOutlineItem[]; activeId?: string; onNavigate: (id: string) => void; }
export function ScrollSpyOutline({ items, activeId, onNavigate }: ScrollSpyOutlineProps) { if (!items.length) return null; return <nav aria-label="On this page" className="space-y-1">{items.map(item => <button key={item.id} type="button" onClick={() => onNavigate(item.id)} className={cn('block w-full rounded px-2 py-1 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring', item.depth === 3 && 'pl-5', activeId === item.id ? 'bg-accent font-semibold text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>{item.label}</button>)}</nav>; }

export type StatePanelState = 'loading' | 'unavailable' | 'partial' | 'stale' | 'empty' | 'no-match';
export interface StatePanelProps { state: StatePanelState; title?: string; detail?: React.ReactNode; onRetry?: () => void; }
const stateCopy: Record<StatePanelState, string> = { loading: 'Loading', unavailable: 'Unavailable', partial: 'Partial data', stale: 'May be outdated', empty: 'Nothing here yet', 'no-match': 'No matching records' };
export function StatePanel({ state, title, detail, onRetry }: StatePanelProps) { const isAlert = state === 'unavailable' || state === 'partial' || state === 'stale'; return <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground" role={isAlert ? 'status' : undefined}><p className="font-semibold text-foreground">{title ?? stateCopy[state]}</p>{detail && <div className="mt-1 text-xs">{detail}</div>}{onRetry && <button type="button" onClick={onRetry} className="mt-3 min-h-9 rounded border border-border bg-background px-3 text-xs font-medium text-foreground">Retry</button>}</div>; }

export interface ReaderWorkspaceProps { children: React.ReactNode; tabs?: React.ReactNode; outline?: React.ReactNode; contextRail?: React.ReactNode; className?: string; }
export function ReaderWorkspace({ children, tabs, outline, contextRail, className }: ReaderWorkspaceProps) { return <section className={cn('grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)_280px]', className)}>{outline && <aside className="order-2 border-t border-border p-4 lg:order-none lg:border-r lg:border-t-0">{outline}</aside>}<div className="min-h-0 overflow-y-auto"><div className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">{tabs}</div><article className="mx-auto max-w-3xl px-5 py-8">{children}</article></div>{contextRail && <div className="order-3 border-t border-border lg:border-l lg:border-t-0">{contextRail}</div>}</section>; }
