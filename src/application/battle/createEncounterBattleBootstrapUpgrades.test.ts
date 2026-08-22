import { describe, expect, it } from 'vitest';
import { createEncounterBattleBootstrap } from './createEncounterBattleBootstrap';

function definitionsById(ownedUpgradeIds: Parameters<typeof createEncounterBattleBootstrap>[2] = []) {
  const { controller } = createEncounterBattleBootstrap('battle-1', 20260822, ownedUpgradeIds);
  const deck = controller.deck();
  return new Map(
    [...deck.hand, ...deck.drawPile, ...deck.discardPile]
      .map((card) => [card.definition.id, card.definition] as const),
  );
}

describe('encounter battle bootstrap card upgrades', () => {
  it('keeps current card values when no progression upgrades are supplied', () => {
    const cards = definitionsById();
    expect(cards.get('qa-quick-cut')).toMatchObject({ delay: 3, effect: { damage: 8 } });
    expect(cards.get('qa-heavy-cleave')).toMatchObject({ delay: 7, effect: { damage: 18 } });
    expect(cards.get('qa-guard-cover')).toMatchObject({ delay: 4, effect: { guardCap: 8 } });
  });

  it('applies owned family upgrades before the shared deck is instantiated', () => {
    const cards = definitionsById(['quick-v1', 'guard-v1', 'break-v1']);
    expect(cards.get('qa-quick-cut')).toMatchObject({ delay: 3, effect: { damage: 10 } });
    expect(cards.get('qa-quick-feint')).toMatchObject({ delay: 3, effect: { damage: 8 } });
    expect(cards.get('qa-guard-stance')).toMatchObject({ delay: 4, effect: { guardCap: 11 } });
    expect(cards.get('qa-guard-cover')).toMatchObject({ delay: 4, effect: { guardCap: 11 } });
    expect(cards.get('qa-break-armor')).toMatchObject({ delay: 3, effect: { damage: 5 } });
    expect(cards.get('qa-break-imbalance')).toMatchObject({ delay: 3 });
  });
});
