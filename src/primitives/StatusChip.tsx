import type { StatusChipVariant } from './variants';

export interface StatusChipProps {
  label: string;
  variant?: StatusChipVariant;
  tooltip?: string;
}

const BASE = 'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium';

const COLORS: Record<StatusChipVariant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  ok:      'bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success-foreground))]',
  warn:    'bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning-foreground))]',
  error:   'bg-destructive/14 text-destructive',
  info:    'bg-[hsl(var(--info)/0.14)] text-[hsl(var(--info-foreground))]',
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
