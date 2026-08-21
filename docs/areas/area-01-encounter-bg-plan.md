# Area 01 戰鬥節點 BG 配置

STATUS = AUTHORITATIVE_DESIGN

本文件定義雨暮山線七個戰鬥節點的背景生產方案。採用 RPG／DBG 常見的「場景家族（base master）＋節點變體（runtime dressing）」方式，不為每個節點各畫一張互不相干的背景。

## 核心決策

- 取消目前將普通戰鬥放在列車車頂的正式方向。車頂透視、車體弧面與角色站立線互相衝突，現有 `rooftop` 只保留為歷史 runtime trial。
- 戰鬥鏡頭統一為近似正投影的嚴格橫向舞台；地平線保持水平，不使用廣角、俯視、斜屋頂或強烈消失點。
- 七個節點使用四個 BG Master。差異主要由天候、色調、邊緣道具、燈光與遠景 silhouette 建立。
- 背景不烘焙角色、怪物、UI、路線、雨粒、霧、攻擊 FX、前景遮擋物或接觸陰影；這些由 runtime layer 提供。

## 共通構圖契約

- Source master：`3840×2160`；review/runtime derivative：`2560×1440`；遊戲輸出：`1280×720`。
- 玩家安全區：`x=100..470`；敵方安全區：`x=810..1180`。
- 中央交戰安全區：`x=360..920`，細節密度必須低，不能放柱、樹幹、招牌或高反差燈源。
- 共通站立基準：遊戲座標約 `y=500`；地面必須是水平、可讀、連續的平面。
- 上方 `y=0..118` 保持安靜供時間軸使用；下方 `y=575..720` 保持暗且低細節供卡牌區使用。
- 主要 landmark 只能放在左右外側 20%；中央亮度與對比不得高於角色輪廓。

## 四個場景家族

### F1 雨夜沿線月台（rail-halt）

用途：旅程前半、普通沿線遭遇與精英前哨。水平月台取代車頂，遠景仍可看見停駛列車或鐵道，保留「乘列車深入山區」的敘事。

- Base：濕月台、遠山、暗色站棚輪廓、左右邊緣鐵路設施。
- 中央：空的水平月台，不放椅子、柱子或軌道切線。
- 允許變體：停駛列車遠景、破站牌、較強雨勢、精英用暖色警示燈。

### F2 山壁切通（mountain-cut）

用途：上路分支。以岩壁、護坡與遠方鐵橋建立較危險、速度型怪物較多的感覺。

- Base：水平維修步道／碎石平地、低細節山壁、遠方鐵橋 silhouette。
- 中央：平整淺灰藍地面；岩壁紋理在中央必須淡化。
- 允許變體：風雨、崩落石、隧道口遠景；隧道口只能靠畫面邊緣。

### F3 林間參道（forest-path）

用途：下路深處。用林木、石燈籠與廢棄小祠的外側輪廓呈現靈異感，但中央仍是清楚的水平泥土地。

- Base：濕林、霧、參道平地、左右外側石燈籠／鳥居殘影。
- 中央：不可有樹幹、鳥居柱或強反光水窪。
- 允許變體：冷霧、紙垂、微弱燈火；超自然比例不得超過 20%。

### F4 雨暮終點月台（terminal-platform）

用途：Boss 專用。是 F1 的敘事升級，但必須有獨立 master，不可只用紅色 tint 假裝 Boss 場地。

- Base：封閉終點站月台、破損站舍外緣、停住的末班列車、深山雨幕。
- 中央：寬闊水平決戰區，Boss silhouette 後方保持低細節。
- 色彩：整體仍屬 Area 01 冷藍灰，只在左右邊緣使用克制的暗紅／暖黃警示光。
- 禁止：巨大血月、超自然祭壇、滿畫面紅光、傾斜月台或中央高亮出口。

## 七個節點配置

| 節點 | BG 家族 | 節點變體 | 敘事用途 |
|---|---|---|---|
| `battle-1` | F1 rail-halt | `arrival`：普通雨勢、列車停靠遠景 | 第一場，建立雨暮山線與水平戰鬥規則 |
| `battle-2-upper` | F2 mountain-cut | `bridge`：遠方鐵橋、強風 | 上路速度怪物路線 |
| `battle-2-lower` | F1 rail-halt | `abandoned`：破站牌、較暗站棚 | 下路幽靈／傘妖路線 |
| `battle-3-upper` | F2 mountain-cut | `tunnel`：邊緣隧道口、落石 | 上路深入山區，沿用家族但提高危險感 |
| `battle-3-lower` | F3 forest-path | `shrine`：外側殘鳥居、冷霧 | 下路靈異高潮 |
| `elite-1` | F1 rail-halt | `elite-yard`：較寬月台、暖色警示燈、暴雨 | 雨夜武者＋兩隻小怪；辨識為精英場但不另造世界觀 |
| `boss-1` | F4 terminal-platform | `boss`：終點站、末班列車、暗紅邊緣光 | 第一區 Boss 專用決戰場 |

## Runtime 分層與重用

```text
BG master（四張）
  → atmosphereBack（遠雨、遠霧、雲層）
  → node dressing（站牌、隧道口、橋、鳥居；只放邊緣）
  → battle units / intent lines
  → contact shadows / puddle responses
  → weather / foreground props
  → HUD
```

- F1、F2 的節點差異優先用可重用透明 dressing 與色調參數完成，不重畫整張 BG。
- F3、F4 各自需要一張 master，不能由 F1/F2 強行改色替代。
- 同一家族重複出現時，至少變更兩項：邊緣 landmark、天候強度、遠景 silhouette、局部色溫；不得移動站立線。

## 生產順序

1. F1 `rail-halt`：先取代目前有透視問題的車頂背景，並同時覆蓋 battle-1、battle-2-lower、elite-1。
2. F2 `mountain-cut`：覆蓋兩個上路節點。
3. F3 `forest-path`：完成下路視覺高潮。
4. F4 `terminal-platform`：配合 Rain Boss 核准母版後完成 Boss runtime QA。

每張 candidate 都必須依 Art Pipeline 逐張產生、驗證並在 `1280×720`、`844×390` 戰鬥實機中檢查。通過 deterministic gate 或被接入 runtime 都不代表 Art Director approved。

## 拒絕條件

- `wrong-battlefield-composition`：地面傾斜、強透視或角色像站在斜面。
- `central-area-too-busy`：中央有柱、樹、招牌、強反光或密集岩紋。
- `ground-unreadable`：四名角色無法共享清楚的水平接地線。
- `runtime-overlap`：landmark、燈光或前景遮住角色、意圖線或卡牌區。
- `wrong-area-palette`、`background-too-detailed`、`supernatural-too-strong` 依 Area 01 Art Bible 判定。
