import type {ActionNode,Fighter,PlayerCommand} from './BattleTypes';
export function buildRoundTimeline(players:Fighter[],enemies:Fighter[],skillsByActor:Map<string,{id:string;name:string;clashPower:number;damage:number;targetId:string}>):ActionNode[]{const nodes:ActionNode[]=[...players.filter(x=>x.alive).map(x=>({id:`${x.id}-action`,team:'player' as const,actorId:x.id,actorIndex:x.actorIndex,speed:x.speed,order:0})),...enemies.filter(x=>x.alive).map(x=>({id:`${x.id}-action`,team:'enemy' as const,actorId:x.id,actorIndex:x.actorIndex,speed:x.speed,order:0,enemySkill:skillsByActor.get(x.id)}))];nodes.sort((a,b)=>b.speed-a.speed||(a.team==='player'?-1:1)).forEach((n,i)=>n.order=i);return nodes}

export function applyPlannedInitiative(timeline:ActionNode[],commands:Map<string,PlayerCommand|null>):ActionNode[]{const delays=new Map<string,number>();for(const command of commands.values())if(command?.targetNodeId&&command.card.delayTarget)delays.set(command.targetNodeId,(delays.get(command.targetNodeId)??0)+command.card.delayTarget);const planned=timeline.map(node=>{const command=commands.get(node.id),tempo=node.team==='enemy'?(node.enemySkill?.tempo??0)-(delays.get(node.id)??0):(command?.card.tempo??0);return{...node,initiative:node.speed+tempo}});planned.sort((a,b)=>(b.initiative??b.speed)-(a.initiative??a.speed)||(a.team==='player'?-1:1)).forEach((node,index)=>node.order=index);return planned}

/** A redirection/cut-in is only legal when the replacement arrives faster. */
export function canIntercept(command:PlayerCommand,target:ActionNode,actorSpeed:number):boolean{
  void command;
  return actorSpeed>(target.initiative??target.speed);
}
