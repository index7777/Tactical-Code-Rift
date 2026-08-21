# Project Audit — 2026-08-21

STATUS = CURRENT_AUDIT

Scope: runtime visuals, source structure, asset organization, documentation freshness, deterministic checks, tests and production build behavior. This audit does not approve or replace any art asset.

## Executive finding

The gameplay core is testable and the deployed demo is playable, but the project is not yet production-maintainable. The largest risks are not isolated polish defects: two competing character pipelines are loaded under the same texture keys; authoritative documents contain stale identities and widespread mojibake; `BootScene` still owns most battle orchestration; and source packages, candidates, runtime copies and temporary review output are all tracked together without one authoritative asset catalog.

## P0 — fix before adding more content

### 1. Establish one player asset pipeline

- Stable gameplay IDs are `rin`, `chikage`, `oboro`, `mo`, while several authoritative character documents still describe `PA/PD` and `player-a` through `player-d`.
- `NamedPlayerAssetLoader` queues 128x128 side-view actions for all four players. The legacy `BootScene.preload` then queues high-resolution Chikage/Oboro candidates with the same texture keys. The later queue can replace the intended files.
- The effective source resolutions are inconsistent: Rin 128x128, Chikage/Oboro roughly 500–1500 px candidates, and Redleaf 360x240. Visual scale is therefore achieved by runtime resizing rather than a shared source contract.
- The high-resolution Chikage attack pair is largely the same standing illustration re-framed, not a convincing side-view attack sequence. The 128x128 supplied set has the correct action language but is too small for clean enlargement.

Required outcome: one manifest per character, one source per pose key, a shared canvas/pivot/display contract, and a failed build when duplicate runtime keys are declared.

### 2. Repair authoritative documentation encoding and identity

- `docs/README.md`, `docs/art-bible.md`, `docs/ARCHITECTURE.md`, `docs/CURRENT_COMBAT_SPEC.md`, several character/monster specs and parts of `PLANNING_LOG.md` contain mojibake.
- `docs/characters/README.md`, `player-a-heroine.md`, `player-d.md` and `redleaf.md` conflict with the current roster and current physical PNG workflow.
- `PROJECT_STATUS.md` is comparatively current, but it cannot compensate for stale documents still labeled `AUTHORITATIVE`.

Required outcome: rewrite current authoritative files as verified UTF-8, replace slot-code identity with stable IDs, mark superseded files explicitly, and add a documentation link/encoding check.

### 3. Make the canonical build reliable

- Asset metadata validation passed.
- 31 test files / 119 tests passed.
- The canonical `npm run build` failed because `dist/web/assets` was locked (`EPERM`). Building to a fresh `.audit-build` directory passed.

Required outcome: build into a fresh versioned/staging directory and atomically replace deployment output, or stop the process holding `dist` before cleaning. A green test run must not be treated as a deployable build.

## P1 — visual production quality

### 4. Re-author player actions at production resolution

- Do not upscale the 128x128 action cells and call them high resolution.
- Use the approved character master as identity reference, recreate each required side-view pose on a consistent transparent canvas, then validate at 82–100 px and 130–150 px runtime heights.
- Chikage requires a clean production action set first; the previously reported neighboring-frame contamination is absent from the cleaned 128x128 cells, but the game can bypass those cells through the duplicate loader.
- Rin, Oboro and Mo should receive the same inspection and production-resolution contract rather than character-specific ad hoc sizing.
- Production 1280x720 capture confirms the mismatch: the four actors use visibly different silhouette scale, edge treatment and detail density. Chikage carries a bright cyan outer treatment that reads like baked selection/FX residue against the restrained battlefield, while the middle actors are markedly smaller and softer.

### 5. Strengthen alpha and crop validation

- The cleaned Chikage 128x128 action cells each contain one connected alpha component.
- Small isolated alpha noise remains in some Rin/Oboro cells (one-pixel components) and Mo attack B (nine pixels).
- Historic rejected Chikage files visibly contain baked checkerboard or background treatment; they must remain negative references and never be reachable by runtime paths.

Required checks: alpha required for actors/FX, no baked checkerboard/green screen, component-size threshold, edge-color spill score, maximum transparent padding, shared foot pivot and atlas-cell bleed check.

### 6. Replace undersized and trial environment art

