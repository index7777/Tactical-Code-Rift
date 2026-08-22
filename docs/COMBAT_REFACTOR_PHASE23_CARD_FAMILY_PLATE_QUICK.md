# Combat Refactor Phase 23 — Quick Card-family Illustration Plate

STATUS = CANDIDATE_GENERATION
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 23 begins the final asset batch with exactly one family: Quick. It follows `DEMO_ASSET_REQUIREMENTS_V1.md` and does not batch-generate Heavy / Guard / Disruption / Break.

The output is a review candidate only. Generation does not imply Art Director approval, runtime integration, release clearance, or provenance completion.

## Quick plate specification

- semantic read: fast travel / cutting trajectory;
- palette: cyan and cold blue;
- preferred plate aspect: approximately 1.44:1 (`1536×1067` production target);
- fully opaque, full-bleed painted image to all four edges;
- central 70% contains the primary cutting / travel silhouette;
- outer 12% remains lower contrast so neutral-frame occlusion is safe;
- no isolated transparent slash, no emblem-only composition;
- no character identity, portrait, card frame, text, numbers, Delay label, target icon, HUD, or UI;
- no baked card border;
- one reusable family action language, not a per-skill illustration.

## Visual direction

Create a high-energy diagonal cutting trajectory across a rainy, abstracted dark battlefield atmosphere. The motion should read immediately as speed first: compressed streaks, narrow blade-like arcs, displaced rain/mist, and a clear directional passage. Keep the center readable at card scale and avoid a generic explosion.

The image must still function as a painted illustration plate rather than an FX sprite: there must be opaque environmental tone and value across the entire rectangle, including the corners.

## Rejection gates

Reject the candidate if any of the following are present:

- transparent or checkerboard background;
- square / portrait composition that cannot crop safely to 1.44:1;
- static crest, icon, sigil, or logo as the dominant read;
- character or recognizable named actor;
- text / numeric UI;
- card frame or baked border;
- generic radial explosion with no directional cutting path;
- important motion silhouette placed in the outer 12% crop-risk band.

## Workflow gate

1. Generate one Quick candidate.
2. Review composition and semantic read.
3. Only after explicit user approval, persist/integrate that candidate and update provenance/status.
4. Heavy generation remains blocked until Quick is reviewed.

## Out of scope

- Heavy / Guard / Disruption / Break generation;
- runtime card integration before approval;
- new combat FX;
- character cut-ins;
- gameplay / balance changes;
- browser-QA status changes for Phase 22.
