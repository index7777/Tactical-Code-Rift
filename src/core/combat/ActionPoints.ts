export const BASE_AP_RECOVERY = 2;
export const MAX_AP = 5;

export function recoverAp(remaining: number): number {
  return Math.min(MAX_AP, Math.max(0, remaining) + BASE_AP_RECOVERY);
}

export function actionApCost(previousActionsByActor: number): number {
  return previousActionsByActor === 0 ? 1 : 2;
}

export function sequenceApCost(actorIds: string[]): number {
  const counts = new Map<string, number>();
  let total = 0;
  for (const actorId of actorIds) {
    const previous = counts.get(actorId) ?? 0;
    total += actionApCost(previous);
    counts.set(actorId, previous + 1);
  }
  return total;
}
