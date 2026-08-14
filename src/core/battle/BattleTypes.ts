import type {BattleCard} from '../cards/BattleCards';
export type Team='player'|'enemy';
export interface Fighter{id:string;team:Team;actorIndex:number;speed:number;alive:boolean}
export interface EnemySkill{id:string;name:string;clashPower:number;damage:number;targetId:string;tempo?:number;unclashable?:boolean;assist?:boolean}
export interface ActionNode{id:string;team:Team;actorId:string;actorIndex:number;speed:number;initiative?:number;order:number;enemySkill?:EnemySkill}
export interface PlayerCommand{nodeId:string;actorId:string;card:BattleCard;targetNodeId?:string;targetActorId?:string}
export interface ClashPair{player:PlayerCommand;enemy:ActionNode;source:'direct'|'intercept';playerPower:number;enemyPower:number;winner:'player'|'enemy'|'tie'}
export type BattleBeat={kind:'clash';order:number;clash:ClashPair}|{kind:'player-one-sided';order:number;command:PlayerCommand}|{kind:'enemy-one-sided';order:number;enemy:ActionNode}|{kind:'support';order:number;command:PlayerCommand}|{kind:'skip';order:number;actorId:string};
