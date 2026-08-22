import { describe, expect, it } from 'vitest';
import { enemyOverheadLayout } from './EnemyOverheadLayoutPolicy';

describe('enemyOverheadLayout', () => {
  it('keeps name, intent, hp bar, and hp value inside one module', () => {
    const layout = enemyOverheadLayout(900, 480, 1.08);
    const left = layout.x - layout.width / 2;
    const right = layout.x + layout.width / 2;
    const top = layout.y - layout.height / 2;
    const bottom = layout.y + layout.height / 2;
    expect(layout.name.x).toBeGreaterThan(left);
    expect(layout.intent.x + layout.intent.width / 2).toBeLessThan(right);
    expect(layout.name.y).toBeGreaterThan(top);
    expect(layout.hpValue.y).toBeLessThan(bottom);
  });

  it('uses perspective scale only for the actor-to-module anchor distance', () => {
    const rear = enemyOverheadLayout(900, 396, 0.96);
    const front = enemyOverheadLayout(900, 480, 1.08);
    expect(rear.width).toBe(front.width);
    expect(rear.height).toBe(front.height);
    expect(396 - rear.y).toBeCloseTo(96 * 0.96, 6);
    expect(480 - front.y).toBeCloseTo(96 * 1.08, 6);
  });
});
