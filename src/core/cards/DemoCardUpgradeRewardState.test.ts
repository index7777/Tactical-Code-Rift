import { describe, expect, it } from 'vitest';
import {
  claimDemoCardUpgradeReward,
  normalizeDemoCardUpgradeProgressionState,
  pendingDemoCardUpgradeReward,
} from './DemoCardUpgradeRewardState';

describe('Demo card upgrade reward state', () => {
  it('normalizes a fresh state', () => {
    expect(normalizeDemoCardUpgradeProgressionState()).toEqual({
      ownedUpgradeIds: [],
      claimedMilestones: [],
    });
  });

  it('offers all five families at the first milestone', () => {
    const state = normalizeDemoCardUpgradeProgressionState();
    expect(pendingDemoCardUpgradeReward('battle-1', state)).toEqual({
      encounterId: 'battle-1',
      milestone: 'after-battle-1',
      choices: ['quick-v1', 'heavy-v1', 'guard-v1', 'disruption-v1', 'break-v1'],
    });
  });

  it('does not create rewards for non-milestone encounters', () => {
    const state = normalizeDemoCardUpgradeProgressionState();
    expect(pendingDemoCardUpgradeReward('battle-2-upper', state)).toBeUndefined();
    expect(pendingDemoCardUpgradeReward('boss-1', state)).toBeUndefined();
  });

  it('claims exactly one offered upgrade and marks the milestone', () => {
    const state = normalizeDemoCardUpgradeProgressionState();
    const reward = pendingDemoCardUpgradeReward('battle-1', state)!;
    expect(claimDemoCardUpgradeReward(state, reward, 'quick-v1')).toEqual({
      ownedUpgradeIds: ['quick-v1'],
      claimedMilestones: ['after-battle-1'],
    });
    expect(state).toEqual({ ownedUpgradeIds: [], claimedMilestones: [] });
  });

  it('cannot reopen a claimed milestone by replaying the encounter', () => {
    const state = normalizeDemoCardUpgradeProgressionState({
      ownedUpgradeIds: ['quick-v1'],
      claimedMilestones: ['after-battle-1'],
    });
    expect(pendingDemoCardUpgradeReward('battle-1', state)).toBeUndefined();
  });

  it('treats both battle-3 branches as the same claim-once milestone', () => {
    const before = normalizeDemoCardUpgradeProgressionState({ ownedUpgradeIds: ['quick-v1'] });
    const reward = pendingDemoCardUpgradeReward('battle-3-upper', before)!;
    const after = claimDemoCardUpgradeReward(before, reward, 'heavy-v1');
    expect(after.claimedMilestones).toEqual(['after-battle-3']);
    expect(pendingDemoCardUpgradeReward('battle-3-lower', after)).toBeUndefined();
  });

  it('normalizes duplicates and rejects unknown ids', () => {
    expect(normalizeDemoCardUpgradeProgressionState({
      ownedUpgradeIds: ['quick-v1', 'quick-v1'],
      claimedMilestones: ['after-battle-1', 'after-battle-1'],
    })).toEqual({
      ownedUpgradeIds: ['quick-v1'],
      claimedMilestones: ['after-battle-1'],
    });
    expect(() => normalizeDemoCardUpgradeProgressionState({ ownedUpgradeIds: ['unknown'] }))
      .toThrow(/unknown demo card upgrade/);
    expect(() => normalizeDemoCardUpgradeProgressionState({ claimedMilestones: ['unknown'] }))
      .toThrow(/unknown demo upgrade milestone/);
  });

  it('rejects a selection that is already owned or not offered', () => {
    const state = normalizeDemoCardUpgradeProgressionState({ ownedUpgradeIds: ['quick-v1'] });
    const reward = pendingDemoCardUpgradeReward('elite-1', state)!;
    expect(() => claimDemoCardUpgradeReward(state, reward, 'quick-v1')).toThrow(/not offered/);
    expect(() => claimDemoCardUpgradeReward(state, reward, 'unknown')).toThrow(/not offered/);
  });
});
