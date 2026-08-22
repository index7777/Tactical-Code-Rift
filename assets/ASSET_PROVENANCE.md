# Runtime Asset Provenance

All assets listed below are approved for the current attack showcase runtime. Candidate archives remain under `assets/candidates/`; selected runtime files are copied to `public/assets/battle/`.

Project-authored journey prototype: `public/assets/journey/world01/train-token-topdown.svg` is original in-repository SVG geometry for the route-map train token. It is not derived from the generated train candidates.

User-provided route-map UI source package is archived at `assets/candidates/ui/route-map-ui-assets-v1/`. Runtime copies exclude the `reference/` sheets and live under `public/assets/journey/route-map-ui-v1/`. Provenance/license remains pending; integration approval is for the project prototype and does not by itself clear release rights.

User-provided `route_map_runtime_assets_split_v1` is archived intact at `assets/candidates/ui/route-map-runtime-assets-split-v1/`. Its node frames, icons, node FX and connection primitives are runtime trials under `public/assets/journey/route-map-runtime-v1/`; its battle foreground layers are runtime trials under `public/assets/battle/foreground/world01/`. The reference sheet is QA-only and is not loaded by Phaser. Provenance/license remains pending; this integration does not clear release rights or grant final Art Director approval.

`assets/candidates/backgrounds/world01/area01-route-bg-candidate-v1.png` is a project-generated Route BG master candidate created with built-in ImageGen from `docs/areas/area-01-bg-master.md` and `docs/areas/area-01-rainfall-ridgeline.md`. It contains no route geometry, nodes, train token, UI, text, actors or runtime foreground layers. Deterministic background validation passed at 1672×941 with central density below outer density. Status remains candidate pending real JourneyScene viewport QA and Art Director approval; it is not release-approved or assigned to runtime.

`assets/candidates/backgrounds/world01/area01-route-bg-candidate-v2.png` is a built-in ImageGen re-render of v1 intended to improve native painted detail while preserving the route safe zone. The image passes the deterministic background checks at 1672×941 (central density 0.0148 versus outer 0.0174), but the built-in generator did not honor the requested 3840×2160 output. It remains a detail candidate blocked by the 2K/4K production-source requirement and must not be relabeled as native 4K through interpolation.

`public/assets/journey/world01/area01-route-bg-runtime-trial-v2.png` is a byte-identical runtime-trial copy of the v2 candidate assigned to `JourneyScene`. This assignment is authorized for prototype composite review only; it does not satisfy the native 4K production-source gate and does not grant Art Director approval.

