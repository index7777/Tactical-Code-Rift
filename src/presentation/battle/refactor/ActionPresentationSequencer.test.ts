import { describe, expect, it } from 'vitest';
import {
  actionPresentationProfile,
  actionPresentationProfileForCardCategory,
  actionPresentationProfileIds,
  buildActionPresentationSequence,
  type ActionPresentationPhase,
} from './ActionPresentationSequencer';

const expectedPhases: readonly ActionPresentationPhase[] = [
  'FOCUS',
  'ANTICIPATION',
  'APPROACH',
  'STRIKE',
  'IMPACT',
  'RECOVERY',
  'RETURN',
];

describe('ActionPresentationSequencer', () => {
  it('exposes exactly the eight approved animated profiles', () => {
    expect(actionPresentationProfileIds()).toEqual([
      'quick-melee',
      'heavy-melee',
      'guard',
      'disruption',
      'break',
      'enemy-light',
      'enemy-heavy',
      'boss-signature',
    ]);
  });

  it('maps all five shared card families to their presentation profiles', () => {
    expect(actionPresentationProfileForCardCategory('quick')).toBe('quick-melee');
    expect(actionPresentationProfileForCardCategory('heavy')).toBe('heavy-melee');
    expect(actionPresentationProfileForCardCategory('guard')).toBe('guard');
    expect(actionPresentationProfileForCardCategory('disruption')).toBe('disruption');
    expect(actionPresentationProfileForCardCategory('break')).toBe('break');
  });

  it('builds deterministic cumulative markers in the fixed phase order', () => {
    const sequence = buildActionPresentationSequence('quick-melee');

    expect(sequence.markers.map((marker) => marker.phase)).toEqual(expectedPhases);
    expect(sequence.markers.map((marker) => marker.atMs)).toEqual([
      0,
      70,
      165,
      255,
      300,
      400,
      560,
    ]);
    expect(sequence.totalDurationMs).toBe(560);
    expect(sequence.markers.at(-1)?.atMs).toBe(sequence.totalDurationMs);
  });

  it('keeps every profile timing and presentation scalar within the contract', () => {
    for (const id of actionPresentationProfileIds()) {
      const profile = actionPresentationProfile(id);
      const timingValues = [
        profile.anticipationMs,
        profile.approachMs,
        profile.strikeMs,
        profile.impactHoldMs,
        profile.recoveryMs,
        profile.returnMs,
      ];

      expect(timingValues.every((value) => Number.isInteger(value) && value >= 0)).toBe(true);
      expect(Number.isFinite(profile.cameraZoom) && profile.cameraZoom >= 1).toBe(true);
      expect(Number.isFinite(profile.actorScale) && profile.actorScale >= 1).toBe(true);
      expect(Number.isFinite(profile.cameraImpulse) && profile.cameraImpulse >= 0).toBe(true);

      const sequence = buildActionPresentationSequence(id);
      expect(sequence.markers.map((marker) => marker.phase)).toEqual(expectedPhases);
      expect(sequence.markers.at(-1)?.atMs).toBe(sequence.totalDurationMs);
    }
  });

  it('keeps boss-signature slower and stronger than enemy-heavy', () => {
    const heavy = actionPresentationProfile('enemy-heavy');
    const boss = actionPresentationProfile('boss-signature');

    expect(buildActionPresentationSequence('boss-signature').totalDurationMs)
      .toBeGreaterThan(buildActionPresentationSequence('enemy-heavy').totalDurationMs);
    expect(boss.cameraZoom).toBeGreaterThan(heavy.cameraZoom);
    expect(boss.cameraImpulse).toBeGreaterThan(heavy.cameraImpulse);
  });

  it('returns defensive copies of profile data', () => {
    const profile = actionPresentationProfile('break');
    profile.cameraZoom = 99;

    expect(actionPresentationProfile('break').cameraZoom).toBe(1.12);
  });
});
