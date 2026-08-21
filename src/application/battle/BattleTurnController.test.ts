import { describe, expect, it } from 'vitest';
import { createRefactorDeck } from '../../core/cards/RefactorDeck';
import type { RefactorCardDefinition } from '../../core/cards/RefactorCardTypes';
import { createIntentState } from '../../core/intents/IntentState';
import { createControlResilience } from '../../core/status/ControlResilience';
import { createBattleTimeline, sortTimelineActors } from '../../core/timeline/BattleTimeline';
import {
  BattleTurnController,
  type BattlePreviewContextState,
} from './BattleTurnController';

const cardDefinitions: RefactorCardDefinition[] = [
  { id: 'quick-a', name: '快斬 A', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'quick-b', name: '快斬 B', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'heavy-a', name: '重斬 A', category: 'heavy', delay: 7, targetRule: 'enemy', effect: { damage: 18 } },
  { id: 'heavy-b', name: '重斬 B', category: 'heavy', delay: 7, targetRule: 'enemy', effect: { damage: 18 } },
  { id: 'break-a', name: '破甲 A', category: 'break', delay: 4, targetRule: 'enemy', effect: { damage: 5, createBreakWindow: 'armor-break' } },
  { id: 'break-b', name: '破甲 B', category: 'break', delay: 4, targetRule: 'enemy', effect: { damage: 5, createBreakWindow: 'armor-break' } },
  { id: 'delay-a', name: '牽制 A', category: 'disruption', delay: 4, targetRule: 'enemy', effect: { delayTarget: 2 } },
  { id: 'delay-b', name: '牽制 B', category: 'disruption', delay: 4, targetRule: 'enemy', effect: { delayTarget: 2 } },
];

function previewContext(ghostFireHp = 39): BattlePreviewContextState {
  return {
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
  };
}

function makeController(definitions = cardDefinitions, context = previewContext()) {
  return new BattleTurnController(
    createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'chikage', team: 'player', nextActionAt: 7, tieBreaker: 1 },
    ]),
    createRefactorDeck(definitions, 42),
    context,
  );
}

