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
  nextTimelineActor,
  scheduleAfterAction,
} from '../../core/timeline/BattleTimeline';
import type { BattleTimelineState } from '../../core/timeline/TimelineTypes';

export class BattleTurnController {
  private timelineState: BattleTimelineState;
  private turnState: BattleTurnState = waitingForNextActor();

  constructor(timeline: BattleTimelineState) {
    this.timelineState = timeline;
  }

  timeline(): BattleTimelineState {
    return {
      currentTime: this.timelineState.currentTime,
      entries: this.timelineState.entries.map((entry) => ({ ...entry })),
    };
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
    this.turnState = beginActorTurn(actor);
    return this.turn();
  }

  selectPlayerAction(actionId: string): BattleTurnState {
    this.turnState = selectAction(this.turnState, actionId);
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

  confirmPlayerAction(): BattleTurnState {
    this.turnState = confirmPlayerAction(this.turnState);
    return this.turn();
  }

  beginResolution(): BattleTurnState {
    this.turnState = beginResolving(this.turnState);
    return this.turn();
  }

  completeResolution(delay: number): BattleTimelineState {
    if (this.turnState.phase !== 'RESOLVING' || !this.turnState.activeActor) {
      throw new Error(`cannot complete resolution during ${this.turnState.phase}`);
    }
    const result = scheduleAfterAction(
      this.timelineState,
      this.turnState.activeActor.actorId,
      delay,
    );
    this.timelineState = result.state;
    this.turnState = finishResolution();
    return this.timeline();
  }
}