| Runtime files | Work | Author | License | Source |
|---|---|---|---|---|
| `hero-knight.png` | Knight spritesheet / Slash Knight assets | marqueeplier | CC0 1.0 | https://opengameart.org/content/knight-spritesheet |
| `enemy-knight.png` | Dark Knight / Slash Knight assets | marqueeplier | CC0 1.0 | https://opengameart.org/content/knight-spritesheet |
| `enemy-idle.png`, `enemy-attack.png` | Knight Enemy | DevWizard | CC0 1.0 | https://opengameart.org/content/knight-enemy |
| `bg-*.png` | Parallax background forest pixel art | MatiasVME | CC0 1.0 | https://opengameart.org/content/parallax-background-forest-pixel-art |
| `slash-fx.png` | Pixel art sword slash effect | tbbk | CC0 1.0 | https://opengameart.org/content/pixel-art-sword-slash-effect |
| `sword-swish.wav`, `sword-impact.wav` | Battle Sound Effects | artisticdude, submitted by Ogrebane | CC0 selected from offered licenses | https://opengameart.org/content/battle-sound-effects |
| `../cards/*.png` | Playing Cards Pack | Kenney | CC0 1.0 | https://kenney.nl/assets/playing-cards-pack |
| `battle-music.ogg` | Chiptune Battle Music | pmiller | CC0 1.0 | https://opengameart.org/content/chiptune-battle-music |
| `../music/world-01/zone1-train-bgm.mp3` | World 01 train-route BGM | User-provided project asset | Provenance/license pending; prototype runtime only | Supplied directly to the project on 2026-08-15 |
| `../music/world-01/zone1-boss-bgm.mp3` | World 01 boss-battle BGM | User-provided project asset | Provenance/license pending; prototype runtime only | Supplied directly to the project on 2026-08-15 |
| `../journey/route-map-ui-v1/**` | Route selection background, frames, node states, paths and icons | User-provided project asset package | Provenance/license pending; prototype runtime only | Archived source: `assets/candidates/ui/route-map-ui-assets-v1/`; reference sheets are not copied to runtime |
| `heroine-sd-idle-v1.png`, `heroine-sd-ready-v1.png`, `heroine-sd-down-v1.png` | Original heroine SD side-view minimum pose set | Built-in ImageGen + project chroma cleanup／cell extraction scripts | Project-generated candidates; release approval pending | `assets/candidates/characters/heroine/` |
| `heroine-sd-down-v2.png` | Deterministic alpha-cropped heroine down pose for PD death runtime | Project crop script; no repainting | Runtime trial; visual approval pending | Derived from `heroine-sd-down-v1.png`; 598×295 RGBA; 9 px baseline gap |
| `world01-rooftop-composite-candidate-v3.png` | World 01 moving-train rooftop battle composition candidate | Built-in ImageGen using the project visual-target candidate as style／layout reference only | Project-generated runtime trial; not release-approved and not yet layered | Source at `assets/candidates/backgrounds/world01/`; v1／v2 retained for comparison; no characters, UI, text, lines or attack FX baked in |
| `references/characters/chikage/chikage-design-reference-v1.png` | Chikage identity／costume reference | User-provided image | Ownership and release provenance pending; reference-only | Supplied directly on 2026-08-17; not production-ready |
| `assets/candidates/characters/chikage/chikage-sd-side-master-candidate-v1.png` | Chikage SD side master attempt 1 | Built-in ImageGen using the user-provided identity reference | Rejected: `alpha-failure` | Checkerboard baked into RGB |
| `assets/candidates/characters/chikage/chikage-sd-side-master-candidate-v2.png` | Chikage SD side master attempt 2 | Built-in ImageGen edit of attempt 1 | Rejected: `pivot-failure` | Genuine alpha, but 64 px transparent bottom gap |
| `assets/candidates/characters/chikage/chikage-sd-side-master-candidate-v3.png` | Chikage SD side master attempt 3 | Built-in ImageGen edit of attempt 2 | Rejected: `alpha-failure`; automatic iteration stopped | Checkerboard baked into RGB and detail repainting began |
| `chikage-sd-side-master-runtime-trial-v1.png` | Deterministically cropped Chikage v2 side master | Project crop script; no repainting | Runtime trial; Art Director approval pending | `assets/candidates/characters/chikage/chikage-sd-side-master-candidate-v2-cropped.png`; RGBA, bottom gap 10 px |
| `references/characters/oboro/oboro-design-reference-v1.png` | Oboro identity／costume reference | User-provided image | Ownership and release provenance pending; reference-only | Supplied directly on 2026-08-17; not production-ready |
| `oboro-sd-side-master-runtime-trial-v1.png` | Oboro SD side master candidate | Built-in ImageGen＋project deterministic chroma cleanup／crop | Runtime trial; Art Director approval pending | `assets/candidates/characters/oboro/oboro-sd-side-master-candidate-v1-cropped.png`; 656×861 RGBA, bottom gap 10 px |

### 2026-08-18 runtime pose completion (trial)

千景與朧不新增猜測性的衍生立繪。兩者的 Master texture 由 `HeroinePose.ts` 共用於 idle／ready／strike／hit，並以 Phaser 位移、碰撞停頓、染色與 FX 完成攻擊表現；down 則使用同一張 Master 的 52% 高度、78° 倒地旋轉與低彩 tint。這是可回復的 runtime trial，不代表兩名角色的 Master 或任何衍生 pose 已獲 Art Director 核准。

