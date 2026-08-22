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

  it('keeps the lowered formation inside the player zone with stronger monotonic depth', () => {
    const positions = formationPositions(['rin', 'chikage', 'oboro', 'mo']);
    const zone = RAIL_HALT_STAGE_PROFILE.playerZone;

    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(zone.x);
      expect(position.x).toBeLessThanOrEqual(zone.x + zone.width);
      expect(position.y).toBeGreaterThanOrEqual(zone.y);
      expect(position.y).toBeLessThanOrEqual(zone.y + zone.height);
    }

    expect(positions.map((position) => position.y)).toEqual([408, 408, 464, 464]);
    expect(positions.map((position) => position.perspectiveScale)).toEqual([0.96, 0.96, 1.08, 1.08]);
    expect(positions[0].perspectiveScale).toBe(positions[1].perspectiveScale);
    expect(positions[2].perspectiveScale).toBe(positions[3].perspectiveScale);
    expect(positions[2].perspectiveScale / positions[0].perspectiveScale).toBeGreaterThanOrEqual(1.1);
    expect(positions[2].perspectiveScale / positions[0].perspectiveScale).toBeLessThanOrEqual(1.15);
  });

  it('uses wider horizontal separation so front and rear silhouettes do not rely on y offsets', () => {
    const positions = formationPositions(['rin', 'chikage', 'oboro', 'mo']);
    expect(positions[1].x - positions[0].x).toBeGreaterThanOrEqual(170);
    expect(positions[3].x - positions[2].x).toBeGreaterThanOrEqual(170);
    expect(positions[2].x - positions[0].x).toBeGreaterThanOrEqual(70);
  });

  it('derives enemy placement and visual weight from the stage profile', () => {
    const enemy = enemyStagePosition(0);
    const zone = RAIL_HALT_STAGE_PROFILE.enemyZone;
    expect(enemy.x).toBeGreaterThanOrEqual(zone.x);
    expect(enemy.x).toBeLessThanOrEqual(zone.x + zone.width);
    expect(enemy.y).toBeGreaterThanOrEqual(zone.y);
    expect(enemy.y).toBeLessThanOrEqual(zone.y + zone.height);
    expect(enemy.perspectiveScale).toBeCloseTo(
      RAIL_HALT_STAGE_PROFILE.depthBands[0].scale * RAIL_HALT_STAGE_PROFILE.enemyVisualScaleMultiplier,
      6,
    );
    expect(RAIL_HALT_STAGE_PROFILE.enemyVisualScaleMultiplier).toBe(1.06);
  });

  it('keeps four enemies in stable separated two-row spawn slots', () => {
    const positions = [0, 1, 2, 3].map((index) => enemyStagePosition(index, 4));
    expect(positions.map(({ y }) => y)).toEqual([396, 396, 480, 480]);
    expect(Math.abs(positions[0].x - positions[1].x)).toBeCloseTo(260, 6);
    expect(Math.abs(positions[2].x - positions[3].x)).toBeCloseTo(260, 6);
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
    expect(topLeft).toEqual({ x: 270, y: 280 });
    expect(bottomRight).toEqual({ x: 1010, y: 560 });
  });
});
