import type { IntentState } from '../intents/IntentState';
import { resolveGuardDamage } from '../reactions/GuardState';
import type { BattleResolutionState } from '../resolution/BattleResolutionResolver';
import { expireWindowsAfterSuccessfulAction } from '../status/BreakWindow';
import { resetTemporaryResilience } from '../status/ControlResilience';
import {
  nextTimelineActor,
  removeTimelineActor,
  scheduleAfterAction,
} from '../timeline/BattleTimeline';

export interface EnemyActionInput {
  state: BattleResolutionState;
  enemyId: string;
  nextIntent: IntentState;
}

export interface EnemyActionResult {
  state: BattleResolutionState;
  enemyId: string;
  resolvedIntent: IntentState;
  nextIntent: IntentState;
  successfulAction: boolean;
  damageByTargetId: Record<string, number>;
  guardReductionByTargetId: Record<string, number>;
  defeatedTargetIds: string[];
  chengshiTriggered: boolean;
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
      Object.entries(state.intentByEnemyId).map(([enemyId, intent]) => [enemyId, cloneIntent(intent)]),
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

function validateNextIntent(enemyId: string, nextIntent: IntentState): void {
  if (nextIntent.enemyId !== enemyId) {
    throw new Error(`next intent enemy mismatch: expected ${enemyId}, got ${nextIntent.enemyId}`);
  }
  if (nextIntent.kind !== 'normal') {
    throw new Error('next enemy intent must be a normal intent');
  }
}

function intentTotalDamage(intent: IntentState): number {
  return (intent.damage ?? 0) * (intent.hitCount ?? 1);
}

export function resolveEnemyAction(input: EnemyActionInput): EnemyActionResult {
  const source = cloneState(input.state);
  const active = nextTimelineActor(source.timeline);
  if (!active || active.actorId !== input.enemyId || active.team !== 'enemy') {
    throw new Error(`enemy is not the next timeline actor: ${input.enemyId}`);
  }

  const currentIntent = source.intentByEnemyId[input.enemyId];
  if (!currentIntent) throw new Error(`enemy has no revealed intent: ${input.enemyId}`);
  if (currentIntent.enemyId !== input.enemyId) {
    throw new Error(`revealed intent enemy mismatch: ${currentIntent.enemyId}`);
  }
  validateNextIntent(input.enemyId, input.nextIntent);

  const next = cloneState(source);
  const actedAt = active.nextActionAt;
  const successfulAction = currentIntent.kind === 'normal';
  const damageByTargetId: Record<string, number> = {};
  const guardReductionByTargetId: Record<string, number> = {};
  const defeatedTargetIds: string[] = [];
  let chengshiTriggered = false;

  if (successfulAction) {
    const incomingDamage = intentTotalDamage(currentIntent);
    for (const targetId of currentIntent.targetIds) {
      const vitals = next.vitalsByActorId[targetId];
      if (!vitals || vitals.hp <= 0) continue;

      let appliedDamage = incomingDamage;
      const guard = next.guardByTargetId?.[targetId];
      if (guard && currentIntent.canGuard) {
        const guarded = resolveGuardDamage(guard, incomingDamage);
        appliedDamage = guarded.damageAfter;
        if (guarded.consumed) {
          guardReductionByTargetId[targetId] = guarded.reduction;
          if (guard.protectorId === 'chikage') chengshiTriggered = true;
          delete next.guardByTargetId![targetId];
        }
      }

      const hpAfter = Math.max(0, vitals.hp - appliedDamage);
      const dealt = vitals.hp - hpAfter;
      damageByTargetId[targetId] = dealt;
      next.vitalsByActorId[targetId] = { ...vitals, hp: hpAfter };

      if (hpAfter === 0) {
        defeatedTargetIds.push(targetId);
        next.timeline = removeTimelineActor(next.timeline, targetId);
        if (next.guardByTargetId) delete next.guardByTargetId[targetId];
      }
    }

    const resilience = next.resilienceByEnemyId[input.enemyId];
    if (resilience) {
      next.resilienceByEnemyId[input.enemyId] = resetTemporaryResilience(resilience);
    }
    next.breakWindows = expireWindowsAfterSuccessfulAction(next.breakWindows, input.enemyId);
    next.oboroDelayUsedByEnemyId = {
      ...(next.oboroDelayUsedByEnemyId ?? {}),
      [input.enemyId]: false,
    };
  }

  next.intentByEnemyId[input.enemyId] = cloneIntent(input.nextIntent);

  const scheduled = scheduleAfterAction(
    next.timeline,
    input.enemyId,
    input.nextIntent.delay + (chengshiTriggered ? 1 : 0),
  );
  next.timeline = {
    currentTime: actedAt,
    entries: scheduled.state.entries.map((entry) => ({ ...entry })),
  };

  return {
    state: next,
    enemyId: input.enemyId,
    resolvedIntent: cloneIntent(currentIntent)!,
    nextIntent: cloneIntent(input.nextIntent)!,
    successfulAction,
    damageByTargetId: { ...damageByTargetId },
    guardReductionByTargetId: { ...guardReductionByTargetId },
    defeatedTargetIds: [...defeatedTargetIds],
    chengshiTriggered,
  };
}