describe('BattleTurnController shared-hand wiring', () => {
  it('lets only the timeline-front player commit one card from the shared hand', () => {
    const controller = makeController();
    expect(controller.startNextActor()).toMatchObject({
      phase: 'PLAYER_IDLE',
      activeActor: { actorId: 'rin' },
    });

    const before = controller.deck();
    const selected = before.hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    controller.confirmPlayerCard();

    const afterCommit = controller.deck();
    expect(afterCommit.hand).toHaveLength(5);
    expect(afterCommit.hand.some((card) => card.instanceId === selected.instanceId)).toBe(false);
    expect(afterCommit.discardPile.some((card) => card.instanceId === selected.instanceId)).toBe(true);

    controller.beginResolution();
    const timeline = controller.completeResolution();
    expect(timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(selected.definition.delay);

    const expectedNext = sortTimelineActors(timeline)[0]!;
    expect(controller.startNextActor()).toMatchObject({
      activeActor: { actorId: expectedNext.actorId },
      phase: expectedNext.team === 'player' ? 'PLAYER_IDLE' : 'ENEMY_EXECUTING',
    });
  });

  it('rejects selecting a card that is not in the current shared hand', () => {
    const controller = makeController();
    controller.startNextActor();
    const outsideHand = controller.deck().drawPile[0]!;
    expect(() => controller.selectPlayerCard(outsideHand.instanceId)).toThrow(
      `card is not in shared hand: ${outsideHand.instanceId}`,
    );
  });

  it('requires a target before confirming enemy-target cards', () => {
    const controller = makeController();
    controller.startNextActor();
    const selected = controller.deck().hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    expect(() => controller.confirmPlayerCard()).toThrow(`card requires a target: ${selected.instanceId}`);
  });

  it('does not wait for the other party members after one card resolves', () => {
    const controller = makeController();
    controller.startNextActor();
    const selected = controller.deck().hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    controller.confirmPlayerCard();
    controller.beginResolution();
    const timeline = controller.completeResolution();

    expect(controller.timeline().entries.find((entry) => entry.actorId === 'chikage')?.nextActionAt).toBe(7);
    const expectedNext = sortTimelineActors(timeline)[0]!;
    expect(controller.startNextActor().activeActor?.actorId).toBe(expectedNext.actorId);
  });

  it('dispatches zero to two cards as a complete Delay 3 action', () => {
    const controller = makeController();
    controller.startNextActor();
    const before = controller.deck();
    const selectedIds = before.hand.slice(0, 2).map((card) => card.instanceId);
    const untouchedIds = before.hand.slice(2).map((card) => card.instanceId);

    expect(controller.dispatch(selectedIds).phase).toBe('EXECUTING');
    const afterDispatch = controller.deck();
    expect(afterDispatch.hand).toHaveLength(5);
    for (const id of selectedIds) {
      expect(afterDispatch.hand.some((card) => card.instanceId === id)).toBe(false);
      expect(afterDispatch.discardPile.some((card) => card.instanceId === id)).toBe(true);
    }
    for (const id of untouchedIds) {
      expect(afterDispatch.hand.some((card) => card.instanceId === id)).toBe(true);
    }

    controller.beginResolution();
    const timeline = controller.completeResolution();
    expect(timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(3);
  });

  it('allows dispatch with zero exchanged cards but still spends the action', () => {
    const controller = makeController();
    controller.startNextActor();
    const handBefore = controller.deck().hand.map((card) => card.instanceId);

    controller.dispatch([]);
    expect(controller.deck().hand.map((card) => card.instanceId)).toEqual(handBefore);
    controller.beginResolution();
    expect(controller.completeResolution().entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(3);
  });

  it('keeps execution irreversible once a card has been committed', () => {
    const controller = makeController();
    controller.startNextActor();
    const selected = controller.deck().hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    controller.confirmPlayerCard();

    expect(controller.cancelPlayerStep().phase).toBe('EXECUTING');
  });

  it('requires enemy delay explicitly and does not touch the shared hand', () => {
    const controller = new BattleTurnController(
      createBattleTimeline([
        { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 2, tieBreaker: 10 },
        { actorId: 'rin', team: 'player', nextActionAt: 5, tieBreaker: 0 },
      ]),
      createRefactorDeck(cardDefinitions, 7),
    );
    const handBefore = controller.deck().hand.map((card) => card.instanceId);

    expect(controller.startNextActor().phase).toBe('ENEMY_EXECUTING');
    controller.beginResolution();
    expect(() => controller.completeResolution()).toThrow('enemy resolution requires an action delay');
    const timeline = controller.completeResolution(4);

    expect(timeline.currentTime).toBe(2);
    expect(timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(6);
    expect(controller.deck().hand.map((card) => card.instanceId)).toEqual(handBefore);
  });
});

describe('BattleTurnController target preview wiring', () => {
  it('exposes resolver output for a delay card without mutating the real timeline', () => {
    const disruptionOnly: RefactorCardDefinition[] = Array.from({ length: 6 }, (_, index) => ({
      id: `delay-${index}`,
      name: `牽制 ${index}`,
      category: 'disruption',
      delay: 4,
      targetRule: 'enemy',
      effect: { delayTarget: 2 },
    }));
    const controller = makeController(disruptionOnly);
    controller.startNextActor();
    const selected = controller.deck().hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    controller.previewPlayerTarget('ghost-fire');

    expect(controller.preview()).toMatchObject({
      targetId: 'ghost-fire',
      requestedDelay: 2,
      actualDelay: 2,
      targetTimelineFrom: 4,
      targetTimelineTo: 6,
      intentChange: 'moved',
    });
    expect(controller.timeline().entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(4);
  });

  it('exposes lethal deletion preview', () => {
    const heavyOnly: RefactorCardDefinition[] = Array.from({ length: 6 }, (_, index) => ({
      id: `heavy-${index}`,
      name: `重斬 ${index}`,
      category: 'heavy',
      delay: 7,
      targetRule: 'enemy',
      effect: { damage: 18 },
    }));
    const controller = makeController(heavyOnly, previewContext(10));
    controller.startNextActor();
    controller.selectPlayerCard(controller.deck().hand[0]!.instanceId);
    controller.previewPlayerTarget('ghost-fire');

    expect(controller.preview()).toMatchObject({
      lethal: true,
      hpBefore: 10,
      hpAfter: 0,
      intentChange: 'deleted',
    });
    expect(controller.preview()!.predictedTimeline.entries.some((entry) => entry.actorId === 'ghost-fire')).toBe(false);
  });

  it('returns a defensive clone of preview output', () => {
    const controller = makeController();
    controller.startNextActor();
    controller.selectPlayerCard(controller.deck().hand[0]!.instanceId);
    controller.previewPlayerTarget('ghost-fire');

    const external = controller.preview()!;
    external.predictedTimeline.entries.length = 0;
    external.crossedPlayerActorIds.push('fake');

    expect(controller.preview()!.predictedTimeline.entries.length).toBeGreaterThan(0);
    expect(controller.preview()!.crossedPlayerActorIds).not.toContain('fake');
  });

  it('clears stale preview when changing card or cancelling', () => {
    const controller = makeController();
    controller.startNextActor();
    const [first, second] = controller.deck().hand;
    controller.selectPlayerCard(first!.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    expect(controller.preview()).toBeDefined();

    controller.cancelPlayerStep();
    expect(controller.preview()).toBeUndefined();
    controller.selectPlayerCard(second!.instanceId);
    expect(controller.preview()).toBeUndefined();
  });

  it('requires a successful resolver preview before confirming a targeted card', () => {
    const controller = new BattleTurnController(
      createBattleTimeline([
        { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
        { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      ]),
      createRefactorDeck(cardDefinitions, 42),
    );
    controller.startNextActor();
    const selected = controller.deck().hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    expect(() => controller.previewPlayerTarget('ghost-fire')).toThrow('battle preview context is not configured');
    expect(() => controller.confirmPlayerCard()).toThrow(`card requires a resolved target preview: ${selected.instanceId}`);
  });

  it('clears preview on confirm without applying the predicted target mutation', () => {
    const controller = makeController();
    controller.startNextActor();
    const selected = controller.deck().hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    const targetBefore = controller.timeline().entries.find((entry) => entry.actorId === 'ghost-fire')!.nextActionAt;

    controller.confirmPlayerCard();
    expect(controller.preview()).toBeUndefined();
    expect(controller.timeline().entries.find((entry) => entry.actorId === 'ghost-fire')!.nextActionAt).toBe(targetBefore);
  });

  it('uses a newly supplied preview context for the next preview', () => {
    const controller = makeController();
    controller.startNextActor();
    const selected = controller.deck().hand[0]!;
    controller.selectPlayerCard(selected.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    expect(controller.preview()!.hpBefore).toBe(39);

    controller.cancelPlayerStep();
    controller.setPreviewContext(previewContext(12));
    controller.selectPlayerCard(selected.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    expect(controller.preview()!.hpBefore).toBe(12);
  });
});
