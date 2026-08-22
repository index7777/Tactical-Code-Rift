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

- 非玩家決策 state 自動前進，不再要求玩家按「開始下一角色／執行敵方行動」。
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

狀態：`CI_VERIFIED_BROWSER_QA_PENDING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10E_ACTION_REACH_TARGET_AFFORDANCE.md`

已實作：

- 新增純 presentation `actionApproachPosition()`，用 actor / target 的 runtime x、display width 與 gap 推導接敵點；有 explicit target 的玩家 ACTION 不再固定停在中央 `actionPosition`。
- 接敵方向依 actor / target x 自動鏡像；y 跟隨 target，讓角色接近同一地面帶；已經夠近時不穿越目標。
- Scene 的 ACTION sequencing 使用此 target-relative destination；無 target 才保留既有 fallback action point。
- 新增 `targetAffordance()`，把 `SELECTED / CANDIDATE / DEFAULT / DISABLED` 分開。
- 所有合法但尚未選定的單體目標只顯示低強度候選圈；只有 `preview.targetId` 使用強黃圈。
- 千景「護持」仍可指定任一存活友軍，但不再四人同時顯示像全隊生效的黃圈；enemy target card 套用同樣 affordance。
- 新增 target-relative approach 與 affordance unit tests。

CI：run 266 build / test 通過。仍需 GitHub Pages 實機確認接敵距離與單體目標提示。

## Phase 10j — Viewport / Battlefield / Floating HUD Cleanup

狀態：`CI_VERIFIED_BROWSER_QA_FOUND_STAGE_MODEL_ISSUE`

先行文件：`docs/COMBAT_REFACTOR_PHASE10J_VIEWPORT_HUD_CLEANUP.md`

- 寬螢幕一般比例改 cover/envelop；超寬保留 FIT。
- DEFAULT actor ring 已移除，只保留 active/candidate/selected affordance。
- Party rail、Intent panel、Shared Hand 已縮小。
- CI run 323 build / test 通過。
- 使用者實機截圖確認新的主要問題不是單純座標，而是角色 HOME 與手牌仍以單一畫面硬編排；不同 y 沒有完整綁到同一個 BG depth contract。

## Phase 10k — Adaptive Battle Stage / Hand Layout

狀態：`CI_VERIFIED_BROWSER_QA_FOUND_CARD_MASTER_GAP`

先行文件：`docs/COMBAT_REFACTOR_PHASE10K_ADAPTIVE_BATTLE_STAGE_HAND_LAYOUT.md`

已實作：

- 新增 pure presentation `BattleStageProfile`：player/enemy/action zone、depth bands、BG focal point、HUD/camera safe bounds。
- 四名玩家 HOME 由 formation slots + depth band 推導；角色 identity 不再保存自己的固定 x/y。
- enemy QA position 也改走 stage slot，而不是 Scene 內 `950 + index * ...`。
- BG framing 改用保持來源 aspect ratio 的 cover + focal anchor，不再 `setDisplaySize(1280,720)` 拉伸。
- 新增 `RefactorHandLayoutPolicy`：`PLAYER_IDLE` 使用 82px collapsed cards；CARD_SELECTED / TARGET_PREVIEW / dispatch 使用 116px expanded cards。
- preview / confirm / dispatch controls 隨 hand layout state 移動，不再綁固定 172px hand strip。
- camera focus target 經 stage safe bounds clamp；Phase 10i 的 1.05 + 前踏保留。
- 新增 profile / hand policy tests；formation identity independence、depth scale、BG cover aspect、camera clamp 均有 regression coverage。
- rail-halt BG binary 未修改；沒有新增角色 pose、card art、foreground 或其他資產。

CI：run 333 build 通過、test 因 Phase 10j 舊 `x >= 320` layout assertion 與新 slot 第一版 `x=312.5` 衝突而失敗；調整 slot 回到 legacy safe bound 後，run 334 build / test 全部通過。

Browser QA：使用者實機截圖確認 stage / hand 空間比前版乾淨，但指出 hand 只是縮小舊 rectangle，沒有落實既定戰鬥 UI 母版的 card anatomy / family identity / selected hierarchy；因此 Phase 10k 的空間架構保留，卡牌 presentation 由 Phase 10l 接手。

## Phase 10l — Shared Hand / Card Master Presentation

狀態：`CI_VERIFIED_BROWSER_QA_PENDING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10L_CARD_MASTER_PRESENTATION.md`

已實作：

