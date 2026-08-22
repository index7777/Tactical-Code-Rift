import {
  normalizeDemoCardUpgradeIds,
  type DemoCardUpgradeId,
} from '../../core/cards/DemoCardUpgradeProgression';

let preparedUpgradeIds: DemoCardUpgradeId[] = [];

export function prepareDemoCardUpgradeEncounterHandoff(ids: readonly string[]): void {
  preparedUpgradeIds = normalizeDemoCardUpgradeIds(ids);
}

export function consumeDemoCardUpgradeEncounterHandoff(): DemoCardUpgradeId[] {
  return [...preparedUpgradeIds];
}

export function clearDemoCardUpgradeEncounterHandoff(): void {
  preparedUpgradeIds = [];
}
