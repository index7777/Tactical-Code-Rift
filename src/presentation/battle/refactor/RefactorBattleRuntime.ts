import type { BattleTurnController } from '../../../application/battle/BattleTurnController';
import type { RefactorCardInstance } from '../../../core/cards/RefactorCardTypes';
import type { IntentState } from '../../../core/intents/IntentState';
import type { BattleResolutionState } from '../../../core/resolution/BattleResolutionResolver';
import type { BattleTurnPhase } from '../../../core/turns/BattleTurnState';
import { buildEnemyIntent, type EnemyIntentView } from './EnemyIntentPresenter';
import { buildHandCards, type HandCardView } from './HandPresenter';
import { buildTargetPreview, type TargetPreviewView } from './TargetPreviewPresenter';
import { buildTimelineNodes, type TimelineNodeView } from './TimelinePresenter';

export type RefactorEnemyIntentProvider = (
  enemyId: string,
  battle: BattleResolutionState,
) => IntentState;

export interface RefactorActorVitalsView {
  actorId: string;
  hp: number;
  maxHp: number;
}

export interface RefactorBattleView {
  phase: BattleTurnPhase;
  activeActorId?: string;
  timeline: TimelineNodeView[];
  hand: HandCardView[];
  preview?: TargetPreviewView;
  enemyIntents: EnemyIntentView[];
  vitalsByActorId: Record<string, RefactorActorVitalsView | undefined>;
  targetableActorIds: string[];
  canConfirm: boolean;
  canDispatch: boolean;
  canResolveEnemy: boolean;
  outcome?: 'victory' | 'defeat';
}

function cloneVitals(
  source: Readonly<Record<string, RefactorActorVitalsView | undefined>>,
): Record<string, RefactorActorVitalsView | undefined> {
  return Object.fromEntries(
    Object.entries(source).map(([actorId, vitals]) => [
      actorId,
      vitals ? { ...vitals } : undefined,
    ]),
  );
}

function livingActorIds(
  battle: BattleResolutionState,
  team: 'player' | 'enemy',
): string[] {
  return battle.timeline.entries
    .filter((entry) => entry.team === team)
    .filter((entry) => (battle.vitalsByActorId[entry.actorId]?.hp ?? 0) > 0)
    .map((entry) => entry.actorId);
}

function targetableActorIds(
  battle: BattleResolutionState,
  selectedCard: RefactorCardInstance | undefined,
  activeActorId?: string,
): string[] {
  if (!selectedCard) return [];
  const rule = selectedCard.definition.targetRule;
  if (rule === 'enemy') return livingActorIds(battle, 'enemy');
  if (rule === 'ally') return livingActorIds(battle, 'player');
  if (rule === 'any-ally') {
    const livingPlayers = livingActorIds(battle, 'player');
    if (selectedCard.definition.category === 'guard' && activeActorId !== 'chikage') {
      return activeActorId && livingPlayers.includes(activeActorId) ? [activeActorId] : [];
    }
    return livingPlayers;
  }
  return [];
}

export class RefactorBattleRuntime {
  constructor(
    private readonly controller: BattleTurnController,
    private readonly enemyIntentProvider?: RefactorEnemyIntentProvider,
  ) {}

  view(): RefactorBattleView {
    const turn = this.controller.turn();
    const battle = this.controller.battle();
    const deck = this.controller.deck();
    const preview = this.controller.preview();
    const selectedCard = turn.selectedActionId
      ? deck.hand.find((card) => card.instanceId === turn.selectedActionId)
      : undefined;
    const selectedNeedsNoExplicitTarget = selectedCard?.definition.targetRule === 'self'
      || selectedCard?.definition.targetRule === 'none';
    const livingPlayers = livingActorIds(battle, 'player');
    const livingEnemies = livingActorIds(battle, 'enemy');

    return {
      phase: turn.phase,
      activeActorId: turn.activeActor?.actorId,
      timeline: buildTimelineNodes(battle.timeline, battle.intentByEnemyId),
      hand: buildHandCards(deck, turn.selectedActionId),
      preview: preview ? buildTargetPreview(preview) : undefined,
      enemyIntents: Object.values(battle.intentByEnemyId)
        .filter((intent): intent is NonNullable<typeof intent> => Boolean(intent))
        .map((intent) => buildEnemyIntent(intent)),
      vitalsByActorId: cloneVitals(battle.vitalsByActorId),
      targetableActorIds: targetableActorIds(battle, selectedCard, turn.activeActor?.actorId),
      canConfirm: (turn.phase === 'TARGET_PREVIEW' && Boolean(preview))
        || (turn.phase === 'CARD_SELECTED' && Boolean(selectedNeedsNoExplicitTarget)),
      canDispatch: turn.phase === 'PLAYER_IDLE' && turn.activeActor?.team === 'player',
      canResolveEnemy: turn.phase === 'ENEMY_EXECUTING' && Boolean(this.enemyIntentProvider),
      outcome: turn.phase === 'BATTLE_ENDED'
        ? livingEnemies.length === 0
          ? 'victory'
          : livingPlayers.length === 0
            ? 'defeat'
            : undefined
        : undefined,
    };
  }

  startNextActor(): RefactorBattleView {
    this.controller.startNextActor();
    return this.view();
  }

  selectCard(instanceId: string): RefactorBattleView {
    this.controller.selectPlayerCard(instanceId);
    return this.view();
  }

  previewTarget(targetId: string): RefactorBattleView {
    const view = this.view();
    if (!view.targetableActorIds.includes(targetId)) {
      throw new Error(`actor is not a legal presentation target: ${targetId}`);
    }
    this.controller.previewPlayerTarget(targetId);
    return this.view();
  }

  cancel(): RefactorBattleView {
    this.controller.cancelPlayerStep();
    return this.view();
  }

  confirmCard(): RefactorBattleView {
    this.controller.confirmPlayerCard();
    return this.view();
  }

  resolveConfirmedPlayerAction(): RefactorBattleView {
    this.controller.beginResolution();
    this.controller.completeResolution();
    return this.view();
  }

  resolveActiveEnemyAction(): RefactorBattleView {
    const turn = this.controller.turn();
    const actor = turn.activeActor;
    if (turn.phase !== 'ENEMY_EXECUTING' || !actor || actor.team !== 'enemy') {
      throw new Error(`cannot resolve enemy action during ${turn.phase}`);
    }
    if (!this.enemyIntentProvider) throw new Error('enemy intent provider is not attached');
    const nextIntent = this.enemyIntentProvider(actor.actorId, this.controller.battle());
    this.controller.beginResolution();
    this.controller.completeResolution(nextIntent);
    return this.view();
  }

  dispatch(selectedInstanceIds: readonly string[]): RefactorBattleView {
    this.controller.dispatch(selectedInstanceIds);
    this.controller.beginResolution();
    this.controller.completeResolution();
    return this.view();
  }
}
