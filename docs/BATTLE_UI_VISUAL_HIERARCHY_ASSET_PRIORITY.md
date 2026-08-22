# Battle UI Visual Hierarchy / Asset Priority

STATUS = AUTHORITATIVE_PRESENTATION_GUIDE
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

本文件把目前使用者提供的戰鬥參考圖與既定戰鬥母版收斂成一套可執行的視覺層級與資產生產規格。

核心原則：**華麗要集中在有決策價值或事件價值的地方；常駐資訊必須低調、快速讀取，不得讓整個畫面同時出現多個視覺主角。**

本文件目前只規範資產生產與 presentation hierarchy；不要求接入 runtime，也不修改戰鬥規則。

## 參考方向的共同特徵

使用者提供的參考圖共同指向以下 presentation language：

1. 戰場、角色、敵人維持畫面主體；HUD 不建立厚重的大型框牆。
2. Timeline / Party / enemy overhead info 採薄、輕、模組化、資訊優先。
3. 手牌在 idle 時可快速掃讀；選中後 selected card 才升級為主要閱讀物件。
4. Target preview 直接落在戰場目標上，不只依賴文字面板。
5. Execute / Resolve 階段快速退掉決策 UI，把視覺重點交給角色動作、命中、Break、Guard、Delay 等回饋。
6. 強色、金色、高亮、glow 只用於 active / selected / critical event，不作常駐裝飾。

## 視覺層級

### S — 當下主重點

允許最高視覺強度：

- battlefield actor / enemy action
- selected card
- target preview / selected target
- hit / critical / break / interrupt / guard / delay 成功回饋

規則：同一時間最多 1 個主要 focus 群組。若 selected card 是主角，常駐 HUD 必須退階；若 ACTION 演出是主角，card detail / target preview 必須退場。

### A — 主要操作資訊

需清楚但不可搶 S 級：

- shared hand 未選牌
- enemy overhead HP / status / intent cue
- confirm CTA
- active actor cue

規則：資訊可高對比，但面積、裝飾、glow 應低於 S 級。

### B — 常駐工具資訊

以快速掃讀為唯一目標：

- Timeline
- Party HUD
- status icon strip
- Dispatch / Cancel / utility control
- secondary explanation panel

規則：薄框、低 alpha、細線、少裝飾。不得使用厚金屬框、垂飾、徽章群、大片發光材質。

## 戰鬥狀態的畫面重心

### PLAYER_IDLE

- Battlefield = S
- Shared Hand = A
- Timeline / Party / Intent = B
- 五張牌均可辨識 family、卡名與 Delay；不需要每張都像 selected card 一樣華麗。

### CARD_SELECTED

- Selected Card = S
- Battlefield = A
- Other Cards = B/A-
- Selected card 明顯放大或前移；其他牌降低視覺權重。
- 不使用只上浮幾 px 作為唯一 selected feedback。

### TARGET_PREVIEW

- Selected Card + Selected Target = S
- Previewed outcome = A
- Timeline / Party = B
- Targeting feedback 應直接出現在 actor/enemy 所在戰場位置。
- Confirm 是單一強 CTA；Cancel 保持次要。

### EXECUTE_RESOLVE

- Actor animation / attack FX / hit feedback = S
- Damage / Break / Guard / Delay result = A
- Card detail / target preview / command panel 快速退場。
- 不讓決策 UI 與 action FX 同時搶主畫面。

## 資產優先級

### P0 — 值得生成、值得精緻

#### Card Master

目前資產狀態：

- neutral card frame ×1：保留作 runtime trial。
- quick / heavy / guard / disruption / break family visual 各 ×1：現有 1254×1254 透明去背圖規格不合格，退回 `NEEDS_REWORK`，不得計入可用 Card Master。
- 正確 family visual 是符合 neutral frame 圖窗比例的 1.44:1 全滿版不透明 illustration plate；完整尺寸、構圖與驗收規格以 `DEMO_ASSET_REQUIREMENTS_V1.md` 為準。

生產原則：

- family visual 是通用 action language，不含角色身份。
- 禁止 character × card、card definition × illustration。
- 卡名、效果、Delay、target rule 全部 runtime text/data，不烘入圖。
- selected state 優先由 scale / lift / glow / dimming 組合，不另生 selected card image。

#### Key Combat Feedback

只有實際需要的關鍵事件才值得精緻：

- Break / armor break / imbalance cue
- Guard success cue
- Delay / control success cue
- Critical / lethal / interrupt cue

這些應為通用 effect assets，不按角色或卡牌重複製作。

