# Tactical Code Rift — Demo Asset Requirements V1

STATUS = AUTHORITATIVE_DEMO_ASSET_PLAN
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 1. Demo scope

This document defines only the assets required to present Area 01 as a coherent playable demo:

- one route map;
- seven battle nodes;
- four player characters;
- eight enemy archetypes including the Boss;
- four battlefield families;
- one shared card system;
- journey, normal battle and Boss audio;
- the minimum combat feedback needed to read actions.

It is not a full-game asset list and does not authorize speculative UI skins, character-specific card art, per-node backgrounds or per-skill illustrations.

## 2. Status language

| Status | Meaning |
|---|---|
| `READY_DEMO` | Existing asset is wired and sufficient for the current demo, subject to its recorded provenance limits. |
| `RUNTIME_TRIAL` | May be used for QA but is not approved or release-cleared. |
| `NEEDS_QA` | Asset exists; correct runtime composite or all-node evidence is still missing. |
| `NEEDS_REWORK` | Existing asset uses the wrong production specification and must not be treated as usable final input. |
| `NEW_REQUIRED` | Demo lacks this asset and cannot reach the intended presentation without it. |
| `PROCEDURAL` | Must be drawn or animated by runtime; do not generate a raster asset. |
| `HOLD` | Useful later but not required to finish this demo. |

`public/assets` location does not imply approval. Release status remains governed by `RELEASE_ASSET_AUDIT.md` and provenance records.

## 3. Executive asset count

| Family | Demo quantity | Existing usable/trial | New or rework |
|---|---:|---:|---:|
| Route-map background | 1 | 1 trial | 0 |
| Route node frame/icon kit | 1 reusable kit | 1 trial | 0; QA required |
| Battle backgrounds | 4 | 4 trial | 0 |
| Player characters | 4 identities | 4 integrated | 0 for demo |
| Enemy masters | 8 identities | 8 trial | 0 for demo |
| Card neutral frame | 1 | 1 trial | 0 |
| Card family illustration plates | 5 | 0 usable | **5 rework required** |
| Key combat feedback | 3 semantic cues | shared FX partly exist | 0–3 after runtime proof |
| Music tracks | 3 roles | 3 paths exist | 0 |
| Core battle SFX | 2 minimum | 2 exist | 0 |
| HUD/Timeline/target/loading skins | 0 | runtime graphics | **0; procedural** |

The only confirmed missing visual production batch is the five card-family illustration plates. Key feedback remains conditional and must not be generated until existing FX are evaluated in the refactored battle.

## 4. Priority order

### P0 — Required before calling the visual demo coherent

1. Correct five card-family illustration plates.
2. Complete selected-card / Preview / Confirm focus-group layout so cards do not cover actor HUD.
3. Run all seven encounters with existing characters, enemies, backgrounds and audio.
4. Verify desktop 1280×720, 2K CSS viewport and 844×390 landscape.

### P1 — Required for polished demo feedback

1. Audit existing shared slash/impact assets in the new battle.
2. Add or generate at most one reusable cue each for Break, Guard success and Delay/Interrupt only if runtime proof shows the current FX cannot communicate them.
3. Recheck route-map node sharpness and train loading choreography at the final displayed size.

### P2 — Hold for later

- native 4K background re-authoring;
- additional character cut-ins;
- per-skill card illustrations;
- per-enemy HUD skins;
- decorative Timeline machinery;
- additional route-node types not used by Area 01;
- event CGs outside the seven-node demo.

## 5. Route-map assets

### 5.1 Area 01 route background

| Runtime file | Current source | Status |
|---|---:|---|
| `public/assets/journey/world01/area01-route-bg-runtime-trial-v2.png` | 1672×941 RGB | `RUNTIME_TRIAL / NEEDS_QA` |

Requirements:

- 16:9, no baked nodes, path lines, labels, train, HUD or weather animation.
- Preserve aspect ratio with cover crop; never stretch to fill viewport.
- Central route graph area stays lower contrast than title and route nodes.
- For demo, the current 1672×941 source may remain a trial. Production master remains 3840×2160 with 2560×1440 and 1280×720 derivatives.

