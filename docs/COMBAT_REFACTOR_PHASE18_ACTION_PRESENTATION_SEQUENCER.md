# Combat Refactor Phase 18 — Action Presentation Sequencer

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 18 replaces the current ad-hoc presentation delays with a reusable, data-driven Action Presentation Sequencer contract.

This batch defines choreography only. Combat authority remains in `BattleTurnController` / core resolvers. Presentation may consume an already-selected action profile and authoritative targets/results, but must never calculate damage, Delay, Guard, Break, Clash or enemy AI.

The first implementation slice is intentionally pure TypeScript: profile definitions, timing markers and card-family mapping. Phaser Scene wiring follows after this contract is CI-stable.

## Choreography state language

Every action profile uses the same ordered presentation phases:

```text
FOCUS
-> ANTICIPATION
-> APPROACH
-> STRIKE
-> IMPACT
-> RECOVERY
-> RETURN
```

`IMPACT` is the semantic synchronization point. Runtime damage/result mutation still occurs through the authoritative resolver; the presentation layer only schedules visual reaction, SFX, hit-stop/camera impulse hooks and the resolver handoff around this marker.

Profiles may make one or more phase durations zero, but may not reorder the state language.

## Profile contract

The production presentation profiles are:

1. `quick-melee`
2. `heavy-melee`
3. `guard`
4. `disruption`
5. `break`
6. `enemy-light`
7. `enemy-heavy`
8. `boss-signature`

`ActionDefinition.presentationProfile = none` remains legal for actions that intentionally have no battlefield choreography; it is not one of the eight animated profiles.

Each profile defines only presentation metadata:

- anticipation / approach / strike / impact-hold / recovery / return timing;
- camera zoom target;
- actor scale multiplier;
- camera impulse magnitude;
- contact mode;
- FX language.

No profile contains damage or combat-result values.

## Baseline timing table

| profile | anticipation | approach | strike | impact hold | recovery | return | camera zoom | actor scale | impulse |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| quick-melee | 70 | 95 | 90 | 45 | 100 | 160 | 1.10 | 1.06 | 3 |
| heavy-melee | 160 | 130 | 120 | 85 | 190 | 220 | 1.14 | 1.10 | 7 |
| guard | 100 | 80 | 70 | 60 | 140 | 180 | 1.08 | 1.04 | 2 |
| disruption | 120 | 80 | 100 | 45 | 130 | 170 | 1.08 | 1.04 | 2 |
| break | 130 | 110 | 100 | 75 | 160 | 200 | 1.12 | 1.08 | 5 |
| enemy-light | 90 | 120 | 100 | 55 | 130 | 190 | 1.08 | 1.05 | 4 |
| enemy-heavy | 170 | 150 | 130 | 90 | 200 | 240 | 1.13 | 1.10 | 7 |
| boss-signature | 260 | 180 | 150 | 120 | 260 | 300 | 1.17 | 1.14 | 10 |

All durations are milliseconds and are initial tuning values, not combat rules.

## Motion language

### quick-melee

Short anticipation, rapid contact, small impulse, short recovery. The actor should read as crossing distance quickly rather than charging power.

### heavy-melee

Longer anticipation and impact hold, larger camera impulse and visibly slower recovery. The hit should feel committed rather than simply scaled-up Quick.

### guard

Uses a defensive/intercept contact language. It must not inherit attack slash semantics by default. A protected-ally intercept may move toward the ally; self guard may remain near HOME.

### disruption

Uses control/non-contact language. Approach may be shallow or zero at Scene level. FX/result emphasis belongs on the target/Timeline response rather than weapon contact.

### break

Uses contact choreography with stronger fracture/stagger feedback than Quick, but remains faster than Heavy. Break text/numbers remain runtime text and are never baked into static art.

### enemy-light

Short enemy lunge and modest impulse.

### enemy-heavy

Longer windup/lunge, stronger impact hold and reaction.

### boss-signature

Longest readable windup, strongest camera push/impulse, deliberate recovery. This is the normal high-value place for special character/boss emphasis; it must not become the default presentation language for every ordinary card choice.

## Card-family mapping

Shared-hand card families map directly:

```text
quick       -> quick-melee
heavy       -> heavy-melee
guard       -> guard
disruption  -> disruption
break       -> break
```

Cards remain shared-hand and are not character-locked. Character specialization continues to affect authoritative Preview/Execute rules, not the choreography profile id.

## Decision-state boundary

Normal decision presentation keeps the battlefield as the primary visual surface:

```text
PLAYER_IDLE
-> active actor focus / camera zoom
-> CARD_SELECTED
-> selected card enlarges and other HUD de-emphasizes
-> TARGET_PREVIEW
-> confirm
-> Action Presentation Sequencer
```

A persistent character portrait cut-in is not required for ordinary card selection. Optional portrait/cut-in emphasis is reserved for high-value events such as specialization triggers, special counters, Break finishers, Boss phase/signature actions or later ultimate-class actions.

## Impact synchronization

Scene/runtime wiring must eventually treat `IMPACT` as a single synchronization marker for applicable actions:

- target reaction;
- slash / guard / disruption / break FX;
- impact SFX;
- optional camera impulse;
- optional hit-stop;
- authoritative resolution handoff;
- runtime damage/status text after the resolver result is known.

Static generated assets must not contain damage numbers, BREAK/CRIT text, HP, Delay values, timed glow/pulse or screen-wide bloom.

## Multi-hit / multi-target boundary

Phase 17b already provides authoritative `damage × hitCount` and explicit `targetIds` for Boss Intent.

Phase 18 profile data does not invent hit semantics. Later Scene wiring may repeat visual contact markers according to authoritative hit metadata, and may react multiple explicit targets, but it must not infer extra targets or flatten hit counts.

## Clash boundary

Clash remains a result branch layered on top of action choreography rather than a ninth profile.

Future Clash presentation inserts a contact branch around STRIKE/IMPACT:

```text
APPROACH
-> BOTH ANTICIPATION
-> STRIKE
-> CLASH CONTACT
-> HIT-STOP
-> CLASH RESULT
-> FOLLOW THROUGH
-> RECOVERY
```

The outcome is supplied by the existing authoritative Clash pipeline. Presentation does not compare scores.

## Implementation slice 18a

This batch adds:

- pure `ActionPresentationSequencer` profile registry;
- deterministic cumulative phase markers;
- shared-card-family -> profile mapping;
- animation-plan profile id exposure for existing Scene consumers;
- unit tests for all eight profiles and marker ordering.

It deliberately does not yet rewrite `RefactorBattleScene` tween orchestration. That is Phase 18b after this profile contract passes CI.

## Out of scope

- generated assets;
- replacing current character sprites;
- Boss phase transition art;
- portrait cut-in assets;
- camera shake/hit-stop implementation in Phaser;
- damage-number choreography;
- Clash animation implementation;
- combat-rule changes.

## Verification

Required:

- all eight animated profile ids exist exactly once;
- all timing values are finite non-negative integers;
- camera zoom / actor scale are finite and >= 1;
- impulse values are finite non-negative numbers;
- cumulative markers preserve the fixed phase order;
- total duration equals the final RETURN marker;
- all five card families map to the approved profile;
- `RefactorBattleAnimationPlan` exposes the selected profile without changing combat authority;
- `npm run build`;
- `npm run test`.

Browser QA is deferred to Phase 18b because 18a changes no Phaser choreography yet.
