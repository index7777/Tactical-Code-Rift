import { describe, expect, it } from 'vitest';
import { shouldStartJourney } from './EntryMode';

describe('shouldStartJourney', () => {
  it('uses the journey as the only public entry', () => {
    expect(shouldStartJourney(new URLSearchParams())).toBe(true);
    expect(shouldStartJourney(new URLSearchParams('anything=1'))).toBe(true);
  });

  it('enters battle only when a journey node explicitly starts one', () => {
    expect(shouldStartJourney(new URLSearchParams(), 'battle-1')).toBe(false);
    expect(shouldStartJourney(new URLSearchParams('anything=1'), 'elite-1')).toBe(false);
  });
});
