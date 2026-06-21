'use client';

/**
 * CreateEntityDialog — @miethe/ui primitive
 *
 * A schema-driven creation dialog for any entity type.
 * Dynamically renders form fields from an `EntityFormSchema` definition using
 * react-hook-form for state management and per-field validation.
 *
 * Only the `simple` mode is fully implemented here. `tabs` and `composite`
 * modes render a placeholder until PRIM-003 / PRIM-004 are complete.
 *
 * @example Simple usage
 * ```tsx
 * <CreateEntityDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   schema={{
 *     mode: 'simple',
 *     fields: [
 *       { name: 'name', label: 'Name', type: 'text', required: true },
 *       { name: 'description', label: 'Description', type: 'textarea' },
 *     ],
 *   }}
 *   onSubmit={async (values) => { await create(values); }}
 *   title="Create Skill"
 *   description="Add a new skill to your collection"
 * />
 * ```
 */

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { AlertCircle, ChevronDown, X } from 'lucide-react';
import { useForm, type UseFormReturn, type RegisterOptions } from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Dialog';
import { Input } from './Input';
import { CollectionPicker } from './CollectionPicker';
import { cn } from './utils';

// ============================================================================
// Local mirror of EntityFormSchema types
// (mirrors skillmeat/web/lib/entity-form-schema.ts — structurally compatible)
// ============================================================================

export interface FieldOption {
  label: string;
  value: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'number'
  | 'boolean'
  | 'tags';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: FieldOption[];
  defaultValue?: unknown;
  /** Optional Zod schema — used for `.parse()` based validation when provided */
  validation?: { safeParse: (v: unknown) => { success: boolean; error?: { issues: Array<{ message: string }> } } };
}

export interface CollectionPickerConfig {
  enabled: boolean;
  required?: boolean;
  collapsible?: boolean;
  defaultCollectionId?: string;
}

export interface SimpleFormSchema {
  mode: 'simple';
  fields: FieldDef[];
  collection?: CollectionPickerConfig;
}

export interface TabDef {
  id: string;
  label: string;
  /** Optional Lucide-compatible icon component */
  icon?: React.ComponentType<{ className?: string }>;
  fields: FieldDef[];
  /** Escape hatch: when provided, bypasses field-list rendering for this tab */
  renderTabContent?: (form: UseFormReturn<Record<string, unknown>>) => React.ReactNode;
}

export interface TabsFormSchema {
  mode: 'tabs';
  tabs: TabDef[];
  collection?: CollectionPickerConfig;
}

export interface MemberPickerConfig {
  entityType: string;
  label: string;
  validateMin?: number;
  validateMax?: number;
}

export interface CompositeFormSchema {
  mode: 'composite';
  tabs: TabDef[];
  members: MemberPickerConfig;
  /**
   * Optional custom review step rendered as the final tab.
   * When omitted, a default summary of fields + selected members is shown.
   */
  renderReviewStep?: (ctx: {
    values: Record<string, unknown>;
    memberIds: string[];
  }) => React.ReactNode;
  collection?: CollectionPickerConfig;
}

export type EntityFormSchema = SimpleFormSchema | TabsFormSchema | CompositeFormSchema;

// ============================================================================
// Collection item type (mirrors CollectionItem in CollectionPicker)
// ============================================================================

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
}

// ============================================================================
// Props
// ============================================================================

