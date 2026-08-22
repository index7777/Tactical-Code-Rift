import type { RefactorCardCategory, RefactorCardDefinition } from './RefactorCardTypes';

export type DemoCardUpgradeId =
  | 'quick-v1'
  | 'heavy-v1'
  | 'guard-v1'
  | 'disruption-v1'
  | 'break-v1';

export type DemoUpgradeMilestone = 'after-battle-1' | 'after-battle-3' | 'after-elite-1';

const UPGRADE_IDS: readonly DemoCardUpgradeId[] = [
  'quick-v1',
  'heavy-v1',
  'guard-v1',
  'disruption-v1',
  'break-v1',
];

const CATEGORY_UPGRADE: Readonly<Record<RefactorCardCategory, DemoCardUpgradeId>> = {
  quick: 'quick-v1',
  heavy: 'heavy-v1',
  guard: 'guard-v1',
  disruption: 'disruption-v1',
  break: 'break-v1',
};

const MILESTONE_BY_ENCOUNTER: Readonly<Record<string, DemoUpgradeMilestone | undefined>> = {
  'battle-1': 'after-battle-1',
  'battle-3-upper': 'after-battle-3',
  'battle-3-lower': 'after-battle-3',
  'elite-1': 'after-elite-1',
};

export function demoUpgradeMilestoneForEncounter(encounterId: string): DemoUpgradeMilestone | undefined {
  return MILESTONE_BY_ENCOUNTER[encounterId];
}

export function normalizeDemoCardUpgradeIds(ids: readonly string[]): DemoCardUpgradeId[] {
  const known = new Set<DemoCardUpgradeId>(UPGRADE_IDS);
  const result: DemoCardUpgradeId[] = [];
  const seen = new Set<DemoCardUpgradeId>();
  for (const id of ids) {
    if (!known.has(id as DemoCardUpgradeId)) throw new Error(`unknown demo card upgrade: ${id}`);
    const typed = id as DemoCardUpgradeId;
    if (!seen.has(typed)) {
      seen.add(typed);
      result.push(typed);
    }
  }
  return result;
}

export function availableDemoCardUpgrades(ownedIds: readonly string[]): DemoCardUpgradeId[] {
  const owned = new Set(normalizeDemoCardUpgradeIds(ownedIds));
  return UPGRADE_IDS.filter((id) => !owned.has(id));
}

export function applyDemoCardUpgrades(
  definitions: readonly RefactorCardDefinition[],
  ownedIds: readonly string[],
): RefactorCardDefinition[] {
  const owned = new Set(normalizeDemoCardUpgradeIds(ownedIds));
  return definitions.map((definition) => {
    const upgraded = owned.has(CATEGORY_UPGRADE[definition.category]);
    const effect = { ...definition.effect };
    if (upgraded) {
      if (definition.category === 'quick' && effect.damage !== undefined) effect.damage += 2;
      if (definition.category === 'heavy' && effect.damage !== undefined) effect.damage += 3;
      if (definition.category === 'guard' && effect.guardCap !== undefined) effect.guardCap += 3;
    }
    const delay = upgraded && (definition.category === 'disruption' || definition.category === 'break')
      ? Math.max(0, definition.delay - 1)
      : definition.delay;
    return { ...definition, delay, effect };
  });
}
