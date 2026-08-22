import { describe, expect, it } from 'vitest';
import {
  CLASH_HIT_STOP_MS,
  CLASH_RESULT_HOLD_MS,
  clashPresentationTiming,
  clashResultDisplacement,
} from './ClashPresentationChoreography';

describe('ClashPresentationChoreography', () => {
  it('uses the slower authored participant timings for synchronized phases', () => {
    expect(clashPresentationTiming(
      { anticipationMs: 70, approachMs: 95, strikeMs: 90, recoveryMs: 100, returnMs: 160 },
      { anticipationMs: 170, approachMs: 150, strikeMs: 130, recoveryMs: 200, returnMs: 240 },
    )).toEqual({
      anticipationMs: 170,
      approachMs: 150,
      strikeMs: 130,
      hitStopMs: CLASH_HIT_STOP_MS,
      resultHoldMs: CLASH_RESULT_HOLD_MS,
      recoveryMs: 200,
      returnMs: 240,
    });
  });

  it('gives the loser the larger recoil and keeps draw symmetric', () => {
    expect(clashResultDisplacement('player-win')).toEqual({ player: 18, enemy: 62 });
    expect(clashResultDisplacement('draw')).toEqual({ player: 34, enemy: 34 });
    expect(clashResultDisplacement('enemy-win')).toEqual({ player: 62, enemy: 18 });
  });
});
