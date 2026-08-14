export type CardType = 'ATK' | 'DEF' | 'ULT';
export interface ActionCard { type: CardType; power: number }
export type ClashOutcome = 'cancel' | 'player_break' | 'enemy_break' | 'player_block' | 'enemy_block' | 'player_ult' | 'enemy_ult' | 'ult_cancel' | 'guard';
export interface ClashStep { index: number; player: ActionCard; enemy: ActionCard; outcome: ClashOutcome; playerDamage: number; enemyDamage: number }
export interface Frontline { enemyX: number; playerX: number }
export const MIN_CLASH_GAP = 144;

export function settleClashAtContact(midpoint: number, step: ClashStep): Frontline {
  if (step.enemyDamage > 0) return { enemyX: midpoint - 130, playerX: midpoint + 14 };
  if (step.playerDamage > 0) return { enemyX: midpoint - 14, playerX: midpoint + 130 };
  return { enemyX: midpoint - MIN_CLASH_GAP / 2, playerX: midpoint + MIN_CLASH_GAP / 2 };
}

export function returnClashToFormation(front: Frontline, step: ClashStep): Frontline {
  if (step.enemyDamage > 0) return { enemyX: front.enemyX - 110, playerX: front.playerX };
  if (step.playerDamage > 0) return { enemyX: front.enemyX, playerX: front.playerX + 110 };
  return { ...front };
}

export function advanceFrontline(front: Frontline, step: ClashStep): Frontline {
  const midpoint = (front.enemyX + front.playerX) / 2;
  let enemyX: number;
  let playerX: number;
  if (step.enemyDamage > 0) { enemyX = front.enemyX - 110; playerX = front.playerX - 70; }
  else if (step.playerDamage > 0) { enemyX = front.enemyX + 70; playerX = front.playerX + 110; }
  else { enemyX = midpoint - MIN_CLASH_GAP / 2; playerX = midpoint + MIN_CLASH_GAP / 2; }
  if (playerX - enemyX < MIN_CLASH_GAP) {
    const center = (enemyX + playerX) / 2;
    enemyX = center - MIN_CLASH_GAP / 2;
    playerX = center + MIN_CLASH_GAP / 2;
  }
  return { enemyX, playerX };
}

export function resolveCardPair(player: ActionCard, enemy: ActionCard, index = 0): ClashStep {
  if (player.type === 'ULT' || enemy.type === 'ULT') {
    if (player.type === 'ULT' && enemy.type === 'ULT') return { index, player, enemy, outcome: 'ult_cancel', playerDamage: 0, enemyDamage: 0 };
    return { index, player, enemy, outcome: player.type === 'ULT' ? 'player_ult' : 'enemy_ult', playerDamage: enemy.type === 'ULT' ? enemy.power : 0, enemyDamage: player.type === 'ULT' ? player.power : 0 };
  }
  if (player.type === 'DEF' && enemy.type === 'DEF') return { index, player, enemy, outcome: 'guard', playerDamage: 0, enemyDamage: 0 };
  if (player.type === 'ATK' && enemy.type === 'ATK') {
    if (player.power === enemy.power) return { index, player, enemy, outcome: 'cancel', playerDamage: 0, enemyDamage: 0 };
    const playerWins = player.power > enemy.power;
    return { index, player, enemy, outcome: playerWins ? 'player_break' : 'enemy_break', playerDamage: playerWins ? 0 : enemy.power - player.power, enemyDamage: playerWins ? player.power - enemy.power : 0 };
  }
  const playerAttacks = player.type === 'ATK';
  const attack = playerAttacks ? player : enemy; const defense = playerAttacks ? enemy : player;
  const diff = attack.power - defense.power;
  if (diff === 0) return { index, player, enemy, outcome: playerAttacks ? 'enemy_block' : 'player_block', playerDamage: 0, enemyDamage: 0 };
  if (diff > 0) return { index, player, enemy, outcome: playerAttacks ? 'player_break' : 'enemy_break', playerDamage: playerAttacks ? 0 : diff, enemyDamage: playerAttacks ? diff : 0 };
  return { index, player, enemy, outcome: playerAttacks ? 'enemy_block' : 'player_block', playerDamage: 0, enemyDamage: 0 };
}

export function resolveRelay(playerCards: ActionCard[], enemyCards: ActionCard[]): ClashStep[] {
  if (playerCards.length !== enemyCards.length || playerCards.length < 1 || playerCards.length > 3) throw new RangeError('Relay length must match and be 1–3.');
  return playerCards.map((card, index) => resolveCardPair(card, enemyCards[index]!, index));
}
