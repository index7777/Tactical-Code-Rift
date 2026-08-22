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

CI：run 179 build / test 全數通過。

## Phase 9b — Controller / Presentation Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9B_PRESENTATION_WIRING.md`

- `RefactorBattleRuntime` 是 Controller -> Presenter 唯一 adapter，不保存第二份 mutable combat state。
- Scene 的 start / select / target preview / cancel / confirm / player resolve / dispatch 全部呼叫 runtime methods。
- Scene 顯示的 Timeline / Hand / Intent / vitals / Preview 全部來自 Controller snapshots 與 presenters。
- 沒有 registry runtime 時 Scene 保持 dormant，不建立 mock battle state。

CI：run 185 build / test 全數通過，因此 Phase 9b 升為 `VERIFIED`。

## Phase 9c — Feature Flag Bootstrap

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：`docs/COMBAT_REFACTOR_PHASE9C_FEATURE_FLAG_BOOTSTRAP.md`

新增：

- `src/application/battle/createRefactorBattleBootstrap.ts`
- `src/application/battle/createRefactorBattleBootstrap.test.ts`

已更新：

- `src/main.ts`

已實作：

- `?combat-refactor=1` 才把 `RefactorBattleScene` 排成第一啟動 Scene；沒有 flag 時仍由 `BootScene` 啟動。
- application bootstrap 建立 deterministic QA `BattleResolutionState` + shared deck + `BattleTurnController`，不 import Phaser / presentation。
- QA state 同時包含 `rin / chikage / oboro / mo` 與 `ghost-fire`，使用單一 mixed Timeline。
- QA deck 含 quick / heavy / guard / disruption / break，初始 shared hand 仍為 5。
- `main.ts` 作 composition root，把 controller 包成 `RefactorBattleRuntime`，並在 Phaser `preBoot` 注入 registry key `refactor-battle-runtime`。
- `BootScene` 沒有被改成新版戰鬥容器。
- QA bootstrap 不是正式 20 張 production deck，也不代表正式 encounter balance。

測試覆蓋：

- 四名我方 + 一名敵人存在。
- shared hand = 5。
- 五種新版 card category 都存在於 QA deck。
- timeline-front `rin` 可由 controller 正常開始。
- 相同 seed bootstrap deterministic。

## 下一批

先讓 Phase 9c CI 通過。通過後以 `?combat-refactor=1` 做實際 browser/runtime QA；確認新版 Scene 可啟動、Timeline / Shared Hand / Target Preview 可操作後，再處理 enemy runtime interaction 與 feature-flag QA 缺陷，不切 production 預設入口。
