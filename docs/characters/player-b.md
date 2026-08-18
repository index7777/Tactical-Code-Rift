# Character Master Spec：Player B／千景

STATUS = APPROVED_BY_ART_DIRECTOR_2026-08-18

- Identity reference：`references/characters/chikage/chikage-design-reference-v1.png`（使用者提供；只作設計依據，來源與發行權利待確認）。
- Master reference candidate：`assets/candidates/characters/chikage/chikage-sd-side-master-candidate-v2-cropped.png`。由 v2 僅做 deterministic alpha crop，沒有重新生成或改畫；自動檢查通過，等待實機與 Art Director 核准。
- Side-view reference：待建立；玩家在左側，authoring direction 朝右。設計有右大腿束帶、袖紋等不對稱細節，核准前禁止假定 horizontal flip 安全。
- Palette：墨黑／深紫黑、舊白、低彩紫、古銅金、深木褐；禁止螢光色與大面積純白發光。
- Body proportion：成年女性 SD，約 3.1–3.4 頭身；比 Player A 稍厚重、穩定，腿與足袋必須分清。
- Face／hair：冷靜成年女性、深紫黑高馬尾、長側髮與灰紫眼；髮圈、垂帶與馬尾大形固定。
- Costume：舊白寬袖外衣、胸前白色纏布、深紫黑腰封與開衩下裝、念珠、足袋草履；污痕可保留但不得每 pose 改變衣服分件。
- Weapon dimensions：單柄長柄薙刀；總長約角色身高 1.35–1.55，桿身深色，兩端古銅金屬件，一端單一長彎刃。禁止雙頭刃、短槍、武士刀或第二把武器。
- Silhouette：高馬尾＋大念珠＋寬大破損袖擺＋水平長柄薙刀；82 px 高仍應看出四個大形。
- Pivot：normalized `(0.50, 0.965)`；腳底不得含烘焙影子。
- Runtime height：4V4 `86–102 px`；1V1 `132–150 px`。
- Allowed variations：呼吸、袖擺／馬尾小幅偏移、出招時握位改變、表情、薙刀刃部小角度旋轉。
- Forbidden variations：臉漂移、馬尾變短、念珠消失、袖紋／腿帶任意換側、武器長度或刀型漂移、額外武器、FX、光影、地面、背景、八方向、三分之四戰鬥視角。
- Production gate：第一個 side-view master candidate 必須先通過 alpha、腳底線、82／100／150 px silhouette 與 4V4 runtime；未核准前不生成 Attack／Hit／Break／Down／Event CG。
- Runtime trial：`public/assets/battle/chikage-sd-side-master-runtime-trial-v1.png`，只配置給 Player B。因尚無衍生 pose，攻擊／受擊／死亡暫用同張 master 加 runtime 位移、角度與 FX。
- Runtime QA：1280×720 與 844×390 的 4V4 待機畫面通過接地、站列、角色輪廓與 HUD overlap 檢查；高馬尾、舊白袖、大念珠與長薙刀在兩種尺寸均可辨識。尚未取得 Art Director approval，也未通過獨立 Attack／Down pose 驗收。
