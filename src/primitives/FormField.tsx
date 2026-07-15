import * as React from 'react';
import { cn } from './utils';
import { Label } from './Label';

export interface FormFieldProps {
  /** Text label rendered above the control. */
  label?: string;
  /** Associates the label with the control via `htmlFor` / `id`. */
  htmlFor?: string;
  /** Inline error message; triggers `role="alert"` on the error element. */
  error?: string;
  /** Supplementary hint rendered below the control. */
  hint?: string;
  /** Renders an asterisk and communicates `aria-required` semantics. */
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Composable form field wrapper that renders an optional label, child control,
 * optional error message, and optional hint text.
 *
 * When `error` is set the error text is wrapped in `role="alert"` so that
 * screen readers announce it immediately. When `required` is set an asterisk
 * is appended to the label (hidden from AT) and `aria-required={true}` is
 * injected directly onto the child control via `React.cloneElement` — so
 * callers do not need to remember to pass `aria-required` themselves. If the
 * child already carries an explicit `aria-required` prop it is preserved.
 */
function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  // Inject aria-required onto the direct child control when required is true,
  // without overriding an explicit value the caller already set.
  const child =
    required && React.isValidElement(children)
      ? React.cloneElement(
          children as React.ReactElement<Record<string, unknown>>,
          {
            'aria-required':
              (children as React.ReactElement<Record<string, unknown>>).props[
                'aria-required'
              ] ?? true,
          }
        )
      : children;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}

      <div data-required={required ? 'true' : undefined}>{child}</div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export { FormField };
