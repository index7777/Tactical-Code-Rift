import { describe, expect, it } from 'vitest';
import {
  MIN_ACTION_DELAY,
  completeActorAction,
  createBattleTimeline,
  nextTimelineActor,
  orderedTimeline,
  previewTimelineShift,
  removeTimelineActor,
  shiftTimelineActor,
} from './BattleTimeline';

const baseEntries = [
  { actorId: 'rin', team: 'player' as const, nextActionAt: 0, tieBreaker: 0 },
  { actorId: 'ghost-fire', team: 'enemy' as const, nextActionAt: 4, tieBreaker: 10 },
  { actorId: 'chikage', team: 'player' as const, nextActionAt: 7, tieBreaker: 1 },
  { actorId: 'stone-ogre', team: 'enemy' as const, nextActionAt: 10, tieBreaker: 11 },
  { actorId: 'mo', team: 'player' as const, nextActionAt: 13, tieBreaker: 3 },
];

describe('BattleTimeline', () => {
  it('orders all teams on one absolute timeline', () => {
    const state = createBattleTimeline([...baseEntries].reverse());
    expect(orderedTimeline(state).map((entry) => entry.actorId)).toEqual([
      'rin',
      'ghost-fire',
      'chikage',
      'stone-ogre',
      'mo',
    ]);
    expect(nextTimelineActor(state)?.actorId).toBe('rin');
  });

  it('uses a deterministic tie breaker instead of random ordering', () => {
    const state = createBattleTimeline([
      { actorId: 'enemy-b', team: 'enemy', nextActionAt: 5, tieBreaker: 9 },
      { actorId: 'player-a', team: 'player', nextActionAt: 5, tieBreaker: 2 },
      { actorId: 'enemy-a', team: 'enemy', nextActionAt: 5, tieBreaker: 4 },
    ]);

    expect(orderedTimeline(state).map((entry) => entry.actorId)).toEqual([
      'player-a',
      'enemy-a',
      'enemy-b',
    ]);
  });

  it('reschedules only the current actor after one action', () => {
    const state = createBattleTimeline(baseEntries);
    const result = completeActorAction(state, 'rin', 5);

    expect(result.actedAt).toBe(0);
    expect(result.nextActionAt).toBe(5);
    expect(result.state.currentTime).toBe(0);
    expect(orderedTimeline(result.state).map((entry) => `${entry.actorId}:${entry.nextActionAt}`)).toEqual([
      'ghost-fire:4',
      'rin:5',
      'chikage:7',
      'stone-ogre:10',
      'mo:13',
    ]);
  });

  it('rejects action delay below the prototype minimum', () => {
    const state = createBattleTimeline(baseEntries);
    expect(() => completeActorAction(state, 'rin', MIN_ACTION_DELAY - 1)).toThrow(
      `action delay must be at least ${MIN_ACTION_DELAY}`,
    );
  });

  it('does not allow a non-current actor to act', () => {
    const state = createBattleTimeline(baseEntries);
    expect(() => completeActorAction(state, 'chikage', 4)).toThrow(
      'actor is not the next timeline actor: chikage',
    );
  });

  it('delays an enemy and reports newly crossed player action windows', () => {
    const state = createBattleTimeline(baseEntries);
    const preview = previewTimelineShift(state, 'ghost-fire', 5);

    expect(preview.fromTime).toBe(4);
    expect(preview.toTime).toBe(9);
    expect(preview.crossedPlayerActorIds).toEqual(['chikage']);
    expect(orderedTimeline(shiftTimelineActor(state, 'ghost-fire', 5)).map((entry) => entry.actorId)).toEqual([
      'rin',
      'chikage',
      'ghost-fire',
      'stone-ogre',
      'mo',
    ]);
  });

  it('does not claim an action window when delay fails to cross a player node', () => {
    const state = createBattleTimeline(baseEntries);
    const preview = previewTimelineShift(state, 'ghost-fire', 2);

    expect(preview.toTime).toBe(6);
    expect(preview.crossedPlayerActorIds).toEqual([]);
  });

  it('allows advance effects but clamps them at current time', () => {
    const state = createBattleTimeline(baseEntries, 0);
    const shifted = shiftTimelineActor(state, 'ghost-fire', -20);
    expect(orderedTimeline(shifted)[0]).toMatchObject({ actorId: 'rin', nextActionAt: 0 });
    expect(orderedTimeline(shifted)[1]).toMatchObject({ actorId: 'ghost-fire', nextActionAt: 0 });
  });

  it('removes dead actors and all of their future timeline presence', () => {
    const state = createBattleTimeline(baseEntries);
    const next = removeTimelineActor(state, 'ghost-fire');

    expect(next.entries.some((entry) => entry.actorId === 'ghost-fire')).toBe(false);
    expect(orderedTimeline(next).map((entry) => entry.actorId)).toEqual([
      'rin',
      'chikage',
      'stone-ogre',
      'mo',
    ]);
  });

  it('rejects duplicate actors because one actor owns one next action timestamp', () => {
    expect(() =>
      createBattleTimeline([
        { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
        { actorId: 'rin', team: 'player', nextActionAt: 8, tieBreaker: 0 },
      ]),
    ).toThrow('duplicate timeline actor: rin');
  });
});
