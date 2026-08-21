export type BattlefieldMode='rail-halt'|'mountain-cut'|'forest-path'|'terminal-platform'|'rooftop'|'wayside'|'exploration';

export function normalizeBattlefieldMode(value:string|null|undefined):BattlefieldMode{
  return value==='rail-halt'||value==='mountain-cut'||value==='forest-path'||value==='terminal-platform'||value==='wayside'||value==='exploration'||value==='rooftop'?value:'rail-halt';
}
