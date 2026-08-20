import{describe,expect,it}from'vitest';
import{createTeamDeck}from'../cards/BattleCards';
import{resolveBattleBeats}from'./ClashResolver';
import{planPlayerRelayContinuations}from'./RelayPlanner';
import type{ActionNode,PlayerCommand}from'./BattleTypes';

describe('relay continuation planning',()=>{
  it('attaches a later relay card to a tie on the same enemy',()=>{
    const cards=createTeamDeck(),breakCard=cards.find(card=>card.definitionId==='break')!,relayCard=cards.find(card=>card.definitionId==='relay')!;
    const pa:ActionNode={id:'rin-action',team:'player',actorId:'rin',actorIndex:0,speed:8,order:0};
    const pb:ActionNode={id:'chikage-action',team:'player',actorId:'chikage',actorIndex:1,speed:6,order:2};
    const ea:ActionNode={id:'EA-action',team:'enemy',actorId:'EA',actorIndex:0,speed:7,order:1,enemySkill:{id:'EA-skill',name:'牽制',clashPower:6,damage:5,targetId:'rin'}};
    const commands=new Map<string,PlayerCommand|null>([
      [pa.id,{nodeId:pa.id,actorId:'rin',card:breakCard,targetNodeId:ea.id,targetActorId:'EA'}],
      [pb.id,{nodeId:pb.id,actorId:'chikage',card:relayCard,targetNodeId:ea.id,targetActorId:'EA'}],
    ]);
    const beats=resolveBattleBeats([pa,ea,pb],commands),links=planPlayerRelayContinuations(beats);
    expect(beats[0]?.kind).toBe('clash');
    expect(links.get(ea.id)?.actorId).toBe('chikage');
  });

  it('does not attach relay after a lost clash or to a different enemy',()=>{
    const links=planPlayerRelayContinuations([]);
    expect(links.size).toBe(0);
  });
});
