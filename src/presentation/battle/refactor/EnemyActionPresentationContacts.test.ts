import { describe, expect, it } from 'vitest';
import { enemyVisualContactSchedule } from './EnemyActionPresentationContacts';

describe('enemyVisualContactSchedule', () => {
  it('keeps a single-hit action at one authoritative contact', () => {
    expect(enemyVisualContactSchedule(1, 240)).toEqual({
      primaryOffsetMs: 0,
      additionalOffsetsMs: [],
    });
  });

  it('places the second visual contact deterministically inside the impact/recovery window', () => {
    expect(enemyVisualContactSchedule(2, 240)).toEqual({
      primaryOffsetMs: 0,
      additionalOffsetsMs: [120],
    });
  });

  it('distributes additional contacts without scheduling another primary impact', () => {
    expect(enemyVisualContactSchedule(4, 320)).toEqual({
      primaryOffsetMs: 0,
      additionalOffsetsMs: [80, 160, 240],
    });
  });

  it('keeps repeated contacts at a positive offset even when the available window is zero', () => {
    expect(enemyVisualContactSchedule(2, 0)).toEqual({
      primaryOffsetMs: 0,
      additionalOffsetsMs: [1],
    });
  });

  it('rejects invalid hit counts and timing windows', () => {
    expect(() => enemyVisualContactSchedule(0, 120)).toThrow(/positive integer/);
    expect(() => enemyVisualContactSchedule(2, -1)).toThrow(/non-negative integer/);
  });
});
