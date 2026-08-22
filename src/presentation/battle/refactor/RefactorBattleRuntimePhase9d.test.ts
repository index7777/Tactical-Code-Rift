import { describe, expect, it } from 'vitest';
import { BattleTurnController } from '../../../application/battle/BattleTurnController';
import { createRefactorDeck } from '../../../core/cards/RefactorDeck';
import type { RefactorCardDefinition } from '../../../core/cards/RefactorCardTypes';
import { createIntentState } from '../../../core/intents/IntentState';
import type { BattleResolutionState } from '../../../core/resolution/BattleResolutionResolver';
import { createControlResilience } from '../../../core/status/ControlResilience';
import { createBattleTimeline } from '../../../core/timeline/BattleTimeline';
import { RefactorBattleRuntime } from './RefactorBattleRuntime';

const enemyIntent = () => createIntentState({
  id: 'ghost-rush',
  enemyId: 'ghost-fire',
  kind: 'normal',
  name: '鬼火疾走',
  targetIds: ['rin'],
  damage: 10,
  delay: 5,
  canDelay: true,
  canInterrupt: true,
  canGuard: true,
  canRedirect: true,
  statusEffects: [],
});

function state(front: 'rin' | 'chikage' | 'ghost-fire'): BattleResolutionState {
  const times = front === 'ghost-fire'
    ? { rin: 2, chikage: 3, enemy: 0 }
    : front === 'chikage'
      ? { rin: 3, chikage: 0, enemy: 4 }
      : { rin: 0, chikage: 3, enemy: 4 };
  return {
    timeline: createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: times.rin, tieBreaker: 0 },
      { actorId: 'chikage', team: 'player', nextActionAt: times.chikage, tieBreaker: 1 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: times.enemy, tieBreaker: 10 },
    ]),
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 40, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 44, maxHp: 44 },
      'ghost-fire': { actorId: 'ghost-fire', hp: 52, maxHp: 52 },
    },
    intentByEnemyId: { 'ghost-fire': enemyIntent() },
    resilienceByEnemyId: { 'ghost-fire': createControlResilience() },
    breakWindows: [],
    nextBreakWindowSequence: 1,
    guardByTargetId: {},
    oboroDelayUsedByEnemyId: {},
  };
}

function cards(definition: Omit<RefactorCardDefinition, 'id' | 'name'>): RefactorCardDefinition[] {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `card-${index}`,
    name: `Card ${index}`,
    ...definition,
    effect: { ...definition.effect },
  }));
}

describe('RefactorBattleRuntime Phase 9d', () => {
  it('resolves an active enemy only through the injected intent provider', () => {
    const controller = new BattleTurnController(
      state('ghost-fire'),
      createRefactorDeck(cards({ category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } }), 1),
    );
    const runtime = new RefactorBattleRuntime(controller, () => enemyIntent());

    expect(runtime.startNextActor().phase).toBe('ENEMY_EXECUTING');
    const view = runtime.resolveActiveEnemyAction();

    expect(view.phase).toBe('WAITING_FOR_NEXT_ACTOR');
    expect(view.vitalsByActorId.rin?.hp).toBe(30);
    expect(view.timeline.find((node) => node.actorId === 'ghost-fire')?.nextActionAt).toBe(5);
  });

  it('refuses enemy resolution when no provider is attached', () => {
    const controller = new BattleTurnController(
      state('ghost-fire'),
      createRefactorDeck(cards({ category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } }), 1),
    );
    const runtime = new RefactorBattleRuntime(controller);
    runtime.startNextActor();
    expect(() => runtime.resolveActiveEnemyAction()).toThrow('enemy intent provider is not attached');
  });

  it('routes enemy cards only to living enemies', () => {
    const controller = new BattleTurnController(
      state('rin'),
      createRefactorDeck(cards({ category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } }), 1),
    );
    const runtime = new RefactorBattleRuntime(controller);
    runtime.startNextActor();
    const cardId = runtime.view().hand[0]!.instanceId;
    const view = runtime.selectCard(cardId);
    expect(view.targetableActorIds).toEqual(['ghost-fire']);
  });

  it('lets Chikage any-ally guard target living player actors', () => {
    const controller = new BattleTurnController(
      state('chikage'),
      createRefactorDeck(cards({ category: 'guard', delay: 4, targetRule: 'any-ally', effect: { guardRatio: 0.5, guardCap: 8 } }), 1),
    );
    const runtime = new RefactorBattleRuntime(controller);
    runtime.startNextActor();
    const cardId = runtime.view().hand[0]!.instanceId;
    let view = runtime.selectCard(cardId);
    expect(view.targetableActorIds).toEqual(['rin', 'chikage']);
    view = runtime.previewTarget('rin');
    expect(view.phase).toBe('TARGET_PREVIEW');
    expect(view.preview?.targetId).toBe('rin');
  });

  it('does not require an extra target click for self cards', () => {
    const controller = new BattleTurnController(
      state('rin'),
      createRefactorDeck(cards({ category: 'guard', delay: 4, targetRule: 'self', effect: { guardRatio: 0.5, guardCap: 8 } }), 1),
    );
    const runtime = new RefactorBattleRuntime(controller);
    runtime.startNextActor();
    const view = runtime.selectCard(runtime.view().hand[0]!.instanceId);
    expect(view.targetableActorIds).toEqual([]);
    expect(view.canConfirm).toBe(true);
  });

  it.each([0, 1, 2])('submits dispatch with %i selected cards', (count) => {
    const controller = new BattleTurnController(
      state('rin'),
      createRefactorDeck(cards({ category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } }), 1),
    );
    const runtime = new RefactorBattleRuntime(controller);
    runtime.startNextActor();
    const selected = runtime.view().hand.slice(0, count).map((card) => card.instanceId);
    const view = runtime.dispatch(selected);
    expect(view.phase).toBe('WAITING_FOR_NEXT_ACTOR');
    expect(view.timeline.find((node) => node.actorId === 'rin')?.nextActionAt).toBe(3);
  });
});