export interface CreateEntityDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Schema that drives field rendering and validation */
  schema: EntityFormSchema;
  /** Called with form values on submit */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Optional subtitle shown below the title */
  description?: string;
  /** Label for the submit button (default: "Create") */
  submitLabel?: string;
  /** When true, submit button shows loading state */
  isSubmitting?: boolean;
  /** Inline error message shown as an alert banner */
  error?: string;
  /** Available collections for the collection picker */
  collections?: CollectionItem[];
  /** Pre-selected collection ID */
  defaultCollectionId?: string;
  /**
   * Controlled member IDs for composite mode.
   * When provided, the composite member picker uses this as the initial value.
   */
  memberIds?: string[];
  /**
   * Called when the member IDs change in composite mode.
   */
  onMemberIdsChange?: (ids: string[]) => void;
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Build react-hook-form validate rules from a FieldDef */
function buildValidateRule(
  field: FieldDef
): RegisterOptions['validate'] {
  return (value: unknown) => {
    // Required check
    if (field.required) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) return `${field.label} is required`;
    }

    // Zod-based validation when provided
    if (field.validation && value !== undefined && value !== null && value !== '') {
      const result = field.validation.safeParse(value);
      if (!result.success && result.error) {
        return result.error.issues[0]?.message ?? 'Invalid value';
      }
    }

    return true;
  };
}

// ============================================================================
// Textarea primitive (local — mirrors shadcn Textarea)
// ============================================================================

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2',
      'text-sm ring-offset-background placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'resize-y',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

// ============================================================================
// Select primitive (wraps @radix-ui/react-select)
// ============================================================================

interface InternalSelectProps {
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

function InternalSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: InternalSelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled} required={required}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>span]:line-clamp-1'
        )}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport
            className={cn(
              'p-1',
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
            )}
          >
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                  'focus:bg-accent focus:text-accent-foreground',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ============================================================================
// MultiSelect — checkbox group
// ============================================================================

