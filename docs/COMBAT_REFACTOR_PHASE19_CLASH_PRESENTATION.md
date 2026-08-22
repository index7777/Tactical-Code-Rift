# Combat Refactor Phase 19 — Clash Presentation

STATUS = PHASE19A_CI_VERIFIED_SCENE_WIRING_PENDING
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 19 presents an already-authoritative Clash result without recalculating Clash eligibility, score, damage, Intent consequence, or target relationships in Phaser.

The visual branch consumes the existing Phase 14 preview result and uses the same confirmed Clash resolution that Phase 14c/14d later commits.

## Presentation sequence

Eligible Clash uses this choreography:

```text
PLAYER APPROACH + ENEMY APPROACH
-> BOTH ANTICIPATION
-> STRIKE
-> CLASH CONTACT
-> HIT-STOP
-> RESULT
-> FOLLOW THROUGH
-> RECOVERY
-> RETURN
```

This is a presentation branch of the existing Action Presentation Sequencer, not a new combat resolver.

## Preview boundary

`TargetPreviewView` exposes a compact Clash presentation snapshot only when `preview.clash.resolution.eligible === true`:

- `contestedEnemyId`
- `outcome`: `player-win | draw | enemy-win`
- player total score
- enemy total score

The Scene must not display or recompute a giant global `CLASH POWER X VS Y` system. Scores are debug/preview metadata; the primary player-facing language is the relationship/result itself.

## Animation plan

Player action presentation attaches an optional Clash branch when the current target preview contains an eligible Clash.

The plan owns only presentation metadata:

- contested enemy actor id;
- authoritative outcome;
- authored/fallback enemy presentation profile id;
- no damage or Intent mutation.

If the contested enemy sprite is unavailable, the Scene may fall back to the existing one-sided player action presentation while preserving the authoritative Clash resolution.

## Contact and resolver ownership

At Clash contact:

- procedural contact FX may play;
- a short presentation-only hit-stop may freeze actor tweens/camera motion;
- `resolveConfirmedPlayerAction()` is called exactly once;
- no enemy resolver call occurs, because the contested enemy Intent consequence is already part of the player authoritative resolution.

Visual result branching:

- `player-win`: enemy is pushed/recoils farther; player follows through.
- `draw`: both recoil a short distance.
- `enemy-win`: player recoils farther; enemy holds forward pressure briefly.

The branch must never call `resolveClashPreview()` or inspect legacy `clashPower`.

## Phase 19a implemented boundary

Implemented and CI verified:

- `TargetPreviewPresenter` consumes `BattlePreviewWithClashResult` and exposes presentation Clash data only for eligible authoritative resolutions.
- unavailable/no Clash produces no presentation branch.
- `RefactorBattleAnimationPlan` carries the same authoritative Clash outcome and contested enemy id into the player presentation plan.
- enemy profile selection reuses authored Intent presentation metadata, with `enemy-light` only as the existing fallback.
- no presentation code recalculates Clash scores or outcome.
- tests cover eligible preview mapping, unavailable Clash suppression, and preservation of enemy-heavy + enemy-win data into the player animation plan.

CI run 480: `npm run build` passed and `npm test` passed.

## Phase 19b pending Scene wiring

Still pending:

- simultaneous player/enemy approach;
- Clash contact FX;
- presentation-only hit-stop;
- player-win/draw/enemy-win recoil/follow-through branch;
- return-to-formation browser QA.

The existing one-sided player action choreography remains active until this Scene wiring batch lands.

## Initial implementation scope

Phase 19 uses only existing sprites/procedural FX.

It may use a fixed presentation-only hit-stop duration and small displacement tuning constants. These constants are visual only and do not enter ActionDefinition or combat math.

Story encounters remain unchanged until authored production Clash metadata is explicitly enabled.

## Verification

Phase 19a evidence:

- Target Preview exposes eligible Clash outcome/contested enemy only from authoritative preview data;
- unavailable/no Clash produces no Clash presentation snapshot;
- player animation plan carries the same authoritative outcome without recalculation;
- build/test pass.

Phase 19b must additionally verify:

- no Scene import of `ClashResolver`;
- Scene calls player resolution once on Clash contact;
- browser-readable simultaneous contact, result branch, and return-to-formation behavior.

## Out of scope

- generated assets;
- production story Clash opt-in;
- new Clash balance or scoring;
- card-family art;
- portrait cut-ins;
- Boss-specific Clash cinematics;
- damage-number redesign.
