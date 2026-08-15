import { describe, expect, it } from 'vitest';
import { resolveDamage } from './VitalResolver';

describe('vital resolution', () => {
  it('marks a combatant dead exactly when HP reaches zero', () => {
    const result = resolveDamage({ hp: 8, shield: 0, balance: 4, alive: true, broken: false }, 8, 1);
    expect(result).toMatchObject({ hp: 0, alive: false, died: true, hpLoss: 8 });
  });

  it('does not damage or revive an already dead combatant', () => {
    const result = resolveDamage({ hp: 0, shield: 0, balance: 0, alive: false, broken: true }, 99, 9);
    expect(result).toMatchObject({ hp: 0, alive: false, died: false, hpLoss: 0 });
  });

  it('keeps shield and stance outcomes separate from death', () => {
    const result = resolveDamage({ hp: 20, shield: 5, balance: 1, alive: true, broken: false }, 7, 1);
    expect(result).toMatchObject({ hp: 18, shield: 0, balance: 0, alive: true, died: false, justBroken: true, justShattered: true });
  });
});
