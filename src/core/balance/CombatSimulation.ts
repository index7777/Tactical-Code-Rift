import{dealEnemySkillsForArchetypes}from'../battle/EnemySkills';
import{readMonsterRule,resolveMonsterClashPower,resolveMonsterHit}from'../battle/MonsterRules';
import type{EnemyArchetype,EnemySkill}from'../battle/BattleTypes';
import{commitPlayedCards,createTeamDeckState,refillHand,type BattleCard,type CardFamily,type TeamDeckState}from'../cards/BattleCards';

type Strategy='tactical'|'naive';
interface SimActor{hp:number;shield:number;balance:number;alive:boolean;archetype?:EnemyArchetype;traitReady:boolean;exposed:boolean;broken:boolean}
export interface MonsterSimulationStat{populationShare:number;damageShare:number;pressureIndex:number;killShare:number;ruleTriggers:number;counterRate:number}
export interface CardSimulationStat{usageRate:number;successRate:number;averageDamage:number;unusedRate:number}
export interface CombatSimulationReport{samples:number;strategy:Strategy;winRate:number;averageRounds:number;averageSurvivors:number;timeoutRate:number;defeatRate:number;averageFirstPlayerBreakRound:number;relayDamageShare:number;survivorDistribution:Record<string,number>;monsters:Record<EnemyArchetype,MonsterSimulationStat>;cards:Record<CardFamily,CardSimulationStat>}
interface Counters{monsterDamage:Record<EnemyArchetype,number>;monsterKills:Record<EnemyArchetype,number>;ruleTriggers:Record<EnemyArchetype,number>;ruleCounters:Record<EnemyArchetype,number>;cardPlays:Record<CardFamily,number>;cardHits:Record<CardFamily,number>;cardDamage:Record<CardFamily,number>;cardSeen:Record<CardFamily,number>;cardUnused:Record<CardFamily,number>;relayDamage:number;playerDamage:number;firstPlayerBreakRounds:number[]}
const roles:EnemyArchetype[]=['swift','crusher','hexer','swift'];
const families:CardFamily[]=['quick','heavy','break','guard','cover','relay','cycle','delay'];
const recordOf=<T extends string>(keys:readonly T[])=>Object.fromEntries(keys.map(key=>[key,0]))as Record<T,number>;
const counters=():Counters=>({monsterDamage:recordOf(roles),monsterKills:recordOf(roles),ruleTriggers:recordOf(roles),ruleCounters:recordOf(roles),cardPlays:recordOf(families),cardHits:recordOf(families),cardDamage:recordOf(families),cardSeen:recordOf(families),cardUnused:recordOf(families),relayDamage:0,playerDamage:0,firstPlayerBreakRounds:[]});
const seeded=(seed:number)=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const hostile=(card:BattleCard)=>card.intent==='attack'||card.intent==='disruption';
function hurt(actor:SimActor,damage:number,balanceDamage=1){const beforeHp=actor.hp,wasBroken=actor.broken,blocked=Math.min(actor.shield,damage);actor.shield-=blocked;actor.hp-=damage-blocked;actor.balance-=balanceDamage;if(actor.balance<=0){actor.hp-=4;actor.balance=8;actor.broken=true}if(actor.hp<=0){actor.hp=0;actor.alive=false}return{hpLoss:beforeHp-actor.hp,died:!actor.alive,broke:!wasBroken&&actor.broken}}
function pickTarget(players:SimActor[],random:()=>number){const living=players.map((actor,index)=>({actor,index})).filter(x=>x.actor.alive);return living[Math.floor(random()*living.length)]?.index??-1}
function cardScore(card:BattleCard,role:EnemyArchetype,strategy:Strategy){if(strategy==='naive')return card.clashPower*10+card.tempo;let score=card.clashPower*8+card.tempo;if(role==='swift')score+=card.tempo*4;if(role==='crusher'&&card.definitionId==='break')score+=38;if(role==='hexer'&&(card.definitionId==='break'||card.definitionId==='delay'))score+=26;if(role==='hexer'&&card.clashPower>=7)score-=20;if(card.definitionId==='relay')score+=7;return score}

