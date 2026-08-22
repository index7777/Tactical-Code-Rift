import { enemyArchetypePools } from '../../core/battle/EnemySkills';
import type { EnemyArchetype } from '../../core/battle/BattleTypes';
import { createRefactorDeck } from '../../core/cards/RefactorDeck';
import { intentStateFromEnemyAction } from '../../core/enemy/EnemyActionIntentAdapter';
import {
  isNormalEnemyArchetype,
  NORMAL_ENEMY_BASE_RESILIENCE,
  NORMAL_ENEMY_HP,
  normalEnemyActionAt,
} from '../../core/enemy/NormalEnemyActionCatalog';
import { createIntentState, type IntentState } from '../../core/intents/IntentState';
import type { BattleResolutionState } from '../../core/resolution/BattleResolutionResolver';
import { storyEncounter } from '../../core/route/EncounterCatalog';
import { createControlResilience } from '../../core/status/ControlResilience';
import { createBattleTimeline } from '../../core/timeline/BattleTimeline';
import { BattleTurnController } from './BattleTurnController';
import { REFACTOR_QA_CARD_DEFINITIONS } from './createRefactorBattleBootstrap';

const PLAYER_IDS = ['rin', 'chikage', 'oboro', 'mo'] as const;
const PLAYER_HP: Readonly<Record<(typeof PLAYER_IDS)[number], number>> = {
  rin: 40,
  chikage: 44,
  oboro: 36,
  mo: 48,
};

const LEGACY_ENEMY_HP: Readonly<Record<Exclude<EnemyArchetype,
  | 'lantern-child'
  | 'wet-corpse'
  | 'mountain-hound'
  | 'noose-ghost'
  | 'lost-monk'
  | 'wayfarer-umbrella'>, number>> = {
  swift: 34,
  crusher: 54,
  hexer: 38,
  'rain-warrior': 72,
  'rain-boss': 128,
};

function targetFor(enemyIndex: number): (typeof PLAYER_IDS)[number] {
  return PLAYER_IDS[enemyIndex % PLAYER_IDS.length];
}

function enemyHp(archetype: EnemyArchetype): number {
  if (isNormalEnemyArchetype(archetype)) return NORMAL_ENEMY_HP[archetype];
  return LEGACY_ENEMY_HP[archetype];
}

function enemyBaseResilience(archetype: EnemyArchetype): number {
  return isNormalEnemyArchetype(archetype)
    ? NORMAL_ENEMY_BASE_RESILIENCE[archetype]
    : 0;
}

export function createEncounterEnemyIntent(enemyId: string, sequence = 0): IntentState {
  const archetype = enemyId as EnemyArchetype;

  if (isNormalEnemyArchetype(archetype)) {
    return intentStateFromEnemyAction(
      normalEnemyActionAt(archetype, sequence),
      enemyId,
      targetFor(sequence),
      sequence,
    );
  }

  const pool = enemyArchetypePools[archetype];
  if (!pool?.length) throw new Error(`unknown encounter enemy: ${enemyId}`);
  const skill = pool[sequence % pool.length]!;
  return createIntentState({
    id: `${enemyId}:${sequence}:${skill.name}`,
    enemyId,
    kind: 'normal',
    name: skill.name,
    targetIds: [targetFor(sequence)],
    damage: skill.damage,
    delay: Math.max(3, 6 - (skill.tempo ?? 0)),
    canDelay: true,
    canInterrupt: true,
    canGuard: true,
    canRedirect: true,
    statusEffects: [],
  });
}

export interface EncounterBattleBootstrap {
  controller: BattleTurnController;
  enemyIntentProvider: (enemyId: string) => IntentState;
}

export function createEncounterBattleBootstrap(
  journeyNodeId: string,
  seed = 20260822,
): EncounterBattleBootstrap {
  const encounter = storyEncounter(journeyNodeId);
  if (!encounter) throw new Error(`unknown story encounter: ${journeyNodeId}`);

  const vitalsByActorId: BattleResolutionState['vitalsByActorId'] = {};
  for (const playerId of PLAYER_IDS) {
    vitalsByActorId[playerId] = { actorId: playerId, hp: PLAYER_HP[playerId], maxHp: PLAYER_HP[playerId] };
  }
  for (const enemyId of encounter.enemies) {
    const hp = enemyHp(enemyId);
    vitalsByActorId[enemyId] = { actorId: enemyId, hp, maxHp: hp };
  }

  const intentSequence = new Map<string, number>();
  const nextIntent = (enemyId: string): IntentState => {
    const sequence = (intentSequence.get(enemyId) ?? 0) + 1;
    intentSequence.set(enemyId, sequence);
    return createEncounterEnemyIntent(enemyId, sequence);
  };

  const intentByEnemyId = Object.fromEntries(
    encounter.enemies.map((enemyId, index) => {
      intentSequence.set(enemyId, index);
      return [enemyId, createEncounterEnemyIntent(enemyId, index)];
    }),
  );
  const resilienceByEnemyId = Object.fromEntries(
    encounter.enemies.map((enemyId) => [
      enemyId,
      createControlResilience(enemyBaseResilience(enemyId), 0),
    ]),
  );
  const timelineEntries = [
    ...PLAYER_IDS.map((actorId, index) => ({ actorId, team: 'player' as const, nextActionAt: index * 3, tieBreaker: index })),
    ...encounter.enemies.map((actorId, index) => ({ actorId, team: 'enemy' as const, nextActionAt: 4 + index * 3, tieBreaker: 10 + index })),
  ];
  const state: BattleResolutionState = {
    timeline: createBattleTimeline(timelineEntries),
    vitalsByActorId,
    intentByEnemyId,
    resilienceByEnemyId,
    breakWindows: [],
    nextBreakWindowSequence: 1,
    guardByTargetId: {},
    oboroDelayUsedByEnemyId: {},
  };

  return {
    controller: new BattleTurnController(state, createRefactorDeck([...REFACTOR_QA_CARD_DEFINITIONS], seed)),
    enemyIntentProvider: nextIntent,
  };
}
