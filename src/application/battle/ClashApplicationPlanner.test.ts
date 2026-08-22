import { describe, expect, it } from 'vitest';
import { createActionDefinition, type ActionDefinition } from '../../core/actions/ActionDefinition';
import type { RefactorCardInstance } from '../../core/cards/RefactorCardTypes';
import { createIntentState } from '../../core/intents/IntentState';
import type { BattleResolutionState } from '../../core/resolution/BattleResolutionResolver';
import { createControlResilience } from '../../core/status/ControlResilience';
import { planPlayerClash, type ClashApplicationCatalog } from './ClashApplicationPlanner';

function playerAction(
  id: string,
  mode: 'direct' | 'guard-intercept',
  base: number,
  actionDelay: number,
): ActionDefinition {
  return createActionDefinition({
    id,
    owner: 'player-card',
    name: id,
    targetMode: mode === 'direct' ? 'single-enemy' : 'any-ally',
    hits: mode === 'direct' ? [{ damage: 8 }] : [],
    actionDelay,
    guard: mode === 'guard-intercept' ? { ratio: 0.5, cap: 8 } : undefined,
    statuses: [],
    clash: { mode, base, tags: ['melee'] },
    telegraph: { level: 'normal' },
    presentationProfile: mode === 'direct' ? 'quick-melee' : 'guard',
  });
}

function enemyAction(id: string, base = 6): ActionDefinition {
  return createActionDefinition({
    id,
    owner: 'enemy',
    name: id,
    targetMode: 'single-enemy',
    hits: [{ damage: 9 }],
    actionDelay: 5,
    statuses: [],
    clash: { mode: 'direct', base, tags: ['melee'] },
    telegraph: { level: 'normal' },
    counterplay: { delayable: true, interruptible: true, guardable: true, redirectable: true },
    presentationProfile: 'enemy-light',
  });
}

function card(id: string, category: RefactorCardInstance['definition']['category'], targetRule: RefactorCardInstance['definition']['targetRule'], delay: number): RefactorCardInstance {
  return {
    instanceId: `${id}:instance`,
    definition: {
      id,
      name: id,
      category,
      delay,
      targetRule,
      effect: category === 'guard' ? { guardRatio: 0.5, guardCap: 8 } : { damage: 8 },
    },
  };
}

function intent(id: string, enemyId: string, targetId: string) {
  return createIntentState({
    id,
    enemyId,
    kind: 'normal',
    name: id,
    targetIds: [targetId],
    damage: 9,
    delay: 5,
    canDelay: true,
    canInterrupt: true,
    canGuard: true,
    canRedirect: true,
    statusEffects: [],
  });
}

function battle(): BattleResolutionState {
  return {
    timeline: {
      currentTime: 0,
      entries: [
        { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
        { actorId: 'chikage', team: 'player', nextActionAt: 0, tieBreaker: 1 },
        { actorId: 'enemy-late', team: 'enemy', nextActionAt: 6, tieBreaker: 3 },
        { actorId: 'enemy-early', team: 'enemy', nextActionAt: 4, tieBreaker: 2 },
      ],
    },
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 40, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 44, maxHp: 44 },
      'enemy-late': { actorId: 'enemy-late', hp: 30, maxHp: 30 },
      'enemy-early': { actorId: 'enemy-early', hp: 30, maxHp: 30 },
    },
    intentByEnemyId: {
      'enemy-late': intent('late-intent', 'enemy-late', 'rin'),
      'enemy-early': intent('early-intent', 'enemy-early', 'rin'),
    },
    resilienceByEnemyId: {
      'enemy-late': createControlResilience(0, 0),
      'enemy-early': createControlResilience(0, 0),
    },
    breakWindows: [],
    nextBreakWindowSequence: 1,
  };
}

function catalog(): ClashApplicationCatalog {
  return {
    playerActionByCardDefinitionId: {
      quick: playerAction('quick', 'direct', 5, 3),
      heavy: playerAction('heavy', 'direct', 7, 7),
      cover: playerAction('cover', 'guard-intercept', 5, 4),
    },
    enemyActionByIntentId: {
      'late-intent': enemyAction('late-intent'),
      'early-intent': enemyAction('early-intent'),
    },
  };
}

