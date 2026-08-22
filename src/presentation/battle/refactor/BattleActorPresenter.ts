import {
  DEFAULT_PLAYER_ACTOR_ORDER,
  RAIL_HALT_STAGE_PROFILE,
  formationPositions,
} from './BattleStageProfile';

export interface BattleActorPosition {
  actorId: 'rin' | 'chikage' | 'oboro' | 'mo';
  x: number;
  y: number;
  perspectiveScale: number;
}

export interface RefactorBattleLayout {
  width: 1280;
  height: 720;
  timeline: { x: number; y: number; width: number; height: number };
  battlefield: { x: number; y: number; width: number; height: number };
  partyRail: { x: number; y: number; width: number; height: number };
  intentPanel: { x: number; y: number; width: number; height: number };
  hand: { x: number; y: number; width: number; height: number };
  actionPosition: { x: number; y: number };
  reactionPosition: { x: number; y: number };
}

export interface BattleVisualBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const REFACTOR_BATTLE_LAYOUT: RefactorBattleLayout = {
  width: 1280,
  height: 720,
  timeline: { x: 0, y: 24, width: 1280, height: 82 },
  battlefield: { x: 0, y: 0, width: 1280, height: 720 },
  partyRail: { x: 18, y: 168, width: 126, height: 134 },
  intentPanel: { x: 1060, y: 158, width: 202, height: 112 },
  hand: { x: 0, y: 584, width: 1280, height: 136 },
  actionPosition: {
    x: RAIL_HALT_STAGE_PROFILE.actionZone.x + RAIL_HALT_STAGE_PROFILE.actionZone.width / 2,
    y: RAIL_HALT_STAGE_PROFILE.actionZone.y + RAIL_HALT_STAGE_PROFILE.actionZone.height / 2,
  },
  reactionPosition: {
    x: RAIL_HALT_STAGE_PROFILE.actionZone.x + RAIL_HALT_STAGE_PROFILE.actionZone.width * 0.7,
    y: RAIL_HALT_STAGE_PROFILE.actionZone.y + RAIL_HALT_STAGE_PROFILE.actionZone.height / 2,
  },
};

export const PLAYER_HOME_POSITIONS: readonly BattleActorPosition[] = formationPositions(
  DEFAULT_PLAYER_ACTOR_ORDER,
  RAIL_HALT_STAGE_PROFILE,
).map((position) => ({
  ...position,
  actorId: position.actorId as BattleActorPosition['actorId'],
}));

export function homePositionFor(actorId: BattleActorPosition['actorId']): BattleActorPosition {
  const index = DEFAULT_PLAYER_ACTOR_ORDER.indexOf(actorId);
  if (index < 0) throw new Error(`unknown player actor: ${actorId}`);
  const position = formationPositions(DEFAULT_PLAYER_ACTOR_ORDER, RAIL_HALT_STAGE_PROFILE)[index];
  return { ...position, actorId };
}

export function perspectiveScaleForY(y: number): number {
  const bands = RAIL_HALT_STAGE_PROFILE.depthBands;
  if (y <= bands[0].y) return bands[0].scale;
  for (let index = 1; index < bands.length; index += 1) {
    const previous = bands[index - 1];
    const current = bands[index];
    if (y <= current.y) {
      const ratio = (y - previous.y) / Math.max(1, current.y - previous.y);
      return previous.scale + (current.scale - previous.scale) * ratio;
    }
  }
  return bands[bands.length - 1].scale;
}

export function actionApproachPosition(
  actor: BattleVisualBounds,
  target: BattleVisualBounds,
  gap = 2,
): { x: number; y: number } {
  const direction = target.x >= actor.x ? 1 : -1;
  const actorContactHalfWidth = Math.max(12, actor.width * 0.2);
  const targetContactHalfWidth = Math.max(14, target.width * 0.2);
  const desiredCenterDistance = actorContactHalfWidth + targetContactHalfWidth + gap;
  const currentCenterDistance = Math.abs(target.x - actor.x);

  return {
    x: currentCenterDistance <= desiredCenterDistance
      ? actor.x
      : target.x - direction * desiredCenterDistance,
    y: target.y,
  };
}
