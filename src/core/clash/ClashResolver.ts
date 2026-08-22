import type { ActionDefinition } from '../actions/ActionDefinition';

export interface ClashScoreModifiers {
  timing?: number;
  specialization?: number;
  state?: number;
}

export interface ClashContext {
  sameTargetRelationship: boolean;
  player: ClashScoreModifiers;
  enemy: ClashScoreModifiers;
}

export type ClashOutcome = 'player-win' | 'draw' | 'enemy-win';

export type ClashUnavailableReason =
  | 'different-target-relationship'
  | 'player-clash-disabled'
  | 'enemy-clash-disabled'
  | 'mode-incompatible'
  | 'enemy-not-guardable'
  | 'tag-incompatible';

export interface ClashScoreBreakdown {
  base: number;
  timing: number;
  specialization: number;
  state: number;
  total: number;
}

export interface ClashPreview {
  eligible: true;
  playerScore: ClashScoreBreakdown;
  enemyScore: ClashScoreBreakdown;
  outcome: ClashOutcome;
}

export interface ClashUnavailable {
  eligible: false;
  reason: ClashUnavailableReason;
}

export type ClashResolution = ClashPreview | ClashUnavailable;

function integerModifier(value: number | undefined, label: string): number {
  const resolved = value ?? 0;
  if (!Number.isInteger(resolved)) throw new Error(`${label} must be an integer`);
  return resolved;
}

function scoreBreakdown(base: number, modifiers: ClashScoreModifiers, label: string): ClashScoreBreakdown {
  const timing = integerModifier(modifiers.timing, `${label}.timing`);
  const specialization = integerModifier(modifiers.specialization, `${label}.specialization`);
  const state = integerModifier(modifiers.state, `${label}.state`);
  const total = Math.max(0, base + timing + specialization + state);

  return { base, timing, specialization, state, total };
}

function tagsCompatible(playerTags: readonly string[], enemyTags: readonly string[]): boolean {
  if (playerTags.length === 0 || enemyTags.length === 0) return true;
  const enemySet = new Set(enemyTags);
  return playerTags.some((tag) => enemySet.has(tag));
}

function eligibility(
  playerAction: ActionDefinition,
  enemyAction: ActionDefinition,
  context: ClashContext,
): ClashUnavailable | null {
  if (!context.sameTargetRelationship) {
    return { eligible: false, reason: 'different-target-relationship' };
  }

  if (playerAction.clash.mode === 'none') {
    return { eligible: false, reason: 'player-clash-disabled' };
  }

  if (enemyAction.clash.mode === 'none') {
    return { eligible: false, reason: 'enemy-clash-disabled' };
  }

  const directVsDirect = playerAction.clash.mode === 'direct' && enemyAction.clash.mode === 'direct';
  const guardInterceptVsDirect =
    playerAction.clash.mode === 'guard-intercept' && enemyAction.clash.mode === 'direct';

  if (!directVsDirect && !guardInterceptVsDirect) {
    return { eligible: false, reason: 'mode-incompatible' };
  }

  if (guardInterceptVsDirect && enemyAction.counterplay?.guardable !== true) {
    return { eligible: false, reason: 'enemy-not-guardable' };
  }

  if (!tagsCompatible(playerAction.clash.tags, enemyAction.clash.tags)) {
    return { eligible: false, reason: 'tag-incompatible' };
  }

  return null;
}

export function resolveClashPreview(
  playerAction: ActionDefinition,
  enemyAction: ActionDefinition,
  context: ClashContext,
): ClashResolution {
  const unavailable = eligibility(playerAction, enemyAction, context);
  if (unavailable) return unavailable;

  const playerBase = playerAction.clash.base;
  const enemyBase = enemyAction.clash.base;

  if (playerBase === undefined || enemyBase === undefined) {
    throw new Error('eligible Clash actions require authored base scores');
  }

  const playerScore = scoreBreakdown(playerBase, context.player, 'player');
  const enemyScore = scoreBreakdown(enemyBase, context.enemy, 'enemy');

  const outcome: ClashOutcome =
    playerScore.total > enemyScore.total
      ? 'player-win'
      : playerScore.total < enemyScore.total
        ? 'enemy-win'
        : 'draw';

  return {
    eligible: true,
    playerScore,
    enemyScore,
    outcome,
  };
}
