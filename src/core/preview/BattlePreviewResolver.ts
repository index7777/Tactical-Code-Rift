import type {
  RefactorCardInstance,
  RefactorCardCategory,
} from '../cards/RefactorCardTypes';
import { interruptIntent, resolveIntentDelay } from '../intents/IntentResolver';
import type { IntentState } from '../intents/IntentState';
import type { GuardReactionState } from '../reactions/GuardState';
import {
  canConsumeBreakWindow,
  type BreakWindowConsumer,
  type BreakWindowKind,
  type BreakWindowState,
} from '../status/BreakWindow';
import type { ControlResilienceState } from '../status/ControlResilience';
import {
  findTimelineEntry,
  previewTimelineShift,
  removeTimelineActor,
  shiftTimelineActor,
  sortTimelineActors,
} from '../timeline/BattleTimeline';
import type { BattleTimelineState, TimelineEntry } from '../timeline/TimelineTypes';

export type PreviewIntentChange = 'none' | 'moved' | 'interrupted' | 'deleted';

export interface PreviewActorVitals {
  actorId: string;
  hp: number;
  maxHp: number;
}

export interface BattlePreviewInput {
  activeActorId: string;
  card: RefactorCardInstance;
  target?: PreviewActorVitals;
  timeline: BattleTimelineState;
  targetIntent?: IntentState;
  targetResilience?: ControlResilienceState;
  breakWindows: readonly BreakWindowState[];
  oboroDelayAlreadyUsed?: boolean;
}

export interface CreatedBreakWindowPreview {
  targetId: string;
  kind: BreakWindowKind;
}

export interface BattlePreviewResult {
  activeActorId: string;
  targetId?: string;
  baseDamage: number;
  breakBonusDamage: number;
  specializationBonusDamage: number;
  finalDamage: number;
  hpBefore?: number;
  hpAfter?: number;
  lethal: boolean;
  requestedDelay: number;
  actualDelay: number;
  ignoredResilience: number;
  targetResilienceAfter?: ControlResilienceState;
  oboroBonusApplied: boolean;
  crossedPlayerActorIds: string[];
  crossedPlayerWindows: number;
  actorNextActionAt: number;
  targetTimelineFrom?: number;
  targetTimelineTo?: number;
  intentBefore?: IntentState;
  intentAfter?: IntentState;
  intentChange: PreviewIntentChange;
  consumedBreakWindowIds: string[];
  createdBreakWindow?: CreatedBreakWindowPreview;
  createdGuardReaction?: GuardReactionState;
  predictedTimeline: BattleTimelineState;
}

function cloneIntent(intent: IntentState | undefined): IntentState | undefined {
  if (!intent) return undefined;
  return {
    ...intent,
    targetIds: [...intent.targetIds],
    statusEffects: [...intent.statusEffects],
  };
}

function cloneTimeline(timeline: BattleTimelineState): BattleTimelineState {
  return {
    currentTime: timeline.currentTime,
    entries: timeline.entries.map((entry) => ({ ...entry })),
  };
}

function cloneResilience(
  resilience: ControlResilienceState | undefined,
): ControlResilienceState | undefined {
  return resilience ? { ...resilience } : undefined;
}

function validateVitals(vitals: PreviewActorVitals): void {
  if (!Number.isFinite(vitals.hp) || !Number.isFinite(vitals.maxHp)) {
    throw new Error('preview HP values must be finite');
  }
  if (vitals.maxHp <= 0) throw new Error('preview maxHp must be positive');
  if (vitals.hp < 0 || vitals.hp > vitals.maxHp) {
    throw new Error('preview hp must be within 0..maxHp');
  }
}

