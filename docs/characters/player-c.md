# Character Master Spec：Player C／朧

STATUS = APPROVED_BY_ART_DIRECTOR_2026-08-18

- Identity reference：`references/characters/oboro/oboro-design-reference-v1.png`（使用者提供；只作設計依據，來源與發行權利待確認）。
- Master reference candidate：`assets/candidates/characters/oboro/oboro-sd-side-master-candidate-v1-cropped.png`。第一代綠幕生成後只經 deterministic chroma cleanup 與 alpha crop；自動檢查通過，等待實機與 Art Director 核准。
- Side-view／facing policy：玩家站左側，authoring direction 朝右。右腿網襪、左腿長襪、雙武器與腰側忍具明顯不對稱，不可水平翻轉代替另一方向。
- Palette：炭黑、紫黑、暗灰、低彩朱紅、少量古銅金與膚色；禁止高彩紫光、螢光綠與大面積亮色。
- Body proportion：成年女性 SD，約 3.1–3.4 頭身；體型輕捷，四肢不可縮成圓柱或幼兒比例。
- Face／hair：銳利琥珀眼、深紫黑高馬尾、紅繩髮結與散落瀏海；禁止改成短髮、雙馬尾或遮眼頭巾。
- Costume：無袖深色忍裝、頸部圍巾、破損長披布、紅繩束帶、左腿黑色長襪、右腿網襪、露趾忍靴、腰側忍具袋。
- Weapon dimensions：雙武器固定為一把單刃短忍刀／脇差（刃長約身高 0.45–0.55）與一把短苦無／匕首（全長約身高 0.18–0.24）。禁止增加第三把武器、把短刀變長刀或合併成雙頭武器。
- Silhouette：高馬尾＋圍巾／破損披布＋左右腿不對稱＋一長一短雙刃；82 px 高仍須能與 Player A、千景分辨。
- Pivot：normalized `(0.50, 0.965)`；腳底不得包含影子或地面。
- Runtime height：4V4 `84–100 px`；1V1 `130–148 px`。
- Allowed variations：馬尾與披布小幅飄動、雙手握位、短刀出鞘角度、表情。
- Forbidden variations：臉漂移、左右腿設計互換、披布或忍具袋消失、武器數量／長度漂移、三分之四戰鬥視角、八方向、FX、光影、地面、背景、文字。
- Production gate：先完成單張嚴格側視 SD master；通過 Alpha、chroma spill、腳底線、82／100／148 px silhouette 與 4V4 runtime 後，才可生成衍生 pose。
- Runtime trial：`public/assets/battle/oboro-sd-side-master-runtime-trial-v1.png`，只配置給 Player C；尚無衍生 pose，動作暫用同張 master 加 runtime 位移、角度與 FX。
- Runtime QA：1280×720 接地、站列、雙武器與相鄰 HUD overlap 通過。844×390 初次檢查因全隊非焦點 alpha 0.55 造成黑衣輪廓流失；改以角色資料設定最低 0.72 後複驗，高馬尾、披布與雙武器 silhouette 可辨識。仍等待 Art Director approval。
