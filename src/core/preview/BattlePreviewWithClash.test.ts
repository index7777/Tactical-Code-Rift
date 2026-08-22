import { describe, expect, it } from 'vitest';
import type { ClashResolution } from '../clash/ClashResolver';
import { resolveBattlePreview } from './BattlePreviewResolver';
import { resolveBattlePreviewWithClash, type BattlePreviewWithClashInput } from './BattlePreviewWithClash';

const baseInput: BattlePreviewWithClashInput = {
  activeActorId: 'rin',
  card: {
    instanceId: 'quick-1',
    definition: {
      id: 'quick-cut',
      name: '迅切',
      category: 'quick',
      delay: 3,
      targetRule: 'enemy',
      effect: { damage: 8 },
    },
  },
  target: { actorId: 'enemy', hp: 30, maxHp: 30 },
  timeline: {
    currentTime: 0,
    entries: [
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'enemy', team: 'enemy', nextActionAt: 5, tieBreaker: 1 },
    ],
  },
  breakWindows: [],
};

function eligible(outcome: 'player-win' | 'draw' | 'enemy-win'): ClashResolution {
  return {
    eligible: true,
    playerScore: { base: 6, timing: 1, specialization: 0, state: 0, total: 7 },
    enemyScore: { base: 6, timing: 0, specialization: 0, state: 0, total: 6 },
    outcome,
  };
}

describe('BattlePreviewWithClash', () => {
  it('preserves the existing preview when no Clash input is supplied', () => {
    expect(resolveBattlePreviewWithClash(baseInput)).toEqual(resolveBattlePreview(baseInput));
  });

  it('attaches eligible Clash resolution and shared consequence without altering battle math', () => {
    const result = resolveBattlePreviewWithClash({
      ...baseInput,
      clash: { resolution: eligible('player-win') },
    });
    const base = resolveBattlePreview(baseInput);

    expect({ ...result, clash: undefined }).toEqual({ ...base, clash: undefined });
    expect(result.clash).toEqual({
      resolution: eligible('player-win'),
      consequence: {
        outcome: 'player-win',
        playerEffectMode: 'full',
        enemyIntentMode: 'cancel',
      },
    });
  });

  it('keeps unavailable Clash visible but produces no consequence', () => {
    const result = resolveBattlePreviewWithClash({
      ...baseInput,
      clash: {
        resolution: { eligible: false, reason: 'tag-incompatible' },
      },
    });

    expect(result.clash).toEqual({
      resolution: { eligible: false, reason: 'tag-incompatible' },
      consequence: undefined,
    });
  });

  it('returns detached Clash score data', () => {
    const source = eligible('draw');
    const result = resolveBattlePreviewWithClash({ ...baseInput, clash: { resolution: source } });

    if (!result.clash?.resolution.eligible || !source.eligible) throw new Error('expected eligible clash');
    result.clash.resolution.playerScore.total = 999;
    expect(source.playerScore.total).toBe(7);
  });
});