describe('ClashApplicationPlanner', () => {
  it('uses only the explicit enemy target for a direct Clash', () => {
    const result = planPlayerClash({
      battle: battle(),
      activeActorId: 'rin',
      card: card('quick', 'quick', 'enemy', 3),
      targetId: 'enemy-late',
      catalog: catalog(),
    });

    expect(result?.contestedEnemyId).toBe('enemy-late');
    expect(result?.enemyIntent.id).toBe('late-intent');
  });

  it('chooses the earliest Timeline enemy targeting the protected ally for guard-intercept', () => {
    const result = planPlayerClash({
      battle: battle(),
      activeActorId: 'chikage',
      card: card('cover', 'guard', 'any-ally', 4),
      targetId: 'rin',
      catalog: catalog(),
    });

    expect(result?.contestedEnemyId).toBe('enemy-early');
  });

  it('derives bounded timing from enemy lead minus player action Delay', () => {
    const fast = planPlayerClash({
      battle: battle(),
      activeActorId: 'rin',
      card: card('quick', 'quick', 'enemy', 3),
      targetId: 'enemy-late',
      catalog: catalog(),
    });
    const slow = planPlayerClash({
      battle: battle(),
      activeActorId: 'rin',
      card: card('heavy', 'heavy', 'enemy', 7),
      targetId: 'enemy-early',
      catalog: catalog(),
    });

    if (!fast?.resolution.eligible || !slow?.resolution.eligible) throw new Error('expected eligible Clash');
    expect(fast.resolution.playerScore.timing).toBe(2); // 6 - 0 - 3 = 3, clamped to +2.
    expect(slow.resolution.playerScore.timing).toBe(-2); // 4 - 0 - 7 = -3, clamped to -2.
  });

  it('gives Rin quick and Chikage guard-intercept their +1 specialization', () => {
    const rin = planPlayerClash({
      battle: battle(),
      activeActorId: 'rin',
      card: card('quick', 'quick', 'enemy', 3),
      targetId: 'enemy-early',
      catalog: catalog(),
    });
    const chikage = planPlayerClash({
      battle: battle(),
      activeActorId: 'chikage',
      card: card('cover', 'guard', 'any-ally', 4),
      targetId: 'rin',
      catalog: catalog(),
    });

    if (!rin?.resolution.eligible || !chikage?.resolution.eligible) throw new Error('expected eligible Clash');
    expect(rin.resolution.playerScore.specialization).toBe(1);
    expect(chikage.resolution.playerScore.specialization).toBe(1);
  });

  it('returns no Clash when player or enemy authored data is missing', () => {
    const noPlayer = planPlayerClash({
      battle: battle(),
      activeActorId: 'rin',
      card: card('missing', 'quick', 'enemy', 3),
      targetId: 'enemy-early',
      catalog: catalog(),
    });
    const partialCatalog = catalog();
    const noEnemy = planPlayerClash({
      battle: battle(),
      activeActorId: 'rin',
      card: card('quick', 'quick', 'enemy', 3),
      targetId: 'enemy-early',
      catalog: {
        ...partialCatalog,
        enemyActionByIntentId: { 'late-intent': partialCatalog.enemyActionByIntentId['late-intent'] },
      },
    });

    expect(noPlayer).toBeUndefined();
    expect(noEnemy).toBeUndefined();
  });

  it('returns detached Intent data', () => {
    const source = battle();
    const result = planPlayerClash({
      battle: source,
      activeActorId: 'rin',
      card: card('quick', 'quick', 'enemy', 3),
      targetId: 'enemy-early',
      catalog: catalog(),
    });

    result!.enemyIntent.targetIds.push('mutated');
    expect(source.intentByEnemyId['enemy-early']?.targetIds).toEqual(['rin']);
  });
});