### 5.2 Node kit

Existing reusable kit:

- frames: normal, current, cleared, locked, elite, Boss at 256×256 RGBA;
- icons: start, battle, event, rest, reward, elite, Boss at 160×160 RGBA;
- node FX and connection primitives under `route-map-runtime-v1/`.

Display contract:

- Frame and icon share one center/pivot and are composed as one node component.
- Runtime hit area, selected halo and label must use the same node transform.
- Final displayed frame should not be below 72 logical px on 1280×720.
- Never mix an SVG icon and PNG icon in the same rendered train/node component.
- Path line uses one neutral route color; current/completed state changes value and glow, not blue-versus-red factions.
- Node labels, progress numbers and route lines remain runtime data.

Status: `RUNTIME_TRIAL / NEEDS_QA`. Do not generate replacements until the current 256px/160px sources are tested without CSS or canvas downsampling blur.

### 5.3 Train and loading choreography

Use the existing original `train-token-topdown.svg` as the single train identity for the demo.

- Loading presentation is runtime animation: train moves along one rail/path line with distance-based progress.
- Do not create a second train icon, train SVG, train HUD plate or baked loading bar.
- The route-map train and loading train must use the same silhouette.

Status: `PROCEDURAL`; no new raster asset required.

## 6. Battle backgrounds

| Battlefield | Nodes | Runtime file | Current size | Status |
|---|---|---|---:|---|
| rail halt | battle-1, battle-2-lower, elite-1 | `public/assets/battle/area01-rail-halt-hd2d-candidate-v2.png` | 1672×941 | `RUNTIME_TRIAL` |
| mountain cut | battle-2-upper, battle-3-upper | `public/assets/battle/area01-mountain-cut-bg-runtime-trial-v1.png` | 1672×941 | `RUNTIME_TRIAL` |
| forest path | battle-3-lower | `public/assets/battle/area01-forest-path-bg-runtime-trial-v2.png` | 1672×941 | `RUNTIME_TRIAL` |
| terminal platform | boss-1 | `public/assets/battle/area01-terminal-platform-bg-runtime-trial-v1.png` | 1672×941 | `RUNTIME_TRIAL` |

Shared specification:

- 16:9 complete opaque RGB image.
- HD-2D side battle with a readable ground plane and visible perspective; actors stand on the plane rather than on a visible platform thickness.
- No characters, monsters, UI, cards, labels, rain streaks, damage, target markers or combat FX baked in.
- Central 55% of the frame is a low-detail combat safe zone.
- Landmarks stay toward outer thirds and may not occupy actor head/HUD lanes.
- Demo accepts the existing 1672×941 runtime trials; release master remains native 3840×2160.
- Runtime must cover-crop without aspect distortion at 1280×720, 2560×1440 and 844×390.

No new battle background is required for the Area 01 demo.

## 7. Player character assets

Required identities: `rin`, `chikage`, `oboro`, `mo`.

Minimum demo set per identity:

- idle/ready;
- attack A/B;
- hit A/B or one reusable hit pose plus runtime recoil;
- down;
- normal/current/timeline portrait;
- optional character-authored slash/impact FX already present in the source package.

Runtime specification:

- true RGBA, no baked ground, shadow, UI, glow or generic combat FX;
- player faces right;
- shared foot pivot and consistent alpha-bbox visible height across poses;
- rear/front formation difference comes from stage row scale, not different source canvases;
- ordinary 4v4 visible height target 82–108 logical px;
- death/down returns to the same HOME foot anchor.

Status: `READY_DEMO` for functional demo, but provenance and production-resolution gates remain blocked in `RELEASE_ASSET_AUDIT.md`. Do not generate more player art for this demo unless a concrete pose fails runtime QA.

## 8. Enemy assets

Required reusable masters:

1. wet corpse;
2. lantern child;
3. mountain hound;
4. wayfarer umbrella;
5. noose ghost;
6. lost monk;
7. rain warrior;
8. rain Boss.

