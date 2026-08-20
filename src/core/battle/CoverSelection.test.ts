import { describe, expect, it } from 'vitest';
import { selectCoverIntent } from './CoverSelection';
import type { ActionNode } from './BattleTypes';

const enemy=(id:string,targetId:string,speed:number,tempo=0):ActionNode=>({id:`${id}-action`,actorId:id,actorIndex:0,team:'enemy',speed,order:0,enemySkill:{id:`${id}-skill`,name:'斬',clashPower:5,damage:8,targetId,tempo}});

describe('cover selection',()=>{
  it('requires an explicit enemy when multiple intents share a target',()=>{
    const result=selectCoverIntent({timeline:[enemy('EA','rin',5),enemy('EB','rin',4)],commands:new Map(),actorId:'chikage',actorSpeed:9,cardTempo:2,selectedActorId:'rin'});
    expect(result).toEqual({ok:false,reason:'multiple'})
  });
  it('includes enemy skill tempo in the speed check',()=>{
    const result=selectCoverIntent({timeline:[enemy('EA','rin',8,3)],commands:new Map(),actorId:'chikage',actorSpeed:9,cardTempo:2,selectedActorId:'rin',selectedEnemyId:'EA'});
    expect(result).toEqual({ok:false,reason:'slow'})
  });
});
