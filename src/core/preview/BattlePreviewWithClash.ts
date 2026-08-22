import type { RefactorCardEffect, RefactorCardInstance } from '../cards/RefactorCardTypes';
import { clashConsequenceFromResolution, type ClashConsequence } from '../clash/ClashConsequenceResolver';
import type {
  ClashResolution,
  ClashScoreBreakdown,
} from '../clash/ClashResolver';
import { createHardStaggerIntent, type IntentState } from '../intents/IntentState';
import {
  resolveBattlePreview,
  type BattlePreviewInput,
  type BattlePreviewResult,
} from './BattlePreviewResolver';

export interface BattlePreviewClashInput {
  resolution: ClashResolution;
  contestedEnemyId?: string;
  enemyIntent?: IntentState;
}

export type ClashEnemyIntentChange = 'none' | 'canceled' | 'halved';

export interface BattlePreviewClashResult {
  resolution: ClashResolution;
  consequence?: ClashConsequence;
  contestedEnemyId?: string;
  enemyIntentBefore?: IntentState;
  enemyIntentAfter?: IntentState;
  enemyIntentChange?: ClashEnemyIntentChange;
}

export interface BattlePreviewWithClashInput extends BattlePreviewInput {
  clash?: BattlePreviewClashInput;
}

export interface BattlePreviewWithClashResult extends BattlePreviewResult {
  clash?: BattlePreviewClashResult;
}

function cloneScore(score: ClashScoreBreakdown): ClashScoreBreakdown {
  return { ...score };
}

function cloneResolution(resolution: ClashResolution): ClashResolution {
  if (!resolution.eligible) return { ...resolution };
  return {
    eligible: true,
    playerScore: cloneScore(resolution.playerScore),
    enemyScore: cloneScore(resolution.enemyScore),
    outcome: resolution.outcome,
  };
}

function cloneIntent(intent: IntentState | undefined): IntentState | undefined {
  if (!intent) return undefined;
  return {
    ...intent,
    targetIds: [...intent.targetIds],
    statusEffects: [...intent.statusEffects],
  };
}

function playerEffectForConsequence(
  effect: RefactorCardEffect,
  consequence: ClashConsequence,
): RefactorCardEffect {
  if (consequence.playerEffectMode === 'full') return { ...effect };
  if (consequence.playerEffectMode === 'none') return {};

  return {
    damage: effect.damage === undefined ? undefined : Math.floor(effect.damage / 2),
    guardRatio: effect.guardRatio === undefined ? undefined : effect.guardRatio / 2,
    guardCap: effect.guardCap === undefined ? undefined : Math.floor(effect.guardCap / 2),
  };
}

function cardForConsequence(
  card: RefactorCardInstance,
  consequence: ClashConsequence,
): RefactorCardInstance {
  return {
    instanceId: card.instanceId,
    definition: {
      ...card.definition,
      effect: playerEffectForConsequence(card.definition.effect, consequence),
    },
  };
}

function enemyIntentForConsequence(
  intent: IntentState,
  consequence: ClashConsequence,
): { intent: IntentState; change: ClashEnemyIntentChange } {
  if (consequence.enemyIntentMode === 'cancel') {
    return { intent: createHardStaggerIntent(intent), change: 'canceled' };
  }

  if (consequence.enemyIntentMode === 'half') {
    return {
      intent: {
        ...intent,
        targetIds: [...intent.targetIds],
        damage: intent.damage === undefined ? undefined : Math.floor(intent.damage / 2),
        statusEffects: [],
      },
      change: 'halved',
    };
  }

  return { intent: cloneIntent(intent)!, change: 'none' };
}

export function resolveBattlePreviewWithClash(
  input: BattlePreviewWithClashInput,
): BattlePreviewWithClashResult {
  if (!input.clash) return resolveBattlePreview(input);

  const resolution = cloneResolution(input.clash.resolution);
  const consequence = clashConsequenceFromResolution(resolution);

  if (!consequence) {
    return {
      ...resolveBattlePreview(input),
      clash: {
        resolution,
        consequence: undefined,
      },
    };
  }

  if (!input.clash.contestedEnemyId || !input.clash.enemyIntent) {
    throw new Error('eligible Clash preview requires contestedEnemyId and enemyIntent');
  }
  if (input.clash.enemyIntent.enemyId !== input.clash.contestedEnemyId) {
    throw new Error('Clash enemyIntent must belong to contestedEnemyId');
  }

  const adjustedCard = cardForConsequence(input.card, consequence);
  const basePreview = resolveBattlePreview({
    ...input,
    card: adjustedCard,
  });
  const enemyIntentBefore = cloneIntent(input.clash.enemyIntent)!;
  const enemy = enemyIntentForConsequence(input.clash.enemyIntent, consequence);

  return {
    ...basePreview,
    clash: {
      resolution,
      consequence,
      contestedEnemyId: input.clash.contestedEnemyId,
      enemyIntentBefore,
      enemyIntentAfter: cloneIntent(enemy.intent),
      enemyIntentChange: enemy.change,
    },
  };
}
