import type { ActionNode, BattleBeat, ClashPair, PlayerCommand } from './BattleTypes';

const isHostile = (command: PlayerCommand) => command.card.intent === 'attack' || command.card.intent === 'disruption';

export function resolveBattleBeats(timeline: ActionNode[], commands: Map<string, PlayerCommand | null>): BattleBeat[] {
  const playerNodes = new Map(timeline.filter((node) => node.team === 'player').map((node) => [node.id, node]));
  const activeCommands = [...commands.values()].filter((command): command is PlayerCommand => Boolean(command));
  const usedPlayers = new Set<string>();
  const usedEnemies = new Set<string>();
  const clashes: ClashPair[] = [];

  // Pair per enemy, not per command. The original target gets first right to a
  // direct clash; only then may a faster ally redirect or cover that attack.
  for (const enemy of timeline.filter((node) => node.team === 'enemy')) {
    if (!enemy.enemySkill || enemy.enemySkill.unclashable) continue;
    const incomingTarget = enemy.enemySkill.targetId;
    const available = activeCommands.filter((command) => !usedPlayers.has(command.nodeId));

    const explicitCover = available.find((command) => {
      const player = playerNodes.get(command.nodeId);
      return command.card.definitionId === 'cover' &&
        command.targetNodeId === enemy.id &&
        command.targetActorId === incomingTarget &&
        Boolean(player && (player.initiative ?? player.speed) > (enemy.initiative ?? enemy.speed));
    });

    const direct = available.find((command) =>
      command.actorId === incomingTarget &&
      ((isHostile(command) && command.targetNodeId === enemy.id) ||
        (command.card.definitionId === 'guard' && command.targetActorId === incomingTarget)),
    );

    const cover = available
      .filter((command) => {
        const player = playerNodes.get(command.nodeId);
        if (!player || (player.initiative ?? player.speed) <= (enemy.initiative ?? enemy.speed)) return false;
        const attacksEnemy = isHostile(command) && command.targetNodeId === enemy.id;
        return attacksEnemy;
      })
      .sort((a, b) => (playerNodes.get(b.nodeId)!.initiative ?? playerNodes.get(b.nodeId)!.speed) - (playerNodes.get(a.nodeId)!.initiative ?? playerNodes.get(a.nodeId)!.speed))[0];

    // A player-selected cover line is an explicit reservation. It must not be
    // stolen later by the original target's direct command.
    const command = explicitCover ?? direct ?? cover;
    if (!command) continue;
    const playerPower = command.card.clashPower;
    const enemyPower = enemy.enemySkill.clashPower;
    clashes.push({
      player: command,
      enemy,
      source: direct ? 'direct' : 'intercept',
      playerPower,
      enemyPower,
      winner: playerPower === enemyPower ? 'tie' : playerPower > enemyPower ? 'player' : 'enemy',
    });
    usedPlayers.add(command.nodeId);
    usedEnemies.add(enemy.id);
  }

  const beats: BattleBeat[] = [];
  for (const node of timeline) {
    if (node.team === 'player') {
      const command = commands.get(node.id);
      if (command === null) beats.push({ kind: 'skip', order: node.order, actorId: node.actorId });
      else if (command && !usedPlayers.has(node.id)) {
        if (command.card.definitionId === 'cover') beats.push({ kind: 'skip', order: node.order, actorId: node.actorId });
        else beats.push({
          kind: command.card.intent === 'support' || command.card.intent === 'defense' ? 'support' : 'player-one-sided',
          order: node.order,
          command,
        });
      }
    } else if (!usedEnemies.has(node.id)) {
      beats.push({ kind: 'enemy-one-sided', order: node.order, enemy: node });
    }
    const clash = clashes.find((candidate) => candidate.enemy.id === node.id || candidate.player.nodeId === node.id);
    if (clash && !beats.some((beat) => beat.kind === 'clash' && beat.clash === clash)) {
      beats.push({ kind: 'clash', order: Math.min(node.order, playerNodes.get(clash.player.nodeId)!.order), clash });
    }
  }
  return beats.sort((a, b) => a.order - b.order);
}
