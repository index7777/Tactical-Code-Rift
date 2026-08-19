# PD・紅葉 Character Master（P11.4 runtime trial）

狀態：`RUNTIME_TRIAL_PENDING_ART_DIRECTOR_APPROVAL`

P11.4 重新設計 PD 的目的，是修正舊槍母版在側視戰鬥中武器比例、握點與輪廓不穩定，導致無法安全接入 runtime 的問題。

## 身分與輪廓

- 人類女性隊員，代號 PD，暫名「紅葉」。
- 黑髮高束、黑／朱紅／象牙為主色。
- 武器為長柄槍／薙槍類，不使用火器語彙。
- 戰鬥方向以橫向 2D 左右兩面為準；本體母版優先確保 108px 高時可讀。
- 武器必須與身體形成單一清楚輪廓，不可超長到侵入相鄰角色 HUD 或中央交鋒安全區。

## P11.4 候選

- `public/assets/battle/generated/characters/redleaf/redleaf-sd-master-runtime-trial-v5.png`：由 P11.4 原創概念稿擷取並 deterministic 去背的 runtime-trial 候選。
- Runtime 僅先接 idle；ready／attack／hit／down 暫沿用位移、角度、hit-stop 與共用 FX，不把尚未核准的衍生圖偽裝成完成素材。
- `portrait-redleaf-current`／`portrait-redleaf-timeline` 由同一候選裁切，供 P11.4 菱形 Current Actor 與 timeline 使用。

## Gate

正式升級為 approved master 前必須人工確認：

1. 1280×720 4V4 站位不越界。
2. 槍尖／槍尾不穿進鄰位角色 HUD。
3. 左右鏡像後握點合理。
4. 頭像在菱形 mask 內不溢出。
5. 與女主／千景／朧的 SD 細節密度與輪廓權重接近。
