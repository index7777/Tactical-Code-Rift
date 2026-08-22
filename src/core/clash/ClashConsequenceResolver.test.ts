import { describe, expect, it } from 'vitest';
import { clashConsequenceFromResolution } from './ClashConsequenceResolver';
import type { ClashResolution } from './ClashResolver';

function eligible(outcome: 'player-win' | 'draw' | 'enemy-win'): ClashResolution {
  return {
    eligible: true,
    playerScore: { base: 5, timing: 0, specialization: 0, state: 0, total: 5 },
    enemyScore: { base: 5, timing: 0, specialization: 0, state: 0, total: 5 },
    outcome,
  };
}

describe('ClashConsequenceResolver', () => {
  it('maps player win to full player effect and cancelled enemy intent', () => {
    expect(clashConsequenceFromResolution(eligible('player-win'))).toEqual({
      outcome: 'player-win',
      playerEffectMode: 'full',
      enemyIntentMode: 'cancel',
    });
  });

  it('maps draw to half player effect and half enemy intent', () => {
    expect(clashConsequenceFromResolution(eligible('draw'))).toEqual({
      outcome: 'draw',
      playerEffectMode: 'half',
      enemyIntentMode: 'half',
    });
  });

  it('maps enemy win to no player effect and full enemy intent', () => {
    expect(clashConsequenceFromResolution(eligible('enemy-win'))).toEqual({
      outcome: 'enemy-win',
      playerEffectMode: 'none',
      enemyIntentMode: 'full',
    });
  });

  it('returns no consequence when Clash is unavailable', () => {
    expect(clashConsequenceFromResolution({
      eligible: false,
      reason: 'player-clash-disabled',
    })).toBeUndefined();
  });

  it('returns a detached consequence object', () => {
    const first = clashConsequenceFromResolution(eligible('draw'))!;
    first.playerEffectMode = 'none';
    expect(clashConsequenceFromResolution(eligible('draw'))).toEqual({
      outcome: 'draw',
      playerEffectMode: 'half',
      enemyIntentMode: 'half',
    });
  });
});
