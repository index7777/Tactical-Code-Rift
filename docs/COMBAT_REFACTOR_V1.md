# 戰鬥系統重構規格 v1

STATUS = PROPOSED_AUTHORITATIVE_FOR_REFRACTOR_BRANCH
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

本文件定義戰鬥系統的重構方向。此次工作以「替換現行戰鬥資訊架構與互動模型」為主，不沿用現行已上線 HUD、雙列時序、殺生線主導、整輪預排／多人同輪下令等設計。

保留的只有：

- TypeScript／Phaser／Vite 技術棧。
- 角色與敵人 runtime 素材、資產 manifest 與可重用 presentation 元件。
- 共用牌組作為戰術資源的概念。
- 敵人意圖公開、時序影響、掩護／防禦／干擾等戰術主題。
- core / application / presentation 分層原則。

以下所有舊流程均視為待替換，而不是繼續修補：

- 一輪內替四名角色連續規劃指令。
- 雙列我方／敵方時序 HUD。
- 常駐殺生線作為主要戰術閱讀介面。
- 「下一回合」作為主要提交節點。
- 現行 round planner 對整輪 action node 的規劃方式。
- 現行卡牌 `clashPower / tempo` 作為主要玩家閱讀模型。

## 新核心循環

戰鬥改為單位級行動循環：

1. Timeline 決定下一個可行動單位。
2. 若為我方角色，該角色成為唯一可操作角色。
3. 玩家從全隊共享的 5 張手牌中選擇 1 張牌，或選擇「調度」。
4. 選牌後進入目標預演；UI 預覽 HP、Intent、Timeline 與狀態窗口的變化。
5. 確認目標後立即執行該單一行動。
6. 結算傷害／防禦／干擾／破勢／死亡。
7. 根據該牌 Delay 重新排入 Timeline。
8. 進入下一個單位行動。

不再存在「同一輪替四名角色全部排完」的規劃階段。

## 共用手牌

- 全隊共用一套牌庫。
- 可見手牌固定 5 張。
- 輪到誰，就只能由該角色從這 5 張中使用 1 張。
- 未使用的牌自然保留在手中。
- 出牌後該牌進棄牌堆，立即補牌回 5 張。
- 牌庫空時將棄牌堆洗回。
- 無 AP／Mana／每回合資源點。
- 每次我方行動只能出 1 張牌。

### 調度

「調度」取代舊跳過／整備／每輪棄牌按鈕的主要用途。

- 本次不出牌。
- 選擇 0～2 張手牌棄掉。
- 抽取相同數量。
- Delay 3。
- 調度本身是一個完整行動。

## Timeline

### 核心資料模型

每個活著的單位都有：

- `nextActionAt`: 絕對時間值。
- 固定 tie-breaker / initiative id。

下一行動者為 `nextActionAt` 最小者。

### UI 規則

- 敵我共用單一 Timeline。
- 只顯示未來 6～8 個節點。
- 節點位置必須嚴格依 `nextActionAt` 由小到大排序。
- 敵人節點直接帶下一 Intent 的簡要結果，例如 `20 → 紅葉`。
- 不再顯示我方／敵方雙列時間軸。

### Preview 語言

所有預演統一使用以下視覺語言：

- 延後／提前：舊位置保留 Ghost，新位置顯示預覽節點。
- 打斷：敵人節點保留，但 Intent 替換成 `硬直`。
- 擊殺：敵人節點與 Intent 進入刪除預覽。
- 防禦：當前敵方事件位置不動，只修改該 Intent 的傷害／目標結果。
- 行動者自身：同時預覽出牌後自己的下一個 Timeline 位置。

### 行動窗口

「新增行動窗口」定義為：敵方節點被延後後，跨過了多少個原本在其後方的我方行動節點。

UI 可以顯示 `+1 行動窗口`，但不把這個數字作為規則資源。

## Delay

卡牌唯一主要成本為 Delay。

- 快速牌：Delay 3 左右。
- 標準牌：Delay 4～5。
- 強攻：Delay 6～7。
- 調度：Delay 3。
- 不額外設 AP。