Existing ordinary enemy masters are 1536×1024 RGBA; the Boss source is 1254×1254 RGBA.

Demo specification:

- one universal left-facing master per enemy identity;
- idle motion, ready, hit flash, lunge and death dissolve are runtime presentation unless a later approved master explicitly requires pose art;
- true alpha, no baked shadow, glow, rain, slash, HUD or intent icon;
- visible silhouette, head/weapon and foot contact must remain readable in the 2×2 formation;
- dead enemy leaves its immutable slot empty; surviving enemies never compact;
- enemy overhead HUD is runtime and is not part of the enemy image.

Status: ordinary enemies `RUNTIME_TRIAL`; Boss visual approved for runtime but still below the production 2K source target. No new enemy identity is required for the demo.

## 9. Card system

### 9.1 Neutral card frame

| File | Size | Status |
|---|---:|---|
| `card-frame-neutral.png` | 1024×1536 RGBA | `RUNTIME_TRIAL / KEEP` |

Authored anatomy:

- upper illustration window: approximately source y 95–695, aspect about 1.44:1;
- central title band: approximately y 706–814;
- lower effect panel: approximately y 835–1290;
- bottom Delay footer: approximately y 1301–1450.

Runtime rules:

- frame is the only visible card boundary;
- no extra purple selected border, top accent strip, category diamond or footer frame;
- family label + card name occupy the title band;
- effect copy occupies the lower panel;
- Delay occupies the bottom footer;
- selection is scale/lift plus sibling dimming.

### 9.2 Card-family illustration plates — five required reworks

The current five 1254×1254 RGBA family images are `NEEDS_REWORK` and must not be considered usable illustration plates.

Failure evidence:

- square 1:1 source does not match the 1.44:1 art window;
- 38%–66% of pixels are near-transparent;
- the neutral frame art window itself is approximately 89% transparent;
- transparent cutouts therefore expose the battlefield through the card.

Correct plate specification:

- five files: quick, heavy, guard, disruption, break;
- preferred master: 1536×1067 RGB or fully opaque RGBA, matching 1.44:1;
- full-bleed painted image to all four edges; alpha must be 255 everywhere;
- no isolated cutout, transparent padding, checkerboard or empty background;
- main action silhouette stays inside central 70%; outer 12% is low contrast for frame occlusion;
- no character identity, card frame, text, number, Delay, target icon or HUD;
- one semantic family action per image, reusable by every card in that family.

Family direction:

| Family | Read | Palette | Rejection trigger |
|---|---|---|---|
| quick | fast travel / cutting trajectory | cyan, cold blue | static emblem or transparent slash |
| heavy | concentrated weight and impact | vermilion, ember red | unfocused explosion |
| guard | enclosing deflection / stable ward | teal, jade | generic healing illustration |
| disruption | binding / interception / control | violet, indigo | portrait or floating transparent glyph |
| break | fracture / armor rupture | amber, gold | visually indistinguishable from heavy |

Runtime composition order:

1. family-color fallback plate;
2. approved opaque illustration plate;
3. neutral frame;
4. runtime text;
5. selection transform.

Production method: approve this specification first, then generate one candidate family at a time. Do not batch five speculative finals.

## 10. Combat feedback and FX

### Existing shared sources

- sword swish and impact SFX;
- CC0 classic slash sheet;
- shared line/arc slash and impact assets;
- existing character-specific FX packages;
- enemy slash semantic files.

### Demo semantic cues

The battle must communicate three non-damage results:

1. Break / armor-break / imbalance;
2. Guard success;
3. Delay / interrupt success.

First use runtime composition: color, text, hit-stop, displacement, shared slash/impact and particles. Generate at most one reusable transparent FX asset per cue only when a before/after runtime capture proves the current composition is unreadable.

If generated:

- source 1024×1024 RGBA minimum;
- transparent FX only, no character, battlefield, card, text or number;
- central action safe area with at least 8% transparent padding;
- one semantic cue per file;
- may be tinted/scaled by runtime but must remain readable at 96–220 logical px.

