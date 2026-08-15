# Runtime Asset Provenance

All assets listed below are approved for the current attack showcase runtime. Candidate archives remain under `assets/candidates/`; selected runtime files are copied to `public/assets/battle/`.

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

## Usage notes

- No Canva or generative-image output is used.
- No emoji is used as runtime art.
- The selected sounds are recorded weapon swishes, not synthesized electronic UI sounds.
- Attribution is not required by CC0, but this file is retained for auditability and release credits.
- The current files are approved for the prototype runtime. Any replacement or derivative must receive its own provenance entry.
- Player and enemy runtime characters now come from the same Slash Knight asset set; the older `enemy-idle.png` and `enemy-attack.png` remain only as unused legacy files.
- Current enemy prototypes deliberately reuse free assets: swift/hexer use the CC0 Kamaitachi candidate with distinct runtime tint/timing, while crusher uses the CC0 Dark Knight sheet. These are gameplay placeholders, not approved final monster art.
- `zone1-train-bgm.mp3` is archived by world and purpose under `public/assets/music/world-01/`. It is approved for local prototype playback only until ownership or distribution rights are documented; it must not be treated as release-cleared merely because it exists in runtime.
- `zone1-boss-bgm.mp3` follows the same prototype-only restriction. It is reserved for the first-world Boss encounter and must not replace normal or elite battle music.

## Yokai Railway candidate review

| Candidate | Author | License | Source | Decision |
|---|---|---|---|---|
| `public/assets/battle/samurai.png` | sebshady | CC0 1.0 | https://opengameart.org/content/samurai-sprites | Approved for gameplay prototype only. The 3/4-view frames are knowingly used as temporary stand-ins. |
| `public/assets/battle/kamaitachi.png` | Pixel Archer | CC0 1.0 | https://opengameart.org/content/kamaitachi | Approved for gameplay prototype only. Static art is animated through runtime movement and FX. |
| `public/assets/battle/generated/yokai-noise.png`, `intent-smoke-sheet.png` | Project-generated | Project-owned procedural output | `tools/generate_yokai_fx.py` | Deterministic prototype noise and 8-frame smoke flipbook; safe to regenerate and distribute with the project. |

- Pimen's free VFX samples permit commercial use and modification but prohibit redistribution as standalone assets. They were reviewed but not downloaded or approved in this pass.
- The CC0 Kamaitachi image on OpenGameArt is a very small static sprite. It is approved only as a low-cost prototype moved by runtime tweens and shared FX, not as final animation art.
- No Japanese train pack was copied into runtime because the free candidates found did not yet match the battle perspective and pixel scale.
