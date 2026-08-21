# Tactical Code Rift 美術規範

STATUS = AUTHORITATIVE

## 素材狀態

1. `candidate`：候選，不得直接視為正式素材。
2. `runtime-trial`：可接入遊戲驗收，但尚未核准發布。
3. `approved`：由 Art Director 明確核准。
4. `rejected`：保留為負面參考，禁止重新進入 runtime。

檔案位於 `public/assets` 不代表 approved，也不代表具備發布授權。

## 角色素材

- 角色身份必須來自核准 Character Master。
- 方向、服裝、武器、比例與配色不得在衍生動作中漂移。
- 橫向戰鬥動作使用真實透明 PNG，不得包含棋盤格、綠幕、背景、地面陰影、UI、文字或預先烘入的通用 FX。
- 每名角色的 idle、ready、attack、hit、down 使用一致畫布、腳底 pivot 與顯示高度。
- 4V4 驗收高度約 82～108 px；1V1 約 130～160 px。正式來源必須足以在目標高度保持乾淨輪廓。
- 不得把 128 px prototype 插值放大後標示為高解析正式素材。
- 非對稱角色或武器若未核准鏡像，禁止使用 horizontal flip。

## Alpha 與裁切

- Actor／FX 必須含 alpha channel，且不能完全透明。
- 禁止烘入棋盤格、綠幕 spill、白邊、黑底與相鄰 atlas cell 碎片。
- 清理不得任意刪除與角色相連的武器、髮絲或服裝輪廓。
- standing pose 使用共同腳底基準；down pose 另有橫躺 bbox，但落地位置必須一致。
- 自動檢查至少包含：格式、尺寸、alpha、bbox、透明 padding、孤立 component、pivot 與 runtime key 唯一性。

## 背景

- 背景不得烘入角色、路線節點、卡牌、文字、HUD、殺意線或攻擊 FX。
- Area 01 中央交戰區保持低細節，角色與意圖線必須優先可讀。
- 路線背景正式來源要求原生 3840×2160，並產生 2560×1440 與 1280×720 衍生檔。
- 小於 2K 的生成圖不得經插值後宣稱為原生 4K。

## Runtime 驗收

每次視覺變更至少檢查：

- 1280×720 桌面
- 844×390 橫向小螢幕
- idle、focus、attack、hit、down
- silhouette、palette、pivot、scale、overlap
- 網路 404、console error、黑色素材框

失敗代碼包含：`alpha-failure`、`pivot-failure`、`runtime-overlap`、`style-drift`、`face-drift`、`costume-drift`、`weapon-size-drift`、`background-too-detailed`、`central-area-too-busy`、`wrong-area-palette`。

## 核准

Codex 可以提出核准建議；只有使用者／Art Director 能把素材改為 approved。核准後必須同步更新 `references/approved/index.json`、角色／區域規格與 `assets/ASSET_PROVENANCE.md`。
