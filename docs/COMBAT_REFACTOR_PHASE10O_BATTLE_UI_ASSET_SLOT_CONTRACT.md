# Combat Refactor Phase 10o — Battle UI Asset Slot Contract

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把既定戰鬥 UI 母版拆成可重用的 runtime asset slots，先盤點「已有／可重用／需要新做／應程式化」再生產素材，避免為每張卡、每名角色、每個 HUD 狀態生成獨立圖片。

本批是 Asset Batch A，只建立資產契約與完整需求清單；不生成新圖、不替換目前 BG、不修改 combat rule。

## 不可違反的生產規則

1. 戰鬥 BG 不得烘入 Timeline、Party HUD、Intent、手牌、按鈕、文字、數值、target line、focus ring、HP bar 或任何操作提示。
2. UI / UX / HUD 必須以獨立 layer 組裝；禁止 `battle-ui-fullscreen.png` 類整張螢幕烘焙圖。
3. 卡牌禁止 `角色 × 卡牌` 組合素材；同一張通用牌不可因出牌者不同而產不同圖。
4. 卡牌採 `1 個通用 frame + family visual + runtime text/data`；新增卡 definition 不等於新增圖片。
5. hover / selected / disabled / candidate / active / preview 等狀態優先用 Phaser Graphics、tint、alpha、mask、shader、tween，不生狀態圖。
6. HP、Delay、傷害、韌性、Intent target、Timeline 時點、牌名與效果文字全部 runtime render，不烘進圖片。
7. 既有資產只因符合 slot 語義才可重用；「資料夾裡有」不是接入理由。
8. 本輪新 UI/HUD 視覺資產硬上限 10–12 個；目標 6–8 個。超過上限前必須重新檢查是否能 nine-slice／tint／程序化。

## Status 定義

- `EXISTING`：已存在且語義可直接使用。
- `REUSE`：已存在，可在本母版中重用，但仍需 runtime QA。
- `NEW`：真正缺少，允許進後續資產生產批。
- `PROCEDURAL`：必須由程式繪製／動態組裝，不應生成圖片。
- `HOLD`：現有檔存在，但本母版不應因存在就接入。
- `FORBIDDEN`：禁止的資產型態。

## A. Battlefield / Stage

| Slot | Status | Runtime source / contract | 備註 |
|---|---|---|---|
| battle-background-current-qa | `EXISTING` | `public/assets/battle/area01-rail-halt-hd2d-candidate-v2.png` | 目前 refactor gameplay QA BG；本批不替換 |
| rail-halt-runtime-trial | `EXISTING` | `public/assets/battle/area01-rail-halt-bg-runtime-trial-v1.png` | 舊 runtime-trial；不得自動取代目前 QA BG |
| mountain-cut-runtime-trial | `EXISTING` | `public/assets/battle/area01-mountain-cut-bg-runtime-trial-v1.png` | 未來 stage profile 用 |
| forest-path-runtime-trial | `EXISTING` | `public/assets/battle/area01-forest-path-bg-runtime-trial-v2.png` | 未來 stage profile 用 |
| terminal-platform-runtime-trial | `EXISTING` | `public/assets/battle/area01-terminal-platform-bg-runtime-trial-v1.png` | Boss stage 用 |
| foreground-weather | `REUSE` | `public/assets/battle/foreground/world01/`、`public/assets/battle/fx/` | 只按 encounter/stage 需要載入，不全疊 |
| target-ring | `PROCEDURAL` | Phaser Graphics | candidate / selected 分狀態 |
| active-focus-ring | `PROCEDURAL` | Phaser Graphics + tween | Phase 10i focus |
| contact-shadow | `PROCEDURAL` 或既有 foreground | stage profile 驅動 | 不烘進角色圖 |

## B. Player character assets

權威 mapping 為 `src/presentation/assets/player-assets.json`。每名角色共用同一套 8-pose runtime contract：`idle-a / idle-b / ready / attack-a / attack-b / hit-a / hit-b / down`；不為 UI 另外生成角色卡面。

