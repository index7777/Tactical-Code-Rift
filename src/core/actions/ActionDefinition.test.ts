import { describe, expect, it } from 'vitest';
import { createActionDefinition, type ActionDefinition } from './ActionDefinition';

const base: ActionDefinition = {
  id: 'quick-cut',
  owner: 'player-card',
  name: '迅切',
  targetMode: 'single-enemy',
  hits: [{ damage: 8 }],
  actionDelay: 3,
  statuses: [],
  clash: { mode: 'direct', base: 2, tags: ['blade', 'quick'] },
  telegraph: { level: 'normal' },
  presentationProfile: 'quick-melee',
};

describe('ActionDefinition', () => {
  it('creates a defensive copy of a valid player action', () => {
    const input: ActionDefinition = {
      ...base,
      statuses: [{ id: 'bleed', stacks: 1, durationActions: 2 }],
      guard: { ratio: 0.5, cap: 8 },
    };

    const result = createActionDefinition(input);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
    expect(result.hits).not.toBe(input.hits);
    expect(result.hits[0]).not.toBe(input.hits[0]);
    expect(result.statuses).not.toBe(input.statuses);
    expect(result.clash.tags).not.toBe(input.clash.tags);
  });

  it('represents a multi-hit all-target Boss signature with phase-gated AI metadata', () => {
    const result = createActionDefinition({
      id: 'rain-boss:storm-crosscut',
      owner: 'enemy',
      name: '驟雨連刃',
      targetMode: 'all-enemies',
      hits: [{ damage: 6, repeats: 2 }],
      actionDelay: 7,
      targetDelay: 1,
      statuses: [{ id: 'pressure', magnitude: 1 }],
      clash: { mode: 'direct', base: 5, tags: ['blade', 'boss'] },
      telegraph: { level: 'signature', cue: 'storm-crosscut' },
      ai: { weight: 2.5, cooldownActions: 2, minPhase: 2, maxPhase: 3 },
      presentationProfile: 'boss-signature',
    });

    expect(result.targetMode).toBe('all-enemies');
    expect(result.hits).toEqual([{ damage: 6, repeats: 2 }]);
    expect(result.ai).toEqual({ weight: 2.5, cooldownActions: 2, minPhase: 2, maxPhase: 3 });
    expect(result.telegraph.level).toBe('signature');
  });

  it('represents Guard, Delay, Interrupt and Break without requiring damage hits', () => {
    expect(
      createActionDefinition({
        ...base,
        id: 'guard',
        targetMode: 'self',
        hits: [],
        guard: { ratio: 0.5, cap: 8 },
        clash: { mode: 'guard-intercept', base: 2, tags: ['guard'] },
        presentationProfile: 'guard',
      }).guard,
    ).toEqual({ ratio: 0.5, cap: 8 });

    expect(createActionDefinition({ ...base, id: 'delay', hits: [], targetDelay: 2 }).targetDelay).toBe(2);
    expect(createActionDefinition({ ...base, id: 'interrupt', hits: [], interrupt: true }).interrupt).toBe(true);
    expect(
      createActionDefinition({ ...base, id: 'break', hits: [], breakWindow: 'armor-break', presentationProfile: 'break' })
        .breakWindow,
    ).toBe('armor-break');
  });

  it('allows a semantic no-op only for the explicit none/none presentation action', () => {
    expect(
      createActionDefinition({
        id: 'wait-marker',
        owner: 'enemy',
        name: '等待',
        targetMode: 'none',
        hits: [],
        actionDelay: 0,
        statuses: [],
        clash: { mode: 'none', tags: [] },
        telegraph: { level: 'normal' },
        presentationProfile: 'none',
      }).id,
    ).toBe('wait-marker');

    expect(() => createActionDefinition({ ...base, id: 'empty', hits: [] })).toThrow(
      'action must define at least one semantic effect',
    );
  });

  it('rejects invalid numeric fields', () => {
    expect(() => createActionDefinition({ ...base, actionDelay: -1 })).toThrow('actionDelay');
    expect(() => createActionDefinition({ ...base, actionDelay: 1.5 })).toThrow('actionDelay');
    expect(() => createActionDefinition({ ...base, hits: [{ damage: -1 }] })).toThrow('damage');
    expect(() => createActionDefinition({ ...base, hits: [{ damage: 1, repeats: 0 }] })).toThrow('repeats');
    expect(() => createActionDefinition({ ...base, targetDelay: 1.5 })).toThrow('targetDelay');
    expect(() => createActionDefinition({ ...base, guard: { ratio: 1.2 } })).toThrow('guard.ratio');
    expect(() => createActionDefinition({ ...base, statuses: [{ id: 'x', stacks: 0 }] })).toThrow('stacks');
  });

  it('rejects contradictory Clash metadata', () => {
    expect(() =>
      createActionDefinition({ ...base, clash: { mode: 'none', base: 1, tags: [] } }),
    ).toThrow('forbidden');
    expect(() =>
      createActionDefinition({ ...base, clash: { mode: 'direct', tags: [] } }),
    ).toThrow('required');
  });

  it('rejects invalid enemy AI phase ranges and cooldowns', () => {
    expect(() =>
      createActionDefinition({ ...base, owner: 'enemy', ai: { weight: 1, cooldownActions: -1 } }),
    ).toThrow('cooldownActions');
    expect(() =>
      createActionDefinition({ ...base, owner: 'enemy', ai: { weight: 1, minPhase: 3, maxPhase: 2 } }),
    ).toThrow('minPhase');
  });
});
