import { describe, expect, it } from 'vitest';
import type { ClashResolution } from '../clash/ClashResolver';
import { createIntentState } from '../intents/IntentState';
import { resolveBattlePreview } from './BattlePreviewResolver';
import { resolveBattlePreviewWithClash, type BattlePreviewWithClashInput } from './BattlePreviewWithClash';

const enemyIntent = createIntentState({
  id: 'enemy:slash',
  enemyId: 'enemy',
  kind: 'normal',
  name: '斬擊',
  targetIds: ['rin'],
  damage: 9,
  delay: 5,
  canDelay: true,
  canInterrupt: true,
  canGuard: true,
  canRedirect: false,
  statusEffects: ['bleed'],
});

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
  targetIntent: enemyIntent,
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

function clash(outcome: 'player-win' | 'draw' | 'enemy-win') {
  return {
    resolution: eligible(outcome),
    contestedEnemyId: 'enemy',
    enemyIntent,
  } as const;
}

describe('BattlePreviewWithClash', () => {
  it('preserves the existing preview when no Clash input is supplied', () => {
    expect(resolveBattlePreviewWithClash(baseInput)).toEqual(resolveBattlePreview(baseInput));
  });

  it('keeps full player damage and cancels the contested Intent on player win', () => {
    const result = resolveBattlePreviewWithClash({
      ...baseInput,
      clash: clash('player-win'),
    });

    expect(result.finalDamage).toBe(11); // Rin quick specialization still uses the shared preview rules.
    expect(result.hpAfter).toBe(19);
    expect(result.clash?.consequence).toEqual({
      outcome: 'player-win',
      playerEffectMode: 'full',
      enemyIntentMode: 'cancel',
    });
    expect(result.clash?.enemyIntentChange).toBe('canceled');
    expect(result.clash?.enemyIntentAfter).toMatchObject({
      enemyId: 'enemy',
      kind: 'hard-stagger',
      name: '硬直',
      damage: undefined,
      targetIds: [],
      delay: 5,
    });
  });

  it('halves player damage and enemy damage on draw while suppressing statuses', () => {
    const result = resolveBattlePreviewWithClash({
      ...baseInput,
      clash: clash('draw'),
    });

    // 8 authored damage -> 4, then Rin quick specialization remains a normal preview modifier.
    expect(result.baseDamage).toBe(4);
    expect(result.finalDamage).toBe(7);
    expect(result.hpAfter).toBe(23);
    expect(result.actorNextActionAt).toBe(3);
    expect(result.clash?.enemyIntentChange).toBe('halved');
    expect(result.clash?.enemyIntentAfter).toMatchObject({
      damage: 4,
      delay: 5,
      statusEffects: [],
      targetIds: ['rin'],
    });
  });

  it('suppresses the player effect on enemy win but still pays action Delay', () => {
    const result = resolveBattlePreviewWithClash({
      ...baseInput,
      clash: clash('enemy-win'),
    });

    expect(result.baseDamage).toBe(0);
    expect(result.finalDamage).toBe(0);
    expect(result.hpAfter).toBe(30);
    expect(result.actorNextActionAt).toBe(3);
    expect(result.clash?.enemyIntentChange).toBe('none');
    expect(result.clash?.enemyIntentAfter).toEqual(enemyIntent);
  });

  it('suppresses target Delay, Interrupt and Break creation on draw', () => {
    const controlInput: BattlePreviewWithClashInput = {
      ...baseInput,
      activeActorId: 'oboro',
      card: {
        instanceId: 'control-1',
        definition: {
          id: 'control',
          name: '牽制',
          category: 'disruption',
          delay: 4,
          targetRule: 'enemy',
          effect: { damage: 6, delayTarget: 3, interrupt: true, createBreakWindow: 'imbalance' },
        },
      },
      timeline: {
        currentTime: 0,
        entries: [
          { actorId: 'oboro', team: 'player', nextActionAt: 0, tieBreaker: 0 },
          { actorId: 'enemy', team: 'enemy', nextActionAt: 5, tieBreaker: 1 },
        ],
      },
      targetResilience: { base: 0, temporary: 0 },
      clash: clash('draw'),
    };

    const result = resolveBattlePreviewWithClash(controlInput);

    expect(result.baseDamage).toBe(3);
    expect(result.requestedDelay).toBe(0);
    expect(result.actualDelay).toBe(0);
    expect(result.intentChange).toBe('none');
    expect(result.createdBreakWindow).toBeUndefined();
  });

  it('allows guard-intercept to target an ally while contesting a separate enemy Intent', () => {
    const guardInput: BattlePreviewWithClashInput = {
      activeActorId: 'chikage',
      card: {
        instanceId: 'guard-1',
        definition: {
          id: 'guard-cover',
          name: '護持',
          category: 'guard',
          delay: 4,
          targetRule: 'any-ally',
          effect: { guardRatio: 0.5, guardCap: 8 },
        },
      },
      target: { actorId: 'rin', hp: 40, maxHp: 40 },
      timeline: {
        currentTime: 0,
        entries: [
          { actorId: 'chikage', team: 'player', nextActionAt: 0, tieBreaker: 0 },
          { actorId: 'rin', team: 'player', nextActionAt: 2, tieBreaker: 1 },
          { actorId: 'enemy', team: 'enemy', nextActionAt: 5, tieBreaker: 2 },
        ],
      },
      breakWindows: [],
      clash: clash('draw'),
    };

    const result = resolveBattlePreviewWithClash(guardInput);

    expect(result.targetId).toBe('rin');
    expect(result.createdGuardReaction).toMatchObject({
      protectorId: 'chikage',
      targetId: 'rin',
      guardRatio: 0.25,
      guardCap: 4,
    });
    expect(result.clash?.contestedEnemyId).toBe('enemy');
    expect(result.clash?.enemyIntentAfter?.damage).toBe(4);
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
    expect(result.finalDamage).toBe(resolveBattlePreview(baseInput).finalDamage);
  });

  it('requires authored contested enemy data for an eligible Clash', () => {
    expect(() => resolveBattlePreviewWithClash({
      ...baseInput,
      clash: { resolution: eligible('player-win') },
    })).toThrow('eligible Clash preview requires contestedEnemyId and enemyIntent');
  });

  it('returns detached Clash and Intent data', () => {
    const source = eligible('draw');
    const sourceIntent = createIntentState(enemyIntent);
    const result = resolveBattlePreviewWithClash({
      ...baseInput,
      clash: { resolution: source, contestedEnemyId: 'enemy', enemyIntent: sourceIntent },
    });

    if (!result.clash?.resolution.eligible || !source.eligible) throw new Error('expected eligible clash');
    result.clash.resolution.playerScore.total = 999;
    result.clash.enemyIntentAfter!.targetIds.push('mutated');

    expect(source.playerScore.total).toBe(7);
    expect(sourceIntent.targetIds).toEqual(['rin']);
    expect(sourceIntent.statusEffects).toEqual(['bleed']);
  });
});
