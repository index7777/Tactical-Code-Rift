import type { TimelineEntry } from '../timeline/TimelineTypes';

export type BattleTurnPhase =
  | 'WAITING_FOR_NEXT_ACTOR'
  | 'PLAYER_IDLE'
  | 'CARD_SELECTED'
  | 'TARGET_PREVIEW'
  | 'EXECUTING'
  | 'ENEMY_EXECUTING'
  | 'RESOLVING'
  | 'BATTLE_ENDED';

export interface BattleTurnState {
  phase: BattleTurnPhase;
  activeActor?: TimelineEntry;
  selectedActionId?: string;
  previewTargetId?: string;
}

export function waitingForNextActor(): BattleTurnState {
  return { phase: 'WAITING_FOR_NEXT_ACTOR' };
}

export function beginActorTurn(actor: TimelineEntry): BattleTurnState {
  return {
    phase: actor.team === 'player' ? 'PLAYER_IDLE' : 'ENEMY_EXECUTING',
    activeActor: { ...actor },
  };
}

export function selectAction(state: BattleTurnState, actionId: string): BattleTurnState {
  if (state.phase !== 'PLAYER_IDLE' && state.phase !== 'CARD_SELECTED') {
    throw new Error(`cannot select action during ${state.phase}`);
  }
  if (!state.activeActor || state.activeActor.team !== 'player') {
    throw new Error('only an active player actor can select an action');
  }
  if (!actionId) throw new Error('actionId is required');
  return {
    phase: 'CARD_SELECTED',
    activeActor: { ...state.activeActor },
    selectedActionId: actionId,
  };
}

export function previewTarget(state: BattleTurnState, targetId: string): BattleTurnState {
  if (state.phase !== 'CARD_SELECTED' && state.phase !== 'TARGET_PREVIEW') {
    throw new Error(`cannot preview target during ${state.phase}`);
  }
  if (!state.selectedActionId) throw new Error('no selected action');
  if (!targetId) throw new Error('targetId is required');
  return {
    ...state,
    phase: 'TARGET_PREVIEW',
    previewTargetId: targetId,
  };
}

export function confirmPlayerAction(state: BattleTurnState): BattleTurnState {
  if (state.phase !== 'CARD_SELECTED' && state.phase !== 'TARGET_PREVIEW') {
    throw new Error(`cannot execute action during ${state.phase}`);
  }
  if (!state.activeActor || state.activeActor.team !== 'player' || !state.selectedActionId) {
    throw new Error('player action is incomplete');
  }
  return { ...state, phase: 'EXECUTING' };
}

export function beginResolving(state: BattleTurnState): BattleTurnState {
  if (state.phase !== 'EXECUTING' && state.phase !== 'ENEMY_EXECUTING') {
    throw new Error(`cannot resolve during ${state.phase}`);
  }
  return { ...state, phase: 'RESOLVING' };
}

export function cancelPlayerStep(state: BattleTurnState): BattleTurnState {
  if (state.phase === 'TARGET_PREVIEW') {
    return {
      phase: 'CARD_SELECTED',
      activeActor: state.activeActor ? { ...state.activeActor } : undefined,
      selectedActionId: state.selectedActionId,
    };
  }
  if (state.phase === 'CARD_SELECTED') {
    return {
      phase: 'PLAYER_IDLE',
      activeActor: state.activeActor ? { ...state.activeActor } : undefined,
    };
  }
  return state;
}

export function finishResolution(): BattleTurnState {
  return waitingForNextActor();
}

export function endBattle(state: BattleTurnState): BattleTurnState {
  return {
    ...state,
    phase: 'BATTLE_ENDED',
    selectedActionId: undefined,
    previewTargetId: undefined,
  };
}
