import type {
  RefactorCardDefinition,
  RefactorCardInstance,
  RefactorDeckState,
  RefactorDispatchResult,
  RefactorPlayResult,
} from './RefactorCardTypes';

export const REFACTOR_HAND_SIZE = 5;
export const DISPATCH_DELAY = 3;

function normalizeSeed(seed: number): number {
  if (!Number.isInteger(seed)) throw new Error('seed must be an integer');
  return seed >>> 0;
}

function nextRandom(state: number): { state: number; value: number } {
  const next = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return { state: next, value: next / 0x100000000 };
}

function shuffleWithState<T>(items: readonly T[], rngState: number): { items: T[]; rngState: number } {
  const result = [...items];
  let state = rngState;
  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = nextRandom(state);
    state = random.state;
    const swapIndex = Math.floor(random.value * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return { items: result, rngState: state };
}

function cloneCard(card: RefactorCardInstance): RefactorCardInstance {
  return {
    instanceId: card.instanceId,
    definition: {
      ...card.definition,
      effect: { ...card.definition.effect },
    },
  };
}

export function createRefactorDeck(
  definitions: readonly RefactorCardDefinition[],
  seed = 1,
): RefactorDeckState {
  if (definitions.length < REFACTOR_HAND_SIZE) {
    throw new Error(`refactor deck requires at least ${REFACTOR_HAND_SIZE} cards`);
  }

  const instances = definitions.map((definition, index) => ({
    instanceId: `${definition.id}#${index + 1}`,
    definition: {
      ...definition,
      effect: { ...definition.effect },
    },
  }));
  const shuffled = shuffleWithState(instances, normalizeSeed(seed));
  const hand = shuffled.items.slice(0, REFACTOR_HAND_SIZE).map(cloneCard);
  const drawPile = shuffled.items.slice(REFACTOR_HAND_SIZE).map(cloneCard);

  return {
    hand,
    drawPile,
    discardPile: [],
    rngState: shuffled.rngState,
  };
}

function refillTo(
  state: RefactorDeckState,
  targetSize: number,
): RefactorDeckState {
  const hand = state.hand.map(cloneCard);
  let drawPile = state.drawPile.map(cloneCard);
  let discardPile = state.discardPile.map(cloneCard);
  let rngState = state.rngState;

  while (hand.length < targetSize) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      const reshuffled = shuffleWithState(discardPile, rngState);
      drawPile = reshuffled.items.map(cloneCard);
      discardPile = [];
      rngState = reshuffled.rngState;
    }
    const drawn = drawPile.shift();
    if (!drawn) break;
    hand.push(drawn);
  }

  return { hand, drawPile, discardPile, rngState };
}

export function playOneCard(
  state: RefactorDeckState,
  instanceId: string,
): RefactorPlayResult {
  const index = state.hand.findIndex((card) => card.instanceId === instanceId);
  if (index < 0) throw new Error(`card is not in hand: ${instanceId}`);

  const played = cloneCard(state.hand[index]!);
  const staged: RefactorDeckState = {
    hand: state.hand.filter((_, cardIndex) => cardIndex !== index).map(cloneCard),
    drawPile: state.drawPile.map(cloneCard),
    discardPile: [...state.discardPile.map(cloneCard), cloneCard(played)],
    rngState: state.rngState,
  };

  return {
    state: refillTo(staged, REFACTOR_HAND_SIZE),
    played,
  };
}

export function dispatchCards(
  state: RefactorDeckState,
  selectedInstanceIds: readonly string[],
): RefactorDispatchResult {
  const uniqueIds = [...new Set(selectedInstanceIds)];
  if (uniqueIds.length > 2) throw new Error('dispatch can exchange at most 2 cards');
  if (uniqueIds.length !== selectedInstanceIds.length) {
    throw new Error('dispatch selection contains duplicate card ids');
  }

  const selectedSet = new Set(uniqueIds);
  const discarded = state.hand.filter((card) => selectedSet.has(card.instanceId)).map(cloneCard);
  if (discarded.length !== uniqueIds.length) {
    throw new Error('dispatch can only exchange cards currently in hand');
  }

  const staged: RefactorDeckState = {
    hand: state.hand.filter((card) => !selectedSet.has(card.instanceId)).map(cloneCard),
    drawPile: state.drawPile.map(cloneCard),
    discardPile: [...state.discardPile.map(cloneCard), ...discarded.map(cloneCard)],
    rngState: state.rngState,
  };

  return {
    state: refillTo(staged, REFACTOR_HAND_SIZE),
    discarded,
  };
}

export function cloneRefactorDeckState(state: RefactorDeckState): RefactorDeckState {
  return {
    hand: state.hand.map(cloneCard),
    drawPile: state.drawPile.map(cloneCard),
    discardPile: state.discardPile.map(cloneCard),
    rngState: state.rngState,
  };
}
