export interface VitalState {
  hp: number;
  shield: number;
  balance: number;
  alive: boolean;
  broken: boolean;
}

export interface DamageResult extends VitalState {
  blocked: number;
  hpLoss: number;
  justBroken: boolean;
  justShattered: boolean;
  died: boolean;
}

export function resolveDamage(state: VitalState, damage: number, balanceDamage = 1): DamageResult {
  if (!state.alive) return { ...state, blocked: 0, hpLoss: 0, justBroken: false, justShattered: false, died: false };
  const blocked = Math.min(state.shield, damage);
  const shield = state.shield - blocked;
  const hpLoss = damage - blocked;
  const hp = Math.max(0, state.hp - hpLoss);
  const balance = Math.max(0, state.balance - balanceDamage);
  const justBroken = !state.broken && balance === 0;
  const justShattered = state.shield > 0 && shield === 0;
  const died = hp === 0;
  return { hp, shield, balance, alive: !died, broken: state.broken || justBroken, blocked, hpLoss, justBroken, justShattered, died };
}
