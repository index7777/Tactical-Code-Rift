import{dealEnemySkillsForArchetypes}from'../battle/EnemySkills';import{resolveMonsterClashPower,resolveMonsterHit}from'../battle/MonsterRules';import type{EnemyArchetype,EnemySkill}from'../battle/BattleTypes';import{commitPlayedCards,createTeamDeckState,cycleUncommittedCards,refillHand,type BattleCard,type TeamDeckState}from'../cards/BattleCards';

type Strategy='tactical'|'naive';
interface SimActor{hp:number;shield:number;balance:number;alive:boolean;archetype?:EnemyArchetype;traitReady:boolean;exposed:boolean;broken:boolean}
export interface CombatSimulationReport{samples:number;strategy:Strategy;winRate:number;averageRounds:number;averageSurvivors:number;timeoutRate:number;defeatRate:number}
const roles:EnemyArchetype[]=['swift','crusher','hexer','swift'];
const seeded=(seed:number)=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const hostile=(card:BattleCard)=>card.intent==='attack'||card.intent==='disruption';

function hurt(actor:SimActor,damage:number,balanceDamage=1){const blocked=Math.min(actor.shield,damage);actor.shield-=blocked;actor.hp-=damage-blocked;actor.balance-=balanceDamage;if(actor.balance<=0){actor.hp-=4;actor.balance=8;actor.broken=true}if(actor.hp<=0){actor.hp=0;actor.alive=false}}
function pickTarget(players:SimActor[],random:()=>number){const living=players.map((actor,index)=>({actor,index})).filter(x=>x.actor.alive);return living[Math.floor(random()*living.length)]?.index??-1}
function cardScore(card:BattleCard,role:EnemyArchetype,strategy:Strategy){if(strategy==='naive')return card.clashPower*10+card.tempo;let score=card.clashPower*8+card.tempo;if(role==='swift')score+=card.tempo*4;if(role==='crusher'&&card.definitionId==='break')score+=38;if(role==='hexer'&&(card.definitionId==='break'||card.definitionId==='delay'))score+=26;if(role==='hexer'&&card.clashPower>=7)score-=20;if(card.definitionId==='relay')score+=7;return score}

function simulateOne(seed:number,strategy:Strategy,maxRounds=18){
  const random=seeded(seed),players:SimActor[]=Array.from({length:4},()=>({hp:44,shield:0,balance:8,alive:true,traitReady:true,exposed:false,broken:false})),enemies:SimActor[]=roles.map(archetype=>({hp:40,shield:0,balance:8,alive:true,archetype,traitReady:true,exposed:false,broken:false}));let deck:TeamDeckState=refillHand(createTeamDeckState(random),5,random);
  for(let round=1;round<=maxRounds;round++){
    players.forEach(actor=>{actor.broken=false});enemies.forEach(actor=>{actor.traitReady=true;actor.exposed=false;actor.broken=false});
    const livingEnemyIndexes=enemies.map((enemy,index)=>({enemy,index})).filter(x=>x.enemy.alive).map(x=>x.index),roundRoles=livingEnemyIndexes.map(index=>roles[index]!),skills=dealEnemySkillsForArchetypes(roundRoles,random),intents=skills.map((skill,index)=>({skill:{...skill,id:`s-${round}-${index}`,targetId:''}as EnemySkill,enemyIndex:livingEnemyIndexes[index]!,targetIndex:pickTarget(players,random)}));
    const available=[...deck.hand],played:BattleCard[]=[];let actions=players.filter(actor=>actor.alive).length;
    for(const intent of intents.sort((a,b)=>b.skill.clashPower-a.skill.clashPower)){
      if(actions<=0)break;const role=roles[intent.enemyIndex]!,candidates=available.filter(hostile).sort((a,b)=>cardScore(b,role,strategy)-cardScore(a,role,strategy));let card:BattleCard|undefined=candidates.find(candidate=>resolveMonsterClashPower(role,candidate)>=intent.skill.clashPower)??candidates[0];
      if(!card){card=available.find(candidate=>candidate.definitionId==='guard'||candidate.definitionId==='cover')}
      if(!card)continue;available.splice(available.indexOf(card),1);played.push(card);actions--;
      const playerIndex=intent.targetIndex<0?pickTarget(players,random):intent.targetIndex,player=players[playerIndex];if(!player?.alive)continue;
      if(card.definitionId==='guard'){player.shield+=card.shield??0;hurt(player,intent.skill.damage,intent.skill.balanceDamage??1);intent.targetIndex=-1;continue}
      if(card.definitionId==='cover'){if(card.clashPower>=intent.skill.clashPower)intent.targetIndex=-1;else{player.shield+=card.shield??0;hurt(player,intent.skill.damage,intent.skill.balanceDamage??1);intent.targetIndex=-1}continue}
      if(resolveMonsterClashPower(role,card)>=intent.skill.clashPower){const enemy=enemies[intent.enemyIndex]!,hit=resolveMonsterHit(role,card,enemy);if(hit.consumeTrait)enemy.traitReady=false;hurt(enemy,hit.damage,hit.balanceDamage);enemy.exposed=enemy.alive;if(card.assist&&enemy.alive)hurt(enemy,6,2);if(hit.backlashBalance&&player.alive)hurt(player,0,hit.backlashBalance);intent.targetIndex=-1}
    }
    if(actions>0){const cycle=available.find(card=>card.definitionId==='cycle');if(cycle&&available.filter(card=>!hostile(card)).length>=2){played.push(cycle);const protectedIds=new Set(played.map(card=>card.instanceId)),result=cycleUncommittedCards(deck,protectedIds,cycle.cycleCount??0,random);deck=result.state;actions--}}
    for(const intent of intents)if(intent.targetIndex>=0){const target=players[intent.targetIndex]?.alive?players[intent.targetIndex]:players[pickTarget(players,random)];if(target)hurt(target,intent.skill.damage,intent.skill.balanceDamage??1)}
    deck=commitPlayedCards(deck,played);deck=refillHand(deck,5,random);
    if(enemies.every(enemy=>!enemy.alive))return{outcome:'victory' as const,round,survivors:players.filter(player=>player.alive).length};
    if(players.every(player=>!player.alive))return{outcome:'defeat' as const,round,survivors:0}
  }
  return{outcome:'timeout' as const,round:maxRounds,survivors:players.filter(player=>player.alive).length}
}

export function simulateCombat(samples=3000,strategy:Strategy='tactical'):CombatSimulationReport{let wins=0,defeats=0,timeouts=0,rounds=0,survivors=0;for(let sample=1;sample<=samples;sample++){const result=simulateOne(sample,strategy);if(result.outcome==='victory')wins++;else if(result.outcome==='defeat')defeats++;else timeouts++;rounds+=result.round;survivors+=result.survivors}return{samples,strategy,winRate:wins/samples,averageRounds:rounds/samples,averageSurvivors:survivors/samples,timeoutRate:timeouts/samples,defeatRate:defeats/samples}}
