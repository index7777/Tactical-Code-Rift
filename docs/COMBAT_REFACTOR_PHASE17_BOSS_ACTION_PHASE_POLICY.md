# Combat Refactor Phase 17 — Boss Action Data / Phase Policy

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 17 authors the Area 01 `rain-boss` action set and deterministic HP-phase selection policy on top of the Phase 13 `ActionDefinition` contract.

This batch deliberately separates Boss data / policy from the later multi-hit and multi-target runtime resolver work. `ActionDefinition` may describe those actions now, but the current `IntentState` bridge must not flatten or guess unsupported semantics.

## Boss baseline

- HP: 240
- Base control resilience: 1
- Phase 1: HP ratio > 70%
- Phase 2: 35% < HP ratio <= 70%
- Phase 3: HP ratio <= 35%

At exact boundaries, 70% enters Phase 2 and 35% enters Phase 3.

## Authored action set

### 雨斬

- 12 damage
- single target
- action Delay 5
- normal telegraph
- available in all phases

### 山影連刃

- 6 damage × 2 hits
- single target
- action Delay 5
- normal telegraph
- available in all phases

### 驟雨橫掃

- 8 damage to all living opponents
- action Delay 7
- danger telegraph
- Phase 2+

### 壓雨

- 10 damage
- single target
- action Delay 6
- normal telegraph / control role
- Phase 2+
- planned player Delay +2 remains HOLD until enemy-to-player Delay semantics are implemented

### 終雨

- 18 damage
- single target
- action Delay 8
- signature telegraph
- Phase 3 only
- deterministic cooldown of at least 2 Boss actions after use
- cannot repeat immediately as a consequence of the cooldown

## Deterministic selection policy

The selector receives authoritative current HP / max HP, a non-negative action sequence and recent authored Boss action ids.

1. Resolve current phase from HP ratio.
2. Filter actions by authored `ai.minPhase / ai.maxPhase`.
3. Start at `sequence % eligible.length`.
4. Scan cyclically until the first action whose authored cooldown is satisfied.
5. If every candidate is blocked, fall back to the first non-cooldown action in the phase pool.

No random number, wall clock, Phaser state or legacy `EnemySkill` field participates.

`cooldownActions = 2` means the action id must not appear among the two most recent Boss actions.

## Runtime boundary in this batch

This phase updates the production Boss HP / base resilience baseline, but does not yet replace the current Boss `IntentState` action path.

Reason: the current runtime bridge cannot faithfully represent:

- `hits: [{ damage: 6, repeats: 2 }]` as multi-hit semantics;
- `targetMode = all-enemies` as all-living-player targeting.

Therefore Phase 17 must not flatten `山影連刃` into one 12-damage hit or flatten `驟雨橫掃` into one arbitrary target merely to make the old resolver accept them.

The next Boss runtime batch will add the missing multi-hit / multi-target resolution boundary and then cut `rain-boss` over to this authored catalog.

## Clash boundary

Boss actions remain `clash.mode = none` in this batch. Production Clash opt-in requires separate authored balance values and Preview/UI evidence; legacy `clashPower` is never read.

## Out of scope

- multi-hit damage execution;
- all-player target expansion;
- player Delay +2 from `壓雨`;
- Boss phase transition presentation;
- Clash UI / animation / FX;
- any generated asset.

## Verification

Required tests:

- all five actions match the planning values;
- `山影連刃` remains authored as 6 × 2 rather than flattened 12;
- `驟雨橫掃` remains all-opponent targeting;
- phase boundaries at >70%, 70%, >35%, 35%;
- Phase 1 / 2 / 3 eligible pools;
- deterministic repeated selection;
- `終雨` is unavailable before Phase 3;
- `終雨` respects two-action cooldown;
- Boss HP / resilience in `boss-1` are 240 / 1;
- production Boss still uses the existing Intent fallback until the resolver migration batch;
- `npm run build`;
- `npm test`.
