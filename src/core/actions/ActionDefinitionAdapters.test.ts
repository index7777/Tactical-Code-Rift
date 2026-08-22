import { describe, expect, it } from 'vitest';
import { REFACTOR_QA_CARD_DEFINITIONS } from '../../application/battle/createRefactorBattleBootstrap';
import { createHardStaggerIntent, createIntentState } from '../intents/IntentState';
import { actionDefinitionFromIntent, actionDefinitionFromRefactorCard } from './ActionDefinitionAdapters';

const expectedProfiles = {
  quick: 'quick-melee',
  heavy: 'heavy-melee',
  guard: 'guard',
  disruption: 'disruption',
  break: 'break',
} as const;

describe('ActionDefinitionAdapters', () => {
  it('adapts all ten current refactor QA cards without changing their action Delay', () => {
    expect(REFACTOR_QA_CARD_DEFINITIONS).toHaveLength(10);

    for (const card of REFACTOR_QA_CARD_DEFINITIONS) {
      const action = actionDefinitionFromRefactorCard(card);

      expect(action.id).toBe(card.id);
      expect(action.name).toBe(card.name);
      expect(action.owner).toBe('player-card');
      expect(action.actionDelay).toBe(card.delay);
      expect(action.presentationProfile).toBe(expectedProfiles[card.category]);
      expect(action.clash).toEqual({ mode: 'none', tags: [] });
      expect(action.ai).toBeUndefined();
      expect(action.counterplay).toBeUndefined();
    }
  });

  it('preserves current card effect values through the compatibility boundary', () => {
    const byId = Object.fromEntries(REFACTOR_QA_CARD_DEFINITIONS.map((card) => [card.id, actionDefinitionFromRefactorCard(card)]));

    expect(byId['qa-quick-cut']).toMatchObject({ targetMode: 'single-enemy', hits: [{ damage: 8 }] });
    expect(byId['qa-heavy-cleave']).toMatchObject({ targetMode: 'single-enemy', hits: [{ damage: 18 }] });
    expect(byId['qa-guard-stance']).toMatchObject({ targetMode: 'self', guard: { ratio: 0.5, cap: 8 } });
    expect(byId['qa-guard-cover']).toMatchObject({ targetMode: 'any-ally', guard: { ratio: 0.5, cap: 8 } });
    expect(byId['qa-disrupt-delay']).toMatchObject({ targetDelay: 2 });
    expect(byId['qa-disrupt-interrupt']).toMatchObject({ interrupt: true });
    expect(byId['qa-break-armor']).toMatchObject({ hits: [{ damage: 5 }], breakWindow: 'armor-break' });
    expect(byId['qa-break-imbalance']).toMatchObject({ hits: [], breakWindow: 'imbalance' });
  });

  it('preserves enemy Intent damage, Delay, statuses and all counterplay flags', () => {
    const intent = createIntentState({
      id: 'rain-warrior:iai',
      enemyId: 'rain-warrior',
      kind: 'normal',
      name: '居合',
      targetIds: ['rin'],
      damage: 15,
      delay: 7,
      canDelay: true,
      canInterrupt: false,
      canGuard: true,
      canRedirect: false,
      statusEffects: ['bleed'],
    });

    const action = actionDefinitionFromIntent(intent);

    expect(action).toMatchObject({
      id: 'rain-warrior:iai',
      owner: 'enemy',
      name: '居合',
      targetMode: 'single-enemy',
      hits: [{ damage: 15 }],
      actionDelay: 7,
      statuses: [{ id: 'bleed' }],
      counterplay: {
        delayable: true,
        interruptible: false,
        guardable: true,
        redirectable: false,
      },
      clash: { mode: 'none', tags: [] },
      telegraph: { level: 'normal' },
      presentationProfile: 'enemy-light',
    });
  });

  it('adapts hard stagger without inventing a target or damage', () => {
    const original = createIntentState({
      id: 'enemy:attack',
      enemyId: 'enemy',
      kind: 'normal',
      name: '攻擊',
      targetIds: ['mo'],
      damage: 10,
      delay: 5,
      canDelay: true,
      canInterrupt: true,
      canGuard: true,
      canRedirect: true,
      statusEffects: [],
    });

    const action = actionDefinitionFromIntent(createHardStaggerIntent(original));

    expect(action.targetMode).toBe('none');
    expect(action.hits).toEqual([]);
    expect(action.statuses).toEqual([]);
    expect(action.presentationProfile).toBe('none');
    expect(action.actionDelay).toBe(5);
  });

  it('rejects multi-target legacy intents instead of guessing authored target semantics', () => {
    const intent = createIntentState({
      id: 'boss:sweep',
      enemyId: 'rain-boss',
      kind: 'normal',
      name: '驟雨橫掃',
      targetIds: ['rin', 'chikage'],
      damage: 8,
      delay: 6,
      canDelay: true,
      canInterrupt: false,
      canGuard: true,
      canRedirect: false,
      statusEffects: [],
    });

    expect(() => actionDefinitionFromIntent(intent)).toThrow('cannot be adapted without authored target semantics');
  });

  it('returns detached action data and never mutates source definitions', () => {
    const card = REFACTOR_QA_CARD_DEFINITIONS[0]!;
    const sourceSnapshot = structuredClone(card);
    const action = actionDefinitionFromRefactorCard(card);

    (action.hits as { damage: number }[])[0]!.damage = 999;
    (action.clash.tags as string[]).push('mutated');

    expect(card).toEqual(sourceSnapshot);

    const intent = createIntentState({
      id: 'enemy:status',
      enemyId: 'enemy',
      kind: 'normal',
      name: '狀態攻擊',
      targetIds: ['oboro'],
      damage: 4,
      delay: 4,
      canDelay: true,
      canInterrupt: true,
      canGuard: false,
      canRedirect: false,
      statusEffects: ['mark'],
    });
    const intentSnapshot = structuredClone(intent);
    const enemyAction = actionDefinitionFromIntent(intent);

    (enemyAction.statuses as { id: string }[])[0]!.id = 'changed';
    expect(intent).toEqual(intentSnapshot);
  });
});
