# Combat Refactor Phase 20 — Selection / Targeting Zoom Presentation

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 20 turns normal player decision states into a consistent battlefield-camera language instead of treating `PLAYER_IDLE`, `CARD_SELECTED`, and `TARGET_PREVIEW` as the same active-actor zoom.

This is presentation-only. Card legality, target legality, Preview values, Timeline, Clash, damage, Delay, Guard, Break, and action resolution remain authoritative outside Phaser.

## Decision camera states

The normal decision path uses three camera states:

- `PEEK`: active actor context. Keep the existing light active-actor focus (`~1.05`) so the player can read whose turn it is without hiding the battlefield.
- `FOCUS`: selected-card intent. Increase battlefield emphasis modestly and bias the camera from the active actor toward the action zone. No target is invented.
- `TARGETING`: explicit relationship. Frame the active actor and the authoritative selected target together, using their midpoint and a stronger but still tactical zoom.

Normal selection must remain battlefield-first. Portrait/cut-in presentation is forbidden for routine card selection and targeting; those remain reserved for specialization, special Clash/counter, Break finisher, Boss phase/signature, or equivalent high-value events.

## Pure policy boundary

Add a pure `DecisionCameraPolicy` that consumes only presentation-safe inputs:

- hand presentation state (`PEEK | FOCUS | TARGETING | HIDDEN | DISPATCH`);
- active actor world point when available;
- selected target world point when available.

It returns only camera presentation data:

- center x/y;
- zoom;
- transition duration;
- semantic mode.

The policy must not import controller, resolver, card definitions, Intent resolution, Clash resolution, or Phaser.

## Camera rules v1

- `PEEK`: zoom `1.05`; center lightly biased toward the active actor, preserving Phase 10i readability.
- `FOCUS`: zoom `1.08`; center between the active actor and a neutral action-zone anchor. This indicates commitment to a card without guessing which target will be chosen.
- `TARGETING`: zoom `1.12`; center on the midpoint between active actor and the selected target.
- `HIDDEN`: no decision-camera ownership; action sequencer / Clash choreography owns the world camera.
- `DISPATCH`: neutral battlefield framing (`1.00`) so hand utility does not impersonate a combat action.

All requested centers must pass through the existing stage camera clamp.

## Scene ownership

`RefactorBattleScene` may:

- keep the existing active actor step/ring cue;
- ask the pure policy for the decision camera target after actor sprites have been placed;
- tween/pan only the world camera;
- leave HUD in screen-space.

It must not derive target legality or infer targets from actor proximity.

When `TARGET_PREVIEW` has no selected target sprite (for example after a death/render edge), fall back to the `FOCUS` camera rather than inventing a point.

## Transition behavior

- entering a new decision mode uses a short `Sine.easeOut` transition;
- repeated renders in the same state snap only when already effectively at the requested zoom/center, avoiding stacked camera tweens;
- action confirmation still hands camera ownership to Phase 18/19 choreography before movement starts;
- after action return, the next actor's legal decision state reacquires decision-camera ownership.

## Verification

Automated evidence must cover:

- PEEK / FOCUS / TARGETING / DISPATCH camera outputs;
- TARGETING midpoint framing;
- target-missing fallback to FOCUS;
- camera clamp behavior;
- no decision camera for HIDDEN;
- build/test pass.

Browser QA remains required at 1280×720 and 844×390 for battlefield readability, target relationship clarity, and absence of camera fighting with action/Clash choreography.

## Out of scope

- portrait/cut-in assets;
- generated assets;
- new target rules;
- Clash scoring or presentation changes;
- action sequencer timing changes;
- damage-number redesign;
- production balance changes.
