# Combat Refactor Phase 15 — Normal Enemy Action Migration

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Objective

Phase 15 starts Phase C by moving the six Area 01 Normal enemy archetypes off the legacy `EnemySkill` pool and onto authored `ActionDefinition` data, while preserving the existing `IntentState` / `EnemyActionResolver` runtime boundary.

This batch is intentionally limited to Normal enemies. Elite and Boss action data remain on the existing path until their dedicated phases.

## Scope

Normal archetypes in this batch:

- `lantern-child`
- `wet-corpse`
- `mountain-hound`
- `noose-ghost`
- `lost-monk`
- `wayfarer-umbrella`

The source of truth for their Demo values is `COMBAT_DEMO_COMPLETION_BALANCE_PLAN.md`.

This batch may:

- author their actions as `ActionDefinition`;
- author deterministic cyclic action selection;
- adapt a selected authored action into the current public `IntentState` boundary;
- update Normal HP and base control resilience to the approved Demo planning values;
- keep the existing deterministic player-target rotation for now;
- keep current Enemy Action resolution unchanged.

This batch does not:

- migrate `rain-warrior` or `rain-boss`;
- add Boss phase / AoE / multi-hit resolution;
- add player-delay status semantics;
- change `EnemyActionResolver` damage rules;
- opt the seven production encounters into Clash;
- add presentation, FX, UI, audio, or generated assets.

## Authored Normal values

| Enemy | HP | Resilience | Actions |
|---|---:|---:|---|
| lantern-child | 34 | 0 | 鬼火疾走 7 / Delay 3; 燈影截 8 / Delay 4 |
| wet-corpse | 42 | 0 | 柴刀斬 9 / Delay 5; 濡手 7 / Delay 4 |
| mountain-hound | 40 | 0 | 濡鬃撲咬 8 / Delay 3; 山影追咬 9 / Delay 4 |
| noose-ghost | 40 | 1 | 濕繩纏 6 / Delay 5; 吊影 8 / Delay 5 |
| lost-monk | 48 | 1 | 錫杖牽制 8 / Delay 5; 迷途印 6 / Delay 6 |
| wayfarer-umbrella | 58 | 1 | 開傘壓 12 / Delay 6 danger; 傘骨重劈 15 / Delay 7 danger |

`濕繩纏` does not yet apply player Delay +1, and `迷途印` does not yet add a typed status, because those semantics are not implemented in the current enemy resolver.

## Action selection

Normal enemies use a deterministic cyclic policy:

```text
action = pool[sequence % pool.length]
```

Each Normal pool currently has two actions. No random choice is introduced in this batch.

The current encounter bootstrap continues to use deterministic player target rotation by sequence. Retarget-on-death is a later targeting-policy batch because the current `enemyIntentProvider(enemyId)` interface does not receive battle-state target availability.

## Intent boundary

The authored `ActionDefinition` is converted to `IntentState` only at the current runtime boundary.

For this batch:

- only `owner = enemy` is accepted;
- only single-target opponent actions are adapted;
- hit damage must be representable as the current single integer `IntentState.damage`;
- status payloads map by id only;
- `actionDelay` becomes `IntentState.delay`;
- `counterplay` becomes `canDelay / canInterrupt / canGuard / canRedirect`;
- telegraph and presentation metadata remain in `ActionDefinition` and are not baked into Intent strings.

This adapter is a migration bridge, not the final enemy runtime model.

## Clash boundary

Normal production actions remain `clash.mode = none` in Phase 15. This avoids silently enabling production Clash before player/enemy Clash balance values and UI are authored for the seven encounters.

Legacy `EnemySkill.clashPower` and `tempo` are not read by the Normal catalog or its adapter.

## Verification

Required tests:

- all six Normal archetypes have exactly the approved authored actions;
- action sequence is deterministic and cyclic;
- Intent adaptation preserves damage, Delay, target and counterplay;
- danger telegraph is authored for both umbrella actions;
- Normal HP and resilience match the planning contract;
- Area 01 encounter bootstrap uses authored Normal actions while Elite/Boss remain supported by the existing fallback;
- no production Clash is enabled by this batch;
- `npm run build`;
- `npm test`.

Browser QA is not required because the presentation path is unchanged and all migrated actions remain single-target current-runtime semantics.
