export type BattleMusicKind='normal'|'boss';
export function battleMusicKind(journeyNodeId?:string):BattleMusicKind{return journeyNodeId?.startsWith('boss-')?'boss':'normal'}
export function battleMusicKey(kind:BattleMusicKind){return kind==='boss'?'boss-battle-music':'battle-music'}
