export type RefactorViewportScaleMode = 'COVER' | 'FIT';

const DESIGN_ASPECT = 1280 / 720;
const MAX_SAFE_COVER_ASPECT = 1.95;

export function refactorViewportScaleMode(
  viewportWidth: number,
  viewportHeight: number,
): RefactorViewportScaleMode {
  if (viewportWidth <= 0 || viewportHeight <= 0) return 'FIT';
  const aspect = viewportWidth / viewportHeight;
  if (aspect < DESIGN_ASPECT) return 'FIT';
  return aspect <= MAX_SAFE_COVER_ASPECT ? 'COVER' : 'FIT';
}
