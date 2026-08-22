export type ActionOwner = 'player-card' | 'enemy';

export type ActionTargetMode =
  | 'self'
  | 'single-enemy'
  | 'single-ally'
  | 'any-ally'
  | 'all-enemies'
  | 'all-allies'
  | 'random-enemy'
  | 'random-ally'
  | 'none';

export interface ActionHitDefinition {
  damage: number;
  repeats?: number;
}

export interface ActionGuardDefinition {
  ratio: number;
  cap?: number;
}

export type ActionBreakWindow = 'armor-break' | 'imbalance';

export interface ActionStatusApplication {
  id: string;
  stacks?: number;
  durationActions?: number;
  magnitude?: number;
}

export type ClashMode = 'none' | 'direct' | 'guard-intercept';

export interface ActionClashDefinition {
  mode: ClashMode;
  base?: number;
  tags: readonly string[];
}

export type ActionTelegraphLevel = 'normal' | 'danger' | 'signature';

export interface ActionTelegraphDefinition {
  level: ActionTelegraphLevel;
  cue?: string;
}

export interface EnemyActionAiDefinition {
  weight: number;
  cooldownActions?: number;
  minPhase?: number;
  maxPhase?: number;
}

export interface ActionCounterplayDefinition {
  delayable: boolean;
  interruptible: boolean;
  guardable: boolean;
  redirectable: boolean;
}

export type ActionPresentationProfile =
  | 'quick-melee'
  | 'heavy-melee'
  | 'guard'
  | 'disruption'
  | 'break'
  | 'enemy-light'
  | 'enemy-heavy'
  | 'boss-signature'
  | 'none';

export interface ActionDefinition {
  id: string;
  owner: ActionOwner;
  name: string;
  targetMode: ActionTargetMode;
  hits: readonly ActionHitDefinition[];
  actionDelay: number;
  targetDelay?: number;
  guard?: ActionGuardDefinition;
  breakWindow?: ActionBreakWindow;
  interrupt?: boolean;
  statuses: readonly ActionStatusApplication[];
  clash: ActionClashDefinition;
  telegraph: ActionTelegraphDefinition;
  ai?: EnemyActionAiDefinition;
  counterplay?: ActionCounterplayDefinition;
  presentationProfile: ActionPresentationProfile;
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number`);
  }
}

function validateHit(hit: ActionHitDefinition, index: number): void {
  assertNonNegativeInteger(hit.damage, `hits[${index}].damage`);
  if (hit.repeats !== undefined) assertPositiveInteger(hit.repeats, `hits[${index}].repeats`);
}

function validateGuard(guard: ActionGuardDefinition): void {
  if (!Number.isFinite(guard.ratio) || guard.ratio < 0 || guard.ratio > 1) {
    throw new Error('guard.ratio must be between 0 and 1');
  }
  if (guard.cap !== undefined) assertNonNegativeInteger(guard.cap, 'guard.cap');
}

function validateStatus(status: ActionStatusApplication, index: number): void {
  if (!status.id) throw new Error(`statuses[${index}].id is required`);
  if (status.stacks !== undefined) assertPositiveInteger(status.stacks, `statuses[${index}].stacks`);
  if (status.durationActions !== undefined) {
    assertPositiveInteger(status.durationActions, `statuses[${index}].durationActions`);
  }
  if (status.magnitude !== undefined) {
    assertFiniteNonNegative(status.magnitude, `statuses[${index}].magnitude`);
  }
}

function validateClash(clash: ActionClashDefinition): void {
  if (clash.mode === 'none') {
    if (clash.base !== undefined) throw new Error('clash.base is forbidden when clash.mode is none');
    return;
  }
  if (clash.base === undefined) throw new Error('clash.base is required for active clash modes');
  assertNonNegativeInteger(clash.base, 'clash.base');
}

function validateAi(ai: EnemyActionAiDefinition): void {
  assertFiniteNonNegative(ai.weight, 'ai.weight');
  if (ai.cooldownActions !== undefined) assertNonNegativeInteger(ai.cooldownActions, 'ai.cooldownActions');
  if (ai.minPhase !== undefined) assertPositiveInteger(ai.minPhase, 'ai.minPhase');
  if (ai.maxPhase !== undefined) assertPositiveInteger(ai.maxPhase, 'ai.maxPhase');
  if (ai.minPhase !== undefined && ai.maxPhase !== undefined && ai.minPhase > ai.maxPhase) {
    throw new Error('ai.minPhase must be less than or equal to ai.maxPhase');
  }
}

function hasSemanticEffect(definition: ActionDefinition): boolean {
  return (
    definition.hits.length > 0 ||
    definition.targetDelay !== undefined ||
    definition.guard !== undefined ||
    definition.breakWindow !== undefined ||
    definition.interrupt === true ||
    definition.statuses.length > 0
  );
}

export function createActionDefinition(definition: ActionDefinition): ActionDefinition {
  if (!definition.id) throw new Error('action id is required');
  if (!definition.name) throw new Error('action name is required');

  assertNonNegativeInteger(definition.actionDelay, 'actionDelay');
  if (definition.targetDelay !== undefined) {
    assertNonNegativeInteger(definition.targetDelay, 'targetDelay');
  }

  definition.hits.forEach(validateHit);
  if (definition.guard !== undefined) validateGuard(definition.guard);
  definition.statuses.forEach(validateStatus);
  validateClash(definition.clash);
  if (definition.ai !== undefined) validateAi(definition.ai);

  if (!hasSemanticEffect(definition) && !(definition.presentationProfile === 'none' && definition.targetMode === 'none')) {
    throw new Error('action must define at least one semantic effect');
  }

  return {
    ...definition,
    hits: definition.hits.map((hit) => ({ ...hit })),
    guard: definition.guard ? { ...definition.guard } : undefined,
    statuses: definition.statuses.map((status) => ({ ...status })),
    clash: { ...definition.clash, tags: [...definition.clash.tags] },
    telegraph: { ...definition.telegraph },
    ai: definition.ai ? { ...definition.ai } : undefined,
    counterplay: definition.counterplay ? { ...definition.counterplay } : undefined,
  };
}
