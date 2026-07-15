/**
 * BaseArtifactModal Component — @miethe/ui primitive
 *
 * A composition-based modal foundation for artifact-focused dialogs.
 * Encapsulates the common structure: Dialog wrapper, artifact header with
 * icon resolution, tab bar navigation, and scrollable content area.
 *
 * Decoupled from SkillMeat's `Artifact` type via the generic `ModalArtifact`
 * interface. Icon resolution is opt-in via the `getTypeConfig` prop.
 *
 * @example Basic usage
 * ```tsx
 * <BaseArtifactModal
 *   artifact={{ name: 'My Skill', type: 'skill' }}
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   tabs={[
 *     { value: 'overview', label: 'Overview', icon: Info },
 *     { value: 'settings', label: 'Settings', icon: Settings },
 *   ]}
 * >
 *   <div>Tab content here</div>
 * </BaseArtifactModal>
 * ```
 */

'use client';

import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import { ArrowLeft, AlertCircle, FileText } from 'lucide-react';

import { Dialog, DialogContent } from './Dialog';
import { Tabs } from './Tabs';
import { ModalHeader } from './ModalHeader';
import { TabNavigation, type Tab } from './TabNavigation';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal artifact interface required by BaseArtifactModal.
 * Consumers pass any object that satisfies this shape — including the full
 * SkillMeat `Artifact` type, which is a structural superset.
 */
export interface ModalArtifact {
  /** Display name of the artifact */
  name: string;
  /** Artifact type string (e.g. 'skill', 'command', 'agent') */
  type: string;
  /** Optional description shown in the header */
  description?: string;
}

/** Configuration for a single artifact type — controls icon and color */
export interface ArtifactTypeConfig {
  /** Lucide icon name (e.g. 'Zap', 'Terminal', 'Bot') */
  icon?: string;
  /** Tailwind color class for the icon (e.g. 'text-yellow-500') */
  color?: string;
}

/**
 * Tab definition for the BaseArtifactModal navigation bar.
 * Re-exported from TabNavigation for convenience — consumers can use either
 * `Tab` or `ModalTab` interchangeably.
 */
export type ModalTab = Tab;

export interface BaseArtifactModalProps {
  /** The artifact to display in the modal */
  artifact: ModalArtifact;
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /**
   * Optional override for the Dialog onOpenChange callback.
   * When provided, it is called in addition to `onClose` on close.
   */
  onOpenChange?: (open: boolean) => void;
  /** Current active tab (controlled) */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tab: string) => void;
  /** Tab definitions array */
  tabs: Tab[];
  /** Optional header action buttons (right side of header) */
  headerActions?: React.ReactNode;
  /** Tab content area */
  children: React.ReactNode;
  /** Optional extra CSS classes for DialogContent */
  className?: string;
  /** Optional max-width override (default: 'max-w-5xl lg:max-w-6xl') */
  maxWidth?: string;
  /** URL to return to if navigated from another page */
  returnTo?: string;
  /** Handler for return navigation */
  onReturn?: () => void;
  /** Optional content to render between header and tabs */
  aboveTabsContent?: React.ReactNode;
  /**
   * Optional callback to resolve icon + color config for a given artifact type.
   * When not provided the component renders a generic FileText icon.
   *
   * @example
   * getTypeConfig={(type) => ARTIFACT_TYPES[type]}
   */
  getTypeConfig?: (type: string) => ArtifactTypeConfig | undefined;
}

// ============================================================================
// Component
// ============================================================================

/**
 * BaseArtifactModal — composition-based modal foundation for artifact dialogs.
 *
 * Provides:
 * - Dialog + DialogContent with standard 90vh sizing
 * - Artifact icon resolution via optional `getTypeConfig` prop
 * - ModalHeader with artifact name, description, icon, and actions slot
 * - Optional return-to-previous navigation bar
 * - TabNavigation with underline styling
 * - Children slot for tab content
 *
 * Does NOT provide:
 * - Tab content implementations (passed as children)
 * - State management (activeTab is controlled externally)
 * - Queries, mutations, or business logic
 */
export function BaseArtifactModal({
  artifact,
  open,
  onClose,
  onOpenChange,
  activeTab,
  onTabChange,
  tabs,
  headerActions,
  children,
  className,
  maxWidth,
  returnTo,
  onReturn,
  aboveTabsContent,
  getTypeConfig,
}: BaseArtifactModalProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
    if (!isOpen) {
      onClose();
    }
  };

  // Resolve artifact icon from optional config callback
  const config = getTypeConfig ? getTypeConfig(artifact.type) : undefined;
  const iconName = config?.icon ?? 'FileText';
  const IconLookup = (LucideIcons as Record<string, unknown>)[iconName] as
    | React.ComponentType<{ className?: string }>
    | undefined;
  const IconComponent = IconLookup || FileText;

  // If getTypeConfig was provided but returned nothing, show unsupported fallback
  if (getTypeConfig && !config) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <ModalHeader
            icon={AlertCircle}
            iconClassName="text-yellow-500"
            title={artifact.name}
            description={`Artifact type "${artifact.type}" is not supported.`}
          />
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[90vh] max-h-[90vh] min-h-0 flex-col overflow-hidden p-0',
          maxWidth ?? 'max-w-5xl lg:max-w-6xl',
          className
        )}
      >
        {/* Header */}
        <ModalHeader
          icon={IconComponent}
          iconClassName={config?.color}
          title={artifact.name}
          description={artifact.description}
          actions={headerActions}
        />

        {/* Return navigation */}
        {returnTo && onReturn && (
          <div className="border-b px-6 py-2">
            <button
              type="button"
              onClick={onReturn}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return to previous page
            </button>
          </div>
        )}

        {/* Optional content above tabs */}
        {aboveTabsContent}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="flex h-full min-h-0 flex-1 flex-col px-6"
        >
          <TabNavigation tabs={tabs} />
          {children}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
