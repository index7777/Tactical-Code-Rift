import { describe, expect, it } from 'vitest';
import { createControlResilience } from '../status/ControlResilience';
import { createIntentState } from './IntentState';
import { interruptIntent, resolveIntentDelay } from './IntentResolver';

const baseIntent = createIntentState({
  id: 'ghost-fire:dash',
  enemyId: 'ghost-fire',
  kind: 'normal',
  name: '鬼火疾走',
  targetIds: ['mo'],
  damage: 20,
  delay: 5,
  canDelay: true,
  canInterrupt: true,
  canGuard: true,
  canRedirect: true,
  statusEffects: ['burn'],
});

describe('IntentResolver', () => {
  it('delays a delayable intent without changing its semantic payload', () => {
    const result = resolveIntentDelay(baseIntent, createControlResilience(0, 0), 2);

    expect(result.actualDelay).toBe(2);
    expect(result.delayed).toBe(true);
    expect(result.intent).toEqual(baseIntent);
    expect(result.intent).not.toBe(baseIntent);
    expect(result.resilience).toEqual({ base: 0, temporary: 1 });
  });

  it('applies resilience and explicit ignored resilience', () => {
    const result = resolveIntentDelay(baseIntent, createControlResilience(1, 1), 3, 1);

    expect(result.effectiveResilience).toBe(2);
    expect(result.ignoredResilience).toBe(1);
    expect(result.actualDelay).toBe(2);
    expect(result.resilience).toEqual({ base: 1, temporary: 2 });
  });

  it('does not delay or build temporary resilience when intent forbids delay', () => {
    const undelayable = createIntentState({ ...baseIntent, id: 'boss:iai', canDelay: false });
    const resilience = createControlResilience(1, 2);
    const result = resolveIntentDelay(undelayable, resilience, 5);

    expect(result.actualDelay).toBe(0);
    expect(result.delayed).toBe(false);
    expect(result.resilience).toEqual(resilience);
  });

  it('replaces an interruptible intent with hard stagger on the same action delay', () => {
    const result = interruptIntent(baseIntent);

    expect(result.interrupted).toBe(true);
    expect(result.original).toEqual(baseIntent);
    expect(result.intent).toMatchObject({
      enemyId: 'ghost-fire',
      kind: 'hard-stagger',
      name: '硬直',
      targetIds: [],
      delay: 5,
      canDelay: false,
      canInterrupt: false,
    });
    expect(result.intent.damage).toBeUndefined();
    expect(result.intent.statusEffects).toEqual([]);
  });

  it('keeps a non-interruptible intent unchanged', () => {
    const locked = createIntentState({ ...baseIntent, id: 'boss:iai', canInterrupt: false });
    const result = interruptIntent(locked);

    expect(result.interrupted).toBe(false);
    expect(result.intent).toEqual(locked);
  });
});
