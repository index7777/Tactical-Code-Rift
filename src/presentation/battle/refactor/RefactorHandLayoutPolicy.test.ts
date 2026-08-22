import { describe, expect, it } from 'vitest';
import { handLayoutMetrics, handLayoutState } from './RefactorHandLayoutPolicy';

describe('RefactorHandLayoutPolicy', () => {
  it('keeps the shared hand collapsed during ordinary player idle', () => {
    expect(handLayoutState('PLAYER_IDLE', false)).toBe('COLLAPSED');
    const metrics = handLayoutMetrics('PLAYER_IDLE', false);
    expect(metrics.cardHeight).toBe(116);
    expect(metrics.utilityHeight).toBe(116);
  });

  it('expands the card master for selected/preview and dispatch interactions', () => {
    expect(handLayoutState('CARD_SELECTED', false)).toBe('EXPANDED');
    expect(handLayoutState('TARGET_PREVIEW', false)).toBe('EXPANDED');
    expect(handLayoutState('PLAYER_IDLE', true)).toBe('EXPANDED');
    const metrics = handLayoutMetrics('TARGET_PREVIEW', false);
    expect(metrics.cardHeight).toBe(150);
    expect(metrics.utilityHeight).toBe(150);
  });

  it('keeps the expanded card master and utility panel inside the logical stage', () => {
    const metrics = handLayoutMetrics('TARGET_PREVIEW', false);
    expect(metrics.cardY + metrics.cardHeight / 2).toBeLessThanOrEqual(720);
    expect(metrics.previewY).toBeLessThan(metrics.cardY - metrics.cardHeight / 2);
    expect(metrics.utilityX + metrics.utilityWidth / 2).toBeLessThanOrEqual(1280);
  });
});
