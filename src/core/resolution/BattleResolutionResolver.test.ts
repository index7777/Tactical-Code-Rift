import { describe, expect, it } from 'vitest';
import type { RefactorCardInstance } from '../cards/RefactorCardTypes';
import { createIntentState } from '../intents/IntentState';
import { createControlResilience } from '../status/ControlResilience';
import { createBattleTimeline } from '../timeline/BattleTimeline';
import {
  resolveBattleAction,
  type BattleResolutionState,
} from './BattleResolutionResolver';

function card(
  instanceId: string,
  category: RefactorCardInstance['definition']['category'],
  delay: number,
  effect: RefactorCardInstance['definition']['effect'],
): RefactorCardInstance {
  return {
    instanceId,
    definition: {
      id: instanceId,
      name: instanceId,
      category,
      delay,
      targetRule: 'enemy',
      effect,
    },
  };
}

function makeState(overrides: Partial<BattleResolutionState> = {}): BattleResolutionState {
  return {
    timeline: createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'chikage', team: 'player', nextActionAt: 5, tieBreaker: 1 },
    ]),
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 32, maxHp: 40 },
      'ghost-fire': { actorId: 'ghost-fire', hp: 39, maxHp: 52 },
      chikage: { actorId: 'chikage', hp: 40, maxHp: 40 },
    },
    intentByEnemyId: {
      'ghost-fire': createIntentState({
        id: 'ghost-fire-rush',
        enemyId: 'ghost-fire',
        kind: 'normal',
        name: '鬼火疾走',
        targetIds: ['rin'],
        damage: 20,
        delay: 5,
        canDelay: true,
        canInterrupt: true,
        canGuard: true,
        canRedirect: true,
        statusEffects: ['burn'],
      }),
    },
    resilienceByEnemyId: {
      'ghost-fire': createControlResilience(0, 0),
    },
    breakWindows: [],
    nextBreakWindowSequence: 1,
    ...overrides,
  };
}