### P1 — 必要，但要非常克制

#### Enemy overhead info

用途：HP、status、intent cue、targeting affordance。

原則：

- 以小模組貼近敵人。
- 不做大型右側 Intent 主面板作為常駐主視覺。
- HP fill、數字、狀態數量、Intent 名稱不烘入 skin。

#### Confirm CTA

- 可有一個強烈 enabled presentation。
- disabled / hover / pressed 優先 runtime state，不生成多張 raster。
- Cancel 不與 Confirm 同權重。

### P2 — 低優先，能程序化就不生成

#### Timeline

- 功能是讀取順序、active actor、preview reorder。
- 使用小 portrait / icon node + 細 connector 即可。
- 不生成大型華麗時間裝置框。
- 不烘入沙漏、時點數字或角色名稱；若使用固定 timeline symbol，也必須證明其對辨識有價值。

#### Party HUD

- portrait、HP、status 快速讀取即可。
- 優先半透明底、細框、runtime bars。
- 不生成厚重角色資訊框，不做每角色一張 skin。

#### Utility / Dispatch

- 小型、中性、功能性。
- Confirm 才能使用強色；Dispatch / Cancel 不應與 selected card 搶重點。

## 生成 / 程序化邊界

### 應生成

- 通用 Card Master frame / family visuals
- 少量真正需要材質感的 key combat feedback
- 若實機證明必要，1 個極簡 enemy overhead / control skin

### 應程序化或 runtime 組裝

- HP / resource bar fill
- names / numbers / damage / Delay / Timeline time
- target ring / candidate ring / focus ring
- selected glow / dimming / disabled mask
- timeline connector / reorder preview / ghost node
- confirm hover / press / disabled state
- status stack count
- layout / responsive spacing

## 禁止生成

- 全畫面 BG + HUD 烘焙圖
- 一張 asset sheet 混入多個正式 runtime 元件
- character-specific card frame
- character-specific HUD frame
- 每張卡牌 definition 一張插圖
- Timeline player/enemy/active 各自一張框
- Party 四角色四張 skin
- Intent 每隻敵人一張 skin
- HP / SP / AP / Delay / 時點數字烘進圖
- 沙漏、icon、數字等可變語意不經需求確認就固定進 neutral skin

## 單檔生產規則

正式 production asset 必須遵守：

1. 一個檔案只對應一個 logical asset。
2. 不用 asset sheet 當正式 runtime source。
3. 必須真透明 alpha；禁止棋盤格背景烘入。
4. 不含文字、數字、角色 portrait、動態 bar fill。
5. 可重用資產不得包含特定角色 ID、特定卡名或狀態值。
6. 先生成 candidate，再審核用途；未確認會使用的元件不生成。

## 目前資產生產順序

1. **Card Master：保留 1 個 neutral frame，重作 5 個 family illustration plates。** 一次只生產並實機驗證一個 family，先從 quick 開始。
2. **Key Combat Feedback：待 Card Master 完成後再判斷。** 優先確認 Break / Guard / Delay 三種是否真的需要獨立通用 cue。
3. Enemy overhead / Confirm：只有在功能 layout 確認後，才考慮各生成 1 個極簡 skin。
4. Timeline / Party HUD：暫不生成華麗 skin；先維持程序化 / 極簡方向。

## 生產預算

從本文件起，不再以「把所有 UI 都各生成一張」作目標。

- Card Master 現有可保留 1 個 neutral frame；五張透明 family cutout 不列入可用資產，重作預算為 5 個 illustration plates。
- 下一批 key combat feedback 預算：0–3 個。
- Enemy overhead / Confirm 若真的需要材質 skin：0–2 個。
- Timeline / Party HUD：預設 0 個 generated skin。

因此目前合理的新增目標是 **最多再 5 個左右**，不是繼續補滿舊 Phase 10q 的 HUD skin 清單。

## 與 Phase 10q 的關係

本文件覆寫 Phase 10q 中「G2 必須生成 Timeline / Party / Intent / Control 四張 neutral skin」的預設假設。

保留：

- UI 與 BG 分層。
- 不做 character × card。
- 不烘文字、數值、bar fill。
- 一個 asset 一個 logical slot。
- 少量通用資產優先。

修正：

- Timeline / Party 不再預設需要 generated skin。
- Intent 改以 enemy overhead / modular info 為主要方向。
- 華麗資產優先留給 Card Master 與 key combat feedback。
- 任何 HUD skin 必須先證明它真的改善可讀性，才進生成。
