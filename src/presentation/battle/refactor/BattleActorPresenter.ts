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
  hand: { x: 0, y: 548, width: 1280, height: 172 },
  actionPosition: { x: 700, y: 398 },
  reactionPosition: { x: 760, y: 410 },
};

export const PLAYER_HOME_POSITIONS: readonly BattleActorPosition[] = [
  { actorId: 'rin', x: 350, y: 320, perspectiveScale: 0.91 },
  { actorId: 'chikage', x: 455, y: 355, perspectiveScale: 0.97 },
  { actorId: 'oboro', x: 345, y: 410, perspectiveScale: 1.05 },
  { actorId: 'mo', x: 480, y: 450, perspectiveScale: 1.12 },
];

export function homePositionFor(actorId: BattleActorPosition['actorId']): BattleActorPosition {
  const position = PLAYER_HOME_POSITIONS.find((entry) => entry.actorId === actorId);
  if (!position) throw new Error(`unknown player actor: ${actorId}`);
  return { ...position };
}

export function perspectiveScaleForY(y: number): number {
  const normalized = 0.9 + (y - 315) * 0.00165;
  return Math.min(1.16, Math.max(0.86, normalized));
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
