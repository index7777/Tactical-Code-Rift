import type { RefactorCardInstance } from '../cards/RefactorCardTypes';
import type { IntentState } from '../intents/IntentState';
import type { GuardReactionState } from '../reactions/GuardState';
import {
  resolveBattlePreview,
  type BattlePreviewResult,
  type PreviewActorVitals,
} from '../preview/BattlePreviewResolver';
import {
  removeConsumedBreakWindows,
  removeWindowsForTarget,
  type BreakWindowState,
} from '../status/BreakWindow';
import type { ControlResilienceState } from '../status/ControlResilience';
import { nextTimelineActor, sortTimelineActors } from '../timeline/BattleTimeline';
import type { BattleTimelineState } from '../timeline/TimelineTypes';

export interface BattleResolutionState {
  timeline: BattleTimelineState;
  vitalsByActorId: Record<string, PreviewActorVitals | undefined>;
  intentByEnemyId: Record<string, IntentState | undefined>;
  resilienceByEnemyId: Record<string, ControlResilienceState | undefined>;
  breakWindows: BreakWindowState[];
  nextBreakWindowSequence: number;
  guardByTargetId?: Record<string, GuardReactionState | undefined>;
  oboroDelayUsedByEnemyId?: Record<string, boolean | undefined>;
}

export interface BattleResolutionInput {
  state: BattleResolutionState;
  activeActorId: string;
  card: RefactorCardInstance;
  targetId?: string;
}

export interface BattleResolutionResult {
  state: BattleResolutionState;
  preview: BattlePreviewResult;
  activeActorId: string;
  targetId?: string;
  damageDealt: number;
  lethal: boolean;
  createdBreakWindowId?: string;
}

function cloneIntent(intent: IntentState | undefined): IntentState | undefined {
  if (!intent) return undefined;
  return {
    ...intent,
    targetIds: [...intent.targetIds],
    statusEffects: [...intent.statusEffects],
  };
}

function cloneState(state: BattleResolutionState): BattleResolutionState {
  return {
    timeline: {
      currentTime: state.timeline.currentTime,
      entries: state.timeline.entries.map((entry) => ({ ...entry })),
    },
    vitalsByActorId: Object.fromEntries(
      Object.entries(state.vitalsByActorId).map(([actorId, vitals]) => [
        actorId,
        vitals ? { ...vitals } : undefined,
      ]),
    ),
    intentByEnemyId: Object.fromEntries(
      Object.entries(state.intentByEnemyId).map(([enemyId, intent]) => [
        enemyId,
        cloneIntent(intent),
      ]),
    ),
    resilienceByEnemyId: Object.fromEntries(
      Object.entries(state.resilienceByEnemyId).map(([enemyId, resilience]) => [
        enemyId,
        resilience ? { ...resilience } : undefined,
      ]),
    ),
    breakWindows: state.breakWindows.map((window) => ({ ...window })),
    nextBreakWindowSequence: state.nextBreakWindowSequence,
    guardByTargetId: Object.fromEntries(
      Object.entries(state.guardByTargetId ?? {}).map(([targetId, guard]) => [
        targetId,
        guard ? { ...guard } : undefined,
      ]),
    ),
    oboroDelayUsedByEnemyId: { ...(state.oboroDelayUsedByEnemyId ?? {}) },
  };
}

function createBreakWindowId(
  sequence: number,
  kind: BreakWindowState['kind'],
  targetId: string,
): string {
  return `bw:${sequence}:${kind}:${targetId}`;
}

export function resolveBattleAction(
  input: BattleResolutionInput,
): BattleResolutionResult {
  const source = cloneState(input.state);
  const active = nextTimelineActor(source.timeline);
  if (!active || active.actorId !== input.activeActorId) {
    throw new Error(`actor is not the next timeline actor: ${input.activeActorId}`);
  }

  const target = input.targetId ? source.vitalsByActorId[input.targetId] : undefined;
  const targetIntent = input.targetId ? source.intentByEnemyId[input.targetId] : undefined;
  const targetResilience = input.targetId ? source.resilienceByEnemyId[input.targetId] : undefined;

  const preview = resolveBattlePreview({
    activeActorId: input.activeActorId,
    card: input.card,
    target,
    timeline: source.timeline,
    targetIntent,
    targetResilience,
    breakWindows: source.breakWindows,
    oboroDelayAlreadyUsed: input.targetId
      ? Boolean(source.oboroDelayUsedByEnemyId?.[input.targetId])
      : false,
  });

  const next = cloneState(source);
  const actedAt = active.nextActionAt;
  next.timeline = {
    currentTime: actedAt,
    entries: preview.predictedTimeline.entries.map((entry) => ({ ...entry })),
  };

  if (input.targetId && preview.hpAfter !== undefined) {
    const existing = next.vitalsByActorId[input.targetId];
    if (!existing) throw new Error(`target vitals not found: ${input.targetId}`);
    next.vitalsByActorId[input.targetId] = {
      ...existing,
      hp: preview.hpAfter,
    };
  }

  if (input.targetId) {
    if (preview.intentChange === 'deleted') {
      next.intentByEnemyId[input.targetId] = undefined;
    } else if (preview.intentAfter) {
      next.intentByEnemyId[input.targetId] = cloneIntent(preview.intentAfter);
    }

    if (preview.targetResilienceAfter) {
      next.resilienceByEnemyId[input.targetId] = { ...preview.targetResilienceAfter };
    }

    if (preview.oboroBonusApplied) {
      next.oboroDelayUsedByEnemyId = {
        ...(next.oboroDelayUsedByEnemyId ?? {}),
        [input.targetId]: true,
      };
    }
  }

  if (preview.createdGuardReaction) {
    next.guardByTargetId = {
      ...(next.guardByTargetId ?? {}),
      [preview.createdGuardReaction.targetId]: { ...preview.createdGuardReaction },
    };
  }

  if (preview.consumedBreakWindowIds.length > 0) {
    const consumedIds = new Set(preview.consumedBreakWindowIds);
    next.breakWindows = removeConsumedBreakWindows(
      next.breakWindows.map((window) =>
        consumedIds.has(window.id) ? { ...window, consumed: true } : { ...window },
      ),
    );
  }

  let createdBreakWindowId: string | undefined;
  if (preview.createdBreakWindow && !preview.lethal) {
    createdBreakWindowId = createBreakWindowId(
      next.nextBreakWindowSequence,
      preview.createdBreakWindow.kind,
      preview.createdBreakWindow.targetId,
    );
    next.breakWindows.push({
      id: createdBreakWindowId,
      targetId: preview.createdBreakWindow.targetId,
      kind: preview.createdBreakWindow.kind,
      consumed: false,
    });
    next.nextBreakWindowSequence += 1;
  }

  if (preview.lethal && input.targetId) {
    next.intentByEnemyId[input.targetId] = undefined;
    next.breakWindows = removeWindowsForTarget(next.breakWindows, input.targetId);
    if (next.guardByTargetId) delete next.guardByTargetId[input.targetId];
  }

  next.timeline = {
    currentTime: next.timeline.currentTime,
    entries: sortTimelineActors(next.timeline).map((entry) => ({ ...entry })),
  };

  return {
    state: next,
    preview,
    activeActorId: input.activeActorId,
    targetId: input.targetId,
    damageDealt: preview.finalDamage,
    lethal: preview.lethal,
    createdBreakWindowId,
  };
}