| Character | Pose root | Current portrait | Timeline portrait | Status |
|---|---|---|---|---|
| rin | `public/assets/battle/characters/rin/runtime/` | `characters/rin/portraits/amamiya-rin-portrait-current.png` | `characters/rin/portraits/amamiya-rin-portrait-timeline.png` | `EXISTING` |
| chikage | `public/assets/battle/characters/chikage/runtime/` | `characters/chikage/portraits/chikage-portrait-normal.png` | `characters/chikage/portraits/chikage-portrait-combat.png` | `EXISTING` |
| oboro | `public/assets/battle/characters/oboro/runtime/` | `characters/oboro/portraits/oboro-portrait-current.png` | `characters/oboro/portraits/oboro-portrait-timeline.png` | `EXISTING` |
| mo | `public/assets/battle/generated/characters/redleaf/production/` | `redleaf-portrait-current.png` | `redleaf-portrait-timeline.png` | `EXISTING` |

禁止新增：`rin-card-*`、`chikage-card-*`、`oboro-card-*`、`mo-card-*`、角色專屬 HUD frame、角色專屬 Timeline frame。

## C. Enemy assets

普通／精英／Boss 本體沿用 rainfall-ridgeline runtime masters；Intent/Timeline 使用 portrait，不把 battlefield master 縮成 UI portrait。

Canonical enemy IDs：

- `monster-wet-corpse`
- `monster-lantern-child`
- `monster-mountain-hound`
- `monster-wayfarer-umbrella`
- `monster-noose-ghost`
- `monster-lost-monk`
- `monster-rain-warrior`
- `monster-rain-boss`

Runtime master root：`public/assets/battle/generated/monsters/rainfall-ridgeline/`。

Portrait contract：`public/assets/battle/portraits/<enemy>-current.png` 與 `<enemy>-timeline.png`。

| Slot | Status | 備註 |
|---|---|---|
| enemy-battle-master | `EXISTING` | 每 enemy 一個 canonical master；不為 Intent 複製第二份 full-body |
| enemy-current-portrait | `EXISTING` | Intent / current target |
| enemy-timeline-portrait | `EXISTING` | Timeline node |
| enemy-selected-outline | `PROCEDURAL` | tint / ring / glow |
| enemy-hit-reaction | `PROCEDURAL` + existing FX | 普通 QA 不要求每招新 pose |

## D. Shared Hand / Card Master

### D1. Card family visual

現有 root：`public/assets/battle/cards/art/`。

新版五 family 只使用五個通用 visual：

| Family | Reuse asset | Status |
|---|---|---|
| quick | `art/quick.svg` | `REUSE` |
| heavy | `art/heavy.svg` | `REUSE` |
| guard | `art/guard.svg` | `REUSE` |
| disruption | `art/delay.svg` | `REUSE`；語義改由 runtime label 顯示「干擾」 |
| break | `art/break.svg` | `REUSE` |

現有 `cover.svg / cycle.svg / relay.svg` 可作 utility/effect cue，但不是新的 card family；不得因此把 family 擴成八套 frame。

### D2. Card frame

現有：

- `frames/attack.svg`
- `frames/defense.svg`
- `frames/support.svg`
- `frames/tactics.svg`

這四個屬舊分類，與新版五 family 不一對一。

| Slot | Status | 生產決策 |
|---|---|---|
| card-frame-neutral | `NEW`（優先） | 最多 1 張 SVG / nine-slice；若能從現有 frame 抽成 neutral，則降為 `REUSE`、新資產 0 |
| card-family-color | `PROCEDURAL` | tint / border color |
| card-family-mark | `PROCEDURAL` 或重用 family art | 不另生五套整卡 |
| selected-card-glow | `PROCEDURAL` | glow + lift + scale |
| disabled-card-mask | `PROCEDURAL` | alpha / desaturate |
| dispatch-selected-mark | `PROCEDURAL` | 與 skill selected 分離 |

### D3. Card icon library

