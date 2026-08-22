import { describe, expect, it } from 'vitest';
import { refactorViewportScaleMode } from './RefactorBattleViewportPolicy';

describe('RefactorBattleViewportPolicy', () => {
  it('covers 16:9 and current desktop-like landscape viewports', () => {
    expect(refactorViewportScaleMode(1280, 720)).toBe('COVER');
    expect(refactorViewportScaleMode(1679, 895)).toBe('COVER');
  });

  it('keeps FIT for ultra-wide or portrait-risk viewports', () => {
    expect(refactorViewportScaleMode(844, 390)).toBe('FIT');
    expect(refactorViewportScaleMode(720, 1280)).toBe('FIT');
    expect(refactorViewportScaleMode(0, 720)).toBe('FIT');
  });
});
