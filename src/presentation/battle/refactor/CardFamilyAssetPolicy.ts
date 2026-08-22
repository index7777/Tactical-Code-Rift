import type { RefactorCardCategory } from '../../../core/cards/RefactorCardTypes';

export interface CardFamilyAssetSlot {
  category: RefactorCardCategory;
  textureKey: string;
  path: string;
  reuseStatus: 'REUSE';
}

const CARD_FAMILY_ASSET_SLOTS: Readonly<Record<RefactorCardCategory, CardFamilyAssetSlot>> = {
  quick: {
    category: 'quick',
    textureKey: 'refactor-card-family-quick',
    path: 'assets/battle/cards/art/quick.svg',
    reuseStatus: 'REUSE',
  },
  heavy: {
    category: 'heavy',
    textureKey: 'refactor-card-family-heavy',
    path: 'assets/battle/cards/art/heavy.svg',
    reuseStatus: 'REUSE',
  },
  guard: {
    category: 'guard',
    textureKey: 'refactor-card-family-guard',
    path: 'assets/battle/cards/art/guard.svg',
    reuseStatus: 'REUSE',
  },
  disruption: {
    category: 'disruption',
    textureKey: 'refactor-card-family-disruption',
    path: 'assets/battle/cards/art/delay.svg',
    reuseStatus: 'REUSE',
  },
  break: {
    category: 'break',
    textureKey: 'refactor-card-family-break',
    path: 'assets/battle/cards/art/break.svg',
    reuseStatus: 'REUSE',
  },
};

export const CARD_FAMILY_CATEGORIES: readonly RefactorCardCategory[] = [
  'quick',
  'heavy',
  'guard',
  'disruption',
  'break',
];

export function cardFamilyAssetSlot(category: RefactorCardCategory): CardFamilyAssetSlot {
  return { ...CARD_FAMILY_ASSET_SLOTS[category] };
}

export function cardFamilyAssetSlots(): CardFamilyAssetSlot[] {
  return CARD_FAMILY_CATEGORIES.map(cardFamilyAssetSlot);
}
