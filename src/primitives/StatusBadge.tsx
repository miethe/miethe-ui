import { Badge } from './Badge';
import type { BadgeProps } from './Badge';

/** The four variants exposed by the Badge primitive. */
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const DEFAULT_STATUS_COLOR_MAP: Record<string, BadgeVariant> = {
  draft: 'secondary',
  published: 'default',
  deprecated: 'destructive',
};

export interface StatusBadgeProps
  extends Omit<BadgeProps, 'variant' | 'children'> {
  /** The lifecycle status to display (e.g. "draft", "published", "deprecated"). */
  status: string;
  /**
   * Optional map from status string to Badge variant.
   * Merged on top of the default map; unknown statuses fall back to "outline".
   */
  statusColorMap?: Record<string, string>;
}

/**
 * StatusBadge — a thin wrapper around Badge that maps a lifecycle status string
 * to a variant using a configurable color map.
 *
 * @example
 * <StatusBadge status="draft" />
 * <StatusBadge status="active" statusColorMap={{ active: 'default' }} />
 */
function StatusBadge({
  status,
  statusColorMap,
  className,
  ...rest
}: StatusBadgeProps) {
  const map = statusColorMap
    ? { ...DEFAULT_STATUS_COLOR_MAP, ...statusColorMap }
    : DEFAULT_STATUS_COLOR_MAP;

  const variant = (map[status] as BadgeVariant | undefined) ?? 'outline';
  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant={variant} className={className} {...rest}>
      {displayText}
    </Badge>
  );
}

export { StatusBadge };
