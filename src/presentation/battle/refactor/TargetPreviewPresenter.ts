import type { ClashOutcome } from '../../../core/clash/ClashResolver';
import type { BattlePreviewWithClashResult } from '../../../core/preview/BattlePreviewWithClash';
import type { PreviewIntentChange } from '../../../core/preview/BattlePreviewResolver';

export interface TargetPreviewClashView {
  contestedEnemyId: string;
  outcome: ClashOutcome;
  playerScore: number;
  enemyScore: number;
}

export interface TargetPreviewView {
  targetId?: string;
  finalDamage: number;
  hpBefore?: number;
  hpAfter?: number;
  lethal: boolean;
  actualDelay: number;
  crossedPlayerWindows: number;
  actorNextActionAt: number;
  intentChange: PreviewIntentChange;
  specializationBonusDamage: number;
  clash?: TargetPreviewClashView;
}

export function buildTargetPreview(preview: BattlePreviewWithClashResult): TargetPreviewView {
  const clash = preview.clash?.resolution.eligible && preview.clash.contestedEnemyId
    ? {
        contestedEnemyId: preview.clash.contestedEnemyId,
        outcome: preview.clash.resolution.outcome,
        playerScore: preview.clash.resolution.playerScore.total,
        enemyScore: preview.clash.resolution.enemyScore.total,
      }
    : undefined;

  return {
    targetId: preview.targetId,
    finalDamage: preview.finalDamage,
    hpBefore: preview.hpBefore,
    hpAfter: preview.hpAfter,
    lethal: preview.lethal,
    actualDelay: preview.actualDelay,
    crossedPlayerWindows: preview.crossedPlayerWindows,
    actorNextActionAt: preview.actorNextActionAt,
    intentChange: preview.intentChange,
    specializationBonusDamage: preview.specializationBonusDamage,
    clash,
  };
}
