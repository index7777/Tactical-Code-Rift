export type NodeType='battle'|'event'|'treasure'|'shop'|'elite'|'boss';
export interface RouteNode{index:number;type:NodeType}
const weightedPool:NodeType[]=[...Array<NodeType>(40).fill('battle'),...Array<NodeType>(25).fill('event'),...Array<NodeType>(15).fill('treasure'),...Array<NodeType>(12).fill('shop'),...Array<NodeType>(8).fill('elite')];
export function generatePrototypeRoute(length:number,random=Math.random):RouteNode[]{if(!Number.isInteger(length)||length<5||length>7)throw new RangeError('Prototype route length must be an integer from 5 to 7.');const types:NodeType[]=[];for(let index=0;index<length-2;index+=1){let candidate=weightedPool[Math.floor(random()*weightedPool.length)]??'battle';if(candidate==='shop'&&types.at(-1)==='shop')candidate='battle';types.push(candidate)}types.push('elite','boss');return types.map((type,index)=>({index,type}))}

export type StoryNodeType='departure'|'battle'|'event'|'exploration'|'companion'|'elite'|'boss';
export interface StoryRouteNode{id:string;column:number;lane:number;type:StoryNodeType;nextIds:string[];implemented:boolean}
export interface StoryRoute{nodes:StoryRouteNode[];startId:string;bossId:string}

export function generateStoryRoute(random:()=>number=Math.random):StoryRoute{
  void random;
  const nodes:StoryRouteNode[]=[
    {id:'depart',column:0,lane:1,type:'departure',nextIds:['battle-1'],implemented:true},
    {id:'battle-1',column:1,lane:1,type:'battle',nextIds:['battle-2-upper','battle-2-lower'],implemented:true},
    {id:'battle-2-upper',column:2,lane:0,type:'battle',nextIds:['battle-3-upper'],implemented:true},
    {id:'battle-2-lower',column:2,lane:2,type:'battle',nextIds:['battle-3-lower'],implemented:true},
    {id:'battle-3-upper',column:3,lane:0,type:'battle',nextIds:['elite-1'],implemented:true},
    {id:'battle-3-lower',column:3,lane:2,type:'battle',nextIds:['elite-1'],implemented:true},
    {id:'elite-1',column:4,lane:1,type:'elite',nextIds:['boss-1'],implemented:true},
    {id:'boss-1',column:5,lane:1,type:'boss',nextIds:[],implemented:true},
  ];
  return{nodes,startId:'depart',bossId:'boss-1'}
}

export interface JourneyState{route:StoryRoute;currentNodeId:string;visitedIds:string[];pendingNodeId?:string}
export function createJourneyState(random:()=>number=Math.random):JourneyState{const route=generateStoryRoute(random);return{route,currentNodeId:route.startId,visitedIds:[route.startId]}}
export function availableStoryNodes(state:JourneyState){const current=state.route.nodes.find(n=>n.id===state.currentNodeId);return(current?.nextIds??[]).map(id=>state.route.nodes.find(n=>n.id===id)!).filter(Boolean)}
export function moveJourney(state:JourneyState,nodeId:string):JourneyState{if(!availableStoryNodes(state).some(n=>n.id===nodeId))throw new Error('Story node is not connected to the current position.');return{...state,currentNodeId:nodeId,visitedIds:[...state.visitedIds,nodeId],pendingNodeId:nodeId}}