現有：`damage.svg / shield.svg / intercept.svg / balance.svg / power.svg / relay.svg / restore.svg / tempo.svg`。

新版只按語義挑選：

| Logical icon | Current source | Status |
|---|---|---|
| damage | `icons/damage.svg` | `REUSE` |
| guard | `icons/shield.svg` | `REUSE` |
| interrupt | `icons/intercept.svg` | `REUSE`，browser QA 後確認語意 |
| dispatch | `icons/relay.svg` 或 `art/cycle.svg` | `REUSE` 候選，二選一 |
| delay | 無明確新版專用 icon | `NEW_OPTIONAL`，最多 1 |
| break | `art/break.svg` 的小型化或 Graphics | `REUSE/PROCEDURAL` |
| resilience | 先文字／刻度 | `PROCEDURAL`；只有 QA 不可讀才允許 `NEW_OPTIONAL` 1 |
| target | Graphics | `PROCEDURAL` |

`power.svg`、`tempo.svg` 是舊玩法語意，Phase 10o 標為 `HOLD`，不得因檔案存在直接顯示給玩家。

## E. Timeline HUD

| Slot | Status | 生產決策 |
|---|---|---|
| timeline-node-frame | `NEW` | 1 張 neutral SVG / nine-slice；player/enemy/active 全由 tint/state 重用 |
| timeline-portrait | `EXISTING` | player/enemy timeline portrait |
| timeline-baseline | `PROCEDURAL` | line |
| timeline-connector | `PROCEDURAL` | line / tick |
| timeline-time-label | `PROCEDURAL` | text |
| active-node-glow | `PROCEDURAL` | glow / scale |
| preview-node | `PROCEDURAL` | alpha / outline |
| delay-move-preview | `PROCEDURAL` | tween / connector |
| killed-node-removal | `PROCEDURAL` | fade / collapse |

禁止：每角色一張 Timeline frame、active 專用 raster frame、enemy 專用完整 frame。

## F. Party HUD

| Slot | Status | 生產決策 |
|---|---|---|
| party-panel-frame | `NEW` | 1 張通用 nine-slice / SVG |
| party-row-frame | `PROCEDURAL` | 不另生；用 panel + line / alpha 分隔 |
| party-portrait | `EXISTING` | current portrait |
| hp-bar-bg/fill | `PROCEDURAL` | Graphics |
| status-mark | `PROCEDURAL/REUSE` | 共用 icon，不按角色生 |
| dead/disabled-state | `PROCEDURAL` | alpha / mask |

禁止：每角色一張 party panel、把姓名／HP 數字烘進 portrait。

## G. Enemy Intent HUD

| Slot | Status | 生產決策 |
|---|---|---|
| intent-panel-frame | `NEW` | 1 張通用 nine-slice / SVG |
| intent-portrait | `EXISTING` | `<enemy>-current.png` |
| intent-name | `PROCEDURAL` | text |
| intent-target | `PROCEDURAL` | text/icon |
| intent-damage | `PROCEDURAL` | number + damage icon |
| intent-delay | `PROCEDURAL` | number + optional delay icon |
| interrupt/guard flags | `PROCEDURAL/REUSE` | icon + text |
| resilience | `PROCEDURAL` | number/ticks |

禁止：每種 enemy intent 一張完整 panel 圖、把目標名／傷害／Delay 烘進圖。

## H. Command / Dispatch / Preview controls

| Slot | Status | 生產決策 |
|---|---|---|
| ui-control-frame | `NEW` | 1 張 neutral nine-slice；Dispatch / Confirm / Cancel 共用 |
| dispatch-icon | `REUSE` | cycle / relay 候選 |
| confirm-state | `PROCEDURAL` | tint / text |
| cancel-state | `PROCEDURAL` | tint / text |
| disabled-state | `PROCEDURAL` | alpha / desaturate |
| preview-panel-frame | `REUSE` | 優先共用 `ui-control-frame`；只有尺寸需求證明不適合才新增 1 |
| tooltip | `PROCEDURAL` | Graphics/text |

