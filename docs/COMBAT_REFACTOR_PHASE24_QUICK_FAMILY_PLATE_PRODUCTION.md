# Combat Refactor Phase 24 — Quick Family Illustration Plate Production

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 24 produces exactly one generated asset candidate: the reusable Quick-family illustration plate for the shared card master.

Phase 23 has unlocked generated family-plate production. This phase does not authorize Heavy, Guard, Disruption, Break, combat FX, character art, HUD skins, or other generated assets.

## Source specification

The governing requirements are `DEMO_ASSET_REQUIREMENTS_V1.md` section 9.2.

Quick plate requirements:

- preferred master canvas: `1536×1067`, approximately `1.44:1`;
- RGB or fully opaque RGBA; alpha must be 255 everywhere if alpha exists;
- full-bleed painted image to all four edges;
- semantic read: fast travel / cutting trajectory;
- palette: cyan and cold blue;
- main action silhouette remains inside the central 70%;
- outer 12% stays lower contrast so the neutral card frame may occlude it safely;
- no character identity;
- no card frame;
- no title, effect copy, number, Delay badge, target icon, family label, HUD, or UI;
- no isolated transparent slash, floating emblem, checkerboard, or empty background.

The image must read as one reusable family action rather than a specific named skill or specific actor.

## Candidate policy

The generated file starts as `CANDIDATE_PENDING_RUNTIME_QA` and is never auto-approved.

Only one Quick candidate is produced in this batch. Heavy / Guard / Disruption / Break remain locked until this candidate passes deterministic checks and card-master runtime composite review.

## Validation gate

Before any later family is generated, verify:

1. source aspect is approximately 1.44:1;
2. the image is fully opaque / has no transparent cutout behavior;
3. painted content reaches all four edges;
4. the principal trajectory is readable at card-art-window scale;
5. no forbidden text/UI/character identity is present;
6. neutral-frame cover/crop does not destroy the main action read;
7. desktop and compact selected-card composites remain readable.

If any gate fails, register the candidate as rejected and iterate Quick only. Do not continue to Heavy.

## Out of scope

- runtime approval;
- release provenance promotion;
- the remaining four family plates;
- new card mechanics or balance;
- character-specific card art;
- generated combat FX.
