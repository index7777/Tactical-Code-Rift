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

- 普通傷害 / HP / lethal preview。
- armor-break + heavy：+50% base damage preview。
- imbalance + disruption：忽略 1 韌性 preview。
- Delay preview：actual delay、舊/新 Timeline 位置、crossed player windows。
- Interrupt preview：Intent → hard-stagger，不移動當前事件。
- lethal preview：從 predicted Timeline 刪除目標、Intent change = deleted。
- active actor 自身 future Timeline 位置。
- source snapshot deep immutability。
- Preview 回傳 `targetResilienceAfter`，供 commit 直接採用。

CI：run 130 曾因 `RefactorCardCategory` / `BreakWindowConsumer` 型別邊界失敗；加入明確 adapter 後，run 132 build / test 全數通過。

## Phase 5b — Controller Preview Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5B_CONTROLLER_PREVIEW.md`

- Controller 目標選擇直接呼叫 `resolveBattlePreview()`。
- `preview()` 對外只回 defensive clone。
- stale preview 在換卡、取消、確認、調度與 resolution boundary 清除。
- targeted card 沒有成功 preview 不可 confirm。

CI：run 137 build / test 全數通過。

## Phase 6 — Battle Resolution / Commit

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE6_RESOLUTION.md`

新增：

- `src/core/resolution/BattleResolutionResolver.ts`
- `src/core/resolution/BattleResolutionResolver.test.ts`

已完成：

- `BattleResolutionState` 集中 authoritative timeline / vitals / Intent / resilience / break windows snapshot。
- `resolveBattleAction()` 強制 active actor 必須是 Timeline front。
- Resolution 先呼叫 `resolveBattlePreview()`，再提交同一份 damage / lethal / Delay / Intent / Break Window 結果。
- HP、Delay、temporary resilience、Interrupt、破勢消耗／建立與 lethal cleanup 都已有真正 commit path。
- deterministic break-window id：`bw:<sequence>:<kind>:<targetId>`。
- resolver 對輸入 state 保持 immutable。
- 測試包含 Preview / Resolution parity。

CI：run 143 build / test 全數通過，因此 Phase 6 升為 VERIFIED。

## Phase 6b — Controller / Authoritative Resolution Wiring

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：`docs/COMBAT_REFACTOR_PHASE6B_CONTROLLER_RESOLUTION.md`

已更新：

- `src/application/battle/BattleTurnController.ts`
- `src/application/battle/BattleTurnController.test.ts`

已實作：

- Controller 直接持有 `BattleResolutionState`，不再各自持有 `timelineState` 與 `BattlePreviewContextState`。
- `battle()` 提供完整 authoritative snapshot 的 defensive clone。
- Preview 直接讀 authoritative battle state；移除 `setPreviewContext()` 過渡 API。
- confirm 時提交共享手牌並保存 committed card / target，但不提前修改 HP 或 enemy Timeline。
- 玩家 `completeResolution()` 正式呼叫 `resolveBattleAction()`，一次提交 HP / Intent / resilience / break windows / Timeline。
- 玩家一般卡牌不再走 controller-local `pendingActionDelay`。
- 調度保留唯一 player-side schedule-only 路徑：Delay 3，其他 combat state 不變。
- Enemy 尚未有完整 action resolver，暫時仍以 explicit enemy delay 更新同一份 authoritative Timeline。
- 新測試覆蓋普通傷害 commit、Delay + temporary resilience、lethal deletion、break-window creation、defensive clone、dispatch 與 enemy transition path。

刻意尚未完成：

- Enemy successful-action resolver / 下一 Intent 生成。
- 成功敵方行動後 temporary resilience reset / break-window expiry wiring。
- guard / redirect。
- 四角色專精 runtime bonus。
- Phaser / BootScene / HUD。
- AOE / multi-target。

## 下一批

先讓 Phase 6b CI 通過。之後進 Phase 7：Enemy Action Resolver，正式移除 `completeResolution(enemyDelay)` 的過渡參數，讓敵方成功行動負責 Intent 結算、臨時韌性重置、Break Window expiry、下一 Intent 公開與重新排程。
