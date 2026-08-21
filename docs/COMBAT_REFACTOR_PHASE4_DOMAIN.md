# Combat Refactor Phase 4 Domain Contract

STATUS = AUTHORITATIVE_FOR_PHASE4_IMPLEMENTATION
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Scope

Phase 4 establishes the pure domain rules for enemy Intent, control resilience, and short-lived break windows. This batch must not modify Phaser presentation, `BootScene`, legacy round planning, or the shared-hand presentation.

The goal is to make these rules deterministic and testable before any HUD preview is built.

## Files

Create:

```text
src/core/intents/IntentState.ts
src/core/intents/IntentResolver.ts
src/core/intents/IntentResolver.test.ts
src/core/status/ControlResilience.ts
src/core/status/ControlResilience.test.ts
src/core/status/BreakWindow.ts
src/core/status/BreakWindow.test.ts
```

## IntentState

An Intent is the enemy's already-public next event. It is not a hidden AI choice and it is not a persistent status.

```ts
export type IntentKind = 'normal' | 'hard-stagger';

export interface IntentState {
  id: string;
  enemyId: string;
  kind: IntentKind;
  name: string;
  targetIds: string[];
  damage?: number;
  delay: number;
  canDelay: boolean;
  canInterrupt: boolean;
  canGuard: boolean;
  canRedirect: boolean;
  statusEffects: string[];
}
```

Rules:

- Intent is chosen/revealed after an enemy finishes its current action.
- `delay` is the time cost used when that Intent successfully resolves and the enemy is scheduled again.
- Persistent statuses are not stored in Intent.
- A charge/preparation Intent must describe the eventual public effect through its own data; the renderer will not invent hidden outcomes.

## Delay vs Interrupt

These operations are semantically different.

### Delay

- Keeps the same Intent.
- Changes only when the enemy will perform it.
- If `canDelay === false`, requested delay resolves to 0 and does not increase temporary resilience.

### Interrupt

- Requires `canInterrupt === true`.
- Replaces the current Intent with a `hard-stagger` Intent.
- Does not delete the enemy.
- The hard-stagger event remains on the same current Timeline node; this phase does not move it.
- For v1, hard-stagger preserves the interrupted Intent's action `delay`. This avoids creating an implicit bonus scheduling rule in the interrupt system. Tuning may later provide explicit stagger Delay data.
- After hard-stagger successfully resolves, the application layer must request a new enemy Intent.

## Control Resilience

```ts
export interface ControlResilienceState {
  base: number;
  temporary: number;
}
```

All values are non-negative integers.

```text
effectiveResilience = base + temporary
actualDelay = max(0, requestedDelay - effectiveResilience)
```

Rules:

- Only a successful delay (`actualDelay > 0`) adds 1 temporary resilience.
- Multiple successful delays before the enemy acts therefore become progressively weaker.
- When the enemy successfully acts, `temporary` resets to 0; `base` remains.
- Effects such as `失衡` may ignore resilience, but the pure resilience API expresses this as an explicit `ignoredResilience` input rather than mutating base resilience.
- UI later reads requested / effective / ignored / actual values from a resolver result. Presentation must not reimplement this arithmetic.

## Break Windows

Break windows are short tactical opportunities tied to one target and expire on that target's next successful action.

```ts
export type BreakWindowKind = 'armor-break' | 'imbalance';

export interface BreakWindowState {
  id: string;
  targetId: string;
  kind: BreakWindowKind;
  consumed: boolean;
}
```

Rules:

- `armor-break`: consumed by the next eligible strong/heavy attack; the later damage resolver will apply +50% base damage.
- `imbalance`: consumed by the next eligible disruption; that disruption ignores 1 resilience.
- A window is removed when consumed.
- If not consumed first, it expires when `targetId` successfully acts.
- Delaying the target does not expire the window because the target has not successfully acted yet.
- Interrupting/replacing an Intent does not itself expire the window; expiration occurs when the resulting enemy event successfully resolves.
- Enemy death removes all windows attached to that enemy at battle-state cleanup time; the BreakWindow module exposes target cleanup for this purpose.

## Resolver Outputs

`IntentResolver` must return explicit values suitable for the future Preview Resolver.

Delay result:

```ts
interface IntentDelayResult {
  intent: IntentState;
  resilience: ControlResilienceState;
  requestedDelay: number;
  effectiveResilience: number;
  ignoredResilience: number;
  actualDelay: number;
  delayed: boolean;
}
```

Interrupt result:

```ts
interface IntentInterruptResult {
  interrupted: boolean;
  original: IntentState;
  intent: IntentState;
}
```

No Phaser object or presentation text belongs in these results.

## Acceptance Tests

Phase 4 is not complete unless tests cover:

- delayable Intent keeps the same id/name/targets and reports the calculated actual delay.
- non-delayable Intent returns actual delay 0 and does not build temporary resilience.
- base resilience reduces delay.
- successful delay increments temporary resilience.
- repeated successful delays weaken later attempts.
- ignored resilience works without mutating base/temporary values before resolution.
- enemy successful action resets temporary resilience only.
- interruptible Intent becomes hard-stagger while preserving enemy id and action delay.
- non-interruptible Intent cannot be replaced.
- armor-break and imbalance windows can be consumed only by matching consumer type.
- unconsumed windows survive delay/preview-like operations and expire on target successful action.
- cleanup removes windows for a dead target.

## Non-goals

This batch does not:

- generate the enemy's next AI Intent sequence.
- apply HP damage.
- implement guard/redirect damage resolution.
- apply character specializations.
- move Timeline nodes itself; Timeline mutation remains in `BattleTimeline`.
- render Intent, resilience, or break-window UI.
- alter `BootScene` or the legacy runtime.

## Next phase dependency

Phase 5 Preview Resolver will compose:

```text
RefactorDeck card
+ active actor specialization
+ IntentState
+ ControlResilience
+ BreakWindow
+ BattleTimeline
```

and produce one immutable predicted result for presentation. Therefore Phase 4 domain functions must remain pure and deterministic.
