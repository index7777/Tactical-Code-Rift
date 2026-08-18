export type CardIntent = 'attack' | 'defense' | 'support' | 'disruption';
export type CardTag = '攻擊' | '防禦' | '干擾' | '突擊' | '破甲' | '支援' | '援攻' | '側襲' | '終結' | '整備' | '牽制';
export type CardFamily = 'quick' | 'heavy' | 'break' | 'guard' | 'cover' | 'relay' | 'cycle' | 'delay';

export interface BattleCard {
  instanceId: string;
  definitionId: CardFamily;
  name: string;
  clashPower: number;
  tempo: number;
  intent: CardIntent;
  tags: CardTag[];
  description: string;
  damage?: number;
  balanceDamage?: number;
  shield?: number;
  assist?: boolean;
  delayTarget?: number;
  restoreBalance?: number;
  clearExposed?: boolean;
}

export interface TeamDeckState { drawPile: BattleCard[]; discardPile: BattleCard[]; exhaustPile: BattleCard[]; hand: BattleCard[] }

export const cardDefinitions: Readonly<Record<CardFamily, Omit<BattleCard, 'instanceId'>>> = {
  quick: { definitionId: 'quick', name: '快斬', clashPower: 5, tempo: 3, intent: 'attack', tags: ['攻擊', '突擊', '側襲'], description: '快攻｜傷害 10｜架勢 1', damage: 10, balanceDamage: 1 },
  heavy: { definitionId: 'heavy', name: '重斬', clashPower: 8, tempo: -3, intent: 'attack', tags: ['攻擊', '終結'], description: '終結｜傷害 16｜架勢 2', damage: 16, balanceDamage: 2 },
  break: { definitionId: 'break', name: '破甲', clashPower: 6, tempo: 0, intent: 'disruption', tags: ['攻擊', '干擾', '破甲'], description: '傷害 9｜架勢 3', damage: 9, balanceDamage: 3 },
  guard: { definitionId: 'guard', name: '堅守', clashPower: 0, tempo: 0, intent: 'defense', tags: ['防禦'], description: '自身｜護符 12', shield: 12 },
  cover: { definitionId: 'cover', name: '掩護', clashPower: 5, tempo: 2, intent: 'defense', tags: ['防禦', '支援'], description: '截斷一條殺意｜護符 9', shield: 9 },
  relay: { definitionId: 'relay', name: '接力', clashPower: 4, tempo: 2, intent: 'attack', tags: ['攻擊', '援攻'], description: '傷害 7｜命中後補刀', damage: 7, balanceDamage: 1, assist: true },
  cycle: { definitionId: 'cycle', name: '整備', clashPower: 0, tempo: -1, intent: 'support', tags: ['支援', '整備'], description: '自身｜架勢 +3｜清除破綻', restoreBalance: 3, clearExposed: true },
  delay: { definitionId: 'delay', name: '牽制', clashPower: 4, tempo: 2, intent: 'disruption', tags: ['攻擊', '干擾', '牽制'], description: '傷害 5｜目標時序 −2', damage: 5, balanceDamage: 1, delayTarget: 2 },
};

export const teamDeckRecipe: readonly CardFamily[] = ['quick','quick','quick','quick','heavy','heavy','break','break','break','guard','cover','cover','relay','relay','cycle','delay','delay','delay'];

export function createTeamDeck(): BattleCard[] { return teamDeckRecipe.map((id,index)=>({...cardDefinitions[id],tags:[...cardDefinitions[id].tags],instanceId:`${id}-${index}`})) }
export function shuffleCards(cards:BattleCard[],random:()=>number=Math.random):BattleCard[]{const result=[...cards];for(let index=result.length-1;index>0;index--){const swap=Math.floor(random()*(index+1));[result[index],result[swap]]=[result[swap]!,result[index]!]}return result}
export const createTeamDeckState=(random:()=>number=Math.random):TeamDeckState=>({drawPile:shuffleCards(createTeamDeck(),random),discardPile:[],exhaustPile:[],hand:[]});
export function refillHand(state:TeamDeckState,limit=5,random:()=>number=Math.random):TeamDeckState{const drawPile=[...state.drawPile],discardPile=[...state.discardPile],hand=[...state.hand];while(hand.length<limit){if(!drawPile.length){if(!discardPile.length)break;drawPile.push(...shuffleCards(discardPile.splice(0),random))}hand.push(drawPile.shift()!)}return{...state,drawPile,discardPile,hand}}
export function commitPlayedCards(state:TeamDeckState,cards:BattleCard[]):TeamDeckState{const ids=new Set(cards.map(card=>card.instanceId));return{...state,hand:state.hand.filter(card=>!ids.has(card.instanceId)),discardPile:[...state.discardPile,...cards],exhaustPile:[...state.exhaustPile]}}
export function discardHandCard(state:TeamDeckState,instanceId:string):TeamDeckState{const card=state.hand.find(item=>item.instanceId===instanceId);if(!card)return state;return{...state,hand:state.hand.filter(item=>item.instanceId!==instanceId),discardPile:[...state.discardPile,card]}}
export function cycleSelectedCards(state:TeamDeckState,protectedIds:ReadonlySet<string>,selectedIds:readonly string[],random:()=>number=Math.random):{state:TeamDeckState;cycled:BattleCard[]}{const requested=[...new Set(selectedIds)];const wanted=new Set(requested),cycled=state.hand.filter(card=>wanted.has(card.instanceId)&&!protectedIds.has(card.instanceId));if(!cycled.length||cycled.length!==requested.length)return{state,cycled:[]};const ids=new Set(cycled.map(card=>card.instanceId)),staged={...state,hand:state.hand.filter(card=>!ids.has(card.instanceId)),discardPile:[...state.discardPile,...cycled]};return{state:refillHand(staged,state.hand.length,random),cycled}}
export function cycleUncommittedCards(state:TeamDeckState,protectedIds:ReadonlySet<string>,count:number,random:()=>number=Math.random):{state:TeamDeckState;cycled:BattleCard[]}{const cycled=state.hand.filter(card=>!protectedIds.has(card.instanceId)).slice(0,count);if(!cycled.length)return{state,cycled};const ids=new Set(cycled.map(card=>card.instanceId)),staged={...state,hand:state.hand.filter(card=>!ids.has(card.instanceId)),discardPile:[...state.discardPile,...cycled]};return{state:refillHand(staged,state.hand.length,random),cycled}}
