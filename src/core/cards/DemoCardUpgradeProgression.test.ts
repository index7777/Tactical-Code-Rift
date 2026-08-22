import { describe, expect, it } from 'vitest';
import type { RefactorCardDefinition } from './RefactorCardTypes';
import {
  applyDemoCardUpgrades,
  availableDemoCardUpgrades,
  demoUpgradeMilestoneForEncounter,
  normalizeDemoCardUpgradeIds,
} from './DemoCardUpgradeProgression';

const cards: readonly RefactorCardDefinition[] = [
  { id: 'q', name: 'Q', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'h', name: 'H', category: 'heavy', delay: 7, targetRule: 'enemy', effect: { damage: 18 } },
  { id: 'g', name: 'G', category: 'guard', delay: 4, targetRule: 'self', effect: { guardRatio: 0.5, guardCap: 8 } },
  { id: 'd', name: 'D', category: 'disruption', delay: 4, targetRule: 'enemy', effect: { delayTarget: 2 } },
  { id: 'b', name: 'B', category: 'break', delay: 4, targetRule: 'enemy', effect: { damage: 5, createBreakWindow: 'armor-break' } },
];

describe('DemoCardUpgradeProgression', () => {
  it('maps the three Area 01 reward milestones and branch-equivalent battle-3 nodes', () => {
    expect(demoUpgradeMilestoneForEncounter('battle-1')).toBe('after-battle-1');
    expect(demoUpgradeMilestoneForEncounter('battle-3-upper')).toBe('after-battle-3');
    expect(demoUpgradeMilestoneForEncounter('battle-3-lower')).toBe('after-battle-3');
    expect(demoUpgradeMilestoneForEncounter('elite-1')).toBe('after-elite-1');
    expect(demoUpgradeMilestoneForEncounter('battle-2-upper')).toBeUndefined();
    expect(demoUpgradeMilestoneForEncounter('battle-2-lower')).toBeUndefined();
    expect(demoUpgradeMilestoneForEncounter('boss-1')).toBeUndefined();
  });

  it('applies each family v1 upgrade without adding new semantics', () => {
    const upgraded = applyDemoCardUpgrades(cards, [
      'quick-v1', 'heavy-v1', 'guard-v1', 'disruption-v1', 'break-v1',
    ]);
    expect(upgraded[0]).toMatchObject({ delay: 3, effect: { damage: 10 } });
    expect(upgraded[1]).toMatchObject({ delay: 7, effect: { damage: 21 } });
    expect(upgraded[2]).toMatchObject({ delay: 4, effect: { guardRatio: 0.5, guardCap: 11 } });
    expect(upgraded[3]).toMatchObject({ delay: 3, effect: { delayTarget: 2 } });
    expect(upgraded[4]).toMatchObject({ delay: 3, effect: { damage: 5, createBreakWindow: 'armor-break' } });
  });

  it('normalizes duplicate ownership so upgrades never stack twice', () => {
    expect(normalizeDemoCardUpgradeIds(['quick-v1', 'quick-v1'])).toEqual(['quick-v1']);
    expect(applyDemoCardUpgrades(cards, ['quick-v1', 'quick-v1'])[0].effect.damage).toBe(10);
  });

  it('rejects unknown upgrade ids', () => {
    expect(() => normalizeDemoCardUpgradeIds(['quick-v2'])).toThrow('unknown demo card upgrade: quick-v2');
  });

  it('returns remaining upgrade choices in stable family order', () => {
    expect(availableDemoCardUpgrades(['guard-v1', 'quick-v1'])).toEqual([
      'heavy-v1', 'disruption-v1', 'break-v1',
    ]);
  });

  it('does not mutate base definitions or nested effects', () => {
    const baseDamage = cards[0].effect.damage;
    const upgraded = applyDemoCardUpgrades(cards, ['quick-v1']);
    upgraded[0].effect.damage = 99;
    expect(cards[0].effect.damage).toBe(baseDamage);
  });
});
