# Character Master Spec：Player A／女主角

STATUS = CANDIDATE_MASTER_NOT_APPROVED

- Master reference：`assets/candidates/characters/heroine/heroine-sd-idle-master-candidate-v2.png`
- Side-view reference：同上，原圖朝左；服裝與持刀沒有不可翻轉文字或徽記。玩家站在左側時以 runtime horizontal flip 朝右（戰場中央），不另製第二方向。
- Runtime trial：`public/assets/battle/heroine-sd-idle-v1.png`、`heroine-sd-ready-v1.png`、`heroine-sd-down-v1.png`
- Palette：墨黑 `#17171B`、朱紅 `#8E2634`、暗象牙 `#D8D0C4`、舊金 `#A47B42`；禁止螢光綠與大面積高彩紫。
- Body proportion：SD 約 3.1–3.4 頭身；頭寬約肩寬 0.9；腿部不可縮成單一柱體。
- Face／hair：成年女性、乾淨日系臉型、高馬尾為主識別；瀏海與馬尾大形固定，禁止每 pose 改髮長、髮線或眼型。
- Costume：短羽織、黑色下裝、朱紅內襯、少量舊金扣件；腰帶層數、袖口與領型固定，不新增胸甲、披風或現代緊身服。
- Weapon dimensions：單一入鞘打刀；柄長約 2.5–3 個 chibi 拳寬，柄、鍔、鞘口必須連成同一機械軸；鞘長約身高 0.62–0.72，不得變長柄刀或第二把刀。
- Silhouette：高馬尾＋短羽織下擺＋腰側單刀；82 px 高仍能看出三個大形。
- Pivot：normalized `(0.50, 0.965)`；所有 standing pose 共用腳底線。
- Runtime height：4V4 `82–100 px`；1V1 `130–150 px`。
- Allowed variations：呼吸幅度、袖擺與馬尾小幅偏移、臉部表情、刀出鞘狀態。
- Forbidden variations：臉漂移、髮型改短、左右手換刀、刀柄尺寸漂移、服裝分件增減、發光、影子、背景、8方向、三分之四視角。
- Approval gate：idle 在 82／100／150 px、4V4 runtime、武器連續性與透明邊緣全部通過後，才可成為 approved master。
