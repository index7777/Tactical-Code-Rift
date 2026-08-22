export interface EnemyVisualContactSchedule {
  primaryOffsetMs: 0;
  additionalOffsetsMs: readonly number[];
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

export function enemyVisualContactSchedule(
  hitCount: number,
  impactRecoveryWindowMs: number,
): EnemyVisualContactSchedule {
  assertPositiveInteger(hitCount, 'enemy visual hitCount');
  assertNonNegativeInteger(impactRecoveryWindowMs, 'enemy visual impact/recovery window');

  if (hitCount === 1) {
    return { primaryOffsetMs: 0, additionalOffsetsMs: [] };
  }

  const additionalOffsetsMs = Array.from({ length: hitCount - 1 }, (_, index) => {
    const numerator = impactRecoveryWindowMs * (index + 1);
    return Math.max(1, Math.floor(numerator / hitCount));
  });

  return {
    primaryOffsetMs: 0,
    additionalOffsetsMs,
  };
}
