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

  it('rejects non-battle route nodes', () => {
    expect(() => createEncounterBattleBootstrap('departure')).toThrow(/unknown story encounter/);
  });
});
