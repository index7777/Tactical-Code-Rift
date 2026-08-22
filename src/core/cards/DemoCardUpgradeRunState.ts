import {
  availableDemoCardUpgrades,
  demoUpgradeMilestoneForEncounter,
  normalizeDemoCardUpgradeIds,
  type DemoCardUpgradeId,
  type DemoUpgradeMilestone,
} from './DemoCardUpgradeProgression';

export interface DemoCardUpgradeRunState {
  ownedUpgradeIds: DemoCardUpgradeId[];
  claimedMilestones: DemoUpgradeMilestone[];
  pendingMilestone?: DemoUpgradeMilestone;
}

const MILESTONES: readonly DemoUpgradeMilestone[] = [
  'after-battle-1',
  'after-battle-3',
  'after-elite-1',
];

function cloneState(state: DemoCardUpgradeRunState): DemoCardUpgradeRunState {
  return {
    ownedUpgradeIds: [...state.ownedUpgradeIds],
    claimedMilestones: [...state.claimedMilestones],
    pendingMilestone: state.pendingMilestone,
  };
}

function normalizeMilestones(values: readonly DemoUpgradeMilestone[]): DemoUpgradeMilestone[] {
  const known = new Set(MILESTONES);
  const result: DemoUpgradeMilestone[] = [];
  for (const milestone of values) {
    if (!known.has(milestone)) throw new Error(`unknown demo upgrade milestone: ${milestone}`);
    if (!result.includes(milestone)) result.push(milestone);
  }
  return result;
}

export function createDemoCardUpgradeRunState(): DemoCardUpgradeRunState {
  return { ownedUpgradeIds: [], claimedMilestones: [] };
}

export function normalizeDemoCardUpgradeRunState(
  state: DemoCardUpgradeRunState,
): DemoCardUpgradeRunState {
  const ownedUpgradeIds = normalizeDemoCardUpgradeIds(state.ownedUpgradeIds);
  const claimedMilestones = normalizeMilestones(state.claimedMilestones);
  if (state.pendingMilestone && !MILESTONES.includes(state.pendingMilestone)) {
    throw new Error(`unknown demo upgrade milestone: ${state.pendingMilestone}`);
  }
  if (state.pendingMilestone && claimedMilestones.includes(state.pendingMilestone)) {
    throw new Error(`demo upgrade milestone already claimed: ${state.pendingMilestone}`);
  }
  return { ownedUpgradeIds, claimedMilestones, pendingMilestone: state.pendingMilestone };
}

export function offerDemoUpgradeRewardAfterVictory(
  state: DemoCardUpgradeRunState,
  encounterId: string,
): DemoCardUpgradeRunState {
  const normalized = normalizeDemoCardUpgradeRunState(state);
  const milestone = demoUpgradeMilestoneForEncounter(encounterId);
  if (!milestone) return cloneState(normalized);
  if (normalized.pendingMilestone) {
    if (normalized.pendingMilestone === milestone) return cloneState(normalized);
    throw new Error(`demo upgrade reward already pending: ${normalized.pendingMilestone}`);
  }
  if (normalized.claimedMilestones.includes(milestone)) return cloneState(normalized);
  if (availableDemoCardUpgrades(normalized.ownedUpgradeIds).length === 0) return cloneState(normalized);
  return { ...cloneState(normalized), pendingMilestone: milestone };
}

export function chooseDemoUpgradeReward(
  state: DemoCardUpgradeRunState,
  upgradeId: string,
): DemoCardUpgradeRunState {
  const normalized = normalizeDemoCardUpgradeRunState(state);
  const pending = normalized.pendingMilestone;
  if (!pending) throw new Error('no demo upgrade reward is pending');
  const [selected] = normalizeDemoCardUpgradeIds([upgradeId]);
  if (!availableDemoCardUpgrades(normalized.ownedUpgradeIds).includes(selected)) {
    throw new Error(`demo card upgrade already owned: ${selected}`);
  }
  return {
    ownedUpgradeIds: [...normalized.ownedUpgradeIds, selected],
    claimedMilestones: [...normalized.claimedMilestones, pending],
  };
}

export function demoOwnedUpgradeIds(state: DemoCardUpgradeRunState): DemoCardUpgradeId[] {
  return [...normalizeDemoCardUpgradeRunState(state).ownedUpgradeIds];
}
