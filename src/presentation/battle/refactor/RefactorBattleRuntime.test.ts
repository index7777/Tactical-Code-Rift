import { describe, expect, it } from 'vitest';
import { BattleTurnController } from '../../../application/battle/BattleTurnController';
import { createRefactorDeck } from '../../../core/cards/RefactorDeck';
import type { RefactorCardDefinition } from '../../../core/cards/RefactorCardTypes';
import { createIntentState } from '../../../core/intents/IntentState';
import type { BattleResolutionState } from '../../../core/resolution/BattleResolutionResolver';
import { createControlResilience } from '../../../core/status/ControlResilience';
import { createBattleTimeline } from '../../../core/timeline/BattleTimeline';
import { RefactorBattleRuntime } from './RefactorBattleRuntime';

const quickCards: RefactorCardDefinition[] = Array.from({ length: 8 }, (_, index) => ({
  id: `quick-${index}`,
  name: `快斬 ${index}`,
  category: 'quick',
  delay: 3,
  targetRule: 'enemy',
  effect: { damage: 8 },
}));

function battleState(enemyHp = 39): BattleResolutionState {
  return {
    timeline: createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'chikage', team: 'player', nextActionAt: 7, tieBreaker: 1 },
    ]),
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 32, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 40, maxHp: 40 },
      'ghost-fire': { actorId: 'ghost-fire', hp: enemyHp, maxHp: 52 },
    },
    intentByEnemyId: {
      'ghost-fire': createIntentState({
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
      }),
    },
    resilienceByEnemyId: { 'ghost-fire': createControlResilience() },
    breakWindows: [],
    nextBreakWindowSequence: 1,
  };
}

function runtime() {
  const controller = new BattleTurnController(battleState(), createRefactorDeck(quickCards, 42));
  return { controller, runtime: new RefactorBattleRuntime(controller) };
}

describe('RefactorBattleRuntime', () => {
  it('builds Timeline, Hand, Intent and vitals from controller snapshots', () => {
    const { runtime: viewRuntime } = runtime();
    const view = viewRuntime.view();

    expect(view.timeline.map((node) => node.actorId)).toEqual(['rin', 'ghost-fire', 'chikage']);
    expect(view.hand).toHaveLength(5);
    expect(view.enemyIntents).toContainEqual(expect.objectContaining({ enemyId: 'ghost-fire', name: '鬼火疾走' }));
    expect(view.vitalsByActorId['ghost-fire']?.hp).toBe(39);
    expect(view.phase).toBe('WAITING_FOR_NEXT_ACTOR');
  });

  it('marks the selected shared-hand card and exposes authoritative target preview', () => {
    const { runtime: viewRuntime } = runtime();
    viewRuntime.startNextActor();
    const cardId = viewRuntime.view().hand[0]!.instanceId;

    let view = viewRuntime.selectCard(cardId);
    expect(view.hand.find((card) => card.instanceId === cardId)?.selected).toBe(true);
    expect(view.phase).toBe('CARD_SELECTED');

    view = viewRuntime.previewTarget('ghost-fire');
    expect(view.phase).toBe('TARGET_PREVIEW');
    expect(view.canConfirm).toBe(true);
    expect(view.preview).toMatchObject({
      targetId: 'ghost-fire',
      finalDamage: 11,
      hpAfter: 28,
      specializationBonusDamage: 3,
      actorNextActionAt: 3,
    });
  });

  it('commits through the controller and reflects HP and Timeline only after resolution', () => {
    const { controller, runtime: viewRuntime } = runtime();
    viewRuntime.startNextActor();
    const cardId = viewRuntime.view().hand[0]!.instanceId;
    viewRuntime.selectCard(cardId);
    viewRuntime.previewTarget('ghost-fire');

    let view = viewRuntime.confirmCard();
    expect(view.phase).toBe('EXECUTING');
    expect(view.vitalsByActorId['ghost-fire']?.hp).toBe(39);

    view = viewRuntime.resolveConfirmedPlayerAction();
    expect(view.phase).toBe('WAITING_FOR_NEXT_ACTOR');
    expect(view.vitalsByActorId['ghost-fire']?.hp).toBe(28);
    expect(view.timeline.find((node) => node.actorId === 'rin')?.nextActionAt).toBe(3);
    expect(controller.battle().vitalsByActorId['ghost-fire']?.hp).toBe(28);
  });

  it('clears preview on cancel and keeps presentation snapshots defensive', () => {
    const { controller, runtime: viewRuntime } = runtime();
    viewRuntime.startNextActor();
    const cardId = viewRuntime.view().hand[0]!.instanceId;
    viewRuntime.selectCard(cardId);
    let view = viewRuntime.previewTarget('ghost-fire');
    expect(view.preview).toBeDefined();

    view.vitalsByActorId['ghost-fire']!.hp = 1;
    view.timeline.length = 0;
    view = viewRuntime.cancel();

    expect(view.preview).toBeUndefined();
    expect(view.phase).toBe('CARD_SELECTED');
    expect(controller.battle().vitalsByActorId['ghost-fire']?.hp).toBe(39);
    expect(controller.battle().timeline.entries.length).toBe(3);
  });

  it('dispatches through the controller and reschedules the active actor by Delay 3', () => {
    const { runtime: viewRuntime } = runtime();
    viewRuntime.startNextActor();
    const ids = viewRuntime.view().hand.slice(0, 2).map((card) => card.instanceId);
    const view = viewRuntime.dispatch(ids);

    expect(view.phase).toBe('WAITING_FOR_NEXT_ACTOR');
    expect(view.hand).toHaveLength(5);
    expect(view.timeline.find((node) => node.actorId === 'rin')?.nextActionAt).toBe(3);
    expect(view.vitalsByActorId['ghost-fire']?.hp).toBe(39);
  });

  it('exposes a victory outcome after authoritative lethal resolution', () => {
    const controller = new BattleTurnController(battleState(10), createRefactorDeck(quickCards, 42));
    const viewRuntime = new RefactorBattleRuntime(controller);
    viewRuntime.startNextActor();
    const cardId = viewRuntime.view().hand[0]!.instanceId;
    viewRuntime.selectCard(cardId);
    viewRuntime.previewTarget('ghost-fire');
    viewRuntime.confirmCard();

    const view = viewRuntime.resolveConfirmedPlayerAction();
    expect(view.phase).toBe('BATTLE_ENDED');
    expect(view.outcome).toBe('victory');
  });
});
