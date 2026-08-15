import type{BattleBeat,PlayerCommand}from'./BattleTypes';

export function planPlayerRelayContinuations(beats:readonly BattleBeat[]):Map<string,PlayerCommand>{
  const links=new Map<string,PlayerCommand>(),used=new Set<string>();
  beats.forEach((beat,index)=>{
    if(beat.kind!=='clash'||beat.clash.winner==='enemy')return;
    const targetId=beat.clash.enemy.actorId;
    const relay=beats.slice(index+1).find((candidate):candidate is Extract<BattleBeat,{kind:'player-one-sided'}>=>
      candidate.kind==='player-one-sided'&&candidate.command.card.assist===true&&candidate.command.targetActorId===targetId&&!used.has(candidate.command.nodeId));
    if(!relay)return;
    links.set(beat.clash.enemy.id,relay.command);used.add(relay.command.nodeId)
  });
  return links
}
