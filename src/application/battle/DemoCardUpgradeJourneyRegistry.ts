import {
  chooseDemoUpgradeReward,
  createDemoCardUpgradeRunState,
  demoOwnedUpgradeIds,
  normalizeDemoCardUpgradeRunState,
  offerDemoUpgradeRewardAfterVictory,
  type DemoCardUpgradeRunState,
} from '../../core/cards/DemoCardUpgradeRunState';
import { prepareDemoCardUpgradeEncounterHandoff } from './DemoCardUpgradeEncounterHandoff';

export const DEMO_CARD_UPGRADE_RUN_STATE_KEY = 'journey-demo-card-upgrade-run-state';

export interface DemoCardUpgradeRegistryPort {
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
}

function stateFromStored(value: unknown): DemoCardUpgradeRunState {
  if (value === undefined || value === null) return createDemoCardUpgradeRunState();
  if (typeof value !== 'object') throw new Error('demo card upgrade run state must be an object');
  return normalizeDemoCardUpgradeRunState(value as DemoCardUpgradeRunState);
}

export function readDemoCardUpgradeRunState(
  registry: DemoCardUpgradeRegistryPort,
): DemoCardUpgradeRunState {
  return stateFromStored(registry.get(DEMO_CARD_UPGRADE_RUN_STATE_KEY));
}

export function writeDemoCardUpgradeRunState(
  registry: DemoCardUpgradeRegistryPort,
  state: DemoCardUpgradeRunState,
): DemoCardUpgradeRunState {
  const normalized = normalizeDemoCardUpgradeRunState(state);
  const detached = {
    ownedUpgradeIds: [...normalized.ownedUpgradeIds],
    claimedMilestones: [...normalized.claimedMilestones],
    pendingMilestone: normalized.pendingMilestone,
  };
  registry.set(DEMO_CARD_UPGRADE_RUN_STATE_KEY, detached);
  return {
    ownedUpgradeIds: [...detached.ownedUpgradeIds],
    claimedMilestones: [...detached.claimedMilestones],
    pendingMilestone: detached.pendingMilestone,
  };
}

export function ensureDemoCardUpgradeRunState(
  registry: DemoCardUpgradeRegistryPort,
): DemoCardUpgradeRunState {
  return writeDemoCardUpgradeRunState(registry, readDemoCardUpgradeRunState(registry));
}

export function offerJourneyDemoUpgradeRewardAfterVictory(
  registry: DemoCardUpgradeRegistryPort,
  encounterId: string,
): DemoCardUpgradeRunState {
  const next = offerDemoUpgradeRewardAfterVictory(readDemoCardUpgradeRunState(registry), encounterId);
  return writeDemoCardUpgradeRunState(registry, next);
}

export function chooseJourneyDemoUpgradeReward(
  registry: DemoCardUpgradeRegistryPort,
  upgradeId: string,
): DemoCardUpgradeRunState {
  const next = chooseDemoUpgradeReward(readDemoCardUpgradeRunState(registry), upgradeId);
  return writeDemoCardUpgradeRunState(registry, next);
}

export function prepareJourneyDemoUpgradeEncounterHandoff(
  registry: DemoCardUpgradeRegistryPort,
): void {
  prepareDemoCardUpgradeEncounterHandoff(demoOwnedUpgradeIds(readDemoCardUpgradeRunState(registry)));
}
