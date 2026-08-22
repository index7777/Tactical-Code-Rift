# Combat Refactor Phase 10p — Card Master Asset Reuse

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

執行 Asset Batch B。不是再縮卡，也不是為每張牌生成一張卡面；本批先把既有 card art / frame / icon 逐項判定，建立可以長期擴充的 Card Master asset policy。

Phase 10o 已限制：卡牌只能由「通用 frame + family visual + runtime data/text」組裝；禁止角色 × 卡牌、卡 definition × 插畫、selected/disabled 等狀態圖。

## 現有資產審核

### Family art — 採用重用

以下五張既有 SVG 的語義與新版五個 family 一致，可作通用 family visual，不需要再生新圖：

- quick → `public/assets/battle/cards/art/quick.svg`
- heavy → `public/assets/battle/cards/art/heavy.svg`
- guard → `public/assets/battle/cards/art/guard.svg`
- disruption → `public/assets/battle/cards/art/delay.svg`
- break → `public/assets/battle/cards/art/break.svg`

它們只代表 family / action language，不代表角色、卡名或單張牌 definition。同一 family 的所有牌共用同一 visual。

### Existing frames — HOLD，不直接當新版 master

現有 `attack.svg / defense.svg / support.svg / tactics.svg` 是舊四分類語義，與新版 `quick / heavy / guard / disruption / break` 不是一對一映射。

因此本批不把它們硬套成五種新版 card frame，也不複製成五張變體。新版 Card Master 先維持 neutral procedural frame + family tint；只有 Browser QA 證明需要更強的實體邊框材質時，後續才允許製作 **1 張 neutral reusable frame**。

結論：本批新增 card frame asset = 0。

### Icons — 先不新增

現有 damage / shield / intercept / relay 等 icon 保留可重用候選，但 card face 第一閱讀層仍是 family visual、卡名、效果摘要、Delay。未經實機證明需要，不把所有 icon 塞入卡面。

結論：本批新增 icon asset = 0。

## Runtime slot policy

新增純 presentation asset policy，固定每個 family 的 runtime key 與來源路徑；Scene / loader 不得自己拼路徑或依角色 ID 決定卡面。

每個 family slot 只有：

- `category`
- `textureKey`
- `path`
- `reuseStatus = REUSE`

禁止出現 actor ID、card instance ID、card definition name、selected/disabled variant path。

## Card Master 組裝規則

卡面分層：

1. neutral base/frame：程序化；
2. family accent/tint：程序化；
3. family visual：五張既有通用 SVG；
4. card name：runtime text；
5. effect summary：runtime text；
6. Delay footer：runtime text + procedural footer；
7. selected / hover / disabled / dispatch-selection：tint / alpha / glow / tween。

禁止把 1–7 合成單張 raster card image。

## 生產預算結果

Phase 10p 審核後 Card Master 本批新增素材：**0**。

後續若母版需要更高完成度，Card Master 最多只開放：

- `card-frame-neutral` ×1（只有程序化 frame 在 Browser QA 明顯不足時才做）；
- 缺失語義 icon ×0–2（只有實機閱讀問題成立才做）。

不得新增五張 family frame、四名角色版本、每牌插畫或 UI state variants。

## 自動驗收

- 五個新版 category 全部有且只有一個 family asset slot。
- family path 不含 `rin / chikage / oboro / mo`。
- family path 不含 selected / disabled / hover variant。
- quick/heavy/guard/disruption/break 分別映射既有 quick/heavy/guard/delay/break SVG。
- asset policy 是 pure presentation data，不 import combat resolver 或 Phaser Scene。
- `npm run build`、`npm run test` 通過。

## Browser gate

Runtime wiring 後確認：

- 五張手牌可在不讀文字前先靠 family visual 區分；
- family visual 不壓卡名與 Delay；
- collapsed hand 仍可辨識 family；expanded/selected 才顯示完整效果摘要；
- 同一 family 不因出牌角色不同而換圖；
- 1280×720 與 844×390 都不得因 art zone 造成卡面不可讀。

## 非目標

- 不生成新圖。
- 不修改 BG、角色、敵人、戰鬥規則、Timeline 或音訊。
- 不把舊四分類 frame 強制升級為新版 master。
