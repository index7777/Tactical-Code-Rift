import type { ActionDefinition } from '../../core/actions/ActionDefinition';
import type { RefactorCardInstance } from '../../core/cards/RefactorCardTypes';
import {
  resolveClashPreview,
  type ClashResolution,
} from '../../core/clash/ClashResolver';
import type { IntentState } from '../../core/intents/IntentState';
import type { BattleResolutionState } from '../../core/resolution/BattleResolutionResolver';
import { findTimelineEntry, sortTimelineActors } from '../../core/timeline/BattleTimeline';

export interface ClashApplicationCatalog {
  playerActionByCardDefinitionId: Readonly<Record<string, ActionDefinition | undefined>>;
  enemyActionByIntentId: Readonly<Record<string, ActionDefinition | undefined>>;
}

export interface PlannedPlayerClash {
  resolution: ClashResolution;
  contestedEnemyId: string;
  enemyIntent: IntentState;
}

export interface PlanPlayerClashInput {
  battle: BattleResolutionState;
  activeActorId: string;
  card: RefactorCardInstance;
  targetId: string;
  catalog?: ClashApplicationCatalog;
}

function clampTiming(value: number): number {
  return Math.max(-2, Math.min(2, value));
}

function cloneIntent(intent: IntentState): IntentState {
  return {
    ...intent,
    targetIds: [...intent.targetIds],
    statusEffects: [...intent.statusEffects],
  };
}

function candidateForDirect(
  battle: BattleResolutionState,
  targetId: string,
  catalog: ClashApplicationCatalog,
): { enemyId: string; intent: IntentState; action: ActionDefinition } | undefined {
  const targetEntry = findTimelineEntry(battle.timeline, targetId);
  if (!targetEntry || targetEntry.team !== 'enemy') return undefined;

  const intent = battle.intentByEnemyId[targetId];
  if (!intent) return undefined;
  const action = catalog.enemyActionByIntentId[intent.id];
  if (!action) return undefined;

  return { enemyId: targetId, intent, action };
}

function candidateForGuardIntercept(
  battle: BattleResolutionState,
  protectedAllyId: string,
  catalog: ClashApplicationCatalog,
): { enemyId: string; intent: IntentState; action: ActionDefinition } | undefined {
  const allyEntry = findTimelineEntry(battle.timeline, protectedAllyId);
  if (!allyEntry || allyEntry.team !== 'player') return undefined;

  const ordered = sortTimelineActors(battle.timeline);
  for (const entry of ordered) {
    if (entry.team !== 'enemy') continue;
    const intent = battle.intentByEnemyId[entry.actorId];
    if (!intent || !intent.targetIds.includes(protectedAllyId)) continue;
    const action = catalog.enemyActionByIntentId[intent.id];
    if (!action) continue;
    return { enemyId: entry.actorId, intent, action };
  }

  return undefined;
}

function playerSpecialization(
  activeActorId: string,
  card: RefactorCardInstance,
  playerAction: ActionDefinition,
): number {
  if (
    activeActorId === 'rin'
    && card.definition.category === 'quick'
    && playerAction.clash.mode === 'direct'
  ) {
    return 1;
  }

  if (activeActorId === 'chikage' && playerAction.clash.mode === 'guard-intercept') {
    return 1;
  }

  return 0;
}

export function planPlayerClash(input: PlanPlayerClashInput): PlannedPlayerClash | undefined {
  const catalog = input.catalog;
  if (!catalog) return undefined;

  const playerAction = catalog.playerActionByCardDefinitionId[input.card.definition.id];
  if (!playerAction || playerAction.clash.mode === 'none') return undefined;

  const activeEntry = findTimelineEntry(input.battle.timeline, input.activeActorId);
  if (!activeEntry || activeEntry.team !== 'player') {
    throw new Error(`active player actor not found for Clash: ${input.activeActorId}`);
  }

  const candidate = playerAction.clash.mode === 'direct'
    ? candidateForDirect(input.battle, input.targetId, catalog)
    : candidateForGuardIntercept(input.battle, input.targetId, catalog);
  if (!candidate) return undefined;

  const enemyEntry = findTimelineEntry(input.battle.timeline, candidate.enemyId);
  if (!enemyEntry) throw new Error(`contested enemy not found on Timeline: ${candidate.enemyId}`);

  const lead = enemyEntry.nextActionAt - activeEntry.nextActionAt - playerAction.actionDelay;
  const resolution = resolveClashPreview(playerAction, candidate.action, {
    sameTargetRelationship: true,
    player: {
      timing: clampTiming(lead),
      specialization: playerSpecialization(input.activeActorId, input.card, playerAction),
      state: 0,
    },
    enemy: {
      timing: 0,
      specialization: 0,
      state: 0,
    },
  });

  return {
    resolution,
    contestedEnemyId: candidate.enemyId,
    enemyIntent: cloneIntent(candidate.intent),
  };
}
