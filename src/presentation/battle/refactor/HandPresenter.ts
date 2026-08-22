import type { RefactorCardCategory, RefactorDeckState, RefactorTargetRule } from '../../../core/cards/RefactorCardTypes';

export interface HandCardView {
  instanceId: string;
  name: string;
  category: RefactorCardCategory;
  delay: number;
  targetRule: RefactorTargetRule;
  selected: boolean;
}

export function buildHandCards(
  deck: RefactorDeckState,
  selectedInstanceId?: string,
): HandCardView[] {
  return deck.hand.map((card) => ({
    instanceId: card.instanceId,
    name: card.definition.name,
    category: card.definition.category,
    delay: card.definition.delay,
    targetRule: card.definition.targetRule,
    selected: card.instanceId === selectedInstanceId,
  }));
}
