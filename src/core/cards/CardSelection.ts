import type{BattleCard}from'./BattleCards';

export function isCardSelected(selected:BattleCard|undefined,candidate:BattleCard):boolean{
  return selected?.instanceId===candidate.instanceId
}
