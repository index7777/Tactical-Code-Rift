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
17. `COMBAT_REFACTOR_PROGRESS.md`：重構分支目前完成／待驗證／下一批狀態；只記進度，不取代規格與實作計畫。
18. `COMBAT_ACCEPTANCE_CHECKLIST.md`：現行戰鬥驗收條件；重構期間需逐批建立對應的新驗收項目，不可直接把舊交鋒／整輪規劃條件視為新系統完成標準。
19. `art-bible.md`：角色、怪物、背景與透明素材規範。
20. `characters/README.md`：角色母版與 runtime 對照。
21. `areas/README.md`：區域背景與 runtime 狀態。
22. `RELEASE_ASSET_AUDIT.md`：發布授權閘門。
23. `PLANNING_LOG.md`：採用決策與驗證紀錄。
24. `NEXT_WORK.md`：`main` 現行產品線的執行順序；`combat-refactor-v1` 不得把其中的舊戰鬥 UI／整輪規劃事項當成新玩法約束。

## combat-refactor-v1 分支規則

在 `combat-refactor-v1`：

- 新戰鬥設計只讀 `COMBAT_REFACTOR_V1.md`、`COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md`、目前 Phase contract 與仍適用的架構／資產文件。
- `COMBAT_REFACTOR_PROGRESS.md` 用來判斷目前做到哪一批，以及哪一批仍待 CI／runtime 證據。
- `CURRENT_COMBAT_SPEC.md`、`COMBAT_ACCEPTANCE_CHECKLIST.md`、`NEXT_WORK.md` 中描述舊 round planning、雙列 timeline、殺生線主導、下一回合提交等內容，只用來識別要被替換的 legacy runtime。
- 不從 `docs/archive/` 恢復任何舊玩法。
- 每一批新實作都必須先在重構規格／實作計畫／對應 Phase contract 中有明確契約，並同步更新 progress，再進 source/tests。

`HANDOFF.md`、舊 `player-a`～`player-d` 文件與 P1～P11 過程文件只保留歷史脈絡。`docs/archive/` 不得作為目前設計輸入。
