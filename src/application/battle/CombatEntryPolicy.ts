export type CombatEntryMode = 'refactor' | 'legacy';

export interface CombatEntryDecision {
  mode: CombatEntryMode;
  attachRefactorRuntime: boolean;
}

/**
 * Phase 10 entry policy.
 *
 * The refactored battle is now the default. Legacy combat remains available
 * only as an explicit rollback path during cutover verification.
 */
export function resolveCombatEntry(search: string): CombatEntryDecision {
  const params = new URLSearchParams(search);
  const legacyRequested = params.get('legacy-combat') === '1';

  if (legacyRequested) {
    return {
      mode: 'legacy',
      attachRefactorRuntime: false,
    };
  }

  return {
    mode: 'refactor',
    attachRefactorRuntime: true,
  };
}