### 2026-08-18 approved-master pose trials

千景與朧獲 Art Director 核准後，以 `tools/generate_character_pose_trials.py` 從各自 Master deterministic 產生 `ready / attack / hit / down` 候選。候選沒有重繪、FX、背景或文字；攻擊衝擊仍由 Phaser runtime FX 負責。`ready` 為 v1，旋轉／染色後 pose 經 alpha crop 為 v2；目前均為 runtime-trial，待實機截圖驗收。

## Usage notes

### 2026-08-21 Rain Boss textual master approval

- The Art Director approved the project-original textual Character Master in `docs/monsters/rain-boss.md` and reduced enemy production to one universal left-facing `master-side` asset.
- Idle, ready, hit and break behavior must reuse the master through runtime transforms and FX. Death uses an original runtime dissolve treatment rather than a separate down pose or copied third-party animation.
- This approval authorizes one visual master candidate; it does not pre-approve any generated image or release asset.
- Built-in ImageGen attempt v1 (`assets/candidates/monsters/rainfall-ridgeline/rain-boss-master-side-candidate-v1.png`) returned genuine alpha but was rejected as `wrong-facing`: three-quarter concept-art stance, oversized curved blade and a 1254px source below the 2048px master target. The rejection is preserved under `references/rejected/characters/`.
- Corrected attempt v2 (`assets/candidates/monsters/rainfall-ridgeline/rain-boss-master-side-candidate-v2.png`) is a 1254x1254 RGBA visual candidate. Deterministic alpha, bbox and foot-baseline checks passed; manual Art Director review remains required. Its torso retains a slight three-quarter read and the source remains below 2048px, so it is not assigned to runtime.
- The Art Director approved v2 on 2026-08-21. A byte-identical runtime copy is assigned as `public/assets/battle/generated/monsters/rainfall-ridgeline/rain-boss-master-runtime-v1.png`; it renders at 158px height in `boss-1`. The original 1254px source resolution is recorded and is not represented as native 2K.
- Enemy deaths reuse their universal master and dissolve upward through runtime desaturation/fade/shards; no enemy down-pose asset is required.

### 2026-08-21 F4 terminal-platform background candidate

| Runtime file | Work | Author | License | Source |
|---|---|---|---|---|
| `public/assets/battle/area01-terminal-platform-bg-runtime-trial-v1.png` | Area 01 F4 terminal-platform Boss BG | Built-in ImageGen, directed by the Area 01 Art Bible and encounter BG plan | Project-generated candidate; release approval pending | `assets/candidates/backgrounds/world01/area01-terminal-platform-bg-candidate-v1.png`; 1672x941 RGB |

- Candidate v1 contains no actors, UI, precipitation, supernatural escalation or combat FX. The station building and track buffer remain at the outer edges while the central combat zone stays flat and quiet.
- Deterministic validation passed 16:9, minimum runtime size and central-density advisory (`center=0.0128`, `outer=0.0204`).
- This is a reversible runtime trial for `boss-1`, not an approved production master. It remains below the required 3840x2160 production-source gate.

### 2026-08-21 F3 forest-path background candidates

| Runtime file | Work | Author | License | Source |
|---|---|---|---|---|
| `public/assets/battle/area01-forest-path-bg-runtime-trial-v2.png` | Area 01 F3 林間參道 BG；下路深處節點 | Built-in ImageGen, directed by the Area 01 Art Bible and encounter BG plan | Project-generated candidate; release approval pending | `assets/candidates/backgrounds/world01/area01-forest-path-bg-candidate-v2.png`; 1672×941 RGB |

