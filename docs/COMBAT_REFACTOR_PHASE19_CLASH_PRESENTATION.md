# Combat Refactor Phase 19 — Clash Presentation

STATUS = IMPLEMENTATION_CONTRACT
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

`TargetPreviewView` may expose a compact Clash presentation snapshot only when `preview.clash.resolution.eligible === true`:

- `contestedEnemyId`
- `outcome`: `player-win | draw | enemy-win`
- player total score
- enemy total score

The Scene must not display or recompute a giant global `CLASH POWER X VS Y` system. Scores are debug/preview metadata; the primary player-facing language is the relationship/result itself.

## Animation plan

Player action presentation may attach an optional Clash branch when the current target preview contains an eligible Clash.

The plan owns only presentation metadata:

- contested enemy actor id;
- authoritative outcome;
- both profile ids already selected for player/enemy presentation;
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

## Initial implementation scope

Phase 19 first implementation is QA-bootstrap capable and uses only existing sprites/procedural FX.

It may use a fixed presentation-only hit-stop duration and small displacement tuning constants. These constants are visual only and do not enter ActionDefinition or combat math.

Story encounters remain unchanged until authored production Clash metadata is explicitly enabled.

## Verification

Required automated evidence:

- Target Preview exposes eligible Clash outcome/contested enemy only from authoritative preview data;
- unavailable/no Clash produces no Clash presentation snapshot;
- player animation plan carries the same authoritative outcome without recalculation;
- no Scene import of `ClashResolver`;
- Scene calls player resolution once on Clash contact;
- build/test pass.

Browser QA remains required for readable simultaneous contact, result branch, and return-to-formation behavior.

## Out of scope

- generated assets;
- production story Clash opt-in;
- new Clash balance or scoring;
- card-family art;
- portrait cut-ins;
- Boss-specific Clash cinematics;
- damage-number redesign.
