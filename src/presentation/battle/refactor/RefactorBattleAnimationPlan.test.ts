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
        effect: { damage: 8 },
        effectLines: ['傷害 8'],
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
  it('routes normal player cards through ACTION with their family presentation profile', () => {
    expect(buildPlayerActionAnimationPlan(baseView())).toEqual({
      actorId: 'rin',
      targetId: 'ghost-fire',
      targetIds: ['ghost-fire'],
      hitCount: 1,
      motion: 'ACTION',
      profileId: 'quick-melee',
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
          effect: { guardRatio: 0.5, guardCap: 8 },
          effectLines: ['下次直接傷害 -50%（上限 8）'],
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
      targetIds: ['rin'],
      hitCount: 1,
      motion: 'REACTION',
      profileId: 'guard',
      useAttackPose: false,
      useSlashFx: false,
    });
  });

  it('maps every non-guard player card family to the approved sequencer profile', () => {
    const expectations = [
      ['quick', 'quick-melee'],
      ['heavy', 'heavy-melee'],
      ['disruption', 'disruption'],
      ['break', 'break'],
    ] as const;

    for (const [category, profileId] of expectations) {
      const view = baseView({
        hand: [{ ...baseView().hand[0]!, category, selected: true }],
      });
      expect(buildPlayerActionAnimationPlan(view)?.profileId).toBe(profileId);
    }
  });

  it('keeps disruption non-contact by default instead of inventing melee pose or slash', () => {
    const view = baseView({
      hand: [{
        ...baseView().hand[0]!,
        instanceId: 'disruption-1',
        name: '牽制',
        category: 'disruption',
        delay: 4,
        effect: { delayTarget: 2 },
        effectLines: ['目標延遲 +2'],
        selected: true,
      }],
    });

    expect(buildPlayerActionAnimationPlan(view)).toMatchObject({
      motion: 'ACTION',
      profileId: 'disruption',
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
          effect: {},
          effectLines: [],
          selected: true,
        },
      ],
    });

    expect(buildPlayerActionAnimationPlan(view)).toEqual({
      actorId: 'rin',
      targetId: undefined,
      targetIds: [],
      hitCount: 1,
      motion: 'ACTION',
      profileId: 'quick-melee',
      useAttackPose: true,
      useSlashFx: false,
    });
  });

  it('uses enemy-light when legacy intent presentation metadata is absent', () => {
    const view = baseView({
      phase: 'ENEMY_EXECUTING',
      activeActorId: 'ghost-fire',
      canConfirm: false,
      canResolveEnemy: true,
      hand: [],
      preview: undefined,
      enemyIntents: [{
        enemyId: 'ghost-fire',
        name: '鬼火疾走',
        targetIds: ['rin'],
        damage: 20,
        delay: 5,
        canDelay: false,
        canInterrupt: false,
        canGuard: true,
        canRedirect: false,
      }],
    });

    expect(buildEnemyActionAnimationPlan(view)).toEqual({
      actorId: 'ghost-fire',
      targetId: 'rin',
      targetIds: ['rin'],
      hitCount: 1,
      motion: 'ENEMY_ACTION',
      profileId: 'enemy-light',
      useAttackPose: false,
      useSlashFx: true,
    });
  });

  it('preserves authored heavy profile, repeated contacts, and all explicit AoE targets', () => {
    const view = baseView({
      phase: 'ENEMY_EXECUTING',
      activeActorId: 'rain-boss',
      canConfirm: false,
      canResolveEnemy: true,
      hand: [],
      preview: undefined,
      enemyIntents: [{
        enemyId: 'rain-boss',
        name: '驟雨橫掃',
        targetIds: ['rin', 'chikage', 'oboro', 'mo'],
        damage: 8,
        hitCount: 2,
        delay: 7,
        canDelay: true,
        canInterrupt: true,
        canGuard: true,
        canRedirect: true,
        presentationProfile: 'enemy-heavy',
      }],
    });

    expect(buildEnemyActionAnimationPlan(view)).toMatchObject({
      actorId: 'rain-boss',
      targetId: 'rin',
      targetIds: ['rin', 'chikage', 'oboro', 'mo'],
      hitCount: 2,
      profileId: 'enemy-heavy',
    });
  });

  it('uses boss-signature when authored and suppresses hard-stagger attack choreography', () => {
    const signature = baseView({
      phase: 'ENEMY_EXECUTING',
      activeActorId: 'rain-boss',
      canConfirm: false,
      canResolveEnemy: true,
      hand: [],
      preview: undefined,
      enemyIntents: [{
        enemyId: 'rain-boss',
        name: '終雨',
        targetIds: ['rin'],
        damage: 18,
        delay: 8,
        canDelay: true,
        canInterrupt: true,
        canGuard: true,
        canRedirect: true,
        presentationProfile: 'boss-signature',
      }],
    });
    expect(buildEnemyActionAnimationPlan(signature)?.profileId).toBe('boss-signature');

    const stagger = baseView({
      phase: 'ENEMY_EXECUTING',
      activeActorId: 'rain-boss',
      canConfirm: false,
      canResolveEnemy: true,
      hand: [],
      preview: undefined,
      enemyIntents: [{
        enemyId: 'rain-boss',
        name: '硬直',
        targetIds: [],
        delay: 8,
        canDelay: false,
        canInterrupt: false,
        canGuard: false,
        canRedirect: false,
        presentationProfile: 'none',
      }],
    });
    expect(buildEnemyActionAnimationPlan(stagger)).toBeUndefined();
  });
});
