import { describe, expect, it } from 'vitest';
import { decisionCameraTarget } from './DecisionCameraPolicy';

describe('DecisionCameraPolicy', () => {
  const actor = { x: 320, y: 420 };

  it('keeps PEEK as a light active-actor focus', () => {
    expect(decisionCameraTarget({ handState: 'PEEK', activeActor: actor })).toEqual({
      mode: 'PEEK',
      x: 576,
      y: 369.6,
      zoom: 1.05,
      durationMs: 180,
    });
  });

  it('uses a stronger FOCUS frame biased toward the neutral action zone', () => {
    const target = decisionCameraTarget({ handState: 'FOCUS', activeActor: actor });
    expect(target?.mode).toBe('FOCUS');
    expect(target?.zoom).toBe(1.08);
    expect(target?.x).toBeGreaterThan(actor.x);
    expect(target?.x).toBeLessThan(700);
  });

  it('frames actor and selected target together during TARGETING', () => {
    expect(decisionCameraTarget({
      handState: 'TARGETING',
      activeActor: actor,
      selectedTarget: { x: 920, y: 440 },
    })).toEqual({
      mode: 'TARGETING',
      x: 620,
      y: 430,
      zoom: 1.12,
      durationMs: 180,
    });
  });

  it('falls back to FOCUS if TARGETING has no selected target point', () => {
    expect(decisionCameraTarget({ handState: 'TARGETING', activeActor: actor })?.mode).toBe('FOCUS');
  });

  it('clamps extreme target midpoints to the existing stage camera safe bounds', () => {
    expect(decisionCameraTarget({
      handState: 'TARGETING',
      activeActor: { x: -1000, y: -1000 },
      selectedTarget: { x: -800, y: -900 },
    })).toMatchObject({ x: 270, y: 280, zoom: 1.12 });
  });

  it('returns no decision-camera ownership while the hand is HIDDEN', () => {
    expect(decisionCameraTarget({ handState: 'HIDDEN', activeActor: actor })).toBeUndefined();
  });

  it('returns neutral battlefield framing for DISPATCH', () => {
    expect(decisionCameraTarget({ handState: 'DISPATCH' })).toEqual({
      mode: 'DISPATCH',
      x: 640,
      y: 360,
      zoom: 1,
      durationMs: 180,
    });
  });
});
