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

- `?combat-refactor=1` 可進新版 `RefactorBattleScene`。
- deterministic QA bootstrap 建立四名我方、`ghost-fire`、mixed Timeline、公開 Intent、shared deck 與 `BattleTurnController`。

CI：run 192 通過。

## Phase 9d — Feature-Flag QA Interaction Completion

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9D_FLAG_QA_INTERACTIONS.md`

已實作 enemy resolution、enemy / ally target routing、千景 any-ally Guard 與調度 0–2 張。

CI：run 205 通過。

流程紀錄：Phase 9d contract 已先建立；progress 更新晚於 source/tests 的偏差已記錄，不視為完整流程合規證據。

## Phase 9e — GitHub Pages QA Hosting

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9E_GITHUB_PAGES_QA.md`

- Vercel build-rate limit 後改用 GitHub Pages。
- Pages environment 已允許 `combat-refactor-v1`。
- 使用者已確認 current-head feature-flag runtime 可載入、可點擊並可進行戰鬥。

## Phase 9f — Auto Flow + Chinese Presentation

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE9F_AUTO_FLOW_LOCALIZATION.md`

- 非玩家決策 state 自動推進，不再要求玩家按「開始下一角色／執行敵方行動」。
- 玩家只在選牌、選目標、確認、取消、調度時操作。
- 玩家可見隊友名稱為凜／千景／朧／紅葉，QA 敵人顯示鬼火。
- phase、card category、target rule、生命／傷害／延遲／意圖等主要介面中文化；internal id / enum 不變。
- `RefactorBattlePresentationPolicy.ts` 將顯示映射與 auto-flow policy 從 Phaser Scene 抽離。

CI：run 221 build / test 通過；使用者已完成 GitHub Pages browser QA，確認 auto-flow 與中文 presentation 可操作。

## Phase 10 — Default Cutover / Legacy Rollback

狀態：`CI_VERIFIED_BROWSER_REGRESSION_PENDING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10_DEFAULT_CUTOVER.md`

已實作：

- 新增 `CombatEntryPolicy.ts`，把入口判斷集中在純 application policy。
- 無 query flag 時預設 `mode = refactor` 並注入 `RefactorBattleRuntime`。
- `?legacy-combat=1` 明確切回舊 `BootScene`，且不注入新版 runtime。
- `?combat-refactor=1` 仍相容新版入口；若同時指定 legacy rollback，legacy 明確優先。
- `main.ts` Scene ordering 依 entry policy 決定；新版 default 為 `[RefactorBattleScene, BootScene, JourneyScene]`。
- legacy source 本批未刪除。
- 新增 `CombatEntryPolicy.test.ts` 覆蓋 default / compatibility / rollback / precedence。

CI：run 228 build / test 通過。仍需 GitHub Pages default-entry / legacy-rollback browser regression。

## Phase 10b — Asset Reconnect

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：`docs/COMBAT_REFACTOR_PHASE10B_ASSET_RECONNECT.md`

已實作：

- 新增 `RefactorBattleAssets.ts`，沿用唯一角色 runtime manifest 與 `queuePlayerAssets()`，不依賴 `BootScene.preload()`。
- 新版 Scene 自己 preload 四名隊友 pose / portrait、World 01 rooftop candidate、QA yokai visual 與基礎 slash FX。
- 四名隊友 battlefield 顯示改用實際 `idle-a` texture；保留 target ring、HP 與 texture 缺失 fallback。
- 單 Timeline player node 優先顯示 timeline portrait；`ghost-fire` 使用 QA yokai visual；文字名稱與 `nextActionAt` 保留。
- battlefield 接回既有 rooftop candidate 背景，party rail / intent panel / hand 仍由新版 layout 疊在上層。
- `ghost-fire` 的 yokai 圖只作 QA visual，不視為正式 enemy identity master。
- 新增 `RefactorBattleAssets.test.ts` 覆蓋四角色 manifest mapping、pose / timeline key 與 QA enemy mapping。

CI：run 234 執行中。

## Phase 10c — Full-canvas Battlefield / Timeline Normalization

狀態：`IMPLEMENTATION_PENDING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10C_BATTLEFIELD_TIMELINE_NORMALIZATION.md`

使用者實機回饋已確認：

- Phase 10b QA enemy 誤用了舊 `kamaitachi.png`，本批改用 rainfall-ridgeline 新 runtime monster。
- 目前上下 Timeline / hand 框架只是過渡 UI，後續會移除，因此 BG 與角色站位不再以 `y=112..500` 當永久世界裁切範圍。
- BG 改用目前 Area 01 F1 `area01-rail-halt-bg-runtime-trial-v1.png`，完整鋪滿 1280×720。
- 四名隊友與敵人要依場景地面線／透視重新配置，前後 y 差帶輕微 presentation scale 差；不建立 gameplay 前後排。
- 上方行動序列同步整理 active actor、portrait、時間點與 target preview 資訊板。

## Deployment / Browser QA Gate

狀態：`PHASE10C_IMPLEMENTATION_PENDING`

- Phase 10 CI 已通過。
- default-entry / legacy rollback browser regression 尚待驗證。
- 使用者要求先把新 monster、新 BG、完整場景站位與上方 Timeline 一起調整，再從 Pages 真實畫面找問題。
- Phase 10c CI 與 browser QA 完成前不進 legacy removal。

## 下一批

實作 Phase 10c：移除新版對舊 kamaitachi / rooftop 主資產的依賴，接 rainfall-ridgeline monster 與 F1 rail-halt BG，將 BG 改為 full-canvas，依場景透視重排角色／敵人尺寸與站位，同步整理上方 Timeline / Preview。CI 後再用 GitHub Pages 找實際 scale、pivot、透視、overlay 問題。
