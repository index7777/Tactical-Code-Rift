import type {
  RefactorCardCategory,
  RefactorCardDefinition,
} from '../cards/RefactorCardTypes';

export type CardFamilyUpgradeId =
  | 'quick-v1'
  | 'heavy-v1'
  | 'guard-v1'
  | 'disruption-v1'
  | 'break-v1';

export type CardUpgradeRewardMilestone = 1 | 2 | 3;

const UPGRADE_ID_BY_FAMILY: Readonly<Record<RefactorCardCategory, CardFamilyUpgradeId>> = {
  quick: 'quick-v1',
  heavy: 'heavy-v1',
  guard: 'guard-v1',
  disruption: 'disruption-v1',
  break: 'break-v1',
};

const VALID_UPGRADE_IDS: ReadonlySet<string> = new Set(Object.values(UPGRADE_ID_BY_FAMILY));

const REWARD_MILESTONE_BY_ENCOUNTER: Readonly<Record<string, CardUpgradeRewardMilestone>> = {
  'battle-1': 1,
  'battle-3-upper': 2,
  'battle-3-lower': 2,
  'elite-1': 3,
};

export function cardUpgradeRewardMilestone(
  completedEncounterId: string,
): CardUpgradeRewardMilestone | undefined {
  return REWARD_MILESTONE_BY_ENCOUNTER[completedEncounterId];
}

export function normalizeOwnedCardUpgradeIds(
  upgradeIds: readonly string[],
): CardFamilyUpgradeId[] {
  const result: CardFamilyUpgradeId[] = [];
  const seen = new Set<CardFamilyUpgradeId>();

  for (const upgradeId of upgradeIds) {
    if (!VALID_UPGRADE_IDS.has(upgradeId)) {
      throw new Error(`unknown card family upgrade id: ${upgradeId}`);
    }
    const typedId = upgradeId as CardFamilyUpgradeId;
    if (seen.has(typedId)) continue;
    seen.add(typedId);
    result.push(typedId);
  }

  return result;
}

function cloneDefinition(definition: RefactorCardDefinition): RefactorCardDefinition {
  return {
    ...definition,
    effect: { ...definition.effect },
  };
}

export function applyCardFamilyUpgrades(
  definitions: readonly RefactorCardDefinition[],
  ownedUpgradeIds: readonly string[],
): RefactorCardDefinition[] {
  const owned = new Set(normalizeOwnedCardUpgradeIds(ownedUpgradeIds));

  return definitions.map((definition) => {
    const upgraded = cloneDefinition(definition);
    if (!owned.has(UPGRADE_ID_BY_FAMILY[definition.category])) return upgraded;

    switch (definition.category) {
      case 'quick':
        if (upgraded.effect.damage !== undefined) upgraded.effect.damage += 2;
        break;
      case 'heavy':
        if (upgraded.effect.damage !== undefined) upgraded.effect.damage += 3;
        break;
      case 'guard':
        if (upgraded.effect.guardCap !== undefined) upgraded.effect.guardCap += 3;
        break;
      case 'disruption':
      case 'break':
        upgraded.delay = Math.max(0, upgraded.delay - 1);
        break;
    }

    return upgraded;
  });
}
