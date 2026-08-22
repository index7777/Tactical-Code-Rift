import { createActionDefinition, type ActionDefinition, type ClashMode } from '../../core/actions/ActionDefinition';
import {
  actionDefinitionFromIntent,
  actionDefinitionFromRefactorCard,
} from '../../core/actions/ActionDefinitionAdapters';
import type { RefactorCardDefinition } from '../../core/cards/RefactorCardTypes';
import type { IntentState } from '../../core/intents/IntentState';
import type { ClashApplicationCatalog } from './ClashApplicationPlanner';

interface ClashAuthoring {
  mode: ClashMode;
  base: number;
  tags: readonly string[];
}

const PLAYER_CLASH_AUTHORING: Readonly<Record<string, ClashAuthoring | undefined>> = {
  'qa-quick-cut': { mode: 'direct', base: 5, tags: ['melee'] },
  'qa-quick-feint': { mode: 'direct', base: 4, tags: ['melee'] },
  'qa-heavy-cleave': { mode: 'direct', base: 7, tags: ['melee'] },
  'qa-heavy-strike': { mode: 'direct', base: 6, tags: ['melee'] },
  'qa-guard-cover': { mode: 'guard-intercept', base: 5, tags: ['melee'] },
};

const ENEMY_CLASH_AUTHORING: Readonly<Record<string, ClashAuthoring | undefined>> = {
  'ghost-fire-rush': { mode: 'direct', base: 6, tags: ['melee'] },
};

function withClash(definition: ActionDefinition, clash: ClashAuthoring): ActionDefinition {
  return createActionDefinition({
    ...definition,
    hits: definition.hits.map((hit) => ({ ...hit })),
    guard: definition.guard ? { ...definition.guard } : undefined,
    statuses: definition.statuses.map((status) => ({ ...status })),
    clash: { mode: clash.mode, base: clash.base, tags: [...clash.tags] },
    telegraph: { ...definition.telegraph },
    ai: definition.ai ? { ...definition.ai } : undefined,
    counterplay: definition.counterplay ? { ...definition.counterplay } : undefined,
  });
}

export function createRefactorQaClashCatalog(
  cards: readonly RefactorCardDefinition[],
  enemyIntents: readonly IntentState[],
): ClashApplicationCatalog {
  const playerActionByCardDefinitionId: Record<string, ActionDefinition | undefined> = {};
  for (const card of cards) {
    const authoring = PLAYER_CLASH_AUTHORING[card.id];
    if (!authoring) continue;
    playerActionByCardDefinitionId[card.id] = withClash(
      actionDefinitionFromRefactorCard(card),
      authoring,
    );
  }

  const enemyActionByIntentId: Record<string, ActionDefinition | undefined> = {};
  for (const intent of enemyIntents) {
    const authoring = ENEMY_CLASH_AUTHORING[intent.id];
    if (!authoring) continue;
    enemyActionByIntentId[intent.id] = withClash(
      actionDefinitionFromIntent(intent),
      authoring,
    );
  }

  return {
    playerActionByCardDefinitionId,
    enemyActionByIntentId,
  };
}
