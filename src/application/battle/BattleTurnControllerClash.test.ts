import { describe, expect, it } from 'vitest';
import { createActionDefinition, type ActionDefinition } from '../../core/actions/ActionDefinition';
import { createRefactorDeck } from '../../core/cards/RefactorDeck';
import type { RefactorCardDefinition } from '../../core/cards/RefactorCardTypes';
import { createIntentState } from '../../core/intents/IntentState';
import type { BattleResolutionState } from '../../core/resolution/BattleResolutionResolver';
import { createControlResilience } from '../../core/status/ControlResilience';
import type { ClashApplicationCatalog } from './ClashApplicationPlanner';
import { BattleTurnController } from './BattleTurnController';
import { createEncounterBattleBootstrap } from './createEncounterBattleBootstrap';
import { createRefactorBattleBootstrap } from './createRefactorBattleBootstrap';

function quickDefinitions(): RefactorCardDefinition[] {
  return Array.from({ length: 8 }, (_, index) => ({
    id: `quick-${index}`,
    name: `迅切 ${index}`,
    category: 'quick' as const,
    delay: 3,
    targetRule: 'enemy' as const,
    effect: { damage: 8 },
  }));
}

function playerAction(id: string): ActionDefinition {
  return createActionDefinition({
    id,
    owner: 'player-card',
    name: id,
    targetMode: 'single-enemy',
    hits: [{ damage: 8 }],
    actionDelay: 3,
    statuses: [],
    clash: { mode: 'direct', base: 7, tags: ['melee'] },
    telegraph: { level: 'normal' },
    presentationProfile: 'quick-melee',
  });
}

function enemyAction(): ActionDefinition {
  return createActionDefinition({
    id: 'ghost-fire-rush',
    owner: 'enemy',
    name: '鬼火疾走',
    targetMode: 'single-enemy',
    hits: [{ damage: 20 }],
    actionDelay: 5,
    statuses: [],
    clash: { mode: 'direct', base: 5, tags: ['melee'] },
    telegraph: { level: 'normal' },
    counterplay: { delayable: true, interruptible: true, guardable: true, redirectable: true },
    presentationProfile: 'enemy-light',
  });
}

function battleState(): BattleResolutionState {
  return {
    timeline: {
      currentTime: 0,
      entries: [
        { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
        { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      ],
    },
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 40, maxHp: 40 },
      'ghost-fire': { actorId: 'ghost-fire', hp: 52, maxHp: 52 },
    },
    intentByEnemyId: {
      'ghost-fire': createIntentState({
        id: 'ghost-fire-rush',
        enemyId: 'ghost-fire',
        kind: 'normal',
        name: '鬼火疾走',
        targetIds: ['rin'],
        damage: 20,
        delay: 5,
        canDelay: true,
        canInterrupt: true,
        canGuard: true,
        canRedirect: true,
        statusEffects: [],
      }),
    },
    resilienceByEnemyId: { 'ghost-fire': createControlResilience(0, 0) },
    breakWindows: [],
    nextBreakWindowSequence: 1,
  };
}

function clashCatalog(definitions: readonly RefactorCardDefinition[]): ClashApplicationCatalog {
  return {
    playerActionByCardDefinitionId: Object.fromEntries(
      definitions.map((definition) => [definition.id, playerAction(definition.id)]),
    ),
    enemyActionByIntentId: { 'ghost-fire-rush': enemyAction() },
  };
}

describe('BattleTurnController Phase 14d Clash wiring', () => {
  it('previews and commits the same player-win Clash consequence', () => {
    const definitions = quickDefinitions();
    const controller = new BattleTurnController(
      battleState(),
      createRefactorDeck(definitions, 42),
      clashCatalog(definitions),
    );

    controller.startNextActor();
    const card = controller.deck().hand[0]!;
    controller.selectPlayerCard(card.instanceId);
    controller.previewPlayerTarget('ghost-fire');

    const preview = controller.preview();
    expect(preview?.clash?.resolution).toMatchObject({ eligible: true, outcome: 'player-win' });
    expect(preview?.clash?.contestedEnemyId).toBe('ghost-fire');
    expect(preview?.clash?.enemyIntentChange).toBe('canceled');

    controller.confirmPlayerCard();
    expect(controller.preview()).toBeUndefined();
    controller.beginResolution();
    const after = controller.completeResolution();

    expect(after.vitalsByActorId['ghost-fire']?.hp).toBe(preview?.hpAfter);
    expect(after.intentByEnemyId['ghost-fire']).toMatchObject({
      kind: 'hard-stagger',
      name: '硬直',
      targetIds: [],
    });
  });

  it('clears stale Clash preview on cancel and does not commit it', () => {
    const definitions = quickDefinitions();
    const controller = new BattleTurnController(
      battleState(),
      createRefactorDeck(definitions, 42),
      clashCatalog(definitions),
    );

    controller.startNextActor();
    const card = controller.deck().hand[0]!;
    controller.selectPlayerCard(card.instanceId);
    controller.previewPlayerTarget('ghost-fire');
    expect(controller.preview()?.clash).toBeDefined();

    controller.cancelPlayerStep();
    expect(controller.preview()).toBeUndefined();
  });

  it('keeps the seven-node story encounter bootstrap Clash-disabled in Phase 14d', () => {
    const { controller } = createEncounterBattleBootstrap('battle-1', 42);
    controller.startNextActor();
    const card = controller.deck().hand.find((candidate) => candidate.definition.targetRule === 'enemy');
    if (!card) throw new Error('expected an enemy-target card in deterministic hand');
    const enemyId = controller.timeline().entries.find((entry) => entry.team === 'enemy')!.actorId;

    controller.selectPlayerCard(card.instanceId);
    controller.previewPlayerTarget(enemyId);
    expect(controller.preview()?.clash).toBeUndefined();
  });

  it('enables authored Clash in the isolated refactor QA bootstrap', () => {
    let observed = false;
    for (let seed = 1; seed <= 50 && !observed; seed += 1) {
      const controller = createRefactorBattleBootstrap(seed);
      controller.startNextActor();
      const card = controller.deck().hand.find((candidate) =>
        candidate.definition.id === 'qa-quick-cut'
        || candidate.definition.id === 'qa-quick-feint'
        || candidate.definition.id === 'qa-heavy-cleave'
        || candidate.definition.id === 'qa-heavy-strike',
      );
      if (!card) continue;
      controller.selectPlayerCard(card.instanceId);
      controller.previewPlayerTarget('ghost-fire');
      observed = controller.preview()?.clash?.resolution.eligible === true;
    }

    expect(observed).toBe(true);
  });
});
