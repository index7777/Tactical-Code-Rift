# Area 01 BG Master：雨暮山線

STATUS = AUTHORITATIVE_BG_MASTER

本文件是第一區旅程路線與戰鬥背景的共同母版。所有新 BG、背景衍生版本與 runtime 接入必須同時遵守本文件、`area-01-rainfall-ridgeline.md`、`../art-bible.md` 與素材包的 Route Map／Battle Scene layer contract。

本母版只定義背景，不核准任何現有 PNG。現行旅程與車頂背景仍為 `runtime-trial`；只有 Art Director 能將候選標記為 `approved`。

## Visual Master Candidate

- Route BG candidate：`assets/candidates/backgrounds/world01/area01-route-bg-candidate-v1.png`
- Status：`CANDIDATE_PENDING_RUNTIME_QA_AND_ART_DIRECTOR_APPROVAL`
- Source：Built-in ImageGen，依本文件與 `area-01-rainfall-ridgeline.md` 生成；未引用現有 runtime-trial 作風格母圖。
- Deterministic gate：`1672×941 RGB`、16:9、minimum runtime size、central density 全部通過；中央密度 `0.0103`、外圍密度 `0.0125`。
- Manual review note：中央 route 安全區安靜且外緣框景成立；左上月亮與右上遠方神社需在實際 route overlay 下確認是否搶焦。本候選尚未接入 runtime，也不是 approved master。
- Route BG detail candidate：`assets/candidates/backgrounds/world01/area01-route-bg-candidate-v2.png`
- v2 Status：`RUNTIME_TRIAL_BLOCKED_BY_SOURCE_RESOLUTION`。v2 重新渲染山脈、森林、雲層與地表筆觸，deterministic background gate 通過，並依使用者指示接入 JourneyScene 作可回復的 runtime trial；但內建 ImageGen 仍只輸出 `1672×941`，低於 2K production master gate，不得以插值放大冒充原生 4K master。
- Runtime assignment：`public/assets/journey/world01/area01-route-bg-runtime-trial-v2.png`。此指派只代表可實機比較，不代表 approved master。

## 1. 世界觀與視覺命題

第一區是「仍屬人界、但正被黃泉氣息滲入」的日本山間鐵道。畫面必須先讀成雨後山林、老鐵道、廢棄月台與遠方神社，再於霧、反光和不自然的寂靜中感到妖異。

- 80–90% 人界，10–20% 妖異。
- 時間為黃昏後至深夜；天候為雨後、細雨或低霧。
- 情緒是安靜、孤寂、微妙不祥，不做血腥恐怖或末日奇觀。
- 類型是 stylized Japanese JRPG／anime painted background，不採照片、電影寫實或 PBR。
- 角色、敵人、殺生線、刀光與卡牌是主角；BG 必須退後一個視覺層級。

## 2. 共同色彩與材質

### 主色

- 雨夜深藍黑：`#07121C`、`#0D1D2A`
- 青灰霧：`#405662`、`#60747A`
- 低彩暗綠：`#172B27`、`#263A32`
- 濕木／舊鐵褐灰：`#34302F`、`#4A4440`

### 局部色

- 舊金／燈火：`#C69A58`、`#E0B76A`，只占畫面小面積並優先放在外側或遠景。
- 暗酒紅：`#55272D`、`#74323A`，只用於危險地標、Boss 方向提示或極少量建築細節。
- 青白反光：`#9BB9C2`，用於低 alpha 水光、薄霧與月光，不作霓虹邊框。

### 禁止色彩傾向

- 大面積高彩青綠、電藍、紫霧或紅霧。
- 高亮霓虹科幻 HUD 感、全景發光線路或賽博城市照明。
- 血紅天空、巨大血月、大量彼岸花。
- 金屬和積水不可呈現 PBR 鏡面或電影級高動態對比。

## 3. BG 與其他圖層的邊界

BG 可以是完整不透明場景，但只負責固定環境。

```text
BG
→ atmosphereBack（遠景霧／雨幕，可選透明 runtime 層）
→ route geometry 或 battle units
→ unit contact shadow／puddle
→ ground weather
→ foreground props
→ HUD
```

BG 不得烘入：

