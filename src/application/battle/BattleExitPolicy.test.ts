import { describe, expect, it } from 'vitest';
import { battleExitDecision } from './BattleExitPolicy';

describe('battle exit policy', () => {
  it('returns every normal victory to the existing journey state', () => {
    expect(battleExitDecision('victory', 'battle-3-upper')).toEqual({
      label: '返回路線',
      destination: 'journey',
      markArea01Cleared: false,
    });
  });

  it('marks Area 01 clear only after the Boss victory', () => {
    expect(battleExitDecision('victory', 'boss-1').markArea01Cleared).toBe(true);
    expect(battleExitDecision('victory', 'elite-1').markArea01Cleared).toBe(false);
  });

  it('retries the same encounter after defeat without clearing the area', () => {
    expect(battleExitDecision('defeat', 'boss-1')).toEqual({
      label: '重新挑戰',
      destination: 'retry',
      markArea01Cleared: false,
    });
  });
});
