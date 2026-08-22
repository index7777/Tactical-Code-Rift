# Phase 10h — 指定 BG 候選接入

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把使用者提供的 `area01-rail-halt-hd2d-candidate-v2.png` 接到新版戰鬥 QA runtime，並以這張圖重新檢查 full-canvas battlefield 的透視、角色站位、角色比例與 floating HUD 可讀性。

## 素材狀態

- 原始候選：`assets/candidates/backgrounds/world01/area01-rail-halt-hd2d-candidate-v2.png`。
- 原始 PNG 已由使用者提交至 `main`，commit `cd49f741`；blob `430e675fd5f1b4f991d0f51ba2e15d1ad6ca1727`。
- `combat-refactor-v1` 以相同 blob 建立 `public/assets/battle/area01-rail-halt-hd2d-candidate-v2.png` 作 browser QA runtime copy，避免重新編碼或重繪。
- 解析度為 1672×941。
- 依 `docs/art-bible.md`，本批只視為 browser QA candidate / runtime-trial，不自動升級為 approved 或 release-ready。
- 不修改其內容、不把 HUD／角色／FX 烘入背景。

## Runtime 接線

- `RefactorBattleAssets.ts` 的 `REFACTOR_BATTLE_BACKGROUND_KEY` 直接載入 `assets/battle/area01-rail-halt-hd2d-candidate-v2.png`。
- 不再使用 base64 / data URI / JPEG derivative / SVG wrapper 等 temporary transport workaround。
- `RefactorBattleScene` 繼續把 BG 鋪滿 1280×720 full canvas；上／下全寬框已由 Phase 10g 移除，不再拿 HUD 框限制背景構圖。
- party HUD、Intent、Preview 保持 floating overlay；角色站位依背景地面透視做 browser QA，不在本批改 combat core。

## 清理要求

- 移除 `src/presentation/assets/generated/area01RailHaltHd2dQ60*.ts` temporary data chunks 與組裝檔。
- `RefactorBattleAssets.ts` 不得再 import temporary BG data module。
- runtime BG 必須來自 public PNG 路徑，避免 bundle 內嵌大段 base64。

## 驗收

自動：

- `npm run build`
- `npm run test`
- runtime preload path 不得 404。
- source 不得再引用 `AREA01_RAIL_HALT_HD2D_Q60_DATA_URI`。

Browser QA：

- 1280×720：背景完整鋪滿、中央交戰區與角色腳點合理。
- 844×390：不得因縮放造成角色浮空、主要交戰區被 HUD 蓋住或 Timeline／手牌不可讀。
- 檢查我方四人與敵人尺寸、地面接觸、前後景比例、攻擊近身距離與浮動 HUD 對比。

## 非目標

- 不把 candidate 升級 approved。
- 不重畫或生成新的背景。
- 不改 Guard、Timeline、hand、Intent、Delay 或傷害規則。
- 不在本批移除 legacy combat source。
