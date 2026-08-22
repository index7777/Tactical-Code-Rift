import { clashConsequenceFromResolution, type ClashConsequence } from '../clash/ClashConsequenceResolver';
import type {
  ClashResolution,
  ClashScoreBreakdown,
} from '../clash/ClashResolver';
import {
  resolveBattlePreview,
  type BattlePreviewInput,
  type BattlePreviewResult,
} from './BattlePreviewResolver';

export interface BattlePreviewClashInput {
  resolution: ClashResolution;
}

export interface BattlePreviewClashResult {
  resolution: ClashResolution;
  consequence?: ClashConsequence;
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

export function resolveBattlePreviewWithClash(
  input: BattlePreviewWithClashInput,
): BattlePreviewWithClashResult {
  const basePreview = resolveBattlePreview(input);
  if (!input.clash) return basePreview;

  const resolution = cloneResolution(input.clash.resolution);
  const consequence = clashConsequenceFromResolution(resolution);

  return {
    ...basePreview,
    clash: {
      resolution,
      consequence,
    },
  };
}
