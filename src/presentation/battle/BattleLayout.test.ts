import { describe, expect, it } from 'vitest';
import { clashPositions, standbyPosition } from './BattleLayout';

describe('battle side convention', () => {
  it('places every supported player formation left of every enemy formation', () => {
    for (let count = 1; count <= 4; count += 1) {
      const players = Array.from({ length: count }, (_, index) => standbyPosition('player', count, index));
      const enemies = Array.from({ length: count }, (_, index) => standbyPosition('enemy', count, index));
      expect(Math.max(...players.map((point) => point.x))).toBeLessThan(640);
      expect(Math.min(...enemies.map((point) => point.x))).toBeGreaterThan(640);
      expect(new Set(players.map((point) => `${point.x}:${point.y}`)).size).toBe(count);
      expect(new Set(enemies.map((point) => `${point.x}:${point.y}`)).size).toBe(count);
    }
  });

  it('stages the player on the left side of the central clash', () => {
    const positions = clashPositions();
    expect(positions.player.x).toBeLessThan(positions.enemy.x);
  });
});
