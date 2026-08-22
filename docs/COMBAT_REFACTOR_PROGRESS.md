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

狀態：`SUPERSEDED_BY_PHASE10C`

先行文件：`docs/COMBAT_REFACTOR_PHASE10B_ASSET_RECONNECT.md`

- 先把四名隊友 pose / portrait、Timeline portrait 與既有 BG / QA enemy visual 接回新版 Scene。
- 實機後發現 QA enemy 與 rooftop asset 選擇不符合目前資產方向，已由 Phase 10c 取代。
- 此批保留作 migration 紀錄，不把舊 `kamaitachi.png` / rooftop composite 視為新版主資產。

## Phase 10c — Full-canvas Battlefield / Timeline Normalization

狀態：`CI_VERIFIED_BROWSER_QA_PENDING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10C_BATTLEFIELD_TIMELINE_NORMALIZATION.md`

已實作：

- `ghost-fire` 僅保留 internal QA id，玩家可見名稱／visual 改為 rainfall-ridgeline `lantern-child` / 提燈童子。
- 移除 refactor battle 對舊 `kamaitachi.png` 與 rooftop composite 主資產的依賴。
- BG 改用 Area 01 F1 `area01-rail-halt-bg-runtime-trial-v1.png` 並完整鋪滿 1280×720。
- battlefield world 改為 full-canvas；上方 Timeline / 下方 hand 視為過渡 overlay，不再決定世界裁切。
- 四名隊友改成前後錯位舞台隊形，依 y 做輕微 perspective scale；敵人尺寸／位置同步正規化。
- Timeline 節點改為 portrait + 名稱 + 時點卡片，active actor 有明確 highlight。
- Target Preview 改為獨立半透明資訊板；party / intent overlay 縮小，不再主導場景構圖。

CI：run 247 build / test 通過。仍需 GitHub Pages 1280×720 / 844×390 實機確認 scale、pivot、透視、overlay 與 default/legacy 入口。

## Phase 10d — Action / Reaction Presentation Sequencing

狀態：`CI_VERIFIED_BROWSER_QA_FOUND_ISSUES`

先行文件：`docs/COMBAT_REFACTOR_PHASE10D_ACTION_PRESENTATION.md`

已實作：

- 新增純 presentation `RefactorBattleAnimationPlan.ts`，由 `RefactorBattleView` 產生 ACTION / REACTION / ENEMY_ACTION plan，不 import resolver 或 legacy combat。
- 玩家確認後先 commit card，角色 HOME -> ACTION / REACTION，切換既有 ready / attack pose、播放 slash / target reaction，再走既有 runtime resolution，最後回 HOME / idle。
- guard 使用 REACTION 路徑且不播放 attack slash；no-target card 不虛構 target impact。
- 玩家 target 可用現有 `hit-a / hit-b` pose；rainfall-ridgeline enemy 沒有正式 pose sheet，因此只用 tint / tween / FX reaction。
- enemy auto-flow 改為 lunge -> impact / target reaction -> `resolveActiveEnemyAction()` -> 回位，不再 timer 到點直接跳數值。
- 演出期間停用 input、清除 auto-advance timer；Scene shutdown / destroy 會清 presentation timer / tween，避免離場後重複提交。
- 新增 plan tests，覆蓋一般攻擊、千景 guard、無目標卡與 enemy Intent target。

CI：run 254 build / test 通過。

GitHub Pages 實機回饋：

- 玩家 ACTION 前衝過短，沒有到敵人面前，固定 `actionPosition` 不適合有 explicit target 的近身演出。
- 千景「護持」選牌時所有合法友軍同時亮強黃圈，雖然規則仍是單體 target，但 affordance 容易誤讀為全隊 Guard。

## Phase 10e — Action Reach / Single-target Affordance

狀態：`IMPLEMENTATION_PENDING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10E_ACTION_REACH_TARGET_AFFORDANCE.md`

目標：

- 有 explicit target 的 ACTION 由 actor / target runtime 位置與顯示尺寸推導接敵目的地，不再停在固定中央 action point。
- 左右方向可鏡像；角色應停在敵人前方而非與目標重疊。
- `targetableActorIds` 仍表示所有合法單體候選，不改 Guard 規則。
- 合法但未選定的目標使用弱提示；只有 `preview.targetId` 使用強黃圈，避免「護持」看起來像全隊生效。

## Deployment / Browser QA Gate

狀態：`PHASE10E_IMPLEMENTATION_PENDING`

- Phase 10 CI 已通過；default-entry / legacy rollback browser regression 仍待確認。
- Phase 10c CI run 247 已通過；full-canvas / 新 BG / 新 monster / perspective layout 持續由 Pages 實機 QA。
- Phase 10d CI run 254 已通過，但 browser QA 找到 ACTION 接敵距離與單體 target affordance 問題。
- Phase 10e 修正完成並通過 CI / Pages 前不做 legacy removal。

## 下一批

實作 Phase 10e：把有目標的玩家 ACTION 改為接近實際 target 的 presentation destination，並把所有合法候選的弱提示與目前單一 preview target 的黃圈強提示分離。之後再回 GitHub Pages 驗證攻擊接敵距離與千景「護持」單體選取視覺。
