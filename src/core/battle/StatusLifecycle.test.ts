import { describe, expect, it } from 'vitest';
import { clearEndOfRoundStatuses } from './StatusLifecycle';

describe('round status lifecycle', () => {
  it('clears exposed and restores stance after the round', () => {
    const actor = { alive: true, broken: true, exposed: true, tempShield: 0 };
    clearEndOfRoundStatuses([actor]);
    expect(actor).toEqual({ alive: true, broken: false, exposed: false, tempShield: 0 });
  });

  it('does not restore a dead actor', () => {
    const actor = { alive: false, broken: true, exposed: true, tempShield: 0 };
    clearEndOfRoundStatuses([actor]);
    expect(actor).toEqual({ alive: false, broken: true, exposed: false, tempShield: 0 });
  });

  it('clears temporary shield at end of round', () => {
    const alive = { alive: true, broken: false, exposed: false, tempShield: 12 };
    const dead = { alive: false, broken: false, exposed: false, tempShield: 6 };
    clearEndOfRoundStatuses([alive, dead]);
    expect(alive.tempShield).toBe(0);
    expect(dead.tempShield).toBe(0);
  });
});
