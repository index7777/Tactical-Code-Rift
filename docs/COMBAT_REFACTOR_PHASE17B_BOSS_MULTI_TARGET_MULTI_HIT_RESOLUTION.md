# Combat Refactor Phase 17b — Boss Multi-hit / Multi-target Resolution

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 17b closes the runtime gap left by Phase 17 so the authored `rain-boss` catalog can execute without flattening multi-hit or all-opponent semantics.

The existing `IntentState` boundary remains the public enemy-action snapshot for this batch, but gains the minimum authored semantics required by the Area 01 Boss. Enemy damage execution remains centralized in `EnemyActionResolver`; Scene/presentation code does not calculate combat results.

## Intent runtime semantics

`IntentState` gains optional `hitCount`.

- absent `hitCount` means 1 hit;
- `damage` is damage per hit;
- `hitCount` must be a positive integer when present;
- total raw damage to one target is `damage * hitCount`.

`targetIds` already represents the resolved public targets. For an authored all-opponent Boss action, the adapter receives the authoritative living opponent ids and expands the public Intent to those ids before execution.

This batch does not add a new target-mode enum to `IntentState`; authored targeting remains in `ActionDefinition`, while `IntentState.targetIds` remains the resolved public telegraph.

## Guard rule for multi-hit

For Demo v1, Guard applies once to the whole Intent total for each guarded target.

Example:

```text
山影連刃 = 6 × 2 = 12 raw damage
Guard resolves against 12 once
```

It is forbidden to consume Guard on hit 1 and then apply hit 2 unguarded, because that would contradict the approved Boss balance contract.

For AoE, each target resolves its own Guard independently against that target's total incoming damage.

## Enemy Action adapter

`EnemyActionIntentAdapter` may adapt:

- one authored hit descriptor with optional `repeats`;
- `single-enemy` with exactly one resolved target id;
- `all-enemies` with one or more resolved living opponent ids.

It must reject heterogeneous multi-hit definitions such as multiple hit descriptors with different damage values rather than guessing how to encode them in the current Intent boundary.

## Boss runtime selection

The production Boss Intent provider must select from `BossEnemyActionCatalog` using current authoritative battle state:

- current Boss HP / max HP -> current phase;
- deterministic sequence;
- recent Boss action ids -> cooldown eligibility;
- current living player ids -> public target expansion.

Single-target Boss actions retain deterministic target rotation over the living player set. `驟雨橫掃` targets every living player in the public Intent.

The selected authored Boss action id is retained in provider history so `終雨` cooldown remains deterministic across runtime turns.

## Boss cutover

After this batch:

- `boss-1` HP / resilience remain 240 / 1;
- `rain-boss` no longer reads legacy `EnemySkill` for production Intent selection;
- `山影連刃` executes as 6 × 2;
- `驟雨橫掃` executes against all living players;
- `雨斬`, `壓雨`, `終雨` execute through the same authored adapter boundary;
- Boss phase selection uses current HP at the time the next Intent is authored.

## Clash boundary

Production Boss actions remain `clash.mode = none`. This phase does not opt story encounters into Clash, does not assign Boss Clash scores and does not use legacy `clashPower` / `tempo`.

## Out of scope

- player Delay +2 from `壓雨`;
- typed persistent status execution;
- Boss phase transition presentation;
- multi-hit visual hit markers / damage-number choreography;
- Clash UI / animation / FX;
- generated assets.

## Verification

Required tests:

- `IntentState.hitCount` validation and defensive copy behavior;
- adapter preserves `6 × 2` as `damage=6`, `hitCount=2`;
- adapter expands authored all-opponent action to explicit target ids;
- adapter rejects unsupported heterogeneous hit descriptors;
- EnemyActionResolver applies total multi-hit damage correctly;
- Guard applies once to the total multi-hit Intent;
- AoE applies damage independently to every living public target and removes defeated targets;
- Boss runtime provider selects authored actions from current HP phase;
- `驟雨橫掃` public Intent contains all living players;
- `終雨` cooldown remains deterministic;
- production Boss no longer depends on legacy `EnemySkill` values;
- no production Clash is enabled;
- `npm run build`;
- `npm test`.

Browser QA is deferred until Boss presentation work because this batch changes combat semantics/data but introduces no new presentation primitive.