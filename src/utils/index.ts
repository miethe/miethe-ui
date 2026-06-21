// @miethe/ui — utils submodule
export {
  parseFrontmatter,
  stripFrontmatter,
  detectFrontmatter,
} from './frontmatter';
export {
  extractFirstParagraph,
  extractFolderReadme,
} from './readme-utils';
export type { ReadmeSearchEntry } from './readme-utils';
export { markStart, markEnd } from './perf-marks';
export {
  typeBarColors,
  TYPE_BAR_FALLBACK,
  getTypeBarColor,
  artifactTypeCardTints,
  getCardTint,
} from './type-colors';
