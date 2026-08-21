import type { EnemyArchetype } from '../battle/BattleTypes';

export type EncounterBattlefield = 'rail-halt' | 'mountain-cut' | 'forest-path' | 'rooftop' | 'wayside' | 'exploration';

export interface StoryEncounter {
  nodeId: string;
  title: string;
  enemies: EnemyArchetype[];
  battlefield: EncounterBattlefield;
}

export const storyEncounters: Record<string, StoryEncounter> = {
  'battle-1': {
    nodeId: 'battle-1',
    title: '雨暮山麓・初遭遇',
    enemies: ['wet-corpse', 'lantern-child'],
    battlefield: 'rail-halt',
  },
  'battle-2-upper': {
    nodeId: 'battle-2-upper',
    title: '上線・獸影追行',
    enemies: ['mountain-hound', 'lantern-child', 'wet-corpse'],
    battlefield: 'mountain-cut',
  },
  'battle-2-lower': {
    nodeId: 'battle-2-lower',
    title: '下線・辻傘伏道',
    enemies: ['wayfarer-umbrella', 'wet-corpse', 'noose-ghost'],
    battlefield: 'rail-halt',
  },
  'battle-3-upper': {
    nodeId: 'battle-3-upper',
    title: '上線・山犬群襲',
    enemies: ['mountain-hound', 'noose-ghost', 'lantern-child', 'wet-corpse'],
    battlefield: 'mountain-cut',
  },
  'battle-3-lower': {
    nodeId: 'battle-3-lower',
    title: '下線・迷途夜道',
    enemies: ['wayfarer-umbrella', 'lost-monk', 'noose-ghost', 'wet-corpse'],
    battlefield: 'forest-path',
  },
  'elite-1': {
    nodeId: 'elite-1',
    title: '精英・雨夜武者',
    enemies: ['rain-warrior', 'mountain-hound', 'wet-corpse'],
    battlefield: 'rail-halt',
  },
  'boss-1': {
    nodeId: 'boss-1',
    title: '雨暮驛・終點',
    enemies: ['rain-boss', 'wayfarer-umbrella', 'noose-ghost'],
    battlefield: 'wayside',
  },
};

export function storyEncounter(nodeId?: string): StoryEncounter | undefined {
  return nodeId ? storyEncounters[nodeId] : undefined;
}
