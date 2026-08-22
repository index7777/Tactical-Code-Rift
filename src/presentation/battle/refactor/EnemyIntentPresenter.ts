import type { ActionPresentationProfile } from '../../../core/actions/ActionDefinition';
import type { IntentState } from '../../../core/intents/IntentState';

export interface EnemyIntentView {
  enemyId: string;
  name: string;
  targetIds: string[];
  damage?: number;
  hitCount?: number;
  delay: number;
  canDelay: boolean;
  canInterrupt: boolean;
  canGuard: boolean;
  canRedirect: boolean;
  presentationProfile?: ActionPresentationProfile;
}

export function buildEnemyIntent(intent: IntentState): EnemyIntentView {
  return {
    enemyId: intent.enemyId,
    name: intent.name,
    targetIds: [...intent.targetIds],
    damage: intent.damage,
    hitCount: intent.hitCount,
    delay: intent.delay,
    canDelay: intent.canDelay,
    canInterrupt: intent.canInterrupt,
    canGuard: intent.canGuard,
    canRedirect: intent.canRedirect,
    presentationProfile: intent.presentationProfile,
  };
}
