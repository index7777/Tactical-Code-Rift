import type { RefactorCardCategory, RefactorCardEffect } from '../../../core/cards/RefactorCardTypes';
import { cardFamilyAssetSlot } from './CardFamilyAssetPolicy';

export interface CardFamilyStyle {
  label: string;
  fill: number;
  stroke: number;
  accent: number;
  text: string;
  textureKey: string;
}

export interface CardSelectionPresentation {
  yOffset: number;
  scale: number;
  alpha: number;
  strokeWidth: number;
  glowAlpha: number;
}

const FAMILY_STYLES: Readonly<Record<RefactorCardCategory, Omit<CardFamilyStyle, 'textureKey'>>> = {
  quick: { label: '迅擊', fill: 0x102735, stroke: 0x5ca7c8, accent: 0x8bd7f0, text: '#cdebf4' },
  heavy: { label: '重擊', fill: 0x321719, stroke: 0xb85b4d, accent: 0xef7a63, text: '#f4d4cf' },
  guard: { label: '守勢', fill: 0x112d2a, stroke: 0x5ba99b, accent: 0x83d5c5, text: '#d0eee8' },
  disruption: { label: '干擾', fill: 0x241632, stroke: 0x9165c4, accent: 0xc392f2, text: '#eadcf8' },
  break: { label: '破勢', fill: 0x302513, stroke: 0xc18a3d, accent: 0xe6b65d, text: '#f5e3bd' },
};

export function cardFamilyStyle(category: RefactorCardCategory): CardFamilyStyle {
  return {
    ...FAMILY_STYLES[category],
    textureKey: cardFamilyAssetSlot(category).textureKey,
  };
}

export function cardEffectLines(effect: RefactorCardEffect): string[] {
  const lines: string[] = [];
  if (effect.damage !== undefined) lines.push(`傷害 ${effect.damage}`);
  if (effect.delayTarget !== undefined) lines.push(`延後目標 ${effect.delayTarget}`);
  if (effect.guardRatio !== undefined) {
    const percent = Math.round(effect.guardRatio * 100);
    lines.push(`下次直接傷害 -${percent}%${effect.guardCap !== undefined ? `（上限 ${effect.guardCap}）` : ''}`);
  }
  if (effect.interrupt) lines.push('打斷敵方意圖');
  if (effect.createBreakWindow === 'armor-break') lines.push('建立破甲窗口');
  if (effect.createBreakWindow === 'imbalance') lines.push('建立失衡窗口');
  return lines.slice(0, 2);
}

export function cardSelectionPresentation(
  selected: boolean,
  dispatchSelected: boolean,
  anotherSkillSelected: boolean,
): CardSelectionPresentation {
  if (selected) {
    return { yOffset: -14, scale: 1.06, alpha: 1, strokeWidth: 3, glowAlpha: 0.95 };
  }
  if (dispatchSelected) {
    return { yOffset: -6, scale: 1.02, alpha: 1, strokeWidth: 2, glowAlpha: 0.8 };
  }
  return {
    yOffset: 0,
    scale: 1,
    alpha: anotherSkillSelected ? 0.68 : 0.92,
    strokeWidth: 1,
    glowAlpha: 0.42,
  };
}
