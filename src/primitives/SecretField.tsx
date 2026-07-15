'use client';

/**
 * SecretField — write-only secret entry implementing DEC-FE-5.
 *
 * SECURITY CONTRACT: this component NEVER receives, holds, or displays the
 * stored secret value. There is no `value` prop and no state that ever holds
 * the existing secret. When `isSet` is true the component only knows a secret
 * exists — it has no access to what that secret is.
 *
 * The only place typed input exists is transient local state (`inputValue`),
 * which is immediately cleared on both Save and Cancel.
 */

import * as React from 'react';
import { Badge } from './Badge';
import { MaskedSecretInput } from './MaskedSecretInput';
import { cn } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SecretFieldProps {
  /** The key/env-var name shown as a label (e.g. "ANTHROPIC_API_KEY"). */
  label: string;
  /**
   * Whether a secret value is already configured on the server.
   * When true, the stored value is NOT passed to this component — only the
   * boolean fact that one exists.
   */
  isSet: boolean;
  /**
   * Called with the new plaintext value entered by the user. Invoked on Save.
   * The component clears its local input state immediately after calling this,
   * so the typed value is never retained beyond the call site.
   */
  onSubmit: (newValue: string) => void | Promise<void>;
  /** Disables all interactive controls. */
  disabled?: boolean;
  /** Supplementary help text rendered below the field. */
  description?: string;
  /** Error message rendered with role="alert" below the field. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SecretField({
  label,
  isSet,
  onSubmit,
  disabled = false,
  description,
  error,
}: SecretFieldProps) {
  // `replacing` tracks whether the user has clicked "Replace" to reveal the
  // masked input when a secret is already configured.
  const [replacing, setReplacing] = React.useState(false);

  // Transient typed value — cleared on submit AND cancel. This is the ONLY
  // place a typed secret value exists in this component; it is never persisted,
  // logged, or surfaced to the parent except via the onSubmit callback.
  const [inputValue, setInputValue] = React.useState('');

  const [submitting, setSubmitting] = React.useState(false);

  // Whether to show the masked input: always when no secret is set, or when
  // the user is actively replacing an existing one.
  const showInput = !isSet || replacing;

  const handleSave = React.useCallback(async () => {
    if (!inputValue || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(inputValue);
    } finally {
      // Immediately clear the typed value regardless of whether onSubmit threw.
      setInputValue('');
      setSubmitting(false);
      setReplacing(false);
    }
  }, [inputValue, onSubmit, submitting]);

  const handleCancel = React.useCallback(() => {
    // Clear the typed value and collapse back to the "Configured" view.
    setInputValue('');
    setReplacing(false);
  }, []);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleSave();
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Configured-state row: badge + Replace button */}
      {isSet && !replacing && (
        <div className="flex items-center gap-3">
          {/* Show that a secret exists — never its value */}
          <Badge variant="secondary" className="text-xs font-medium">
            Configured
          </Badge>
          <button
            type="button"
            onClick={() => setReplacing(true)}
            disabled={disabled}
            className={cn(
              'text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'disabled:pointer-events-none disabled:opacity-40',
              'transition-colors'
            )}
          >
            Replace
          </button>
        </div>
      )}

      {/* Input row: shown when no secret exists, or user clicked Replace */}
      {showInput && (
        <div className="flex flex-col gap-2">
          <MaskedSecretInput
            label={label}
            value={inputValue}
            onChange={setInputValue}
            placeholder={isSet ? 'Enter new value to replace…' : 'Enter value…'}
            disabled={disabled || submitting}
          />

          {/* Save / Cancel actions — key shortcuts handled on interactive buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              onKeyDown={handleKeyDown}
              disabled={disabled || submitting || !inputValue}
              className={cn(
                'inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium',
                'bg-primary text-primary-foreground shadow',
                'hover:bg-primary/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-40',
                'transition-colors'
              )}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>

            {/* Cancel only makes sense when the user is replacing an existing secret */}
            {isSet && replacing && (
              <button
                type="button"
                onClick={handleCancel}
                onKeyDown={handleKeyDown}
                disabled={disabled || submitting}
                className={cn(
                  'inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium',
                  'border border-input bg-background text-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:pointer-events-none disabled:opacity-40',
                  'transition-colors'
                )}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Description help text */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Error — role="alert" so screen readers announce it immediately */}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

SecretField.displayName = 'SecretField';

export { SecretField };
