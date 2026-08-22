import { describe, expect, it } from 'vitest';
import {
  RAIN_WARRIOR_ACTIONS,
  RAIN_WARRIOR_BASE_RESILIENCE,
  RAIN_WARRIOR_HP,
  rainWarriorActionAt,
} from './EliteEnemyActionCatalog';

describe('EliteEnemyActionCatalog', () => {
  it('authors the approved Elite HP and resilience', () => {
    expect(RAIN_WARRIOR_HP).toBe(120);
    expect(RAIN_WARRIOR_BASE_RESILIENCE).toBe(1);
  });

  it('authors fast, control, then heavy actions with approved values', () => {
    expect(RAIN_WARRIOR_ACTIONS.map((action) => ({
      name: action.name,
      damage: action.hits[0]?.damage,
      delay: action.actionDelay,
      telegraph: action.telegraph.level,
      presentation: action.presentationProfile,
    }))).toEqual([
      { name: '踏込', damage: 10, delay: 4, telegraph: 'normal', presentation: 'enemy-light' },
      { name: '崩し', damage: 8, delay: 5, telegraph: 'normal', presentation: 'enemy-light' },
      { name: '居合', damage: 16, delay: 7, telegraph: 'danger', presentation: 'enemy-heavy' },
    ]);
  });

  it('cycles deterministically and never repeats iai consecutively', () => {
    const names = Array.from({ length: 8 }, (_, sequence) => rainWarriorActionAt(sequence).name);
    expect(names).toEqual(['踏込', '崩し', '居合', '踏込', '崩し', '居合', '踏込', '崩し']);
    for (let index = 1; index < names.length; index += 1) {
      expect(names[index] === '居合' && names[index - 1] === '居合').toBe(false);
    }
  });

  it('keeps production Elite Clash disabled in this phase', () => {
    expect(RAIN_WARRIOR_ACTIONS.every((action) => action.clash.mode === 'none')).toBe(true);
  });

  it('returns detached definitions and rejects invalid sequences', () => {
    const first = rainWarriorActionAt(0);
    const second = rainWarriorActionAt(0);
    expect(first).not.toBe(second);
    expect(first.hits).not.toBe(second.hits);
    expect(() => rainWarriorActionAt(-1)).toThrow(/non-negative integer/);
  });
});
