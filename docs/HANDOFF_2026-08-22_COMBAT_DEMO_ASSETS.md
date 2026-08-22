# Tactical Code Rift — Combat Demo / Asset Handoff

STATUS = CURRENT_HANDOFF
DATE = 2026-08-22
SOURCE_BRANCH = `codex/combat-pages-release`
TARGET_REMOTE_BRANCH = `combat-refactor-v1`
BASE_REMOTE_COMMIT = `28febf0`
ASSET_PLAN_COMMIT = `95466d7`

## 1. 接手時先讀

1. `AGENTS.md`
2. `CAPABILITY_REGISTRY.md`
3. `docs/README.md`
4. `docs/COMBAT_REFACTOR_V1.md`
5. `docs/COMBAT_REFACTOR_PROGRESS.md`
6. `docs/COMBAT_REFACTOR_PHASE11_ROUTE_CUTOVER.md`
7. `docs/COMBAT_REFACTOR_PHASE12_FORMATION_HAND_CHOREOGRAPHY.md`
8. `docs/DEMO_ASSET_REQUIREMENTS_V1.md`
9. `docs/RELEASE_ASSET_AUDIT.md`
10. `assets/ASSET_PROVENANCE.md`

`docs/archive/` 與舊 `docs/HANDOFF.md` 只供歷史比較，不是目前設計輸入。

## 2. 今日完成範圍

### 新戰鬥與正式路線

- `combat-refactor-v1` 已取代預設舊戰鬥入口；舊系統仍由 legacy archive / rollback 路徑保留，沒有刪除可追溯設計。
- Area 01 七個節點已接到新版戰鬥資料與返回流程，包含普通、菁英與 Boss 節點。
- 正常勝利回到路線並更新節點進度；失敗走重試／返回路線；Boss 勝利走區域完成流程。
- 戰鬥 BGM、Boss BGM、旅程音樂與既有 sword swish / impact 音效維持上線版語意映射，不以本次視覺重構替換。

### 戰場與隊形 presentation

- 玩家與敵人改為可重用的 2×2 上二／下二隊形；支援敵方 1–4 名。
- 角色站位以 HOME foot anchor、前後排尺度與 depth sort 管理，不使用角色 identity 特例座標。
- 死亡敵人保留原 slot 空位，其他敵人不往前遞補。
- 重疊時依地面深度排序；隊形增加水平分離，避免四敵 stress scene 堆成一團。
- 玩家朝右、敵人朝左；角色可見高度由 alpha bbox 正規化，前後排差異由 stage profile 決定。
- enemy overhead HUD 收斂為角色上方單一元件，不再同時疊大型 Intent 面板與多組資訊框。
- 多餘常駐選取圈已移除；候選、已選目標與 active actor 使用不同且受狀態控制的 affordance。

### Timeline、Party HUD 與手牌

- 上方 Timeline 與下方手牌均移除 full-width 黑色背板，直接浮動於完整 BG。
- Timeline 使用小 portrait node、細 connector 與 active cue；不生成大型裝置框。
- Party HUD 固定於左側 safe zone，不侵入 2×2 玩家 formation。
- 手牌改為 `PEEK / FOCUS / TARGETING / HIDDEN / DISPATCH` presentation states：
  - PEEK 只露出約半張卡；
  - 選牌後抽出完整卡；
  - action 前 UI 退場；
  - resolve 與角色回 HOME 後才恢復手牌。
- 卡牌文字依現有 neutral frame 的原生分區配置：title band、effect panel、Delay footer。
- 移除額外紫框、上方裝飾線、category diamond 與 runtime footer 框；neutral frame 是唯一卡牌邊界。

## 3. Demo 資產決策

權威母表為 `docs/DEMO_ASSET_REQUIREMENTS_V1.md`。

### 可沿用／進 QA

- Area 01 route background ×1。
- route node frame/icon reusable kit ×1。
- battle background ×4：rail halt、mountain cut、forest path、terminal platform。
- 玩家角色 ×4。
- 敵人 identity ×8：wet corpse、lantern child、mountain hound、wayfarer umbrella、noose ghost、lost monk、rain warrior、rain Boss。
- neutral card frame ×1。
- Journey、normal/elite battle、Boss 三種音樂角色與兩個核心戰鬥 SFX。

