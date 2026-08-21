# 雨暮驛・站守 — Boss Character Master

STATUS = VISUAL_MASTER_APPROVED

## Production identity

- Runtime ID: `rain-boss`
- Demo name: `雨暮驛・站守`
- Encounter: `boss-1`
- Area: Area 01「雨暮山線」終點月台
- Role: 第一區守關 Boss；被廢線契約束縛、永遠守候末班列車的異形站守
- Approved visual master: `assets/candidates/monsters/rainfall-ridgeline/rain-boss-master-side-candidate-v2.png`
- Current runtime: `public/assets/battle/generated/monsters/rainfall-ridgeline/rain-boss-master-runtime-v1.png`
- Authorship: project-original textual design and built-in ImageGen visual master under user direction

## Core fantasy

站守不是巨大野獸，也不是普通武士的放大版。他曾是終點站秩序的象徵，死亡後與廢站、閉塞器和未能抵達的末班列車結合。外觀保留「站務員」的端正與克制，但人體已被雨水、舊鐵與封站契約侵蝕。第一眼應讀成沉默的人形守衛，第二眼才發現面部、關節與制服都不再屬於活人。

視覺關鍵詞：`終點站務員`、`封站契約`、`舊鐵甲`、`無表情票鉗面`、`長柄信號刀`、`克制的非人感`。

## Silhouette

- 嚴格 2D 橫向戰鬥視角，站在敵方右側並面向左方；不得使用 3/4、正面或背面作為 runtime master。
- 身高約玩家標準戰鬥高度的 `1.40–1.50x`，高但不超出戰鬥 HUD；肩寬約身高 `0.34–0.38x`。
- 頭部由低矮舊式站務帽形成水平帽簷；帽頂不可做成武將兜或巨大尖角。
- 上身直立、重心前壓；長外套下襬分成兩片不對稱尾襬，形成「月台旗／破損時刻表」般的垂直輪廓。
- 左側輪廓由面向戰場的長柄信號刀主導；右側輪廓由外套尾襬與一段斷裂的信號燈框平衡。
- 腳下輪廓必須清楚，兩腳落在同一 baseline；不可用煙、積水或陰影遮住 pivot。

## Anatomy and face

- 基本結構為高瘦成年男性人形，四肢比例可信；不可增加多手、多頭、獸足或巨大脊椎附肢。
- 臉被一片狹長、無文字的舊象牙色「票鉗面」覆蓋，外形介於站務員剪票鉗與無表情能面之間。
- 面具只有一道細窄水平觀察縫；常態內部全黑，不把發光眼烘焙進 master。
- 下顎與頸部可露出少量黑色濕布或鏽蝕機械連接件，但不出現血肉、獠牙或殭屍腐爛特寫。
- 手部戴深色皮手套；握刀手必須有清楚指向，另一手保持靠近腰間閉塞器匣。

## Costume and materials

- 主體是大正至昭和初期語彙的長版站務制服，外覆少量鐵路工務護甲；不得直接複製真實公司制服或標誌。
- 外套為深靛黑防雨呢料，胸前雙排低調金屬扣；衣領硬挺，肩部只有薄型護片，不做武士大袖甲。
- 腰間固定一只無文字的老式閉塞器匣，作為契約核心；尺寸約頭部高度的 `0.55x`。
- 外套與手套可有濕潤材質高光，但不得畫雨滴、雨線、飛濺、地面水花或環境反射。
- 所有破損集中在下襬與右肩，主體仍維持站務員式的秩序感；不可做成滿身碎布的流浪武者。

## Weapon — 閉塞信號刀

- 單一專屬武器：由長柄鐵路信號桿與單刃長刀結合的「閉塞信號刀」。
- 全長約 Boss 身高的 `1.05–1.15x`；刃長約全長 `0.42x`，刀身寬而直，末端只有輕微反曲。
- 握柄為暗木與黑鐵，靠近刀鍔處有一個小型圓形信號框；框內常態熄滅，紅光屬 runtime FX。
- 武器不可變成薙刀、巨劍、武士刀、鐵路標誌牌或帶可讀文字的交通號誌。
- 所有衍生姿勢必須維持相同武器長度、刀刃輪廓、信號框位置與握法邏輯。

