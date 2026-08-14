export interface Point{x:number;y:number}
const formations:Record<number,Point[]>={1:[{x:0,y:0}],2:[{x:0,y:-45},{x:0,y:45}],3:[{x:20,y:0},{x:-25,y:-65},{x:-25,y:65}],4:[{x:15,y:-35},{x:15,y:45},{x:-40,y:-85},{x:-40,y:95}]};
export function standbyPosition(team:'player'|'enemy',count:number,index:number):Point{const p=formations[count]![index]!;return{x:(team==='player'?1040:240)+(team==='player'?p.x:-p.x),y:220+p.y}}
export const clashPositions=()=>({enemy:{x:560,y:235},player:{x:720,y:235}});
