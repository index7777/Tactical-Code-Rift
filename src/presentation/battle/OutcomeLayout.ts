export interface OutcomeButtonPosition{x:number;y:number;primary:boolean}

export function outcomeButtonLayout(result:'victory'|'defeat'):{retry?:OutcomeButtonPosition;continue?:OutcomeButtonPosition}{
  if(result==='defeat')return{retry:{x:640,y:394,primary:true}};
  return{continue:{x:640,y:394,primary:true}}
}
