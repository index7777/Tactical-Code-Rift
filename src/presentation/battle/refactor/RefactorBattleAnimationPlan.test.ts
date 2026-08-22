import { describe, expect, it } from 'vitest';
import type { RefactorBattleView } from './RefactorBattleRuntime';
import {
  buildEnemyActionAnimationPlan,
  buildPlayerActionAnimationPlan,
} from './RefactorBattleAnimationPlan';

function baseView(overrides: Partial<RefactorBattleView> = {}): RefactorBattleView {
  return {
    phase: 'TARGET_PREVIEW',
    activeActorId: 'rin',
    timeline: [],
    hand: [
      {
        instanceId: 'card-1',
        name: '迅切',
        category: 'quick',
        delay: 3,
        targetRule: 'enemy',
        selected: true,
      },
    ],
    preview: {
      targetId: 'ghost-fire',
      finalDamage: 8,
      hpBefore: 20,
      hpAfter: 12,
      lethal: false,
      actualDelay: 0,
      crossedPlayerWindows: 0,
      actorNextActionAt: 3,
      intentChange: 'none',
      specializationBonusDamage: 0,
    },
    enemyIntents: [],
    vitalsByActorId: {},
    targetableActorIds: ['ghost-fire'],
    canConfirm: true,
    canDispatch: false,
    canResolveEnemy: false,
    ...overrides,
  };
}

describe('RefactorBattleAnimationPlan', () => {
  it('routes normal player cards through ACTION with attack pose and impact fx', () => {
    expect(buildPlayerActionAnimationPlan(baseView())).toEqual({
      actorId: 'rin',
      targetId: 'ghost-fire',
      motion: 'ACTION',
      useAttackPose: true,
      useSlashFx: true,
    });
  });

  it('routes guard through REACTION without attack slash', () => {
    const view = baseView({
      activeActorId: 'chikage',
      hand: [
        {
          instanceId: 'guard-1',
          name: '護持',
          category: 'guard',
          delay: 4,
          targetRule: 'any-ally',
          selected: true,
        },
      ],
      preview: {
        ...baseView().preview!,
        targetId: 'rin',
        finalDamage: 0,
        hpBefore: 40,
        hpAfter: 40,
      },
    });

    expect(buildPlayerActionAnimationPlan(view)).toEqual({
      actorId: 'chikage',
      targetId: 'rin',
      motion: 'REACTION',
      useAttackPose: false,
      useSlashFx: false,
    });
  });

  it('allows no-target cards to animate without inventing an impact target', () => {
    const view = baseView({
      phase: 'CARD_SELECTED',
      preview: undefined,
      hand: [
        {
          instanceId: 'self-1',
          name: '整息',
          category: 'quick',
          delay: 3,
          targetRule: 'self',
          selected: true,
        },
      ],
    });

    expect(buildPlayerActionAnimationPlan(view)).toEqual({
      actorId: 'rin',
      targetId: undefined,
      motion: 'ACTION',
      useAttackPose: true,
      useSlashFx: false,
    });
  });

  it('uses the active enemy intent target for enemy action animation', () => {
    const view = baseView({
      phase: 'ENEMY_EXECUTING',
      activeActorId: 'ghost-fire',
      canConfirm: false,
      canResolveEnemy: true,
      hand: [],
      preview: undefined,
      enemyIntents: [
        {
          enemyId: 'ghost-fire',
          name: '鬼火疾走',
          targetIds: ['rin'],
          damage: 20,
          delay: 5,
          canDelay: false,
          canInterrupt: false,
          canGuard: true,
          canRedirect: false,
        },
      ],
    });

    expect(buildEnemyActionAnimationPlan(view)).toEqual({
      actorId: 'ghost-fire',
      targetId: 'rin',
      motion: 'ENEMY_ACTION',
      useAttackPose: false,
      useSlashFx: true,
    });
  });
});
