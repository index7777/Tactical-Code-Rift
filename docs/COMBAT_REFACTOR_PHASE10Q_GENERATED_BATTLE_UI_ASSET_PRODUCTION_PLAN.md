# Combat Refactor Phase 10q — Generated Battle UI Asset Production Plan

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 修正方向

Phase 10p 對使用者需求理解錯誤：使用者要的是「安排 AI 生成新的戰鬥 UI / UX / HUD 美術資產」，不是用既有 SVG 當最終母版視覺。

Phase 10p 的 SVG reuse 只保留為 temporary fallback / reference，不再作為最終 presentation target。Phase 10q 改以 **少量、通用、可分層的 generated raster assets** 為正式生產方向。

核心原則不變：

1. UI / UX / HUD 不得烘進背景圖。
2. 不生成角色 × 卡牌、角色 × HUD、卡牌 definition × 插畫。
3. 文字、數值、HP、Delay、Timeline 時點、Intent target、selected/disabled/hover 狀態仍由 runtime render。
4. 生成資產必須是可重用的透明 PNG layer / neutral skin；不得生成整張 1280×720 戰鬥 UI 截圖當 runtime asset。
5. 先進 `assets/candidates/`，通過 alpha / crop / runtime composite QA 後才可複製到 `public/assets/`。
6. 本輪生成硬上限 12 個，目標 10 個；超過前必須重新證明無法以 tint / nine-slice / runtime composition 共用。

## 生產批次

### Batch G1 — Card Master Core（6 個 generated assets）

這批優先，直接把手牌拉回母版品質。

#### G1-01 `card-frame-neutral-v1.png`

- 數量：1
- 類型：透明 PNG，中性卡框，不含任何文字、family 顏色、角色、icon、Delay 數字。
- 建議 source：1024×1536。
- 用途：所有技能牌共用，同一張經 runtime tint 成 quick / heavy / guard / disruption / break。
- 必須保留清楚區域：top visual window、name band、effect body、Delay footer safe zone。
- 禁止：五種 family 各生一張完整 card frame。

#### G1-02～G1-06 `card-family-*-visual-v1.png`

- 數量：5
- 類型：透明 PNG family key visual，不含角色臉、角色服裝、卡名、文字、框線。
- 建議 source：1024×1024。
- 同 family 所有卡 definition 共用。

family：

- quick：高速拔刀／切線／冷色殘光語彙。
- heavy：厚重斬擊／重量／朱紅衝擊語彙。
- guard：架勢／護持／青綠防禦語彙。
- disruption：牽制／束縛／延後／紫色控制語彙。
- break：破甲／失衡／金橙碎裂語彙。

這 5 張是「類型主視覺」，不是每張牌的插畫，也不是每名角色各一套。

Batch G1 新生成總數：**6**。

### Batch G2 — Core HUD Skin（4 個 generated assets）

G1 runtime composite 通過後才進行。

#### G2-01 `timeline-node-neutral-v1.png`

- 透明 PNG / nine-slice friendly。
- 一張共用於 player / enemy / active / preview；差異用 tint、outline、alpha、glow。
- 不含 portrait、名稱、時點文字。

#### G2-02 `party-panel-neutral-v1.png`

- 透明 PNG / nine-slice friendly。
- 整個 Party HUD 共用一張 skin。
- 不做 rin/chikage/oboro/mo 四份。
- portrait、HP、status 全部 runtime 疊加。

#### G2-03 `intent-panel-neutral-v1.png`

- 透明 PNG / nine-slice friendly。
- 所有普通敵人、精英、Boss Intent 共用。
- 不含 enemy portrait、Intent 名稱、傷害、target、韌性文字。

#### G2-04 `control-panel-neutral-v1.png`

- 透明 PNG / nine-slice friendly。
- Dispatch / Confirm / Cancel / utility panel 共用。
- 不生成 confirm / cancel / dispatch 三張狀態圖；runtime tint 區分。

