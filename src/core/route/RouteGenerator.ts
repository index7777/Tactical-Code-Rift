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
