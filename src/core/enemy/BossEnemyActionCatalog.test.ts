import { describe, expect, it } from 'vitest';
import {
  RAIN_BOSS_ACTIONS,
  RAIN_BOSS_BASE_RESILIENCE,
  RAIN_BOSS_HP,
  rainBossActionsForPhase,
  rainBossPhase,
  selectRainBossAction,
} from './BossEnemyActionCatalog';

describe('BossEnemyActionCatalog', () => {
  it('authors the five approved Boss actions without flattening multi-hit or AoE semantics', () => {
    expect(RAIN_BOSS_ACTIONS).toHaveLength(5);
    expect(RAIN_BOSS_HP).toBe(240);
    expect(RAIN_BOSS_BASE_RESILIENCE).toBe(1);

    expect(RAIN_BOSS_ACTIONS.find((action) => action.name === '雨斬')).toMatchObject({
      targetMode: 'single-enemy',
      hits: [{ damage: 12 }],
      actionDelay: 5,
    });
    expect(RAIN_BOSS_ACTIONS.find((action) => action.name === '山影連刃')).toMatchObject({
      targetMode: 'single-enemy',
      hits: [{ damage: 6, repeats: 2 }],
      actionDelay: 5,
    });
    expect(RAIN_BOSS_ACTIONS.find((action) => action.name === '驟雨橫掃')).toMatchObject({
      targetMode: 'all-enemies',
      hits: [{ damage: 8 }],
      actionDelay: 7,
      telegraph: { level: 'danger' },
    });
    expect(RAIN_BOSS_ACTIONS.find((action) => action.name === '壓雨')).toMatchObject({
      targetMode: 'single-enemy',
      hits: [{ damage: 10 }],
      actionDelay: 6,
    });
    expect(RAIN_BOSS_ACTIONS.find((action) => action.name === '終雨')).toMatchObject({
      targetMode: 'single-enemy',
      hits: [{ damage: 18 }],
      actionDelay: 8,
      telegraph: { level: 'signature' },
      ai: { minPhase: 3, maxPhase: 3, cooldownActions: 2 },
      presentationProfile: 'boss-signature',
    });
  });

  it('uses exact HP ratio boundaries for three phases', () => {
    expect(rainBossPhase(169, 240)).toBe(1);
    expect(rainBossPhase(168, 240)).toBe(2);
    expect(rainBossPhase(85, 240)).toBe(2);
    expect(rainBossPhase(84, 240)).toBe(3);
    expect(rainBossPhase(0, 240)).toBe(3);
  });

  it('exposes the correct cumulative action pools by phase', () => {
    expect(rainBossActionsForPhase(1).map((action) => action.name)).toEqual([
      '雨斬',
      '山影連刃',
    ]);
    expect(rainBossActionsForPhase(2).map((action) => action.name)).toEqual([
      '雨斬',
      '山影連刃',
      '驟雨橫掃',
      '壓雨',
    ]);
    expect(rainBossActionsForPhase(3).map((action) => action.name)).toEqual([
      '雨斬',
      '山影連刃',
      '驟雨橫掃',
      '壓雨',
      '終雨',
    ]);
  });

  it('selects deterministically for the same state and sequence', () => {
    const input = { hp: 150, sequence: 6, recentActionIds: ['rain-boss:rain-slash'] } as const;
    expect(selectRainBossAction(input)).toEqual(selectRainBossAction(input));
  });

  it('never selects 終雨 before phase 3', () => {
    for (let sequence = 0; sequence < 20; sequence += 1) {
      expect(selectRainBossAction({ hp: 150, sequence }).name).not.toBe('終雨');
    }
  });

  it('enforces the two-action signature cooldown and falls through deterministically', () => {
    expect(selectRainBossAction({ hp: 60, sequence: 4 }).name).toBe('終雨');

    const blocked = selectRainBossAction({
      hp: 60,
      sequence: 4,
      recentActionIds: ['rain-boss:rain-slash', 'rain-boss:final-rain'],
    });
    expect(blocked.name).toBe('雨斬');

    const stillBlocked = selectRainBossAction({
      hp: 60,
      sequence: 4,
      recentActionIds: ['rain-boss:final-rain', 'rain-boss:rain-slash'],
    });
    expect(stillBlocked.name).toBe('雨斬');

    const cooledDown = selectRainBossAction({
      hp: 60,
      sequence: 4,
      recentActionIds: ['rain-boss:rain-slash', 'rain-boss:mountain-shadow-blades'],
    });
    expect(cooledDown.name).toBe('終雨');
  });

  it('rejects invalid HP and action sequence input', () => {
    expect(() => rainBossPhase(241, 240)).toThrow(/rain-boss HP/);
    expect(() => rainBossPhase(-1, 240)).toThrow(/rain-boss HP/);
    expect(() => selectRainBossAction({ hp: 240, sequence: -1 })).toThrow(/sequence/);
  });
});
