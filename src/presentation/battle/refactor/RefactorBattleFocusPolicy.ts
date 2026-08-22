import type { BattleTurnPhase } from '../../../core/turns/BattleTurnState';
import type { TimelineNodeView } from './TimelinePresenter';
import { clampCameraTarget } from './BattleStageProfile';

export const ACTIVE_ACTOR_FOCUS_ZOOM = 1.05;
export const ACTIVE_ACTOR_STEP_X = 14;

const PLAYER_DECISION_PHASES: ReadonlySet<BattleTurnPhase> = new Set([
  'PLAYER_IDLE',
  'CARD_SELECTED',
  'TARGET_PREVIEW',
]);

export function focusedPlayerActorId(
  phase: BattleTurnPhase,
  activeActorId: string | undefined,
  timeline: readonly TimelineNodeView[],
): string | undefined {
  if (!activeActorId || !PLAYER_DECISION_PHASES.has(phase)) return undefined;
  return timeline.some((node) => node.actorId === activeActorId && node.team === 'player')
    ? activeActorId
    : undefined;
}

export function focusedActorPosition(
  x: number,
  y: number,
  focused: boolean,
): { x: number; y: number } {
  return focused ? { x: x + ACTIVE_ACTOR_STEP_X, y } : { x, y };
}

export function focusCameraTarget(actorX: number, actorY: number): { x: number; y: number; zoom: number } {
  const requested = {
    x: 640 + (actorX - 640) * 0.2,
    y: 360 + (actorY - 360) * 0.16,
  };
  const clamped = clampCameraTarget(requested.x, requested.y);
  return {
    ...clamped,
    zoom: ACTIVE_ACTOR_FOCUS_ZOOM,
  };
}
