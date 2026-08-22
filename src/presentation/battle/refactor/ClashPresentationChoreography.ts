import type { ClashOutcome } from '../../../core/clash/ClashResolver';

export const CLASH_HIT_STOP_MS = 70;
export const CLASH_RESULT_HOLD_MS = 110;

export interface ClashResultDisplacement {
  player: number;
  enemy: number;
}

export interface ClashPresentationTiming {
  approachMs: number;
  anticipationMs: number;
  strikeMs: number;
  hitStopMs: number;
  resultHoldMs: number;
  recoveryMs: number;
  returnMs: number;
}

export function clashResultDisplacement(outcome: ClashOutcome): ClashResultDisplacement {
  switch (outcome) {
    case 'player-win':
      return { player: 18, enemy: 62 };
    case 'draw':
      return { player: 34, enemy: 34 };
    case 'enemy-win':
      return { player: 62, enemy: 18 };
  }
}

export function clashPresentationTiming(
  player: {
    anticipationMs: number;
    approachMs: number;
    strikeMs: number;
    recoveryMs: number;
    returnMs: number;
  },
  enemy: {
    anticipationMs: number;
    approachMs: number;
    strikeMs: number;
    recoveryMs: number;
    returnMs: number;
  },
): ClashPresentationTiming {
  return {
    anticipationMs: Math.max(player.anticipationMs, enemy.anticipationMs),
    approachMs: Math.max(player.approachMs, enemy.approachMs),
    strikeMs: Math.max(player.strikeMs, enemy.strikeMs),
    hitStopMs: CLASH_HIT_STOP_MS,
    resultHoldMs: CLASH_RESULT_HOLD_MS,
    recoveryMs: Math.max(player.recoveryMs, enemy.recoveryMs),
    returnMs: Math.max(player.returnMs, enemy.returnMs),
  };
}