Batch G2 新生成總數：**4**。

累計：**10**。

### Batch G3 — Readability Gap Only（0～2 個 generated assets）

只有 G1 + G2 實機 QA 證明資訊仍讀不清時才允許生成。

候選：

- `status-delay-resilience-mark-v1.png` ×1：只有 Delay / 韌性在 Timeline / Intent 上辨識不足才做。
- `guard-control-cue-v1.png` ×1：只有 Guard / control feedback 依靠現有 runtime FX 仍無法辨識才做。

這批不是預設要做；沒有實證就不生成。

全輪最大：**12**。

## 明確不生成

- `rin-quick-card.png` / `mo-heavy-card.png` 等角色 × 卡牌資產。
- 每個 card definition 一張圖。
- 五種 family 各自完整 frame；family 差異由共用 frame + visual + tint 完成。
- player / enemy / active / selected 各自一張 Timeline frame。
- 四名角色各自 Party panel。
- 每隻怪各自 Intent panel。
- confirm / cancel / disabled / hover / selected 按鈕圖片。
- HP bar、數字、文字、target line、focus ring、selected glow。
- 任何含 BG + HUD + cards + portraits 的全畫面烘焙圖。

## 生成與接入順序

1. 先生成 `card-frame-neutral-v1` 一張，單獨審核 frame anatomy。
2. frame 通過後，一次生成五張 family visual；逐張檢查是否「無角色身份、無文字、無 frame、可共用」。
3. G1 六張 candidate 放入 `assets/candidates/ui/battle-card-master-v1/`。
4. 做 1280×720 card composite，只接 G1，不先做 HUD skin；確認卡名、effect、Delay footer 仍可讀。
5. G1 browser QA 通過後才生成 G2 四張 HUD neutral skin。
6. G2 candidates 放入 `assets/candidates/ui/battle-hud-master-v1/`。
7. 以 runtime composition 接 Timeline / Party / Intent / Control；所有文字與 portraits 保持獨立 layer。
8. 最後才判斷 G3 是否真的需要；沒有實機問題就停止生產。

## Candidate 技術要求

- UI layer 必須有真 alpha，不接受棋盤格烘焙。
- 不得包含文字或數值。
- 不得有固定 1280×720 位置資訊；需可被 runtime scale / crop / nine-slice。
- card frame 必須有足夠透明內窗，不讓裝飾吃掉 effect text / Delay footer。
- family visual 主體應集中在中心 70% 內，避免裁切後只剩邊緣 FX。
- 任何發光、粒子、煙霧若屬互動 state，應留給 runtime FX；generated asset 只保留靜態識別語彙。
- 所有 generated candidates 必須先標記 `candidate`，不得自動升級 approved。

## Browser Gate

### G1

- 1280×720：五張手牌不讀卡名即可先辨識 family；卡名 / effect / Delay 不被主視覺吃掉。
- selected card 上浮後仍使用同一張 frame / family visual，不換圖。
- 不同角色使用同一張牌時卡面不變。
- 844×390：collapsed hand 至少保留 family visual + 卡名 + Delay 基本辨識。

### G2

- Timeline / Party / Intent / Control 四種 skin 視覺屬於同一母版語言，但不是同一張大圖裁切。
- portrait、文字、數值可自由變動而不破壞 skin。
- 1280×720 / 16:10 / 21:9 / 844×390 都不因固定 raster 尺寸產生拉伸或裁切錯位。

## 對 Phase 10p 的取代

Phase 10p 的「existing SVG family visual 作最終 Card Master」決策由本文件取代。

仍保留：

- 不做角色 × 卡牌。
- 不做每牌插畫。
- 不做 state-specific assets。
- runtime slot / family semantics 概念。

被取代：

- existing SVG 不再是最終 art target，只能 temporary fallback。
- Batch B 的主要工作改成生成 1 張 neutral card frame + 5 張通用 family key visuals。
