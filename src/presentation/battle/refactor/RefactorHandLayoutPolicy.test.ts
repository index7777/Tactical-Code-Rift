import { describe, expect, it } from 'vitest';
import { handLayoutMetrics, handLayoutState } from './RefactorHandLayoutPolicy';

describe('RefactorHandLayoutPolicy', () => {
  it('keeps half of the shared hand visible during ordinary player idle', () => {
    expect(handLayoutState('PLAYER_IDLE', false)).toBe('PEEK');
    const metrics = handLayoutMetrics('PLAYER_IDLE', false);
    expect(metrics.cardHeight).toBe(204);
    expect(720 - (metrics.cardY - metrics.cardHeight / 2)).toBe(102);
    expect(metrics.utilityHeight).toBe(116);
  });

  it('uses explicit focus, targeting, and dispatch interaction states', () => {
    expect(handLayoutState('CARD_SELECTED', false)).toBe('FOCUS');
    expect(handLayoutState('TARGET_PREVIEW', false)).toBe('TARGETING');
    expect(handLayoutState('PLAYER_IDLE', true)).toBe('DISPATCH');
    expect(handLayoutState('ENEMY_EXECUTING', false)).toBe('HIDDEN');
    const metrics = handLayoutMetrics('TARGET_PREVIEW', false);
    expect(metrics.cardHeight).toBe(204);
    expect(metrics.utilityHeight).toBe(132);
  });

  it('reserves the full focused card while parking the rest below the battlefield', () => {
    const metrics = handLayoutMetrics('TARGET_PREVIEW', false);
    expect(metrics.previewY).toBeLessThan(metrics.cardY - metrics.cardHeight / 2);
    expect(metrics.utilityX + metrics.utilityWidth / 2).toBeLessThanOrEqual(1280);
    expect(metrics.cardY - metrics.cardHeight / 2).toBeGreaterThanOrEqual(668);
  });
});
