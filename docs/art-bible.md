# Tactical Code Rift 美術製作總規格

STATUS = AUTHORITATIVE

本文件約束角色、怪物、背景、事件圖與戰鬥整合。玩法規則仍以 `CURRENT_COMBAT_SPEC.md` 為準；美術不得自行新增技能、武器切換、方向或戰鬥狀態。

## 強制工作流

```text
Read Art Bible + relevant Character Master / Area Spec
→ Read matching approved and rejected references
→ Generate or edit one candidate
→ Save under assets/candidates with provenance
→ Run deterministic asset checks
→ Integrate candidate into the real scene
→ Run game at 1280×720 and mobile landscape
→ Capture screenshots for idle, focus and action states
→ Compare against master/spec and record Pass or Fail
→ Iterate only on named failures, maximum 3 automatic attempts
```

第三次仍不合格時停止，保留最後候選與三次報告，回報阻礙；不得無限生成。單張原圖、透明預覽或程式碼存在都不能成為核准證據。

## 資產狀態

每個資產只能處於以下狀態之一：

1. `candidate`：已生成，尚未通過整合驗收。
2. `runtime-trial`：已接入遊戲，只供實機比較。
3. `approved`：通過規格、自動檢查、實機截圖及 Art Director 核准。
4. `rejected`：禁止再次作為正向生成 reference；必須保存圖片與具體原因。

候選不得直接覆寫 approved 資產。任何 runtime-trial 都需可回復且更新 `assets/ASSET_PROVENANCE.md`。

## 角色共同規格

- 2D SD／chibi、日系 JRPG／anime、粗而乾淨的外輪廓、內部保留 cel shading。
- 嚴格側視，只製作朝戰場中央的一個方向；能安全水平翻轉時不另畫方向。
- 臉型、髮型、身體比例、服裝分件、武器種類與尺寸只由 Character Master 決定。
- 角色圖不得烘焙 FX、發光、環境色、投影、地面、文字或 UI。
- 普通戰鬥以 `idle / ready / down` 為最低繪圖集；attack、hit、break 優先以 ready／idle 加 runtime 位移、旋轉、染色、hit-stop 與 FX 完成。
- 新 pose 必須引用同一 Character Master；不得用文字重新猜角色。
- 4V4 實際顯示約 82–100 px 高，1V1 約 130–150 px；縮圖輪廓仍須可辨識。

## Character Master 必要欄位

每份 `docs/characters/*.md` 必須記錄：master reference、side-view reference、palette、body proportion、face/hair rules、costume rules、weapon dimensions、silhouette rules、allowed variations、forbidden variations、facing policy、pivot、runtime height、approval state。

沒有 approved Character Master 時禁止生成該角色的 pose、attack、hit、break 或 Event CG。

## 背景共同規格

- 超寬橫向 2D side-view battlefield；stylized Japanese JRPG／anime，不採 photorealistic 或 PBR 質感。
- 背景細節與對比低於角色；中央 45–50% 保持低視覺噪音。
- 中央是衝刺、交鋒、擊退、追擊、接力與 FX 安全區；高對比物件只可放在外側。
- 地面需有明確且一致的角色接地基準，能容納 4V4 的 Y 軸錯層站位。
- BG 不得包含人物、敵人、UI、HUD、文字、卡牌、殺生線或攻擊 FX。
- 玩家在左、敵人在右；背景構圖不能暗示傳統同列一對一。

## 實機截圖門檻

角色至少檢查：4V4 待機、目前行動者聚焦、中央交鋒、受擊／崩勢、死亡。背景至少檢查：無角色底圖、4V4 全線、聚焦殺生線、中央交鋒、1280×720 與 844×390 橫向。

每次 Fail 必須使用具體代碼：`too-realistic`、`background-too-detailed`、`silhouette-lost`、`wrong-proportion`、`face-drift`、`costume-drift`、`weapon-size-drift`、`wrong-battlefield-composition`、`central-area-too-busy`、`ground-unreadable`、`wrong-area-palette`、`supernatural-too-strong`、`alpha-failure`、`pivot-failure`、`runtime-overlap`。

## 自動與人工邊界

可自動：尺寸、比例、PNG alpha、透明邊界、非空 bbox、中央邊緣密度、縮圖輸出、檔名、manifest、provenance 完整性、build、scene navigation、viewport、console、截圖保存及三次迭代計數。

必須人工：角色魅力、臉部一致性、服裝／武器設計是否正確、輪廓辨識、背景是否搶戲、妖異強度、整體風格、最終 approved／rejected 決策。