function validateTarget(input: BattlePreviewInput): void {
  const active = findTimelineEntry(input.timeline, input.activeActorId);
  if (!active) throw new Error(`active actor not found: ${input.activeActorId}`);

  const rule = input.card.definition.targetRule;
  if (rule === 'none') {
    if (input.target) throw new Error('targetless card cannot preview a target');
    return;
  }

  if (!input.target) throw new Error(`card requires a target: ${input.card.instanceId}`);
  validateVitals(input.target);
  const targetEntry = findTimelineEntry(input.timeline, input.target.actorId);
  if (!targetEntry) throw new Error(`target actor not found: ${input.target.actorId}`);

  if (rule === 'enemy' && targetEntry.team !== 'enemy') throw new Error('card requires an enemy target');
  if (rule === 'self' && input.target.actorId !== input.activeActorId) throw new Error('card requires self target');
  if ((rule === 'ally' || rule === 'any-ally') && targetEntry.team !== 'player') {
    throw new Error('card requires an ally target');
  }

  if (
    input.card.definition.category === 'guard'
    && input.activeActorId !== 'chikage'
    && input.target.actorId !== input.activeActorId
  ) {
    throw new Error('only chikage can guard another ally');
  }
}

function breakWindowConsumer(category: RefactorCardCategory): BreakWindowConsumer | undefined {
  if (category === 'heavy') return 'heavy';
  if (category === 'disruption') return 'disruption';
  return undefined;
}

function matchingBreakWindow(
  windows: readonly BreakWindowState[],
  targetId: string | undefined,
  card: RefactorCardInstance,
): BreakWindowState | undefined {
  if (!targetId) return undefined;
  const consumer = breakWindowConsumer(card.definition.category);
  if (!consumer) return undefined;
  return windows.find((window) =>
    window.targetId === targetId && canConsumeBreakWindow(window, consumer),
  );
}

function sortsBeforeAt(
  actor: TimelineEntry,
  nextActionAt: number,
  enemy: TimelineEntry,
): boolean {
  if (nextActionAt !== enemy.nextActionAt) return nextActionAt < enemy.nextActionAt;
  if (actor.tieBreaker !== enemy.tieBreaker) return actor.tieBreaker < enemy.tieBreaker;
  return actor.actorId < enemy.actorId;
}

function rinQuickBonus(
  active: TimelineEntry,
  actorNextActionAt: number,
  input: BattlePreviewInput,
): number {
  if (input.activeActorId !== 'rin' || input.card.definition.category !== 'quick') return 0;
  if ((input.card.definition.effect.damage ?? 0) <= 0) return 0;
  const overtakes = input.timeline.entries.some((entry) =>
    entry.team === 'enemy'
    && entry.nextActionAt > active.nextActionAt
    && sortsBeforeAt(active, actorNextActionAt, entry),
  );
  return overtakes ? 3 : 0;
}

