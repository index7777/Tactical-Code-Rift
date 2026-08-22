import type { RefactorBattleView } from './RefactorBattleRuntime';
import {
  actionPresentationProfileForCardCategory,
  type AnimatedActionPresentationProfile,
} from './ActionPresentationSequencer';

export type RefactorActionMotion = 'ACTION' | 'REACTION' | 'ENEMY_ACTION';

export interface RefactorBattleAnimationPlan {
  actorId: string;
  targetId?: string;
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
  if (selected.category === 'guard') {
    return {
      actorId: view.activeActorId,
      targetId,
      motion: 'REACTION',
      profileId: 'guard',
      useAttackPose: false,
      useSlashFx: false,
    };
  }

  return {
    actorId: view.activeActorId,
    targetId,
    motion: 'ACTION',
    profileId: actionPresentationProfileForCardCategory(selected.category),
    useAttackPose: true,
    useSlashFx: Boolean(targetId),
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

  return {
    actorId: view.activeActorId,
    targetId: intent?.targetIds[0],
    motion: 'ENEMY_ACTION',
    profileId: 'enemy-light',
    useAttackPose: false,
    useSlashFx: Boolean(intent?.targetIds[0]),
  };
}
