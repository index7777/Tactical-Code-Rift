export interface GuardReactionState {
  protectorId: string;
  targetId: string;
  guardRatio: number;
  guardCap: number;
}

export interface GuardResolution {
  damageBefore: number;
  damageAfter: number;
  reduction: number;
  consumed: boolean;
}

export function createGuardReaction(
  protectorId: string,
  targetId: string,
  guardRatio = 0.5,
  guardCap = 8,
): GuardReactionState {
  if (!protectorId) throw new Error('guard protectorId is required');
  if (!targetId) throw new Error('guard targetId is required');
  if (!Number.isFinite(guardRatio) || guardRatio < 0 || guardRatio > 1) {
    throw new Error('guardRatio must be within 0..1');
  }
  if (!Number.isFinite(guardCap) || guardCap < 0) {
    throw new Error('guardCap must be non-negative');
  }
  return { protectorId, targetId, guardRatio, guardCap };
}

export function resolveGuardDamage(
  guard: GuardReactionState,
  incomingDamage: number,
): GuardResolution {
  if (!Number.isFinite(incomingDamage) || incomingDamage < 0) {
    throw new Error('incomingDamage must be non-negative');
  }
  const reduction = Math.min(
    Math.floor(incomingDamage * guard.guardRatio),
    guard.guardCap,
  );
  return {
    damageBefore: incomingDamage,
    damageAfter: Math.max(0, incomingDamage - reduction),
    reduction,
    consumed: reduction > 0,
  };
}
