import {
  resolveControlDelay,
  type ControlResilienceState,
} from '../status/ControlResilience';
import {
  createHardStaggerIntent,
  type IntentState,
} from './IntentState';

export interface IntentDelayResult {
  intent: IntentState;
  resilience: ControlResilienceState;
  requestedDelay: number;
  effectiveResilience: number;
  ignoredResilience: number;
  actualDelay: number;
  delayed: boolean;
}

export interface IntentInterruptResult {
  interrupted: boolean;
  original: IntentState;
  intent: IntentState;
}

function cloneIntent(intent: IntentState): IntentState {
  return {
    ...intent,
    targetIds: [...intent.targetIds],
    statusEffects: [...intent.statusEffects],
  };
}

export function resolveIntentDelay(
  intent: IntentState,
  resilience: ControlResilienceState,
  requestedDelay: number,
  ignoredResilience = 0,
): IntentDelayResult {
  if (!intent.canDelay) {
    return {
      intent: cloneIntent(intent),
      resilience: { ...resilience },
      requestedDelay,
      effectiveResilience: resilience.base + resilience.temporary,
      ignoredResilience: 0,
      actualDelay: 0,
      delayed: false,
    };
  }

  const resolved = resolveControlDelay(resilience, requestedDelay, ignoredResilience);
  return {
    intent: cloneIntent(intent),
    resilience: resolved.state,
    requestedDelay: resolved.requestedDelay,
    effectiveResilience: resolved.effectiveResilience,
    ignoredResilience: resolved.ignoredResilience,
    actualDelay: resolved.actualDelay,
    delayed: resolved.delayed,
  };
}

export function interruptIntent(intent: IntentState): IntentInterruptResult {
  const original = cloneIntent(intent);
  if (!intent.canInterrupt) {
    return {
      interrupted: false,
      original,
      intent: cloneIntent(intent),
    };
  }

  return {
    interrupted: true,
    original,
    intent: createHardStaggerIntent(intent),
  };
}
