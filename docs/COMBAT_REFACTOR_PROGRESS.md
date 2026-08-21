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

尚未完成：

- 尚未把 `RefactorDeck` 接進 `BattleTurnController`；此接線會在 Phase 3 CI 通過後做為下一小批，避免 domain 與 application 錯誤同批混在一起。
- 尚未建立正式 20 張新卡池資料；目前測試用 definitions 只驗證 deck lifecycle。
- 尚未做 Phaser / HUD。

## 下一批

Phase 3b：把 shared hand 接到 `BattleTurnController`，鎖死「當前角色只能使用目前共享手牌中的一張牌，或使用調度」；之後進 Phase 4 Intent / 韌性 / 破勢。
