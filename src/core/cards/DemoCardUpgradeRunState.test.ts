import { describe, expect, it } from 'vitest';
import {
  chooseDemoUpgradeReward,
  createDemoCardUpgradeRunState,
  demoOwnedUpgradeIds,
  normalizeDemoCardUpgradeRunState,
  offerDemoUpgradeRewardAfterVictory,
} from './DemoCardUpgradeRunState';

describe('DemoCardUpgradeRunState', () => {
  it('offers only authored victory milestones', () => {
    const base = createDemoCardUpgradeRunState();
    expect(offerDemoUpgradeRewardAfterVictory(base, 'battle-2-upper')).toEqual(base);
    expect(offerDemoUpgradeRewardAfterVictory(base, 'boss-1')).toEqual(base);
    expect(offerDemoUpgradeRewardAfterVictory(base, 'battle-1').pendingMilestone).toBe('after-battle-1');
  });

  it('treats both battle-3 branches as the same once-only milestone', () => {
    let state = offerDemoUpgradeRewardAfterVictory(createDemoCardUpgradeRunState(), 'battle-3-upper');
    state = chooseDemoUpgradeReward(state, 'quick-v1');
    expect(offerDemoUpgradeRewardAfterVictory(state, 'battle-3-lower')).toEqual(state);
  });

  it('blocks a different milestone while a reward is pending', () => {
    const pending = offerDemoUpgradeRewardAfterVictory(createDemoCardUpgradeRunState(), 'battle-1');
    expect(() => offerDemoUpgradeRewardAfterVictory(pending, 'elite-1')).toThrow(
      'demo upgrade reward already pending: after-battle-1',
    );
  });

  it('claims the pending milestone and adds exactly one selected family upgrade', () => {
    const pending = offerDemoUpgradeRewardAfterVictory(createDemoCardUpgradeRunState(), 'battle-1');
    const selected = chooseDemoUpgradeReward(pending, 'guard-v1');
    expect(selected).toEqual({
      ownedUpgradeIds: ['guard-v1'],
      claimedMilestones: ['after-battle-1'],
    });
  });

  it('rejects no-pending, unknown and already-owned selections', () => {
    expect(() => chooseDemoUpgradeReward(createDemoCardUpgradeRunState(), 'quick-v1')).toThrow(
      'no demo upgrade reward is pending',
    );
    const pending = offerDemoUpgradeRewardAfterVictory(createDemoCardUpgradeRunState(), 'battle-1');
    expect(() => chooseDemoUpgradeReward(pending, 'quick-v2')).toThrow('unknown demo card upgrade: quick-v2');
    const owned = chooseDemoUpgradeReward(pending, 'quick-v1');
    const nextPending = offerDemoUpgradeRewardAfterVictory(owned, 'battle-3-upper');
    expect(() => chooseDemoUpgradeReward(nextPending, 'quick-v1')).toThrow(
      'demo card upgrade already owned: quick-v1',
    );
  });

  it('normalizes duplicate stored values and returns detached owned ids', () => {
    const normalized = normalizeDemoCardUpgradeRunState({
      ownedUpgradeIds: ['quick-v1', 'quick-v1'],
      claimedMilestones: ['after-battle-1', 'after-battle-1'],
    });
    expect(normalized).toEqual({ ownedUpgradeIds: ['quick-v1'], claimedMilestones: ['after-battle-1'] });
    const ids = demoOwnedUpgradeIds(normalized);
    ids.push('heavy-v1');
    expect(normalized.ownedUpgradeIds).toEqual(['quick-v1']);
  });

  it('supports a complete three-reward Area 01 run without duplicate families', () => {
    let state = createDemoCardUpgradeRunState();
    state = chooseDemoUpgradeReward(offerDemoUpgradeRewardAfterVictory(state, 'battle-1'), 'quick-v1');
    state = chooseDemoUpgradeReward(offerDemoUpgradeRewardAfterVictory(state, 'battle-3-lower'), 'heavy-v1');
    state = chooseDemoUpgradeReward(offerDemoUpgradeRewardAfterVictory(state, 'elite-1'), 'break-v1');
    expect(state.ownedUpgradeIds).toEqual(['quick-v1', 'heavy-v1', 'break-v1']);
    expect(state.claimedMilestones).toEqual(['after-battle-1', 'after-battle-3', 'after-elite-1']);
    expect(state.pendingMilestone).toBeUndefined();
  });
});
