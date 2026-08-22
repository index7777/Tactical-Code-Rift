import { describe, expect, it } from 'vitest';
import type { RefactorCardDefinition } from '../cards/RefactorCardTypes';
import {
  applyCardFamilyUpgrades,
  cardUpgradeRewardMilestone,
  normalizeOwnedCardUpgradeIds,
} from './CardUpgradeProgression';

const baseCards: readonly RefactorCardDefinition[] = [
  { id: 'q', name: 'Quick', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'h', name: 'Heavy', category: 'heavy', delay: 7, targetRule: 'enemy', effect: { damage: 18 } },
  { id: 'g', name: 'Guard', category: 'guard', delay: 4, targetRule: 'self', effect: { guardRatio: 0.5, guardCap: 8 } },
  { id: 'd', name: 'Disrupt', category: 'disruption', delay: 4, targetRule: 'enemy', effect: { delayTarget: 2 } },
  { id: 'b', name: 'Break', category: 'break', delay: 4, targetRule: 'enemy', effect: { damage: 5, createBreakWindow: 'armor-break' } },
];

describe('card upgrade progression', () => {
  it('maps exactly the three Area 01 reward checkpoints', () => {
    expect(cardUpgradeRewardMilestone('battle-1')).toBe(1);
    expect(cardUpgradeRewardMilestone('battle-3-upper')).toBe(2);
    expect(cardUpgradeRewardMilestone('battle-3-lower')).toBe(2);
    expect(cardUpgradeRewardMilestone('elite-1')).toBe(3);
    expect(cardUpgradeRewardMilestone('battle-2-upper')).toBeUndefined();
    expect(cardUpgradeRewardMilestone('battle-2-lower')).toBeUndefined();
    expect(cardUpgradeRewardMilestone('boss-1')).toBeUndefined();
  });

  it('normalizes duplicates without stacking and rejects unknown ids', () => {
    expect(normalizeOwnedCardUpgradeIds(['quick-v1', 'quick-v1', 'guard-v1'])).toEqual([
      'quick-v1',
      'guard-v1',
    ]);
    expect(() => normalizeOwnedCardUpgradeIds(['quick-v2'])).toThrow(/unknown card family upgrade id/);
  });

  it('applies the five v1 family upgrades to existing semantics only', () => {
    const result = applyCardFamilyUpgrades(baseCards, [
      'quick-v1',
      'heavy-v1',
      'guard-v1',
      'disruption-v1',
      'break-v1',
    ]);

    expect(result[0]).toMatchObject({ delay: 3, effect: { damage: 10 } });
    expect(result[1]).toMatchObject({ delay: 7, effect: { damage: 21 } });
    expect(result[2]).toMatchObject({ delay: 4, effect: { guardRatio: 0.5, guardCap: 11 } });
    expect(result[3]).toMatchObject({ delay: 3, effect: { delayTarget: 2 } });
    expect(result[4]).toMatchObject({ delay: 3, effect: { damage: 5, createBreakWindow: 'armor-break' } });
  });

  it('does not mutate base definitions and duplicate ownership does not stack', () => {
    const original = JSON.parse(JSON.stringify(baseCards));
    const result = applyCardFamilyUpgrades(baseCards, ['quick-v1', 'quick-v1']);

    expect(result[0]?.effect.damage).toBe(10);
    expect(baseCards).toEqual(original);
    expect(result[0]).not.toBe(baseCards[0]);
    expect(result[0]?.effect).not.toBe(baseCards[0]?.effect);
  });

  it('clamps disruption and break delay at zero', () => {
    const zeroDelay: readonly RefactorCardDefinition[] = [
      { id: 'd0', name: 'D0', category: 'disruption', delay: 0, targetRule: 'enemy', effect: { interrupt: true } },
      { id: 'b0', name: 'B0', category: 'break', delay: 0, targetRule: 'enemy', effect: { createBreakWindow: 'imbalance' } },
    ];
    const result = applyCardFamilyUpgrades(zeroDelay, ['disruption-v1', 'break-v1']);
    expect(result.map((card) => card.delay)).toEqual([0, 0]);
  });
});