prototype 初期 Final Delay 不低於 2。

## 角色差異

角色採軟專精，不鎖牌。

### 凜 `rin`

定位：搶先／插入未來。

- 專精【迅擊】。
- 使用迅擊後，如果其下一次行動成功跨過至少一個原本在前方的敵人節點，該次攻擊 +3 傷害。

### 千景 `chikage`

定位：修改敵方事件結果。

- 專精【守勢】。
- 守勢可指定任意友軍；其他角色的基礎守勢只作用於自己。
- 成功降低某次敵方直接傷害後，該攻擊者下一次行動延後 1（承勢）。

### 朧 `oboro`

定位：移動敵方未來。

- 專精【干擾】。
- 對某敵人在它本次成功行動前第一次造成延後時，額外延後 1。

### 紅葉 `mo`

定位：刪除未來／處決。

- 專精【強攻】。
- 強攻消耗【破勢】狀態時，額外 +4 傷害。

## 卡牌功能類型

第一版統一成 5 類：

1. 迅擊：低 Delay、搶位。
2. 強攻：高即時傷害、高 Delay。
3. 守勢：接受敵人行動但修改結果。
4. 干擾：延後／打斷／削弱 Intent。
5. 破勢：建立短效戰術窗口，供後續牌消耗。

所有卡牌都可由任何角色使用，但只有對應角色會得到專精收益。

## 破勢

破勢不是長效 Debuff，而是 Timeline Window。

統一規則：

- 敵人下一次成功行動後失效。
- 可被對應類型卡牌消耗。

第一版：

- 破甲：下一次強攻額外 +50% 基礎傷害，觸發後移除。
- 失衡：下一次干擾忽略 1 點控制韌性，觸發後移除。

## 控制韌性

敵人可以有基礎韌性。

- 延後效果 = 基礎延後 + 角色／卡牌修正 - 韌性。
- 同一敵人在成功行動前每被延後一次，額外獲得 1 點臨時韌性。
- 成功行動後臨時韌性清除，回到基礎值。
- 實際延後最低為 0。

UI 必須直接顯示「實際延後」，不可要求玩家自行算。

## Intent

敵人在完成本次行動後，立即決定並公開下一個 Intent。

每個 Intent 至少包含：

- 名稱。
- 目標。
- 直接結果（傷害／狀態／規則）。
- 是否可延後。
- 是否可打斷。
- 是否可防禦／轉移。

Intent 與持續狀態分開呈現。

## 戰場角色位置

位置只服務演出，不是戰棋規則。

### Home Position

- 四名我方角色各有固定待機位置。
- 前後差距要小，避免暗示前排／後排。
- 位置不提供任何數值效果。

### Action Position

- 當前可行動角色短暫踏入中央 Action Zone。
- 出牌／演出結束後回 Home Position。

### Reaction Position

- 掩護、截擊、處決等技能允許暫時進入特殊反應位置。
- 演出後回 Home Position。

## HUD 重構

### 必留

- 上方單一 Timeline。
- 中央大戰場，四名我方角色持續可見。
- 敵人 Intent 小面板。
- 底部 5 張共享手牌 + 調度。
- 左側極簡 Party HP／狀態列。

### 必刪

- 雙列 Timeline。
- 常駐大面積殺生線。
- 卡牌 AP／費用數字。
- 左下資源球。
- 右側教學／Legend 常駐面板。
- 大型「下一回合／結束規劃」按鈕。
- 常駐多條 targeting 線。

### 選牌狀態

UI 狀態只保留四種：

1. `IDLE_ACTIVE_ACTOR`
2. `CARD_SELECTED`
3. `TARGET_PREVIEW`
4. `EXECUTE_RESOLVE`

取消目標回到 `CARD_SELECTED`；取消選牌回到 `IDLE_ACTIVE_ACTOR`。

## Presentation 架構目標

現行 `BootScene.ts` 不再繼續累積戰鬥 HUD／互動責任。

新增／重構建議：