interface MultiSelectProps {
  options: FieldOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  id?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

function MultiSelect({ options, value, onChange, disabled, id, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, 'aria-required': ariaRequired }: MultiSelectProps) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      className="flex flex-col gap-2"
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'flex items-center gap-2 text-sm cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            disabled={disabled}
            className={cn(
              'h-4 w-4 rounded border border-input accent-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ============================================================================
// TagInput — pill-style comma-separated tag input
// ============================================================================

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

function TagInput({ value, onChange, placeholder, disabled, id, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, 'aria-required': ariaRequired }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tags = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return;
    const next = Array.from(new Set([...value, ...tags]));
    onChange(next);
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2',
        'text-sm ring-offset-background',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={() => inputRef.current?.focus()}
      role="group"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : 'Tag input'}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
        placeholder={value.length === 0 ? placeholder : undefined}
        disabled={disabled}
        className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
      />
    </div>
  );
}

// ============================================================================
// renderField — renders a single FieldDef with label, input, error
// ============================================================================

interface FieldRendererProps {
  field: FieldDef;
  form: UseFormReturn<Record<string, unknown>>;
  disabled?: boolean;
}

function FieldRenderer({ field, form, disabled }: FieldRendererProps) {
  const {
    register,
    control: _control,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const fieldId = `ced-field-${field.name}`;
  const errorId = `ced-err-${field.name}`;
  const descId = field.description ? `ced-desc-${field.name}` : undefined;
  const labelElId = `ced-label-${field.name}`;

  const error = errors[field.name];
  const errorMessage =
    error && typeof error.message === 'string' ? error.message : undefined;

  const ariaDescribedBy = [descId, errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const ariaProps = {
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': errorMessage ? (true as const) : undefined,
    'aria-required': field.required ? (true as const) : undefined,
  };

  const labelNode = (
    <label
      id={labelElId}
      htmlFor={fieldId}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {field.label}
      {field.required && (
        <>
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      )}
    </label>
  );

  const descNode = field.description ? (
    <p id={descId} className="text-xs text-muted-foreground">
      {field.description}
    </p>
  ) : null;

  const errorNode = errorMessage ? (
    <p id={errorId} role="alert" className="text-xs text-destructive">
      {errorMessage}
    </p>
  ) : null;

  // ── boolean ──────────────────────────────────────────────────────────────
  if (field.type === 'boolean') {
    const currentValue = watch(field.name) as boolean | undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(currentValue)}
            onChange={(e) => setValue(field.name, e.target.checked, { shouldValidate: true })}
            disabled={disabled}
            className="h-4 w-4 rounded border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring"
            {...ariaProps}
          />
          {labelNode}
        </div>
        {descNode}
        {errorNode}
      </div>
    );
  }

  // ── select ────────────────────────────────────────────────────────────────
  if (field.type === 'select') {
    const currentValue = watch(field.name) as string | undefined;
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <InternalSelect
          id={fieldId}
          options={field.options ?? []}
          value={currentValue ?? ''}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          placeholder={field.placeholder ?? `Select ${field.label}…`}
          disabled={disabled}
          required={field.required}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaProps['aria-invalid'] ?? false}
        />
        {descNode}
        {errorNode}
      </div>
    );
  }

  // ── multiselect ───────────────────────────────────────────────────────────
  if (field.type === 'multiselect') {
    const currentValue = watch(field.name) as string[] | undefined;
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <MultiSelect
          id={fieldId}
          options={field.options ?? []}
          value={currentValue ?? []}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          disabled={disabled}
          aria-labelledby={labelElId}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaProps['aria-invalid'] ?? false}
          aria-required={ariaProps['aria-required'] ?? false}
        />
        {descNode}
        {errorNode}
      </div>
    );
  }

  // ── tags ──────────────────────────────────────────────────────────────────
  if (field.type === 'tags') {
    const currentValue = watch(field.name) as string[] | undefined;
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <TagInput
          id={fieldId}
          value={currentValue ?? []}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          placeholder={field.placeholder ?? 'Add tags…'}
          disabled={disabled}
          aria-labelledby={labelElId}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaProps['aria-invalid'] ?? false}
          aria-required={ariaProps['aria-required'] ?? false}
        />
        {descNode}
        {errorNode}
      </div>
    );
  }

  // ── textarea ──────────────────────────────────────────────────────────────
  if (field.type === 'textarea') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <Textarea
          id={fieldId}
          placeholder={field.placeholder}
          disabled={disabled}
          className={cn(errorMessage && 'border-destructive')}
          {...ariaProps}
          {...register(field.name, { validate: buildValidateRule(field) })}
        />
        {descNode}
        {errorNode}
      </div>
    );
  }

  // ── text | number (default) ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-1.5">
      {labelNode}
      <Input
        id={fieldId}
        type={field.type === 'number' ? 'number' : 'text'}
        placeholder={field.placeholder}
        disabled={disabled}
        className={cn(errorMessage && 'border-destructive')}
        {...ariaProps}
        {...register(field.name, {
          validate: buildValidateRule(field),
          valueAsNumber: field.type === 'number',
        })}
      />
      {descNode}
      {errorNode}
    </div>
  );
}

// ============================================================================
// SimpleFormBody — renders all fields + optional collection picker
// ============================================================================

interface SimpleFormBodyProps {
  schema: SimpleFormSchema;
  form: UseFormReturn<Record<string, unknown>>;
  isSubmitting: boolean;
  collections?: CollectionItem[];
  defaultCollectionId?: string;
  collectionValue?: string;
  onCollectionChange: (id: string) => void;
}

function SimpleFormBody({
  schema,
  form,
  isSubmitting,
  collections,
  defaultCollectionId,
  collectionValue,
  onCollectionChange,
}: SimpleFormBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      {schema.fields.map((field) => (
        <FieldRenderer
          key={field.name}
          field={field}
          form={form}
          disabled={isSubmitting}
        />
      ))}

      {schema.collection?.enabled && (
        <CollectionPicker
          config={schema.collection}
          collections={collections ?? []}
          value={collectionValue}
          onChange={onCollectionChange}
          defaultCollectionId={defaultCollectionId ?? schema.collection.defaultCollectionId}
        />
      )}
    </div>
  );
}

// ============================================================================
// TabsFormBody — renders tabbed fields + optional collection picker
// ============================================================================

