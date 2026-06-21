// @miethe/ui — primitives submodule
export { Badge, badgeVariants } from './Badge';
export type { BadgeProps } from './Badge';
export { ScrollArea, ScrollBar } from './ScrollArea';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Dialog';
export { ModalHeader } from './ModalHeader';
export type { ModalHeaderProps } from './ModalHeader';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export { TabNavigation } from './TabNavigation';
export type { Tab, TabNavigationProps } from './TabNavigation';
export { VerticalTabNavigation } from './VerticalTabNavigation';
export type { VerticalTabNavigationProps, VerticalTabNavigationHandle } from './VerticalTabNavigation';
export { cn } from './utils';
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';
export { BaseArtifactModal } from './BaseArtifactModal';
export type {
  BaseArtifactModalProps,
  ModalArtifact,
  ArtifactTypeConfig,
  ModalTab,
} from './BaseArtifactModal';
export { SearchableCombobox } from './SearchableCombobox';
export type { SearchableComboboxProps } from './SearchableCombobox';
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose } from './Popover';
export { Input } from './Input';
export type { InputProps } from './Input';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './DropdownMenu';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './Tooltip';
export { SearchablePickerDialog } from './SearchablePickerDialog';
export type { SearchablePickerDialogProps } from './SearchablePickerDialog';
export { ViewModeToggle } from './ViewModeToggle';
export type { ViewModeToggleProps } from './ViewModeToggle';
export { MaskedSecretInput } from './MaskedSecretInput';
export type { MaskedSecretInputProps } from './MaskedSecretInput';
export { GroupedSelect } from './GroupedSelect';
export type { GroupedSelectProps, GroupedSelectGroup, GroupedSelectItem } from './GroupedSelect';
export { EnterpriseOwnerBadge } from './EnterpriseOwnerBadge';
export type { EnterpriseOwnerBadgeProps } from './EnterpriseOwnerBadge';
export { LockIcon } from './LockIcon';
export type { LockIconProps } from './LockIcon';
export { WizardShell } from './WizardShell';
export type { WizardShellProps, WizardStep } from './WizardShell';

export { CreateEntityDialog } from './CreateEntityDialog';
export type {
  CreateEntityDialogProps,
  EntityFormSchema,
  SimpleFormSchema,
  TabsFormSchema,
  CompositeFormSchema,
  TabDef,
  FieldDef,
  FieldType,
  FieldOption,
  MemberPickerConfig,
  CollectionPickerConfig as CreateEntityCollectionPickerConfig,
  CollectionItem as CreateEntityCollectionItem,
} from './CreateEntityDialog';
export { CollectionPicker } from './CollectionPicker';
export type {
  CollectionPickerProps,
  CollectionPickerConfig,
  CollectionItem,
} from './CollectionPicker';

// Planning Primitives — extracted from CCDash (PCP-709)
export { StatusChip } from './StatusChip';
export type { StatusChipProps } from './StatusChip';
export { statusVariant, readinessVariant } from './variants';
export type { StatusChipVariant, ReadinessVariant } from './variants';
export { EffectiveStatusChips } from './EffectiveStatusChips';
export type {
  EffectiveStatusChipsProps,
  PlanningStatusProvenance,
  PlanningStatusProvenanceSource,
  PlanningStatusEvidence,
} from './EffectiveStatusChips';
export { MismatchBadge } from './MismatchBadge';
export type { MismatchBadgeProps } from './MismatchBadge';
export { BatchReadinessPill } from './BatchReadinessPill';
export type { BatchReadinessPillProps, PlanningPhaseBatchReadinessState } from './BatchReadinessPill';
export { PlanningNodeTypeIcon } from './PlanningNodeTypeIcon';
export type { PlanningNodeTypeIconProps, PlanningNodeType } from './PlanningNodeTypeIcon';

// FE-P1 new primitives
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card';
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';
export { Label } from './Label';
export type { LabelProps } from './Label';
export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';
export { Switch } from './Switch';
export type { SwitchProps } from './Switch';
export { SecretField } from './SecretField';
export type { SecretFieldProps } from './SecretField';