這些檔案存在不代表 release-cleared；背景、角色、敵人、音樂的 provenance / native-resolution / Art Director gate 仍以 `RELEASE_ASSET_AUDIT.md` 為準。

### 明確退回重作

目前五張 `card-family-{quick,heavy,guard,disruption,break}.png`：

- 1254×1254、1:1；
- 約 38%–66% 像素接近透明；
- 無法填滿 neutral frame 約 1.44:1 的 illustration window；
- 疊入後會讓戰場 BG 穿透卡面。

因此五張圖已定義為 `REJECTED_SPEC / NEEDS_REWORK`，不可再稱為完成資產。下一批要製作的是五張 **全滿版不透明 illustration plates**：

- preferred master：1536×1067，約 1.44:1；
- RGB 或 RGBA alpha 全部 255；
- 四邊滿版，禁止透明留白／isolated cutout；
- 不含角色身份、卡框、文字、數字、Delay、target icon 或 HUD；
- 主動作集中中央 70%，外圍 12% 降低對比供卡框遮擋；
- 一次只做並實機驗證一個 family，順序先 quick。

### 不應生成的項目

- Timeline、Party HUD、enemy overhead、target marker。
- HP、數字、名稱、Delay、damage、critical、Break、Guard、Interrupt 文字。
- route line、loading progress 與列車移動。
- selected-card 第二層框、每角色 HUD skin、每張卡獨立插圖。

以上均應保持 runtime/procedural，不能用新 PNG 掩蓋 layout 問題。

## 4. 目前檔案與重要 commit

- `af888e8 refactor: separate battle formations and hand states`
- `b05e18e fix: align card content and target markers`
- `e14747e refactor: unify enemy overhead hud`
- `6c336c8 fix: follow authored card frame anatomy`
- `95466d7 docs: define Area 01 demo asset requirements`

`95466d7` 同步修正：

- `docs/DEMO_ASSET_REQUIREMENTS_V1.md`
- `docs/BATTLE_UI_VISUAL_HIERARCHY_ASSET_PRIORITY.md`
- `docs/COMBAT_REFACTOR_PHASE12_FORMATION_HAND_CHOREOGRAPHY.md`
- `docs/RELEASE_ASSET_AUDIT.md`
- `assets/ASSET_PROVENANCE.md`

避免舊文件繼續誤稱五張透明 family 圖為已完成 Card Master。

## 5. 驗證與限制

- 今日最新 UI 實作批次提交前已完成對應 tests、production build、desktop Chrome composite 與 Console 檢查；各批驗證結果已寫入 `docs/PLANNING_LOG.md`。
- `DEMO_ASSET_REQUIREMENTS_V1.md` 與本 handoff 是文件批次；沒有生成圖片，也沒有升級任何 runtime-trial 為 approved。
- 本 handoff 提交前重新執行文件路徑存在檢查與 `git diff --check`。
- GitHub Pages 更新仍取決於 remote `combat-refactor-v1` push 後的 Pages workflow；push 本身不等同部署完成。

## 6. 下一批建議順序

1. 從 runtime 移除五張 rejected transparent family 圖的 assignment，先用不透明 family-color placeholder plate，neutral frame 保留。
2. 只生成 `quick` illustration plate candidate v1。
3. 在 1280×720、2560×1440 與 844×390 驗證 PEEK / FOCUS / TARGETING composite。
4. Art Director 明確 approve / reject quick 後，才依序製作 heavy、guard、disruption、break。
5. 五張 card plates 完成後，再用實機證據判斷 Break、Guard、Delay/Interrupt 是否需要最多三個共用 FX；不要預先生產。
6. 完整跑七節點：互動、音樂、音效、勝敗返回與 Boss 結束流程，保存 Console 與畫面證據。

## 7. 禁止事項

- 不得恢復舊戰鬥為正式入口。
- 不得因目前 PNG 已存在於 `public/` 就稱為 approved。
- 不得用 SVG 或程序框臨時替代使用者要求的正式 raster node/card art。
- 不得再將透明去背 family 圖塞入滿版 illustration window。
- 不得用更多 UI skin 掩蓋站位、層級、文字配置或 responsive 問題。
- 不得讀取 `docs/archive/` 作現況設計。

