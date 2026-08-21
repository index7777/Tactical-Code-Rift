import { describe, expect, it } from 'vitest';
import {
  DISPATCH_DELAY,
  REFACTOR_HAND_SIZE,
  createRefactorDeck,
  dispatchCards,
  playOneCard,
} from './RefactorDeck';
import type { RefactorCardDefinition } from './RefactorCardTypes';

const definitions: RefactorCardDefinition[] = [
  { id: 'quick-a', name: '快斬A', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'quick-b', name: '快斬B', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'heavy-a', name: '重斬A', category: 'heavy', delay: 7, targetRule: 'enemy', effect: { damage: 18 } },
  { id: 'guard-a', name: '架勢A', category: 'guard', delay: 4, targetRule: 'self', effect: { guardRatio: 0.5, guardCap: 8 } },
  { id: 'delay-a', name: '牽制A', category: 'disruption', delay: 4, targetRule: 'enemy', effect: { delayTarget: 2 } },
  { id: 'break-a', name: '破甲A', category: 'break', delay: 4, targetRule: 'enemy', effect: { damage: 5, createBreakWindow: 'armor-break' } },
  { id: 'quick-c', name: '快斬C', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'heavy-b', name: '重斬B', category: 'heavy', delay: 7, targetRule: 'enemy', effect: { damage: 18 } },
];

describe('RefactorDeck', () => {
  it('starts with one shared five-card hand and no AP-like resource', () => {
    const state = createRefactorDeck(definitions, 123);
    expect(state.hand).toHaveLength(REFACTOR_HAND_SIZE);
    expect(state.drawPile).toHaveLength(definitions.length - REFACTOR_HAND_SIZE);
    expect(state.discardPile).toHaveLength(0);
    expect('ap' in state).toBe(false);
    expect('mana' in state).toBe(false);
  });

  it('is deterministic for the same seed', () => {
    const first = createRefactorDeck(definitions, 42);
    const second = createRefactorDeck(definitions, 42);
    expect(first.hand.map((card) => card.instanceId)).toEqual(second.hand.map((card) => card.instanceId));
    expect(first.drawPile.map((card) => card.instanceId)).toEqual(second.drawPile.map((card) => card.instanceId));
  });

  it('plays exactly one selected card, discards it, and immediately refills to five', () => {
    const state = createRefactorDeck(definitions, 7);
    const untouchedIds = state.hand.slice(1).map((card) => card.instanceId);
    const chosen = state.hand[0]!;
    const result = playOneCard(state, chosen.instanceId);

    expect(result.played.instanceId).toBe(chosen.instanceId);
    expect(result.state.hand).toHaveLength(REFACTOR_HAND_SIZE);
    expect(result.state.discardPile.some((card) => card.instanceId === chosen.instanceId)).toBe(true);
    expect(untouchedIds.every((id) => result.state.hand.some((card) => card.instanceId === id))).toBe(true);
  });

  it('rejects trying to play a card that is not in the shared hand', () => {
    const state = createRefactorDeck(definitions, 5);
    expect(() => playOneCard(state, 'not-in-hand')).toThrow('card is not in hand: not-in-hand');
  });

  it('dispatch exchanges zero to two cards and always costs Delay 3 at the action layer', () => {
    const state = createRefactorDeck(definitions, 8);
    expect(DISPATCH_DELAY).toBe(3);

    const zero = dispatchCards(state, []);
    expect(zero.discarded).toHaveLength(0);
    expect(zero.state.hand.map((card) => card.instanceId)).toEqual(state.hand.map((card) => card.instanceId));

    const selected = state.hand.slice(0, 2).map((card) => card.instanceId);
    const two = dispatchCards(state, selected);
    expect(two.discarded.map((card) => card.instanceId)).toEqual(selected);
    expect(two.state.hand).toHaveLength(REFACTOR_HAND_SIZE);
    expect(selected.every((id) => two.state.discardPile.some((card) => card.instanceId === id))).toBe(true);
  });

  it('rejects dispatching more than two cards or cards outside the hand', () => {
    const state = createRefactorDeck(definitions, 9);
    expect(() => dispatchCards(state, state.hand.slice(0, 3).map((card) => card.instanceId))).toThrow(
      'dispatch can exchange at most 2 cards',
    );
    expect(() => dispatchCards(state, ['missing-card'])).toThrow(
      'dispatch can only exchange cards currently in hand',
    );
  });

  it('reshuffles only the discard pile when the draw pile is empty', () => {
    let state = createRefactorDeck(definitions.slice(0, 5), 11);
    const first = state.hand[0]!;
    const result = playOneCard(state, first.instanceId);
    state = result.state;

    expect(state.hand).toHaveLength(REFACTOR_HAND_SIZE);
    expect(state.drawPile).toHaveLength(0);
    expect(state.discardPile).toHaveLength(0);
    expect(state.hand.some((card) => card.instanceId === first.instanceId)).toBe(true);
  });
});
