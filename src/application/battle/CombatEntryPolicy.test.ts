import { describe, expect, it } from 'vitest';
import { resolveCombatEntry } from './CombatEntryPolicy';

describe('CombatEntryPolicy', () => {
  it('defaults to refactored combat with no query string', () => {
    expect(resolveCombatEntry('')).toEqual({
      mode: 'refactor',
      attachRefactorRuntime: true,
    });
  });

  it('keeps the old combat-refactor flag compatible with the new default', () => {
    expect(resolveCombatEntry('?combat-refactor=1')).toEqual({
      mode: 'refactor',
      attachRefactorRuntime: true,
    });
  });

  it('uses legacy combat only when the rollback flag is explicitly enabled', () => {
    expect(resolveCombatEntry('?legacy-combat=1')).toEqual({
      mode: 'legacy',
      attachRefactorRuntime: false,
    });
  });

  it('gives the explicit legacy rollback flag precedence over compatibility flags', () => {
    expect(resolveCombatEntry('?combat-refactor=1&legacy-combat=1')).toEqual({
      mode: 'legacy',
      attachRefactorRuntime: false,
    });
  });

  it('does not treat other legacy-combat values as rollback requests', () => {
    expect(resolveCombatEntry('?legacy-combat=0')).toEqual({
      mode: 'refactor',
      attachRefactorRuntime: true,
    });
  });
});
