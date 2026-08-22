import { enemyArchetypePools } from '../../core/battle/EnemySkills';
import type { EnemyArchetype } from '../../core/battle/BattleTypes';
import { applyDemoCardUpgrades, type DemoCardUpgradeId } from '../../core/cards/DemoCardUpgradeProgression';
import { createRefactorDeck } from '../../core/cards/RefactorDeck';
import {
  RAIN_BOSS_BASE_RESILIENCE,
  RAIN_BOSS_HP,
  selectRainBossAction,
} from '../../core/enemy/BossEnemyActionCatalog';
import {
  RAIN_WARRIOR_BASE_RESILIENCE,
  RAIN_WARRIOR_HP,
  rainWarriorActionAt,
} from '../../core/enemy/EliteEnemyActionCatalog';
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
import { consumeDemoCardUpgradeEncounterHandoff } from './DemoCardUpgradeEncounterHandoff';
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
  | 'wayfarer-umbrella'
  | 'rain-warrior'
  | 'rain-boss'>, number>> = {
  swift: 34,
  crusher: 54,
  hexer: 38,
};

function targetFor(enemyIndex: number): (typeof PLAYER_IDS)[number] {
  return PLAYER_IDS[enemyIndex % PLAYER_IDS.length];
}

function livingPlayerIds(battle: BattleResolutionState): string[] {
  return battle.timeline.entries
    .filter((entry) => entry.team === 'player')
    .filter((entry) => (battle.vitalsByActorId[entry.actorId]?.hp ?? 0) > 0)
    .map((entry) => entry.actorId);
}

function enemyHp(archetype: EnemyArchetype): number {
  if (isNormalEnemyArchetype(archetype)) return NORMAL_ENEMY_HP[archetype];
  if (archetype === 'rain-warrior') return RAIN_WARRIOR_HP;
  if (archetype === 'rain-boss') return RAIN_BOSS_HP;
  return LEGACY_ENEMY_HP[archetype];
}

function enemyBaseResilience(archetype: EnemyArchetype): number {
  if (isNormalEnemyArchetype(archetype)) return NORMAL_ENEMY_BASE_RESILIENCE[archetype];
  if (archetype === 'rain-warrior') return RAIN_WARRIOR_BASE_RESILIENCE;
  if (archetype === 'rain-boss') return RAIN_BOSS_BASE_RESILIENCE;
  return 0;
}

function rainBossIntent(
  sequence: number,
  hp: number,
  maxHp: number,
  recentActionIds: readonly string[],
  livingTargets: readonly string[],
): { intent: IntentState; actionId: string } {
  if (!livingTargets.length) throw new Error('rain-boss requires at least one living player target');
  const action = selectRainBossAction({ hp, maxHp, sequence, recentActionIds });
  const targets = action.targetMode === 'all-enemies'
    ? livingTargets
    : [livingTargets[sequence % livingTargets.length]!];
  return {
    intent: intentStateFromEnemyAction(action, 'rain-boss', targets, sequence),
    actionId: action.id,
  };
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

  if (archetype === 'rain-warrior') {
    return intentStateFromEnemyAction(
      rainWarriorActionAt(sequence),
      enemyId,
      targetFor(sequence),
      sequence,
    );
  }

  if (archetype === 'rain-boss') {
    return rainBossIntent(sequence, RAIN_BOSS_HP, RAIN_BOSS_HP, [], PLAYER_IDS).intent;
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
  enemyIntentProvider: (enemyId: string, battle: BattleResolutionState) => IntentState;
}

export function createEncounterBattleBootstrap(
  journeyNodeId: string,
  seed = 20260822,
  ownedUpgradeIds?: readonly DemoCardUpgradeId[],
): EncounterBattleBootstrap {
  const encounter = storyEncounter(journeyNodeId);
  if (!encounter) throw new Error(`unknown story encounter: ${journeyNodeId}`);

  const resolvedUpgradeIds = ownedUpgradeIds ?? consumeDemoCardUpgradeEncounterHandoff();
  const vitalsByActorId: BattleResolutionState['vitalsByActorId'] = {};
  for (const playerId of PLAYER_IDS) {
    vitalsByActorId[playerId] = { actorId: playerId, hp: PLAYER_HP[playerId], maxHp: PLAYER_HP[playerId] };
  }
  for (const enemyId of encounter.enemies) {
    const hp = enemyHp(enemyId);
    vitalsByActorId[enemyId] = { actorId: enemyId, hp, maxHp: hp };
  }

  const timelineEntries = [
    ...PLAYER_IDS.map((actorId, index) => ({ actorId, team: 'player' as const, nextActionAt: index * 3, tieBreaker: index })),
    ...encounter.enemies.map((actorId, index) => ({ actorId, team: 'enemy' as const, nextActionAt: 4 + index * 3, tieBreaker: 10 + index })),
  ];
  const initialTimeline = createBattleTimeline(timelineEntries);
  const intentSequence = new Map<string, number>();
  const bossRecentActionIds: string[] = [];

  const intentByEnemyId = Object.fromEntries(
    encounter.enemies.map((enemyId, index) => {
      intentSequence.set(enemyId, index);
      if (enemyId === 'rain-boss') {
        const bossVitals = vitalsByActorId[enemyId]!;
        const selected = rainBossIntent(
          index,
          bossVitals.hp,
          bossVitals.maxHp,
          bossRecentActionIds,
          PLAYER_IDS,
        );
        bossRecentActionIds.push(selected.actionId);
        return [enemyId, selected.intent];
      }
      return [enemyId, createEncounterEnemyIntent(enemyId, index)];
    }),
  );
  const resilienceByEnemyId = Object.fromEntries(
    encounter.enemies.map((enemyId) => [
      enemyId,
      createControlResilience(enemyBaseResilience(enemyId), 0),
    ]),
  );
  const state: BattleResolutionState = {
    timeline: initialTimeline,
    vitalsByActorId,
    intentByEnemyId,
    resilienceByEnemyId,
    breakWindows: [],
    nextBreakWindowSequence: 1,
    guardByTargetId: {},
    oboroDelayUsedByEnemyId: {},
  };

  const nextIntent = (enemyId: string, battle: BattleResolutionState): IntentState => {
    const sequence = (intentSequence.get(enemyId) ?? 0) + 1;
    intentSequence.set(enemyId, sequence);
    if (enemyId === 'rain-boss') {
      const bossVitals = battle.vitalsByActorId[enemyId];
      if (!bossVitals || bossVitals.hp <= 0) throw new Error('rain-boss is not alive');
      const selected = rainBossIntent(
        sequence,
        bossVitals.hp,
        bossVitals.maxHp,
        bossRecentActionIds,
        livingPlayerIds(battle),
      );
      bossRecentActionIds.push(selected.actionId);
      if (bossRecentActionIds.length > 3) bossRecentActionIds.splice(0, bossRecentActionIds.length - 3);
      return selected.intent;
    }
    return createEncounterEnemyIntent(enemyId, sequence);
  };

  const deckDefinitions = applyDemoCardUpgrades(REFACTOR_QA_CARD_DEFINITIONS, resolvedUpgradeIds);
  return {
    controller: new BattleTurnController(state, createRefactorDeck(deckDefinitions, seed)),
    enemyIntentProvider: nextIntent,
  };
}
