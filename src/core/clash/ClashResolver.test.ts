import { describe, expect, it } from 'vitest';
import { createActionDefinition, type ActionDefinition } from '../actions/ActionDefinition';
import { resolveClashPreview } from './ClashResolver';

function playerAction(overrides: Partial<ActionDefinition> = {}): ActionDefinition {
  return createActionDefinition({
    id: 'player:quick-clash',
    owner: 'player-card',
    name: '迅切',
    targetMode: 'single-enemy',
    hits: [{ damage: 8 }],
    actionDelay: 3,
    statuses: [],
    clash: { mode: 'direct', base: 5, tags: ['melee', 'blade'] },
    telegraph: { level: 'normal' },
    presentationProfile: 'quick-melee',
    ...overrides,
  });
}

function enemyAction(overrides: Partial<ActionDefinition> = {}): ActionDefinition {
  return createActionDefinition({
    id: 'enemy:iai',
    owner: 'enemy',
    name: '居合',
    targetMode: 'single-enemy',
    hits: [{ damage: 16 }],
    actionDelay: 7,
    statuses: [],
    clash: { mode: 'direct', base: 6, tags: ['melee', 'blade'] },
    telegraph: { level: 'danger' },
    counterplay: {
      delayable: true,
      interruptible: true,
      guardable: true,
      redirectable: false,
    },
    presentationProfile: 'enemy-heavy',
    ...overrides,
  });
}

const defaultContext = {
  sameTargetRelationship: true,
  player: {},
  enemy: {},
};

describe('ClashResolver', () => {
  it('resolves direct versus direct Clash deterministically', () => {
    const result = resolveClashPreview(playerAction(), enemyAction(), defaultContext);

    expect(result).toEqual({
      eligible: true,
      playerScore: { base: 5, timing: 0, specialization: 0, state: 0, total: 5 },
      enemyScore: { base: 6, timing: 0, specialization: 0, state: 0, total: 6 },
      outcome: 'enemy-win',
    });
  });

  it('rejects actions whose Clash mode is none', () => {
    const playerDisabled = playerAction({ clash: { mode: 'none', tags: [] } });
    const enemyDisabled = enemyAction({ clash: { mode: 'none', tags: [] } });

    expect(resolveClashPreview(playerDisabled, enemyAction(), defaultContext)).toEqual({
      eligible: false,
      reason: 'player-clash-disabled',
    });
    expect(resolveClashPreview(playerAction(), enemyDisabled, defaultContext)).toEqual({
      eligible: false,
      reason: 'enemy-clash-disabled',
    });
  });

  it('rejects a different target relationship', () => {
    expect(
      resolveClashPreview(playerAction(), enemyAction(), {
        ...defaultContext,
        sameTargetRelationship: false,
      }),
    ).toEqual({ eligible: false, reason: 'different-target-relationship' });
  });

  it('allows guard intercept only against a guardable direct enemy action', () => {
    const guard = playerAction({
      id: 'player:guard-clash',
      hits: [],
      guard: { ratio: 0.5, cap: 8 },
      clash: { mode: 'guard-intercept', base: 5, tags: ['melee'] },
      presentationProfile: 'guard',
    });

    expect(resolveClashPreview(guard, enemyAction(), defaultContext)).toMatchObject({ eligible: true });

    const unguardable = enemyAction({
      counterplay: {
        delayable: true,
        interruptible: true,
        guardable: false,
        redirectable: false,
      },
    });

    expect(resolveClashPreview(guard, unguardable, defaultContext)).toEqual({
      eligible: false,
      reason: 'enemy-not-guardable',
    });
  });

  it('treats empty tags as unrestricted and rejects incompatible authored tags', () => {
    expect(
      resolveClashPreview(
        playerAction({ clash: { mode: 'direct', base: 5, tags: [] } }),
        enemyAction({ clash: { mode: 'direct', base: 6, tags: ['projectile'] } }),
        defaultContext,
      ),
    ).toMatchObject({ eligible: true });

    expect(
      resolveClashPreview(
        playerAction({ clash: { mode: 'direct', base: 5, tags: ['blade'] } }),
        enemyAction({ clash: { mode: 'direct', base: 6, tags: ['projectile'] } }),
        defaultContext,
      ),
    ).toEqual({ eligible: false, reason: 'tag-incompatible' });
  });

  it('applies signed timing, specialization and state modifiers and clamps at zero', () => {
    const result = resolveClashPreview(playerAction(), enemyAction(), {
      sameTargetRelationship: true,
      player: { timing: 2, specialization: 1, state: -1 },
      enemy: { timing: -10 },
    });

    expect(result).toMatchObject({
      eligible: true,
      playerScore: { base: 5, timing: 2, specialization: 1, state: -1, total: 7 },
      enemyScore: { base: 6, timing: -10, specialization: 0, state: 0, total: 0 },
      outcome: 'player-win',
    });
  });

  it('returns player-win, draw and enemy-win from the same score rule', () => {
    expect(
      resolveClashPreview(playerAction(), enemyAction(), {
        ...defaultContext,
        player: { timing: 2 },
      }),
    ).toMatchObject({ eligible: true, outcome: 'player-win' });

    expect(
      resolveClashPreview(playerAction(), enemyAction(), {
        ...defaultContext,
        player: { timing: 1 },
      }),
    ).toMatchObject({ eligible: true, outcome: 'draw' });

    expect(resolveClashPreview(playerAction(), enemyAction(), defaultContext)).toMatchObject({
      eligible: true,
      outcome: 'enemy-win',
    });
  });

  it('rejects fractional modifiers', () => {
    expect(() =>
      resolveClashPreview(playerAction(), enemyAction(), {
        ...defaultContext,
        player: { timing: 0.5 },
      }),
    ).toThrow('player.timing must be an integer');
  });

  it('does not mutate action definitions and repeated calls are identical', () => {
    const player = playerAction();
    const enemy = enemyAction();
    const playerSnapshot = structuredClone(player);
    const enemySnapshot = structuredClone(enemy);

    const first = resolveClashPreview(player, enemy, defaultContext);
    const second = resolveClashPreview(player, enemy, defaultContext);

    expect(second).toEqual(first);
    expect(player).toEqual(playerSnapshot);
    expect(enemy).toEqual(enemySnapshot);
  });
});
