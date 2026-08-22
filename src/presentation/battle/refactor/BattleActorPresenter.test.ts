import { describe, expect, it } from 'vitest';
import { actionApproachPosition } from './BattleActorPresenter';

describe('actionApproachPosition', () => {
  it('moves a left-side actor into close visual contact with the target', () => {
    const destination = actionApproachPosition(
      { x: 300, y: 330, width: 100, height: 110 },
      { x: 900, y: 380, width: 160, height: 150 },
    );

    expect(destination).toEqual({ x: 846, y: 380 });
    expect(destination.x).toBeGreaterThan(820);
  });

  it('mirrors the close-contact approach when the actor starts on the right', () => {
    const destination = actionApproachPosition(
      { x: 900, y: 380, width: 160, height: 150 },
      { x: 300, y: 330, width: 100, height: 110 },
    );

    expect(destination).toEqual({ x: 354, y: 330 });
  });

  it('does not force an already-close actor to cross through its target', () => {
    const destination = actionApproachPosition(
      { x: 500, y: 360, width: 100, height: 110 },
      { x: 540, y: 370, width: 100, height: 110 },
    );

    expect(destination).toEqual({ x: 500, y: 370 });
  });
});