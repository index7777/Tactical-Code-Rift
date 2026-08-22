# Combat Refactor Phase 13b — Action Adapter Migration

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Objective

Phase 13b introduces a one-way compatibility boundary from the current authoritative refactor runtime inputs into the Phase 13 `ActionDefinition` catalog shape.

The purpose is to prove that the existing ten refactor cards and current enemy `IntentState` records can be represented by the new action-data contract without changing battle results, Phaser presentation, encounter balance, or asset production.

This is still Phase A. Clash resolution, Boss phase AI, multi-target resolution and new action choreography remain later phases.

## Boundaries

This batch may:

- add pure adapters from `RefactorCardDefinition` to `ActionDefinition`;
- add pure adapters from current single-target `IntentState` to `ActionDefinition`;
- add the minimum counterplay metadata required to preserve current Intent readability (`canDelay`, `canInterrupt`, `canGuard`, `canRedirect`);
- add migration tests over the existing ten QA/refactor card definitions and representative enemy intents.

This batch must not:

- replace `RefactorCardDefinition` or `IntentState` as runtime resolver input;
- modify Preview or Resolution formulas;
- consume Clash metadata;
- reinterpret legacy `EnemySkill.clashPower` or `tempo` as new combat rules;
- add Boss phase selection logic;
- support arbitrary multi-target legacy intents by guessing semantics;
- change HP, damage, Delay or encounter rosters;
- modify Phaser presentation;
- generate or integrate art assets.

## Counterplay preservation

Current `IntentState` carries defensive/counterplay permissions that are not action effects:

```ts
canDelay
canInterrupt
canGuard
canRedirect
```

Phase 13b preserves these as optional catalog metadata:

```ts
interface ActionCounterplayDefinition {
  delayable: boolean;
  interruptible: boolean;
  guardable: boolean;
  redirectable: boolean;
}
```

`ActionDefinition.counterplay` is optional because player-card actions currently do not need this metadata. Enemy Intent adapters must populate all four fields exactly from `IntentState`.

This metadata does not perform any resolution and must not be confused with action effects such as `targetDelay` or `interrupt`.

## Card adapter

`actionDefinitionFromRefactorCard(card)` maps current card semantics without changing values:

- `enemy` -> `single-enemy`
- `self` -> `self`
- `ally` -> `single-ally`
- `any-ally` -> `any-ally`
- `none` -> `none`
- `effect.damage` -> one hit definition
- card `delay` -> `actionDelay`
- `delayTarget` -> `targetDelay`
- `guardRatio / guardCap` -> `guard`
- `createBreakWindow` -> `breakWindow`
- `interrupt` -> `interrupt`
- current cards have no typed status payload, AI metadata or telegraph escalation
- Clash remains `mode: none` until Phase B
- presentation profile derives only from the five current card families

No card id special cases are allowed.

## Enemy Intent adapter

`actionDefinitionFromIntent(intent)` maps current authoritative Intent data:

- zero targets -> `none`
- exactly one target -> `single-enemy`
- more than one target is rejected by this migration adapter because current target IDs alone cannot distinguish authored `all-enemies`, random targeting or an arbitrary subset without guessing
- `damage` -> one hit definition when present
- Intent `delay` -> `actionDelay`
- string `statusEffects` -> typed status applications with the same ids and no invented magnitude/duration
- counterplay flags are copied exactly
- hard-stagger Intent remains a no-target/no-damage semantic record with `presentationProfile: none`
- enemy Clash remains disabled in the adapter until Phase B explicitly defines it
- telegraph defaults to `normal`; richer enemy catalog telegraph data will be authored in Phase C instead of inferred from skill names

The adapter does not read legacy `EnemySkill.clashPower` or `tempo`.

## Validation and migration guarantees

Adapters must route results through `createActionDefinition()` so the Phase 13 validation contract remains the single constructor gate.

Required tests:

- all ten existing `REFACTOR_QA_CARD_DEFINITIONS` adapt successfully;
- every card preserves id, name, action Delay and current effect values;
- each of the five card families maps to the intended presentation profile;
- a normal enemy Intent preserves damage, action Delay, status ids and all four counterplay flags;
- hard stagger adapts without inventing damage or a target;
- a multi-target legacy Intent is rejected rather than guessed;
- adapters return detached catalog objects and do not mutate the source definitions.

## Files

Expected new pure-domain file:

```text
src/core/actions/ActionDefinitionAdapters.ts
src/core/actions/ActionDefinitionAdapters.test.ts
```

Phase 13 domain file may be extended only with the optional counterplay metadata required above.

No Phaser imports are permitted.

## Verification

Required:

- `npm run test`;
- `npm run build`;
- `git diff --check`;
- no runtime/browser QA required because authoritative battle wiring is unchanged.
