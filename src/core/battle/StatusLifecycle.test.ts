import { describe, expect, it } from 'vitest';
import { clearEndOfRoundStatuses } from './StatusLifecycle';

describe('round status lifecycle', () => {
  it('clears exposed and restores stance after the round', () => {
    const actor = { alive: true, broken: true, exposed: true };
    clearEndOfRoundStatuses([actor]);
    expect(actor).toEqual({ alive: true, broken: false, exposed: false });
  });

  it('does not restore a dead actor', () => {
    const actor = { alive: false, broken: true, exposed: true };
    clearEndOfRoundStatuses([actor]);
    expect(actor).toEqual({ alive: false, broken: true, exposed: false });
  });
});
