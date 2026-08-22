# Combat Refactor Phase 18c — Enemy Profile / Multi-hit / AoE Presentation

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 18c carries authored enemy `ActionDefinition.presentationProfile`, authoritative `hitCount`, and explicit `targetIds` through the existing Intent/presentation boundary so production enemy actions can use `enemy-light`, `enemy-heavy`, and `boss-signature` choreography without re-authoring combat rules in Phaser.

This phase changes presentation metadata only. Damage, Guard, Delay, death, Boss phase selection, multi-hit total damage, and AoE target membership remain authoritative in core/application resolution.

## Intent presentation metadata

`IntentState` may carry optional `presentationProfile` copied from the authored enemy ActionDefinition. It is presentation metadata only.

`intentStateFromEnemyAction()` must copy:

- `presentationProfile` exactly;
- `hitCount` from authored repeated-hit metadata;
- explicit target ids already selected by the authoritative provider.

Legacy/fallback Intents may omit `presentationProfile`; presentation then uses the existing `enemy-light` fallback. `hard-stagger` uses `presentationProfile = none` and does not invent an attack animation.

## Enemy animation plan

The presentation plan exposes:

- `targetId`: first explicit target, used only as movement/focus anchor;
- `targetIds`: all explicit targets for visual reactions;
- `hitCount`: positive visual contact count, default 1;
- authored animated `profileId` when present, otherwise `enemy-light` fallback.

`none` returns no battlefield action plan and resolves through the existing no-animation fallback.

## Multi-hit visual contract

Multi-hit presentation must not alter authoritative damage semantics.

For `hitCount > 1`:

- resolution still commits exactly once at the first IMPACT marker;
- the first contact occurs at IMPACT;
- additional visual contacts are distributed deterministically inside the profile-owned impact/recovery window;
- each visual contact may replay existing procedural impact/slash feedback;
- no extra resolver call is permitted.

For Area 01 Boss `山影連刃`, authored `hitCount = 2`, so the player sees two contacts while core resolution remains the existing 6 × 2 authoritative result.

## AoE visual contract

For explicit multi-target enemy Intents:

- movement/focus may anchor on the first living target id;
- at IMPACT, visual target reaction/impact feedback is applied to every explicit `targetId` supplied by the Intent;
- presentation must not discover, expand, filter, or substitute targets by itself;
- resolver still commits once.

For `驟雨橫掃`, the explicit living-player target list produced by the Boss provider is therefore also the presentation target list.

## Authored profile mapping

Production data already authors the intended profiles:

- ordinary Normal actions: usually `enemy-light`;
- `wayfarer-umbrella` heavy attacks: `enemy-heavy`;
- rain-warrior `居合`: `enemy-heavy`, other Elite actions remain `enemy-light`;
- rain-boss ordinary actions: `enemy-heavy`;
- rain-boss `終雨`: `boss-signature`.

Phase 18c consumes those values rather than duplicating skill-name or archetype switches in the Scene.

## Scene boundary

`RefactorBattleScene` may use plan metadata only for choreography:

- first target for approach destination;
- all targets for procedural reactions;
- hit count for repeated visual contact;
- profile id for Phase 18 Sequencer timings/zoom/scale.

It must not inspect enemy action ids/names to decide damage, target count, Boss phase, or combat outcomes.

## Verification

Required automated evidence:

- enemy ActionDefinition -> Intent preserves presentation profile and repeated-hit count;
- hard-stagger carries `none` and does not generate an attack plan;
- enemy plan selects authored `enemy-heavy` and `boss-signature` when present;
- omitted profile falls back to `enemy-light`;
- plan preserves all explicit target ids and hit count;
- Boss `山影連刃` produces a 2-contact presentation plan;
- Boss `驟雨橫掃` preserves all explicit AoE targets;
- Scene resolves one authoritative enemy action regardless of visual hit count;
- `npm run build`;
- `npm run test`.

Browser QA remains required after CI for readable enemy-light vs enemy-heavy vs boss-signature timing and for multi-hit/AoE visual clarity.

## Out of scope

- generated assets;
- Clash choreography;
- new Boss phase transition art;
- damage-number redesign;
- camera shake/hit-stop tuning beyond existing Phase 18 profile fields;
- changing Boss/Elite/Normal balance or AI;
- changing authoritative multi-hit/AoE resolution rules.
