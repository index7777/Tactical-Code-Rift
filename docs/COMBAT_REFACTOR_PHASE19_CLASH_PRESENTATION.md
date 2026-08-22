# Combat Refactor Phase 19 — Clash Presentation

STATUS = CI_VERIFIED_BROWSER_QA_PENDING
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

If the contested enemy sprite is unavailable, the Scene falls back to the existing one-sided player action presentation while preserving the authoritative Clash resolution.

## Contact and resolver ownership

At Clash contact:

- procedural contact FX plays;
- a short presentation-only hit-stop freezes active tween motion;
- `resolveConfirmedPlayerAction()` is called exactly once;
- no enemy resolver call occurs, because the contested enemy Intent consequence is already part of the player authoritative resolution.

Visual result branching:

- `player-win`: enemy recoils farther; player follows through.
- `draw`: both recoil symmetrically.
- `enemy-win`: player recoils farther; enemy holds forward pressure.

The branch never calls `resolveClashPreview()` or inspects legacy `clashPower`.

## Phase 19a implemented boundary

Implemented and CI verified:

- `TargetPreviewPresenter` consumes `BattlePreviewWithClashResult` and exposes presentation Clash data only for eligible authoritative resolutions.
- unavailable/no Clash produces no presentation branch.
- `RefactorBattleAnimationPlan` carries the same authoritative Clash outcome and contested enemy id into the player presentation plan.
- enemy profile selection reuses authored Intent presentation metadata, with `enemy-light` only as the existing fallback.
- no presentation code recalculates Clash scores or outcome.

CI run 480: `npm run build` passed and `npm test` passed.

## Phase 19b implemented Scene wiring

Implemented and CI verified:

- `ClashPresentationChoreography.ts` owns presentation-only synchronized timing, hit-stop, result hold, and recoil magnitudes.
- player and contested enemy approach the same contact lane simultaneously using their authored presentation profiles.
- synchronized timing uses the slower participant duration for anticipation, approach, strike, recovery, and return so one participant never completes a Clash phase before the other.
- Clash contact plays procedural feedback, commits `resolveConfirmedPlayerAction()` exactly once, then enters a fixed presentation-only hit-stop.
- result motion branches from the already-authoritative `player-win / draw / enemy-win` outcome.
- both actors return to their pre-Clash formation positions and scales before normal Scene flow resumes.
- no `resolveActiveEnemyAction()` call occurs in the Clash branch.
- if the contested enemy sprite is unavailable, normal one-sided player choreography remains the safe presentation fallback.

CI run 484: `npm run build` passed and `npm test` passed.

## Initial implementation scope

Phase 19 uses only existing sprites/procedural FX.

Fixed hit-stop and displacement constants are presentation-only and do not enter ActionDefinition or combat math.

Story encounters remain unchanged until authored production Clash metadata is explicitly enabled.

## Verification

Automated evidence now covers:

- Target Preview exposes eligible Clash outcome/contested enemy only from authoritative preview data;
- unavailable/no Clash produces no Clash presentation snapshot;
- player animation plan carries the same authoritative outcome without recalculation;
- synchronized choreography selects the slower authored participant timing;
- win/draw/lose displacement semantics are deterministic;
- build/test pass.

Browser QA remains required for:

- simultaneous contact readability;
- hit-stop feel;
- player-win/draw/enemy-win result readability;
- return-to-formation behavior at 1280×720 and 844×390.

## Out of scope

- generated assets;
- production story Clash opt-in;
- new Clash balance or scoring;
- card-family art;
- portrait cut-ins;
- Boss-specific Clash cinematics;
- damage-number redesign.