## I. Battle FX

現有共用：`public/assets/battle/fx/`，包括 p8 arc slash / clash cross / impact bloom / line slash 與 p9a slash PNG 候選。

| FX | Status | 生產決策 |
|---|---|---|
| sword slash | `REUSE` | 不新增 |
| impact | `REUSE` | 不新增 |
| clash | `REUSE` | 不新增 |
| break flash | `REUSE/PROCEDURAL` | tint + impact |
| focus pulse | `PROCEDURAL` | ring/tween |
| target pulse | `PROCEDURAL` | ring/tween |
| guard pulse | `PROCEDURAL` first | QA 證明不足才允許新增 1 |
| control/delay ripple | `PROCEDURAL` first | QA 證明不足才允許新增 1 |
| death dissolve | `PROCEDURAL` | tween / particles |

## J. Audio

本資產批不新增音訊，只把 canonical source 固定：

- normal / elite battle BGM：`public/assets/battle/demo_battle01.mp3` → `battle-music`
- Boss battle BGM：`public/assets/music/world-01/zone1-boss-bgm.mp3` → `boss-battle-music`
- Journey BGM：`public/assets/music/world-01/zone1-train-bgm.mp3` → `journey-world-01`
- sword swish：`public/assets/battle/sword-swish.wav`
- sword impact：`public/assets/battle/sword-impact.wav`

`public/assets/battle/battle-music.ogg` 標為 `HOLD`，不是新版 canonical BGM。

## K. 允許新增的 UI/HUD 資產清單

### Mandatory candidate slots（最多 5）

1. `ui-card-frame-neutral.svg` — 只有現有 frame 無法抽成 neutral 才製作。
2. `ui-timeline-node-frame.svg` — 一張 neutral，所有 node state 共用。
3. `ui-party-panel-frame.svg` — 一張通用 panel。
4. `ui-intent-panel-frame.svg` — 一張通用 panel。
5. `ui-control-frame.svg` — Dispatch / Confirm / Cancel / Preview 優先共用。

### Optional slots（最多 3，必須先有 browser QA 缺口）

6. `icon-delay.svg`。
7. `icon-resilience.svg`。
8. `fx-guard-or-control-generic.svg/png` — guard/control 只能先選一個真正缺口，不預先兩個都做。

因此 Phase 10o 後續生產預算：**理想 5–7 個；硬上限 8 個，未經重新審核不得超過。**

## L. 明確禁止清單

- `battle-ui-fullscreen.png`
- 把 HUD / Timeline / card dock / button / text 烘在 BG 上
- 每角色一張卡面
- 每 card definition 一張完整卡圖
- 每角色一張 HUD frame
- 每角色一張 Timeline frame
- active / hover / selected / disabled 各自做 raster state
- 每 Intent 一張 panel
- 每敵人技能一套長動畫
- 為了填滿資料夾而接既有舊玩法 `power / tempo` icon
- 因有 `route-map-ui` 資產就直接搬進 battle HUD

## M. 後續分批

- **Batch B — Card Master**：先嘗試完全重用現有 family art；只在必要時做 neutral card frame。
- **Batch C — Core HUD Skin**：Timeline / Party / Intent / Control 四個通用 skin。
- **Batch D — Icons / Status Language**：只補 QA 證明缺失的 icon。
- **Batch E — FX / Interaction Polish**：先程序化，必要時最多補 1 個通用 cue。
- **Batch F — Final Integration / Responsive QA**：不生新資產，驗 1280×720、16:10、21:9、844×390。

## Phase 10o 驗收

- 有完整 logical slot 清單，且每個 slot 被標為 `EXISTING / REUSE / NEW / PROCEDURAL / HOLD / FORBIDDEN`。
- 所有 UI/HUD 都能在 BG 上獨立拆換。
- 卡牌新增角色或新增 card definition 時，不要求新增美術。
- 新 UI/HUD 生產預算不超過 8 個 candidate assets。
- 本批沒有生成、替換或核准任何美術資產。
