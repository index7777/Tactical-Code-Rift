import { describe, expect, it } from 'vitest';
import {
  createControlResilience,
  effectiveResilience,
  resetTemporaryResilience,
  resolveControlDelay,
} from './ControlResilience';

describe('ControlResilience', () => {
  it('reduces requested delay by base plus temporary resilience', () => {
    const state = createControlResilience(1, 1);
    expect(effectiveResilience(state)).toBe(2);

    const result = resolveControlDelay(state, 4);
    expect(result.actualDelay).toBe(2);
    expect(result.delayed).toBe(true);
    expect(result.state).toEqual({ base: 1, temporary: 2 });
  });

  it('only gains temporary resilience after a successful delay', () => {
    const state = createControlResilience(3, 0);
    const result = resolveControlDelay(state, 2);

    expect(result.actualDelay).toBe(0);
    expect(result.delayed).toBe(false);
    expect(result.state).toEqual(state);
  });

  it('makes repeated successful delays progressively weaker', () => {
    const first = resolveControlDelay(createControlResilience(0, 0), 2);
    const second = resolveControlDelay(first.state, 2);
    const third = resolveControlDelay(second.state, 2);

    expect(first.actualDelay).toBe(2);
    expect(second.actualDelay).toBe(1);
    expect(third.actualDelay).toBe(0);
    expect(third.state).toEqual({ base: 0, temporary: 2 });
  });

  it('supports explicit ignored resilience without mutating stored resilience', () => {
    const state = createControlResilience(1, 1);
    const result = resolveControlDelay(state, 2, 1);

    expect(result.effectiveResilience).toBe(2);
    expect(result.ignoredResilience).toBe(1);
    expect(result.actualDelay).toBe(1);
    expect(state).toEqual({ base: 1, temporary: 1 });
  });

  it('resets temporary resilience after a successful enemy action', () => {
    expect(resetTemporaryResilience(createControlResilience(2, 3))).toEqual({
      base: 2,
      temporary: 0,
    });
  });
});
