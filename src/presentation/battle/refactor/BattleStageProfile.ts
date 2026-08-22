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
  playerZone: { x: 300, y: 382, width: 300, height: 120 },
  enemyZone: { x: 830, y: 390, width: 200, height: 100 },
  actionZone: { x: 550, y: 395, width: 300, height: 115 },
  depthBands: [
    { y: 392, scale: 0.88 },
    { y: 420, scale: 0.96 },
    { y: 462, scale: 1.07 },
    { y: 492, scale: 1.16 },
  ],
  enemyVisualScaleMultiplier: 1.14,
  backgroundFocalPoint: { x: 0.51, y: 0.53 },
  hudSafeTop: 112,
  hudSafeBottom: 584,
  cameraSafeBounds: { x: 270, y: 280, width: 740, height: 280 },
  occlusionLeft: 250,
  occlusionRight: 1160,
};

export const FOUR_PLAYER_FORMATION_SLOTS: readonly FormationSlot[] = [
  { xRatio: 0.08, depthBandIndex: 0 },
  { xRatio: 0.68, depthBandIndex: 1 },
  { xRatio: 0.24, depthBandIndex: 2 },
  { xRatio: 0.84, depthBandIndex: 3 },
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
  profile: BattleStageProfile = RAIL_HALT_STAGE_PROFILE,
): { x: number; y: number; perspectiveScale: number } {
  const safeIndex = Math.max(0, index);
  const bandIndex = Math.min(profile.depthBands.length - 1, 1 + (safeIndex % 2));
  const band = profile.depthBands[bandIndex];
  const xStep = Math.min(profile.enemyZone.width * 0.38, 82);
  return {
    x: profile.enemyZone.x + profile.enemyZone.width * 0.48 + safeIndex * xStep,
    y: clamp(band.y, profile.enemyZone.y, profile.enemyZone.y + profile.enemyZone.height),
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
