import type { BattlePreviewResult, PreviewIntentChange } from '../../../core/preview/BattlePreviewResolver';

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
}

export function buildTargetPreview(preview: BattlePreviewResult): TargetPreviewView {
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
  };
}
