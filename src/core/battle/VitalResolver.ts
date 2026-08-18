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

// 崩勢定義（CURRENT_COMBAT_SPEC.md）：架勢歸零時追加 4 HP 內傷、balance 重置為 8、
// broken flag 維持到本輪演出結束（由外層在下輪建立時清除）。
export const BROKEN_HP_PENALTY = 4;
export const BROKEN_BALANCE_REFILL = 8;

export function resolveDamage(state: VitalState, damage: number, balanceDamage = 1): DamageResult {
  if (!state.alive) return { ...state, blocked: 0, hpLoss: 0, justBroken: false, justShattered: false, died: false };
  const blocked = Math.min(state.shield, damage);
  const shield = state.shield - blocked;
  const directHpLoss = damage - blocked;
  const rawBalance = state.balance - balanceDamage;
  const justBroken = !state.broken && rawBalance <= 0;
  const brokenHpPenalty = justBroken ? BROKEN_HP_PENALTY : 0;
  const hp = Math.max(0, state.hp - directHpLoss - brokenHpPenalty);
  const balance = justBroken ? BROKEN_BALANCE_REFILL : Math.max(0, rawBalance);
  const justShattered = state.shield > 0 && shield === 0;
  const died = hp === 0;
  const hpLoss = state.hp - hp;
  return { hp, shield, balance, alive: !died, broken: state.broken || justBroken, blocked, hpLoss, justBroken, justShattered, died };
}