function simulateOne(seed:number,strategy:Strategy,metrics:Counters,maxRounds=18){
  const random=seeded(seed),players:SimActor[]=Array.from({length:4},()=>({hp:44,shield:0,balance:8,alive:true,traitReady:true,exposed:false,broken:false})),enemies:SimActor[]=roles.map(archetype=>({hp:40,shield:0,balance:8,alive:true,archetype,traitReady:true,exposed:false,broken:false}));let deck:TeamDeckState=refillHand(createTeamDeckState(random),5,random),firstPlayerBreak=0;
  const enemyHurts=(target:SimActor,skill:EnemySkill,role:EnemyArchetype,round:number)=>{const result=hurt(target,skill.damage,skill.balanceDamage??1);metrics.monsterDamage[role]+=result.hpLoss;metrics.playerDamage+=result.hpLoss;if(result.died)metrics.monsterKills[role]++;if(result.broke&&!firstPlayerBreak){firstPlayerBreak=round;metrics.firstPlayerBreakRounds.push(round)}};
  for(let round=1;round<=maxRounds;round++){
    players.forEach(actor=>{actor.broken=false});enemies.forEach(actor=>{actor.traitReady=true;actor.exposed=false;actor.broken=false});deck.hand.forEach(card=>metrics.cardSeen[card.definitionId]++);
    const livingEnemyIndexes=enemies.map((enemy,index)=>({enemy,index})).filter(x=>x.enemy.alive).map(x=>x.index),roundRoles=livingEnemyIndexes.map(index=>roles[index]!),skills=dealEnemySkillsForArchetypes(roundRoles,random),intents=skills.map((skill,index)=>({skill:{...skill,id:`s-${round}-${index}`,targetId:''}as EnemySkill,enemyIndex:livingEnemyIndexes[index]!,targetIndex:pickTarget(players,random)}));
    const available=[...deck.hand],played:BattleCard[]=[];let actions=players.filter(actor=>actor.alive).length;
    for(const intent of intents.sort((a,b)=>b.skill.clashPower-a.skill.clashPower)){
      if(actions<=0)break;const role=roles[intent.enemyIndex]!,candidates=available.filter(hostile).sort((a,b)=>cardScore(b,role,strategy)-cardScore(a,role,strategy));let card:BattleCard|undefined=candidates.find(candidate=>resolveMonsterClashPower(role,candidate)>=intent.skill.clashPower)??candidates[0];
      if(!card)card=available.find(candidate=>candidate.definitionId==='guard'||candidate.definitionId==='cover');if(!card)continue;available.splice(available.indexOf(card),1);played.push(card);metrics.cardPlays[card.definitionId]++;actions--;
      const playerIndex=intent.targetIndex<0?pickTarget(players,random):intent.targetIndex,player=players[playerIndex];if(!player?.alive)continue;
      if(card.definitionId==='guard'){metrics.cardHits.guard++;player.shield+=card.shield??0;enemyHurts(player,intent.skill,role,round);intent.targetIndex=-1;continue}
      if(card.definitionId==='cover'){player.shield+=card.shield??0;if(card.clashPower>=intent.skill.clashPower)metrics.cardHits.cover++;else enemyHurts(player,intent.skill,role,round);intent.targetIndex=-1;continue}
      const enemy=enemies[intent.enemyIndex]!,read=readMonsterRule(role,card,enemy);if(read.state==='danger')metrics.ruleTriggers[role]++;else if(read.state==='counter')metrics.ruleCounters[role]++;
      if(resolveMonsterClashPower(role,card)>=intent.skill.clashPower){const hit=resolveMonsterHit(role,card,enemy);if(hit.consumeTrait)enemy.traitReady=false;const dealt=hurt(enemy,hit.damage,hit.balanceDamage);metrics.cardHits[card.definitionId]++;metrics.cardDamage[card.definitionId]+=dealt.hpLoss;enemy.exposed=enemy.alive;if(card.assist&&enemy.alive){const relay=hurt(enemy,6,2);metrics.relayDamage+=relay.hpLoss;metrics.cardDamage[card.definitionId]+=relay.hpLoss}if(hit.backlashBalance&&player.alive){const backlash=hurt(player,0,hit.backlashBalance);if(backlash.broke&&!firstPlayerBreak){firstPlayerBreak=round;metrics.firstPlayerBreakRounds.push(round)}}intent.targetIndex=-1}
    }
    if(actions>0){const cycle=available.find(card=>card.definitionId==='cycle'),target=players.filter(actor=>actor.alive).sort((a,b)=>a.balance-b.balance)[0];if(cycle&&target&&target.balance<8){played.push(cycle);target.balance=Math.min(8,target.balance+(cycle.restoreBalance??0));target.exposed=cycle.clearExposed?false:target.exposed;metrics.cardPlays.cycle++;metrics.cardHits.cycle++;actions--}}
    available.filter(card=>!played.some(used=>used.instanceId===card.instanceId)).forEach(card=>metrics.cardUnused[card.definitionId]++);
    for(const intent of intents)if(intent.targetIndex>=0){const target=players[intent.targetIndex]?.alive?players[intent.targetIndex]:players[pickTarget(players,random)];if(target)enemyHurts(target,intent.skill,roles[intent.enemyIndex]!,round)}
    deck=commitPlayedCards(deck,played);deck=refillHand(deck,5,random);
    if(enemies.every(enemy=>!enemy.alive))return{outcome:'victory' as const,round,survivors:players.filter(player=>player.alive).length};if(players.every(player=>!player.alive))return{outcome:'defeat' as const,round,survivors:0}
  }
  return{outcome:'timeout' as const,round:maxRounds,survivors:players.filter(player=>player.alive).length}
}

