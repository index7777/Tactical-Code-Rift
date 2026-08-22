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
      labelY: 558,
      cardY: 642,
      cardWidth: 124,
      cardHeight: 116,
      cardGap: 148,
      previewY: 536,
      actionPrimaryY: 630,
      actionSecondaryY: 682,
    };
  }

  return {
    state,
    labelY: 598,
    cardY: 660,
    cardWidth: 124,
    cardHeight: 82,
    cardGap: 148,
    previewY: 574,
    actionPrimaryY: 646,
    actionSecondaryY: 688,
  };
}