interface TabsFormBodyProps {
  schema: TabsFormSchema;
  form: UseFormReturn<Record<string, unknown>>;
  isSubmitting: boolean;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  tabErrors: Record<string, number>;
  collections?: CollectionItem[];
  defaultCollectionId?: string;
  collectionValue?: string;
  onCollectionChange: (id: string) => void;
}

function TabsFormBody({
  schema,
  form,
  isSubmitting,
  activeTab,
  onActiveTabChange,
  tabErrors,
  collections,
  defaultCollectionId,
  collectionValue,
  onCollectionChange,
}: TabsFormBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      <TabsPrimitive.Root value={activeTab} onValueChange={onActiveTabChange}>
        {/* Tab list */}
        <TabsPrimitive.List
          className={cn(
            'inline-flex h-9 w-full items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground',
            'border-b border-border'
          )}
          aria-label="Form sections"
        >
          {schema.tabs.map((tab) => {
            const errCount = tabErrors[tab.id] ?? 0;
            const Icon = tab.icon;
            return (
              <TabsPrimitive.Trigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50',
                  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5',
                      errCount > 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  />
                )}
                <span className={cn(errCount > 0 && 'text-destructive')}>{tab.label}</span>
                {errCount > 0 && (
                  <span
                    className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
                    aria-label={`${errCount} error${errCount === 1 ? '' : 's'}`}
                  >
                    {errCount}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>

        {/* Tab content panels */}
        {schema.tabs.map((tab) => (
          <TabsPrimitive.Content
            key={tab.id}
            value={tab.id}
            className={cn(
              'mt-4 ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            {tab.renderTabContent ? (
              tab.renderTabContent(form)
            ) : (
              <div className="flex flex-col gap-4">
                {tab.fields.map((field) => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    form={form}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            )}
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>

      {/* Collection picker — outside tabs */}
      {schema.collection?.enabled && (
        <CollectionPicker
          config={schema.collection}
          collections={collections ?? []}
          value={collectionValue}
          onChange={onCollectionChange}
          defaultCollectionId={defaultCollectionId ?? schema.collection.defaultCollectionId}
        />
      )}
    </div>
  );
}

// ============================================================================
// COMPOSITE_MEMBERS_TAB_ID / COMPOSITE_REVIEW_TAB_ID — stable virtual tab ids
// ============================================================================

const COMPOSITE_MEMBERS_TAB_ID = '__composite_members__';
const COMPOSITE_REVIEW_TAB_ID = '__composite_review__';

// ============================================================================
// MemberPickerTab — simple text-entry member picker for composite mode
// ============================================================================

interface MemberPickerTabProps {
  config: MemberPickerConfig;
  memberIds: string[];
  onMemberIdsChange: (ids: string[]) => void;
  disabled?: boolean;
  memberError?: string;
}

function MemberPickerTab({
  config,
  memberIds,
  onMemberIdsChange,
  disabled,
  memberError,
}: MemberPickerTabProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = 'composite-member-input';
  const errorId = 'composite-member-error';

  const addMember = (raw: string) => {
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    // Enforce max
    if (config.validateMax !== undefined) {
      const available = config.validateMax - memberIds.length;
      if (available <= 0) return;
      const toAdd = ids.slice(0, available);
      onMemberIdsChange(Array.from(new Set([...memberIds, ...toAdd])));
    } else {
      onMemberIdsChange(Array.from(new Set([...memberIds, ...ids])));
    }
    setInputValue('');
  };

  const removeMember = (id: string) => {
    onMemberIdsChange(memberIds.filter((m) => m !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addMember(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && memberIds.length > 0) {
      onMemberIdsChange(memberIds.slice(0, -1));
    }
  };

  const atMax =
    config.validateMax !== undefined && memberIds.length >= config.validateMax;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-none"
        >
          {config.label}
          {config.validateMin !== undefined && config.validateMin > 0 && (
            <>
              <span className="ml-1 text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </>
          )}
        </label>

        {(config.validateMin !== undefined || config.validateMax !== undefined) && (
          <p className="text-xs text-muted-foreground">
            {config.validateMin !== undefined && config.validateMax !== undefined
              ? `Select between ${config.validateMin} and ${config.validateMax} members`
              : config.validateMin !== undefined
              ? `Select at least ${config.validateMin} member${config.validateMin === 1 ? '' : 's'}`
              : `Select up to ${config.validateMax} member${config.validateMax === 1 ? '' : 's'}`}
          </p>
        )}

        {/* Member pill list + input */}
        <div
          className={cn(
            'flex min-h-[44px] w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2',
            'text-sm ring-offset-background',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            memberError && 'border-destructive',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          onClick={() => inputRef.current?.focus()}
          role="group"
          aria-label={`${config.label} members`}
        >
          {memberIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              <span className="max-w-[160px] truncate" title={id}>{id}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMember(id);
                  }}
                  className="rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={`Remove member ${id}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
          {!atMax && (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (inputValue.trim()) addMember(inputValue); }}
              placeholder={memberIds.length === 0 ? `Enter ${config.entityType} IDs…` : undefined}
              disabled={disabled}
              aria-describedby={memberError ? errorId : undefined}
              aria-invalid={memberError ? true : undefined}
              className="min-w-[180px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
          )}
        </div>

        {memberError && (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {memberError}
          </p>
        )}
      </div>

      {/* Selected count badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 font-medium',
            memberIds.length > 0
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {memberIds.length} selected
        </span>
        {atMax && (
          <span className="text-amber-600 dark:text-amber-400">
            Maximum reached
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DefaultReviewStep — shown when schema.renderReviewStep is not provided
// ============================================================================

interface DefaultReviewStepProps {
  tabs: TabDef[];
  formValues: Record<string, unknown>;
  memberIds: string[];
  membersConfig: MemberPickerConfig;
}

function DefaultReviewStep({
  tabs,
  formValues,
  memberIds,
  membersConfig,
}: DefaultReviewStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Field summary per tab */}
      {tabs.map((tab) => {
        const filledFields = tab.fields.filter(
          (f) => formValues[f.name] !== undefined && formValues[f.name] !== '' &&
          !(Array.isArray(formValues[f.name]) && (formValues[f.name] as unknown[]).length === 0)
        );
        if (filledFields.length === 0) return null;
        return (
          <div key={tab.id} className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tab.label}
            </h4>
            <dl className="flex flex-col gap-1.5">
              {filledFields.map((f) => {
                const val = formValues[f.name];
                let display: string;
                if (Array.isArray(val)) {
                  display = (val as string[]).join(', ') || '—';
                } else if (typeof val === 'boolean') {
                  display = val ? 'Yes' : 'No';
                } else {
                  display = String(val ?? '—');
                }
                return (
                  <div key={f.name} className="flex gap-2 text-sm">
                    <dt className="w-32 shrink-0 font-medium text-muted-foreground truncate">
                      {f.label}
                    </dt>
                    <dd className="flex-1 truncate">{display}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}

      {/* Members summary */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {membersConfig.label}
        </h4>
        {memberIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members selected</p>
        ) : (
          <ul role="list" className="flex flex-col gap-1">
            {memberIds.map((id) => (
              <li
                key={id}
                role="listitem"
                className="flex items-center gap-2 text-sm"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span className="truncate">{id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CompositeFormBody — tabs + members tab + optional review tab
// ============================================================================

interface CompositeFormBodyProps {
  schema: CompositeFormSchema;
  form: UseFormReturn<Record<string, unknown>>;
  isSubmitting: boolean;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  tabErrors: Record<string, number>;
  memberIds: string[];
  onMemberIdsChange: (ids: string[]) => void;
  memberError?: string;
  collections?: CollectionItem[];
  defaultCollectionId?: string;
  collectionValue?: string;
  onCollectionChange: (id: string) => void;
}

function CompositeFormBody({
  schema,
  form,
  isSubmitting,
  activeTab,
  onActiveTabChange,
  tabErrors,
  memberIds,
  onMemberIdsChange,
  memberError,
  collections,
  defaultCollectionId,
  collectionValue,
  onCollectionChange,
}: CompositeFormBodyProps) {
  // Review tab is always shown in composite mode (default summary when renderReviewStep is absent)
  const hasCustomReview = schema.renderReviewStep !== undefined;

  // Build the virtual tab list: schema tabs + members + review
  const membersTabTrigger = (
    <TabsPrimitive.Trigger
      key={COMPOSITE_MEMBERS_TAB_ID}
      value={COMPOSITE_MEMBERS_TAB_ID}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
      )}
    >
      <span className={cn(memberError && 'text-destructive')}>
        {schema.members.label}
      </span>
      {memberError && (
        <span
          className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
          aria-label="1 error"
        >
          1
        </span>
      )}
    </TabsPrimitive.Trigger>
  );

  const reviewTabTrigger = (
    <TabsPrimitive.Trigger
      key={COMPOSITE_REVIEW_TAB_ID}
      value={COMPOSITE_REVIEW_TAB_ID}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
      )}
    >
      Review
    </TabsPrimitive.Trigger>
  );

  return (
    <div className="flex flex-col gap-4">
      <TabsPrimitive.Root value={activeTab} onValueChange={onActiveTabChange}>
        {/* Tab list */}
        <TabsPrimitive.List
          className={cn(
            'inline-flex h-9 w-full items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground',
            'border-b border-border'
          )}
          aria-label="Form sections"
        >
          {/* Schema-defined tabs */}
          {schema.tabs.map((tab) => {
            const errCount = tabErrors[tab.id] ?? 0;
            const Icon = tab.icon;
            return (
              <TabsPrimitive.Trigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50',
                  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5',
                      errCount > 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  />
                )}
                <span className={cn(errCount > 0 && 'text-destructive')}>{tab.label}</span>
                {errCount > 0 && (
                  <span
                    className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
                    aria-label={`${errCount} error${errCount === 1 ? '' : 's'}`}
                  >
                    {errCount}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            );
          })}

          {/* Members tab */}
          {membersTabTrigger}

          {/* Review tab (optional) */}
          {reviewTabTrigger}
        </TabsPrimitive.List>

        {/* Schema tab content panels */}
        {schema.tabs.map((tab) => (
          <TabsPrimitive.Content
            key={tab.id}
            value={tab.id}
            className={cn(
              'mt-4 ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            {tab.renderTabContent ? (
              tab.renderTabContent(form)
            ) : (
              <div className="flex flex-col gap-4">
                {tab.fields.map((field) => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    form={form}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            )}
          </TabsPrimitive.Content>
        ))}

        {/* Members tab content */}
        <TabsPrimitive.Content
          value={COMPOSITE_MEMBERS_TAB_ID}
          className={cn(
            'mt-4 ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          <MemberPickerTab
            config={schema.members}
            memberIds={memberIds}
            onMemberIdsChange={onMemberIdsChange}
            disabled={isSubmitting}
            memberError={memberError}
          />
        </TabsPrimitive.Content>

        {/* Review tab content — always present; custom renderer takes priority */}
        <TabsPrimitive.Content
          value={COMPOSITE_REVIEW_TAB_ID}
          className={cn(
            'mt-4 ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          {hasCustomReview && schema.renderReviewStep
            ? schema.renderReviewStep({
                values: form.getValues(),
                memberIds,
              })
            : (
              <DefaultReviewStep
                tabs={schema.tabs}
                formValues={form.getValues()}
                memberIds={memberIds}
                membersConfig={schema.members}
              />
            )}
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>

      {/* Collection picker — outside tabs */}
      {schema.collection?.enabled && (
        <CollectionPicker
          config={schema.collection}
          collections={collections ?? []}
          value={collectionValue}
          onChange={onCollectionChange}
          defaultCollectionId={defaultCollectionId ?? schema.collection.defaultCollectionId}
        />
      )}
    </div>
  );
}

// ============================================================================
// CreateEntityDialog
// ============================================================================

export function CreateEntityDialog({
  open,
  onOpenChange,
  schema,
  onSubmit,
  title,
  description,
  submitLabel = 'Create',
  isSubmitting = false,
  error,
  collections,
  defaultCollectionId,
  memberIds: controlledMemberIds,
  onMemberIdsChange: onControlledMemberIdsChange,
}: CreateEntityDialogProps) {
  // Build default values from schema fields (handles all modes)
  const defaultValues = React.useMemo<Record<string, unknown>>(() => {
    const allFields: FieldDef[] =
      schema.mode === 'simple'
        ? schema.fields
        : schema.tabs.flatMap((t) => t.fields);

    return Object.fromEntries(
      allFields.map((f) => {
        if (f.defaultValue !== undefined) return [f.name, f.defaultValue];
        if (f.type === 'multiselect' || f.type === 'tags') return [f.name, []];
        if (f.type === 'boolean') return [f.name, false];
        if (f.type === 'number') return [f.name, ''];
        return [f.name, ''];
      })
    );
  }, [schema]);

  const form = useForm<Record<string, unknown>>({ defaultValues });

  // Collection picker state (managed outside react-hook-form)
  const [collectionValue, setCollectionValue] = React.useState<string | undefined>(
    defaultCollectionId
  );

  // Active tab state for tabs mode (first tab is default)
  const firstTabId =
    schema.mode !== 'simple' && schema.tabs.length > 0
      ? (schema.tabs[0] as TabDef).id
      : '';
  const [activeTab, setActiveTab] = React.useState<string>(firstTabId);

  // Member IDs for composite mode — uncontrolled internal state seeded by prop
  const [internalMemberIds, setInternalMemberIds] = React.useState<string[]>(
    controlledMemberIds ?? []
  );
  const memberIds = controlledMemberIds ?? internalMemberIds;
  const handleMemberIdsChange = React.useCallback(
    (ids: string[]) => {
      setInternalMemberIds(ids);
      onControlledMemberIdsChange?.(ids);
    },
    [onControlledMemberIdsChange]
  );

  // Member validation error (composite mode)
  const [memberError, setMemberError] = React.useState<string | undefined>(undefined);

  // Compute per-tab error counts from form state
  const tabErrors = React.useMemo<Record<string, number>>(() => {
    if (schema.mode === 'simple') return {};
    const errors = form.formState.errors;
    const counts: Record<string, number> = {};
    for (const tab of schema.tabs) {
      counts[tab.id] = tab.fields.filter((f) => errors[f.name] !== undefined).length;
    }
    return counts;
  }, [schema, form.formState.errors]);

  // Reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultValues);
      setCollectionValue(defaultCollectionId);
      setActiveTab(firstTabId);
      setInternalMemberIds(controlledMemberIds ?? []);
      setMemberError(undefined);
    }
    onOpenChange(nextOpen);
  };

  // On submit: validate all fields + member count; navigate to first error tab
  const handleSubmit = form.handleSubmit(async (values) => {
    // Validate member count for composite mode
    if (schema.mode === 'composite') {
      const { validateMin, validateMax } = schema.members;
      if (validateMin !== undefined && memberIds.length < validateMin) {
        const msg = `At least ${validateMin} member${validateMin === 1 ? '' : 's'} required`;
        setMemberError(msg);
        setActiveTab(COMPOSITE_MEMBERS_TAB_ID);
        return;
      }
      if (validateMax !== undefined && memberIds.length > validateMax) {
        const msg = `No more than ${validateMax} member${validateMax === 1 ? '' : 's'} allowed`;
        setMemberError(msg);
        setActiveTab(COMPOSITE_MEMBERS_TAB_ID);
        return;
      }
    }

    setMemberError(undefined);
    const payload: Record<string, unknown> = { ...values };
    if (collectionValue) {
      payload['_collectionId'] = collectionValue;
    }
    if (schema.mode === 'composite') {
      payload['_memberIds'] = memberIds;
    }
    await onSubmit(payload);
  }, (errors) => {
    // Navigate to the first tab that contains an error
    if (schema.mode !== 'simple') {
      for (const tab of schema.tabs) {
        const hasError = tab.fields.some((f) => errors[f.name] !== undefined);
        if (hasError) {
          setActiveTab(tab.id);
          break;
        }
      }
    }
  });

  // ── Tabs mode ─────────────────────────────────────────────────────────────
  if (schema.mode === 'tabs') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[560px]">
          <DialogHeader className="shrink-0">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className={cn(
                'flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2',
                'text-sm text-destructive'
              )}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Scrollable form body */}
          <form
            id="create-entity-form"
            onSubmit={handleSubmit}
            className="min-h-0 flex-1 overflow-y-auto py-4"
            noValidate
          >
            <TabsFormBody
              schema={schema}
              form={form}
              isSubmitting={isSubmitting}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              tabErrors={tabErrors}
              collections={collections}
              defaultCollectionId={defaultCollectionId}
              collectionValue={collectionValue}
              onCollectionChange={setCollectionValue}
            />
          </form>

          {/* Fixed footer */}
          <DialogFooter className="shrink-0 border-t pt-4">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2',
                'text-sm font-medium ring-offset-background',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-entity-form"
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2',
                'text-sm font-medium text-primary-foreground ring-offset-background',
                'hover:bg-primary/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50'
              )}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : submitLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Composite mode ────────────────────────────────────────────────────────
  if (schema.mode === 'composite') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[600px]">
          <DialogHeader className="shrink-0">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className={cn(
                'flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2',
                'text-sm text-destructive'
              )}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Scrollable form body */}
          <form
            id="create-entity-form"
            onSubmit={handleSubmit}
            className="min-h-0 flex-1 overflow-y-auto py-4"
            noValidate
          >
            <CompositeFormBody
              schema={schema}
              form={form}
              isSubmitting={isSubmitting}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              tabErrors={tabErrors}
              memberIds={memberIds}
              onMemberIdsChange={handleMemberIdsChange}
              memberError={memberError}
              collections={collections}
              defaultCollectionId={defaultCollectionId}
              collectionValue={collectionValue}
              onCollectionChange={setCollectionValue}
            />
          </form>

          {/* Fixed footer */}
          <DialogFooter className="shrink-0 border-t pt-4">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2',
                'text-sm font-medium ring-offset-background',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-entity-form"
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2',
                'text-sm font-medium text-primary-foreground ring-offset-background',
                'hover:bg-primary/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50'
              )}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : submitLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Simple mode ───────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[560px]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className={cn(
              'flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2',
              'text-sm text-destructive'
            )}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable form body */}
        <form
          id="create-entity-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto py-4"
          noValidate
        >
          <SimpleFormBody
            schema={schema}
            form={form}
            isSubmitting={isSubmitting}
            collections={collections}
            defaultCollectionId={defaultCollectionId}
            collectionValue={collectionValue}
            onCollectionChange={setCollectionValue}
          />
        </form>

        {/* Fixed footer */}
        <DialogFooter className="shrink-0 border-t pt-4">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2',
              'text-sm font-medium ring-offset-background',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-entity-form"
            disabled={isSubmitting}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2',
              'text-sm font-medium text-primary-foreground ring-offset-background',
              'hover:bg-primary/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