- 角色、敵人、列車 token、可移動列車或任何單位。
- Route node、connection、branch、Icon、Frame、FX、節點名稱或進度文字。
- HUD、卡牌、血條、護符、刀鐔架勢、殺生線、targeting line 或攻擊 FX。
- 可重用的雨滴、貼地霧、接觸陰影、積水反光、碎石、鐵道殘骸與燈籠前景；這些屬獨立 runtime 層。

遠山、固定山林輪廓、固定建築與不影響可讀性的遠景薄霧可以留在 BG。若霧需要漂移、淡入或遮擋單位，必須拆為透明 atmosphere asset。

## 4. 旅程路線 BG 母版

### 構圖目的

旅程 BG 是路線選擇的舞台，不是預先畫好的地圖。它應讓程式生成的節點、分支、匯流、列車移動與資訊面板保持清楚。

### 畫面規格

- Production source：原生 `3840×2160`；2K review/runtime derivative：`2560×1440`；相容 derivative：`1280×720`。低於 `2560×1440` 的生成輸出只能作構圖候選，不得標記為 production master。
- 視角：象徵性的高視點山谷／山線全景，不採精確道路俯視圖，也不畫固定鐵軌。
- 主要可互動安全區：runtime `x=80..1200, y=125..545`。
- 節點密集區後方需低對比、低細節；不可放亮燈、鳥居、樹幹、瀑布或高反差山脊穿過節點。
- 頂部 `y=0..110` 為標題／進度 HUD 區，底部 `y=590..720` 為操作提示／節點預覽區；兩區不得有高對比地標。
- 左右外緣可放山壁、遠樹、極少量暖燈或神社剪影，形成框景，但不得造成 UI 邊緣擁擠。
- 可使用非常低對比的和紙纖維、麻葉或圓弧風紋；不可讀成發光電路板或科幻網格。

### 路線 BG 內容

- 遠層：雨雲、遠山、低霧、極淡月光。
- 中層：山谷、林線、廢線輪廓、遠方小型神社或停靠點。
- 近層：只允許壓暗的山坡／林影框景；不放可被誤認成 connection 的亮線。
- 妖異提示：最多使用一處不自然霧流、遠方微弱暗紅／舊金燈點或若隱若現的鳥居輪廓。

### Route BG 失敗條件

- `background-too-detailed`：節點後方有密集葉片、建築窗格或清晰岩紋。
- `central-area-too-busy`：中央出現高亮山脊、神社、瀑布或光帶。
- `wrong-area-palette`：主視覺偏霓虹藍紫、科幻黑金或高彩魔法色。
- `supernatural-too-strong`：妖異地標成為畫面主角。
- `runtime-overlap`：背景線條與 route connection、節點框或預覽文字混淆。

## 5. 戰鬥 BG 母版

### 共同構圖

- 16:9 嚴格 side-view battlefield。
- 玩家站位帶：runtime 約 `x=100..470`；敵方站位帶：約 `x=810..1180`。
- 中央交鋒安全區：`x=360..920`，至少占畫面寬度 45%；保持低噪音、低對比且沒有直立障礙。
- 角色中心與腳底活動範圍約 `y=182..458`；地面必須在 82–150 px 角色高度下仍能清楚接地。
- 高對比燈、柱、鳥居、樹幹、設備與建築入口只能位於外側或遠景。
- 背景不得以同列標記暗示傳統一對一站位。

### A. 列車車頂 `rooftop`

- 必須一眼讀成移動列車車頂：弧形金屬面、金屬拼板、鉚釘、維修蓋與車體邊緣。
- 禁止大面積木板紋、月台磚面或普通廣場質感。
- 遠景為高速掠過的山林、遠燈與雨幕；速度感優先交給 parallax／runtime，不在 BG 烘入誇張 motion blur。
- 中央車頂不可有煙囪、設備箱、天窗或突起物。
- `fg-rail-debris` 不放在移動列車車頂。

### B. 沿線停靠／廢棄月台 `wayside`

- 固定要素可包含舊月台、鏽鐵、枕木、站牌剪影與遠處停靠列車，但中央必須保持開放。
- 可使用 `fg-rail-debris`；暖燈存在時才可在其下方搭配 strong puddle reflection。
- 月台邊線不得形成與殺生線相似的高亮長線。

