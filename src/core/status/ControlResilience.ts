export interface ControlResilienceState {
  base: number;
  temporary: number;
}

export interface ResolveControlDelayResult {
  state: ControlResilienceState;
  requestedDelay: number;
  effectiveResilience: number;
  ignoredResilience: number;
  actualDelay: number;
  delayed: boolean;
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

export function createControlResilience(
  base = 0,
  temporary = 0,
): ControlResilienceState {
  assertNonNegativeInteger(base, 'base resilience');
  assertNonNegativeInteger(temporary, 'temporary resilience');
  return { base, temporary };
}

export function effectiveResilience(state: ControlResilienceState): number {
  return state.base + state.temporary;
}

export function resolveControlDelay(
  state: ControlResilienceState,
  requestedDelay: number,
  ignoredResilience = 0,
): ResolveControlDelayResult {
  assertNonNegativeInteger(requestedDelay, 'requested delay');
  assertNonNegativeInteger(ignoredResilience, 'ignored resilience');

  const effective = effectiveResilience(state);
  const appliedResilience = Math.max(0, effective - ignoredResilience);
  const actualDelay = Math.max(0, requestedDelay - appliedResilience);
  const delayed = actualDelay > 0;

  return {
    state: delayed
      ? { base: state.base, temporary: state.temporary + 1 }
      : { ...state },
    requestedDelay,
    effectiveResilience: effective,
    ignoredResilience: Math.min(ignoredResilience, effective),
    actualDelay,
    delayed,
  };
}

export function resetTemporaryResilience(
  state: ControlResilienceState,
): ControlResilienceState {
  return { base: state.base, temporary: 0 };
}
