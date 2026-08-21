import { describe, expect, it } from 'vitest';
import { encounterSetup } from './EncounterSetup';

describe('encounter setup', () => {
  it('derives battle configuration without scene state', () => {
    expect(encounterSetup('battle-1')).toMatchObject({ enemyCount: 2, battlefield: 'rooftop', musicKey: 'battle-music' });
    expect(encounterSetup('boss-1')).toMatchObject({ enemyCount: 3, musicKey: 'boss-battle-music' });
  });
});
