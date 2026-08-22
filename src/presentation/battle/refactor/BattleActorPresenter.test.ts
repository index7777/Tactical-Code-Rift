import { describe, expect, it } from 'vitest';
import {
  PLAYER_HOME_POSITIONS,
  REFACTOR_BATTLE_LAYOUT,
  actionApproachPosition,
  perspectiveScaleForY,
} from './BattleActorPresenter';

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

describe('Phase 10m battlefield layout', () => {
  it('uses wider horizontal formation spread while staying in the player side', () => {
    const xs = PLAYER_HOME_POSITIONS.map((position) => position.x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(280);
    expect(Math.max(...xs)).toBeLessThanOrEqual(540);
    expect(PLAYER_HOME_POSITIONS[1].x - PLAYER_HOME_POSITIONS[0].x).toBeGreaterThanOrEqual(170);
    expect(PLAYER_HOME_POSITIONS[3].x - PLAYER_HOME_POSITIONS[2].x).toBeGreaterThanOrEqual(170);
  });

  it('keeps floating HUD panels compact', () => {
    expect(REFACTOR_BATTLE_LAYOUT.partyRail.width).toBeLessThanOrEqual(130);
    expect(REFACTOR_BATTLE_LAYOUT.partyRail.height).toBeLessThanOrEqual(140);
    expect(REFACTOR_BATTLE_LAYOUT.intentPanel.height).toBeLessThanOrEqual(120);
    expect(REFACTOR_BATTLE_LAYOUT.hand.height).toBeLessThanOrEqual(180);
  });

  it('increases perspective scale toward the foreground', () => {
    expect(perspectiveScaleForY(450)).toBeGreaterThan(perspectiveScaleForY(320));
  });
});
