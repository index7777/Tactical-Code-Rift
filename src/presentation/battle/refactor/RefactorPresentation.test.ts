import { describe, expect, it } from 'vitest';
import type { RefactorDeckState } from '../../../core/cards/RefactorCardTypes';
import { createIntentState } from '../../../core/intents/IntentState';
import type { BattlePreviewResult } from '../../../core/preview/BattlePreviewResolver';
import { createBattleTimeline } from '../../../core/timeline/BattleTimeline';
import {
  PLAYER_HOME_POSITIONS,
  REFACTOR_BATTLE_LAYOUT,
  perspectiveScaleForY,
} from './BattleActorPresenter';
import { buildEnemyIntent } from './EnemyIntentPresenter';
import { buildHandCards } from './HandPresenter';
import { buildTargetPreview } from './TargetPreviewPresenter';
import { buildTimelineNodes } from './TimelinePresenter';

function intent() {
  return createIntentState({
    id: 'ghost-rush',
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
    statusEffects: [],
  });
}

function deck(): RefactorDeckState {
  return {
    hand: Array.from({ length: 5 }, (_, index) => ({
      instanceId: `quick-${index}#1`,
      definition: {
        id: `quick-${index}`,
        name: `快斬 ${index}`,
        category: 'quick' as const,
        delay: 3,
        targetRule: 'enemy' as const,
        effect: { damage: 8 },
      },
    })),
    drawPile: [],
    discardPile: [],
    rngState: 1,
  };
}

function preview(): BattlePreviewResult {
  return {
    activeActorId: 'rin',
    targetId: 'ghost-fire',
    baseDamage: 8,
    breakBonusDamage: 0,
    specializationBonusDamage: 3,
    finalDamage: 11,
    hpBefore: 39,
    hpAfter: 28,
    lethal: false,
    requestedDelay: 0,
    actualDelay: 0,
    ignoredResilience: 0,
    oboroBonusApplied: false,
    crossedPlayerActorIds: [],
    crossedPlayerWindows: 0,
    actorNextActionAt: 3,
    targetTimelineFrom: 4,
    targetTimelineTo: 4,
    intentChange: 'none',
    consumedBreakWindowIds: [],
    predictedTimeline: createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 3, tieBreaker: 0 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
    ]),
  };
}

describe('refactor presentation foundation', () => {
  it('builds one mixed ordered timeline capped at eight nodes', () => {
    const timeline = createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 3, tieBreaker: 0 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'chikage', team: 'player', nextActionAt: 7, tieBreaker: 1 },
    ]);
    const nodes = buildTimelineNodes(timeline, { 'ghost-fire': intent() });

    expect(nodes.map((node) => node.actorId)).toEqual(['rin', 'ghost-fire', 'chikage']);
    expect(nodes[1]).toMatchObject({ intentName: '鬼火疾走', intentDamage: 20 });
    expect(buildTimelineNodes(timeline, {}, 2)).toHaveLength(2);
  });

  it('maps the shared hand without AP or mana presentation fields', () => {
    const cards = buildHandCards(deck(), 'quick-0#1');
    expect(cards).toHaveLength(5);
    expect(cards[0]).toMatchObject({ name: '快斬 0', delay: 3, selected: true });
    expect(cards[0]).not.toHaveProperty('ap');
    expect(cards[0]).not.toHaveProperty('mana');
  });

  it('passes immutable preview results through without recalculating combat values', () => {
    expect(buildTargetPreview(preview())).toEqual({
      targetId: 'ghost-fire',
      finalDamage: 11,
      hpBefore: 39,
      hpAfter: 28,
      lethal: false,
      actualDelay: 0,
      crossedPlayerWindows: 0,
      actorNextActionAt: 3,
      intentChange: 'none',
      specializationBonusDamage: 3,
    });
  });

  it('keeps four player home positions on a full-canvas battlefield with perspective scaling', () => {
    expect(PLAYER_HOME_POSITIONS.map((position) => position.actorId)).toEqual([
      'rin', 'chikage', 'oboro', 'mo',
    ]);
    expect(REFACTOR_BATTLE_LAYOUT.battlefield).toEqual({ x: 0, y: 0, width: 1280, height: 720 });
    expect(PLAYER_HOME_POSITIONS[0].perspectiveScale).toBeLessThan(PLAYER_HOME_POSITIONS[3].perspectiveScale);
    expect(perspectiveScaleForY(330)).toBeLessThan(perspectiveScaleForY(430));
  });

  it('keeps intent capability data separate from status presentation', () => {
    expect(buildEnemyIntent(intent())).toEqual({
      enemyId: 'ghost-fire',
      name: '鬼火疾走',
      targetIds: ['rin'],
      damage: 20,
      delay: 5,
      canDelay: true,
      canInterrupt: true,
      canGuard: true,
      canRedirect: true,
    });
  });
});
