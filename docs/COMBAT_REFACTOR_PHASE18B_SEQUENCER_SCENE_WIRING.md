# Combat Refactor Phase 18b — Sequencer Scene Wiring

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 18b replaces the remaining hard-coded player/enemy presentation timing chain in `RefactorBattleScene` with the Phase 18 `ActionPresentationSequencer` profile data.

Combat authority does not move. `BattleTurnController` / core resolvers remain the only place that commits damage, Delay, Guard, Break, Clash and enemy-action results. The Scene only consumes a presentation profile and schedules tween / pose / FX / camera work around the existing confirm / resolve handoff.

## Runtime sequencing

Player and enemy presentation must consume the same profile timing fields:

```text
FOCUS
-> ANTICIPATION
-> APPROACH
-> STRIKE
-> IMPACT
-> RECOVERY
-> RETURN
```

The Scene may implement these phases as delayed calls and tweens, but it must not substitute unrelated fixed timing constants for profile-owned choreography.

### Player action

1. Build `RefactorBattleAnimationPlan`.
2. Read `profileId` from the plan and obtain the immutable Phase 18 profile.
3. Hide decision HUD and disable input.
4. Confirm the selected card through the runtime.
5. Enter anticipation / ready pose and camera push.
6. Approach target using the existing target-relative destination policy.
7. Enter strike pose.
8. At IMPACT, play the profile-appropriate existing procedural feedback and call `resolveConfirmedPlayerAction()` exactly once.
9. Hold/recover according to the profile.
10. Return actor to HOME, restore idle pose/camera/HUD/input, then render the authoritative post-resolution view.

### Enemy action

1. Build the enemy animation plan.
2. Read its presentation profile.
3. Apply profile anticipation, lunge/approach, actor scale and camera zoom.
4. At IMPACT, play current procedural impact/reaction and call `resolveActiveEnemyAction()` exactly once.
5. Recover and return to the original position/scale.

This batch keeps the current production enemy-plan fallback at `enemy-light`; authored enemy-heavy / boss-signature mapping is a later data-to-presentation wiring step.

## Card-family behavior

- quick: shortest anticipation/contact/recovery; current slash feedback is retained.
- heavy: longer anticipation, stronger scale/camera push and longer recovery.
- guard: REACTION path; no attack slash and no fake target hit reaction.
- disruption: control/non-contact path; no default melee slash or attack pose.
- break: melee contact path with its own timing profile; current generic procedural impact remains until later FX-language wiring.

No new art asset is introduced in this batch.

## Camera and scale

- world camera zoom uses `profile.cameraZoom` during presentation;
- actor presentation scale uses `profile.actorScale` relative to the sprite's current rendered scale;
- return restores exact original actor scale and world camera zoom 1;
- `cameraImpulse` is not implemented yet; Phase 18b only consumes zoom/scale/timing. Impulse/hit-stop remain a later polish batch.

## Impact ownership

`IMPACT` remains the single resolver handoff for actions that have a battlefield presentation.

At player IMPACT:

- slash/impact FX as allowed by the plan;
- target reaction except Guard/defensive REACTION;
- `resolveConfirmedPlayerAction()` exactly once.

At enemy IMPACT:

- current impact FX / target reaction;
- `resolveActiveEnemyAction()` exactly once.

If a required actor sprite is unavailable, the existing safe fallback may resolve immediately without presentation; this is a missing-visual fallback, not an alternate combat rule.

## Input / teardown

The existing presentation lock remains authoritative:

- clear auto-advance before motion;
- disable input and hide HUD while presentation is active;
- Scene shutdown/destroy kills presentation timers/tweens;
- no delayed callback may submit a second resolution after teardown;
- input/HUD are restored only after RETURN completes.

## Verification

Required automated evidence:

- Quick / Heavy / Guard / Disruption / Break animation plans expose the correct Phase 18 profile ids;
- Disruption does not request melee slash/attack pose;
- Guard remains REACTION and does not request target-hit reaction semantics;
- Scene source consumes `actionPresentationProfile()` rather than the previous fixed player `180/70/90/120/210` and enemy `190/140/220` choreography chain;
- `npm run build`;
- `npm run test`.

Browser QA remains required after CI for visible timing contrast between Quick and Heavy and for Guard/Disruption non-melee readability at 1280×720 and 844×390.

## Out of scope

- generated assets;
- Clash choreography;
- camera shake / hit-stop;
- authored enemy-heavy / boss-signature profile selection from Intent data;
- multi-hit visual strike repetition;
- AoE per-target reaction choreography;
- Boss phase transition presentation;
- damage-number animation redesign.
