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
import {
  nextTimelineActor,
  scheduleAfterAction,
} from '../../core/timeline/BattleTimeline';
import type { BattleTimelineState } from '../../core/timeline/TimelineTypes';

const DISPATCH_ACTION_ID = '__dispatch__';

export class BattleTurnController {
  private timelineState: BattleTimelineState;
  private deckState: RefactorDeckState;
  private turnState: BattleTurnState = waitingForNextActor();
  private pendingActionDelay?: number;

  constructor(timeline: BattleTimelineState, deck: RefactorDeckState) {
    this.timelineState = timeline;
    this.deckState = cloneRefactorDeckState(deck);
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

  startNextActor(): BattleTurnState {
    if (this.turnState.phase !== 'WAITING_FOR_NEXT_ACTOR') {
      throw new Error(`cannot start next actor during ${this.turnState.phase}`);
    }
    const actor = nextTimelineActor(this.timelineState);
    if (!actor) throw new Error('timeline has no actors');
    this.pendingActionDelay = undefined;
    this.turnState = beginActorTurn(actor);
    return this.turn();
  }

  selectPlayerCard(instanceId: string): BattleTurnState {
    this.requireCardInHand(instanceId);
    this.turnState = selectAction(this.turnState, instanceId);
    return this.turn();
  }

  previewPlayerTarget(targetId: string): BattleTurnState {
    this.turnState = previewTarget(this.turnState, targetId);
    return this.turn();
  }

  cancelPlayerStep(): BattleTurnState {
    this.turnState = cancelPlayerStep(this.turnState);
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

    this.turnState = confirmPlayerAction(this.turnState);
    const result = playOneCard(this.deckState, card.instanceId);
    this.deckState = result.state;
    this.pendingActionDelay = result.played.definition.delay;
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
    this.turnState = selectAction(this.turnState, DISPATCH_ACTION_ID);
    this.turnState = confirmPlayerAction(this.turnState);
    this.pendingActionDelay = DISPATCH_DELAY;
    return this.turn();
  }

  beginResolution(): BattleTurnState {
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
    this.turnState = finishResolution();
    return this.timeline();
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
