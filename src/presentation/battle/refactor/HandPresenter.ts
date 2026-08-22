import type {
  RefactorCardCategory,
  RefactorCardEffect,
  RefactorDeckState,
  RefactorTargetRule,
} from '../../../core/cards/RefactorCardTypes';
import { cardEffectLines } from './CardMasterPresentation';

export interface HandCardView {
  instanceId: string;
  name: string;
  category: RefactorCardCategory;
  delay: number;
  targetRule: RefactorTargetRule;
  effect: RefactorCardEffect;
  effectLines: string[];
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
    effect: { ...card.definition.effect },
    effectLines: cardEffectLines(card.definition.effect),
    selected: card.instanceId === selectedInstanceId,
  }));
}