### C. 離車山道／神社外緣 `exploration`

- 固定要素可包含濕石道、山林、破損石階、遠方鳥居或小型神社輪廓。
- `fg-lantern-foreground`、石塊與低霧只能放在外側，不遮擋左右站位帶與武器輪廓。
- 不得以巨大鳥居、神像或妖怪建築填滿中央。

### D. Boss 月台 `boss-platform`

- 仍屬人界鐵道場景，只增加約 10–20% 妖異強度。
- 可使用一處暗酒紅危險地標、異常霧流或不自然熄滅的遠燈；不可改成血月祭壇。
- Boss 輪廓與多條殺生線必須是視覺最高層級，BG 不得用紅黑高對比搶焦。

## 6. Source 與 runtime 契約

- BG source：單張原生 `3840×2160` 不透明 PNG，不得包含 UI 或可動前景。禁止把低解析生成圖單純插值放大後標記為原生 4K master。
- Runtime 命名：`area01-<surface>-bg-runtime-v<N>.png`。
- Candidate 命名：`area01-<surface>-bg-candidate-v<N>.png`。
- Candidate 保存於 `assets/candidates/backgrounds/world01/`；runtime-trial 保存於專案既有 battle／journey asset root。
- 每張候選必須在 provenance 指向本文件與 `area-01-rainfall-ridgeline.md`。
- Route BG 與 Battle BG 不可共用同一張圖拉伸或裁切冒充；兩者視角與安全區不同。
- `reference/` 與生成母版只供 QA，runtime 不直接載入。

## 7. 生成 Brief

### Route BG

```text
Stylized Japanese JRPG anime-painted background for a rainy mountain railway route-selection screen at night. Deep blue-black and desaturated blue-gray mountains, quiet forest valley, faint low mist, tiny restrained warm railway lights near the outer edges, 80–90% grounded human world and only 10–20% subtle supernatural unease. Symbolic high viewpoint, broad low-detail center for programmatic route nodes and connections, dark quiet top and bottom HUD zones. No tracks, nodes, icons, UI, text, train token, characters, monsters, neon circuitry or baked route geometry.
```

### Battle BG 共用尾句

```text
Strict 16:9 side-view battlefield, stylized Japanese JRPG anime-painted background, readable ground plane, low-detail central 45–50% clash safe zone, player formation space on the left and enemy formation space on the right, high-contrast landmarks only at the outer edges. No characters, enemies, UI, text, cards, targeting lines, killing-intent lines, attack FX, foreground props or baked weather particles. Not photorealistic, not PBR, no neon sci-fi HUD, no blood moon, no giant supernatural structure.
```

場景特徵必須在上述共用尾句之前加入；不得只用通用尾句生成四張近似背景。

## 8. 驗收 Gate

### 靜態檔案

- 尺寸、比例、格式與檔名符合契約。
- Production master 必須原生 `3840×2160`；至少另驗證 `2560×1440` 2K derivative。低於 2K 只通過構圖 gate，不通過 production resolution gate。
- BG 為不透明完整場景；透明前景與 atmosphere 另檔。
- 中央安全區邊緣密度通過 deterministic validator。
- 無人物、UI、文字、節點、連線、殺生線或攻擊 FX 烘入。
- provenance、Area Spec 與版本記錄完整。

### Route runtime

1. 空 BG。
2. 全路線 normal／locked 狀態。
3. available／current／cleared 節點與連線。
4. Elite／Boss 危險路徑。
5. 節點預覽面板開啟。
6. `1280×720` 與 `844×390` 橫向。

### Battle runtime

1. 空 BG。
2. 4V4 待機與全部被動殺生線。
3. 聚焦一條殺生線。
4. 中央交鋒／接力位置。
5. contact shadow、ground weather 與 foreground props 分層畫面。
6. `1280×720` 與 `844×390` 橫向。

### 判定

必須逐項檢查：`wrong-area-palette`、`background-too-detailed`、`wrong-battlefield-composition`、`central-area-too-busy`、`ground-unreadable`、`supernatural-too-strong`、`runtime-overlap`。

通過自動檢查與 runtime 截圖只代表可推薦核准；最終 `approved` 仍須 Art Director 決定。
