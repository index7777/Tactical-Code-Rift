import type { BattleTurnPhase } from '../../../core/turns/BattleTurnState';

const ACTOR_LABELS: Readonly<Record<string, string>> = {
  rin: '凜',
  chikage: '千景',
  oboro: '朧',
  mo: '紅葉',
  'ghost-fire': '提燈童子',
};

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  quick: '迅擊',
  heavy: '重擊',
  guard: '守勢',
  disruption: '擾亂',
  break: '破勢',
};

const TARGET_RULE_LABELS: Readonly<Record<string, string>> = {
  enemy: '敵方',
  self: '自身',
  ally: '友方',
  'any-ally': '友方',
  none: '無需指定',
};

const PHASE_LABELS: Readonly<Record<BattleTurnPhase, string>> = {
  WAITING_FOR_NEXT_ACTOR: '行動排序中',
  PLAYER_IDLE: '等待指令',
  CARD_SELECTED: '已選擇卡牌',
  TARGET_PREVIEW: '目標預覽',
  EXECUTING: '我方行動中',
  ENEMY_EXECUTING: '敵方行動中',
  RESOLVING: '結算中',
  BATTLE_ENDED: '戰鬥結束',
};

export type RefactorAutoAdvanceAction = 'START_NEXT_ACTOR' | 'RESOLVE_ENEMY' | 'NONE';
export type RefactorTargetAffordance = 'SELECTED' | 'CANDIDATE' | 'DEFAULT' | 'DISABLED';

export function actorDisplayName(actorId: string): string {
  return ACTOR_LABELS[actorId] ?? actorId;
}

export function categoryDisplayName(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function targetRuleDisplayName(targetRule: string): string {
  return TARGET_RULE_LABELS[targetRule] ?? targetRule;
}

export function cardTargetDisplayName(
  targetRule: string,
  category: string,
  activeActorId?: string,
): string {
  if (category === 'guard' && targetRule === 'any-ally') {
    return activeActorId === 'chikage' ? '友方' : '自身';
  }
  return targetRuleDisplayName(targetRule);
}

export function phaseDisplayName(phase: BattleTurnPhase): string {
  return PHASE_LABELS[phase];
}

export function targetAffordance(
  alive: boolean,
  isTargetable: boolean,
  isSelectedTarget: boolean,
): RefactorTargetAffordance {
  if (!alive) return 'DISABLED';
  if (isSelectedTarget) return 'SELECTED';
  if (isTargetable) return 'CANDIDATE';
  return 'DEFAULT';
}

export function autoAdvanceAction(
  phase: BattleTurnPhase,
  canResolveEnemy: boolean,
): RefactorAutoAdvanceAction {
  if (phase === 'WAITING_FOR_NEXT_ACTOR') return 'START_NEXT_ACTOR';
  if (phase === 'ENEMY_EXECUTING' && canResolveEnemy) return 'RESOLVE_ENEMY';
  return 'NONE';
}
