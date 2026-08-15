import{resolveBattleBeats}from'../../core/battle/ClashResolver';
import{applyPlannedInitiative}from'../../core/battle/RoundPlanner';
import type{ActionNode,BattleBeat,PlayerCommand}from'../../core/battle/BattleTypes';
import type{BattleCard}from'../../core/cards/BattleCards';

export type BattleOutcome='victory'|'defeat'|undefined;
export class CombatResolutionController{
  createPlan(timeline:ActionNode[],commands:Map<string,PlayerCommand|null>):{planned:ActionNode[];beats:BattleBeat[]}{const planned=applyPlannedInitiative(timeline,commands);return{planned,beats:resolveBattleBeats(planned,commands)}}
  committedCards(commands:Map<string,PlayerCommand|null>):BattleCard[]{return[...commands.values()].filter((command):command is PlayerCommand=>Boolean(command)).map(command=>command.card)}
  outcome(players:Iterable<{alive:boolean}>,enemies:Iterable<{alive:boolean}>):BattleOutcome{return![...enemies].some(actor=>actor.alive)?'victory':![...players].some(actor=>actor.alive)?'defeat':undefined}
}
