# Phase 10h — 指定 BG 候選接入

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把使用者提供的 `area01-rail-halt-hd2d-candidate-v2.png` 接到新版戰鬥 QA runtime，並以這張圖重新檢查 full-canvas battlefield 的透視、角色站位、角色比例與 floating HUD 可讀性。

## 素材狀態

- 原始候選：`area01-rail-halt-hd2d-candidate-v2.png`。
- 使用者已在本次工作提供實際 PNG；解析度為 1672×941。
- 依 `docs/art-bible.md`，本批只視為 browser QA candidate / runtime-trial，不自動升級為 approved 或 release-ready。
- 不修改其內容、不把 HUD／角色／FX 烘入背景。

## Runtime 接線

- `RefactorBattleAssets.ts` 的 `REFACTOR_BATTLE_BACKGROUND_KEY` 改載入這個候選的 runtime 可讀版本。
- `RefactorBattleScene` 繼續把 BG 鋪滿 1280×720 full canvas；上／下全寬框已由 Phase 10g 移除，不再拿 HUD 框限制背景構圖。
- party HUD、Intent、Preview 保持 floating overlay；角色站位依背景地面透視做 browser QA，不在本批改 combat core。

## 傳輸限制與暫時 runtime 形式

目前 GitHub connector 的 contents write 只接受 UTF-8 文字檔，無法直接提交使用者提供的二進位 PNG。為了不阻塞 current-head Pages QA，本批允許建立一個 **temporary runtime SVG wrapper**：

- SVG 只包裝由使用者 PNG 產生的高品質 JPEG derivative，不重繪畫面內容。
- runtime wrapper 放在 `public/assets/battle/`，供 Phaser image loader 直接載入。
- 原始 PNG 仍是本候選的 source-of-truth；一旦有可用的 binary commit path，應以原始 `area01-rail-halt-hd2d-candidate-v2.png` 取代 temporary wrapper，並刪除 wrapper。
- temporary wrapper 不得被記成 approved source 或 release master。

## 驗收

自動：

- `npm run build`
- `npm run test`
- runtime preload path 不得 404。

Browser QA：

- 1280×720：背景完整鋪滿、中央交戰區與角色腳點合理。
- 844×390：不得因縮放造成角色浮空、主要交戰區被 HUD 蓋住或 Timeline／手牌不可讀。
- 檢查我方四人與敵人尺寸、地面接觸、前後景比例、攻擊近身距離與浮動 HUD 對比。

## 非目標

- 不把 candidate 升級 approved。
- 不重畫或生成新的背景。
- 不改 Guard、Timeline、hand、Intent、Delay 或傷害規則。
- 不在本批移除 legacy combat source。
