import {
  beginActorTurn,
  beginResolving,
  cancelPlayerStep,
  confirmPlayerAction,
  finishResolution,
  previewTarget,
  selectAction,
  waitingForNextActor,
  type BattleTurnState,
} from '../../core/turns/BattleTurnState';
import {
  cloneRefactorDeckState,
  DISPATCH_DELAY,
  dispatchCards,
  playOneCard,
} from '../../core/cards/RefactorDeck';
import type {
  RefactorCardInstance,
  RefactorDeckState,
} from '../../core/cards/RefactorCardTypes';
import type { IntentState } from '../../core/intents/IntentState';
import {
  resolveBattlePreview,
  type BattlePreviewResult,
  type PreviewActorVitals,
} from '../../core/preview/BattlePreviewResolver';
import type { BreakWindowState } from '../../core/status/BreakWindow';
import type { ControlResilienceState } from '../../core/status/ControlResilience';
import {
  nextTimelineActor,
  scheduleAfterAction,
} from '../../core/timeline/BattleTimeline';
import type { BattleTimelineState } from '../../core/timeline/TimelineTypes';

const DISPATCH_ACTION_ID = '__dispatch__';

export interface BattlePreviewContextState {
  vitalsByActorId: Record<string, PreviewActorVitals>;
  intentByEnemyId: Record<string, IntentState | undefined>;
  resilienceByEnemyId: Record<string, ControlResilienceState | undefined>;
  breakWindows: BreakWindowState[];
}

function cloneIntent(intent: IntentState | undefined): IntentState | undefined {
  return intent
    ? { ...intent, targetIds: [...intent.targetIds], statusEffects: [...intent.statusEffects] }
    : undefined;
}

function clonePreviewContext(context: BattlePreviewContextState): BattlePreviewContextState {
  return {
    vitalsByActorId: Object.fromEntries(
      Object.entries(context.vitalsByActorId).map(([actorId, vitals]) => [actorId, { ...vitals }]),
    ),
    intentByEnemyId: Object.fromEntries(
      Object.entries(context.intentByEnemyId).map(([actorId, intent]) => [actorId, cloneIntent(intent)]),
    ),
    resilienceByEnemyId: Object.fromEntries(
      Object.entries(context.resilienceByEnemyId).map(([actorId, resilience]) => [
        actorId,
        resilience ? { ...resilience } : undefined,
      ]),
    ),
    breakWindows: context.breakWindows.map((window) => ({ ...window })),
  };
}

function clonePreviewResult(preview: BattlePreviewResult | undefined): BattlePreviewResult | undefined {
  if (!preview) return undefined;
  return {
    ...preview,
    crossedPlayerActorIds: [...preview.crossedPlayerActorIds],
    intentBefore: cloneIntent(preview.intentBefore),
    intentAfter: cloneIntent(preview.intentAfter),
    consumedBreakWindowIds: [...preview.consumedBreakWindowIds],
    createdBreakWindow: preview.createdBreakWindow ? { ...preview.createdBreakWindow } : undefined,
    predictedTimeline: {
      currentTime: preview.predictedTimeline.currentTime,
      entries: preview.predictedTimeline.entries.map((entry) => ({ ...entry })),
    },
  };
}

export class BattleTurnController {
  private timelineState: BattleTimelineState;
  private deckState: RefactorDeckState;
  private previewContextState?: BattlePreviewContextState;
  private previewResult?: BattlePreviewResult;
  private turnState: BattleTurnState = waitingForNextActor();
  private pendingActionDelay?: number;

  constructor(
    timeline: BattleTimelineState,
    deck: RefactorDeckState,
    previewContext?: BattlePreviewContextState,
  ) {
    this.timelineState = timeline;
    this.deckState = cloneRefactorDeckState(deck);
    this.previewContextState = previewContext ? clonePreviewContext(previewContext) : undefined;
  }

  timeline(): BattleTimelineState {
    return {
      currentTime: this.timelineState.currentTime,
      entries: this.timelineState.entries.map((entry) => ({ ...entry })),
    };
  }

  deck(): RefactorDeckState {
    return cloneRefactorDeckState(this.deckState);
  }

  turn(): BattleTurnState {
    return {
      ...this.turnState,
      activeActor: this.turnState.activeActor ? { ...this.turnState.activeActor } : undefined,
    };
  }

  preview(): BattlePreviewResult | undefined {
    return clonePreviewResult(this.previewResult);
  }

  setPreviewContext(context: BattlePreviewContextState): void {
    this.previewContextState = clonePreviewContext(context);
    this.clearPreview();
  }

  startNextActor(): BattleTurnState {
    if (this.turnState.phase !== 'WAITING_FOR_NEXT_ACTOR') {
      throw new Error(`cannot start next actor during ${this.turnState.phase}`);
    }
    const actor = nextTimelineActor(this.timelineState);
    if (!actor) throw new Error('timeline has no actors');
    this.pendingActionDelay = undefined;
    this.clearPreview();
    this.turnState = beginActorTurn(actor);
    return this.turn();
  }