Status: `NEEDS_QA`; new asset budget remains 0–3.

## 11. HUD and UI assets

The following are `PROCEDURAL` and require zero generated image files:

- Timeline node frames, connector and active state;
- Party HUD and HP bars;
- enemy overhead name, intent, HP and selected state;
- target candidate/selected marker;
- Preview values;
- Confirm/Cancel/Dispatch states;
- damage, critical, Break, Guard and Delay text;
- loading progress line and train movement;
- card selection glow/dimming;
- route graph lines and route progress.

Rules:

- runtime data is never baked into skins;
- character- or enemy-specific HUD frames are forbidden;
- no full-width black Timeline or hand background;
- no extra selected-card frame when the neutral frame already supplies the boundary;
- a neutral overhead/control skin may be considered only after layout is final and a screenshot proves procedural graphics are insufficient.

## 12. Audio

| Role | Runtime path | Demo status |
|---|---|---|
| Journey / Area 01 train | `assets/music/world-01/zone1-train-bgm.mp3` | existing; provenance pending |
| Normal/elite battle | `assets/battle/demo_battle01.mp3` | existing runtime mapping |
| Boss battle | `assets/music/world-01/zone1-boss-bgm.mp3` | existing; provenance pending |
| Sword movement | `assets/battle/sword-swish.wav` | existing |
| Impact | `assets/battle/sword-impact.wav` | existing |

Do not replace or regenerate audio in this visual asset batch. Verify autoplay unlock, normal/Boss mapping, scene transition and no duplicate playback across all seven nodes.

## 13. File and metadata rules

New candidates:

- `assets/candidates/cards/family-plates/<family>-plate-candidate-vN.png`;
- optional feedback: `assets/candidates/fx/combat-feedback/<cue>-candidate-vN.png`.

Approved runtime trial copies:

- `public/assets/battle/cards/family-plates/<family>-plate-runtime-trial-vN.png`;
- `public/assets/battle/fx/combat-feedback/<cue>-runtime-trial-vN.png`.

Every file must record:

- author/generator and date;
- exact prompt or source procedure;
- source dimensions/mode;
- license/ownership;
- candidate, runtime-trial, approved or rejected status;
- originating specification;
- runtime assignment;
- validation and screenshot evidence.

## 14. Validation gates

### Deterministic

- correct file, size, mode and alpha contract;
- no transparent holes in card illustration plates;
- no baked text/UI/actor contamination;
- unique runtime keys and existing file paths;
- provenance entry present;
- `npm run test`, `npm run build`, `git diff --check` pass.

### Runtime

- 1280×720 desktop;
- 2560×1440 / 2K CSS viewport;
- 844×390 landscape;
- route map idle, selected node and transition loading;
- battle PEEK, FOCUS, TARGETING, ACTION, hit, death, victory and defeat;
- battle-3-upper four-enemy stress scene;
- boss-1 composite;
- no 404, console error, black rectangle, stretched BG, floating actor, UI overlap or audio mismatch.

### Manual Art Director

- silhouette and family differentiation;
- palette and area consistency;
- crop and focal point;
- text readability at actual display size;
- asset usefulness versus procedural rendering;
- explicit approval before promotion from candidate/runtime-trial.

## 15. Production stop rules

- Stop after three failed automatic attempts for one asset.
- Register every failed candidate before retrying.
- Do not generate another family until the current family has runtime evidence.
- Do not upscale a sub-target source and call it native 2K/4K.
- Do not solve a layout defect by generating a new skin.
- Do not retain a rejected asset in runtime merely because code already loads it.

## 16. Recommended next batch

1. Art Director reviews this document, especially the card illustration plate contract.
2. Mark the five transparent square family images as rejected negative references and remove their runtime assignment.
3. Keep the neutral card frame and use an explicit family-color placeholder plate.
4. Produce only `quick` plate candidate v1.
5. Validate and composite it in PEEK/FOCUS at desktop and 844×390.
6. Approve/reject before producing heavy, guard, disruption and break.
