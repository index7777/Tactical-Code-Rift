import type { ActionDefinition } from '../actions/ActionDefinition';
import { createIntentState, type IntentState } from '../intents/IntentState';

export function intentStateFromEnemyAction(
  action: ActionDefinition,
  enemyId: string,
  targetId: string,
  sequence: number,
): IntentState {
  if (action.owner !== 'enemy') throw new Error('Intent adapter requires an enemy action');
  if (action.targetMode !== 'single-enemy') {
    throw new Error(`Intent adapter only supports single-target enemy actions: ${action.id}`);
  }
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error('Intent adapter sequence must be a non-negative integer');
  }
  if (!targetId) throw new Error('Intent adapter targetId is required');

  const expandedHits = action.hits.flatMap((hit) =>
    Array.from({ length: hit.repeats ?? 1 }, () => hit.damage),
  );
  if (expandedHits.length > 1) {
    throw new Error(`Intent adapter cannot represent multi-hit action: ${action.id}`);
  }

  const damage = expandedHits[0];
  const counterplay = action.counterplay ?? {
    delayable: false,
    interruptible: false,
    guardable: false,
    redirectable: false,
  };

  return createIntentState({
    id: `${enemyId}:${sequence}:${action.id}`,
    enemyId,
    kind: 'normal',
    name: action.name,
    targetIds: [targetId],
    damage,
    delay: action.actionDelay,
    canDelay: counterplay.delayable,
    canInterrupt: counterplay.interruptible,
    canGuard: counterplay.guardable,
    canRedirect: counterplay.redirectable,
    statusEffects: action.statuses.map((status) => status.id),
  });
}
