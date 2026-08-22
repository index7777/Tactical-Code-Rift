# Combat Refactor Phase 16 — Elite Rain-Warrior Migration

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 16 continues Phase C by migrating `rain-warrior` off the legacy `EnemySkill` pool onto authored `ActionDefinition` data and the existing `IntentState` runtime bridge.

This batch is limited to the Area 01 Elite. Boss phase/AoE/multi-hit remains a later phase.

## Authoritative Demo values

`rain-warrior`:

- HP = 120
- base control resilience = 1
- encounter remains rain-warrior + mountain-hound + wet-corpse

Actions:

1. `踏込` — 10 damage, action Delay 4, single target, normal, enemy-light.
2. `崩し` — 8 damage, action Delay 5, single target, control cue, enemy-light.
3. `居合` — 16 damage, action Delay 7, single target, danger, enemy-heavy.

`崩し` does not yet apply player Delay +2 because current enemy resolution does not own that semantic.

## Deterministic Elite cadence

The Demo cadence is authored as:

```text
踏込 -> 崩し -> 居合 -> repeat
```

This provides a readable fast -> control -> heavy rhythm and structurally prevents consecutive `居合` without introducing random selection.

The action catalog remains deterministic for a given non-negative sequence.

## Runtime boundary

The selected Elite `ActionDefinition` is converted by the existing `intentStateFromEnemyAction()` bridge. `EnemyActionResolver` remains unchanged in this batch.

Target selection remains the existing deterministic player rotation until the dedicated target-selection policy phase.

## Clash boundary

The production Elite actions remain `clash.mode = none` in Phase 16. Clash is not enabled for story encounters until authored production Clash values and player-facing preview/presentation are ready.

Legacy `EnemySkill.clashPower` and `tempo` are not read for `rain-warrior` after this migration.

## Scope exclusions

This batch does not:

- migrate `rain-boss`;
- implement player Delay from `崩し`;
- add weighted/random AI;
- add Boss phases, AoE, or multi-hit;
- add Clash UI/choreography;
- alter presentation, FX, audio, or assets.

## Verification

Required tests:

- rain-warrior HP is 120 and base resilience is 1 in `elite-1`;
- authored cadence is exactly 踏込 -> 崩し -> 居合 -> repeat;
- 居合 cannot repeat consecutively;
- damage / Delay / danger telegraph match the planning contract;
- production intent adaptation uses authored action values rather than legacy tempo conversion;
- Boss remains on the existing fallback;
- `npm run build`;
- `npm test`.

Browser QA is not required because all migrated Elite actions still fit current single-target enemy resolution and presentation semantics.
