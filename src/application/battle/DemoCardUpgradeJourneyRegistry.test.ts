import { describe, expect, it } from 'vitest';
import { consumeDemoCardUpgradeEncounterHandoff } from './DemoCardUpgradeEncounterHandoff';
import {
  DEMO_CARD_UPGRADE_RUN_STATE_KEY,
  chooseJourneyDemoUpgradeReward,
  ensureDemoCardUpgradeRunState,
  offerJourneyDemoUpgradeRewardAfterVictory,
  prepareJourneyDemoUpgradeEncounterHandoff,
  readDemoCardUpgradeRunState,
  type DemoCardUpgradeRegistryPort,
} from './DemoCardUpgradeJourneyRegistry';

class FakeRegistry implements DemoCardUpgradeRegistryPort {
  readonly values = new Map<string, unknown>();
  get(key: string): unknown { return this.values.get(key); }
  set(key: string, value: unknown): unknown { this.values.set(key, value); return value; }
}

describe('DemoCardUpgradeJourneyRegistry', () => {
  it('initializes missing state and stores a detached normalized value', () => {
    const registry = new FakeRegistry();
    const state = ensureDemoCardUpgradeRunState(registry);
    expect(state).toEqual({ ownedUpgradeIds: [], claimedMilestones: [], pendingMilestone: undefined });
    expect(registry.values.get(DEMO_CARD_UPGRADE_RUN_STATE_KEY)).toEqual(state);
    state.ownedUpgradeIds.push('quick-v1');
    expect(readDemoCardUpgradeRunState(registry).ownedUpgradeIds).toEqual([]);
  });

  it('offers the current victory milestone exactly once', () => {
    const registry = new FakeRegistry();
    ensureDemoCardUpgradeRunState(registry);
    const first = offerJourneyDemoUpgradeRewardAfterVictory(registry, 'battle-1');
    const repeated = offerJourneyDemoUpgradeRewardAfterVictory(registry, 'battle-1');
    expect(first.pendingMilestone).toBe('after-battle-1');
    expect(repeated).toEqual(first);
  });

  it('shares the battle-3 milestone across both route branches', () => {
    const registry = new FakeRegistry();
    ensureDemoCardUpgradeRunState(registry);
    offerJourneyDemoUpgradeRewardAfterVictory(registry, 'battle-3-upper');
    chooseJourneyDemoUpgradeReward(registry, 'quick-v1');
    const lower = offerJourneyDemoUpgradeRewardAfterVictory(registry, 'battle-3-lower');
    expect(lower.pendingMilestone).toBeUndefined();
    expect(lower.claimedMilestones).toEqual(['after-battle-3']);
  });

  it('persists a legal choice and rejects invalid selection paths', () => {
    const registry = new FakeRegistry();
    ensureDemoCardUpgradeRunState(registry);
    expect(() => chooseJourneyDemoUpgradeReward(registry, 'quick-v1')).toThrow('no demo upgrade reward is pending');
    offerJourneyDemoUpgradeRewardAfterVictory(registry, 'battle-1');
    expect(() => chooseJourneyDemoUpgradeReward(registry, 'quick-v2')).toThrow('unknown demo card upgrade: quick-v2');
    const selected = chooseJourneyDemoUpgradeReward(registry, 'guard-v1');
    expect(selected).toEqual({ ownedUpgradeIds: ['guard-v1'], claimedMilestones: ['after-battle-1'], pendingMilestone: undefined });
    offerJourneyDemoUpgradeRewardAfterVictory(registry, 'battle-3-upper');
    expect(() => chooseJourneyDemoUpgradeReward(registry, 'guard-v1')).toThrow('demo card upgrade already owned: guard-v1');
  });

  it('prepares a one-shot encounter handoff from persisted ownership', () => {
    const registry = new FakeRegistry();
    registry.set(DEMO_CARD_UPGRADE_RUN_STATE_KEY, {
      ownedUpgradeIds: ['quick-v1', 'heavy-v1'],
      claimedMilestones: ['after-battle-1', 'after-battle-3'],
    });
    prepareJourneyDemoUpgradeEncounterHandoff(registry);
    expect(consumeDemoCardUpgradeEncounterHandoff()).toEqual(['quick-v1', 'heavy-v1']);
    expect(consumeDemoCardUpgradeEncounterHandoff()).toEqual([]);
  });
});
