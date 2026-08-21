# 專案文件索引

STATUS = AUTHORITATIVE_INDEX

目前角色正式識別碼只有 `rin`、`chikage`、`oboro`、`mo`。PA／PB／PC／PD 與 A／B／C／D 僅是舊 Demo 槽位代號，不得再作為角色身份或永久站位。

## 目前權威文件

1. `PROJECT_STATUS.md`：目前可執行狀態、阻塞項目與同步方式。
2. `PROJECT_AUDIT_2026-08-21.md`：整體品質與維護性稽核。
3. `ARCHITECTURE.md`：實際程式分層與目標邊界。
4. `CURRENT_COMBAT_SPEC.md`：`main` 目前已實作的戰鬥規則摘要；在 `combat-refactor-v1` 分支只作舊 runtime 對照，不作為新玩法設計輸入。
5. `COMBAT_REFACTOR_V1.md`：`combat-refactor-v1` 分支的戰鬥重構權威規格；此分支的戰鬥規則、HUD 與互動修改以本文件為準。
6. `COMBAT_ACCEPTANCE_CHECKLIST.md`：現行戰鬥驗收條件；重構期間需逐批建立對應的新驗收項目，不可直接把舊交鋒／整輪規劃條件視為新系統完成標準。
7. `art-bible.md`：角色、怪物、背景與透明素材規範。
8. `characters/README.md`：角色母版與 runtime 對照。
9. `areas/README.md`：區域背景與 runtime 狀態。
10. `RELEASE_ASSET_AUDIT.md`：發布授權閘門。
11. `PLANNING_LOG.md`：採用決策與驗證紀錄。
12. `NEXT_WORK.md`：`main` 現行產品線的執行順序；`combat-refactor-v1` 不得把其中的舊戰鬥 UI／整輪規劃事項當成新玩法約束。

## combat-refactor-v1 分支規則

在 `combat-refactor-v1`：

- 新戰鬥設計只讀 `COMBAT_REFACTOR_V1.md` 與仍適用的架構／資產文件。
- `CURRENT_COMBAT_SPEC.md`、`COMBAT_ACCEPTANCE_CHECKLIST.md`、`NEXT_WORK.md` 中描述舊 round planning、雙列 timeline、殺生線主導、下一回合提交等內容，只用來識別要被替換的 legacy runtime。
- 不從 `docs/archive/` 恢復任何舊玩法。
- 每一批新實作都必須先更新重構文件／驗收，再改 source/tests。

`HANDOFF.md`、舊 `player-a`～`player-d` 文件與 P1～P11 過程文件只保留歷史脈絡。`docs/archive/` 不得作為目前設計輸入。
