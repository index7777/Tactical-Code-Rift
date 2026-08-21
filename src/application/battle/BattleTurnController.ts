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
import { resolveEnemyAction } from '../../core/enemy/EnemyActionResolver';
import type { IntentState } from '../../core/intents/IntentState';
import {
  resolveBattlePreview,
  type BattlePreviewResult,
} from '../../core/preview/BattlePreviewResolver';
import {
  resolveBattleAction,
  type BattleResolutionState,
} from '../../core/resolution/BattleResolutionResolver';
import {
  nextTimelineActor,
  scheduleAfterAction,
} from '../../core/timeline/BattleTimeline';
import type { BattleTimelineState } from '../../core/timeline/TimelineTypes';

const DISPATCH_ACTION_ID = '__dispatch__';

function cloneIntent(intent: IntentState | undefined): IntentState | undefined {
  return intent
    ? { ...intent, targetIds: [...intent.targetIds], statusEffects: [...intent.statusEffects] }
    : undefined;
}

function cloneCard(card: RefactorCardInstance | undefined): RefactorCardInstance | undefined {
  if (!card) return undefined;
  return {
    instanceId: card.instanceId,
    definition: {
      ...card.definition,
      effect: { ...card.definition.effect },
    },
  };
}

function cloneBattleState(state: BattleResolutionState): BattleResolutionState {
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
  };
}

function clonePreviewResult(preview: BattlePreviewResult | undefined): BattlePreviewResult | undefined {
  if (!preview) return undefined;
  return {
    ...preview,
    targetResilienceAfter: preview.targetResilienceAfter
      ? { ...preview.targetResilienceAfter }
      : undefined,
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
  private battleState: BattleResolutionState;
  private deckState: RefactorDeckState;
  private previewResult?: BattlePreviewResult;
  private turnState: BattleTurnState = waitingForNextActor();
  private committedCard?: RefactorCardInstance;
  private committedTargetId?: string;
  private pendingDispatch = false;

  constructor(battle: BattleResolutionState, deck: RefactorDeckState) {
    this.battleState = cloneBattleState(battle);
    this.deckState = cloneRefactorDeckState(deck);
  }

  battle(): BattleResolutionState {
    return cloneBattleState(this.battleState);
  }

  timeline(): BattleTimelineState {
    const timeline = this.battleState.timeline;
    return {
      currentTime: timeline.currentTime,
      entries: timeline.entries.map((entry) => ({ ...entry })),
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

  startNextActor(): BattleTurnState {
    if (this.turnState.phase !== 'WAITING_FOR_NEXT_ACTOR') {
      throw new Error(`cannot start next actor during ${this.turnState.phase}`);
    }
    const actor = nextTimelineActor(this.battleState.timeline);
    if (!actor) throw new Error('timeline has no actors');
    this.clearPendingAction();
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

    const targetId = card.definition.targetRule === 'self'
      ? this.requireActivePlayerActorId()
      : this.turnState.previewTargetId;

    this.turnState = confirmPlayerAction(this.turnState);
    const result = playOneCard(this.deckState, card.instanceId);
    this.deckState = result.state;
    this.committedCard = cloneCard(result.played);
    this.committedTargetId = targetId;
    this.pendingDispatch = false;
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
    this.clearPendingAction();
    this.turnState = selectAction(this.turnState, DISPATCH_ACTION_ID);
    this.turnState = confirmPlayerAction(this.turnState);
    this.pendingDispatch = true;
    return this.turn();
  }

  beginResolution(): BattleTurnState {
    this.clearPreview();
    this.turnState = beginResolving(this.turnState);
    return this.turn();
  }

  completeResolution(nextEnemyIntent?: IntentState): BattleResolutionState {
    if (this.turnState.phase !== 'RESOLVING' || !this.turnState.activeActor) {
      throw new Error(`cannot complete resolution during ${this.turnState.phase}`);
    }

    const actor = this.turnState.activeActor;
    if (actor.team === 'player') {
      if (nextEnemyIntent) throw new Error('player resolution does not accept an enemy intent');
      if (this.pendingDispatch) {
        const scheduled = scheduleAfterAction(
          this.battleState.timeline,
          actor.actorId,
          DISPATCH_DELAY,
        );
        this.battleState = {
          ...cloneBattleState(this.battleState),
          timeline: scheduled.state,
        };
      } else {
        const card = this.committedCard;
        if (!card) throw new Error('player action has no committed card');
        const resolved = resolveBattleAction({
          state: this.battleState,
          activeActorId: actor.actorId,
          card,
          targetId: this.committedTargetId,
        });
        this.battleState = resolved.state;
      }
    } else {
      if (!nextEnemyIntent) throw new Error('enemy resolution requires the next revealed intent');
      const resolved = resolveEnemyAction({
        state: this.battleState,
        enemyId: actor.actorId,
        nextIntent: nextEnemyIntent,
      });
      this.battleState = resolved.state;
    }

    this.clearPendingAction();
    this.clearPreview();
    this.turnState = finishResolution();
    return this.battle();
  }

  private resolvePreview(card: RefactorCardInstance, targetId: string): BattlePreviewResult {
    const target = this.battleState.vitalsByActorId[targetId];
    if (!target) throw new Error(`preview vitals not found: ${targetId}`);

    return resolveBattlePreview({
      activeActorId: this.requireActivePlayerActorId(),
      card,
      target: { ...target },
      timeline: this.battleState.timeline,
      targetIntent: cloneIntent(this.battleState.intentByEnemyId[targetId]),
      targetResilience: this.battleState.resilienceByEnemyId[targetId]
        ? { ...this.battleState.resilienceByEnemyId[targetId]! }
        : undefined,
      breakWindows: this.battleState.breakWindows.map((window) => ({ ...window })),
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

  private clearPendingAction(): void {
    this.committedCard = undefined;
    this.committedTargetId = undefined;
    this.pendingDispatch = false;
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
}
