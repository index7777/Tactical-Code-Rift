import { describe, expect, it } from 'vitest';
import type { TimelineNodeView } from './TimelinePresenter';
import {
  ACTIVE_ACTOR_FOCUS_ZOOM,
  ACTIVE_ACTOR_STEP_X,
  focusCameraTarget,
  focusedActorPosition,
  focusedPlayerActorId,
} from './RefactorBattleFocusPolicy';

const timeline: TimelineNodeView[] = [
  { actorId: 'rin', team: 'player', nextActionAt: 0, intentTargetIds: [] },
  { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, intentTargetIds: ['rin'] },
];

describe('RefactorBattleFocusPolicy', () => {
  it('focuses the active player only during player decision phases', () => {
    expect(focusedPlayerActorId('PLAYER_IDLE', 'rin', timeline)).toBe('rin');
    expect(focusedPlayerActorId('CARD_SELECTED', 'rin', timeline)).toBe('rin');
    expect(focusedPlayerActorId('TARGET_PREVIEW', 'rin', timeline)).toBe('rin');
    expect(focusedPlayerActorId('WAITING_FOR_NEXT_ACTOR', 'rin', timeline)).toBeUndefined();
  });

  it('does not focus an active enemy actor', () => {
    expect(focusedPlayerActorId('ENEMY_EXECUTING', 'ghost-fire', timeline)).toBeUndefined();
  });

  it('steps only the focused actor toward the battlefield center', () => {
    expect(focusedActorPosition(300, 315, true)).toEqual({ x: 300 + ACTIVE_ACTOR_STEP_X, y: 315 });
    expect(focusedActorPosition(300, 315, false)).toEqual({ x: 300, y: 315 });
  });

  it('uses a restrained 1.05 world-camera focus biased toward the actor', () => {
    const target = focusCameraTarget(300, 315);
    expect(target.zoom).toBe(ACTIVE_ACTOR_FOCUS_ZOOM);
    expect(target.x).toBeGreaterThan(300);
    expect(target.x).toBeLessThan(640);
    expect(target.y).toBeGreaterThan(315);
    expect(target.y).toBeLessThan(360);
  });
});
