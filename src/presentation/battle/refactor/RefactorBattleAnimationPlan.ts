import type { RefactorBattleView } from './RefactorBattleRuntime';
import {
  actionPresentationProfileForCardCategory,
  type AnimatedActionPresentationProfile,
} from './ActionPresentationSequencer';

export type RefactorActionMotion = 'ACTION' | 'REACTION' | 'ENEMY_ACTION';

export interface RefactorBattleAnimationPlan {
  actorId: string;
  targetId?: string;
  targetIds: readonly string[];
  hitCount: number;
  motion: RefactorActionMotion;
  profileId: AnimatedActionPresentationProfile;
  useAttackPose: boolean;
  useSlashFx: boolean;
}

export function buildPlayerActionAnimationPlan(
  view: RefactorBattleView,
): RefactorBattleAnimationPlan | undefined {
  if (!view.activeActorId || !view.canConfirm) return undefined;
  const selected = view.hand.find((card) => card.selected);
  if (!selected) return undefined;

  const targetId = view.preview?.targetId;
  const targetIds = targetId ? [targetId] : [];
  if (selected.category === 'guard') {
    return {
      actorId: view.activeActorId,
      targetId,
      targetIds,
      hitCount: 1,
      motion: 'REACTION',
      profileId: 'guard',
      useAttackPose: false,
      useSlashFx: false,
    };
  }

  const controlPresentation = selected.category === 'disruption';
  return {
    actorId: view.activeActorId,
    targetId,
    targetIds,
    hitCount: 1,
    motion: 'ACTION',
    profileId: actionPresentationProfileForCardCategory(selected.category),
    useAttackPose: !controlPresentation,
    useSlashFx: Boolean(targetId) && !controlPresentation,
  };
}

export function buildEnemyActionAnimationPlan(
  view: RefactorBattleView,
): RefactorBattleAnimationPlan | undefined {
  if (view.phase !== 'ENEMY_EXECUTING' || !view.activeActorId || !view.canResolveEnemy) {
    return undefined;
  }

  const intent = view.enemyIntents.find((candidate) => candidate.enemyId === view.activeActorId)
    ?? view.enemyIntents[0];
  if (intent?.presentationProfile === 'none') return undefined;

  const targetIds = intent ? [...intent.targetIds] : [];
  return {
    actorId: view.activeActorId,
    targetId: targetIds[0],
    targetIds,
    hitCount: intent?.hitCount ?? 1,
    motion: 'ENEMY_ACTION',
    profileId: intent?.presentationProfile ?? 'enemy-light',
    useAttackPose: false,
    useSlashFx: targetIds.length > 0,
  };
}
