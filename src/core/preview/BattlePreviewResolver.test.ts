import { describe, expect, it } from 'vitest';
import type { RefactorCardInstance } from '../cards/RefactorCardTypes';
import { createIntentState } from '../intents/IntentState';
import { createBreakWindow } from '../status/BreakWindow';
import { createControlResilience } from '../status/ControlResilience';
import { createBattleTimeline } from '../timeline/BattleTimeline';
import { resolveBattlePreview } from './BattlePreviewResolver';

function card(
  id: string,
  category: RefactorCardInstance['definition']['category'],
  delay: number,
  effect: RefactorCardInstance['definition']['effect'],
): RefactorCardInstance {
  return {
    instanceId: `${id}#1`,
    definition: { id, name: id, category, delay, targetRule: 'enemy', effect },
  };
}

function baseTimeline() {
  return createBattleTimeline([
    { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
    { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
    { actorId: 'chikage', team: 'player', nextActionAt: 7, tieBreaker: 1 },
    { actorId: 'stone-oni', team: 'enemy', nextActionAt: 10, tieBreaker: 11 },
  ]);
}

function ghostIntent(overrides: Partial<ReturnType<typeof createIntentState>> = {}) {
  return createIntentState({
    id: 'ghost-dash',
    enemyId: 'ghost-fire',
    kind: 'normal',
    name: '鬼火疾走',
    targetIds: ['chikage'],
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

function target(hp = 39) {
  return { actorId: 'ghost-fire', hp, maxHp: 52 };
}

describe('BattlePreviewResolver', () => {
  it('previews ordinary damage and the active actor next action without moving the target', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('quick', 'quick', 3, { damage: 8 }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent(),
      targetResilience: createControlResilience(),
      breakWindows: [],
    });

    expect(result.finalDamage).toBe(8);
    expect(result.hpAfter).toBe(31);
    expect(result.actorNextActionAt).toBe(3);
    expect(result.targetTimelineFrom).toBe(4);
    expect(result.targetTimelineTo).toBe(4);
    expect(result.intentChange).toBe('none');
  });

  it('consumes armor-break in preview for +50 percent base damage on heavy', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('heavy', 'heavy', 7, { damage: 18 }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent(),
      targetResilience: createControlResilience(),
      breakWindows: [createBreakWindow('armor-1', 'ghost-fire', 'armor-break')],
    });

    expect(result.baseDamage).toBe(18);
    expect(result.breakBonusDamage).toBe(9);
    expect(result.finalDamage).toBe(27);
    expect(result.consumedBreakWindowIds).toEqual(['armor-1']);
  });

  it('uses imbalance to ignore one resilience for disruption delay', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('delay', 'disruption', 4, { delayTarget: 2 }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent(),
      targetResilience: createControlResilience(1, 0),
      breakWindows: [createBreakWindow('imbalance-1', 'ghost-fire', 'imbalance')],
    });

    expect(result.requestedDelay).toBe(2);
    expect(result.ignoredResilience).toBe(1);
    expect(result.actualDelay).toBe(2);
    expect(result.consumedBreakWindowIds).toEqual(['imbalance-1']);
  });

  it('reports crossed player windows from the unified predicted timeline', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('delay', 'disruption', 4, { delayTarget: 4 }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent(),
      targetResilience: createControlResilience(),
      breakWindows: [],
    });

    expect(result.actualDelay).toBe(4);
    expect(result.targetTimelineFrom).toBe(4);
    expect(result.targetTimelineTo).toBe(8);
    expect(result.crossedPlayerActorIds).toContain('chikage');
    expect(result.crossedPlayerWindows).toBe(1);
    expect(result.intentChange).toBe('moved');
  });

  it('does not move an intent that cannot be delayed', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('delay', 'disruption', 4, { delayTarget: 3 }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent({ canDelay: false }),
      targetResilience: createControlResilience(),
      breakWindows: [],
    });

    expect(result.actualDelay).toBe(0);
    expect(result.targetTimelineTo).toBe(4);
    expect(result.intentChange).toBe('none');
  });

  it('previews interrupt as hard-stagger without moving the current enemy event', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('interrupt', 'disruption', 6, { interrupt: true }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent(),
      targetResilience: createControlResilience(),
      breakWindows: [],
    });

    expect(result.intentChange).toBe('interrupted');
    expect(result.intentBefore?.name).toBe('鬼火疾走');
    expect(result.intentAfter?.kind).toBe('hard-stagger');
    expect(result.targetTimelineTo).toBe(4);
  });

  it('keeps an uninterruptible intent unchanged', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('interrupt', 'disruption', 6, { interrupt: true }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent({ canInterrupt: false }),
      targetResilience: createControlResilience(),
      breakWindows: [],
    });

    expect(result.intentChange).toBe('none');
    expect(result.intentAfter?.name).toBe('鬼火疾走');
  });

  it('previews lethal damage by deleting the target future event and intent', () => {
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('heavy', 'heavy', 7, { damage: 18 }),
      target: target(18),
      timeline: baseTimeline(),
      targetIntent: ghostIntent(),
      targetResilience: createControlResilience(),
      breakWindows: [],
    });

    expect(result.hpAfter).toBe(0);
    expect(result.lethal).toBe(true);
    expect(result.intentChange).toBe('deleted');
    expect(result.intentAfter).toBeUndefined();
    expect(result.predictedTimeline.entries.some((entry) => entry.actorId === 'ghost-fire')).toBe(false);
  });

  it('returns a break-window creation preview instead of mutating windows', () => {
    const windows = [createBreakWindow('existing', 'stone-oni', 'armor-break')];
    const before = structuredClone(windows);
    const result = resolveBattlePreview({
      activeActorId: 'rin',
      card: card('break', 'break', 4, { damage: 5, createBreakWindow: 'armor-break' }),
      target: target(),
      timeline: baseTimeline(),
      targetIntent: ghostIntent(),
      targetResilience: createControlResilience(),
      breakWindows: windows,
    });

    expect(result.createdBreakWindow).toEqual({ targetId: 'ghost-fire', kind: 'armor-break' });
    expect(windows).toEqual(before);
  });

  it('does not mutate timeline, intent, resilience, break windows, or card', () => {
    const timeline = baseTimeline();
    const intent = ghostIntent();
    const resilience = createControlResilience(1, 1);
    const windows = [createBreakWindow('imbalance-1', 'ghost-fire', 'imbalance')];
    const selected = card('delay', 'disruption', 4, { delayTarget: 3 });
    const before = structuredClone({ timeline, intent, resilience, windows, selected });

    resolveBattlePreview({
      activeActorId: 'rin',
      card: selected,
      target: target(),
      timeline,
      targetIntent: intent,
      targetResilience: resilience,
      breakWindows: windows,
    });

    expect({ timeline, intent, resilience, windows, selected }).toEqual(before);
  });
});
