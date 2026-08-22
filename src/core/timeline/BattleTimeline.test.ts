import { describe, expect, it } from 'vitest';
import {
  MIN_ACTION_DELAY,
  advanceActor,
  countCrossedPlayerWindows,
  createBattleTimeline,
  delayActor,
  nextTimelineActor,
  removeDeadActor,
  scheduleAfterAction,
  sortTimelineActors,
} from './BattleTimeline';

const baseEntries = [
  { actorId: 'rin', team: 'player' as const, nextActionAt: 0, tieBreaker: 0 },
  { actorId: 'ghost-fire', team: 'enemy' as const, nextActionAt: 4, tieBreaker: 10 },
  { actorId: 'chikage', team: 'player' as const, nextActionAt: 7, tieBreaker: 1 },
  { actorId: 'stone-ogre', team: 'enemy' as const, nextActionAt: 10, tieBreaker: 11 },
  { actorId: 'mo', team: 'player' as const, nextActionAt: 13, tieBreaker: 3 },
];

describe('BattleTimeline', () => {
  it('orders both teams on one absolute timeline', () => {
    const state = createBattleTimeline([...baseEntries].reverse());
    expect(sortTimelineActors(state).map((entry) => entry.actorId)).toEqual([
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

    expect(sortTimelineActors(state).map((entry) => entry.actorId)).toEqual([
      'player-a',
      'enemy-a',
      'enemy-b',
    ]);
  });

  it('reschedules only the current actor after one action', () => {
    const state = createBattleTimeline(baseEntries);
    const result = scheduleAfterAction(state, 'rin', 5);

    expect(result.actedAt).toBe(0);
    expect(result.nextActionAt).toBe(5);
    expect(result.state.currentTime).toBe(0);
    expect(sortTimelineActors(result.state).map((entry) => `${entry.actorId}:${entry.nextActionAt}`)).toEqual([
      'ghost-fire:4',
      'rin:5',
      'chikage:7',
      'stone-ogre:10',
      'mo:13',
    ]);
  });

  it('advances world time to the acting timestamp on later actions', () => {
    const state = createBattleTimeline([
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'rin', team: 'player', nextActionAt: 5, tieBreaker: 0 },
    ]);
    const result = scheduleAfterAction(state, 'ghost-fire', 4);

    expect(result.actedAt).toBe(4);
    expect(result.state.currentTime).toBe(4);
    expect(result.nextActionAt).toBe(8);
  });

  it('rejects action delay below the prototype minimum', () => {
    const state = createBattleTimeline(baseEntries);
    expect(() => scheduleAfterAction(state, 'rin', MIN_ACTION_DELAY - 1)).toThrow(
      `action delay must be at least ${MIN_ACTION_DELAY}`,
    );
  });

  it('does not allow a non-current actor to act', () => {
    const state = createBattleTimeline(baseEntries);
    expect(() => scheduleAfterAction(state, 'chikage', 4)).toThrow(
      'actor is not the next timeline actor: chikage',
    );
  });

  it('delays an enemy and creates one player action window when exactly one player is crossed', () => {
    const state = createBattleTimeline(baseEntries);
    const shifted = delayActor(state, 'ghost-fire', 5);

    expect(countCrossedPlayerWindows(state, 'ghost-fire', 5)).toBe(1);
    expect(sortTimelineActors(shifted).map((entry) => entry.actorId)).toEqual([
      'rin',
      'chikage',
      'ghost-fire',
      'stone-ogre',
      'mo',
    ]);
  });

  it('reports zero windows when delay does not cross a player node', () => {
    const state = createBattleTimeline(baseEntries);
    expect(countCrossedPlayerWindows(state, 'ghost-fire', 2)).toBe(0);
  });

  it('reports two windows when delay crosses two player nodes', () => {
    const state = createBattleTimeline([
      { actorId: 'enemy', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'chikage', team: 'player', nextActionAt: 6, tieBreaker: 1 },
      { actorId: 'oboro', team: 'player', nextActionAt: 8, tieBreaker: 2 },
      { actorId: 'other-enemy', team: 'enemy', nextActionAt: 9, tieBreaker: 11 },
    ]);

    expect(countCrossedPlayerWindows(state, 'enemy', 5)).toBe(2);
  });

  it('allows advance effects but clamps them at current time', () => {
    const state = createBattleTimeline(baseEntries, 0);
    const shifted = advanceActor(state, 'ghost-fire', 20);
    const ordered = sortTimelineActors(shifted);

    expect(ordered[0]).toMatchObject({ actorId: 'rin', nextActionAt: 0 });
    expect(ordered[1]).toMatchObject({ actorId: 'ghost-fire', nextActionAt: 0 });
  });

  it('removes dead actors and all of their future timeline presence', () => {
    const state = createBattleTimeline(baseEntries);
    const next = removeDeadActor(state, 'ghost-fire');

    expect(next.entries.some((entry) => entry.actorId === 'ghost-fire')).toBe(false);
    expect(sortTimelineActors(next).map((entry) => entry.actorId)).toEqual([
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
