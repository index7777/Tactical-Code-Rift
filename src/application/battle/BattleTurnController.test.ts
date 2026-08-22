import { describe, expect, it } from 'vitest';
import { createRefactorDeck } from '../../core/cards/RefactorDeck';
import type { RefactorCardDefinition } from '../../core/cards/RefactorCardTypes';
import { createIntentState } from '../../core/intents/IntentState';
import type { BattleResolutionState } from '../../core/resolution/BattleResolutionResolver';
import { createControlResilience } from '../../core/status/ControlResilience';
import { createBattleTimeline, sortTimelineActors } from '../../core/timeline/BattleTimeline';
import { BattleTurnController } from './BattleTurnController';

function copies(
  prefix: string,
  category: RefactorCardDefinition['category'],
  delay: number,
  effect: RefactorCardDefinition['effect'],
): RefactorCardDefinition[] {
  return Array.from({ length: 8 }, (_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix} ${index}`,
    category,
    delay,
    targetRule: 'enemy',
    effect: { ...effect },
  }));
}

const quickCards = copies('快斬', 'quick', 3, { damage: 8 });
const delayCards = copies('牽制', 'disruption', 4, { delayTarget: 2 });
const heavyCards = copies('重斬', 'heavy', 7, { damage: 18 });
const breakCards = copies('破甲', 'break', 4, { damage: 5, createBreakWindow: 'armor-break' });

function ghostFireNextIntent(delay = 4) {
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

function battleState(ghostFireHp = 39): BattleResolutionState {
  return {
    timeline: createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'chikage', team: 'player', nextActionAt: 7, tieBreaker: 1 },
    ]),
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 32, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 40, maxHp: 40 },
      'ghost-fire': { actorId: 'ghost-fire', hp: ghostFireHp, maxHp: 52 },
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
      'ghost-fire': createControlResilience(0),
    },
    breakWindows: [],
    nextBreakWindowSequence: 1,
  };
}

function makeController(
  definitions: RefactorCardDefinition[] = quickCards,
  battle: BattleResolutionState = battleState(),
) {
  return new BattleTurnController(battle, createRefactorDeck(definitions, 42));
}

function selectAndPreview(controller: BattleTurnController): string {
  controller.startNextActor();
  const cardId = controller.deck().hand[0]!.instanceId;
  controller.selectPlayerCard(cardId);
  controller.previewPlayerTarget('ghost-fire');
  return cardId;
}

function commitAndResolve(controller: BattleTurnController) {
  controller.confirmPlayerCard();
  controller.beginResolution();
  return controller.completeResolution();
}

describe('BattleTurnController authoritative resolution wiring', () => {
  it('reads preview directly from authoritative battle state', () => {
    const controller = makeController(delayCards);
    selectAndPreview(controller);

    expect(controller.preview()).toMatchObject({
      targetId: 'ghost-fire',
      requestedDelay: 2,
      actualDelay: 2,
      targetTimelineFrom: 4,
      targetTimelineTo: 6,
      intentChange: 'moved',
    });
    expect(controller.battle().timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(4);
  });

  it('commits the card on confirm but waits until resolution to mutate HP and timeline effects', () => {
    const controller = makeController(quickCards);
    const cardId = selectAndPreview(controller);
    const before = controller.battle();

    controller.confirmPlayerCard();

    expect(controller.deck().hand.some((card) => card.instanceId === cardId)).toBe(false);
    expect(controller.battle().vitalsByActorId['ghost-fire']?.hp).toBe(before.vitalsByActorId['ghost-fire']?.hp);
    expect(controller.battle().timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(0);

    controller.beginResolution();
    const after = controller.completeResolution();
    expect(after.vitalsByActorId['ghost-fire']?.hp).toBe(28);
    expect(after.timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(3);
  });

  it('commits real enemy delay and temporary resilience through resolveBattleAction', () => {
    const controller = makeController(delayCards);
    selectAndPreview(controller);
    const after = commitAndResolve(controller);

    expect(after.timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(6);
    expect(after.resilienceByEnemyId['ghost-fire']).toMatchObject({ base: 0, temporary: 1 });
    expect(after.intentByEnemyId['ghost-fire']?.id).toBe('ghost-fire-rush');
  });

  it('commits lethal deletion of timeline, intent, and target break windows', () => {
    const initial = battleState(10);
    initial.breakWindows = [
      { id: 'bw:0:imbalance:ghost-fire', targetId: 'ghost-fire', kind: 'imbalance', consumed: false },
    ];
    const controller = makeController(heavyCards, initial);
    selectAndPreview(controller);
    expect(controller.preview()?.lethal).toBe(true);

    const after = commitAndResolve(controller);
    expect(after.vitalsByActorId['ghost-fire']?.hp).toBe(0);
    expect(after.timeline.entries.some((entry) => entry.actorId === 'ghost-fire')).toBe(false);
    expect(after.intentByEnemyId['ghost-fire']).toBeUndefined();
    expect(after.breakWindows.some((window) => window.targetId === 'ghost-fire')).toBe(false);
  });

  it('creates a deterministic break window through the real resolution path', () => {
    const controller = makeController(breakCards);
    selectAndPreview(controller);
    const after = commitAndResolve(controller);

    expect(after.breakWindows).toContainEqual({
      id: 'bw:1:armor-break:ghost-fire',
      targetId: 'ghost-fire',
      kind: 'armor-break',
      consumed: false,
    });
    expect(after.nextBreakWindowSequence).toBe(2);
  });

  it('keeps preview output and battle output defensively cloned', () => {
    const controller = makeController(delayCards);
    selectAndPreview(controller);

    const preview = controller.preview()!;
    preview.predictedTimeline.entries.length = 0;
    preview.crossedPlayerActorIds.push('fake');
    const battle = controller.battle();
    battle.timeline.entries.length = 0;
    battle.vitalsByActorId['ghost-fire']!.hp = 1;

    expect(controller.preview()!.predictedTimeline.entries.length).toBeGreaterThan(0);
    expect(controller.preview()!.crossedPlayerActorIds).not.toContain('fake');
    expect(controller.battle().timeline.entries.length).toBeGreaterThan(0);
    expect(controller.battle().vitalsByActorId['ghost-fire']?.hp).toBe(39);
  });

  it('clears stale preview on cancel, confirm, and resolution boundaries', () => {
    const controller = makeController(delayCards);
    controller.startNextActor();
    const [first, second] = controller.deck().hand;
    controller.selectPlayerCard(first!.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    expect(controller.preview()).toBeDefined();

    controller.cancelPlayerStep();
    expect(controller.preview()).toBeUndefined();
    controller.selectPlayerCard(second!.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    controller.confirmPlayerCard();
    expect(controller.preview()).toBeUndefined();
    controller.beginResolution();
    expect(controller.preview()).toBeUndefined();
    controller.completeResolution();
    expect(controller.preview()).toBeUndefined();
  });

  it('dispatches zero to two cards as Delay 3 without mutating battle effects', () => {
    const controller = makeController(quickCards);
    controller.startNextActor();
    const beforeBattle = controller.battle();
    const ids = controller.deck().hand.slice(0, 2).map((card) => card.instanceId);

    controller.dispatch(ids);
    controller.beginResolution();
    const after = controller.completeResolution();

    expect(after.timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(3);
    expect(after.vitalsByActorId['ghost-fire']?.hp).toBe(beforeBattle.vitalsByActorId['ghost-fire']?.hp);
    expect(after.intentByEnemyId['ghost-fire']).toEqual(beforeBattle.intentByEnemyId['ghost-fire']);
  });

  it('continues immediately to the actual next timeline actor after one player action', () => {
    const controller = makeController(quickCards);
    selectAndPreview(controller);
    const after = commitAndResolve(controller);
    const expected = sortTimelineActors(after.timeline)[0]!;

    expect(controller.startNextActor()).toMatchObject({
      activeActor: { actorId: expected.actorId },
      phase: expected.team === 'player' ? 'PLAYER_IDLE' : 'ENEMY_EXECUTING',
    });
  });

  it('rejects a card instance that is not in the current shared hand', () => {
    const controller = makeController(quickCards);
    controller.startNextActor();
    const outsideHand = controller.deck().drawPile[0]!;
    expect(() => controller.selectPlayerCard(outsideHand.instanceId)).toThrow(
      `card is not in shared hand: ${outsideHand.instanceId}`,
    );
  });

  it('resolves the revealed enemy intent, reveals the next intent, and uses its Delay', () => {
    const enemyBattle = battleState();
    enemyBattle.timeline = createBattleTimeline([
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 2, tieBreaker: 10 },
      { actorId: 'rin', team: 'player', nextActionAt: 5, tieBreaker: 0 },
    ]);
    enemyBattle.resilienceByEnemyId['ghost-fire'] = createControlResilience(1, 2);
    enemyBattle.breakWindows = [
      { id: 'bw:1:armor-break:ghost-fire', targetId: 'ghost-fire', kind: 'armor-break', consumed: false },
    ];
    const controller = makeController(quickCards, enemyBattle);
    const handBefore = controller.deck().hand.map((card) => card.instanceId);

    expect(controller.startNextActor().phase).toBe('ENEMY_EXECUTING');
    controller.beginResolution();
    expect(() => controller.completeResolution()).toThrow('enemy resolution requires the next revealed intent');
    const after = controller.completeResolution(ghostFireNextIntent(4));

    expect(after.timeline.currentTime).toBe(2);
    expect(after.vitalsByActorId.rin?.hp).toBe(12);
    expect(after.timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(6);
    expect(after.intentByEnemyId['ghost-fire']?.id).toBe('ghost-fire-charge');
    expect(after.resilienceByEnemyId['ghost-fire']).toEqual({ base: 1, temporary: 0 });
    expect(after.breakWindows.some((window) => window.targetId === 'ghost-fire')).toBe(false);
    expect(controller.deck().hand.map((card) => card.instanceId)).toEqual(handBefore);
  });
});
