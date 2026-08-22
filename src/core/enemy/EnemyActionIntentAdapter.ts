import type { ActionDefinition } from '../actions/ActionDefinition';
import { createIntentState, type IntentState } from '../intents/IntentState';

export function intentStateFromEnemyAction(
  action: ActionDefinition,
  enemyId: string,
  targetIdOrIds: string | readonly string[],
  sequence: number,
): IntentState {
  if (action.owner !== 'enemy') throw new Error('Intent adapter requires an enemy action');
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error('Intent adapter sequence must be a non-negative integer');
  }

  const targetIds = Array.isArray(targetIdOrIds) ? [...targetIdOrIds] : [targetIdOrIds];
  if (targetIds.some((targetId) => !targetId)) {
    throw new Error('Intent adapter target id is required');
  }

  if (action.targetMode === 'single-enemy') {
    if (targetIds.length !== 1) {
      throw new Error(`single-target enemy action requires exactly one target: ${action.id}`);
    }
  } else if (action.targetMode === 'all-enemies') {
    if (targetIds.length < 1) {
      throw new Error(`all-opponent enemy action requires at least one target: ${action.id}`);
    }
  } else {
    throw new Error(`Intent adapter does not support target mode ${action.targetMode}: ${action.id}`);
  }

  if (action.hits.length > 1) {
    throw new Error(`Intent adapter cannot represent heterogeneous multi-hit action: ${action.id}`);
  }

  const hit = action.hits[0];
  const damage = hit?.damage;
  const hitCount = hit?.repeats;
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
    targetIds,
    damage,
    hitCount,
    delay: action.actionDelay,
    canDelay: counterplay.delayable,
    canInterrupt: counterplay.interruptible,
    canGuard: counterplay.guardable,
    canRedirect: counterplay.redirectable,
    statusEffects: action.statuses.map((status) => status.id),
  });
}
