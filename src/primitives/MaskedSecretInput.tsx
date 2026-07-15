'use client';

import * as React from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Input } from './Input';
import { cn } from './utils';

export interface MaskedSecretInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** When true, a copy-to-clipboard button is rendered alongside the toggle. */
  showCopyButton?: boolean;
  /** Always required — used as the accessible label for the input. */
  label: string;
  disabled?: boolean;
}

function MaskedSecretInput({
  value,
  onChange,
  placeholder,
  showCopyButton = false,
  label,
  disabled = false,
}: MaskedSecretInputProps) {
  const [revealed, setRevealed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable id for label/input association
  const idRef = React.useRef(`masked-secret-${Math.random().toString(36).slice(2, 9)}`);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const toggleRevealed = React.useCallback(() => {
    setRevealed((prev) => !prev);
  }, []);

  const handleCopy = React.useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fail silently
    }
  }, [value]);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={idRef.current}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <Input
          id={idRef.current}
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          // Reserve space on the right for the action buttons
          className={cn(
            'pr-10',
            showCopyButton && 'pr-[4.5rem]'
          )}
          aria-label={label}
        />

        {/* Action buttons rendered inside the input's right edge */}
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {showCopyButton && (
            <button
              type="button"
              onClick={handleCopy}
              disabled={disabled || !value}
              aria-label={copied ? 'Copied' : 'Copy to clipboard'}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded transition-colors',
                'text-muted-foreground hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-40'
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={toggleRevealed}
            disabled={disabled}
            aria-label={revealed ? 'Hide value' : 'Show value'}
            aria-pressed={revealed}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded transition-colors',
              'text-muted-foreground hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-40'
            )}
          >
            {revealed ? (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

MaskedSecretInput.displayName = 'MaskedSecretInput';

export { MaskedSecretInput };
