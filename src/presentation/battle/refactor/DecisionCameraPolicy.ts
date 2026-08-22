import type { RefactorHandLayoutState } from './RefactorHandLayoutPolicy';
import { RAIL_HALT_STAGE_PROFILE, clampCameraTarget } from './BattleStageProfile';

export type DecisionCameraMode = 'PEEK' | 'FOCUS' | 'TARGETING' | 'DISPATCH';

export interface DecisionCameraPoint {
  x: number;
  y: number;
}

export interface DecisionCameraTarget {
  mode: DecisionCameraMode;
  x: number;
  y: number;
  zoom: number;
  durationMs: number;
}

export interface DecisionCameraInput {
  handState: RefactorHandLayoutState;
  activeActor?: DecisionCameraPoint;
  selectedTarget?: DecisionCameraPoint;
}

const TRANSITION_MS = 180;
const PEEK_ZOOM = 1.05;
const FOCUS_ZOOM = 1.08;
const TARGETING_ZOOM = 1.12;

function clampTarget(
  mode: DecisionCameraMode,
  x: number,
  y: number,
  zoom: number,
): DecisionCameraTarget {
  const clamped = clampCameraTarget(x, y);
  return { mode, ...clamped, zoom, durationMs: TRANSITION_MS };
}

function peekTarget(activeActor: DecisionCameraPoint): DecisionCameraTarget {
  return clampTarget(
    'PEEK',
    640 + (activeActor.x - 640) * 0.2,
    360 + (activeActor.y - 360) * 0.16,
    PEEK_ZOOM,
  );
}

function focusTarget(activeActor: DecisionCameraPoint): DecisionCameraTarget {
  const actionZone = RAIL_HALT_STAGE_PROFILE.actionZone;
  const actionAnchor = {
    x: actionZone.x + actionZone.width / 2,
    y: actionZone.y + actionZone.height / 2,
  };
  return clampTarget(
    'FOCUS',
    activeActor.x * 0.62 + actionAnchor.x * 0.38,
    activeActor.y * 0.62 + actionAnchor.y * 0.38,
    FOCUS_ZOOM,
  );
}

export function decisionCameraTarget(input: DecisionCameraInput): DecisionCameraTarget | undefined {
  if (input.handState === 'HIDDEN') return undefined;
  if (input.handState === 'DISPATCH') {
    return { mode: 'DISPATCH', x: 640, y: 360, zoom: 1, durationMs: TRANSITION_MS };
  }
  if (!input.activeActor) return undefined;

  if (input.handState === 'PEEK') return peekTarget(input.activeActor);
  if (input.handState === 'FOCUS') return focusTarget(input.activeActor);

  if (!input.selectedTarget) return focusTarget(input.activeActor);
  return clampTarget(
    'TARGETING',
    (input.activeActor.x + input.selectedTarget.x) / 2,
    (input.activeActor.y + input.selectedTarget.y) / 2,
    TARGETING_ZOOM,
  );
}
