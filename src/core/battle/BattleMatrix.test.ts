import {describe,expect,it} from 'vitest';
import {buildRoundTimeline} from './RoundPlanner';
import {resolveBattleBeats} from './ClashResolver';
import type {Fighter,PlayerCommand} from './BattleTypes';
import {createTeamDeck} from '../cards/BattleCards';
import {standbyPosition} from '../../presentation/battle/BattleLayout';

const fighter=(id:string,team:'player'|'enemy',index:number,speed:number):Fighter=>({id,team,actorIndex:index,speed,alive:true});
const code=(team:'P'|'E',index:number)=>`${team}${String.fromCharCode(65+index)}`;

describe('1v1 through 4v4 combat matrix',()=>{
  for(let playerCount=1;playerCount<=4;playerCount++)for(let enemyCount=1;enemyCount<=4;enemyCount++){
    it(`${playerCount}v${enemyCount} builds valid actors, targets and distinct standby positions`,()=>{
      const players=Array.from({length:playerCount},(_,i)=>fighter(code('P',i),'player',i,9-i));
      const enemies=Array.from({length:enemyCount},(_,i)=>fighter(code('E',i),'enemy',i,8-i));
      const skills=new Map(enemies.map((e,i)=>[e.id,{id:`${e.id}-skill`,name:'測試攻擊',clashPower:6,damage:10,targetId:players[i%playerCount]!.id}]));
      const timeline=buildRoundTimeline(players,enemies,skills);
      expect(timeline).toHaveLength(playerCount+enemyCount);
      expect(new Set(timeline.map(n=>n.id)).size).toBe(timeline.length);
      expect(timeline.filter(n=>n.team==='enemy').every(n=>players.some(p=>p.id===n.enemySkill?.targetId))).toBe(true);
      for(const team of ['player','enemy'] as const){const count=team==='player'?playerCount:enemyCount;const points=Array.from({length:count},(_,i)=>standbyPosition(team,count,i));expect(new Set(points.map(p=>`${p.x},${p.y}`)).size).toBe(count)}
    });

    it(`${playerCount}v${enemyCount} preserves every player-to-enemy target choice`,()=>{
      const players=Array.from({length:playerCount},(_,i)=>fighter(code('P',i),'player',i,10-i));
      const enemies=Array.from({length:enemyCount},(_,i)=>fighter(code('E',i),'enemy',i,6-i));
      const skills=new Map(enemies.map((e,i)=>[e.id,{id:`${e.id}-skill`,name:'測試攻擊',clashPower:6,damage:10,targetId:players[i%playerCount]!.id}]));
      const timeline=buildRoundTimeline(players,enemies,skills),attackCard=createTeamDeck().find(card=>card.intent==='attack')!;
      for(const player of players)for(const enemy of enemies){
        const commands=new Map<string,PlayerCommand|null>();
        players.forEach(p=>commands.set(`${p.id}-action`,p.id===player.id?{nodeId:`${p.id}-action`,actorId:p.id,card:attackCard,targetNodeId:`${enemy.id}-action`,targetActorId:enemy.id}:null));
        const beats=resolveBattleBeats(timeline,commands);
        expect(beats.some(b=>(b.kind==='clash'&&b.clash.player.actorId===player.id&&b.clash.enemy.actorId===enemy.id)||(b.kind==='player-one-sided'&&b.command.actorId===player.id&&b.command.targetActorId===enemy.id))).toBe(true);
        expect(beats.filter(b=>b.kind==='skip')).toHaveLength(playerCount-1);
      }
    });
  }
});
