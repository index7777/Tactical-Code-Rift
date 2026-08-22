import { afterEach, describe, expect, it } from 'vitest';
import {
  clearDemoCardUpgradeEncounterHandoff,
  consumeDemoCardUpgradeEncounterHandoff,
  prepareDemoCardUpgradeEncounterHandoff,
} from './DemoCardUpgradeEncounterHandoff';

afterEach(() => clearDemoCardUpgradeEncounterHandoff());

describe('Demo card upgrade encounter handoff', () => {
  it('normalizes and detaches prepared upgrade ids', () => {
    const source = ['quick-v1', 'quick-v1', 'guard-v1'];
    prepareDemoCardUpgradeEncounterHandoff(source);
    source.push('heavy-v1');
    expect(consumeDemoCardUpgradeEncounterHandoff()).toEqual(['quick-v1', 'guard-v1']);
  });

  it('persists across repeated bootstrap reads so a battle retry keeps run upgrades', () => {
    prepareDemoCardUpgradeEncounterHandoff(['break-v1']);
    expect(consumeDemoCardUpgradeEncounterHandoff()).toEqual(['break-v1']);
    expect(consumeDemoCardUpgradeEncounterHandoff()).toEqual(['break-v1']);
  });

  it('clears only through the explicit run handoff reset', () => {
    prepareDemoCardUpgradeEncounterHandoff(['heavy-v1']);
    clearDemoCardUpgradeEncounterHandoff();
    expect(consumeDemoCardUpgradeEncounterHandoff()).toEqual([]);
  });

  it('rejects unknown upgrade ids before battle bootstrap', () => {
    expect(() => prepareDemoCardUpgradeEncounterHandoff(['unknown']))
      .toThrow(/unknown demo card upgrade/);
  });
});
