import {
  createActionDefinition,
  type ActionDefinition,
} from '../actions/ActionDefinition';

export type NormalEnemyArchetype =
  | 'lantern-child'
  | 'wet-corpse'
  | 'mountain-hound'
  | 'noose-ghost'
  | 'lost-monk'
  | 'wayfarer-umbrella';

function normalAction(
  id: string,
  name: string,
  damage: number,
  actionDelay: number,
  presentationProfile: ActionDefinition['presentationProfile'] = 'enemy-light',
  telegraphLevel: ActionDefinition['telegraph']['level'] = 'normal',
): ActionDefinition {
  return createActionDefinition({
    id,
    owner: 'enemy',
    name,
    targetMode: 'single-enemy',
    hits: [{ damage }],
    actionDelay,
    statuses: [],
    clash: { mode: 'none', tags: [] },
    telegraph: { level: telegraphLevel },
    ai: { weight: 1 },
    counterplay: {
      delayable: true,
      interruptible: true,
      guardable: true,
      redirectable: true,
    },
    presentationProfile,
  });
}

export const NORMAL_ENEMY_ACTIONS: Readonly<Record<NormalEnemyArchetype, readonly ActionDefinition[]>> = {
  'lantern-child': [
    normalAction('lantern-child:ghost-fire-rush', '鬼火疾走', 7, 3),
    normalAction('lantern-child:lantern-shadow-cut', '燈影截', 8, 4),
  ],
  'wet-corpse': [
    normalAction('wet-corpse:hatchet-cut', '柴刀斬', 9, 5),
    normalAction('wet-corpse:wet-hand', '濡手', 7, 4),
  ],
  'mountain-hound': [
    normalAction('mountain-hound:wet-mane-bite', '濡鬃撲咬', 8, 3),
    normalAction('mountain-hound:shadow-chase-bite', '山影追咬', 9, 4),
  ],
  'noose-ghost': [
    normalAction('noose-ghost:wet-rope-bind', '濕繩纏', 6, 5),
    normalAction('noose-ghost:hanging-shadow', '吊影', 8, 5),
  ],
  'lost-monk': [
    normalAction('lost-monk:staff-control', '錫杖牽制', 8, 5),
    normalAction('lost-monk:lost-mark', '迷途印', 6, 6),
  ],
  'wayfarer-umbrella': [
    normalAction('wayfarer-umbrella:umbrella-pressure', '開傘壓', 12, 6, 'enemy-heavy', 'danger'),
    normalAction('wayfarer-umbrella:rib-heavy-strike', '傘骨重劈', 15, 7, 'enemy-heavy', 'danger'),
  ],
};

export const NORMAL_ENEMY_HP: Readonly<Record<NormalEnemyArchetype, number>> = {
  'lantern-child': 34,
  'wet-corpse': 42,
  'mountain-hound': 40,
  'noose-ghost': 40,
  'lost-monk': 48,
  'wayfarer-umbrella': 58,
};

export const NORMAL_ENEMY_BASE_RESILIENCE: Readonly<Record<NormalEnemyArchetype, number>> = {
  'lantern-child': 0,
  'wet-corpse': 0,
  'mountain-hound': 0,
  'noose-ghost': 1,
  'lost-monk': 1,
  'wayfarer-umbrella': 1,
};

export function isNormalEnemyArchetype(value: string): value is NormalEnemyArchetype {
  return Object.prototype.hasOwnProperty.call(NORMAL_ENEMY_ACTIONS, value);
}

export function normalEnemyActionAt(
  archetype: NormalEnemyArchetype,
  sequence: number,
): ActionDefinition {
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error('normal enemy action sequence must be a non-negative integer');
  }
  const pool = NORMAL_ENEMY_ACTIONS[archetype];
  if (!pool.length) throw new Error(`normal enemy action pool is empty: ${archetype}`);
  return createActionDefinition(pool[sequence % pool.length]!);
}
