'use client';

import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';
import { cn } from './utils';

const DEFAULT_TOOLTIP = 'This artifact cannot be modified \u2014 enforced by your organization';

export interface LockIconProps {
  className?: string;
  tooltip?: string;
}

/**
 * Lock indicator for artifacts with enforce_override=True.
 * Renders a small lock icon with an accessible tooltip explaining the enforced state.
 * Keyboard-accessible via Radix UI Tooltip primitives.
 */
export function LockIcon({ className, tooltip = DEFAULT_TOOLTIP }: LockIconProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          asChild
          aria-label={tooltip}
        >
          <span
            className={cn(
              'inline-flex items-center justify-center text-muted-foreground',
              className
            )}
            role="img"
            aria-label={tooltip}
          >
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
