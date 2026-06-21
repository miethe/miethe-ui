import type { StatusChipVariant } from './variants';

export interface StatusChipProps {
  label: string;
  variant?: StatusChipVariant;
  tooltip?: string;
}

const BASE = 'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium';

const COLORS: Record<StatusChipVariant, string> = {
  neutral: 'bg-slate-700/60 text-slate-300',
  ok:      'bg-emerald-600/20 text-emerald-400',
  warn:    'bg-amber-600/20 text-amber-400',
  error:   'bg-rose-600/20 text-rose-400',
  info:    'bg-blue-600/20 text-blue-400',
};

/**
 * Reusable slate badge rendering the five planning status variants
 * (neutral / ok / warn / error / info).
 *
 * Extracted from CCDash Planning primitives (PCP-709).
 *
 * @example
 * <StatusChip label="pending" variant="warn" tooltip="Waiting on upstream" />
 */
export function StatusChip({ label, variant = 'neutral', tooltip }: StatusChipProps) {
  return (
    <span className={`${BASE} ${COLORS[variant]}`} title={tooltip}>
      {label}
    </span>
  );
}
