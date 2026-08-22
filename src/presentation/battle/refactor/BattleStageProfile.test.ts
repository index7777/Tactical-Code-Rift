import { describe, expect, it } from 'vitest';
import {
  RAIL_HALT_STAGE_PROFILE,
  backgroundFrame,
  clampCameraTarget,
  enemyStagePosition,
  formationPositions,
} from './BattleStageProfile';

describe('BattleStageProfile', () => {
  it('derives formation from slots rather than actor identity', () => {
    const normal = formationPositions(['rin', 'chikage', 'oboro', 'mo']);
    const swapped = formationPositions(['mo', 'rin', 'chikage', 'oboro']);

    expect(normal.map(({ x, y, perspectiveScale }) => ({ x, y, perspectiveScale })))
      .toEqual(swapped.map(({ x, y, perspectiveScale }) => ({ x, y, perspectiveScale })));
    expect(swapped[0].actorId).toBe('mo');
  });

  it('keeps formation inside the player zone with compact monotonic depth', () => {
    const positions = formationPositions(['rin', 'chikage', 'oboro', 'mo']);
    const zone = RAIL_HALT_STAGE_PROFILE.playerZone;

    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(zone.x);
      expect(position.x).toBeLessThanOrEqual(zone.x + zone.width);
      expect(position.y).toBeGreaterThanOrEqual(zone.y);
      expect(position.y).toBeLessThanOrEqual(zone.y + zone.height);
    }

    expect(positions.map((position) => position.perspectiveScale)).toEqual([0.9, 0.96, 1.03, 1.08]);
    expect(positions[3].y - positions[0].y).toBeLessThanOrEqual(80);
    expect(positions[0].perspectiveScale).toBeLessThan(positions[1].perspectiveScale);
    expect(positions[1].perspectiveScale).toBeLessThan(positions[2].perspectiveScale);
    expect(positions[2].perspectiveScale).toBeLessThan(positions[3].perspectiveScale);
  });

  it('uses horizontal spread rather than large y offsets to separate the two formation rows', () => {
    const positions = formationPositions(['rin', 'chikage', 'oboro', 'mo']);
    expect(positions[1].x - positions[0].x).toBeGreaterThanOrEqual(150);
    expect(positions[3].x - positions[2].x).toBeGreaterThanOrEqual(150);
    expect(positions[2].x - positions[0].x).toBeGreaterThanOrEqual(40);
  });

  it('derives enemy placement and visual weight from the stage profile', () => {
    const enemy = enemyStagePosition(0);
    const zone = RAIL_HALT_STAGE_PROFILE.enemyZone;
    expect(enemy.x).toBeGreaterThanOrEqual(zone.x);
    expect(enemy.x).toBeLessThanOrEqual(zone.x + zone.width);
    expect(enemy.y).toBeGreaterThanOrEqual(zone.y);
    expect(enemy.y).toBeLessThanOrEqual(zone.y + zone.height);
    expect(enemy.perspectiveScale).toBeCloseTo(
      RAIL_HALT_STAGE_PROFILE.depthBands[1].scale * RAIL_HALT_STAGE_PROFILE.enemyVisualScaleMultiplier,
      6,
    );
    expect(RAIL_HALT_STAGE_PROFILE.enemyVisualScaleMultiplier).toBe(1.14);
  });

  it('covers the stage without distorting source aspect ratio', () => {
    const frame = backgroundFrame(1672, 941);
    expect(frame.displayWidth).toBeGreaterThanOrEqual(1280);
    expect(frame.displayHeight).toBeGreaterThanOrEqual(720);
    expect(frame.displayWidth / frame.displayHeight).toBeCloseTo(1672 / 941, 6);
  });

  it('clamps camera focus to the stage safe bounds', () => {
    const topLeft = clampCameraTarget(-500, -500);
    const bottomRight = clampCameraTarget(5000, 5000);
    expect(topLeft).toEqual({ x: 270, y: 260 });
    expect(bottomRight).toEqual({ x: 1010, y: 550 });
  });
});
