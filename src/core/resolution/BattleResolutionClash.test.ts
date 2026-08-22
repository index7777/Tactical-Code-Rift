import { describe, expect, it } from 'vitest';
import type { RefactorCardInstance } from '../cards/RefactorCardTypes';
import type { ClashResolution } from '../clash/ClashResolver';
import { createIntentState } from '../intents/IntentState';
import { createControlResilience } from '../status/ControlResilience';
import { resolveBattleAction, type BattleResolutionState } from './BattleResolutionResolver';

function eligible(outcome: 'player-win' | 'draw' | 'enemy-win'): ClashResolution {
  return {
    eligible: true,
    playerScore: { base: 6, timing: 1, specialization: 0, state: 0, total: 7 },
    enemyScore: { base: 6, timing: 0, specialization: 0, state: 0, total: 6 },
    outcome,
  };
}

function quickCard(damage = 8): RefactorCardInstance {
  return {
    instanceId: 'quick-1',
    definition: {
      id: 'quick-cut',
      name: '迅切',
      category: 'quick',
      delay: 3,
      targetRule: 'enemy',
      effect: { damage },
    },
  };
}

function makeState(enemyHp = 30): BattleResolutionState {
  return {
    timeline: {
      currentTime: 0,
      entries: [
        { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
        { actorId: 'chikage', team: 'player', nextActionAt: 2, tieBreaker: 1 },
        { actorId: 'enemy', team: 'enemy', nextActionAt: 5, tieBreaker: 2 },
      ],
    },
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 40, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 44, maxHp: 44 },
      enemy: { actorId: 'enemy', hp: enemyHp, maxHp: 30 },
    },
    intentByEnemyId: {
      enemy: createIntentState({
        id: 'enemy:slash',
        enemyId: 'enemy',
        kind: 'normal',
        name: '斬擊',
        targetIds: ['rin'],
        damage: 9,
        delay: 5,
        canDelay: true,
        canInterrupt: true,
        canGuard: true,
        canRedirect: false,
        statusEffects: ['bleed'],
      }),
    },
    resilienceByEnemyId: {
      enemy: createControlResilience(0, 0),
    },
    breakWindows: [],
    nextBreakWindowSequence: 1,
  };
}

describe('BattleResolutionResolver Clash integration', () => {
  it('commits player-win full damage and hard-stagger Intent from the same preview', () => {
    const result = resolveBattleAction({
      state: makeState(),
      activeActorId: 'rin',
      card: quickCard(),
      targetId: 'enemy',
      clash: { resolution: eligible('player-win'), contestedEnemyId: 'enemy' },
    });

    expect(result.preview.clash?.consequence?.outcome).toBe('player-win');
    expect(result.damageDealt).toBe(result.preview.finalDamage);
    expect(result.damageDealt).toBe(11);
    expect(result.state.vitalsByActorId.enemy?.hp).toBe(19);
    expect(result.state.intentByEnemyId.enemy).toMatchObject({
      enemyId: 'enemy',
      kind: 'hard-stagger',
      name: '硬直',
      targetIds: [],
      delay: 5,
    });
    expect(result.state.intentByEnemyId.enemy?.damage).toBeUndefined();
  });

  it('commits draw as half final player damage and half enemy Intent without status effects', () => {
    const result = resolveBattleAction({
      state: makeState(),
      activeActorId: 'rin',
      card: quickCard(),
      targetId: 'enemy',
      clash: { resolution: eligible('draw'), contestedEnemyId: 'enemy' },
    });

    expect(result.preview.baseDamage).toBe(8);
    expect(result.preview.specializationBonusDamage).toBe(3);
    expect(result.damageDealt).toBe(5);
    expect(result.state.vitalsByActorId.enemy?.hp).toBe(25);
    expect(result.state.intentByEnemyId.enemy).toMatchObject({
      damage: 4,
      delay: 5,
      targetIds: ['rin'],
      statusEffects: [],
    });
    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(3);
  });

  it('commits enemy win with no player damage while preserving the full enemy Intent', () => {
    const state = makeState();
    const originalIntent = structuredClone(state.intentByEnemyId.enemy);
    const result = resolveBattleAction({
      state,
      activeActorId: 'rin',
      card: quickCard(),
      targetId: 'enemy',
      clash: { resolution: eligible('enemy-win'), contestedEnemyId: 'enemy' },
    });

    expect(result.damageDealt).toBe(0);
    expect(result.state.vitalsByActorId.enemy?.hp).toBe(30);
    expect(result.state.intentByEnemyId.enemy).toEqual(originalIntent);
    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(3);
  });

  it('lets guard-intercept target an ally while committing a separate enemy Intent consequence', () => {
    const guardCard: RefactorCardInstance = {
      instanceId: 'guard-1',
      definition: {
        id: 'guard-cover',
        name: '護持',
        category: 'guard',
        delay: 4,
        targetRule: 'any-ally',
        effect: { guardRatio: 0.5, guardCap: 8 },
      },
    };
    const state = makeState();
    state.timeline.entries = [
      { actorId: 'chikage', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'rin', team: 'player', nextActionAt: 2, tieBreaker: 1 },
      { actorId: 'enemy', team: 'enemy', nextActionAt: 5, tieBreaker: 2 },
    ];

    const result = resolveBattleAction({
      state,
      activeActorId: 'chikage',
      card: guardCard,
      targetId: 'rin',
      clash: { resolution: eligible('draw'), contestedEnemyId: 'enemy' },
    });

    expect(result.preview.createdGuardReaction).toMatchObject({
      protectorId: 'chikage',
      targetId: 'rin',
      guardRatio: 0.25,
      guardCap: 4,
    });
    expect(result.state.guardByTargetId?.rin).toMatchObject({ guardRatio: 0.25, guardCap: 4 });
    expect(result.state.intentByEnemyId.enemy?.damage).toBe(4);
  });

  it('lets lethal cleanup remove the contested enemy even after player-win cancellation', () => {
    const result = resolveBattleAction({
      state: makeState(10),
      activeActorId: 'rin',
      card: quickCard(20),
      targetId: 'enemy',
      clash: { resolution: eligible('player-win'), contestedEnemyId: 'enemy' },
    });

    expect(result.lethal).toBe(true);
    expect(result.state.vitalsByActorId.enemy?.hp).toBe(0);
    expect(result.state.intentByEnemyId.enemy).toBeUndefined();
    expect(result.state.timeline.entries.some((entry) => entry.actorId === 'enemy')).toBe(false);
  });

  it('does not mutate caller-owned state or Clash resolution', () => {
    const state = makeState();
    const resolution = eligible('draw');
    const stateSnapshot = structuredClone(state);
    const resolutionSnapshot = structuredClone(resolution);

    resolveBattleAction({
      state,
      activeActorId: 'rin',
      card: quickCard(),
      targetId: 'enemy',
      clash: { resolution, contestedEnemyId: 'enemy' },
    });

    expect(state).toEqual(stateSnapshot);
    expect(resolution).toEqual(resolutionSnapshot);
  });
});
