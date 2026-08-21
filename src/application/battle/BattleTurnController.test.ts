import { describe, expect, it } from 'vitest';
import { createBattleTimeline } from '../../core/timeline/BattleTimeline';
import { BattleTurnController } from './BattleTurnController';

function makeController() {
  return new BattleTurnController(createBattleTimeline([
    { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
    { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
    { actorId: 'chikage', team: 'player', nextActionAt: 7, tieBreaker: 1 },
  ]));
}

describe('BattleTurnController', () => {
  it('allows only the timeline-front player to make one immediate action', () => {
    const controller = makeController();
    expect(controller.startNextActor()).toMatchObject({
      phase: 'PLAYER_IDLE',
      activeActor: { actorId: 'rin' },
    });

    controller.selectPlayerAction('quick-1');
    controller.previewPlayerTarget('ghost-fire');
    controller.confirmPlayerAction();
    controller.beginResolution();
    const timeline = controller.completeResolution(5);

    expect(timeline.entries.find((entry) => entry.actorId === 'rin')?.nextActionAt).toBe(5);
    expect(controller.turn().phase).toBe('WAITING_FOR_NEXT_ACTOR');
    expect(controller.startNextActor()).toMatchObject({
      phase: 'ENEMY_EXECUTING',
      activeActor: { actorId: 'ghost-fire' },
    });
  });

  it('does not wait for other players to submit commands', () => {
    const controller = makeController();
    controller.startNextActor();
    controller.selectPlayerAction('quick-1');
    controller.confirmPlayerAction();
    controller.beginResolution();
    controller.completeResolution(5);

    expect(controller.timeline().entries.find((entry) => entry.actorId === 'chikage')?.nextActionAt).toBe(7);
    expect(controller.startNextActor().activeActor?.actorId).toBe('ghost-fire');
  });

  it('uses the same resolution path for an enemy action', () => {
    const controller = new BattleTurnController(createBattleTimeline([
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 2, tieBreaker: 10 },
      { actorId: 'rin', team: 'player', nextActionAt: 5, tieBreaker: 0 },
    ]));

    expect(controller.startNextActor().phase).toBe('ENEMY_EXECUTING');
    controller.beginResolution();
    const timeline = controller.completeResolution(4);

    expect(timeline.currentTime).toBe(2);
    expect(timeline.entries.find((entry) => entry.actorId === 'ghost-fire')?.nextActionAt).toBe(6);
    expect(controller.startNextActor().activeActor?.actorId).toBe('rin');
  });

  it('keeps execution irreversible once confirmed', () => {
    const controller = makeController();
    controller.startNextActor();
    controller.selectPlayerAction('delay-1');
    controller.previewPlayerTarget('ghost-fire');
    controller.confirmPlayerAction();

    expect(controller.cancelPlayerStep().phase).toBe('EXECUTING');
  });

  it('rejects starting another actor before the current one resolves', () => {
    const controller = makeController();
    controller.startNextActor();
    expect(() => controller.startNextActor()).toThrow('cannot start next actor during PLAYER_IDLE');
  });
});
