import type{EnemySkill}from'./BattleTypes';
export const RAIN_BOSS_MAX_HP=96;
export const RAIN_BOSS_MAX_BALANCE=12;
const rainSlash={name:'雨斬・終',clashPower:8,damage:18,tempo:-1,balanceDamage:3,cue:'heavy' as const};
const shadowChain={name:'山影連刃',clashPower:6,damage:12,tempo:2,balanceDamage:2,assist:true,cue:'swift' as const};
export function rainBossSkill(round:number,isolated=false):Omit<EnemySkill,'id'|'targetId'>{const base=round%2===1?rainSlash:shadowChain;return isolated?{...base,name:`${base.name}・孤站`,clashPower:base.clashPower+1,damage:base.damage+2}:base}
export function lowestHpTarget<T extends{id:string;hp:number;alive:boolean}>(actors:Iterable<T>):string|undefined{return[...actors].filter(actor=>actor.alive).sort((a,b)=>a.hp-b.hp||a.id.localeCompare(b.id))[0]?.id}
