import type { IntentState } from '../../../core/intents/IntentState';

export interface EnemyIntentView {
  enemyId: string;
  name: string;
  targetIds: string[];
  damage?: number;
  delay: number;
  canDelay: boolean;
  canInterrupt: boolean;
  canGuard: boolean;
  canRedirect: boolean;
}

export function buildEnemyIntent(intent: IntentState): EnemyIntentView {
  return {
    enemyId: intent.enemyId,
    name: intent.name,
    targetIds: [...intent.targetIds],
    damage: intent.damage,
    delay: intent.delay,
    canDelay: intent.canDelay,
    canInterrupt: intent.canInterrupt,
    canGuard: intent.canGuard,
    canRedirect: intent.canRedirect,
  };
}
