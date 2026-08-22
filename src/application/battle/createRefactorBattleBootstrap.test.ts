import { describe, expect, it } from 'vitest';
import {
  createRefactorBattleBootstrap,
  createRefactorQaBattleState,
  REFACTOR_QA_CARD_DEFINITIONS,
} from './createRefactorBattleBootstrap';

describe('createRefactorBattleBootstrap', () => {
  it('creates four players and one enemy in the mixed timeline', () => {
    const state = createRefactorQaBattleState();
    expect(state.timeline.entries.filter((entry) => entry.team === 'player').map((entry) => entry.actorId))
      .toEqual(expect.arrayContaining(['rin', 'chikage', 'oboro', 'mo']));
    expect(state.timeline.entries.filter((entry) => entry.team === 'enemy').map((entry) => entry.actorId))
      .toContain('ghost-fire');
  });

  it('creates a five-card shared hand from all five card categories', () => {
    const controller = createRefactorBattleBootstrap();
    expect(controller.deck().hand).toHaveLength(5);
    expect(new Set(REFACTOR_QA_CARD_DEFINITIONS.map((card) => card.category)))
      .toEqual(new Set(['quick', 'heavy', 'guard', 'disruption', 'break']));
  });

  it('starts the actual timeline-front actor through the controller', () => {
    const controller = createRefactorBattleBootstrap();
    expect(controller.startNextActor()).toMatchObject({
      phase: 'PLAYER_IDLE',
      activeActor: { actorId: 'rin', team: 'player', nextActionAt: 0 },
    });
  });

  it('is deterministic for the same seed', () => {
    const first = createRefactorBattleBootstrap(42);
    const second = createRefactorBattleBootstrap(42);
    expect(first.battle()).toEqual(second.battle());
    expect(first.deck()).toEqual(second.deck());
  });
});