- The current route background is 1672x941 and is explicitly below the adopted native 4K / 2K derivative gate.
- Runtime includes candidate/trial filenames, making it easy to mistake prototype assignment for final approval.
- Rain Boss still has no approved master and correctly remains a placeholder.

Required outcome: native production background source, named derivatives, approved/runtime status separated in metadata, and no `candidate` or `runtime-trial` asset in a release manifest.

## P1 — architecture and discoverability

### 7. Decompose `BootScene`

- `BootScene.ts` is approximately 82 KB and remains compressed into long lines.
- It owns preload declarations, animations, music, encounter startup, actor creation, HUD, planning input, battle execution and outcomes.
- The old `loadNamedPlayerAssets` method remains after extracting `NamedPlayerAssetLoader`; the scene is wrapped at file end through `BootScene.prototype.preload`, obscuring control flow.

Recommended boundaries: `BattleAssetManifest`, `BattleSceneAssembler`, `BattleInputController`, `PlanningPresenter`, `BattleExecutionPresenter`, `BattleAudioController`, and a thin Phaser scene lifecycle.

### 8. Replace scattered asset paths with manifests

- Asset paths are embedded directly inside long preload methods.
- There is only one machine-readable recipe, for route-map UI; character, monster, battle background, FX and audio families are not covered.
- Duplicate runtime keys and missing files are not validated before Phaser starts.

Required outcome: typed asset manifests, unique-key validation, existence/dimension/alpha validation, and generated preload code or a single loader service.

### 9. Separate source, candidate, approval and runtime roots

Current tracked inputs include 537 files across temporary review output and root-level delivery packages; 243 are under `tmp`. The scanned art roots total about 250 MB, with 258 identical-hash groups and approximately 68.6 MB of extra byte-identical copies.

Recommended layout:

```text
assets/inbox/          external deliveries, ignored after archival
assets/source/         retained masters and license records
assets/candidates/     review-only, versioned
assets/approved/       Art Director-approved source assets
public/assets/         generated runtime derivatives only
tmp/                   ignored, never tracked
```

Every runtime file should point back to one source/provenance record. Delivery bundles should be archived once, not copied into several searchable roots.

## P2 — quality gates

### 10. Add real scene and visual regression tests

Current tests strongly cover combat rules but do not protect Phaser preload key collisions, scene startup, visual alpha fringes, character pose mapping or screenshots. Add:

- preload manifest test: every URL exists and every key is unique;
- route-to-battle smoke test;
- deterministic 1280x720 and 844x390 screenshot baselines;
- actor silhouette/ground-pivot snapshots for every pose;
- console/network failure gate;
- bundle and initial-load budgets.

The route screen is functional and legible, but unvisited node labels and connectors are low-contrast against the painted valley. This should be solved through state-driven UI contrast rather than brightening the background itself.

### 11. Remove legacy vocabulary from live code

Names such as `heroine`, `HeroinePose` and `poseLocked` now apply to all player characters. They encode obsolete implementation history and make current behavior difficult to understand. Replace them with `playerActor`, `PlayerPose`, and explicit per-character pose policy after the asset pipeline is unified.

## Recommended execution order

1. Repair docs encoding and publish the current roster/asset authority map.
2. Remove duplicate preload paths and make one manifest the only source of texture keys.
3. Add asset/key/path/alpha validators so regressions fail before runtime.
4. Re-author Chikage production-resolution side-view actions, then Rin, Oboro and Mo under the same contract.
5. Split `BootScene` along lifecycle boundaries and add scene smoke tests.
6. Consolidate tracked asset roots and remove tracked temporary review output in a recoverable migration.
7. Replace the route background with a native production master and complete Rain Boss only after master approval.

## Verification evidence

- `npm run validate:assets`: pass.
- `npm run test`: 31 files, 119 tests pass.
- `npm run build`: fails against the existing locked `dist/web/assets` directory.
- `npm run build -- --outDir .audit-build`: pass; app chunk 137.86 kB, Phaser vendor chunk 1,478.53 kB (339.69 kB gzip).
- Runtime PNG inventory: 325 files; 92 have a width or height below 128 px (many are intentionally small UI/card assets, so this is an inventory signal rather than an automatic failure).
- Art-root duplicate scan: 258 identical-hash groups, approximately 68.6 MB redundant bytes.
- Production browser smoke: route node enters battle; no black rectangles, but player scale/edge-style inconsistency remains clearly visible.