describe('BattleResolutionResolver', () => {
  it('commits normal damage and schedules the active actor by card Delay', () => {
    const state = makeState();
    const result = resolveBattleAction({
      state,
      activeActorId: 'rin',
      card: card('quick', 'quick', 3, { damage: 8 }),
      targetId: 'ghost-fire',
    });

    expect(result.damageDealt).toBe(8);
    expect(result.state.vitalsByActorId['ghost-fire']?.hp).toBe(31);
    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(3);
    expect(result.state.timeline.currentTime).toBe(0);
  });

  it('commits Delay movement and the post-control temporary resilience from Preview', () => {
    const result = resolveBattleAction({
      state: makeState(),
      activeActorId: 'rin',
      card: card('delay', 'disruption', 4, { delayTarget: 2 }),
      targetId: 'ghost-fire',
    });

    expect(result.preview.actualDelay).toBe(2);
    expect(result.preview.crossedPlayerActorIds).toEqual(['chikage']);
    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(6);
    expect(result.state.resilienceByEnemyId['ghost-fire']).toEqual({ base: 0, temporary: 1 });
  });

  it('uses imbalance to ignore one resilience and consumes the window', () => {
    const state = makeState({
      resilienceByEnemyId: { 'ghost-fire': createControlResilience(1, 0) },
      breakWindows: [
        { id: 'imbalance-1', targetId: 'ghost-fire', kind: 'imbalance', consumed: false },
      ],
    });

    const result = resolveBattleAction({
      state,
      activeActorId: 'rin',
      card: card('delay', 'disruption', 4, { delayTarget: 2 }),
      targetId: 'ghost-fire',
    });

    expect(result.preview.ignoredResilience).toBe(1);
    expect(result.preview.actualDelay).toBe(2);
    expect(result.state.breakWindows).toEqual([]);
    expect(result.state.resilienceByEnemyId['ghost-fire']).toEqual({ base: 1, temporary: 1 });
  });

  it('commits Interrupt as hard-stagger without moving the target current node', () => {
    const result = resolveBattleAction({
      state: makeState(),
      activeActorId: 'rin',
      card: card('interrupt', 'disruption', 6, { interrupt: true }),
      targetId: 'ghost-fire',
    });

    expect(result.preview.intentChange).toBe('interrupted');
    expect(result.state.intentByEnemyId['ghost-fire']?.kind).toBe('hard-stagger');
    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(4);
  });

  it('consumes armor-break and commits the same +50% base damage shown by Preview', () => {
    const state = makeState({
      breakWindows: [
        { id: 'armor-1', targetId: 'ghost-fire', kind: 'armor-break', consumed: false },
      ],
    });

    const result = resolveBattleAction({
      state,
      activeActorId: 'rin',
      card: card('heavy', 'heavy', 7, { damage: 18 }),
      targetId: 'ghost-fire',
    });

    expect(result.preview.baseDamage).toBe(18);
    expect(result.preview.breakBonusDamage).toBe(9);
    expect(result.damageDealt).toBe(27);
    expect(result.state.vitalsByActorId['ghost-fire']?.hp).toBe(12);
    expect(result.state.breakWindows).toEqual([]);
  });

  it('creates a deterministic break window id on commit', () => {
    const result = resolveBattleAction({
      state: makeState(),
      activeActorId: 'rin',
      card: card('break', 'break', 4, { damage: 5, createBreakWindow: 'armor-break' }),
      targetId: 'ghost-fire',
    });

    expect(result.createdBreakWindowId).toBe('bw:1:armor-break:ghost-fire');
    expect(result.state.breakWindows).toContainEqual({
      id: 'bw:1:armor-break:ghost-fire',
      targetId: 'ghost-fire',
      kind: 'armor-break',
      consumed: false,
    });
    expect(result.state.nextBreakWindowSequence).toBe(2);
  });

  it('commits lethal deletion across HP, Timeline, Intent, and target break windows', () => {
    const state = makeState({
      vitalsByActorId: {
        rin: { actorId: 'rin', hp: 32, maxHp: 40 },
        'ghost-fire': { actorId: 'ghost-fire', hp: 27, maxHp: 52 },
        chikage: { actorId: 'chikage', hp: 40, maxHp: 40 },
      },
      breakWindows: [
        { id: 'armor-1', targetId: 'ghost-fire', kind: 'armor-break', consumed: false },
      ],
    });

    const result = resolveBattleAction({
      state,
      activeActorId: 'rin',
      card: card('heavy', 'heavy', 7, { damage: 18 }),
      targetId: 'ghost-fire',
    });

    expect(result.lethal).toBe(true);
    expect(result.state.vitalsByActorId['ghost-fire']?.hp).toBe(0);
    expect(result.state.timeline.entries.some((entry) => entry.actorId === 'ghost-fire')).toBe(false);
    expect(result.state.intentByEnemyId['ghost-fire']).toBeUndefined();
    expect(result.state.breakWindows).toEqual([]);
  });

  it('keeps Preview and committed target Timeline/damage outcomes in parity', () => {
    const result = resolveBattleAction({
      state: makeState(),
      activeActorId: 'rin',
      card: card('delay-hit', 'disruption', 4, { damage: 5, delayTarget: 2 }),
      targetId: 'ghost-fire',
    });

    expect(result.damageDealt).toBe(result.preview.finalDamage);
    expect(result.state.vitalsByActorId['ghost-fire']?.hp).toBe(result.preview.hpAfter);
    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt)
      .toBe(result.preview.targetTimelineTo);
  });

  it('rejects a non-front actor', () => {
    expect(() => resolveBattleAction({
      state: makeState(),
      activeActorId: 'chikage',
      card: card('quick', 'quick', 3, { damage: 8 }),
      targetId: 'ghost-fire',
    })).toThrow('actor is not the next timeline actor: chikage');
  });

  it('does not mutate the source battle state', () => {
    const state = makeState({
      breakWindows: [
        { id: 'armor-1', targetId: 'ghost-fire', kind: 'armor-break', consumed: false },
      ],
    });
    const before = structuredClone(state);

    resolveBattleAction({
      state,
      activeActorId: 'rin',
      card: card('heavy', 'heavy', 7, { damage: 18 }),
      targetId: 'ghost-fire',
    });

    expect(state).toEqual(before);
  });
});
