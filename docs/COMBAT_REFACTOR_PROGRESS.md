# 戰鬥重構進度

BRANCH = combat-refactor-v1
DATE = 2026-08-22

本文件只記錄 `COMBAT_REFACTOR_V1.md`、`COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md` 與各 Phase domain contract 的實作進度，不取代規格。

## Phase 1 — Single Timeline Domain

狀態：`VERIFIED`

已完成：

- 單一敵我 Timeline。
- `nextActionAt` 排序。
- deterministic tie-break。
- Delay / advance。
- 行動後重新排程。
- 死亡移除。
- crossed player action windows 計算。

CI：GitHub Actions run 100 通過。

## Phase 2 — Unit-level Turn State Machine

狀態：`VERIFIED`

已完成：

- `WAITING_FOR_NEXT_ACTOR`
- `PLAYER_IDLE`
- `CARD_SELECTED`
- `TARGET_PREVIEW`
- `EXECUTING`
- `ENEMY_EXECUTING`
- `RESOLVING`
- `BATTLE_ENDED`

已驗證：

- 只有 Timeline 最前角色可開始行動。
- 玩家確認後立即執行，不等待其他三名角色提交。
- Enemy 使用同一 scheduling source of truth。
- 執行開始後不可撤銷。

CI：GitHub Actions run 104 通過。

## Phase 3 — Shared Hand / Deck

狀態：`VERIFIED`

新增：

- `src/core/cards/RefactorCardTypes.ts`
- `src/core/cards/RefactorDeck.ts`
- `src/core/cards/RefactorDeck.test.ts`

已實作：

- 共享 5 張手牌。
- 新卡牌模型只以 `category / delay / targetRule / effect` 為核心；不沿用 `clashPower / tempo`。
- 出 1 張後只棄該張並立即補回 5 張。
- 未使用手牌保留。
- draw pile 空時只洗 discard pile。
- deterministic seeded shuffle / reshuffle。
- 調度交換 0–2 張。
- 調度 Delay 固定為 3。
- Deck state 沒有 AP / Mana 欄位。

CI：GitHub Actions run 125 通過。

## Phase 3b — Shared Hand Application Wiring

狀態：`VERIFIED`

已完成：

- `BattleTurnController` 現在持有新版 `RefactorDeckState`，不再只接收任意 action id。
- 玩家只能選擇目前共享手牌中實際存在的 card instance。
- 需要目標的卡牌在沒有 Target Preview 時不可確認。
- 卡牌在確認執行時立即從共享手牌移入棄牌堆並補回 5 張；進入 `EXECUTING` 後不可撤回。
- 玩家行動的 Timeline Delay 直接取自已提交卡牌的 `definition.delay`，呼叫端不再替玩家傳入任意 Delay。
- `dispatch()` 是獨立完整行動，只允許 `PLAYER_IDLE` 使用，交換 0–2 張，Delay 固定為 3。
- Enemy resolution 不操作共享手牌，仍由 enemy skill / intent 明確提供其 action Delay。
- controller 對外提供 clone 後的 deck snapshot，避免 presentation 直接修改 domain state。

CI 記錄：

- run 114：build 通過、test 失敗 2 項。
- 原因不是 runtime 排序錯誤，而是 controller 測試把「出牌後下一個一定是 ghost-fire」硬編碼；當抽到 Delay 3 的快斬時，`rin@3` 正確地仍排在 `ghost-fire@4` 前。
- 測試已修正為直接以 `sortTimelineActors()` 的實際絕對時間排序判定下一 actor，不再假設固定角色。
- run 125：修正後 build/test 全數通過，因此 Phase 3/3b 升為 VERIFIED。

## Phase 4 — Intent / Control Resilience / Break Window

狀態：`VERIFIED`

先行文件：

- `docs/COMBAT_REFACTOR_PHASE4_DOMAIN.md`

新增：

- `src/core/intents/IntentState.ts`
- `src/core/intents/IntentResolver.ts`
- `src/core/intents/IntentResolver.test.ts`
- `src/core/status/ControlResilience.ts`
- `src/core/status/ControlResilience.test.ts`
- `src/core/status/BreakWindow.ts`
- `src/core/status/BreakWindow.test.ts`

已實作：

- Intent 為已公開的下一敵方事件，與 persistent status 分離。
- Delay 保留原 Intent，只回傳 requested / effective resilience / ignored resilience / actual delay。
- `canDelay=false` 時 actual delay 為 0，且不累積 temporary resilience。
- 韌性 = base + temporary；成功延後後 temporary +1；敵人成功行動後只清 temporary。
- `ignoredResilience` 是 resolver 顯式輸入，不修改 base/temporary source state。
- Interrupt 與 Delay 分離；可打斷 Intent 轉成 `hard-stagger`，敵人仍存在、Timeline 當前節點不由此 module 移動。
- v1 hard-stagger 保留原 Intent action Delay，避免打斷隱含產生額外時序獎勵。
- armor-break 只可被 heavy 消耗；imbalance 只可被 disruption 消耗。
- 未消耗 break window 在目標下一次成功行動時失效；單純 delay / interrupt 不會直接令其失效。
- 提供死亡目標的 break-window cleanup。

CI：GitHub Actions run 125 通過。

## Phase 5 — Immutable Preview Resolver

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：

- `docs/COMBAT_REFACTOR_PHASE5_PREVIEW.md`

新增：

- `src/core/preview/BattlePreviewResolver.ts`
- `src/core/preview/BattlePreviewResolver.test.ts`

已實作：

- Presentation 專用 immutable preview contract；不直接修改 deck/controller/timeline/intent/status source state。
- 普通傷害、預測 HP 與 lethal 判定。
- armor-break + heavy：預覽 +50% base damage 並標記會被消耗的 window。
- imbalance + disruption：預覽忽略 1 韌性。
- Delay 預覽透過 `resolveIntentDelay()` + `previewTimelineShift()`，回傳 actual delay、目標舊/新位置與 crossed player windows。
- Interrupt 預覽透過 `interruptIntent()`，用 `hard-stagger` 表示事件替換而不移動當前節點。
- lethal 優先將 Intent 標記為 deleted，並從 `predictedTimeline` 移除目標，供 HUD 做「刪除未來」預演。
- 同時計算 active actor 使用該卡後的 `actorNextActionAt`，讓同一條 Timeline 可顯示自己的未來節點。
- 卡牌建立 break window 時只回傳待建立描述，不在 Preview 生成永久 id。
- 基本 target rule validation。
- 測試包含 source snapshot deep immutability。

CI 記錄：

- run 130：`npm run build` 失敗，測試未執行。
- 原因是 TypeScript 無法把完整 `RefactorCardCategory` union 自動縮窄成 `BreakWindowConsumer`；`quick / guard / break` 不能傳給 `canConsumeBreakWindow()`。
- 已新增明確的 `breakWindowConsumer()` adapter，只把 `heavy / disruption` 映射成可消耗破勢窗口的 consumer，避免使用型別斷言把 domain 邊界抹掉。
- 修正 commit `ba42deed...` 後重新等待 CI；在 build/test 全通過前 Phase 5 不升級為 VERIFIED。

刻意尚未加入：

- 四角色專精 runtime bonus。
- 千景 guard / redirect preview。
- 多目標／AOE。
- Phaser presenter。
- commit/resolution mutation。

## 下一批

先讓 Phase 5 修正後 CI 驗證通過。之後進 Phase 5b：把 `BattleTurnController` 的 `TARGET_PREVIEW` 接到 `BattlePreviewResolver`，但仍不接 Phaser；controller 只提供 snapshot / preview result，真正 HUD 仍留到 presentation phase。
