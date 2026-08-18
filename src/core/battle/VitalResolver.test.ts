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
    // 20 HP、shield 5、balance 1 承受 7 傷、balance dmg 1：
    // shield 吸 5，直接 HP 傷 2；balance 歸 0 觸發崩勢，追加 4 HP 內傷、balance 重置為 8。
    const result = resolveDamage({ hp: 20, shield: 5, balance: 1, alive: true, broken: false }, 7, 1);
    expect(result).toMatchObject({ hp: 14, shield: 0, balance: 8, alive: true, died: false, justBroken: true, justShattered: true, hpLoss: 6 });
  });

  it('adds the broken HP penalty once and refills balance on the same hit', () => {
    // 已崩勢者再次受擊：不重觸發崩勢懲罰，balance 也不被重置為 8。
    const first = resolveDamage({ hp: 30, shield: 0, balance: 2, alive: true, broken: false }, 3, 2);
    expect(first).toMatchObject({ hp: 23, balance: 8, justBroken: true, broken: true });
    const second = resolveDamage(first, 3, 2);
    expect(second).toMatchObject({ hp: 20, balance: 6, justBroken: false, broken: true });
  });
});
