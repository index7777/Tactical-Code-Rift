export type TimelineTeam = 'player' | 'enemy';

export interface TimelineEntry {
  actorId: string;
  team: TimelineTeam;
  nextActionAt: number;
  /** Lower values win deterministic ties. Must stay stable for the encounter. */
  tieBreaker: number;
}

export interface BattleTimelineState {
  currentTime: number;
  entries: TimelineEntry[];
}

export interface TimelineShiftPreview {
  actorId: string;
  fromTime: number;
  toTime: number;
  fromIndex: number;
  toIndex: number;
  crossedPlayerActorIds: string[];
}

export interface CompleteActionResult {
  state: BattleTimelineState;
  actorId: string;
  actedAt: number;
  nextActionAt: number;
}
