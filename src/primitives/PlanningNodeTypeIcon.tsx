import {
  AlertCircle,
  BookOpen,
  FileCheck2,
  FileText,
  FolderSearch,
  Tag,
} from 'lucide-react';

/**
 * The set of planning node type identifiers supported by the planning control plane.
 * Each maps to a distinct lucide-react icon.
 */
export type PlanningNodeType =
  | 'design_spec'
  | 'prd'
  | 'implementation_plan'
  | 'progress'
  | 'context'
  | 'tracker'
  | 'report';

export interface PlanningNodeTypeIconProps {
  type: PlanningNodeType;
  /** Icon size in pixels. Defaults to 13. */
  size?: number;
  /** Additional className applied to the icon element. */
  className?: string;
}

/**
 * Reusable icon component for PlanningNodeType values. Matches the inline
 * NodeTypeIcon used in PlanningNodeDetail and PlanningGraphPanel.
 *
 * Extracted from CCDash Planning primitives (PCP-709).
 *
 * Icon map:
 * - design_spec        → FolderSearch
 * - prd                → FileText
 * - implementation_plan → FileCheck2
 * - progress           → BookOpen
 * - context            → Tag
 * - tracker            → AlertCircle
 * - report             → FileText
 * - (default)          → FileText
 *
 * @example
 * <PlanningNodeTypeIcon type="prd" size={16} className="text-blue-400" />
 */
export function PlanningNodeTypeIcon({
  type,
  size = 13,
  className = 'shrink-0 text-muted-foreground',
}: PlanningNodeTypeIconProps) {
  const p = { size, className };
  switch (type) {
    case 'design_spec':         return <FolderSearch {...p} />;
    case 'prd':                 return <FileText {...p} />;
    case 'implementation_plan': return <FileCheck2 {...p} />;
    case 'progress':            return <BookOpen {...p} />;
    case 'context':             return <Tag {...p} />;
    case 'tracker':             return <AlertCircle {...p} />;
    case 'report':              return <FileText {...p} />;
    default:                    return <FileText {...p} />;
  }
}
