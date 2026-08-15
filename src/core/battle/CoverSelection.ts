import type { ActionNode, PlayerCommand } from './BattleTypes';

export type CoverSelectionResult =
  | { ok: true; enemy: ActionNode; protectedActorId: string }
  | { ok: false; reason: 'self' | 'none' | 'multiple' | 'reserved' | 'slow' };

export function selectCoverIntent(args: {
  timeline: ActionNode[];
  commands: Map<string, PlayerCommand | null>;
  actorId: string;
  actorSpeed: number;
  cardTempo: number;
  selectedActorId: string;
  selectedEnemyId?: string;
}): CoverSelectionResult {
  const reserved = new Set([...args.commands.values()].filter((c): c is PlayerCommand => Boolean(c?.targetNodeId)).map(c => c.targetNodeId!));
  let candidates = args.timeline.filter((node) => node.team === 'enemy' && Boolean(node.enemySkill));
  if (args.selectedEnemyId) candidates = candidates.filter((node) => node.actorId === args.selectedEnemyId);
  else candidates = candidates.filter((node) => node.enemySkill!.targetId === args.selectedActorId && !reserved.has(node.id));
  if (!args.selectedEnemyId && args.selectedActorId === args.actorId) return { ok: false, reason: 'self' };
  if (candidates.length > 1) return { ok: false, reason: 'multiple' };
  const enemy = candidates[0];
  if (!enemy?.enemySkill) return { ok: false, reason: 'none' };
  if (enemy.enemySkill.targetId === args.actorId) return { ok: false, reason: 'self' };
  if (reserved.has(enemy.id)) return { ok: false, reason: 'reserved' };
  const enemyInitiative = enemy.initiative ?? enemy.speed + (enemy.enemySkill.tempo ?? 0);
  if (args.actorSpeed + args.cardTempo <= enemyInitiative) return { ok: false, reason: 'slow' };
  return { ok: true, enemy, protectedActorId: enemy.enemySkill.targetId };
}
