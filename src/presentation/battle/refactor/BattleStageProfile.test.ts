import { describe, expect, it } from 'vitest';
import {
  RAIL_HALT_STAGE_PROFILE,
  backgroundFrame,
  clampCameraTarget,
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

  it('keeps formation inside the player zone and increases scale with depth', () => {
    const positions = formationPositions(['rin', 'chikage', 'oboro', 'mo']);
    const zone = RAIL_HALT_STAGE_PROFILE.playerZone;

    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(zone.x);
      expect(position.x).toBeLessThanOrEqual(zone.x + zone.width);
      expect(position.y).toBeGreaterThanOrEqual(zone.y);
      expect(position.y).toBeLessThanOrEqual(zone.y + zone.height);
    }
    expect(positions.map((position) => position.perspectiveScale)).toEqual([0.92, 1, 1.08, 1.14]);
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
