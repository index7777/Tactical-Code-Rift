export type IntentKind = 'normal' | 'hard-stagger';

export interface IntentState {
  id: string;
  enemyId: string;
  kind: IntentKind;
  name: string;
  targetIds: string[];
  damage?: number;
  hitCount?: number;
  delay: number;
  canDelay: boolean;
  canInterrupt: boolean;
  canGuard: boolean;
  canRedirect: boolean;
  statusEffects: string[];
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

export function createIntentState(intent: IntentState): IntentState {
  if (!intent.id) throw new Error('intent id is required');
  if (!intent.enemyId) throw new Error('intent enemyId is required');
  if (!intent.name) throw new Error('intent name is required');
  assertNonNegativeInteger(intent.delay, 'intent delay');
  if (intent.damage !== undefined) assertNonNegativeInteger(intent.damage, 'intent damage');
  if (intent.hitCount !== undefined) assertPositiveInteger(intent.hitCount, 'intent hitCount');

  return {
    ...intent,
    targetIds: [...intent.targetIds],
    statusEffects: [...intent.statusEffects],
  };
}

export function createHardStaggerIntent(original: IntentState): IntentState {
  return {
    id: `${original.id}:hard-stagger`,
    enemyId: original.enemyId,
    kind: 'hard-stagger',
    name: '硬直',
    targetIds: [],
    delay: original.delay,
    canDelay: false,
    canInterrupt: false,
    canGuard: false,
    canRedirect: false,
    statusEffects: [],
  };
}
