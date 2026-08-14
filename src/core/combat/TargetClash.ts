import { resolveCardPair, type ActionCard, type ClashStep } from './RelayClash';

export type Team = 'player' | 'enemy';
export interface CombatIntent extends ActionCard { actorId: string; team: Team; targetId?: string }
export type EngagementKind = 'clash' | 'intercept' | 'one_sided' | 'self_defense';
export interface Engagement { attacker: CombatIntent; responder?: CombatIntent; protectedId?: string; kind: EngagementKind; result?: ClashStep }
export interface ActorPosition { actorId: string; x: number; y: number }
export interface CombatBeat { index: number; player?: CombatIntent; enemy?: CombatIntent }

export function isMutualAttack(player?: CombatIntent, enemy?: CombatIntent): boolean {
  return Boolean(player && enemy && player.type !== 'DEF' && enemy.type !== 'DEF' && player.targetId === enemy.actorId && enemy.targetId === player.actorId);
}

export function oneSidedPushDistance(attackerTeam: Team): number {
  return attackerTeam === 'player' ? -110 : 110;
}

export function approachDuration(distance: number): number {
  return Math.min(520, Math.max(260, Math.round(Math.abs(distance) * 0.55)));
}

export function buildCombatBeats(playerIntents: CombatIntent[], enemyIntents: CombatIntent[]): CombatBeat[] {
  const length = Math.max(playerIntents.length, enemyIntents.length);
  return Array.from({ length }, (_, index) => ({ index, player: playerIntents[index], enemy: enemyIntents[index] }));
}

export function applyFrontlineBlockers(enemyIntents: CombatIntent[], playerPositions: ActorPosition[]): CombatIntent[] {
  return enemyIntents.map(intent => {
    if (intent.type === 'DEF' || !intent.targetId) return intent;
    const target = playerPositions.find(actor => actor.actorId === intent.targetId);
    if (!target) return intent;
    const blocker = playerPositions
      .filter(actor => actor.actorId !== intent.targetId && actor.x < target.x && Math.abs(actor.y - target.y) <= 48)
      .sort((a, b) => a.x - b.x)[0];
    return blocker ? { ...intent, targetId: blocker.actorId } : intent;
  });
}

export function engagementTargetKey(engagement: Engagement): string {
  return engagement.attacker.team === 'enemy' ? engagement.attacker.actorId : engagement.attacker.targetId!;
}

export function groupEngagementsByTarget(engagements: Engagement[]): Engagement[][] {
  const groups: { engagements: Engagement[]; actors: Set<string> }[] = [];
  for (const engagement of engagements) {
    const actors = new Set([engagement.attacker.actorId, engagement.attacker.targetId, engagement.responder?.actorId, engagement.protectedId].filter((id): id is string => Boolean(id)));
    const connected = groups.filter(group => [...actors].some(actor => group.actors.has(actor)));
    if (!connected.length) groups.push({ engagements: [engagement], actors });
    else {
      const primary = connected[0]!;
      primary.engagements.push(engagement);
      actors.forEach(actor => primary.actors.add(actor));
      for (const extra of connected.slice(1)) {
        primary.engagements.push(...extra.engagements);
        extra.actors.forEach(actor => primary.actors.add(actor));
        groups.splice(groups.indexOf(extra), 1);
      }
    }
  }
  return groups.map(group => group.engagements);
}

export function buildEngagements(playerIntents: CombatIntent[], enemyIntents: CombatIntent[]): Engagement[] {
  const engagements: Engagement[] = [];
  const used = new Set<CombatIntent>();
  const attacks = (items: CombatIntent[]) => items.filter(intent => intent.type !== 'DEF' && intent.targetId);

  for (const enemy of attacks(enemyIntents)) {
    const intercept = attacks(playerIntents).find(player => !used.has(player) && player.targetId === enemy.actorId);
    const selfDefense = playerIntents.find(player => !used.has(player) && player.actorId === enemy.targetId && player.type === 'DEF');
    const directCounter = attacks(playerIntents).find(player => !used.has(player) && player.actorId === enemy.targetId && player.targetId === enemy.actorId);
    const responder = directCounter ?? intercept ?? selfDefense;
    used.add(enemy);
    if (responder) {
      used.add(responder);
      const kind: EngagementKind = responder.type === 'DEF' ? 'self_defense' : responder.actorId === enemy.targetId ? 'clash' : 'intercept';
      engagements.push({ attacker: enemy, responder, protectedId: kind === 'intercept' ? enemy.targetId : undefined, kind, result: resolveCardPair(responder, enemy) });
    } else engagements.push({ attacker: enemy, kind: 'one_sided' });
  }

  for (const player of attacks(playerIntents)) {
    if (used.has(player)) continue;
    const selfDefense = enemyIntents.find(enemy => !used.has(enemy) && enemy.actorId === player.targetId && enemy.type === 'DEF');
    used.add(player);
    if (selfDefense) { used.add(selfDefense); engagements.push({ attacker: player, responder: selfDefense, kind: 'self_defense', result: resolveCardPair(player, selfDefense) }); }
    else engagements.push({ attacker: player, kind: 'one_sided' });
  }
  return engagements;
}
