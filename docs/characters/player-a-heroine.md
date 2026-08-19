# Character Master Spec：Player A／女主角

STATUS = P11_4_STYLE_REWORK_RUNTIME_TRIAL

P11.4 起 PA 進入畫風重製流程。舊版大頭幼化比例與千景／朧的 runtime 細節密度不一致，因此舊 master 僅保留角色身分與配色參考，不再視為畫風目標。

- Rework candidate：`public/assets/battle/generated/characters/heroine/heroine-p11-4-style-rework-candidate.svg`
- Legacy reference：`assets/candidates/characters/heroine/heroine-sd-idle-master-candidate-v2.png`
- Facing：嚴格側視朝右，玩家站左側面向敵方；禁止三分之四視角。
- Palette：墨黑 `#17171B`、朱紅 `#8E2634`、暗象牙 `#D8D0C4`、舊金 `#A47B42`；禁止螢光綠與大面積高彩紫。
- Style target：與千景／朧同一套日系 JRPG cel shading、粗而乾淨外輪廓、服裝材質與內部陰影密度；不得回到舊 PA 的超大頭幼化比例。
- Body proportion：SD 約 3.4–3.8 頭身；腿長與軀幹需比舊版增加，4V4 縮到 82–100 px 時仍保留成人女性輪廓。
- Face／hair：成年女性、乾淨日系臉型、高馬尾為主識別；瀏海與馬尾大形固定，禁止每 pose 改髮長、髮線或眼型。
- Costume：短羽織、黑色下裝、朱紅內襯、少量舊金扣件；大色塊優先，細節量對齊千景／朧，不新增胸甲、披風或現代緊身服。
- Weapon dimensions：單一入鞘打刀；柄長約 2.5–3 個 chibi 拳寬，柄、鍔、鞘口連成同一機械軸；鞘長約身高 0.62–0.72，不得變長柄武器、雙刀或第二把刀。
- Silhouette：高馬尾＋短羽織下擺＋腰側單刀；82 px 高仍能看出三個大形。
- Pivot：normalized `(0.50, 0.965)`；所有 standing pose 共用腳底線。
- Runtime height：4V4 `82–100 px`；1V1 `130–150 px`。
- Allowed variations：呼吸幅度、袖擺與馬尾小幅偏移、臉部表情、刀出鞘狀態。
- Forbidden variations：臉漂移、髮型改短、左右手換刀、刀柄尺寸漂移、服裝分件增減、發光、影子、背景、8方向、三分之四視角。

## P11.4 approval gate

1. 與 PB／PC 同場 4V4 時，頭身與細節密度不得明顯跳風格。
2. 82／100／150 px 三個尺寸仍可辨識高馬尾、短羽織、單刀。
3. Current Actor 菱形頭像裁切不溢框。
4. idle／ready／attack／hit 不得重新猜服裝或刀尺寸。
5. 只有通過實機 screenshot review 後才可把 STATUS 提升為 approved master。
