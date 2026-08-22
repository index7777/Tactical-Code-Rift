import { describe, expect, it } from 'vitest';
import { handLayoutMetrics, handLayoutState } from './RefactorHandLayoutPolicy';

describe('RefactorHandLayoutPolicy', () => {
  it('keeps the shared hand collapsed during ordinary player idle', () => {
    expect(handLayoutState('PLAYER_IDLE', false)).toBe('COLLAPSED');
    expect(handLayoutMetrics('PLAYER_IDLE', false).cardHeight).toBe(82);
  });

  it('expands for selected/preview and dispatch interactions', () => {
    expect(handLayoutState('CARD_SELECTED', false)).toBe('EXPANDED');
    expect(handLayoutState('TARGET_PREVIEW', false)).toBe('EXPANDED');
    expect(handLayoutState('PLAYER_IDLE', true)).toBe('EXPANDED');
    expect(handLayoutMetrics('TARGET_PREVIEW', false).cardHeight).toBe(116);
  });

  it('keeps the expanded cards inside the 720px logical stage', () => {
    const metrics = handLayoutMetrics('TARGET_PREVIEW', false);
    expect(metrics.cardY + metrics.cardHeight / 2).toBeLessThanOrEqual(720);
    expect(metrics.previewY).toBeLessThan(metrics.cardY - metrics.cardHeight / 2);
  });
});
