import { describe, expect, it } from 'vitest';
import { storyEncounter, storyEncounters } from './EncounterCatalog';

const battleNodes = ['battle-1','battle-2-upper','battle-2-lower','battle-3-upper','battle-3-lower','elite-1','boss-1'];

describe('story encounter catalog',()=>{
  it('binds every implemented combat node to a real encounter',()=>{
    for(const id of battleNodes){
      const encounter=storyEncounter(id);
      expect(encounter?.enemies.length).toBeGreaterThan(0);
      expect(encounter?.nodeId).toBe(id);
    }
  });
  it('keeps first battle as a two-enemy tutorial and later nodes varied',()=>{
    expect(storyEncounters['battle-1']?.enemies).toHaveLength(2);
    expect(new Set(storyEncounters['battle-2-upper']?.enemies).size).toBeGreaterThan(1);
    expect(storyEncounters['elite-1']?.enemies[0]).toBe('rain-warrior');
    expect(storyEncounters['boss-1']?.enemies[0]).toBe('rain-boss');
  });
});
