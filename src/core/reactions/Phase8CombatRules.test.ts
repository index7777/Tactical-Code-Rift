import { describe, expect, it } from 'vitest';
import type { RefactorCardInstance } from '../cards/RefactorCardTypes';
import { resolveEnemyAction } from '../enemy/EnemyActionResolver';
import { createIntentState } from '../intents/IntentState';
import { resolveBattlePreview } from '../preview/BattlePreviewResolver';
import {
  resolveBattleAction,
  type BattleResolutionState,
} from '../resolution/BattleResolutionResolver';
import { createControlResilience } from '../status/ControlResilience';
import { createBattleTimeline } from '../timeline/BattleTimeline';
import { createGuardReaction, resolveGuardDamage } from './GuardState';

function card(
  id: string,
  category: RefactorCardInstance['definition']['category'],
  delay: number,
  targetRule: RefactorCardInstance['definition']['targetRule'],
  effect: RefactorCardInstance['definition']['effect'],
): RefactorCardInstance {
  return {
    instanceId: `${id}:0`,
    definition: { id, name: id, category, delay, targetRule, effect },
  };
}

function intent(enemyId = 'ghost'): ReturnType<typeof createIntentState> {
  return createIntentState({
    id: `${enemyId}-strike`,
    enemyId,
    kind: 'normal',
    name: 'Strike',
    targetIds: ['rin'],
    damage: 20,
    delay: 5,
    canDelay: true,
    canInterrupt: true,
    canGuard: true,
    canRedirect: true,
    statusEffects: [],
  });
}

function nextIntent(enemyId = 'ghost'): ReturnType<typeof createIntentState> {
  return createIntentState({
    id: `${enemyId}-next`,
    enemyId,
    kind: 'normal',
    name: 'Next',
    targetIds: ['rin'],
    damage: 10,
    delay: 5,
    canDelay: true,
    canInterrupt: true,
    canGuard: true,
    canRedirect: true,
    statusEffects: [],
  });
}

function state(entries: BattleResolutionState['timeline']['entries']): BattleResolutionState {
  return {
    timeline: createBattleTimeline(entries),
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 40, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 40, maxHp: 40 },
      oboro: { actorId: 'oboro', hp: 36, maxHp: 36 },
      mo: { actorId: 'mo', hp: 44, maxHp: 44 },
      ghost: { actorId: 'ghost', hp: 60, maxHp: 60 },
    },
    intentByEnemyId: { ghost: intent() },
    resilienceByEnemyId: { ghost: createControlResilience(0) },
    breakWindows: [],
    nextBreakWindowSequence: 1,
  };
}

describe('Phase 8 guard reaction', () => {
  it('uses 50% reduction capped at 8', () => {
    const guard = createGuardReaction('rin', 'rin', 0.5, 8);
    expect(resolveGuardDamage(guard, 20)).toEqual({
      damageBefore: 20,
      damageAfter: 12,
      reduction: 8,
      consumed: true,
    });
  });

  it('lets only chikage guard another ally', () => {
    const guardCard = card('guard', 'guard', 4, 'ally', { guardRatio: 0.5, guardCap: 8 });
    const timeline = createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'chikage', team: 'player', nextActionAt: 2, tieBreaker: 1 },
    ]);
    expect(() => resolveBattlePreview({
      activeActorId: 'rin',
      card: guardCard,
      target: { actorId: 'chikage', hp: 40, maxHp: 40 },
      timeline,
      breakWindows: [],
    })).toThrow('only chikage can guard another ally');
  });

  it('commits chikage guard, reduces damage, and applies chengshi +1 without resilience', () => {
    const initial = state([
      { actorId: 'chikage', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'rin', team: 'player', nextActionAt: 10, tieBreaker: 1 },
    ]);
    initial.resilienceByEnemyId.ghost = createControlResilience(1, 2);
    const guardCard = card('guard', 'guard', 5, 'ally', { guardRatio: 0.5, guardCap: 8 });

    const guarded = resolveBattleAction({
      state: initial,
      activeActorId: 'chikage',
      card: guardCard,
      targetId: 'rin',
    }).state;
    expect(guarded.guardByTargetId?.rin).toMatchObject({ protectorId: 'chikage', targetId: 'rin' });

    const resolved = resolveEnemyAction({ state: guarded, enemyId: 'ghost', nextIntent: nextIntent() });
    expect(resolved.guardReductionByTargetId.rin).toBe(8);
    expect(resolved.damageByTargetId.rin).toBe(12);
    expect(resolved.state.vitalsByActorId.rin?.hp).toBe(28);
    expect(resolved.chengshiTriggered).toBe(true);
    expect(resolved.state.timeline.entries.find((entry) => entry.actorId === 'ghost')?.nextActionAt).toBe(10);
    expect(resolved.state.resilienceByEnemyId.ghost).toEqual({ base: 1, temporary: 0 });
    expect(resolved.state.guardByTargetId?.rin).toBeUndefined();
  });
});