- Candidate v1 was rejected with `baked-weather`: visible rain streaks were painted into the reusable BG instead of remaining a runtime weather layer. The rejection is preserved under `references/rejected/backgrounds/`.
- Candidate v2 removes all precipitation and passed 16:9, minimum runtime size and central-density advisory (`center=0.0272`, `outer=0.0280`).
- The v2 assignment is a reversible runtime trial for `battle-3-lower`, not an approved production master. It remains below the required 3840×2160 production-source gate.

### 2026-08-21 F2 mountain-cut background candidate

| Runtime file | Work | Author | License | Source |
|---|---|---|---|---|
| `public/assets/battle/area01-mountain-cut-bg-runtime-trial-v1.png` | Area 01 F2 山壁切通 BG；上路兩個節點共用 | Built-in ImageGen, directed by the Area 01 Art Bible and encounter BG plan | Project-generated candidate; release approval pending | `assets/candidates/backgrounds/world01/area01-mountain-cut-bg-candidate-v1.png`; 1672×941 RGB |

- Deterministic background validation passed 16:9, minimum runtime size and central-density advisory (`center=0.0177`, `outer=0.0170`).
- This is a reversible runtime trial for `battle-2-upper` and `battle-3-upper`, not an approved production master. It remains below the required 3840×2160 production-source gate.

### 2026-08-21 F1 rail-halt background candidate

| Runtime file | Work | Author | License | Source |
|---|---|---|---|---|
| `public/assets/battle/area01-rail-halt-bg-runtime-trial-v1.png` | Area 01 F1 雨夜沿線月台 BG；取代普通車頂戰鬥方向 | Built-in ImageGen, directed by the Area 01 Art Bible and encounter BG plan | Project-generated candidate; release approval pending | `assets/candidates/backgrounds/world01/area01-rail-halt-bg-candidate-v1.png`; 1672×941 RGB |

- Deterministic background validation passed 16:9, minimum runtime size and central-density advisory (`center=0.0204`, `outer=0.0251`).
- This is a reversible runtime trial for `battle-1`, `battle-2-lower`, and `elite-1`, not an approved production master. It remains below the required 3840×2160 production-source gate.

### 2026-08-20 named player runtime integration

| Runtime files | Work | Author | License | Source |
|---|---|---|---|---|
| `characters/rin/runtime/*.png`, `characters/rin/portraits/*.png`, `characters/rin/fx/*.png` | Amamiya Rin 8-pose side-view runtime, portraits and FX | User-provided project asset | Provenance/license pending; prototype runtime only | `chikage_oboro_rin_split_assets_v1/amamiya-rin/` for the corrected side-view runtime; `momiji_rin_single_assets_v1/amamiya-rin/` for portraits and FX |
| `characters/chikage/**` | Chikage 8-pose side-view runtime, portraits and FX | User-provided project asset | Provenance/license pending; prototype runtime only | `chikage_oboro_rin_split_assets_v1/chikage/` |
| `assets/candidates/characters/chikage/runtime-cleanup-v1/*.png` | Chikage 8-pose runtime alpha-layer cleanup | Deterministic connected-component cleanup of the user-provided runtime PNGs | Runtime candidate; identity and primary pose pixels unchanged | Removed only disconnected neighboring-frame fragments, then rebuilt the 4x2 runtime sheet; source references remain preserved |
| `characters/oboro/**` | Oboro 8-pose side-view runtime, portraits and FX | User-provided project asset | Provenance/license pending; prototype runtime only | `chikage_oboro_rin_split_assets_v1/oboro/` |
| `characters/mo/**` | Momiji 8-pose side-view runtime, portraits and FX | User-provided project asset | Provenance/license pending; prototype runtime only | `momiji_rin_single_assets_v1/momiji/` |

- Runtime identity keys are now `rin`, `chikage`, `oboro`, and `mo`. Formation order remains separate in `actorIndex`; A-D are not character identities.
- These files are integrated as prototype runtime trials. Their presence under `public/` is not release approval.

