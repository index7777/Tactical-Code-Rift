import { describe, expect, it } from 'vitest';
import { cardContentLayout } from './CardContentLayout';

describe('cardContentLayout', () => {
  it('keeps title, art, effect, and footer in distinct vertical slots', () => {
    const layout = cardContentLayout(640, 500, 204, 306);
    expect(layout.title.y).toBeLessThan(layout.art.y - layout.art.height / 2);
    expect(layout.art.y + layout.art.height / 2).toBeLessThan(layout.effect.firstLineY);
    expect(layout.effect.firstLineY + layout.effect.lineGap).toBeLessThan(layout.footer.y - layout.footer.height / 2);
  });

  it('scales every slot from the same card rectangle', () => {
    const idle = cardContentLayout(248, 720, 136, 204);
    const focus = cardContentLayout(640, 500, 204, 306);
    expect(focus.art.width / idle.art.width).toBeCloseTo(1.5, 6);
    expect(focus.effect.maxWidth / idle.effect.maxWidth).toBeCloseTo(1.5, 6);
    expect(focus.footer.height / idle.footer.height).toBeCloseTo(1.5, 6);
  });
});
