import { describe, expect, it } from 'vitest';
import { storyEncounters } from '../../core/route/EncounterCatalog';
import {
  createEncounterBattleBootstrap,
  createEncounterEnemyIntent,
} from './createEncounterBattleBootstrap';

describe('encounter battle bootstrap', () => {
  it('creates the canonical enemy roster for every route battle node', () => {
    for (const encounter of Object.values(storyEncounters)) {
      const { controller } = createEncounterBattleBootstrap(encounter.nodeId);
      const battle = controller.battle();
      const enemyIds = battle.timeline.entries
        .filter((entry) => entry.team === 'enemy')
        .map((entry) => entry.actorId);
      expect(enemyIds.sort()).toEqual([...encounter.enemies].sort());
      expect(enemyIds.every((enemyId) => (battle.vitalsByActorId[enemyId]?.hp ?? 0) > 0)).toBe(true);
    }
  });

  it('builds canonical intents for all Area 01 enemies', () => {
    const enemyIds = new Set(Object.values(storyEncounters).flatMap((encounter) => encounter.enemies));
    for (const enemyId of enemyIds) {
      const intent = createEncounterEnemyIntent(enemyId);
      expect(intent.enemyId).toBe(enemyId);
      expect(intent.targetIds).toHaveLength(1);
      expect(intent.damage).toBeGreaterThan(0);
    }
  });

  it('uses authored Normal action values instead of legacy EnemySkill tempo conversion', () => {
    expect(createEncounterEnemyIntent('lantern-child', 0)).toMatchObject({
      name: '鬼火疾走', damage: 7, delay: 3, targetIds: ['rin'],
    });
    expect(createEncounterEnemyIntent('lantern-child', 1)).toMatchObject({
      name: '燈影截', damage: 8, delay: 4, targetIds: ['chikage'],
    });
    expect(createEncounterEnemyIntent('wayfarer-umbrella', 0)).toMatchObject({
      name: '開傘壓', damage: 12, delay: 6,
    });
    expect(createEncounterEnemyIntent('wayfarer-umbrella', 1)).toMatchObject({
      name: '傘骨重劈', damage: 15, delay: 7,
    });
  });

  it('uses the approved Normal HP and base resilience in production encounter bootstrap', () => {
    const { controller } = createEncounterBattleBootstrap('battle-3-lower');
    const battle = controller.battle();

    expect(battle.vitalsByActorId['wayfarer-umbrella']).toMatchObject({ hp: 58, maxHp: 58 });
    expect(battle.vitalsByActorId['lost-monk']).toMatchObject({ hp: 48, maxHp: 48 });
    expect(battle.vitalsByActorId['noose-ghost']).toMatchObject({ hp: 40, maxHp: 40 });
    expect(battle.vitalsByActorId['wet-corpse']).toMatchObject({ hp: 42, maxHp: 42 });
    expect(battle.resilienceByEnemyId['wayfarer-umbrella']).toMatchObject({ base: 1, temporary: 0 });
    expect(battle.resilienceByEnemyId['lost-monk']).toMatchObject({ base: 1, temporary: 0 });
    expect(battle.resilienceByEnemyId['noose-ghost']).toMatchObject({ base: 1, temporary: 0 });
    expect(battle.resilienceByEnemyId['wet-corpse']).toMatchObject({ base: 0, temporary: 0 });
  });

  it('uses the authored rain-warrior fast-control-heavy cadence without consecutive iai', () => {
    expect(createEncounterEnemyIntent('rain-warrior', 0)).toMatchObject({
      name: '踏込', damage: 10, delay: 4, targetIds: ['rin'],
    });
    expect(createEncounterEnemyIntent('rain-warrior', 1)).toMatchObject({
      name: '崩し', damage: 8, delay: 5, targetIds: ['chikage'],
    });
    expect(createEncounterEnemyIntent('rain-warrior', 2)).toMatchObject({
      name: '居合', damage: 16, delay: 7, targetIds: ['oboro'],
    });
    expect(createEncounterEnemyIntent('rain-warrior', 3)).toMatchObject({
      name: '踏込', damage: 10, delay: 4, targetIds: ['mo'],
    });
  });

  it('uses the approved Elite HP and base resilience in elite-1', () => {
    const { controller } = createEncounterBattleBootstrap('elite-1');
    const battle = controller.battle();

    expect(battle.vitalsByActorId['rain-warrior']).toMatchObject({ hp: 120, maxHp: 120 });
    expect(battle.resilienceByEnemyId['rain-warrior']).toMatchObject({ base: 1, temporary: 0 });
  });

  it('uses the approved Boss HP and base resilience while keeping the existing Intent fallback', () => {
    const { controller } = createEncounterBattleBootstrap('boss-1');
    const battle = controller.battle();

    expect(battle.vitalsByActorId['rain-boss']).toMatchObject({ hp: 240, maxHp: 240 });
    expect(battle.resilienceByEnemyId['rain-boss']).toMatchObject({ base: 1, temporary: 0 });

    const fallbackIntent = createEncounterEnemyIntent('rain-boss', 0);
    expect(fallbackIntent).toMatchObject({ enemyId: 'rain-boss', targetIds: ['rin'] });
  });

  it('rejects non-battle route nodes', () => {
    expect(() => createEncounterBattleBootstrap('departure')).toThrow(/unknown story encounter/);
  });
});
