import type{BattleCard}from'../cards/BattleCards';import type{EnemyArchetype}from'./BattleTypes';

export type MonsterRuleCue='afterimage'|'stone-guard'|'hex-reversal';
export interface MonsterHitContext{exposed:boolean;broken:boolean;traitReady:boolean}
export interface MonsterHitResult{damage:number;balanceDamage:number;backlashBalance:number;consumeTrait:boolean;cue?:MonsterRuleCue}
export interface MonsterRuleRead{state:'danger'|'counter'|'neutral';label:string}
export function readMonsterRule(archetype:EnemyArchetype|undefined,card:Pick<BattleCard,'definitionId'|'clashPower'|'tempo'>,context:Pick<MonsterHitContext,'exposed'|'broken'|'traitReady'>):MonsterRuleRead{
  if(context.exposed||context.broken)return{state:'counter',label:'破綻'};
  if(archetype==='swift')return card.tempo>0?{state:'counter',label:'追上殘影'}:{state:'danger',label:'殘影'};
  if(archetype==='crusher'&&context.traitReady)return card.definitionId==='break'?{state:'counter',label:'碎甲'}:{state:'danger',label:'厚甲'};
  if(archetype==='hexer')return card.definitionId==='break'||card.definitionId==='delay'?{state:'counter',label:'斷咒'}:card.clashPower>=7?{state:'danger',label:'咒返'}:{state:'neutral',label:''};
  return{state:'neutral',label:''}
}
export function resolveMonsterClashPower(archetype:EnemyArchetype|undefined,card:Pick<BattleCard,'definitionId'|'clashPower'|'tempo'>){if(archetype==='swift'&&card.tempo<=0)return Math.max(0,card.clashPower-2);if(archetype==='crusher'&&card.definitionId!=='break')return Math.max(0,card.clashPower-1);if(archetype==='hexer'&&card.clashPower>=7&&card.definitionId!=='break'&&card.definitionId!=='delay')return Math.max(0,card.clashPower-2);return card.clashPower}

export function resolveMonsterHit(archetype:EnemyArchetype|undefined,card:Pick<BattleCard,'definitionId'|'clashPower'|'tempo'|'damage'|'balanceDamage'>,context:MonsterHitContext):MonsterHitResult{
  let damage=card.damage??0,balanceDamage=card.balanceDamage??1,backlashBalance=0,consumeTrait=false,cue:MonsterRuleCue|undefined;
  if(archetype==='swift'&&card.tempo<=0&&!context.exposed&&!context.broken){damage=Math.max(1,damage-4);cue='afterimage'}
  if(archetype==='crusher'&&context.traitReady){consumeTrait=true;if(card.definitionId==='break'){balanceDamage+=2;cue='stone-guard'}else{damage=Math.max(1,damage-5);cue='stone-guard'}}
  if(archetype==='hexer'&&card.clashPower>=7&&card.definitionId!=='break'&&card.definitionId!=='delay'&&!context.exposed&&!context.broken){damage=Math.max(1,damage-4);backlashBalance=2;cue='hex-reversal'}
  return{damage,balanceDamage,backlashBalance,consumeTrait,cue}
}