- 新增 pure presentation `CardMasterPresentation.ts`，五個 category 固定 quick 冷藍、heavy 朱紅、guard 青綠、disruption 紫、break 金橙 family style。
- `HandPresenter` 現在提供 effect snapshot + 最多兩行 player-facing effect summary；Scene 不再用 target-rule enum 當卡面主資訊。
- 卡牌重構為 family header / mark、卡名、family label、effect zone、獨立 `Delay N` footer。
- selected skill 上浮 14px、略放大並加 family glow；其他卡在已有 selected skill 時降低 alpha。
- dispatch-selected 使用較弱的調度標記，不冒充技能 selected glow。
- `調度` 改為獨立 utility panel，顯示 `交換 0–2 張 / Delay 3`；selected/preview 階段使用獨立 action command panel 顯示目前卡名、選擇目標／目標已確認、確認執行／取消。
- Phase 10k 的 collapsed/expanded hand 概念保留，但 card master metrics 改為 collapsed 136×116、expanded 142×150，使 anatomy 可讀且 selected card 仍留在 720 logical stage 內。
- 未接入新的 card art / frame / icon 資產；先以程式化 master 驗證 anatomy 與互動，避免因資產存在就全部塞入。
- BG、角色站位、combat domain、audio、enemy roster 均未在本批更動。

CI：run 343 首次 build 因三個 animation-plan 測試 fixture 尚未補 `effect/effectLines` 而失敗；修正 fixture 後 run 344 build + test 全部通過。

## Phase 10m — Stage Formation / Scale Calibration

狀態：`CI_VERIFIED_BROWSER_QA_PENDING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10M_STAGE_FORMATION_SCALE_CALIBRATION.md`

已實作：

- rail-halt player zone 擴大水平可用寬度；四個 formation slot 保持 identity-independent，但改用更大的 x 分離。
- player depth center-y 收斂為 370 / 390 / 425 / 445，總跨度由 124 logical px 降為 75；scale 收斂為 0.90 / 0.96 / 1.03 / 1.08。
- enemy zone 向中央 action zone 收近；enemy 視覺倍率由 Scene 隱含常數改成 profile-owned `enemyVisualScaleMultiplier = 1.14`。
- 未修改 BG binary / framing、Phase 10l card master、camera 1.05 focus、ACTION target-relative approach 或 combat rules。
- 新增／更新 stage regression：formation identity independence、compact monotonic depth、水平分離、enemy zone / visual multiplier。

CI：run 353 build 通過，但 Phase 10j 遺留 `max player x <= 500` assertion 與本批刻意增加水平展開衝突；更新舊 assertion 為 Phase 10m boundary 後，run 354 build + test 全部通過。

## Deployment / Browser QA Gate

狀態：`PHASE10M_BROWSER_QA_PENDING`

- Phase 10m CI run 354 已通過。
- Pages 下一個必要證據：1280×720 四名玩家是否讀成同一地面上的兩層斜列；凜不再浮高、千景／朧 silhouette 分離、紅葉不壓手牌。
- QA enemy 應比前一版更有視覺重量並略靠近 action zone，但不得碰 Intent panel。
- 同時回歸 Phase 10l card master、Phase 10i camera focus / 前踏、ACTION 接敵與回 HOME。
- 844×390 必須維持 Timeline、Intent、hand 與 formation 可讀。
- Legacy combat removal 仍 blocked。

## 下一批

先完成 Phase 10m browser QA。畫面構圖通過後，再獨立處理正式 audio policy 與 QA enemy canonical asset/portrait mapping；不因資產存在就批量接入。

## Phase 11 — Route Cutover

狀態：`CI_AND_PRODUCTION_RUNTIME_QA_VERIFIED`

- `combat-refactor-v1` 已重放到最新 `origin/main`，不再落後主線。
- production composition root 已移除 legacy runtime flag；公開流程改為 Journey → RefactorBattleScene。
- 七個 `EncounterCatalog` 戰鬥節點已能建立 canonical enemy roster、Intent、mixed Timeline 與 shared deck。
- 一般／精英、Boss BGM 及 sword WAV 已對齊上線 `main`；舊 visual FX 保留但不載入。
- 整合分支 58 個 test files／283 tests 與 production build 通過；Pages 發布分支 59 個 test files／286 tests 與 production build 通過。
- 1280×720 `battle-1` 與 844×390 `boss-1` 已成功渲染；內建 Browser 因 trusted-path 設定不可用，改用使用者先前授權的本機 Chrome headless。
- 正式 Pages 七個節點都已到達 `PLAYER_IDLE`，實際點擊第一張「截勢」並點擊合法敵人後進入 `TARGET_PREVIEW`；enemy counts 為 2／3／3／4／4／3／3，全部符合 `EncounterCatalog`。
- 正式勝利返回 `JourneyScene`；敗北重新建立同一節點；Boss 勝利返回路線並設置 Area 01 clear flag。
- Runtime QA 找到並修正 Scene shutdown 時 Camera 已釋放後仍呼叫 `setZoom()`、導致勝利切場中止的缺陷；修正版正式 bundle `index-2wQi0fNw.js` 的完整重跑為 Console 0 errors。
- Phase 11 的七節點互動、勝敗返回與 Boss runtime gate 已關閉；是否合併 `main` 仍是獨立發布決策。
