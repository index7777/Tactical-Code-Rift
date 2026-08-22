# Combat Refactor Phase 18c — Enemy Profile / Multi-hit / AoE Presentation

STATUS = CI_VERIFIED_BROWSER_QA_PENDING
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 18c carries authored enemy `ActionDefinition.presentationProfile`, authoritative `hitCount`, and explicit `targetIds` through the existing Intent/presentation boundary so production enemy actions can use `enemy-light`, `enemy-heavy`, and `boss-signature` choreography without re-authoring combat rules in Phaser.

This phase changes presentation metadata only. Damage, Guard, Delay, death, Boss phase selection, multi-hit total damage, and AoE target membership remain authoritative in core/application resolution.

## Intent presentation metadata

`IntentState` may carry optional `presentationProfile` copied from the authored enemy ActionDefinition. It is presentation metadata only.

`intentStateFromEnemyAction()` copies:

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

Multi-hit presentation does not alter authoritative damage semantics.

For `hitCount > 1`:

- resolution commits exactly once at the first IMPACT marker;
- the first contact occurs at IMPACT;
- additional visual contacts are distributed deterministically inside the profile-owned impact/recovery window;
- each visual contact may replay existing procedural impact/slash feedback;
- no extra resolver call is permitted.

`EnemyActionPresentationContacts.ts` owns the pure deterministic additional-contact schedule. For Area 01 Boss `山影連刃`, authored `hitCount = 2`, so the player sees two contacts while core resolution remains the existing 6 × 2 authoritative result.

## AoE visual contract

For explicit multi-target enemy Intents:

- movement/focus anchors on the first explicit target id;
- at IMPACT, visual target reaction/impact feedback is applied to every explicit `targetId` supplied by the Intent;
- presentation does not discover, expand, filter, or substitute targets by itself;
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

`RefactorBattleScene` now uses plan metadata only for choreography:

- first target for approach destination;
- all targets for procedural reactions;
- hit count for repeated visual contact;
- profile id for Phase 18 Sequencer timings/zoom/scale.

The first enemy visual contact triggers `resolveActiveEnemyAction()` once. Later contacts scheduled from `hitCount` only replay presentation feedback. The Scene does not inspect enemy action ids/names to decide damage, target count, Boss phase, or combat outcomes.

## Verification

Implemented automated evidence:

- enemy ActionDefinition -> Intent preserves presentation profile and repeated-hit count;
- hard-stagger carries `none` and does not generate an attack plan;
- enemy plan selects authored `enemy-heavy` and `boss-signature` when present;
- omitted profile falls back to `enemy-light`;
- plan preserves all explicit target ids and hit count;
- pure contact scheduling covers single-hit and repeated-hit timing without creating another primary impact;
- Scene applies impact/reaction feedback to every explicit target id per visual contact;
- Scene calls authoritative enemy resolution only at the first IMPACT, regardless of visual hit count;
- CI run 472: `npm run build` passed;
- CI run 472: `npm test` passed.

Browser QA remains required for readable enemy-light vs enemy-heavy vs boss-signature timing and for multi-hit/AoE visual clarity at 1280×720 and 844×390.

## Out of scope

- generated assets;
- Clash choreography;
- new Boss phase transition art;
- damage-number redesign;
- camera shake/hit-stop tuning beyond existing Phase 18 profile fields;
- changing Boss/Elite/Normal balance or AI;
- changing authoritative multi-hit/AoE resolution rules.
