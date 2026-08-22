import { describe, expect, it } from 'vitest';
import { demoUpgradeRewardOptionViews } from './DemoUpgradeRewardPresentation';

describe('demo upgrade reward presentation', () => {
  it('maps all five bounded family upgrades to exact player-facing effects', () => {
    expect(demoUpgradeRewardOptionViews([
      'quick-v1',
      'heavy-v1',
      'guard-v1',
      'disruption-v1',
      'break-v1',
    ])).toEqual([
      { id: 'quick-v1', familyLabel: '迅式', effectLabel: '快攻傷害 +2' },
      { id: 'heavy-v1', familyLabel: '重式', effectLabel: '重擊傷害 +3' },
      { id: 'guard-v1', familyLabel: '守式', effectLabel: '守勢上限 +3' },
      { id: 'disruption-v1', familyLabel: '擾式', effectLabel: '行動 Delay -1' },
      { id: 'break-v1', familyLabel: '破式', effectLabel: '行動 Delay -1' },
    ]);
  });

  it('returns detached option objects', () => {
    const [option] = demoUpgradeRewardOptionViews(['quick-v1']);
    option.familyLabel = 'changed';
    expect(demoUpgradeRewardOptionViews(['quick-v1'])[0].familyLabel).toBe('迅式');
  });
});
