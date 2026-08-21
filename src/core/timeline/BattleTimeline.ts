import type {
  BattleTimelineState,
  CompleteActionResult,
  TimelineEntry,
  TimelineShiftPreview,
} from './TimelineTypes';

export const MIN_ACTION_DELAY = 2;

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number`);
  }
}

function assertUniqueActors(entries: TimelineEntry[]): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.actorId)) throw new Error(`duplicate timeline actor: ${entry.actorId}`);
    seen.add(entry.actorId);
  }
}

export function compareTimelineEntries(a: TimelineEntry, b: TimelineEntry): number {
  if (a.nextActionAt !== b.nextActionAt) return a.nextActionAt - b.nextActionAt;
  if (a.tieBreaker !== b.tieBreaker) return a.tieBreaker - b.tieBreaker;
  return a.actorId.localeCompare(b.actorId);
}

export function createBattleTimeline(
  entries: TimelineEntry[],
  currentTime = 0,
): BattleTimelineState {
  assertFiniteNonNegative(currentTime, 'currentTime');
  assertUniqueActors(entries);
  for (const entry of entries) {
    assertFiniteNonNegative(entry.nextActionAt, `${entry.actorId}.nextActionAt`);
    if (!Number.isInteger(entry.tieBreaker)) {
      throw new Error(`${entry.actorId}.tieBreaker must be an integer`);
    }
    if (entry.nextActionAt < currentTime) {
      throw new Error(`${entry.actorId}.nextActionAt cannot be before currentTime`);
    }
  }
  return {
    currentTime,
    entries: entries.map((entry) => ({ ...entry })),
  };
}

export function orderedTimeline(state: BattleTimelineState): TimelineEntry[] {
  return [...state.entries].sort(compareTimelineEntries);
}

/** Refactor-spec name for consumers that only need the sorted projection. */
export function sortTimelineActors(state: BattleTimelineState): TimelineEntry[] {
  return orderedTimeline(state);
}

export function nextTimelineActor(state: BattleTimelineState): TimelineEntry | undefined {
  return orderedTimeline(state)[0];
}

export function findTimelineEntry(
  state: BattleTimelineState,
  actorId: string,
): TimelineEntry | undefined {
  return state.entries.find((entry) => entry.actorId === actorId);
}

export function removeTimelineActor(
  state: BattleTimelineState,
  actorId: string,
): BattleTimelineState {
  return {
    currentTime: state.currentTime,
    entries: state.entries.filter((entry) => entry.actorId !== actorId).map((entry) => ({ ...entry })),
  };
}

/** Dead actors do not remain as dormant entries in the new timeline model. */
export function removeDeadActor(
  state: BattleTimelineState,
  actorId: string,
): BattleTimelineState {
  return removeTimelineActor(state, actorId);
}

export function shiftTimelineActor(
  state: BattleTimelineState,
  actorId: string,
  delta: number,
): BattleTimelineState {
  if (!Number.isFinite(delta)) throw new Error('timeline shift delta must be finite');
  const entry = findTimelineEntry(state, actorId);
  if (!entry) throw new Error(`timeline actor not found: ${actorId}`);

  const nextActionAt = Math.max(state.currentTime, entry.nextActionAt + delta);
  return {
    currentTime: state.currentTime,
    entries: state.entries.map((candidate) =>
      candidate.actorId === actorId ? { ...candidate, nextActionAt } : { ...candidate },
    ),
  };
}

export function delayActor(
  state: BattleTimelineState,
  actorId: string,
  amount: number,
): BattleTimelineState {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('delay amount must be non-negative');
  return shiftTimelineActor(state, actorId, amount);
}

export function advanceActor(
  state: BattleTimelineState,
  actorId: string,
  amount: number,
): BattleTimelineState {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('advance amount must be non-negative');
  return shiftTimelineActor(state, actorId, -amount);
}

export function previewTimelineShift(
  state: BattleTimelineState,
  actorId: string,
  delta: number,
): TimelineShiftPreview {
  const before = orderedTimeline(state);
  const fromIndex = before.findIndex((entry) => entry.actorId === actorId);
  if (fromIndex < 0) throw new Error(`timeline actor not found: ${actorId}`);

  const fromTime = before[fromIndex]!.nextActionAt;
  const shiftedState = shiftTimelineActor(state, actorId, delta);
  const after = orderedTimeline(shiftedState);
  const toIndex = after.findIndex((entry) => entry.actorId === actorId);
  const toTime = after[toIndex]!.nextActionAt;

  const crossedPlayerActorIds = delta > 0
    ? before
        .slice(fromIndex + 1)
        .filter((entry) => entry.team === 'player')
        .filter((entry) => after.findIndex((candidate) => candidate.actorId === entry.actorId) < toIndex)
        .map((entry) => entry.actorId)
    : [];

  return {
    actorId,
    fromTime,
    toTime,
    fromIndex,
    toIndex,
    crossedPlayerActorIds,
  };
}

export function countCrossedPlayerWindows(
  state: BattleTimelineState,
  actorId: string,
  delay: number,
): number {
  if (!Number.isFinite(delay) || delay < 0) throw new Error('delay must be non-negative');
  return previewTimelineShift(state, actorId, delay).crossedPlayerActorIds.length;
}

export function completeActorAction(
  state: BattleTimelineState,
  actorId: string,
  delay: number,
): CompleteActionResult {
  if (!Number.isFinite(delay) || delay < MIN_ACTION_DELAY) {
    throw new Error(`action delay must be at least ${MIN_ACTION_DELAY}`);
  }

  const next = nextTimelineActor(state);
  if (!next || next.actorId !== actorId) {
    throw new Error(`actor is not the next timeline actor: ${actorId}`);
  }

  const actedAt = next.nextActionAt;
  const nextActionAt = actedAt + delay;
  const nextState: BattleTimelineState = {
    currentTime: actedAt,
    entries: state.entries.map((entry) =>
      entry.actorId === actorId ? { ...entry, nextActionAt } : { ...entry },
    ),
  };

  return {
    state: nextState,
    actorId,
    actedAt,
    nextActionAt,
  };
}

/** Refactor-spec name: finishing one action schedules that actor by card Delay. */
export function scheduleAfterAction(
  state: BattleTimelineState,
  actorId: string,
  delay: number,
): CompleteActionResult {
  return completeActorAction(state, actorId, delay);
}
