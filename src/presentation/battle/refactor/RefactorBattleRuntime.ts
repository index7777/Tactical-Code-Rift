import type { BattleTurnController } from '../../../application/battle/BattleTurnController';
import type { BattleTurnPhase } from '../../../core/turns/BattleTurnState';
import { buildEnemyIntent, type EnemyIntentView } from './EnemyIntentPresenter';
import { buildHandCards, type HandCardView } from './HandPresenter';
import { buildTargetPreview, type TargetPreviewView } from './TargetPreviewPresenter';
import { buildTimelineNodes, type TimelineNodeView } from './TimelinePresenter';

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
  canConfirm: boolean;
  canDispatch: boolean;
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

export class RefactorBattleRuntime {
  constructor(private readonly controller: BattleTurnController) {}

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
      canConfirm: (turn.phase === 'TARGET_PREVIEW' && Boolean(preview))
        || (turn.phase === 'CARD_SELECTED' && Boolean(selectedNeedsNoExplicitTarget)),
      canDispatch: turn.phase === 'PLAYER_IDLE' && turn.activeActor?.team === 'player',
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

  dispatch(selectedInstanceIds: readonly string[]): RefactorBattleView {
    this.controller.dispatch(selectedInstanceIds);
    this.controller.beginResolution();
    this.controller.completeResolution();
    return this.view();
  }
}
