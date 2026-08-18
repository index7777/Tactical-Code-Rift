export interface VitalState {
  hp: number;
  shield: number;
  // 臨時護甲：由護符（guard）加給，回合結束時由 StatusLifecycle 清零；
  // 吸收傷害的順位優先於 shield（永久護甲，目前實作中未使用但保留欄位）。
  tempShield: number;
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
  // 先吃臨時護甲（tempShield），扣光後再吃永久護甲（shield）。
  const tempAbsorb = Math.min(state.tempShield, damage);
  const tempShield = state.tempShield - tempAbsorb;
  const remainingAfterTemp = damage - tempAbsorb;
  const shieldAbsorb = Math.min(state.shield, remainingAfterTemp);
  const shield = state.shield - shieldAbsorb;
  const blocked = tempAbsorb + shieldAbsorb;
  const directHpLoss = damage - blocked;
  const rawBalance = state.balance - balanceDamage;
  const justBroken = !state.broken && rawBalance <= 0;
  const brokenHpPenalty = justBroken ? BROKEN_HP_PENALTY : 0;
  const hp = Math.max(0, state.hp - directHpLoss - brokenHpPenalty);
  const balance = justBroken ? BROKEN_BALANCE_REFILL : Math.max(0, rawBalance);
  const justShattered = (state.tempShield > 0 || state.shield > 0) && tempShield === 0 && shield === 0;
  const died = hp === 0;
  const hpLoss = state.hp - hp;
  return { hp, shield, tempShield, balance, alive: !died, broken: state.broken || justBroken, blocked, hpLoss, justBroken, justShattered, died };
}
