import { dealEnemySkillsForArchetypes } from '../battle/EnemySkills';
import type { EnemyArchetype } from '../battle/BattleTypes';
import { createTeamDeck, shuffleCards, type BattleCard } from '../cards/BattleCards';

export interface BalanceSimulationReport { samples:number; highestThreatCoverage:number; averageIntentCoverage:number; deadHandRate:number; utilityCongestionRate:number; averageHeavyCards:number }
const roles:EnemyArchetype[]=['swift','crusher','hexer','swift'];
const seeded=(seed:number)=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const usable=(card:BattleCard)=>card.intent==='attack'||card.intent==='disruption'||card.definitionId==='cover'||card.definitionId==='guard';

export function simulateSharedDeck(samples=5000):BalanceSimulationReport{
  let highestCovered=0,coverage=0,deadHands=0,congestedHands=0,heavyCards=0;
  for(let sample=1;sample<=samples;sample++){
    const random=seeded(sample),hand=shuffleCards(createTeamDeck(),random).slice(0,5),enemies=dealEnemySkillsForArchetypes(roles,random);
    const direct=hand.filter(card=>card.intent==='attack'||card.intent==='disruption').map(card=>card.clashPower).sort((a,b)=>b-a),threats=enemies.map(skill=>skill.clashPower).sort((a,b)=>b-a),used=new Set<number>();let matched=0;
    for(const threat of threats){const index=direct.findIndex((power,cardIndex)=>!used.has(cardIndex)&&power>=threat);if(index>=0){used.add(index);matched++}}
    matched=Math.min(threats.length,matched+hand.filter(card=>card.definitionId==='guard'||card.definitionId==='cover').length);
    if(Math.max(...hand.map(card=>card.clashPower))>=Math.max(...threats))highestCovered++;
    coverage+=matched/threats.length;if(hand.filter(usable).length<3)deadHands++;if(hand.filter(card=>card.intent==='support'||card.intent==='defense').length>=4)congestedHands++;heavyCards+=hand.filter(card=>card.definitionId==='heavy').length
  }
  return{samples,highestThreatCoverage:highestCovered/samples,averageIntentCoverage:coverage/samples,deadHandRate:deadHands/samples,utilityCongestionRate:congestedHands/samples,averageHeavyCards:heavyCards/samples}
}
