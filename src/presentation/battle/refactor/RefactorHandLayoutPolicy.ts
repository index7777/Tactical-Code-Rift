import type { BattleTurnPhase } from '../../../core/turns/BattleTurnState';

export type RefactorHandLayoutState = 'PEEK' | 'FOCUS' | 'TARGETING' | 'HIDDEN' | 'DISPATCH';

export interface RefactorHandLayoutMetrics {
  state: RefactorHandLayoutState;
  labelY: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  cardGap: number;
  previewY: number;
  actionPrimaryY: number;
  actionSecondaryY: number;
  utilityX: number;
  utilityY: number;
  utilityWidth: number;
  utilityHeight: number;
}

export function handLayoutState(
  phase: BattleTurnPhase,
  dispatchMode: boolean,
): RefactorHandLayoutState {
  if (dispatchMode) return 'DISPATCH';
  if (phase === 'PLAYER_IDLE') return 'PEEK';
  if (phase === 'CARD_SELECTED') return 'FOCUS';
  if (phase === 'TARGET_PREVIEW') return 'TARGETING';
  return 'HIDDEN';
}

export function handLayoutMetrics(
  phase: BattleTurnPhase,
  dispatchMode: boolean,
): RefactorHandLayoutMetrics {
  const state = handLayoutState(phase, dispatchMode);
  if (state === 'FOCUS' || state === 'TARGETING') {
    return {
      state,
      labelY: 548,
      cardY: 770,
      cardWidth: 136,
      cardHeight: 204,
      cardGap: 152,
      previewY: 522,
      actionPrimaryY: 626,
      actionSecondaryY: 676,
      utilityX: 1110,
      utilityY: 635,
      utilityWidth: 132,
      utilityHeight: 132,
    };
  }

  if (state === 'HIDDEN') return { state, labelY: 760, cardY: 840, cardWidth: 136, cardHeight: 204, cardGap: 148, previewY: 558, actionPrimaryY: 640, actionSecondaryY: 684, utilityX: 1110, utilityY: 840, utilityWidth: 132, utilityHeight: 116 };

  if (state === 'DISPATCH') return { state, labelY: 548, cardY: 660, cardWidth: 136, cardHeight: 204, cardGap: 148, previewY: 522, actionPrimaryY: 626, actionSecondaryY: 676, utilityX: 1110, utilityY: 635, utilityWidth: 132, utilityHeight: 150 };

  return {
    state,
    labelY: 586,
    cardY: 720,
    cardWidth: 136,
    cardHeight: 204,
    cardGap: 148,
    previewY: 558,
    actionPrimaryY: 640,
    actionSecondaryY: 684,
    utilityX: 1110,
    utilityY: 651,
    utilityWidth: 132,
    utilityHeight: 116,
  };
}
