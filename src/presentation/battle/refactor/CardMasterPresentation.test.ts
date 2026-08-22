import { describe, expect, it } from 'vitest';
import { cardEffectLines, cardFamilyStyle, cardSelectionPresentation } from './CardMasterPresentation';

describe('CardMasterPresentation', () => {
  it('assigns a distinct stable style to every refactor card family', () => {
    const categories = ['quick', 'heavy', 'guard', 'disruption', 'break'] as const;
    const styles = categories.map(cardFamilyStyle);
    expect(new Set(styles.map((style) => style.stroke)).size).toBe(categories.length);
    expect(styles.map((style) => style.label)).toEqual(['迅擊', '重擊', '守勢', '干擾', '破勢']);
  });

  it('summarizes player-facing effects without reproducing target-rule enums', () => {
    expect(cardEffectLines({ damage: 8 })).toEqual(['傷害 8']);
    expect(cardEffectLines({ delayTarget: 2 })).toEqual(['延後目標 2']);
    expect(cardEffectLines({ guardRatio: 0.5, guardCap: 8 })).toEqual(['下次直接傷害 -50%（上限 8）']);
    expect(cardEffectLines({ interrupt: true })).toEqual(['打斷敵方意圖']);
    expect(cardEffectLines({ damage: 5, createBreakWindow: 'armor-break' })).toEqual(['傷害 5', '建立破甲窗口']);
    expect(cardEffectLines({ createBreakWindow: 'imbalance' })).toEqual(['建立失衡窗口']);
  });

  it('keeps skill selection visually stronger than dispatch selection', () => {
    const selected = cardSelectionPresentation(true, false, true);
    const dispatch = cardSelectionPresentation(false, true, false);
    const passive = cardSelectionPresentation(false, false, true);
    expect(selected.yOffset).toBeLessThan(dispatch.yOffset);
    expect(selected.scale).toBeGreaterThan(dispatch.scale);
    expect(selected.strokeWidth).toBeGreaterThan(dispatch.strokeWidth);
    expect(passive.alpha).toBeLessThan(dispatch.alpha);
  });
});
