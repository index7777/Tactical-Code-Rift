# 專案文件入口

STATUS = AUTHORITATIVE_INDEX

Current operational handoff: `PROJECT_STATUS.md`. Release asset gates: `RELEASE_ASSET_AUDIT.md`. The older `HANDOFF.md` is retained as historical context and is not the current identity/runtime source.

所有設計、實作與驗收工作必須先從本文件進入。未列入「現行權威文件」的內容，不得作為功能決策依據。

## 現行權威文件

1. `HANDOFF.md`：新對話的現況、已驗證內容、工作樹警告與下一決策點。
2. `CURRENT_COMBAT_SPEC.md`：現行戰鬥規則。
3. `YOKAI_RAILWAY_DEMO_PLAN.md`：戰鬥視覺、HUD、殺生線與 Demo 階段方向。
4. `COMBAT_ACCEPTANCE_CHECKLIST.md`：完成狀態與畫面自證門檻。
5. `ARCHITECTURE.md`：目前 TypeScript／Phaser／Vite 技術架構。
6. `FX_CROSS_ENGINE_SPEC.md`：現行 FX runtime 與未來移植參數。
7. `GAMEPLAY_INSPIRATIONS.md`：參考作品與原創差異界線。
8. `PLANNING_LOG.md`：每次建議、決策、批次範圍與結果的永久紀錄。
9. `DEMO_ASSET_PLAN.md`：通用卡型、怪物、場景、FX 與低生成成本素材規劃。
10. `art-bible.md`：AI 美術生成、整合、實機驗收與拒絕樣本的總規格。
11. `characters/README.md`：Character Master 索引與角色資產生成門檻。
12. `areas/README.md`：Area Art Bible 索引與戰鬥背景規格。

## 支援性文件

- `../CAPABILITY_REGISTRY.md`：工具、runtime 與驗證能力狀態。
- `../assets/ASSET_PROVENANCE.md`：實際 runtime 素材來源與授權。
- 根目錄的 Asset Pipeline 文件：資產規格工具，不是玩法規格。

## 歷史封存

`archive/` 內全部文件只供追溯，不得用來推導現行玩法或 Task。其內容可能包含已淘汰的 ATB、AP、五槽撲克、舊 HUD、飛空艇或晶片規劃。

除非 Task 明確要求歷史比較，任何代理或開發者都不得讀取 `docs/archive/` 來決定目前功能。

## 文件更新規則

1. 新建議先追加至 `PLANNING_LOG.md`，記錄日期、原因、範圍與狀態。
2. 採用後同步修改相應權威規格；不可只存在聊天紀錄。
3. 被取代的文件移入 `archive/YYYY-MM-說明/`，不得與現行文件並列。
4. 程式、測試、瀏覽器畫面與文件衝突時，以程式及測試證據回報差異，再修正文檔，不可自行假定文件已完成。
