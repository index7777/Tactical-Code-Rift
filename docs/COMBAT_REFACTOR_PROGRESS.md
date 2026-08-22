# 戰鬥重構進度

BRANCH = combat-refactor-v1
DATE = 2026-08-22

本文件只記錄 `COMBAT_REFACTOR_V1.md`、`COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md` 與各 Phase contract 的實作進度，不取代規格。

## Phase 1 — Single Timeline Domain

狀態：`VERIFIED`

- 單一敵我 Timeline、`nextActionAt`、deterministic tie-break。
- Delay / advance / 行動後重新排程、死亡移除、crossed player windows。

CI：run 100 通過。

## Phase 2 — Unit-level Turn State Machine

狀態：`VERIFIED`

- `WAITING_FOR_NEXT_ACTOR -> PLAYER_IDLE / ENEMY_EXECUTING -> ... -> RESOLVING`。
- 只有 Timeline 最前角色可行動；玩家確認後立即執行，不等待其他隊友預排。

CI：run 104 通過。

## Phase 3 / 3b — Shared Hand + Controller Wiring

狀態：`VERIFIED`

- 共用 5 張手牌、出 1 補 1、未使用牌保留、deterministic reshuffle。
- 調度 0～2 張，Delay 3；無 AP / Mana。
- Controller 只能提交手牌內 card instance，卡牌 Delay 驅動重新排程。

CI：run 114 曾因測試把下一 actor 寫死而失敗；修正為依 Timeline 絕對排序後，run 125 通過。

## Phase 4 — Intent / Control Resilience / Break Window

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE4_DOMAIN.md`

- Intent 與 persistent status 分離。
- Delay / Interrupt 分流、temporary resilience、armor-break / imbalance window lifecycle。

CI：run 125 通過。

## Phase 5 — Immutable Preview Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5_PREVIEW.md`

- Preview 集中 damage / HP / lethal / Delay / Timeline / Intent / Break Window。
- `targetResilienceAfter` 供 commit 直接採用，presentation 不自行重算。

CI：run 130 曾有 category 型別邊界錯誤；修正後 run 132 通過。

## Phase 5b — Controller Preview Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5B_CONTROLLER_PREVIEW.md`

- Controller 目標選擇直接呼叫 `resolveBattlePreview()`。
- `preview()` defensive clone；stale preview 在所有 action boundary 清除。

CI：run 137 通過。

## Phase 6 — Battle Resolution / Commit

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE6_RESOLUTION.md`

- `BattleResolutionState` 集中 authoritative battle snapshot。
- `resolveBattleAction()` 先取得同一份 Preview，再提交 HP / Timeline / Intent / resilience / Break Window。
- deterministic break-window id；Preview / Execute parity 有測試。

CI：run 143 通過。

## Phase 6b — Controller / Authoritative Resolution Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE6B_CONTROLLER_RESOLUTION.md`

- Controller 直接持有 `BattleResolutionState`。
- 玩家一般卡牌完整走 `resolveBattleAction()`；調度為唯一 schedule-only player path。

CI：run 148 通過。

## Phase 7 — Enemy Action Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE7_ENEMY_ACTION.md`

- 正常 Intent 提交直接傷害、死亡移除、成功行動後 temporary resilience / Break Window cleanup。
- `hard-stagger` 消耗 action opportunity 但不是成功行動。
- 下一 Intent Delay 成為 enemy scheduling source of truth；Controller 不再接受 raw enemyDelay。

CI：run 155 通過。

## Phase 8 — Actor Specialization + Guard / Reaction

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE8_SPECIALIZATION_GUARD.md`

- 標準守勢 50% 減傷、單次上限 8。
- 千景可守任意存活友軍；成功減傷觸發承勢 +1 Delay。
- 凜 quick 搶先成立 +3。
- 朧每個 enemy successful-action cycle 第一次有效 disruption Delay requested +1。
- 紅葉 heavy 消耗 armor-break 時在 +50% base damage 外再 +4。
- Preview / Execute 共用規則，Controller snapshots defensive clone。

CI 記錄：

- run 164：build 通過，3 個舊測試仍期待凜 quick 只打 base 8 而失敗。
- 已把 Preview / Resolution / Controller 舊斷言改為驗證 `specializationBonusDamage = 3`、`finalDamage = 11`、39 HP → 28。
- run 168 build / test 全數通過，因此 Phase 8 升為 `VERIFIED`。

## Phase 9 — Presentation Foundation

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：`docs/COMBAT_REFACTOR_PHASE9_PRESENTATION_FOUNDATION.md`

新增：

- `src/presentation/battle/refactor/TimelinePresenter.ts`
- `src/presentation/battle/refactor/HandPresenter.ts`
- `src/presentation/battle/refactor/TargetPreviewPresenter.ts`
- `src/presentation/battle/refactor/BattleActorPresenter.ts`
- `src/presentation/battle/refactor/EnemyIntentPresenter.ts`
- `src/presentation/battle/refactor/RefactorPresentation.test.ts`
- `src/presentation/scenes/RefactorBattleScene.ts`

已實作：

- Timeline presenter 只輸出單一敵我混合 Timeline，預設最多 8 個節點，enemy node 直接讀公開 Intent。
- Hand presenter 只呈現共享手牌的卡名 / category / Delay / target rule / selected，不提供 AP / Mana 欄位。
- Target Preview presenter 只映射 `BattlePreviewResult`，不自行重算傷害、Delay、角色專精或 Intent。
- Actor layout 固定四名我方 Home Position、中央 Action / Reaction Position。
- 1280×720 layout 中 Battlefield 高度 388px，超過畫面 50%。
- Enemy Intent presenter 與 persistent status 分離。
- `RefactorBattleScene` 已建立全新單 Timeline / Battlefield / Party / Intent / Shared Hand / 調度骨架。
- `src/main.ts` 僅註冊 `RefactorBattleScene`，仍由 `BootScene` 作預設啟動；尚未切 live runtime。

目前刻意不做：

- feature flag runtime switch。
- Controller interaction wiring。
- 正式角色／敵人素材與動畫。
- redirect / counter / persistent status UI。
- legacy combat removal。

## 下一批

先讓 Phase 9 foundation CI 通過。通過後再做 presentation interaction wiring：把 `BattleTurnController` 的 turn / deck / preview / battle snapshots 接到新 presenters 與 `RefactorBattleScene`，仍不切換預設 runtime。
