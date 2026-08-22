# 戰鬥重構進度

BRANCH = combat-refactor-v1
DATE = 2026-08-22

本文件只記錄 `COMBAT_REFACTOR_V1.md`、`COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md` 與各 Phase contract 的實作進度，不取代規格。

> Phase 1–10o 的既有完整歷史仍保留在前序 commit；本次只補 Phase 10p 狀態時不應覆寫舊紀錄。

## Phase 10p — Card Master Asset Reuse

狀態：`CI_PENDING_RUNTIME_WIRING`

先行文件：`docs/COMBAT_REFACTOR_PHASE10P_CARD_MASTER_ASSET_REUSE.md`

已完成：

- 審核既有 `public/assets/battle/cards/art/`，採用 `quick / heavy / guard / delay / break` 五張通用 family visual；不新增角色 × 卡牌或每牌插畫。
- 現有 `attack / defense / support / tactics` 舊四分類 frame 保持 HOLD，不硬套成新版五 family frame。
- 新增 pure presentation `CardFamilyAssetPolicy.ts`，固定五個 family 的 `textureKey / path / REUSE` slot；路徑不含角色 ID 或 selected/disabled/hover 狀態變體。
- `RefactorBattleAssets` 已把五個 family visual 納入 preload；`CardMasterPresentation` 會由 asset policy 取得對應 texture key。
- 本批新增美術素材數量 = 0。

仍待：

- `RefactorBattleScene` 的 card art zone 尚未實際繪製 family texture；目前 loader / presentation policy 已就緒，Runtime wiring 仍需下一個小批次完成。
- Browser QA 必須確認 family visual 不壓卡名、效果摘要與 Delay footer，且 1280×720 / 844×390 都可辨識。

CI：最新 head 等待 GitHub Actions；通過前不得標成 verified。

## 下一批

Phase 10p-runtime：只把既有五個 family texture 接進 card art zone，不新增 frame/icon/BG/角色資產；完成後再進 Asset Batch C Core HUD Skin。