- `BattleTurnController`：單位級行動狀態機。
- `TimelineModel`：`nextActionAt` 排序與時序修改。
- `TimelinePresenter`：單 Timeline 與 Ghost Preview。
- `HandPresenter`：5 張共享手牌與調度。
- `TargetPreviewPresenter`：HP／Intent／Timeline 預演。
- `BattleActorPresenter`：Home / Action / Reaction Position。
- `EnemyIntentPresenter`：敵人 Intent 與持續狀態分離。

`BootScene` 最終只做 preload、scene lifecycle 與 presenter/controller 組裝。

## Core 重構目標

現行 round-based API 不作為新流程的主控制面。

需建立新 domain 層：

- `BattleTimelineState`
- `BattleTurnState`
- `ActionChoice`
- `IntentState`
- `DelayEffect`
- `ControlResilience`
- `BreakWindow`

舊 `RoundPlanner`、整輪 `PlayerCommand` map、`applyPlannedInitiative` 等可暫留作過渡，但新系統不得依賴它們作主要 runtime loop。

## 遷移策略

### Phase 0：文件與隔離

- 本文件成為 `combat-refactor-v1` 分支的重構依據。
- 不在 main 上直接重寫 live combat。
- 先建立新 core 與 presenter，舊流程保持可建置。

### Phase 1：Timeline Domain

- 建立單 Timeline domain model 與測試。
- 支援 next actor、Delay、提前、延後、tie-break、死亡移除。
- 不碰現行 UI。

### Phase 2：單角色行動狀態機

- 新增 `BattleTurnController`。
- 一次只允許當前角色選 1 張或調度。
- 先用文字／測試資料驗證，不接完整動畫。

### Phase 3：共享手牌新循環

- 出 1 補 1。
- 未使用手牌保留。
- 調度 0～2。
- 建立固定種子測試。

### Phase 4：新 HUD 平行實作

- 新 `TimelinePresenter`。
- 新 `HandPresenter`。
- 新 `EnemyIntentPresenter`。
- 新 `TargetPreviewPresenter`。
- 不重用現行雙列 timeline renderer 與殺生線主導 HUD。

### Phase 5：角色位置與演出接軌

- Home / Action / Reaction Position。
- 既有角色素材可重用，但站位與流程重做。

### Phase 6：切換入口

- 以 query flag 或 feature flag 啟用新戰鬥流程。
- 新舊模式並存直到新模式通過測試與實機 QA。

### Phase 7：移除舊 runtime path

新模式驗收完成後才刪：

- round planning UI。
- 雙列 timeline renderer。
- 舊殺生線主導 planning interaction。
- 舊 skip／next-round flow。

## 第一批驗收條件

新 core / prototype 至少必須通過：

- 只有 Timeline 最前的我方角色能操作。
- 該角色每次只能出 1 張或調度。
- 任何牌不消耗 AP。
- 出牌後依 Delay 排回 Timeline。
- 延後敵人會重新排序，UI 可計算跨越多少我方窗口。
- 打斷不移除敵人，只替換 Intent。
- 擊殺會從 Timeline 移除敵人與未來 Intent。
- 千景守勢修改傷害結果但不移動本次敵方節點。
- 朧延後與控制韌性正確結算。
- 紅葉消耗破勢增傷。
- 凜迅擊搶位成功才獲得專精收益。
- 1280×720 戰場至少 50% 高度保留給角色與敵人。
- 四名我方角色在所有操作狀態都持續可見。

## 非目標

第一批不做：

- 新 Roguelike 外層。
- 新角色素材生成。
- 新 Boss 美術。
- 元素系統。
- 裝備／遺物。
- AP／Mana。
- 前後排／距離／格子站位。

## 決策

本次重構的核心不是把現有 HUD 換皮，而是把戰鬥主模型從「整輪規劃＋交鋒線」切換成「單位級 Timeline＋單次出牌＋公開 Intent 預演」。

舊設計只作為技術與資產遷移來源，不作為新 UX 或規則的結構約束。
