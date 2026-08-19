export function shouldStartJourney(_params: URLSearchParams, journeyNodeId?: string): boolean {
  return !journeyNodeId;
}
