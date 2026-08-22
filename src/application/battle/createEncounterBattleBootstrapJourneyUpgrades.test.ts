import { afterEach, describe, expect, it } from 'vitest';
import {
  clearDemoCardUpgradeEncounterHandoff,
  prepareDemoCardUpgradeEncounterHandoff,
} from './DemoCardUpgradeEncounterHandoff';
import { createEncounterBattleBootstrap } from './createEncounterBattleBootstrap';

function cardDamage(controller: ReturnType<typeof createEncounterBattleBootstrap>['controller'], id: string): number | undefined {
  const deck = controller.deck();
  const card = [...deck.hand, ...deck.drawPile, ...deck.discardPile]
    .find((candidate) => candidate.definition.id === id);
  return card?.definition.effect.damage;
}

afterEach(() => clearDemoCardUpgradeEncounterHandoff());

describe('journey upgrade handoff to encounter bootstrap', () => {
  it('applies the prepared owned upgrades to the next encounter', () => {
    prepareDemoCardUpgradeEncounterHandoff(['quick-v1']);
    const { controller } = createEncounterBattleBootstrap('battle-2-upper');
    expect(cardDamage(controller, 'qa-quick-cut')).toBe(10);
    expect(cardDamage(controller, 'qa-quick-feint')).toBe(8);
  });

  it('consumes the handoff once so a later direct battle keeps the baseline', () => {
    prepareDemoCardUpgradeEncounterHandoff(['heavy-v1']);
    const first = createEncounterBattleBootstrap('battle-2-upper').controller;
    const second = createEncounterBattleBootstrap('battle-2-upper').controller;
    expect(cardDamage(first, 'qa-heavy-cleave')).toBe(21);
    expect(cardDamage(second, 'qa-heavy-cleave')).toBe(18);
  });

  it('lets explicit bootstrap upgrades override the prepared journey handoff', () => {
    prepareDemoCardUpgradeEncounterHandoff(['quick-v1']);
    const explicit = createEncounterBattleBootstrap('battle-2-upper', 20260822, ['guard-v1']).controller;
    expect(cardDamage(explicit, 'qa-quick-cut')).toBe(8);
    const remainingPrepared = createEncounterBattleBootstrap('battle-2-upper').controller;
    expect(cardDamage(remainingPrepared, 'qa-quick-cut')).toBe(10);
  });
});
