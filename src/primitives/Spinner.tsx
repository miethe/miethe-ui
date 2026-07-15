import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const spinnerVariants = cva('animate-spin text-current', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  /** Accessible label announced to screen readers. Defaults to "Loading". */
  'aria-label'?: string;
}

/**
 * Loading indicator with an accessible `role="status"` wrapper and
 * visually-hidden text for screen readers. Size variants: `sm`, `md`, `lg`.
 */
function Spinner({ className, size, 'aria-label': ariaLabel = 'Loading', ...props }: SpinnerProps) {
  return (
    <span role="status">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn(spinnerVariants({ size }), className)}
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {/* visually hidden — provides text for SR where role=status isn't enough */}
      <span
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {ariaLabel}
      </span>
    </span>
  );
}

export { Spinner };
