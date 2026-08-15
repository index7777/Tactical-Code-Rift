export type BrokenClashAction='clash'|'player-one-sided'|'enemy-one-sided'|'cancel-both';

export function brokenClashAction(playerBroken:boolean,enemyBroken:boolean):BrokenClashAction{
  if(playerBroken&&enemyBroken)return'cancel-both';
  if(enemyBroken)return'player-one-sided';
  if(playerBroken)return'enemy-one-sided';
  return'clash'
}
