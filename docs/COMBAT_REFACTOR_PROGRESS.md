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
- 唯一失敗是 `RefactorBattleRuntimePhase9d.test.ts` 把 `any-ally` target list 順序寫死成 `['chikage', 'rin']`，實際 runtime 依 authoritative vitals insertion order回傳 `['rin', 'chikage']`。
- 此失敗不代表 target routing 規則錯誤；修正測試、不改 production target logic 後，run 205 build / test 全數通過，因此 Phase 9d 升為 `VERIFIED`。

流程紀錄：Phase 9d contract 已先建立；本次 source/tests 寫入後才補齊 progress 狀態，未完全符合索引要求的「contract + progress 皆先於 source/tests」順序。此偏差已在本文件明確記錄，不視為完整流程合規證據。

## Phase 9e — GitHub Pages QA Hosting

狀態：`IMPLEMENTATION_PENDING_WORKFLOW`

先行文件：`docs/COMBAT_REFACTOR_PHASE9E_GITHUB_PAGES_QA.md`

- 因 Vercel Hobby build-rate limit 阻塞 current-head preview，QA hosting 改用 GitHub Pages。
- 只新增 branch-scoped Pages deployment workflow，不改 combat domain / application / presentation 規則。
- Pages build 沿用 `npm ci` + `npm run build` 與既有 `build/web` output。
- Vite `base: './'` 保持不變，避免另建 Pages 專用 asset path。
- 預定 QA 入口：`https://index7777.github.io/Tactical-Code-Rift/?combat-refactor=1`。
- GitHub Pages deployment 成功只解除 hosting blocker；仍需完成 1280×720 / 844×390 的 browser interaction QA 才能進 Phase 10。

## Deployment / Browser QA Gate

狀態：`MIGRATING_TO_GITHUB_PAGES`

- Vercel current-head status 因 `upgradeToPro=build-rate-limit` 失敗，舊 READY deployment 不可作 current-head QA 證據。
- Phase 9e 改由 GitHub Pages 產出 current-head QA deployment，legacy `BootScene` 仍是無 flag 的預設入口。
- 在 Pages deployment 與 browser QA 都有證據前，Phase 10 不啟動。

## 下一批

建立 `combat-refactor-v1` 專用 GitHub Pages workflow，確認 Pages deployment 成功後，用 `?combat-refactor=1` 完成 1280×720 與 844×390 的實際 browser QA；只有 QA gate 通過後才評估 Phase 10 預設入口切換與 legacy removal。
