import type { IntentState } from '../../../core/intents/IntentState';
import { sortTimelineActors } from '../../../core/timeline/BattleTimeline';
import type { BattleTimelineState, TimelineTeam } from '../../../core/timeline/TimelineTypes';

export interface TimelineNodeView {
  actorId: string;
  team: TimelineTeam;
  nextActionAt: number;
  intentName?: string;
  intentDamage?: number;
  intentTargetIds: string[];
}

export function buildTimelineNodes(
  timeline: BattleTimelineState,
  intentByEnemyId: Readonly<Record<string, IntentState | undefined>>,
  limit = 8,
): TimelineNodeView[] {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('timeline view limit must be a non-negative integer');
  return sortTimelineActors(timeline)
    .slice(0, limit)
    .map((entry) => {
      const intent = entry.team === 'enemy' ? intentByEnemyId[entry.actorId] : undefined;
      return {
        actorId: entry.actorId,
        team: entry.team,
        nextActionAt: entry.nextActionAt,
        intentName: intent?.name,
        intentDamage: intent?.damage,
        intentTargetIds: intent ? [...intent.targetIds] : [],
      };
    });
}
