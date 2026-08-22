import type { BattleTurnPhase } from '../../../core/turns/BattleTurnState';

export type RefactorHandLayoutState = 'COLLAPSED' | 'EXPANDED';

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

const EXPANDED_PHASES: ReadonlySet<BattleTurnPhase> = new Set([
  'CARD_SELECTED',
  'TARGET_PREVIEW',
]);

export function handLayoutState(
  phase: BattleTurnPhase,
  dispatchMode: boolean,
): RefactorHandLayoutState {
  return dispatchMode || EXPANDED_PHASES.has(phase) ? 'EXPANDED' : 'COLLAPSED';
}

export function handLayoutMetrics(
  phase: BattleTurnPhase,
  dispatchMode: boolean,
): RefactorHandLayoutMetrics {
  const state = handLayoutState(phase, dispatchMode);
  if (state === 'EXPANDED') {
    return {
      state,
      labelY: 548,
      cardY: 635,
      cardWidth: 142,
      cardHeight: 150,
      cardGap: 152,
      previewY: 522,
      actionPrimaryY: 626,
      actionSecondaryY: 676,
      utilityX: 1110,
      utilityY: 635,
      utilityWidth: 132,
      utilityHeight: 150,
    };
  }

  return {
    state,
    labelY: 586,
    cardY: 651,
    cardWidth: 136,
    cardHeight: 116,
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
