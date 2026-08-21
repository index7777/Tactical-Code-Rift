# 戰鬥重構進度

BRANCH = combat-refactor-v1
DATE = 2026-08-22

本文件只記錄 `COMBAT_REFACTOR_V1.md` 與 `COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md` 的實作進度，不取代規格。

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

狀態：`IMPLEMENTED_PENDING_CI`

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

## Phase 3b — Shared Hand Application Wiring

狀態：`IMPLEMENTED_PENDING_CI`

已完成：

- `BattleTurnController` 現在持有新版 `RefactorDeckState`，不再只接收任意 action id。
- 玩家只能選擇目前共享手牌中實際存在的 card instance。
- 需要目標的卡牌在沒有 Target Preview 時不可確認。
- 卡牌在確認執行時立即從共享手牌移入棄牌堆並補回 5 張；進入 `EXECUTING` 後不可撤回。
- 玩家行動的 Timeline Delay 直接取自已提交卡牌的 `definition.delay`，呼叫端不再替玩家傳入任意 Delay。
- `dispatch()` 是獨立完整行動，只允許 `PLAYER_IDLE` 使用，交換 0–2 張，Delay 固定為 3。
- Enemy resolution 不操作共享手牌，仍由 enemy skill / intent 明確提供其 action Delay。
- controller 對外提供 clone 後的 deck snapshot，避免 presentation 直接修改 domain state。

新增／更新測試鎖定：

- 非手牌中的 instance 不可選。
- 單次只消耗一張已選牌並補回 5 張。
- 其他隊友不需要先提交行動。
- 調度保留未選牌，且 0 張交換仍消耗 Delay 3 行動。
- Enemy action 不改 shared hand。

尚未完成：

- 尚未建立正式 20 張新卡池資料；目前測試 definitions 只驗證 deck / controller lifecycle。
- 尚未建立 Intent / 韌性 / 破勢 domain。
- 尚未做 Phaser / HUD。

## 下一批

Phase 4：建立 `IntentState`、`ControlResilience`、`BreakWindow` 與其純 domain tests。這一批仍不接 Phaser；先把「公開 Intent、延後抗性、破勢窗口在目標成功行動後失效」鎖成 source of truth，再進 Preview Resolver。
