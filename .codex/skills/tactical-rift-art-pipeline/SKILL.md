---
name: tactical-rift-art-pipeline
description: Enforce Tactical Code Rift's reusable AI art pipeline for character masters, side-view sprites, poses, attacks, hit/break/down art, event CGs, monsters, and Area Art Bible backgrounds. Use whenever Codex generates, edits, integrates, reviews, approves, or rejects a visual asset for this project.
---

# Tactical Rift Art Pipeline

## Start gate

1. Read repository `AGENTS.md`, `docs/art-bible.md`, and the relevant `docs/characters/*.md` or `docs/areas/*.md` completely.
2. Read `references/approved/index.json` and `references/rejected/index.json`. Open every matching approved/rejected image and reason before prompting.
3. Inspect runtime assignment, candidates and provenance. Never infer approval from a file being in `public/`.
4. Stop if a character lacks an approved Character Master. Do not invent identity, costume, weapon, palette, directions, pose count or gameplay.

## Workflow

1. Generate or edit one candidate using explicit master/spec references and invariants.
2. Save a versioned file under `assets/candidates/<category>/`; update `assets/ASSET_PROVENANCE.md`.
3. Run `python .codex/skills/tactical-rift-art-pipeline/scripts/validate_art_asset.py <asset> --kind character|background --out-dir <temp-review-dir>`.
4. Fix deterministic failures before non-destructive runtime integration.
5. Build and run the actual Phaser scene; capture 1280×720 and 844×390 landscape evidence for combat art.
6. Compare screenshots against the Character Master or Area Spec. Report exact fail codes from `docs/art-bible.md` and concrete observations.
7. On failure, run `register_rejection.py` before the next attempt and reopen that negative reference.
8. Stop after three automatic attempts. Report remaining mismatches; do not generate attempt four.

## Production rules

- Every derived character asset must name the Character Master as its identity reference.
- Every background must name the Area Art Bible and declare the central safe zone.
- Generate one candidate per attempt. Never batch speculative final assets.
- Do not bake FX, glow, environment, shadow, ground, UI or text into reusable character sources.
- Do not bake actors, UI, cards, text, killing-intent lines or attack FX into backgrounds.
- A source preview is never proof; screenshots from the correct runtime scene are mandatory.
- Say more than “looks good”: report silhouette, palette, pivot, scale, overlap, composition and runtime evidence.

## Approval and rejection

- Codex may recommend approval; only the user／Art Director can grant `approved`.
- After approval, update `references/approved/index.json`, the relevant master/spec and provenance.
- Rejected assets remain negative references. Preserve image, code, concrete reason, source and applicable spec.

## Scripts

- `scripts/validate_art_asset.py`: deterministic PNG, dimension, alpha, safe-zone density and review-thumbnail checks.
- `scripts/register_rejection.py`: preserve a rejected image and append its reason to the project rejection index.
