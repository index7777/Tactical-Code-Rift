const battleOnlyParams = [
  'battle',
  'scene',
  'draw-proof',
  'result-proof',
  'multi-cover-proof',
  'card-proof',
  'monster-proof',
  'boss-proof',
  'death-proof',
  'outcome-proof',
  'relay-proof',
] as const;

export function shouldStartJourney(params: URLSearchParams, journeyNodeId?: string): boolean {
  if (journeyNodeId) return false;
  if (params.has('journey')) return true;
  return !battleOnlyParams.some((key) => params.has(key));
}
