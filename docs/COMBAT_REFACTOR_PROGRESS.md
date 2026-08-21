# 戰鬥重構進度

BRANCH = combat-refactor-v1
DATE = 2026-08-22

本文件只記錄 `COMBAT_REFACTOR_V1.md`、`COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md` 與各 Phase contract 的實作進度，不取代規格。

## Phase 1 — Single Timeline Domain

狀態：`VERIFIED`

- 單一敵我 Timeline。
- `nextActionAt` 排序。
- deterministic tie-break。
- Delay / advance / 行動後重新排程。
- 死亡移除。
- crossed player action windows 計算。

CI：run 100 通過。

## Phase 2 — Unit-level Turn State Machine

狀態：`VERIFIED`

- `WAITING_FOR_NEXT_ACTOR`
- `PLAYER_IDLE`
- `CARD_SELECTED`
- `TARGET_PREVIEW`
- `EXECUTING`
- `ENEMY_EXECUTING`
- `RESOLVING`
- `BATTLE_ENDED`
- 只有 Timeline 最前角色可行動。
- 玩家確認後立即執行，不等待其他隊友預排。

CI：run 104 通過。

## Phase 3 / 3b — Shared Hand + Controller Wiring

狀態：`VERIFIED`

- 共用 5 張手牌。
- 出 1 補 1，未使用牌保留。
- deterministic reshuffle。
- 調度 0～2 張，Delay 3。
- 無 AP / Mana。
- Controller 只能提交手牌內 card instance。
- 卡牌自身 Delay 驅動玩家重新排程。

CI：run 114 曾因測試把下一 actor 寫死而失敗；修正為依 Timeline 絕對排序後，run 125 全數通過。

## Phase 4 — Intent / Control Resilience / Break Window

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE4_DOMAIN.md`

- Intent 與 persistent status 分離。
- Delay 保留 Intent；Interrupt 替換為 hard-stagger。
- 韌性 = base + temporary。
- 成功延後才增加 temporary resilience。
- 敵人成功行動後清 temporary。
- armor-break 只被 heavy 消耗。
- imbalance 只被 disruption 消耗。
- break window 在目標成功行動後失效。

CI：run 125 通過。

## Phase 5 — Immutable Preview Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5_PREVIEW.md`

新增：

- `src/core/preview/BattlePreviewResolver.ts`
- `src/core/preview/BattlePreviewResolver.test.ts`

已完成：

- 普通傷害 / HP / lethal preview。
- armor-break + heavy：+50% base damage preview。
- imbalance + disruption：忽略 1 韌性 preview。
- Delay preview：actual delay、舊/新 Timeline 位置、crossed player windows。
- Interrupt preview：Intent → hard-stagger，不移動當前事件。
- lethal preview：從 predicted Timeline 刪除目標、Intent change = deleted。
- active actor 自身 future Timeline 位置。
- source snapshot deep immutability。

CI 記錄：

- run 130：TypeScript build 失敗，因完整 `RefactorCardCategory` 不能直接傳給 `BreakWindowConsumer`。
- 以明確 `breakWindowConsumer()` adapter 修正，只允許 `heavy / disruption`。
- run 132：build / test 全數通過，因此 Phase 5 升為 VERIFIED。

## Phase 5b — Controller Preview Wiring

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：`docs/COMBAT_REFACTOR_PHASE5B_CONTROLLER_PREVIEW.md`

已更新：

- `src/application/battle/BattleTurnController.ts`
- `src/application/battle/BattleTurnController.test.ts`

已實作：

- Controller 可持有 `BattlePreviewContextState` snapshot：vitals / Intent / resilience / break windows。
- `previewPlayerTarget()` 進入 `TARGET_PREVIEW` 後直接呼叫 `resolveBattlePreview()`。
- `preview()` 只回傳 deep-cloned `BattlePreviewResult`，供未來 presentation 讀取。
- `setPreviewContext()` 可在真正 resolution 後更新 application snapshot。
- 換卡、取消、確認、調度、開始／完成結算都清除 stale preview。
- 需要目標的牌沒有成功 resolver preview 時不可 confirm。
- confirm 只提交 card / Delay，不把 preview prediction 當成真正 HP / Intent / Timeline mutation。
- 測試新增 delay preview、lethal deletion preview、defensive clone、stale preview cleanup、context refresh。

刻意尚未完成：

- 真正 damage / HP / Intent / resilience / break-window commit resolver。
- guard / redirect。
- 四角色專精 runtime bonus。
- Phaser / BootScene / HUD。
- AOE / multi-target。

## 下一批

先讓 Phase 5b CI 通過。之後進 Phase 6：建立真正的 `BattleResolutionResolver` / commit snapshot mutation，使 Preview 與 Execute 共用相同規則來源；仍先不接舊 Phaser HUD。
