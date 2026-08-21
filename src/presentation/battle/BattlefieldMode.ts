export type BattlefieldMode='rail-halt'|'rooftop'|'wayside'|'exploration';

export function normalizeBattlefieldMode(value:string|null|undefined):BattlefieldMode{
  return value==='rail-halt'||value==='wayside'||value==='exploration'||value==='rooftop'?value:'rail-halt';
}
