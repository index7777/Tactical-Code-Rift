# 專案文件索引

STATUS = AUTHORITATIVE_INDEX

目前角色正式識別碼只有 `rin`、`chikage`、`oboro`、`mo`。PA／PB／PC／PD 與 A／B／C／D 僅是舊 Demo 槽位代號，不得再作為角色身份或永久站位。

## 目前權威文件

1. `PROJECT_STATUS.md`：目前可執行狀態、阻塞項目與同步方式。
2. `PROJECT_AUDIT_2026-08-21.md`：整體品質與維護性稽核。
3. `ARCHITECTURE.md`：實際程式分層與目標邊界。
4. `CURRENT_COMBAT_SPEC.md`：`main` 目前已實作的戰鬥規則摘要；在 `combat-refactor-v1` 分支只作舊 runtime 對照，不作為新玩法設計輸入。
5. `COMBAT_REFACTOR_V1.md`：`combat-refactor-v1` 分支的戰鬥重構權威規格；此分支的戰鬥規則、HUD 與互動修改以本文件為準。
6. `COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md`：重構的檔案邊界、Phase 1～10 遷移順序與驗收方式。
7. `COMBAT_REFACTOR_PHASE4_DOMAIN.md`：Phase 4 Intent／韌性／破勢窗口的純 domain 契約。
8. `COMBAT_REFACTOR_PHASE5_PREVIEW.md`：Phase 5 immutable Preview Resolver 契約；規定 presentation 只能讀預測結果，不自行重算戰鬥規則。
9. `COMBAT_REFACTOR_PHASE5B_CONTROLLER_PREVIEW.md`：Phase 5b Controller Preview wiring 契約；定義 application snapshot ownership 與 stale-preview cleanup。
10. `COMBAT_REFACTOR_PHASE6_RESOLUTION.md`：Phase 6 真正 Battle Resolution / Commit 契約；規定 Execute 必須提交同一份 Preview 規則結果，而不是另算一套公式。
11. `COMBAT_REFACTOR_PHASE6B_CONTROLLER_RESOLUTION.md`：Phase 6b Controller authoritative-resolution wiring 契約；移除獨立 preview context / player pending-delay 過渡結構。
12. `COMBAT_REFACTOR_PHASE7_ENEMY_ACTION.md`：Phase 7 Enemy Action Resolver 契約；定義公開 Intent 執行、成功行動後韌性／破勢窗口清理、下一 Intent 公開與 enemy 重新排程。
13. `COMBAT_REFACTOR_PHASE8_SPECIALIZATION_GUARD.md`：Phase 8 四角色軟專精與守勢／反應契約；凜／千景／朧／紅葉的收益必須進 Preview / Execute 共用規則管線。
14. `COMBAT_REFACTOR_PHASE9_PRESENTATION_FOUNDATION.md`：Phase 9 新 Presentation 基礎契約；定義單 Timeline、共享手牌、Target Preview、Actor／Intent presenter 與平行 `RefactorBattleScene` 骨架。
15. `COMBAT_REFACTOR_PHASE9B_PRESENTATION_WIRING.md`：Phase 9b Controller / Presentation wiring 契約；定義 `RefactorBattleRuntime`、Scene registry 注入與互動邊界。
16. `COMBAT_REFACTOR_PHASE9C_FEATURE_FLAG_BOOTSTRAP.md`：Phase 9c feature-flag bootstrap 契約；定義 `?combat-refactor=1`、deterministic QA controller bootstrap、composition-root runtime 注入與 legacy-default 保留條件。
17. `COMBAT_REFACTOR_PHASE9D_FLAG_QA_INTERACTIONS.md`：Phase 9d feature-flag QA 互動完成契約；補齊 enemy resolution、合法目標 routing 與調度 0～2 張 UI path。
18. `COMBAT_REFACTOR_PHASE9E_GITHUB_PAGES_QA.md`：Phase 9e GitHub Pages QA hosting 契約；把 current-head feature-flag QA deployment 從受 Vercel rate limit 阻塞的 preview 改由 GitHub Pages 提供。
19. `COMBAT_REFACTOR_PHASE9F_AUTO_FLOW_LOCALIZATION.md`：Phase 9f 自動演進與中文 presentation 契約；非玩家決策 state 自動前進，玩家可見角色名／介面改為中文。
20. `COMBAT_REFACTOR_PHASE10_DEFAULT_CUTOVER.md`：Phase 10 預設入口切換契約；新版成為 default，`?legacy-combat=1` 僅作短期 rollback，legacy source 本批不刪。
21. `COMBAT_REFACTOR_PHASE10B_ASSET_RECONNECT.md`：Phase 10b 新戰鬥資產重新接入契約；新版 Scene 獨立 preload 現有角色 manifest、Timeline portrait、戰場背景與 QA enemy visual，不搬回 legacy combat。
22. `COMBAT_REFACTOR_PHASE10C_BATTLEFIELD_TIMELINE_NORMALIZATION.md`：Phase 10c 戰場與上方行動序列正規化契約；修正 enemy runtime asset、Timeline 節點、active actor、Preview 資訊板與 full-canvas 戰場 layout。
23. `COMBAT_REFACTOR_PHASE10D_ACTION_PRESENTATION.md`：Phase 10d 行動／反應演出接線契約；把既有 player pose、ACTION／REACTION 位移、target reaction 與 enemy lunge 接到新版 runtime flow，不重算 combat 規則。
24. `COMBAT_REFACTOR_PHASE10E_ACTION_REACH_TARGET_AFFORDANCE.md`：Phase 10e 實機修正契約；讓有目標的 ACTION 真正接敵，並把「合法候選」與「已選單體目標」的 highlight 分開。
25. `COMBAT_REFACTOR_PHASE10F_CLOSE_CONTACT_TARGET_CLEANUP.md`：Phase 10f 實機修正契約；縮短透明邊界造成的假接敵距離、讓非千景守勢只提示 self，並移除 battlefield 我方重複姓名／HP。
26. `COMBAT_REFACTOR_PHASE10G_FLOATING_HUD_FRAME_REMOVAL.md`：Phase 10g floating HUD 契約；移除上方 Timeline 與下方 Shared Hand 的 full-width 大背板，保留 node／card 自身資訊元件，讓完整 BG 成為戰場主體。
27. `COMBAT_REFACTOR_PHASE10H_BG_CANDIDATE_INTEGRATION.md`：Phase 10h 指定 BG 候選接入契約；把使用者提供的 `area01-rail-halt-hd2d-candidate-v2.png` 接到新版 Pages QA，並重新驗證 full-canvas 透視／站位／HUD 可讀性。
28. `COMBAT_REFACTOR_PHASE10I_ACTIVE_ACTOR_CAMERA_FOCUS.md`：Phase 10i active actor focus 契約；不新增角色美術，以 world camera 1.05、角色前踏與 focus ring 表示輪到我方角色，HUD 保持 screen-space 固定。
29. `COMBAT_REFACTOR_PHASE10J_VIEWPORT_HUD_CLEANUP.md`：Phase 10j 實機畫面整理契約；修正寬螢幕左右黑柱、角色舞台分離、常駐 ring、Party／Intent／Shared Hand 過大等問題，不更換目前 BG、不增加資產。
30. `COMBAT_REFACTOR_PHASE10K_ADAPTIVE_BATTLE_STAGE_HAND_LAYOUT.md`：Phase 10k 通用戰鬥舞台契約；以 stage profile、formation slots、depth bands、背景 framing 與可收合手牌取代單一 BG 的角色 identity 固定座標，讓後續不同戰場可共用同一套 Scene layout。
31. `COMBAT_REFACTOR_PHASE10L_CARD_MASTER_PRESENTATION.md`：Phase 10l 卡牌母版 presentation 契約；恢復 card anatomy、五種 family 視覺語彙、effect summary、selected 上浮／glow，以及與調度／確認控制的層級分離。
32. `COMBAT_REFACTOR_PHASE10M_STAGE_FORMATION_SCALE_CALIBRATION.md`：Phase 10m 舞台隊形／尺度校正契約；縮短 depth band 垂直跨度、增加玩家橫向 silhouette 分離，並把 enemy 視覺倍率納入 stage profile，不回到角色 identity 特例座標。
33. `COMBAT_REFACTOR_PHASE10N_GROUNDING_DEPTH_SEPARATION.md`：Phase 10n 接地／景深分離契約；整體角色站位下移、加強下方較大的透視比例並增加 formation 水平分離，不縮卡、不改 BG。
34. `COMBAT_REFACTOR_PHASE10O_BATTLE_UI_ASSET_SLOT_CONTRACT.md`：Phase 10o / Asset Batch A；列出母版所需全部 battle UI/HUD logical slots，標記 EXISTING／REUSE／NEW／PROCEDURAL／HOLD／FORBIDDEN，並把本輪新增素材預算限制在 8 個以內。
35. `COMBAT_REFACTOR_PHASE10P_CARD_MASTER_ASSET_REUSE.md`：Phase 10p 過程紀錄；既有 SVG reuse 方向已被 Phase 10q 取代，只保留 fallback / semantic reference。
36. `COMBAT_REFACTOR_PHASE10Q_GENERATED_BATTLE_UI_ASSET_PRODUCTION_PLAN.md`：Phase 10q 生成資產計畫；其中預設 G2 四張 HUD skin 的假設已由 `BATTLE_UI_VISUAL_HIERARCHY_ASSET_PRIORITY.md` 修正。
37. `BATTLE_UI_VISUAL_HIERARCHY_ASSET_PRIORITY.md`：戰鬥 UI 視覺層級與資產優先級權威指南；華麗集中於 selected card、target preview 與關鍵 combat feedback，Timeline／Party 等常駐資訊維持極簡，並重新限制後續 generated asset 生產範圍。
38. `COMBAT_DEMO_COMPLETION_BALANCE_PLAN.md`：Demo 完成度規劃；量化剩餘 deliverables、資產／母版缺口、EnemyActionDefinition 資料需求，以及 Normal／Elite／Boss 的 HP、Intent、phase 與平衡提案。
39. `COMBAT_REFACTOR_PROGRESS.md`：重構分支目前完成／待驗證／deployment gate 狀態；只記進度，不取代規格與實作計畫。
40. `COMBAT_ACCEPTANCE_CHECKLIST.md`：現行戰鬥驗收條件；重構期間需逐批建立對應的新驗收項目，不可直接把舊交鋒／整輪規劃條件視為新系統完成標準。
41. `art-bible.md`：角色、怪物、背景與透明素材規範。
42. `characters/README.md`：角色母版與 runtime 對照。
43. `areas/README.md`：區域背景與 runtime 狀態。
44. `RELEASE_ASSET_AUDIT.md`：發布授權閘門。
45. `PLANNING_LOG.md`：採用決策與驗證紀錄。
46. `NEXT_WORK.md`：`main` 現行產品線的執行順序；`combat-refactor-v1` 不得把其中的舊戰鬥 UI／整輪規劃事項當成新玩法約束。
47. `LEGACY_COMBAT_ARCHIVE.md`：舊戰鬥的歷史封存點與取回規則；不得作為 runtime 入口。
48. `COMBAT_REFACTOR_PHASE11_ROUTE_CUTOVER.md`：新版戰鬥取代正式 runtime、七節點接線、音訊對齊與舊版封存契約。
49. `COMBAT_REFACTOR_PHASE12_FORMATION_HAND_CHOREOGRAPHY.md`：4v4 上二／下二雙排隊形、完整卡牌下緣 PEEK、選牌抽出、執行退場、enemy overhead 與 responsive QA 的 presentation 重構契約；本批禁止生成資產。
50. `DEMO_ASSET_REQUIREMENTS_V1.md`：Area 01 七節點 Demo 的完整資產母表；區分現有可用、runtime trial、規格錯誤、必須補作、程序化與禁止生成項目，並定義五張 card-family illustration plate 的正確規格。
51. `HANDOFF_2026-08-22_COMBAT_DEMO_ASSETS.md`：2026-08-22 新戰鬥、七節點、隊形／手牌重構、Demo 資產判定、驗證限制與下一批工作的當前交接紀錄。
52. `COMBAT_REFACTOR_PHASE13_ACTION_DATA_CONTRACT.md`：Phase 13 行動資料契約；統一 player/enemy action 語意欄位，保留 Clash、Boss phase、multi-hit／AoE 與 presentation profile 的資料槽位，先不改 runtime resolver。
53. `COMBAT_REFACTOR_PHASE14_CLASH_CORE.md`：Phase 14 Clash 純 core 契約；定義 eligibility、score breakdown 與 player-win／draw／enemy-win，要求 Preview／Execute 共用同一計算且不恢復 legacy clashPower。
54. `COMBAT_REFACTOR_PHASE14B_CLASH_PREVIEW_CONSEQUENCE.md`：Phase 14b Clash 結果語意契約；把 win／draw／lose 映射為共用 consequence，先附著於 Preview，不在本批改寫 live damage 或 Intent resolution。
55. `COMBAT_REFACTOR_PHASE14C_CLASH_AUTHORITATIVE_RESOLUTION.md`：Phase 14c Clash authoritative resolution 契約；把共用 consequence 套入 Preview／Execute，同一份結果決定玩家效果縮放與 contested enemy Intent 的 cancel／half／full。
56. `COMBAT_REFACTOR_PHASE14D_CLASH_APPLICATION_WIRING.md`：Phase 14d Clash application wiring 契約；由選牌、明確 target、公開 Intent 與 Timeline 決定 contested enemy、timing／specialization modifier，QA bootstrap 首次接入 Controller，七節點 story encounter 暫不啟用。
57. `COMBAT_REFACTOR_PHASE15_NORMAL_ENEMY_ACTION_MIGRATION.md`：Phase 15 Normal enemy migration 契約；六種 Area 01 普通敵人改用 authored ActionDefinition、正式 HP／resilience 與 deterministic cyclic Intent，保留目前 Intent runtime boundary。
58. `COMBAT_REFACTOR_PHASE16_ELITE_RAIN_WARRIOR_MIGRATION.md`：Phase 16 Elite rain-warrior migration 契約；正式 HP 120／resilience 1，採踏込→崩し→居合 deterministic cadence，Boss 尚未遷移。
59. `COMBAT_REFACTOR_PHASE17_BOSS_ACTION_PHASE_POLICY.md`：Phase 17 Boss 資料／phase policy 契約；正式 HP 240／resilience 1，author `雨斬／山影連刃／驟雨橫掃／壓雨／終雨` 與 deterministic phase/cooldown policy，multi-hit／AoE runtime cutover 留待下一批。
60. `COMBAT_REFACTOR_PHASE17B_BOSS_MULTI_TARGET_MULTI_HIT_RESOLUTION.md`：Phase 17b Boss runtime resolution 契約；保留 `damage × hitCount`、全體公開目標與整個 Intent 一次 Guard，並把 production rain-boss 切到 authored phase/cooldown action provider。

## combat-refactor-v1 分支規則

在 `combat-refactor-v1`：

- 新戰鬥設計只讀 `COMBAT_REFACTOR_V1.md`、`COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md`、目前 Phase contract 與仍適用的架構／資產文件。
- `COMBAT_REFACTOR_PROGRESS.md` 用來判斷目前做到哪一批、哪一批仍待 CI／runtime 證據，以及 external deployment gate 狀態。
- `CURRENT_COMBAT_SPEC.md`、`COMBAT_ACCEPTANCE_CHECKLIST.md`、`NEXT_WORK.md` 中描述舊 round planning、雙列 timeline、殺生線主導、下一回合提交等內容，只用來識別要被替換的 legacy runtime。
- 不從 `docs/archive/` 恢復任何舊玩法。
- 每一批新實作都必須先在重構規格／實作計畫／對應 Phase contract 中有明確契約，並同步更新 progress，再進 source/tests。

`HANDOFF.md`、舊 `player-a`～`player-d` 文件與 P1～P11 過程文件只保留歷史脈絡。`docs/archive/` 不得作為目前設計輸入。