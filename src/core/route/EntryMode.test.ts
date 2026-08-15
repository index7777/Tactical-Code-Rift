import { describe, expect, it } from 'vitest';
import { shouldStartJourney } from './EntryMode';

describe('shouldStartJourney', () => {
  it('uses the journey as the public default entry', () => {
    expect(shouldStartJourney(new URLSearchParams())).toBe(true);
    expect(shouldStartJourney(new URLSearchParams('journey=1'))).toBe(true);
  });

  it('keeps explicit battle and proof links in the battle scene', () => {
    for (const query of ['battle=1', 'scene=rooftop', 'draw-proof=1', 'result-proof=1', 'monster-proof=swift', 'boss-proof=1', 'death-proof=1', 'outcome-proof=1', 'relay-proof=1']) {
      expect(shouldStartJourney(new URLSearchParams(query))).toBe(false);
    }
  });

  it('does not interrupt a battle entered from a journey node', () => {
    expect(shouldStartJourney(new URLSearchParams(), 'battle-1')).toBe(false);
  });
});
