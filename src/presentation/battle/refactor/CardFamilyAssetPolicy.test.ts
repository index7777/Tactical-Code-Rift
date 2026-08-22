import { describe, expect, it } from 'vitest';
import {
  CARD_FAMILY_CATEGORIES,
  cardFamilyAssetSlot,
  cardFamilyAssetSlots,
} from './CardFamilyAssetPolicy';

describe('CardFamilyAssetPolicy', () => {
  it('maps every refactor card family to exactly one reusable shared visual', () => {
    const slots = cardFamilyAssetSlots();
    expect(slots).toHaveLength(5);
    expect(slots.map((slot) => slot.category)).toEqual(CARD_FAMILY_CATEGORIES);
    expect(new Set(slots.map((slot) => slot.textureKey)).size).toBe(5);
  });

  it('reuses the existing family art without character or state variants', () => {
    const slots = cardFamilyAssetSlots();
    expect(slots.map((slot) => slot.path)).toEqual([
      'assets/battle/cards/art/quick.svg',
      'assets/battle/cards/art/heavy.svg',
      'assets/battle/cards/art/guard.svg',
      'assets/battle/cards/art/delay.svg',
      'assets/battle/cards/art/break.svg',
    ]);

    for (const slot of slots) {
      expect(slot.reuseStatus).toBe('REUSE');
      expect(slot.path).not.toMatch(/rin|chikage|oboro|mo/);
      expect(slot.path).not.toMatch(/selected|disabled|hover|active/);
    }
  });

  it('keeps disruption mapped to the shared delay/control visual', () => {
    expect(cardFamilyAssetSlot('disruption')).toMatchObject({
      textureKey: 'refactor-card-family-disruption',
      path: 'assets/battle/cards/art/delay.svg',
    });
  });
});