  selectPlayerCard(instanceId: string): BattleTurnState {
    this.requireCardInHand(instanceId);
    this.clearPreview();
    this.turnState = selectAction(this.turnState, instanceId);
    return this.turn();
  }

  previewPlayerTarget(targetId: string): BattleTurnState {
    if (!this.turnState.selectedActionId || this.turnState.selectedActionId === DISPATCH_ACTION_ID) {
      throw new Error('no player card selected');
    }
    const card = this.requireCardInHand(this.turnState.selectedActionId);
    this.turnState = previewTarget(this.turnState, targetId);
    this.previewResult = this.resolvePreview(card, targetId);
    return this.turn();
  }

  cancelPlayerStep(): BattleTurnState {
    this.turnState = cancelPlayerStep(this.turnState);
    this.clearPreview();
    return this.turn();
  }

  confirmPlayerCard(): BattleTurnState {
    if (!this.turnState.selectedActionId || this.turnState.selectedActionId === DISPATCH_ACTION_ID) {
      throw new Error('no player card selected');
    }

    const card = this.requireCardInHand(this.turnState.selectedActionId);
    if (this.requiresExplicitTarget(card) && !this.turnState.previewTargetId) {
      throw new Error(`card requires a target: ${card.instanceId}`);
    }
    if (this.requiresExplicitTarget(card) && !this.previewResult) {
      throw new Error(`card requires a resolved target preview: ${card.instanceId}`);
    }

    this.turnState = confirmPlayerAction(this.turnState);
    const result = playOneCard(this.deckState, card.instanceId);
    this.deckState = result.state;
    this.pendingActionDelay = result.played.definition.delay;
    this.clearPreview();
    return this.turn();
  }

  dispatch(selectedInstanceIds: readonly string[]): BattleTurnState {
    if (this.turnState.phase !== 'PLAYER_IDLE') {
      throw new Error(`cannot dispatch during ${this.turnState.phase}`);
    }
    if (!this.turnState.activeActor || this.turnState.activeActor.team !== 'player') {
      throw new Error('only an active player actor can dispatch');
    }

    const result = dispatchCards(this.deckState, selectedInstanceIds);
    this.deckState = result.state;
    this.clearPreview();
    this.turnState = selectAction(this.turnState, DISPATCH_ACTION_ID);
    this.turnState = confirmPlayerAction(this.turnState);
    this.pendingActionDelay = DISPATCH_DELAY;
    return this.turn();
  }

  beginResolution(): BattleTurnState {
    this.clearPreview();
    this.turnState = beginResolving(this.turnState);
    return this.turn();
  }

  completeResolution(enemyDelay?: number): BattleTimelineState {
    if (this.turnState.phase !== 'RESOLVING' || !this.turnState.activeActor) {
      throw new Error(`cannot complete resolution during ${this.turnState.phase}`);
    }

    const delay = this.turnState.activeActor.team === 'player'
      ? this.requirePendingPlayerDelay()
      : this.requireEnemyDelay(enemyDelay);

    const result = scheduleAfterAction(
      this.timelineState,
      this.turnState.activeActor.actorId,
      delay,
    );
    this.timelineState = result.state;
    this.pendingActionDelay = undefined;
    this.clearPreview();
    this.turnState = finishResolution();
    return this.timeline();
  }

  private resolvePreview(card: RefactorCardInstance, targetId: string): BattlePreviewResult {
    const context = this.previewContextState;
    if (!context) throw new Error('battle preview context is not configured');
    const target = context.vitalsByActorId[targetId];
    if (!target) throw new Error(`preview vitals not found: ${targetId}`);

    return resolveBattlePreview({
      activeActorId: this.requireActivePlayerActorId(),
      card,
      target: { ...target },
      timeline: this.timelineState,
      targetIntent: cloneIntent(context.intentByEnemyId[targetId]),
      targetResilience: context.resilienceByEnemyId[targetId]
        ? { ...context.resilienceByEnemyId[targetId]! }
        : undefined,
      breakWindows: context.breakWindows.map((window) => ({ ...window })),
    });
  }

  private requireActivePlayerActorId(): string {
    const actor = this.turnState.activeActor;
    if (!actor || actor.team !== 'player') throw new Error('preview requires an active player actor');
    return actor.actorId;
  }

  private clearPreview(): void {
    this.previewResult = undefined;
  }

  private requireCardInHand(instanceId: string): RefactorCardInstance {
    const card = this.deckState.hand.find((candidate) => candidate.instanceId === instanceId);
    if (!card) throw new Error(`card is not in shared hand: ${instanceId}`);
    return card;
  }

  private requiresExplicitTarget(card: RefactorCardInstance): boolean {
    return card.definition.targetRule === 'enemy'
      || card.definition.targetRule === 'ally'
      || card.definition.targetRule === 'any-ally';
  }

  private requirePendingPlayerDelay(): number {
    if (this.pendingActionDelay === undefined) {
      throw new Error('player action has no committed card or dispatch delay');
    }
    return this.pendingActionDelay;
  }

  private requireEnemyDelay(delay: number | undefined): number {
    if (delay === undefined) throw new Error('enemy resolution requires an action delay');
    return delay;
  }
}
