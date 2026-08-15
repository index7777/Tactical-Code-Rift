import{describe,expect,it}from'vitest';import{applyPlannedInitiative,buildRoundTimeline,canIntercept}from'./RoundPlanner';import{resolveBattleBeats}from'./ClashResolver';import type{Fighter,PlayerCommand}from'./BattleTypes';import{createTeamDeck}from'../cards/BattleCards';
const f=(id:string,team:'player'|'enemy',speed:number,index:number):Fighter=>({id,team,speed,actorIndex:index,alive:true});
describe('current combat architecture',()=>{const ps=[f('PA','player',7,0),f('PB','player',9,1),f('PC','player',5,2)],es=[f('EA','enemy',6,0),f('EB','enemy',8,1)];const skills=new Map([['EA',{id:'ea-s',name:'斬擊',clashPower:6,damage:10,targetId:'PA'}],['EB',{id:'eb-s',name:'突刺',clashPower:7,damage:10,targetId:'PB'}]]);it('creates one base action for each living actor',()=>expect(buildRoundTimeline(ps,es,skills)).toHaveLength(5));it('allows faster redirection but not slower redirection',()=>{const t=buildRoundTimeline(ps,es,skills),enemy=t.find(n=>n.actorId==='EA')!,card=createTeamDeck()[0]!,cmd:PlayerCommand={nodeId:'PB-action',actorId:'PB',card,targetNodeId:enemy.id};expect(canIntercept(cmd,enemy,9)).toBe(true);expect(canIntercept(cmd,enemy,5)).toBe(false)});it('pairs a direct target as a clash and leaves another attack one-sided',()=>{const t=buildRoundTimeline(ps,es,skills),card=createTeamDeck()[1]!,cmds=new Map<string,PlayerCommand|null>([['PB-action',{nodeId:'PB-action',actorId:'PB',card,targetNodeId:'EB-action',targetActorId:'EB'}],['PA-action',{nodeId:'PA-action',actorId:'PA',card:createTeamDeck()[0]!,targetNodeId:'EB-action',targetActorId:'EB'}],['PC-action',null]]);const beats=resolveBattleBeats(t,cmds);expect(beats.some(b=>b.kind==='clash'&&b.clash.enemy.actorId==='EB')).toBe(true);expect(beats.some(b=>b.kind==='player-one-sided'&&b.command.actorId==='PA')).toBe(true);expect(beats.some(b=>b.kind==='skip'&&b.actorId==='PC')).toBe(true)});it('keeps later player beats after the first player loses a clash',()=>{const t=buildRoundTimeline(ps,es,skills),cards=createTeamDeck(),cmds=new Map<string,PlayerCommand|null>([['PB-action',{nodeId:'PB-action',actorId:'PB',card:cards[0]!,targetNodeId:'EB-action',targetActorId:'EB'}],['PA-action',{nodeId:'PA-action',actorId:'PA',card:cards[1]!,targetNodeId:'EB-action',targetActorId:'EB'}],['PC-action',{nodeId:'PC-action',actorId:'PC',card:cards[2]!,targetNodeId:'EA-action',targetActorId:'EA'}]]);const beats=resolveBattleBeats(t,cmds);expect(beats.some(b=>b.kind==='player-one-sided'&&b.command.actorId==='PA')).toBe(true);expect(beats.some(b=>b.kind==='player-one-sided'&&b.command.actorId==='PC')).toBe(true)});
it('gives the original target priority over a faster ally targeting the same enemy',()=>{const t=buildRoundTimeline(ps,es,skills),cards=createTeamDeck(),cmds=new Map<string,PlayerCommand|null>([['PB-action',{nodeId:'PB-action',actorId:'PB',card:cards[0]!,targetNodeId:'EA-action',targetActorId:'EA'}],['PA-action',{nodeId:'PA-action',actorId:'PA',card:cards[1]!,targetNodeId:'EA-action',targetActorId:'EA'}]]);const clash=resolveBattleBeats(t,cmds).find(b=>b.kind==='clash');expect(clash?.kind==='clash'&&clash.clash.player.actorId).toBe('PA')});
it('lets a faster cover card intercept its selected attack aimed at an ally',()=>{const t=buildRoundTimeline(ps,es,skills),cover=createTeamDeck().find(c=>c.definitionId==='cover')!,cmds=new Map<string,PlayerCommand|null>([['PB-action',{nodeId:'PB-action',actorId:'PB',card:cover,targetNodeId:'EA-action',targetActorId:'PA'}]]);const clash=resolveBattleBeats(applyPlannedInitiative(t,cmds),cmds).find(b=>b.kind==='clash');expect(clash?.kind==='clash'&&clash.clash.source).toBe('intercept');expect(clash?.kind==='clash'&&clash.clash.player.actorId).toBe('PB')});
it('reorders the round using card tempo without granting extra actions',()=>{const t=buildRoundTimeline(ps,es,skills),cards=createTeamDeck(),quick=cards.find(c=>c.definitionId==='quick')!,heavy=cards.find(c=>c.definitionId==='heavy')!,cmds=new Map<string,PlayerCommand|null>([['PA-action',{nodeId:'PA-action',actorId:'PA',card:heavy,targetNodeId:'EA-action',targetActorId:'EA'}],['PC-action',{nodeId:'PC-action',actorId:'PC',card:quick,targetNodeId:'EA-action',targetActorId:'EA'}]]),planned=applyPlannedInitiative(t,cmds);expect(planned.find(n=>n.actorId==='PC')!.initiative).toBe(8);expect(planned.find(n=>n.actorId==='PA')!.initiative).toBe(4);expect(planned.filter(n=>n.team==='player')).toHaveLength(3)});
it('binds two cover commands to two distinct killing intents aimed at the same ally',()=>{
  const localPlayers=[f('PA','player',4,0),f('PB','player',10,1),f('PC','player',9,2)];
  const localEnemies=[f('EA','enemy',6,0),f('EB','enemy',5,1)];
  const localSkills=new Map([['EA',{id:'ea-cover',name:'斬擊',clashPower:6,damage:10,targetId:'PA'}],['EB',{id:'eb-cover',name:'突刺',clashPower:5,damage:9,targetId:'PA'}]]);
  const timeline=buildRoundTimeline(localPlayers,localEnemies,localSkills),covers=createTeamDeck().filter(c=>c.definitionId==='cover');
  const commands=new Map<string,PlayerCommand|null>([
    ['PB-action',{nodeId:'PB-action',actorId:'PB',card:covers[0]!,targetNodeId:'EA-action',targetActorId:'PA'}],
    ['PC-action',{nodeId:'PC-action',actorId:'PC',card:covers[1]!,targetNodeId:'EB-action',targetActorId:'PA'}],
  ]);
  const beats=resolveBattleBeats(applyPlannedInitiative(timeline,commands),commands),clashes=beats.filter(b=>b.kind==='clash');
  expect(clashes).toHaveLength(2);
  expect(clashes.map(b=>b.kind==='clash'&&`${b.clash.player.actorId}:${b.clash.enemy.actorId}`)).toEqual(['PB:EA','PC:EB']);
  expect(beats.some(b=>b.kind==='support')).toBe(false);
  expect(beats.some(b=>b.kind==='enemy-one-sided')).toBe(false)
});
it('never lets one cover command consume two killing intents',()=>{
  const localPlayers=[f('PA','player',4,0),f('PB','player',10,1)];
  const localEnemies=[f('EA','enemy',6,0),f('EB','enemy',5,1)];
  const localSkills=new Map([['EA',{id:'ea-cover',name:'斬擊',clashPower:6,damage:10,targetId:'PA'}],['EB',{id:'eb-cover',name:'突刺',clashPower:5,damage:9,targetId:'PA'}]]);
  const timeline=buildRoundTimeline(localPlayers,localEnemies,localSkills),cover=createTeamDeck().find(c=>c.definitionId==='cover')!;
  const commands=new Map<string,PlayerCommand|null>([['PB-action',{nodeId:'PB-action',actorId:'PB',card:cover,targetNodeId:'EA-action',targetActorId:'PA'}]]);
  const beats=resolveBattleBeats(applyPlannedInitiative(timeline,commands),commands);
  expect(beats.filter(b=>b.kind==='clash')).toHaveLength(1);
  expect(beats.filter(b=>b.kind==='enemy-one-sided')).toHaveLength(1)
});
it('moves a restrained enemy two initiative steps later without granting an extra action',()=>{const timeline=buildRoundTimeline(ps,es,skills),delay=createTeamDeck().find(card=>card.definitionId==='delay')!,enemy=timeline.find(node=>node.actorId==='EB')!,command:PlayerCommand={nodeId:'PA-action',actorId:'PA',card:delay,targetNodeId:enemy.id,targetActorId:'EB'},planned=applyPlannedInitiative(timeline,new Map([['PA-action',command]]));expect(planned.find(node=>node.actorId==='EB')!.initiative).toBe(enemy.speed+(enemy.enemySkill?.tempo??0)-2);expect(planned.filter(node=>node.actorId==='EB')).toHaveLength(1)});
it('does not turn an unbound cover into a ghost support movement',()=>{
  const timeline=buildRoundTimeline(ps,es,skills),cover=createTeamDeck().find(c=>c.definitionId==='cover')!;
  const commands=new Map<string,PlayerCommand|null>([['PB-action',{nodeId:'PB-action',actorId:'PB',card:cover,targetActorId:'PA'}]]);
  const beats=resolveBattleBeats(applyPlannedInitiative(timeline,commands),commands);
  expect(beats.some(b=>b.kind==='clash'&&b.clash.player.actorId==='PB')).toBe(false);
  expect(beats.some(b=>b.kind==='support'&&b.command.actorId==='PB')).toBe(false)
});
});
