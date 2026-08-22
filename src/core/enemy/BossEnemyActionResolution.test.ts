import { describe, expect, it } from 'vitest';
import { createActionDefinition } from '../actions/ActionDefinition';
import { createIntentState } from '../intents/IntentState';
import { createGuardReaction } from '../reactions/GuardState';
import type { BattleResolutionState } from '../resolution/BattleResolutionResolver';
import { createControlResilience } from '../status/ControlResilience';
import { createBattleTimeline } from '../timeline/BattleTimeline';
import { RAIN_BOSS_ACTIONS } from './BossEnemyActionCatalog';
import { intentStateFromEnemyAction } from './EnemyActionIntentAdapter';
import { resolveEnemyAction } from './EnemyActionResolver';

function actionNamed(name: string) {
  const action = RAIN_BOSS_ACTIONS.find((candidate) => candidate.name === name);
  if (!action) throw new Error(`missing boss action: ${name}`);
  return action;
}

function nextIntent() {
  return createIntentState({
    id: 'rain-boss:next',
    enemyId: 'rain-boss',
    kind: 'normal',
    name: '雨斬',
    targetIds: ['rin'],
    damage: 12,
    delay: 5,
    canDelay: true,
    canInterrupt: true,
    canGuard: true,
    canRedirect: true,
    statusEffects: [],
  });
}

function makeBossState(intent: ReturnType<typeof createIntentState>): BattleResolutionState {
  return {
    timeline: createBattleTimeline([
      { actorId: 'rain-boss', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'rin', team: 'player', nextActionAt: 7, tieBreaker: 0 },
      { actorId: 'chikage', team: 'player', nextActionAt: 8, tieBreaker: 1 },
      { actorId: 'oboro', team: 'player', nextActionAt: 9, tieBreaker: 2 },
      { actorId: 'mo', team: 'player', nextActionAt: 10, tieBreaker: 3 },
    ]),
    vitalsByActorId: {
      'rain-boss': { actorId: 'rain-boss', hp: 240, maxHp: 240 },
      rin: { actorId: 'rin', hp: 40, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 44, maxHp: 44 },
      oboro: { actorId: 'oboro', hp: 36, maxHp: 36 },
      mo: { actorId: 'mo', hp: 48, maxHp: 48 },
    },
    intentByEnemyId: { 'rain-boss': intent },
    resilienceByEnemyId: { 'rain-boss': createControlResilience(1, 0) },
    breakWindows: [],
    nextBreakWindowSequence: 1,
    guardByTargetId: {},
    oboroDelayUsedByEnemyId: {},
  };
}

describe('Boss enemy action runtime semantics', () => {
  it('adapts 山影連刃 as 6 damage × 2 hits without flattening it', () => {
    const intent = intentStateFromEnemyAction(actionNamed('山影連刃'), 'rain-boss', 'rin', 2);
    expect(intent).toMatchObject({ damage: 6, hitCount: 2, targetIds: ['rin'], delay: 5 });
  });

  it('adapts 驟雨橫掃 to every resolved living target', () => {
    const intent = intentStateFromEnemyAction(
      actionNamed('驟雨橫掃'),
      'rain-boss',
      ['rin', 'chikage', 'oboro', 'mo'],
      3,
    );
    expect(intent).toMatchObject({ damage: 8, targetIds: ['rin', 'chikage', 'oboro', 'mo'], delay: 7 });
  });

  it('rejects heterogeneous multi-hit descriptors instead of guessing an encoding', () => {
    const unsupported = createActionDefinition({
      id: 'rain-boss:unsupported-combo',
      owner: 'enemy',
      name: '異質連擊',
      targetMode: 'single-enemy',
      hits: [{ damage: 4 }, { damage: 8 }],
      actionDelay: 5,
      statuses: [],
      clash: { mode: 'none', tags: [] },
      telegraph: { level: 'normal' },
      ai: { weight: 1 },
      counterplay: { delayable: true, interruptible: true, guardable: true, redirectable: true },
      presentationProfile: 'enemy-heavy',
    });
    expect(() => intentStateFromEnemyAction(unsupported, 'rain-boss', 'rin', 0))
      .toThrow('heterogeneous multi-hit');
  });

  it('resolves multi-hit total damage and applies Guard once to the whole Intent', () => {
    const intent = intentStateFromEnemyAction(actionNamed('山影連刃'), 'rain-boss', 'rin', 1);
    const state = makeBossState(intent);
    state.guardByTargetId = { rin: createGuardReaction('chikage', 'rin', 0.5, 8) };

    const result = resolveEnemyAction({ state, enemyId: 'rain-boss', nextIntent: nextIntent() });

    expect(result.guardReductionByTargetId.rin).toBe(6);
    expect(result.damageByTargetId.rin).toBe(6);
    expect(result.state.vitalsByActorId.rin?.hp).toBe(34);
    expect(result.chengshiTriggered).toBe(true);
  });

  it('resolves AoE against every public target independently', () => {
    const intent = intentStateFromEnemyAction(
      actionNamed('驟雨橫掃'),
      'rain-boss',
      ['rin', 'chikage', 'oboro', 'mo'],
      2,
    );
    const result = resolveEnemyAction({
      state: makeBossState(intent),
      enemyId: 'rain-boss',
      nextIntent: nextIntent(),
    });

    expect(result.damageByTargetId).toEqual({ rin: 8, chikage: 8, oboro: 8, mo: 8 });
    expect(result.state.vitalsByActorId.rin?.hp).toBe(32);
    expect(result.state.vitalsByActorId.chikage?.hp).toBe(36);
    expect(result.state.vitalsByActorId.oboro?.hp).toBe(28);
    expect(result.state.vitalsByActorId.mo?.hp).toBe(40);
  });
});