describe('Phase 8 actor specialization', () => {
  it('gives rin quick +3 only when her next node still beats an enemy ahead', () => {
    const quick = card('quick', 'quick', 3, 'enemy', { damage: 8 });
    const ahead = state([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
    ]);
    const preview = resolveBattlePreview({
      activeActorId: 'rin', card: quick, target: ahead.vitalsByActorId.ghost!,
      timeline: ahead.timeline, targetIntent: ahead.intentByEnemyId.ghost,
      targetResilience: ahead.resilienceByEnemyId.ghost, breakWindows: [],
    });
    expect(preview.specializationBonusDamage).toBe(3);
    expect(preview.finalDamage).toBe(11);

    const tooLate = state([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost', team: 'enemy', nextActionAt: 2, tieBreaker: 10 },
    ]);
    expect(resolveBattlePreview({
      activeActorId: 'rin', card: quick, target: tooLate.vitalsByActorId.ghost!,
      timeline: tooLate.timeline, targetIntent: tooLate.intentByEnemyId.ghost,
      targetResilience: tooLate.resilienceByEnemyId.ghost, breakWindows: [],
    }).specializationBonusDamage).toBe(0);
  });

  it('gives oboro +1 requested delay only on the first effective delay of the enemy cycle', () => {
    const disruption = card('delay', 'disruption', 4, 'enemy', { delayTarget: 2 });
    const initial = state([
      { actorId: 'oboro', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
    ]);
    const first = resolveBattleAction({
      state: initial,
      activeActorId: 'oboro',
      card: disruption,
      targetId: 'ghost',
    });
    expect(first.preview.requestedDelay).toBe(3);
    expect(first.preview.actualDelay).toBe(3);
    expect(first.state.oboroDelayUsedByEnemyId?.ghost).toBe(true);

    const second = resolveBattleAction({
      state: first.state,
      activeActorId: 'oboro',
      card: disruption,
      targetId: 'ghost',
    });
    expect(second.preview.requestedDelay).toBe(2);
    expect(second.preview.oboroBonusApplied).toBe(false);
  });

  it('resets oboro cycle only after a successful enemy action', () => {
    const initial = state([
      { actorId: 'ghost', team: 'enemy', nextActionAt: 0, tieBreaker: 10 },
      { actorId: 'oboro', team: 'player', nextActionAt: 5, tieBreaker: 0 },
    ]);
    initial.oboroDelayUsedByEnemyId = { ghost: true };
    const resolved = resolveEnemyAction({ state: initial, enemyId: 'ghost', nextIntent: nextIntent() });
    expect(resolved.state.oboroDelayUsedByEnemyId?.ghost).toBe(false);
  });

  it('gives mo +4 on top of armor-break heavy bonus', () => {
    const heavy = card('heavy', 'heavy', 7, 'enemy', { damage: 10 });
    const initial = state([
      { actorId: 'mo', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
    ]);
    initial.breakWindows = [
      { id: 'bw:0:armor-break:ghost', targetId: 'ghost', kind: 'armor-break', consumed: false },
    ];
    const resolved = resolveBattleAction({
      state: initial,
      activeActorId: 'mo',
      card: heavy,
      targetId: 'ghost',
    });
    expect(resolved.preview.breakBonusDamage).toBe(5);
    expect(resolved.preview.specializationBonusDamage).toBe(4);
    expect(resolved.preview.finalDamage).toBe(19);
    expect(resolved.state.vitalsByActorId.ghost?.hp).toBe(41);
  });
});
