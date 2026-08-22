import { describe, expect, it } from 'vitest';
import { intentStateFromEnemyAction } from './EnemyActionIntentAdapter';
import {
  NORMAL_ENEMY_ACTIONS,
  NORMAL_ENEMY_BASE_RESILIENCE,
  NORMAL_ENEMY_HP,
  normalEnemyActionAt,
  type NormalEnemyArchetype,
} from './NormalEnemyActionCatalog';

const expected: Readonly<Record<NormalEnemyArchetype, readonly [string, number, number][]>> = {
  'lantern-child': [['鬼火疾走', 7, 3], ['燈影截', 8, 4]],
  'wet-corpse': [['柴刀斬', 9, 5], ['濡手', 7, 4]],
  'mountain-hound': [['濡鬃撲咬', 8, 3], ['山影追咬', 9, 4]],
  'noose-ghost': [['濕繩纏', 6, 5], ['吊影', 8, 5]],
  'lost-monk': [['錫杖牽制', 8, 5], ['迷途印', 6, 6]],
  'wayfarer-umbrella': [['開傘壓', 12, 6], ['傘骨重劈', 15, 7]],
};

describe('NormalEnemyActionCatalog', () => {
  it('authors the approved two-action Normal pools with exact damage and Delay', () => {
    for (const [archetype, rows] of Object.entries(expected) as [NormalEnemyArchetype, readonly [string, number, number][]][]) {
      const pool = NORMAL_ENEMY_ACTIONS[archetype];
      expect(pool).toHaveLength(2);
      expect(pool.map((action) => [action.name, action.hits[0]?.damage, action.actionDelay])).toEqual(rows);
      expect(pool.every((action) => action.clash.mode === 'none')).toBe(true);
    }
  });

  it('uses the approved HP and base resilience values', () => {
    expect(NORMAL_ENEMY_HP).toEqual({
      'lantern-child': 34,
      'wet-corpse': 42,
      'mountain-hound': 40,
      'noose-ghost': 40,
      'lost-monk': 48,
      'wayfarer-umbrella': 58,
    });
    expect(NORMAL_ENEMY_BASE_RESILIENCE).toEqual({
      'lantern-child': 0,
      'wet-corpse': 0,
      'mountain-hound': 0,
      'noose-ghost': 1,
      'lost-monk': 1,
      'wayfarer-umbrella': 1,
    });
  });

  it('marks both umbrella actions as danger and heavy presentation', () => {
    for (const action of NORMAL_ENEMY_ACTIONS['wayfarer-umbrella']) {
      expect(action.telegraph.level).toBe('danger');
      expect(action.presentationProfile).toBe('enemy-heavy');
    }
  });

  it('selects actions deterministically in a cyclic order', () => {
    expect(normalEnemyActionAt('wet-corpse', 0).name).toBe('柴刀斬');
    expect(normalEnemyActionAt('wet-corpse', 1).name).toBe('濡手');
    expect(normalEnemyActionAt('wet-corpse', 2).name).toBe('柴刀斬');
    expect(normalEnemyActionAt('wet-corpse', 3).name).toBe('濡手');
  });

  it('adapts authored single-target enemy actions into the current public Intent boundary', () => {
    const action = normalEnemyActionAt('lantern-child', 1);
    const intent = intentStateFromEnemyAction(action, 'lantern-child', 'oboro', 7);

    expect(intent).toMatchObject({
      enemyId: 'lantern-child',
      name: '燈影截',
      targetIds: ['oboro'],
      damage: 8,
      delay: 4,
      canDelay: true,
      canInterrupt: true,
      canGuard: true,
      canRedirect: true,
      statusEffects: [],
    });
  });
});
