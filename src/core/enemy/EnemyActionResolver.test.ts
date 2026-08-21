import { describe, expect, it } from 'vitest';
import { createIntentState, createHardStaggerIntent } from '../intents/IntentState';
import type { BattleResolutionState } from '../resolution/BattleResolutionResolver';
import { createBreakWindow } from '../status/BreakWindow';
import { createControlResilience } from '../status/ControlResilience';
import { createBattleTimeline } from '../timeline/BattleTimeline';
import { resolveEnemyAction } from './EnemyActionResolver';

function normalIntent(overrides: Partial<ReturnType<typeof createIntentState>> = {}) {
  return createIntentState({
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
    ...overrides,
  });
}

function nextIntent(delay = 6) {
  return createIntentState({
    id: 'ghost-fire-charge',
    enemyId: 'ghost-fire',
    kind: 'normal',
    name: '聚火',
    targetIds: [],
    delay,
    canDelay: true,
    canInterrupt: false,
    canGuard: false,
    canRedirect: false,
    statusEffects: [],
  });
}

function makeState(intent = normalIntent()): BattleResolutionState {
  return {
    timeline: createBattleTimeline([
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'rin', team: 'player', nextActionAt: 7, tieBreaker: 0 },
      { actorId: 'chikage', team: 'player', nextActionAt: 9, tieBreaker: 1 },
      { actorId: 'stone-demon', team: 'enemy', nextActionAt: 12, tieBreaker: 11 },
    ]),
    vitalsByActorId: {
      'ghost-fire': { actorId: 'ghost-fire', hp: 52, maxHp: 52 },
      rin: { actorId: 'rin', hp: 32, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 40, maxHp: 40 },
      'stone-demon': { actorId: 'stone-demon', hp: 65, maxHp: 65 },
    },
    intentByEnemyId: {
      'ghost-fire': intent,
      'stone-demon': createIntentState({
        id: 'stone-smash',
        enemyId: 'stone-demon',
        kind: 'normal',
        name: '碎擊',
        targetIds: ['rin'],
        damage: 16,
        delay: 6,
        canDelay: true,
        canInterrupt: false,
        canGuard: true,
        canRedirect: true,
        statusEffects: [],
      }),
    },
    resilienceByEnemyId: {
      'ghost-fire': createControlResilience(1, 2),
      'stone-demon': createControlResilience(1, 0),
    },
    breakWindows: [
      createBreakWindow('bw:1:armor-break:ghost-fire', 'ghost-fire', 'armor-break'),
      createBreakWindow('bw:2:imbalance:stone-demon', 'stone-demon', 'imbalance'),
    ],
    nextBreakWindowSequence: 3,
  };
}

describe('resolveEnemyAction', () => {
  it('commits normal intent damage and reveals/schedules the next intent', () => {
    const result = resolveEnemyAction({
      state: makeState(),
      enemyId: 'ghost-fire',
      nextIntent: nextIntent(6),
    });

    expect(result.successfulAction).toBe(true);
    expect(result.damageByTargetId.rin).toBe(20);
    expect(result.state.vitalsByActorId.rin?.hp).toBe(12);
    expect(result.state.intentByEnemyId['ghost-fire']?.id).toBe('ghost-fire-charge');
    expect(result.state.timeline.currentTime).toBe(4);
    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(10);
  });

  it('removes a defeated target from the timeline while preserving hp=0 vitals', () => {
    const state = makeState();
    state.vitalsByActorId.rin = { actorId: 'rin', hp: 10, maxHp: 40 };

    const result = resolveEnemyAction({ state, enemyId: 'ghost-fire', nextIntent: nextIntent() });

    expect(result.state.vitalsByActorId.rin?.hp).toBe(0);
    expect(result.defeatedTargetIds).toEqual(['rin']);
    expect(result.state.timeline.entries.some((entry) => entry.actorId === 'rin')).toBe(false);
  });

  it('resets only the acting enemy temporary resilience after a successful action', () => {
    const result = resolveEnemyAction({
      state: makeState(),
      enemyId: 'ghost-fire',
      nextIntent: nextIntent(),
    });

    expect(result.state.resilienceByEnemyId['ghost-fire']).toEqual({ base: 1, temporary: 0 });
    expect(result.state.resilienceByEnemyId['stone-demon']).toEqual({ base: 1, temporary: 0 });
  });

  it('expires only break windows targeting the enemy that successfully acted', () => {
    const result = resolveEnemyAction({
      state: makeState(),
      enemyId: 'ghost-fire',
      nextIntent: nextIntent(),
    });

    expect(result.state.breakWindows.map((window) => window.id)).toEqual([
      'bw:2:imbalance:stone-demon',
    ]);
  });

  it('treats hard-stagger as a failed action: no damage, no resilience reset, no break-window expiry', () => {
    const staggered = createHardStaggerIntent(normalIntent());
    const state = makeState(staggered);

    const result = resolveEnemyAction({
      state,
      enemyId: 'ghost-fire',
      nextIntent: nextIntent(),
    });

    expect(result.successfulAction).toBe(false);
    expect(result.damageByTargetId).toEqual({});
    expect(result.state.vitalsByActorId.rin?.hp).toBe(32);
    expect(result.state.resilienceByEnemyId['ghost-fire']).toEqual({ base: 1, temporary: 2 });
    expect(result.state.breakWindows.map((window) => window.id)).toContain('bw:1:armor-break:ghost-fire');
    expect(result.state.intentByEnemyId['ghost-fire']?.id).toBe('ghost-fire-charge');
  });

  it('uses the next revealed intent delay as the only enemy reschedule source', () => {
    const result = resolveEnemyAction({
      state: makeState(),
      enemyId: 'ghost-fire',
      nextIntent: nextIntent(3),
    });

    expect(result.state.timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(7);
  });

  it('rejects a next intent for a different enemy', () => {
    const wrong = createIntentState({
      ...nextIntent(),
      id: 'stone-next',
      enemyId: 'stone-demon',
    });

    expect(() => resolveEnemyAction({
      state: makeState(),
      enemyId: 'ghost-fire',
      nextIntent: wrong,
    })).toThrow('next intent enemy mismatch');
  });

  it('rejects hard-stagger as an AI-selected next intent', () => {
    const stagger = createHardStaggerIntent(normalIntent());
    expect(() => resolveEnemyAction({
      state: makeState(),
      enemyId: 'ghost-fire',
      nextIntent: stagger,
    })).toThrow('next enemy intent must be a normal intent');
  });

  it('requires the acting enemy to be timeline-front', () => {
    const state = makeState();
    state.timeline.entries = state.timeline.entries.map((entry) =>
      entry.actorId === 'rin' ? { ...entry, nextActionAt: 2 } : entry,
    );

    expect(() => resolveEnemyAction({
      state,
      enemyId: 'ghost-fire',
      nextIntent: nextIntent(),
    })).toThrow('enemy is not the next timeline actor');
  });

  it('does not mutate the source battle state', () => {
    const state = makeState();
    const snapshot = structuredClone(state);

    resolveEnemyAction({ state, enemyId: 'ghost-fire', nextIntent: nextIntent() });

    expect(state).toEqual(snapshot);
  });
});
