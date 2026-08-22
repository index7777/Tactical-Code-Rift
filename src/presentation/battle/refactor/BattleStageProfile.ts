export interface BattleStageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BattleStageDepthBand {
  y: number;
  scale: number;
}

export interface BattleStageProfile {
  width: number;
  height: number;
  playerZone: BattleStageRect;
  enemyZone: BattleStageRect;
  actionZone: BattleStageRect;
  depthBands: readonly BattleStageDepthBand[];
  enemyVisualScaleMultiplier: number;
  backgroundFocalPoint: { x: number; y: number };
  hudSafeTop: number;
  hudSafeBottom: number;
  cameraSafeBounds: BattleStageRect;
  occlusionLeft: number;
  occlusionRight: number;
}

export interface FormationSlot {
  xRatio: number;
  depthBandIndex: number;
}

export type FormationSide = 'player' | 'enemy';

export interface StageActorPosition {
  actorId: string;
  x: number;
  y: number;
  perspectiveScale: number;
}

export interface BackgroundFrame {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  scale: number;
}

export const RAIL_HALT_STAGE_PROFILE: BattleStageProfile = {
  width: 1280,
  height: 720,
  playerZone: { x: 270, y: 404, width: 360, height: 62 },
  enemyZone: { x: 690, y: 392, width: 520, height: 92 },
  actionZone: { x: 550, y: 395, width: 300, height: 115 },
  depthBands: [
    { y: 408, scale: 0.96 },
    { y: 464, scale: 1.08 },
  ],
  enemyVisualScaleMultiplier: 1.06,
  backgroundFocalPoint: { x: 0.51, y: 0.53 },
  hudSafeTop: 112,
  hudSafeBottom: 584,
  cameraSafeBounds: { x: 270, y: 280, width: 740, height: 280 },
  occlusionLeft: 250,
  occlusionRight: 1160,
};

export const FOUR_PLAYER_FORMATION_SLOTS: readonly FormationSlot[] = [
  { xRatio: 0.04, depthBandIndex: 0 },
  { xRatio: 0.52, depthBandIndex: 0 },
  { xRatio: 0.25, depthBandIndex: 1 },
  { xRatio: 0.73, depthBandIndex: 1 },
];

export const DEFAULT_PLAYER_ACTOR_ORDER = ['rin', 'chikage', 'oboro', 'mo'] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formationPositions(
  actorIds: readonly string[],
  profile: BattleStageProfile = RAIL_HALT_STAGE_PROFILE,
  slots: readonly FormationSlot[] = FOUR_PLAYER_FORMATION_SLOTS,
): StageActorPosition[] {
  return actorIds.slice(0, slots.length).map((actorId, index) => {
    const slot = slots[index];
    const band = profile.depthBands[slot.depthBandIndex] ?? profile.depthBands[profile.depthBands.length - 1];
    return {
      actorId,
      x: profile.playerZone.x + profile.playerZone.width * slot.xRatio,
      y: band.y,
      perspectiveScale: band.scale,
    };
  });
}

export function enemyStagePosition(
  index: number,
  count = 4,
  profile: BattleStageProfile = RAIL_HALT_STAGE_PROFILE,
): { x: number; y: number; perspectiveScale: number } {
  const layouts: Record<number, readonly FormationSlot[]> = {
    1: [{ xRatio: 0.5, depthBandIndex: 1 }],
    2: [{ xRatio: 0.75, depthBandIndex: 0 }, { xRatio: 0.25, depthBandIndex: 1 }],
    3: [{ xRatio: 0.75, depthBandIndex: 0 }, { xRatio: 0.25, depthBandIndex: 0 }, { xRatio: 0.5, depthBandIndex: 1 }],
    4: [{ xRatio: 0.78, depthBandIndex: 0 }, { xRatio: 0.28, depthBandIndex: 0 }, { xRatio: 0.54, depthBandIndex: 1 }, { xRatio: 0.04, depthBandIndex: 1 }],
  };
  const slots = layouts[Math.min(4, Math.max(1, count))] ?? layouts[4];
  const slot = slots[Math.min(Math.max(0, index), slots.length - 1)];
  const band = profile.depthBands[slot.depthBandIndex];
  return {
    x: profile.enemyZone.x + profile.enemyZone.width * slot.xRatio,
    y: band.y + (slot.depthBandIndex === 0 ? -12 : 16),
    perspectiveScale: band.scale * profile.enemyVisualScaleMultiplier,
  };
}

export function backgroundFrame(
  sourceWidth: number,
  sourceHeight: number,
  profile: BattleStageProfile = RAIL_HALT_STAGE_PROFILE,
): BackgroundFrame {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);
  const scale = Math.max(profile.width / safeWidth, profile.height / safeHeight);
  const displayWidth = safeWidth * scale;
  const displayHeight = safeHeight * scale;
  const overflowX = displayWidth - profile.width;
  const overflowY = displayHeight - profile.height;
  return {
    x: profile.width / 2 + overflowX * (0.5 - profile.backgroundFocalPoint.x),
    y: profile.height / 2 + overflowY * (0.5 - profile.backgroundFocalPoint.y),
    displayWidth,
    displayHeight,
    scale,
  };
}

export function clampCameraTarget(
  x: number,
  y: number,
  profile: BattleStageProfile = RAIL_HALT_STAGE_PROFILE,
): { x: number; y: number } {
  const bounds = profile.cameraSafeBounds;
  return {
    x: clamp(x, bounds.x, bounds.x + bounds.width),
    y: clamp(y, bounds.y, bounds.y + bounds.height),
  };
}