## Palette

| Part | Base | Highlight / accent |
|---|---|---|
| Uniform | `#101821` deep blue-black | `#273846` cold slate |
| Armor / hardware | `#24292D` old iron | `#596168` wet steel edge |
| Oxidized fittings | `#665443` dark brass | `#9A805E` restrained worn edge |
| Contract cloth | `#4A2028` muted burgundy | `#74323A` danger accent |
| Mask | `#B7B0A0` aged ivory | `#D1C9B7` narrow rim light |
| Leather / wood | `#171313` near black | `#473A32` worn brown |

- 冷色面積至少 80%；暗酒紅與黃銅只作局部識別。
- 禁止高飽和霓虹、大片純紅、純白盔甲、金色神聖光與常駐青色靈光。
- 階段紅光、眼縫亮光、雨幕與濕地反射全部由 runtime layer 提供。

## Combat read and scale

- Master source target: transparent RGBA PNG, at least `2048x2048`, with generous padding and complete weapon silhouette.
- Runtime target height at 1280x720: approximately `150–168 px`; feet align with the shared enemy baseline.
- Boss 必須比一般怪與雨夜武者高，但仍讓右側 HUD、意圖線和隨從保持可讀。
- `boss-1` 目前同場有辻傘與縊鬼；站守輪廓的垂直高度與長柄刀必須讓玩家一眼識別主體。
- 不允許 horizontal flip；所有敵方衍生圖直接面向左方生成。

## Required asset set

1. `master-side`: 唯一通用戰鬥母版；左向站姿，完整身份、服裝、武器與比例基準。
2. `portrait-current` / `portrait-timeline`: 只能由核准 master 裁切，不重新設計臉或帽型。

- 敵方不製作獨立 `idle`、`ready`、`hit`、`break` 或 `down` 圖。
- 待機、備戰、受擊與崩勢全部由同一張母版搭配位移、旋轉、縮放、tint、停格與 FX 表現。
- 死亡不使用倒地圖；採經典 JRPG 式 runtime 消散：短暫失色、輪廓碎裂／光粒上升、alpha 歸零後移除。不得直接複製特定遊戲的圖形或動畫素材。
- 目前兩個攻擊也先共用母版，以武器軸旋轉、前踏、殘影與刀光區分；只有實機可讀性證明不足時，才另提攻擊關鍵姿勢需求。

## Runtime-only effects

- 雨線、地面飛濺、霧、接地陰影、倒影、刀光與命中特效。
- 「雨斬・終」可啟用暗酒紅信號框、窄幅冷白刀緣與延遲雨幕切線。
- 「山影連刃」可使用短促殘影與信號框脈衝，但不得改變武器外形。
- 階段變化只增加眼縫、閉塞器匣和信號框的同步微光；不更換服裝、肢體或第二把武器。

## Forbidden drift

- `style-drift`: Q 版、像素風、厚塗寫實、純剪影或簡化向量風。
- `face-drift`: 露出完整人臉、骷髏臉、獸臉、發光雙眼或不同面具。
- `costume-drift`: 武士甲、軍官披風、現代列車長制服、斗笠、神官服或西式騎士甲。
- `weapon-size-drift`: 改變信號刀長度超過 5%、移動圓形信號框或增加第二武器。
- `wrong-facing`: 右向、正面、3/4 或可翻轉設計。
- `alpha-failure`: 棋盤格、場景、雨、霧、光暈、影子或地面被烘焙進角色 PNG。
- `runtime-overlap`: 帽、武器或尾襬侵入 HUD，或與辻傘／縊鬼預設站位無法分離。
- 不得加入可讀站名、數字、公司標誌、文字、浮水印或真實鐵路商標。

## Approval gate

The user, acting as Art Director, approved visual candidate v2 as the universal `master-side` on 2026-08-21. Runtime may reuse it for idle, ready, attack, hit and break transforms. Death must dissolve without a separate down pose.
