import type{BattleCard}from'../cards/BattleCards';import type{EnemyArchetype}from'./BattleTypes';

export type MonsterRuleCue='afterimage'|'stone-guard'|'hex-reversal';
export interface MonsterHitContext{exposed:boolean;broken:boolean;traitReady:boolean}
export interface MonsterHitResult{damage:number;balanceDamage:number;backlashBalance:number;consumeTrait:boolean;cue?:MonsterRuleCue}
export function resolveMonsterClashPower(archetype:EnemyArchetype|undefined,card:Pick<BattleCard,'definitionId'|'clashPower'|'tempo'>){if(archetype==='swift'&&card.tempo<=0)return Math.max(0,card.clashPower-2);if(archetype==='crusher'&&card.definitionId!=='break')return Math.max(0,card.clashPower-1);if(archetype==='hexer'&&card.clashPower>=7&&card.definitionId!=='break'&&card.definitionId!=='delay')return Math.max(0,card.clashPower-2);return card.clashPower}

export function resolveMonsterHit(archetype:EnemyArchetype|undefined,card:Pick<BattleCard,'definitionId'|'clashPower'|'tempo'|'damage'|'balanceDamage'>,context:MonsterHitContext):MonsterHitResult{
  let damage=card.damage??0,balanceDamage=card.balanceDamage??1,backlashBalance=0,consumeTrait=false,cue:MonsterRuleCue|undefined;
  if(archetype==='swift'&&card.tempo<=0&&!context.exposed&&!context.broken){damage=Math.max(1,damage-4);cue='afterimage'}
  if(archetype==='crusher'&&context.traitReady){consumeTrait=true;if(card.definitionId==='break'){balanceDamage+=2;cue='stone-guard'}else{damage=Math.max(1,damage-5);cue='stone-guard'}}
  if(archetype==='hexer'&&card.clashPower>=7&&card.definitionId!=='break'&&card.definitionId!=='delay'&&!context.exposed&&!context.broken){damage=Math.max(1,damage-4);backlashBalance=2;cue='hex-reversal'}
  return{damage,balanceDamage,backlashBalance,consumeTrait,cue}
}
