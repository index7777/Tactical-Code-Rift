import type{DeathStyle}from'./DeathPresenter';

export function deathExitPlan(enemy:boolean,style:DeathStyle){
  const impact=style==='heavy'?190:style==='relay'?150:120;
  return{impact,fade:style==='heavy'?430:320,removeFromField:enemy};
}
