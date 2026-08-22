import type { DemoCardUpgradeId } from '../../core/cards/DemoCardUpgradeProgression';

export interface DemoUpgradeRewardOptionView {
  id: DemoCardUpgradeId;
  familyLabel: string;
  effectLabel: string;
}

const UPGRADE_COPY: Readonly<Record<DemoCardUpgradeId, Omit<DemoUpgradeRewardOptionView, 'id'>>> = {
  'quick-v1': { familyLabel: '迅式', effectLabel: '快攻傷害 +2' },
  'heavy-v1': { familyLabel: '重式', effectLabel: '重擊傷害 +3' },
  'guard-v1': { familyLabel: '守式', effectLabel: '守勢上限 +3' },
  'disruption-v1': { familyLabel: '擾式', effectLabel: '行動 Delay -1' },
  'break-v1': { familyLabel: '破式', effectLabel: '行動 Delay -1' },
};

export function demoUpgradeRewardOptionView(id: DemoCardUpgradeId): DemoUpgradeRewardOptionView {
  return { id, ...UPGRADE_COPY[id] };
}

export function demoUpgradeRewardOptionViews(
  ids: readonly DemoCardUpgradeId[],
): DemoUpgradeRewardOptionView[] {
  return ids.map(demoUpgradeRewardOptionView);
}
