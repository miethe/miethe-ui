/**
 * @skillmeat/content-viewer — Diff Types
 *
 * Generic diff types used by DiffViewer. These mirror the SkillMeat API
 * FileDiff model but contain no domain-specific logic.
 */

/**
 * Diff information for a single file within an artifact comparison.
 */
export interface FileDiff {
  /**
   * Relative path to file within artifact
   */
  file_path: string;
  /**
   * Change status of file
   */
  status: 'added' | 'modified' | 'deleted' | 'unchanged';
  /**
   * SHA-256 hash for the left/before version (e.g. collection)
   */
  collection_hash?: string | null;
  /**
   * SHA-256 hash for the right/after version (e.g. project)
   */
  project_hash?: string | null;
  /**
   * Unified diff content (for modified files)
   */
  unified_diff?: string | null;
}
