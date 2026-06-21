import { Building2 } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from './utils';

export interface EnterpriseOwnerBadgeProps {
  className?: string;
}

/**
 * Badge indicating that an artifact is managed by the enterprise organization.
 * Displays inline on artifact cards to signal enterprise governance.
 */
export function EnterpriseOwnerBadge({ className }: EnterpriseOwnerBadgeProps) {
  return (
    <Badge
      variant="outline"
      aria-label="This artifact is managed by your organization"
      className={cn(
        'inline-flex items-center gap-1 border-violet-500/30 bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300',
        'px-2 py-0.5 text-xs',
        className
      )}
    >
      <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>Enterprise Managed</span>
    </Badge>
  );
}
