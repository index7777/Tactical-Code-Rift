export type BattlefieldMode='rooftop'|'wayside'|'exploration';

export function normalizeBattlefieldMode(value:string|null|undefined):BattlefieldMode{
  return value==='wayside'||value==='exploration'?value:'rooftop';
}