export function resolveBattlePreview(input: BattlePreviewInput): BattlePreviewResult {
  validateTarget(input);

  const activeEntry = findTimelineEntry(input.timeline, input.activeActorId)!;
  const targetId = input.target?.actorId;
  const targetEntry = targetId ? findTimelineEntry(input.timeline, targetId) : undefined;
  const effect = input.card.definition.effect;
  const baseDamage = effect.damage ?? 0;
  const consumedWindow = matchingBreakWindow(input.breakWindows, targetId, input.card);
  const breakBonusDamage = consumedWindow?.kind === 'armor-break' && input.card.definition.category === 'heavy'
    ? Math.floor(baseDamage * 0.5)
    : 0;

  let predictedTimeline = cloneTimeline(input.timeline);
  const actorNextActionAt = activeEntry.nextActionAt + input.card.definition.delay;
  const rinBonus = rinQuickBonus(activeEntry, actorNextActionAt, input);
  const moBonus = input.activeActorId === 'mo'
    && input.card.definition.category === 'heavy'
    && consumedWindow?.kind === 'armor-break'
    ? 4
    : 0;
  const specializationBonusDamage = rinBonus + moBonus;
  const finalDamage = baseDamage + breakBonusDamage + specializationBonusDamage;
  const hpBefore = input.target?.hp;
  const hpAfter = hpBefore === undefined ? undefined : Math.max(0, hpBefore - finalDamage);
  const lethal = hpAfter !== undefined && hpAfter <= 0 && hpBefore! > 0;

  predictedTimeline = {
    currentTime: predictedTimeline.currentTime,
    entries: predictedTimeline.entries.map((entry) =>
      entry.actorId === input.activeActorId
        ? { ...entry, nextActionAt: actorNextActionAt }
        : { ...entry },
    ),
  };

  const baseRequestedDelay = effect.delayTarget ?? 0;
  const oboroEligible = input.activeActorId === 'oboro'
    && input.card.definition.category === 'disruption'
    && baseRequestedDelay > 0
    && !input.oboroDelayAlreadyUsed;
  const requestedDelay = baseRequestedDelay + (oboroEligible ? 1 : 0);
  let actualDelay = 0;
  let ignoredResilience = 0;
  let targetResilienceAfter = cloneResilience(input.targetResilience);
  let crossedPlayerActorIds: string[] = [];
  let targetTimelineFrom = targetEntry?.nextActionAt;
  let targetTimelineTo = targetEntry?.nextActionAt;
  let intentBefore = cloneIntent(input.targetIntent);
  let intentAfter = cloneIntent(input.targetIntent);
  let intentChange: PreviewIntentChange = 'none';

  if (targetId && requestedDelay > 0 && input.targetIntent && input.targetResilience) {
    const ignore = consumedWindow?.kind === 'imbalance' && input.card.definition.category === 'disruption' ? 1 : 0;
    const delayed = resolveIntentDelay(input.targetIntent, input.targetResilience, requestedDelay, ignore);
    actualDelay = delayed.actualDelay;
    ignoredResilience = delayed.ignoredResilience;
    targetResilienceAfter = { ...delayed.resilience };
    intentAfter = cloneIntent(delayed.intent);

    if (actualDelay > 0 && targetEntry) {
      const shift = previewTimelineShift(predictedTimeline, targetId, actualDelay);
      crossedPlayerActorIds = [...shift.crossedPlayerActorIds];
      targetTimelineFrom = shift.fromTime;
      targetTimelineTo = shift.toTime;
      predictedTimeline = shiftTimelineActor(predictedTimeline, targetId, actualDelay);
      intentChange = 'moved';
    }
  }

  if (targetId && effect.interrupt && input.targetIntent) {
    const interrupted = interruptIntent(input.targetIntent);
    intentBefore = cloneIntent(interrupted.original);
    intentAfter = cloneIntent(interrupted.intent);
    if (interrupted.interrupted) intentChange = 'interrupted';
  }

  if (lethal && targetId) {
    predictedTimeline = removeTimelineActor(predictedTimeline, targetId);
    intentAfter = undefined;
    intentChange = 'deleted';
  }

  predictedTimeline = {
    currentTime: predictedTimeline.currentTime,
    entries: sortTimelineActors(predictedTimeline).map((entry) => ({ ...entry })),
  };

  const createdGuardReaction = input.card.definition.category === 'guard' && targetId
    ? {
      protectorId: input.activeActorId,
      targetId,
      guardRatio: effect.guardRatio ?? 0.5,
      guardCap: effect.guardCap ?? 8,
    }
    : undefined;

  return {
    activeActorId: input.activeActorId,
    targetId,
    baseDamage,
    breakBonusDamage,
    specializationBonusDamage,
    finalDamage,
    hpBefore,
    hpAfter,
    lethal,
    requestedDelay,
    actualDelay,
    ignoredResilience,
    targetResilienceAfter,
    oboroBonusApplied: oboroEligible && actualDelay > 0,
    crossedPlayerActorIds,
    crossedPlayerWindows: crossedPlayerActorIds.length,
    actorNextActionAt,
    targetTimelineFrom,
    targetTimelineTo,
    intentBefore,
    intentAfter,
    intentChange,
    consumedBreakWindowIds: consumedWindow ? [consumedWindow.id] : [],
    createdBreakWindow: effect.createBreakWindow && targetId
      ? { targetId, kind: effect.createBreakWindow }
      : undefined,
    createdGuardReaction,
    predictedTimeline,
  };
}
