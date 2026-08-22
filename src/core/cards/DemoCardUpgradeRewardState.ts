import {
  availableDemoCardUpgrades,
  demoUpgradeMilestoneForEncounter,
  normalizeDemoCardUpgradeIds,
  type DemoCardUpgradeId,
  type DemoUpgradeMilestone,
} from './DemoCardUpgradeProgression';

const MILESTONES: readonly DemoUpgradeMilestone[] = [
  'after-battle-1',
  'after-battle-3',
  'after-elite-1',
];

export interface DemoCardUpgradeProgressionState {
  ownedUpgradeIds: DemoCardUpgradeId[];
  claimedMilestones: DemoUpgradeMilestone[];
}

export interface PendingDemoCardUpgradeReward {
  encounterId: string;
  milestone: DemoUpgradeMilestone;
  choices: DemoCardUpgradeId[];
}

export function normalizeDemoCardUpgradeProgressionState(
  state?: {
    ownedUpgradeIds?: readonly string[];
    claimedMilestones?: readonly string[];
  },
): DemoCardUpgradeProgressionState {
  const ownedUpgradeIds = normalizeDemoCardUpgradeIds(state?.ownedUpgradeIds ?? []);
  const knownMilestones = new Set<DemoUpgradeMilestone>(MILESTONES);
  const claimedMilestones: DemoUpgradeMilestone[] = [];
  const seen = new Set<DemoUpgradeMilestone>();

  for (const milestone of state?.claimedMilestones ?? []) {
    if (!knownMilestones.has(milestone as DemoUpgradeMilestone)) {
      throw new Error(`unknown demo upgrade milestone: ${milestone}`);
    }
    const typed = milestone as DemoUpgradeMilestone;
    if (!seen.has(typed)) {
      seen.add(typed);
      claimedMilestones.push(typed);
    }
  }

  return { ownedUpgradeIds, claimedMilestones };
}

export function pendingDemoCardUpgradeReward(
  encounterId: string,
  state: DemoCardUpgradeProgressionState,
): PendingDemoCardUpgradeReward | undefined {
  const normalized = normalizeDemoCardUpgradeProgressionState(state);
  const milestone = demoUpgradeMilestoneForEncounter(encounterId);
  if (!milestone || normalized.claimedMilestones.includes(milestone)) return undefined;

  const choices = availableDemoCardUpgrades(normalized.ownedUpgradeIds);
  if (!choices.length) return undefined;

  return { encounterId, milestone, choices };
}

export function claimDemoCardUpgradeReward(
  state: DemoCardUpgradeProgressionState,
  reward: PendingDemoCardUpgradeReward,
  selectedUpgradeId: string,
): DemoCardUpgradeProgressionState {
  const normalized = normalizeDemoCardUpgradeProgressionState(state);
  const current = pendingDemoCardUpgradeReward(reward.encounterId, normalized);
  if (!current || current.milestone !== reward.milestone) {
    throw new Error(`demo upgrade reward is no longer claimable: ${reward.milestone}`);
  }
  if (!current.choices.includes(selectedUpgradeId as DemoCardUpgradeId)) {
    throw new Error(`demo upgrade is not offered: ${selectedUpgradeId}`);
  }

  return {
    ownedUpgradeIds: normalizeDemoCardUpgradeIds([
      ...normalized.ownedUpgradeIds,
      selectedUpgradeId,
    ]),
    claimedMilestones: [...normalized.claimedMilestones, current.milestone],
  };
}
