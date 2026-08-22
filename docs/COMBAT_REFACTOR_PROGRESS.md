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

- unit-level player / enemy turn flow。
- 只有 Timeline 最前角色可行動；玩家確認後立即執行。

CI：run 104 通過。

## Phase 3 / 3b — Shared Hand + Controller Wiring

狀態：`VERIFIED`

- 共用 5 張手牌、出 1 補 1、調度 0–2 張 Delay 3、無 AP / Mana。
- Controller 只能提交手牌內 card instance，卡牌 Delay 驅動重新排程。

CI：run 125 通過。

## Phase 4 — Intent / Control Resilience / Break Window

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE4_DOMAIN.md`

- Intent / persistent status 分離。
- Delay / Interrupt、temporary resilience、armor-break / imbalance lifecycle。

CI：run 125 通過。

## Phase 5 — Immutable Preview Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5_PREVIEW.md`

- Preview 集中 damage / HP / lethal / Delay / Timeline / Intent / Break Window。
- presentation 不自行重算。

CI：run 132 通過。

## Phase 5b — Controller Preview Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5B_CONTROLLER_PREVIEW.md`

- Controller target preview 直接呼叫 `resolveBattlePreview()`。
- stale preview 在 action boundary 清除。

CI：run 137 通過。

## Phase 6 — Battle Resolution / Commit

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE6_RESOLUTION.md`

- `BattleResolutionState` 成為 authoritative battle snapshot。
- `resolveBattleAction()` 提交同一份 Preview 規則結果。

CI：run 143 通過。

## Phase 6b — Controller / Authoritative Resolution Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE6B_CONTROLLER_RESOLUTION.md`

- Controller 直接持有 authoritative resolution state。
- 玩家一般卡牌完整走 `resolveBattleAction()`；調度為 schedule-only player path。

CI：run 148 通過。

## Phase 7 — Enemy Action Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE7_ENEMY_ACTION.md`

- 公開 Intent 執行、死亡移除、成功行動 cleanup、下一 Intent reveal / reschedule。
- Controller 不再接受 raw enemyDelay。

CI：run 155 通過。

## Phase 8 — Actor Specialization + Guard / Reaction

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE8_SPECIALIZATION_GUARD.md`

- 千景 Guard / 承勢、凜 quick +3、朧首個有效 Delay +1、紅葉破甲 heavy +4。
- Preview / Execute 共用角色專精規則。

CI：run 164 暴露 3 個舊凜 quick 基線斷言；修正舊測試後 run 168 build / test 全數通過。

## Phase 9 — Presentation Foundation

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9_PRESENTATION_FOUNDATION.md`

- 新 `src/presentation/battle/refactor/` presenter 路徑。
- 單一敵我 Timeline、Shared Hand、Target Preview、Actor layout、Enemy Intent presenter。
- `RefactorBattleScene` 為平行 Scene；`BootScene` 仍是預設 runtime。
- Battlefield 高度 388px，超過 1280×720 畫面的 50%。

CI：run 179 build / test 全數通過，因此 Phase 9 升為 `VERIFIED`。

## Phase 9b — Controller / Presentation Wiring

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：`docs/COMBAT_REFACTOR_PHASE9B_PRESENTATION_WIRING.md`

新增：

- `src/presentation/battle/refactor/RefactorBattleRuntime.ts`
- `src/presentation/battle/refactor/RefactorBattleRuntime.test.ts`

已更新：

- `src/presentation/scenes/RefactorBattleScene.ts`

已實作：

- `RefactorBattleRuntime` 只持有 `BattleTurnController` reference，不建立第二份 mutable combat state。
- `view()` 即時讀 `turn()` / `battle()` / `deck()` / `preview()`，再交給 Phase 9 presenters 建立 Timeline / Hand / Intent / Preview view model。
- view model 暴露 phase、active actor、vitals、canConfirm、canDispatch；不暴露 authoritative mutable reference。
- UI interaction methods 已接 Controller：start actor、select card、preview target、cancel、confirm、resolve player action、dispatch。
- `RefactorBattleScene` 從 registry `refactor-battle-runtime` 取得 runtime；沒有 runtime 時只顯示 dormant diagnostic，不建立 mock battle state。
- Scene 的卡片、敵方 target、確認、取消、調度 0 張與開始下一角色按鈕都只呼叫 runtime methods。
- Scene 顯示的 Preview 數值直接來自 `BattlePreviewResult` presenter mapping，不重算 damage / Delay / specialization。
- 預設 runtime 仍未切換；`BootScene` 不動。

測試覆蓋：

- Controller snapshots -> Timeline / Hand / Intent / vitals view。
- selected card state。
- Rin quick authoritative Preview：base 8 + specialization 3 = 11，39 HP -> 28。
- confirm 前不改 HP；resolve 後 view 反映 committed HP / Timeline。
- cancel 清 preview。
- view defensive isolation。
- dispatch 走 Controller Delay 3。

## 下一批

先讓 Phase 9b CI 通過。通過後才進 feature-flag runtime switch（`?combat-refactor=1`），建立真正 encounter bootstrap / controller injection；預設仍先保持 legacy runtime，直到 flag QA 完成。
