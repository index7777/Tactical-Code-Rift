import { describe, expect, it } from 'vitest';
import { actionApproachPosition } from './BattleActorPresenter';

describe('actionApproachPosition', () => {
  it('moves a left-side actor to the target front edge instead of the fixed center', () => {
    const destination = actionApproachPosition(
      { x: 300, y: 330, width: 100, height: 110 },
      { x: 900, y: 380, width: 160, height: 150 },
    );

    expect(destination).toEqual({ x: 756, y: 380 });
    expect(destination.x).toBeGreaterThan(680);
  });

  it('mirrors the approach when the actor starts on the right', () => {
    const destination = actionApproachPosition(
      { x: 900, y: 380, width: 160, height: 150 },
      { x: 300, y: 330, width: 100, height: 110 },
    );

    expect(destination).toEqual({ x: 444, y: 330 });
  });

  it('does not force an already-close actor to cross through its target', () => {
    const destination = actionApproachPosition(
      { x: 500, y: 360, width: 100, height: 110 },
      { x: 590, y: 370, width: 100, height: 110 },
    );

    expect(destination).toEqual({ x: 500, y: 370 });
  });
});
