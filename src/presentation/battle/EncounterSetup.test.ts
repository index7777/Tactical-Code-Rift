import { describe, expect, it } from 'vitest';
import { encounterSetup } from './EncounterSetup';
import { storyEncounters } from '../../core/route/EncounterCatalog';

describe('encounter setup', () => {
  it('derives battle configuration without scene state', () => {
    expect(encounterSetup('battle-1')).toMatchObject({ enemyCount: 2, battlefield: 'rooftop', musicKey: 'battle-music' });
    expect(encounterSetup('boss-1')).toMatchObject({ enemyCount: 3, musicKey: 'boss-battle-music' });
  });
  it('creates a playable setup for every route battle node', () => {
    for (const encounter of Object.values(storyEncounters)) {
      expect(encounterSetup(encounter.nodeId)).toMatchObject({
        enemyCount: encounter.enemies.length,
        battlefield: encounter.battlefield,
      });
    }
  });
});