export function simulateCombat(samples=3000,strategy:Strategy='tactical'):CombatSimulationReport{
  let wins=0,defeats=0,timeouts=0,rounds=0,survivors=0;const metrics=counters(),survivorCounts=recordOf(['0','1','2','3','4']as const);
  for(let sample=1;sample<=samples;sample++){const result=simulateOne(sample,strategy,metrics);if(result.outcome==='victory')wins++;else if(result.outcome==='defeat')defeats++;else timeouts++;rounds+=result.round;survivors+=result.survivors;survivorCounts[String(result.survivors)as keyof typeof survivorCounts]++}
  const totalMonsterDamage=Object.values(metrics.monsterDamage).reduce((sum,value)=>sum+value,0),totalMonsterKills=Object.values(metrics.monsterKills).reduce((sum,value)=>sum+value,0),totalCardPlays=Object.values(metrics.cardPlays).reduce((sum,value)=>sum+value,0);
  const monsters=Object.fromEntries((['swift','crusher','hexer']as EnemyArchetype[]).map(role=>{const interactions=metrics.ruleTriggers[role]+metrics.ruleCounters[role],populationShare=roles.filter(value=>value===role).length/roles.length,damageShare=totalMonsterDamage?metrics.monsterDamage[role]/totalMonsterDamage:0;return[role,{populationShare,damageShare,pressureIndex:populationShare?damageShare/populationShare:0,killShare:totalMonsterKills?metrics.monsterKills[role]/totalMonsterKills:0,ruleTriggers:metrics.ruleTriggers[role],counterRate:interactions?metrics.ruleCounters[role]/interactions:0}]}))as Record<EnemyArchetype,MonsterSimulationStat>;
  const cards=Object.fromEntries(families.map(family=>[family,{usageRate:totalCardPlays?metrics.cardPlays[family]/totalCardPlays:0,successRate:metrics.cardPlays[family]?metrics.cardHits[family]/metrics.cardPlays[family]:0,averageDamage:metrics.cardPlays[family]?metrics.cardDamage[family]/metrics.cardPlays[family]:0,unusedRate:metrics.cardSeen[family]?metrics.cardUnused[family]/metrics.cardSeen[family]:0}]))as Record<CardFamily,CardSimulationStat>;
  const totalPlayerDamage=Object.values(metrics.cardDamage).reduce((sum,value)=>sum+value,0);
  return{samples,strategy,winRate:wins/samples,averageRounds:rounds/samples,averageSurvivors:survivors/samples,timeoutRate:timeouts/samples,defeatRate:defeats/samples,averageFirstPlayerBreakRound:metrics.firstPlayerBreakRounds.length?metrics.firstPlayerBreakRounds.reduce((sum,value)=>sum+value,0)/metrics.firstPlayerBreakRounds.length:0,relayDamageShare:totalPlayerDamage?metrics.relayDamage/totalPlayerDamage:0,survivorDistribution:Object.fromEntries(Object.entries(survivorCounts).map(([key,value])=>[key,value/samples])),monsters,cards}
}
