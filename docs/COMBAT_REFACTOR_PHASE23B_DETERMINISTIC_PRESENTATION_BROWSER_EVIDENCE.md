# Combat Refactor Phase 23b — Deterministic Presentation Browser Evidence

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Close the remaining non-asset portion of the Phase 23 gate with deterministic runtime evidence for action profiles, Clash outcomes, Boss multi-hit/AoE/signature presentation, and dead-slot formation stability.

This batch changes QA tooling only. It must not change combat balance, production route rules, authored action data, presentation timings, Phaser choreography, or art assets.

## QA-only runtime strategy

The browser harness may use test-only introspection of the already-loaded Phaser Scene and controller state after entering a normal production battle route. It may:

- move an existing card instance between the current deck piles so a specific existing family can be exercised deterministically;
- replace the current Preview Clash metadata with a synthetic authoritative eligible resolution for the three existing outcome branches;
- replace the current Boss public Intent with an equivalent deterministic QA Intent carrying authored `hitCount`, explicit `targetIds`, and presentation profile;
- temporarily set the controller turn state to an existing enemy actor so the real Scene choreography executes immediately;
- wrap presentation-only methods to count visual-contact/reaction calls.

The harness may not alter source data, persist QA mutations into runtime state outside the current page, or call combat/presentation formulas that are not already part of the loaded production bundle.

## Required player profile evidence

At both canonical viewports capture the real Scene choreography for one card from each existing family:

- Quick -> `quick-melee`
- Heavy -> `heavy-melee`
- Guard -> `guard`
- Disruption -> `disruption`
- Break -> `break`

Each case reloads a clean `battle-1` page, starts from `PLAYER_IDLE`, uses an existing card definition/instance, resolves a legal existing target rule, executes through `RefactorBattleScene.playPlayerAction`, captures an in-motion screenshot, and waits for the Scene to return from presentation.

## Enemy profile evidence

Capture:

- `enemy-light` from a normal Area 01 enemy action;
- `enemy-heavy` from a deterministic Boss heavy Intent;
- `boss-signature` from a deterministic `終雨`-equivalent public Intent using the authored presentation profile.

These cases must execute through the real `playEnemyAction` Scene path.

## Clash evidence

For one legal direct player/enemy relationship, exercise all three authoritative outcome branches:

- `player-win`
- `draw`
- `enemy-win`

The QA harness may inject only the already-resolved eligible Clash snapshot into the current Preview. Scene choreography must still consume that snapshot through the normal TargetPreview -> AnimationPlan -> `playPlayerClashAction` path.

Capture one in-contact/result screenshot per outcome. Verify presentation completes and input returns.

## Boss multi-hit / AoE evidence

### Mountain-shadow double hit

Use a deterministic public Boss Intent equivalent to `山影連刃`:

- damage `6`
- `hitCount = 2`
- one explicit living target
- profile `enemy-heavy`

Wrap `playEnemyVisualContact` only for observation. The count must be exactly `2`; combat resolution still executes once through `resolveActiveEnemyAction`.

### Downpour AoE

Use a deterministic public Boss Intent equivalent to `驟雨橫掃`:

- damage `8`
- explicit target list containing only living players
- profile `enemy-heavy`

Wrap `playTargetReaction` only for observation. Every explicit target must react and a dead/non-target actor must not react.

### Final rain signature

Use a deterministic public Boss Intent equivalent to `終雨` with profile `boss-signature`; capture the real Scene choreography and verify presentation returns normally.

## Dead-slot / formation stability

On a four-enemy encounter:

1. record each living enemy sprite HOME position;
2. set one existing enemy HP to zero in the page-local QA state without removing its spawn id;
3. re-render;
4. verify the dead actor sprite is absent while every surviving enemy remains at the same x/y slot.

Capture before/after screenshots for manual overlap review.

## Evidence and pass criteria

The existing `tools/phase23_browser_qa.mjs` artifact must add:

- five player-profile screenshots per viewport;
- enemy-light / enemy-heavy / boss-signature screenshots;
- three Clash outcome screenshots;
- Boss multi-hit/AoE screenshots plus deterministic contact/reaction counts;
- dead-slot before/after screenshots and stable-position JSON;
- per-viewport JSON fields for the above checks.

Any thrown page error, console error, incorrect contact count, incorrect AoE reaction target set, missing profile case, stuck presentation, or moved survivor slot fails the workflow.

## Manual visual review remains separate

Passing this batch proves deterministic runtime execution and supplies visual evidence. It does not automatically approve visual rhythm, silhouette quality, camera feel, or overlap quality. Those screenshots must still be reviewed before Phase 23 may unlock generated card-family plates.

## Out of scope

- generated images or asset replacement;
- balance changes;
- new production Clash authoring;
- new Boss actions;
- presentation timing changes;
- route/progression changes;
- UI redesign.