- No Canva output is used. The PA slot now intentionally uses one project-generated heroine candidate for browser scale/composite evaluation; it is not release-approved final art and does not establish provenance for the user's external style references.
- No emoji is used as runtime art.
- The selected sounds are recorded weapon swishes, not synthesized electronic UI sounds.
- Attribution is not required by CC0, but this file is retained for auditability and release credits.
- The current files are approved for the prototype runtime. Any replacement or derivative must receive its own provenance entry.
- Player and enemy runtime characters now come from the same Slash Knight asset set; the older `enemy-idle.png` and `enemy-attack.png` remain only as unused legacy files.
- Current enemy prototypes deliberately reuse free assets: swift/hexer use the CC0 Kamaitachi candidate with distinct runtime tint/timing, while crusher uses the CC0 Dark Knight sheet. These are gameplay placeholders, not approved final monster art.
- `zone1-train-bgm.mp3` is archived by world and purpose under `public/assets/music/world-01/`. It is approved for local prototype playback only until ownership or distribution rights are documented; it must not be treated as release-cleared merely because it exists in runtime.
- `zone1-boss-bgm.mp3` follows the same prototype-only restriction. It is reserved for the first-world Boss encounter and must not replace normal or elite battle music.

## Yokai Railway candidate review

### 2026-08-22 Phase 12 user-supplied card masters

| Runtime files | Work | Author | License | Source |
|---|---|---|---|---|
| `public/assets/battle/cards/master-v1/card-frame-neutral.png` | Phase 12 neutral runtime card frame | User-provided project asset | Provenance/license pending; runtime trial only | `D:/Tactical-Code-Rift/tactical-code-rift-card-assets-v1/` |
| `public/assets/battle/cards/master-v1/card-family-{quick,heavy,guard,disruption,break}.png` | Rejected 1:1 transparent card-family cutouts; negative reference only, runtime assignment to be removed | User-provided project asset | `REJECTED_SPEC`: wrong aspect/full-bleed contract; provenance/license pending | `D:/Tactical-Code-Rift/tactical-code-rift-card-assets-v1/` |

- Files are byte-preserved copies; no image generation or cleanup was performed.
- The neutral frame remains a runtime trial. The five square transparent family images are rejected as illustration inputs because they expose the battlefield through the frame window and use the wrong aspect/composition contract.
- Integration does not imply release approval. The rejected family files must lose runtime assignment in the next implementation batch; ownership/distribution rights and final Art Director approval remain open gates.

| `public/assets/battle/weapon-slash-cc0/classic-slash-sheet.png` | bevouliin | CC0 | [OpenGameArt Weapon Slash - Effect](https://opengameart.org/content/weapon-slash-effect) | Candidate integrated for prototype review; not Art-Director approved. |

| Candidate | Author | License | Source | Decision |
|---|---|---|---|---|
| `public/assets/battle/samurai.png` | sebshady | CC0 1.0 | https://opengameart.org/content/samurai-sprites | Approved for gameplay prototype only. The 3/4-view frames are knowingly used as temporary stand-ins. |
| `public/assets/battle/kamaitachi.png` | Pixel Archer | CC0 1.0 | https://opengameart.org/content/kamaitachi | Approved for gameplay prototype only. Static art is animated through runtime movement and FX. |
| `public/assets/battle/generated/yokai-noise.png`, `intent-smoke-sheet.png` | Project-generated | Project-owned procedural output | `tools/generate_yokai_fx.py` | Deterministic prototype noise and 8-frame smoke flipbook; safe to regenerate and distribute with the project. |

- Pimen's free VFX samples permit commercial use and modification but prohibit redistribution as standalone assets. They were reviewed but not downloaded or approved in this pass.
- The CC0 Kamaitachi image on OpenGameArt is a very small static sprite. It is approved only as a low-cost prototype moved by runtime tweens and shared FX, not as final animation art.
- No Japanese train pack was copied into runtime because the free candidates found did not yet match the battle perspective and pixel scale.
