/**
 * WizardShell Component
 *
 * A generic multi-step wizard shell. Provides step indicator, Back/Next/Submit
 * navigation controls, and validation gating. Domain-agnostic: knows nothing
 * about bundles, artifacts, or any application-specific concepts.
 *
 * @example Basic usage
 * ```tsx
 * const STEPS = [
 *   { label: 'Metadata' },
 *   { label: 'Members' },
 *   { label: 'Review' },
 *   { label: 'Confirm' },
 * ];
 *
 * <WizardShell
 *   steps={STEPS}
 *   currentStep={currentStep}
 *   onBack={handleBack}
 *   onNext={handleNext}
 *   onSubmit={handleSubmit}
 *   canAdvance={isValid}
 *   isSubmitting={isPending}
 *   onCancel={handleClose}
 *   submitLabel="Create Bundle"
 * >
 *   {currentStep === 1 && <StepOneContent />}
 *   {currentStep === 2 && <StepTwoContent />}
 * </WizardShell>
 * ```
 */

'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

export interface WizardStep {
  /** Human-readable label shown beneath the step bubble */
  label: string;
  /** Optional icon rendered inside the step bubble (overrides the step number) */
  icon?: React.ReactNode;
}

export interface WizardShellProps {
  /** Step definitions — length determines total step count */
  steps: WizardStep[];
  /**
   * Currently active step index (1-based).
   * Step 1 is the first step; `steps.length` is the last.
   */
  currentStep: number;
  /** Called when the user clicks Back */
  onBack: () => void;
  /** Called when the user clicks Next (not the last step) */
  onNext: () => void;
  /** Called when the user clicks the submit button on the last step */
  onSubmit: () => void;
  /** Called when the user clicks Cancel */
  onCancel: () => void;
  /** Whether the Next/Submit button is enabled */
  canAdvance: boolean;
  /** Loading state — disables all controls and shows loading text on submit button */
  isSubmitting?: boolean;
  /** Step content rendered in the body area */
  children: React.ReactNode;
  /** Custom label for the submit button (default: "Submit") */
  submitLabel?: string;
  /** Custom label shown on the submit button while `isSubmitting` is true (default: "Submitting…") */
  submittingLabel?: string;
  /** Minimum height for the content area (default: "220px") */
  contentMinHeight?: string;
}

// ============================================================================
// StepIndicator (private sub-component)
// ============================================================================

interface StepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Wizard steps">
      <ol className="flex items-center justify-center gap-0" role="list">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isLast = index === steps.length - 1;
          const stepState = isCompleted ? 'completed' : isActive ? 'current' : 'upcoming';

          return (
            <React.Fragment key={stepNumber}>
              {/* Step item */}
              <li
                className="flex flex-col items-center gap-1"
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${stepNumber}: ${step.label} — ${stepState}`}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    isCompleted || isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    step.icon ?? <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.icon ?? <span>{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium leading-none',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {step.label}
                </span>
              </li>

              {/* Connector line between steps */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mb-4 h-0.5 w-8 flex-shrink-0 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// WizardFooter (private sub-component)
// ============================================================================

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  canAdvance: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  submittingLabel: string;
}

function WizardFooter({
  currentStep,
  totalSteps,
  canAdvance,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
  onCancel,
  submitLabel,
  submittingLabel,
}: WizardFooterProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      {/* Cancel — always available unless submitting */}
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className={cn(
          'mr-auto inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'hover:bg-accent hover:text-accent-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        Cancel
      </button>

      {/* Back — disabled on step 1 */}
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
        aria-disabled={isFirstStep}
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'hover:bg-accent hover:text-accent-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        Back
      </button>

      {/* Next / Submit */}
      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canAdvance || isSubmitting}
          aria-busy={isSubmitting}
          className={cn(
            'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'hover:bg-primary/90',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className={cn(
            'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'hover:bg-primary/90',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          Next
        </button>
      )}
    </div>
  );
}

// ============================================================================
// WizardShell (public component)
// ============================================================================

/**
 * WizardShell — generic multi-step wizard chrome.
 *
 * Renders:
 * - A step indicator (bubbles + connector lines) reflecting `currentStep`
 * - A content area for `children` (the active step's content)
 * - A footer with Cancel, Back, and Next/Submit controls
 *
 * The shell does NOT manage step state itself. The caller owns `currentStep`
 * and the `onBack` / `onNext` / `onSubmit` handlers.
 */
export function WizardShell({
  steps,
  currentStep,
  onBack,
  onNext,
  onSubmit,
  onCancel,
  canAdvance,
  isSubmitting = false,
  children,
  submitLabel = 'Submit',
  submittingLabel = 'Submitting\u2026',
  contentMinHeight = '220px',
}: WizardShellProps) {
  const totalSteps = steps.length;

  return (
    <div className="flex flex-col gap-0">
      {/* Step indicator */}
      <div className="px-1 pt-1 pb-2">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Step content */}
      <div style={{ minHeight: contentMinHeight }}>{children}</div>

      {/* Navigation footer */}
      <WizardFooter
        currentStep={currentStep}
        totalSteps={totalSteps}
        canAdvance={canAdvance}
        isSubmitting={isSubmitting}
        onBack={onBack}
        onNext={onNext}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
      />
    </div>
  );
}
