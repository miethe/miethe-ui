/**
 * perf-marks.ts
 *
 * Lightweight Performance API wrappers for instrumenting content-viewer
 * render flows. Marks are visible in browser DevTools → Performance panel traces.
 *
 * All marks share the configurable prefix so they can be filtered as a
 * group in the DevTools User Timings lane.
 *
 * Usage:
 *   markStart('diff-viewer.render');
 *   // ... work ...
 *   markEnd('diff-viewer.render');
 */

const PREFIX = 'content-viewer';

/**
 * Place a start mark.
 * @param name  Logical name for the measurement (no prefix or suffix needed).
 */
export function markStart(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(`${PREFIX}.${name}.start`);
  }
}

/**
 * Place an end mark and record a measure between the matching start mark and
 * this end mark. If the start mark doesn't exist (e.g. the component mounted
 * before instrumentation was added) the measure call is silently skipped.
 *
 * @param name  Must match the name used in the corresponding markStart call.
 */
export function markEnd(name: string): void {
  if (typeof performance === 'undefined') return;
  const startMark = `${PREFIX}.${name}.start`;
  const endMark = `${PREFIX}.${name}.end`;
  performance.mark(endMark);
  try {
    performance.measure(`${PREFIX}.${name}`, startMark, endMark);
  } catch {
    // Start mark may not exist if component mounted before instrumentation
  }
}
