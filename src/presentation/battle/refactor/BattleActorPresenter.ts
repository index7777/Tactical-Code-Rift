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
  timeline: { x: 0, y: 0, width: 1280, height: 104 },
  battlefield: { x: 0, y: 0, width: 1280, height: 720 },
  partyRail: { x: 18, y: 150, width: 158, height: 176 },
  intentPanel: { x: 1042, y: 142, width: 220, height: 154 },
  hand: { x: 0, y: 508, width: 1280, height: 212 },
  actionPosition: { x: 680, y: 390 },
  reactionPosition: { x: 750, y: 405 },
};

export const PLAYER_HOME_POSITIONS: readonly BattleActorPosition[] = [
  { actorId: 'rin', x: 300, y: 315, perspectiveScale: 0.9 },
  { actorId: 'chikage', x: 405, y: 350, perspectiveScale: 0.97 },
  { actorId: 'oboro', x: 285, y: 402, perspectiveScale: 1.05 },
  { actorId: 'mo', x: 420, y: 448, perspectiveScale: 1.12 },
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
  gap = 14,
): { x: number; y: number } {
  const direction = target.x >= actor.x ? 1 : -1;
  const desiredCenterDistance = actor.width / 2 + target.width / 2 + gap;
  const currentCenterDistance = Math.abs(target.x - actor.x);

  return {
    x: currentCenterDistance <= desiredCenterDistance
      ? actor.x
      : target.x - direction * desiredCenterDistance,
    y: target.y,
  };
}
