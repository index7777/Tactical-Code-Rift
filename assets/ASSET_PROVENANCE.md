# Runtime Asset Provenance

All assets listed below are approved for the current attack showcase runtime. Candidate archives remain under `assets/candidates/`; selected runtime files are copied to `public/assets/battle/`.

Project-authored journey prototype: `public/assets/journey/world01/train-token-topdown.svg` is original in-repository SVG geometry for the route-map train token. It is not derived from the generated train candidates.

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

| `public/assets/battle/weapon-slash-cc0/classic-slash-sheet.png` | bevouliin | CC0 | [OpenGameArt Weapon Slash - Effect](https://opengameart.org/content/weapon-slash-effect) | Candidate integrated for prototype review; not Art-Director approved. |

| Candidate | Author | License | Source | Decision |
|---|---|---|---|---|
| `public/assets/battle/samurai.png` | sebshady | CC0 1.0 | https://opengameart.org/content/samurai-sprites | Approved for gameplay prototype only. The 3/4-view frames are knowingly used as temporary stand-ins. |
| `public/assets/battle/kamaitachi.png` | Pixel Archer | CC0 1.0 | https://opengameart.org/content/kamaitachi | Approved for gameplay prototype only. Static art is animated through runtime movement and FX. |
| `public/assets/battle/generated/yokai-noise.png`, `intent-smoke-sheet.png` | Project-generated | Project-owned procedural output | `tools/generate_yokai_fx.py` | Deterministic prototype noise and 8-frame smoke flipbook; safe to regenerate and distribute with the project. |

- Pimen's free VFX samples permit commercial use and modification but prohibit redistribution as standalone assets. They were reviewed but not downloaded or approved in this pass.
- The CC0 Kamaitachi image on OpenGameArt is a very small static sprite. It is approved only as a low-cost prototype moved by runtime tweens and shared FX, not as final animation art.
- No Japanese train pack was copied into runtime because the free candidates found did not yet match the battle perspective and pixel scale.
