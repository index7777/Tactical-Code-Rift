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

CI：run 148 通過。

## Phase 7 — Enemy Action Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE7_ENEMY_ACTION.md`

- 公開 Intent 執行、死亡移除、成功行動 cleanup、下一 Intent reveal / reschedule。

CI：run 155 通過。

## Phase 8 — Actor Specialization + Guard / Reaction

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE8_SPECIALIZATION_GUARD.md`

- 千景 Guard / 承勢、凜 quick +3、朧首個有效 Delay +1、紅葉破甲 heavy +4。

CI：run 164 暴露 3 個舊凜 quick 基線斷言；修正後 run 168 通過。

## Phase 9 — Presentation Foundation

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9_PRESENTATION_FOUNDATION.md`

- 新 presenter path、單 Timeline、Shared Hand、Target Preview、Actor layout、Enemy Intent。
- `RefactorBattleScene` 為平行 Scene；Battlefield 高度 388px。

CI：run 179 通過。

## Phase 9b — Controller / Presentation Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9B_PRESENTATION_WIRING.md`

- `RefactorBattleRuntime` 是 Controller -> Presenter 唯一 adapter。
- Scene 的玩家互動與 view 全部經 runtime / presenters。

CI：run 185 通過。

## Phase 9c — Feature Flag Bootstrap

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9C_FEATURE_FLAG_BOOTSTRAP.md`

- `?combat-refactor=1` 才把 `RefactorBattleScene` 放到第一啟動順位；沒有 flag 仍以 `BootScene` 為預設。
- deterministic QA bootstrap 建立四名我方、`ghost-fire`、mixed Timeline、公開 Intent、shared deck 與 `BattleTurnController`。
- `main.ts` 在 Phaser `preBoot` 注入 `refactor-battle-runtime`。

CI：run 192 build / test 全數通過，因此 Phase 9c 升為 `VERIFIED`。

## Phase 9d — Feature-Flag QA Interaction Completion

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9D_FLAG_QA_INTERACTIONS.md`

已實作：

- `RefactorBattleRuntime` 可注入 `RefactorEnemyIntentProvider`，Scene 不自行決定 enemy Intent。
- `resolveActiveEnemyAction()` 讓 `ENEMY_EXECUTING` 正式走 Controller -> EnemyActionResolver -> `WAITING_FOR_NEXT_ACTOR`。
- QA bootstrap 新增 deterministic `createRefactorQaEnemyIntent()`，由 `main.ts` composition root 注入 runtime。
- `RefactorBattleView.targetableActorIds` 讓 Scene 只對 selected card 的 target team 掛互動。
- 千景 `any-ally` Guard 可以在 Scene 點我方角色進 Target Preview。
- Scene 新增純 UI ephemeral 調度模式，可選 0 / 1 / 2 張後一次提交；不建立第二份 combat state。
- runtime 仍拒絕沒有 provider 的 enemy resolution。

新增測試：enemy provider resolution、無 provider 拒絕、enemy / any-ally / self target routing、dispatch 0 / 1 / 2 張。

CI 記錄：

- run 201：`npm run build` 通過；`npm test` 235 個測試中 234 通過、1 個失敗。
- 唯一失敗是 `RefactorBattleRuntimePhase9d.test.ts` 把 `any-ally` target list 順序寫死成 `['chikage', 'rin']`，實際 runtime 依 authoritative vitals insertion order 回傳 `['rin', 'chikage']`。
- 此失敗不代表 target routing 規則錯誤；修正測試、不改 production target logic 後，run 205 build / test 全數通過，因此 Phase 9d 升為 `VERIFIED`。

流程紀錄：Phase 9d contract 已先建立；本次 source/tests 寫入後才補齊 progress 狀態，未完全符合索引要求的「contract + progress 皆先於 source/tests」順序。此偏差已在本文件明確記錄，不視為完整流程合規證據。

## Deployment / Browser QA Gate

狀態：`BLOCKED_BY_VERCEL_BUILD_RATE_LIMIT`

- GitHub current head 的 Vercel status context 明確回報 `failure`，target 指向 `upgradeToPro=build-rate-limit`；目前不是程式 build/test 失敗，而是 Vercel Hobby 專案的 deployment build rate limit。
- Vercel branch alias 目前仍解析到 READY deployment `dpl_GwVvKnDYhfokD2jb7EfsvTAbJyyb`，commit `87fcf42d62587144d9d7cb5ad4e31eb814486861`，早於已通過 run 205 的 Phase 9d 實作。
- 因此即使 branch alias 可取得，也不是 current verified code，不能拿來當 1280×720 / 844×390 的正式 browser QA 證據。
- 現有工具也沒有可直接繞過此 Vercel rate limit、指定 git ref 建立 preview 的安全部署接口；不得用舊 deployment 冒充 current-head QA。
- 在 fresh READY preview 出現前，production 預設入口保持 legacy `BootScene`，Phase 10 不啟動。

## 下一批

需要先解除 Vercel deployment build rate limit（等待 rate window 恢復或由專案方調整方案／部署配額），讓 current verified head 產生新的 READY preview。之後才能用 `?combat-refactor=1` 完成 1280×720 與 844×390 的實際 browser QA，驗證 Timeline、選牌、友軍／敵軍 Target Preview、Confirm、enemy action、調度 0～2 與下一 actor 循環。只有這個 QA gate 有證據通過後，才評估 Phase 10 預設入口切換與 legacy removal。
