import { createRefactorDeck } from '../../core/cards/RefactorDeck';
import type { RefactorCardDefinition } from '../../core/cards/RefactorCardTypes';
import { createIntentState, type IntentState } from '../../core/intents/IntentState';
import type { BattleResolutionState } from '../../core/resolution/BattleResolutionResolver';
import { createControlResilience } from '../../core/status/ControlResilience';
import { createBattleTimeline } from '../../core/timeline/BattleTimeline';
import { BattleTurnController } from './BattleTurnController';

export const REFACTOR_QA_CARD_DEFINITIONS: readonly RefactorCardDefinition[] = [
  { id: 'qa-quick-cut', name: '迅切', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 8 } },
  { id: 'qa-quick-feint', name: '踏影', category: 'quick', delay: 3, targetRule: 'enemy', effect: { damage: 6 } },
  { id: 'qa-heavy-cleave', name: '斷岳', category: 'heavy', delay: 7, targetRule: 'enemy', effect: { damage: 18 } },
  { id: 'qa-heavy-strike', name: '重斬', category: 'heavy', delay: 6, targetRule: 'enemy', effect: { damage: 14 } },
  { id: 'qa-guard-stance', name: '架勢', category: 'guard', delay: 4, targetRule: 'self', effect: { guardRatio: 0.5, guardCap: 8 } },
  { id: 'qa-guard-cover', name: '護持', category: 'guard', delay: 4, targetRule: 'any-ally', effect: { guardRatio: 0.5, guardCap: 8 } },
  { id: 'qa-disrupt-delay', name: '牽制', category: 'disruption', delay: 4, targetRule: 'enemy', effect: { delayTarget: 2 } },
  { id: 'qa-disrupt-interrupt', name: '截勢', category: 'disruption', delay: 5, targetRule: 'enemy', effect: { interrupt: true } },
  { id: 'qa-break-armor', name: '破甲', category: 'break', delay: 4, targetRule: 'enemy', effect: { damage: 5, createBreakWindow: 'armor-break' } },
  { id: 'qa-break-imbalance', name: '失衡', category: 'break', delay: 4, targetRule: 'enemy', effect: { createBreakWindow: 'imbalance' } },
];

export function createRefactorQaEnemyIntent(enemyId: string): IntentState {
  if (enemyId !== 'ghost-fire') throw new Error(`unknown refactor QA enemy: ${enemyId}`);
  return createIntentState({
    id: 'ghost-fire-rush',
    enemyId,
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
  });
}

export function createRefactorQaBattleState(): BattleResolutionState {
  return {
    timeline: createBattleTimeline([
      { actorId: 'rin', team: 'player', nextActionAt: 0, tieBreaker: 0 },
      { actorId: 'ghost-fire', team: 'enemy', nextActionAt: 4, tieBreaker: 10 },
      { actorId: 'chikage', team: 'player', nextActionAt: 5, tieBreaker: 1 },
      { actorId: 'oboro', team: 'player', nextActionAt: 7, tieBreaker: 2 },
      { actorId: 'mo', team: 'player', nextActionAt: 9, tieBreaker: 3 },
    ]),
    vitalsByActorId: {
      rin: { actorId: 'rin', hp: 40, maxHp: 40 },
      chikage: { actorId: 'chikage', hp: 44, maxHp: 44 },
      oboro: { actorId: 'oboro', hp: 36, maxHp: 36 },
      mo: { actorId: 'mo', hp: 48, maxHp: 48 },
      'ghost-fire': { actorId: 'ghost-fire', hp: 52, maxHp: 52 },
    },
    intentByEnemyId: { 'ghost-fire': createRefactorQaEnemyIntent('ghost-fire') },
    resilienceByEnemyId: { 'ghost-fire': createControlResilience(0, 0) },
    breakWindows: [],
    nextBreakWindowSequence: 1,
    guardByTargetId: {},
    oboroDelayUsedByEnemyId: {},
  };
}

export function createRefactorBattleBootstrap(seed = 20260822): BattleTurnController {
  const battle = createRefactorQaBattleState();
  const deck = createRefactorDeck([...REFACTOR_QA_CARD_DEFINITIONS], seed);
  return new BattleTurnController(battle, deck);
}
