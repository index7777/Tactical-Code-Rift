# Tactical Code Rift 資產生成提詞 2026-08

STATUS = PROMPTS_READY_FOR_ART_GENERATION

本文件為專案內部提詞規範，供 AI 圖像生成工具（Midjourney / SDXL / DALL·E 3 / Flux 等）使用。每則提詞為**單張獨立可用**輸出，禁止「先生四張再拼貼」「先生底圖再貼元件」；生成端不得要求人工複製貼上組合。

## 專案美術風格總結（每則提詞開頭都要引用同一段）

專案風格 = 「Dark stylized Japanese JRPG anime, 2D side-view battlefield」。細節如下：

- 主風格：**日式和風妖怪／夜戰**，色調偏暗、飽和度低、以青藍與暗紫黑為主色，暖色（燈籠橘、暮色赤）作為次要點綴。
- 質感：**手繪塗刷風 cel-shading**；粗而乾淨的外輪廓，內部保留少量陰影過渡，禁止 PBR、寫實質感、過度發光、噪點濾鏡。
- 角色比例：**SD／chibi 側視**（頭 1.2–1.5 倍身寬），身體 5–5.5 頭身；戰鬥 sprite 只做「面向戰場中央」的一個側面方向，能安全水平翻轉。
- 空間感：**橫向寬幅 side-view battlefield**；玩家在畫面左半（x<640），敵方在右半（x>640）；地面有明確 y 軸錯層。
- 禁止：真人風臉、8 方向 sprite、3/4 視角、迪士尼／美式卡通、光暈 bloom 過強、烘焙投影、烘焙 FX、烘焙 UI／HUD／殺生線。
- 檔案輸出：**透明背景 PNG（RGBA、非黑底、非棋盤格烘焙）**；除背景圖外一律不含地面與陰影。

## 命名規則（強制）

所有檔案採 kebab-case，並依用途分目錄。命名格式：

```
<category>-<slug>-<variant>.<ext>
```

- category：`bg`（背景）／`ui`（介面）／`slash`（斬擊 FX）／`node`（旅程節點）／`char`（角色）／`monster`（怪物）
- slug：內容代號（英文，用連字號連接）
- variant：`master` / `runtime-v1` / `candidate-v1` 等

範例：

- `bg-yokai-railway-rooftop-runtime-v1.png`
- `ui-planning-panel-runtime-v1.png`
- `slash-quick-swift-cyan-runtime-v1.png`
- `node-battle-torii-runtime-v1.png`

放置目錄：

- 候選：`assets/candidates/<category>/<slug>/<filename>.png`
- Runtime（Phaser 直接載）：`public/assets/<category>/<slug>/<filename>.png`
- 旅程 UI：`public/assets/journey/world01/<slug>.png`
- FX 精靈表：`public/assets/battle/<slug>/<filename>.png` 並附 `.frames.json` 標註 frameWidth／frameHeight／frameCount。

---

## 一、旅程場景（妖異鐵道）缺失素材

目前旅程畫面（`JourneyScene.ts`）只有基本 SVG 幾何圖，需要正式美術。**目標檢視畫面 1600×900**（也接受 1920×1080）；每張為單一 PNG，不需拼接。

### 1-1 旅程主背景（雨暮山線）

**檔名**：`public/assets/journey/world01/bg-yokai-railway-runtime-v1.png`  
**尺寸**：1920×1080，橫向 16:9  
**用途**：整個旅程介面的底圖，取代目前純黑背景。

**提詞（英文 + 中文注記）**：

> Dark stylized Japanese yokai JRPG world map background, 1920×1080 landscape, painterly cel-shaded matte painting. A supernatural night-time mountain ridgeline in heavy monsoon rain, distant misty peaks silhouetted against a bruised indigo-black sky, faint amber lantern glow scattered in the middle distance, hint of a phantom torii gate on a far ridge, low fog rolling over the valley floor. Muted palette: deep indigo (#0e1622), cold slate (#2a3948), phantom violet (#3a2b46), warm amber accents (#c8892d), never fully saturated. Composition: heavy black-void top half for the causal-track HUD to sit on top; lower third is subtly lit ridgeline; middle 45–50% must stay low-noise for node graph readability. No characters, no monsters, no UI, no text, no train, no rails, no cast shadows, no glow bloom, no photographic sky. Painterly brushwork with visible strokes, restrained rim light, watercolor mist edges. Deliver as a single opaque PNG on jet-black background — do NOT split into separate sky/mountain/ground layers.

**必要輸出檢查**：

- 中央高度 45%（y=270–810）視覺噪點低於外圍。
- 頂端 200px 幾乎純黑或極深藍，可承載節點文字。
- 底部有一條可辨識的山脊剪影，不含具體物件（人物、房子、火車）。

### 1-2 旅程節點徽章（六類，各一張）

節點類型：`出發 / 迎擊 / 精英 / 王 / 補給 / 事件`（後兩類為預留，本區僅出發／迎擊／精英／王必生）。

**共同規則**：

- 尺寸：256×256，正方形，**透明背景 PNG**。
- 內容：一顆圓形徽章，中心為象徵圖案，外環有和風細飾。
- 徽章直徑約 200px，留白邊 28px。
- 禁止在圖上加中文文字（文字由 UI 層繪製）。
- 主色皆為專案定義色，禁止外加色彩。

**檔名／提詞（依類型分開單張生成）**：

`public/assets/journey/world01/node-start-runtime-v1.png`

> Dark stylized Japanese yokai JRPG map node icon, 256×256 transparent PNG, single centered circular emblem 200px diameter, cel-shaded painterly. Symbol: a small stone lantern lit with a warm amber flame, seen from the side, sitting on a step of moss-stained stone. Outer ring: braided rope (shimenawa) with two paper streamers (shide), painted in aged white and cold slate; hairline sumi-e brush border. Palette: warm amber #c8892d flame, cold slate #4c6272 stone, aged paper white for streamers. Emblem sits alone on transparent background — no shadow, no text, no glow bloom. Painterly cel-shading, thick outline, no photorealism. Single self-contained PNG; do NOT include shadow plate.

`public/assets/journey/world01/node-battle-runtime-v1.png`

> Same style spec (256×256 transparent PNG, 200px emblem, painterly cel-shaded Japanese yokai). Symbol: a pair of crossed short tantō blades over a torn hemp talisman (ofuda) with a broken red seal running down the middle. Outer ring: thin rusted iron chain with three chain-links visible, deep indigo tint. Palette: tempered steel highlight #d3d9dc, seal red #b13c46, chain slate #2f3c46. No text, no shadow, no bloom, transparent background. Single-piece PNG.

`public/assets/journey/world01/node-elite-runtime-v1.png`

> Same style spec. Symbol: a stylized side-view samurai helmet (kabuto) with a broken forehead ornament and rain drops streaking down its metal plates; low warm amber glow inside the visor slot only, never spilling outside the silhouette. Outer ring: three interlocked mon (family-crest circles), dark bronze. Palette: soaked black-indigo #14232b armor, weathered bronze #8a6528, cold ember #b3591c inside visor. No text, no drop shadow, transparent background. Single-piece PNG.

`public/assets/journey/world01/node-boss-runtime-v1.png`

> Same style spec. Symbol: a fanged oni mask (hannya-like but restrained; single horn, half-cracked) with rain-drenched hair strands framing it. Outer ring: heavy jagged obsidian shards forming a broken circle, phantom violet mist bleeding between shards. Palette: bruised violet #3a2b46, blood-black #24101a, bone white #d7cdb5 fangs, faint cold cyan #4ea0b0 eye pinpricks. No text, no bloom, transparent background. Single-piece PNG.

`public/assets/journey/world01/node-rest-runtime-v1.png` *(reserved, generate if scope permits)*

> Same style spec. Symbol: a lit paper lantern hanging from a rope, warm amber-orange light behind translucent paper marked with a single sumi-e brush stroke. Outer ring: braided rope loop with two small paper prayer strips. Palette: paper amber #d59548, rope hemp #7a604c. No text, no bloom.

`public/assets/journey/world01/node-event-runtime-v1.png` *(reserved)*

> Same style spec. Symbol: a folded fan (sensu) half open, painted with a single stylized wave (nami) motif. Outer ring: swirling ink cloud with 3 kanji-like scratches (non-language, decorative only). Palette: ink black #14181d, brush white #ded4c3, tempered blue accent #2e5b6a. No text on the emblem itself.

### 1-3 節點連接線（因果軌道）

**檔名**：`public/assets/journey/world01/track-segment-runtime-v1.png`  
**尺寸**：480×48，透明 PNG，橫向可平鋪  
**用途**：連接節點之間的軌道段；SVG 幾何版目前存在但無風味。

**提詞**：

> Dark stylized Japanese yokai JRPG map connector segment, 480×48 transparent PNG, tileable horizontally. Content: a weathered iron rail track segment seen from a top-down 3/4 abstract angle, two parallel rails with irregular wooden sleepers (railroad ties) between them; the rails are stained with rust and one strand of phantom violet mist drifts along the length; the ends fade to full transparency over the last 40px on each side so the tiled repeat is seamless. Palette: rusted iron #5a4230, cold sleeper wood #362a22, phantom violet #3a2b46 mist, faint ember specks #b3591c. No characters, no text, no cast shadow, no white background. Single self-contained tile — do NOT deliver as separate strand + sleeper layers.

### 1-4 旅程列車圖章（玩家隊伍位置指示）

**檔名**：`public/assets/journey/world01/train-token-runtime-v1.png`  
**尺寸**：128×96，透明 PNG，稍微俯視  
**用途**：目前玩家隊伍所在節點的視覺指示。

**提詞**：

> Dark stylized Japanese yokai JRPG token, 128×96 transparent PNG, three-quarter top-down angled view of a small stylized black steam locomotive front car with one warm amber headlight; painterly cel-shaded, no photorealism. The train is bare-metal weathered black with faint rust accents; smokestack releases a small curl of phantom violet steam that fades to full transparency within 40px of the smokestack tip so nothing else in the image is opaque beyond the vehicle silhouette. Two tiny lantern-shaped side lamps glow warm amber. Palette: charcoal iron #1c1a1d, rust bronze #6b3f22, amber lamp #d38b34, phantom violet #3a2b46. No ground, no rail, no text, no drop shadow. Single-piece PNG, transparent everywhere except the train silhouette and its short steam wisp.

### 1-5 旅程標題裝飾框

**檔名**：`public/assets/journey/world01/title-plate-runtime-v1.png`  
**尺寸**：640×160，透明 PNG，橫向裝飾板  
**用途**：畫面左上「妖異鐵道」標題背景，取代目前只有純文字。

**提詞**：

> Dark stylized Japanese yokai JRPG UI plate, 640×160 transparent PNG, horizontal frame. A weathered wooden sign plank hanging from two frayed hemp ropes at the top corners; the plank surface is dark stained wood with subtle vertical grain; the perimeter has hairline sumi-e brush border and two small pressed metal studs at bottom-left and bottom-right corners. Central 500×90 region is intentionally left blank / uniformly dark for text overlay by UI code. Palette: aged wood #3a2b1e, hemp rope #7a604c, dark stud #1b1a1a. No text at all — text will be rendered by UI code on top. Transparent background outside the plank and rope. No drop shadow, no bloom.

### 1-6 旅程底部裝飾（雲霧）

**檔名**：`public/assets/journey/world01/mist-band-runtime-v1.png`  
**尺寸**：1920×240，透明 PNG，橫向可平鋪  
**用途**：畫面底部貫穿的雲霧帶，覆蓋節點下方（目前為 SVG 漸層）。

**提詞**：

> Dark stylized Japanese yokai JRPG atmosphere band, 1920×240 transparent PNG, tileable horizontally. Content: three overlapping horizontal bands of low fog / mist drifting rightward; top edge is soft translucent phantom violet #3a2b46 alpha 0.5, middle band is cold slate #2a3948 alpha 0.35, bottom edge fades to full opacity black #050810 alpha 0.7. Painterly airbrush look, no hard shapes, no characters, no text, no ground detail. Left and right 60px must fade to matching alpha so tiled repeat is seamless. Single-piece PNG.

---

## 二、戰鬥畫面 HUD／UX 重規劃

### 2-1 現況問題

- 敵方角色頭部（尤其母版 PNG 高怪如辻傘、雨夜武者）逼近或壓到上方時序條區（timeline 位於 y≈38，高度約 40px）。
- 敵方「意圖預覽」紅色標籤（`紫刀斬` 等）出現在 sprite 中段，遇到高 sprite 時被身體遮住。
- 中央「有利 6:5」預覽資訊出現在角色之間，易與其他 UI 疊。

### 2-2 UI 分層規範（強制）

畫面分成三個 depth 層：

1. **戰場層** depth 0–120：背景、角色 sprite、殺生線、FX。
2. **HUD 層** depth 150–199：時序條、意圖預覽、規劃／棄牌／跳過按鈕、卡牌、狀態文字。
3. **鏡頭效應層** depth 200–210：hit-stop 白閃、崩勢 vignette、勝敗遮罩。

**新規則**：

- 時序條後方常駐一條 y=0–72 的半透明黑帶（`rgba(4,8,16,0.72)`），寬度 100%；不隨鏡頭 zoom 移動。**已實作於 2026-08-18 batch 4**。
- 戰場層 sprite 高度上限：普通怪 100px、精英 +14px（＝114px）、BOSS 由專屬 spec 決定。**已實作**。
- 敵方 sprite 待機位置 y 保持 320 中線；formation.y 已控制上下錯層在 ±138 內，配合高度上限，sprite 頂端不會低於 y=110（時序條下緣 y=72 + 38 緩衝）。

### 2-3 意圖預覽（enemy intent label）新規範

**現況**：紅色標籤貼在 sprite 側邊，被大 sprite 蓋住。

**新設計**：

- 標籤主體移到 **時序條下方的專屬 HUD 條**（y=88–108），對齊該敵人的 timeline circle 正下方，用細線垂直連到 sprite 頭頂上方，形成「時序 → 意圖」的直覺路徑。
- 卡名字體 14px、威力 12px；背景為半透明深紅（`rgba(70,20,30,0.85)`），左端有 4px 寬的殺意紅色垂直條 `#ff4658`。
- 標籤與 sprite 之間的連接線：紅色殺意 hair-thin (`#ff8299`, α 0.6)，穿過角色頭頂 8px 但不塞進 sprite 內部。

### 2-4 交鋒預覽 tag（`有利 6:5`）新位置

**現況**：中央顯示，落在角色間。

**新設計**：

- 移到選中的敵人的 timeline circle 右下方（絕對 y=54），或如果空間不足，落在敵人 sprite 頭頂上方 y=`enemy.y - sprite.height/2 - 24`。
- 樣式：菱形背景 `rgba(30,60,80,0.9)`，14px 白字，寬度自動。有利用青綠色框 `#83e9c0`；劣勢用桃紅框 `#ff7185`。

### 2-5 規劃階段當前角色標記

**現況**：藍色描邊圓圈畫在角色腳下。

**新設計保留**現況樣式，但額外**在時序條的當前角色 circle 加 1.4× scale + 淡金色 pulsing outline**，讓時序條上就能一眼看到「輪到誰」。

### 2-6 這段對應的 code 改動（供工程師參考，不必等到美術）

- `BootScene.renderTimeline`：**已加**時序條背景黑帶。
- `BootScene.renderEnemyIntents`：改為在時序條下方（y=94 起）繪製一列，每個 timeline circle 下方一段標籤 + 垂直連線到 sprite。
- `BootScene.drawMonsterRuleRead`（`有利 6:5` 類判讀）：改為固定貼齊時序條下方的敵人 circle 正下方 y=54，而非 sprite 邊。

---

## 三、斬擊 FX 各卡型專屬素材（取代 classic-slash-sheet.png）

現況 `slash-cc0` 是一份 CC0 通用斬擊，六幀 126×150，每張卡都用同一組，感受單一。

### 3-0 每張 FX sheet 共同規則

- **格式**：spritesheet PNG，橫向排列 6 幀，frameWidth × frameHeight 依卡型指定。
- **透明背景**（RGBA），全域無黑底、無棋盤格烘焙。
- **6 幀動畫時序**（左→右）：（1）預備光暈 8%（2）刀鋒進入 25%（3）刀鋒中段 45%（4）峰值全展 70%（5）收尾殘影 40%（6）散逸 15%——只描述亮度，不改朝向。
- **基準方向**：base 朝向為**由右向左揮擊**（crescent 凹面朝左）；runtime 由攻擊者座標決定 flipX。
- **禁止**：任何角色、武器實體、地面、UI、文字、投影、外框、簽名浮水印。
- 附一份 `<sheet>.frames.json`：`{ "frameWidth": N, "frameHeight": N, "frameCount": 6, "baseDirection": "right-to-left" }`。

### 3-1 快斬（quick）｜輕巧疾斬

**檔名**：`public/assets/battle/slash-quick/slash-quick-sheet.png`  
**尺寸**：spritesheet 756×110（6 幀 × 126×110）  
**風格關鍵詞**：cyan-white, thin, fast, layered afterimage

**提詞**：

> Anime-style painterly slash FX spritesheet, 756×110 transparent PNG, six frames arranged left to right each 126×110. Content: a fast light-blue single-stroke horizontal slash trail; frame progression from a tiny cyan hairline scratch, to two thin layered crescents overlapping (main + faint afterimage 6px offset), peaking as two razor-thin arcs of pale cyan #a8f4ff and cold cyan #4ec8ff, then dissipating into short broken tick marks. Base direction: right-to-left (concave side of the crescent faces left). No blade metal, no weapon body, no character, no ground, no UI text, no watermark. Transparent background everywhere else. Painterly stroke, not pixel art, not vector clip-art. Single spritesheet PNG, six frames on one row — do NOT deliver as six separate files.

### 3-2 重斬（heavy）｜壓下的沉重刀光

**檔名**：`public/assets/battle/slash-heavy/slash-heavy-sheet.png`  
**尺寸**：spritesheet 1080×180（6 幀 × 180×180）  
**風格關鍵詞**：amber-gold, wide arc, ground shockwave hint

**提詞**：

> Anime-style painterly slash FX spritesheet, 1080×180 transparent PNG, six frames arranged left to right each 180×180. Content: a heavy downward diagonal slash trail; frame progression from a dim amber ember, to a thick warm-gold crescent (#d38b34 core, #f4c66a highlight) with faint heat-shimmer edge, peaking as a wide arc plus a very faint low ground-level dust ripple at the bottom 20% of the frame (still transparent above and beside — the ripple is only implied by 4 short horizontal streaks), then collapsing into scattered ember specks. Base direction: right-to-left, the crescent falls from top-right to bottom-left. No blade, no weapon body, no character, no explicit ground line, no UI. Transparent everywhere except the FX itself. Painterly, thick outline, cel-shaded. Single spritesheet PNG, six frames on one row.

### 3-3 破甲（break）｜碎裂尖銳斬

**檔名**：`public/assets/battle/slash-break/slash-break-sheet.png`  
**尺寸**：spritesheet 1080×180（6 幀 × 180×180）  
**風格關鍵詞**：cross-cut shatter, warm bronze, armor-piercing shards

**提詞**：

> Anime-style painterly slash FX spritesheet, 1080×180 transparent PNG, six frames arranged left to right each 180×180. Content: a sharp cross-cut slash trail that pierces armor; frame progression from two tiny bronze scratch marks intersecting like an X, to two thick pointed crescents crossing at 90°, peaking with a bronze-and-warm-white burst (#c88b3b core, #ffe5b0 highlight) surrounded by six radiating chip shards (angular thin triangles) each 40–60px long, then dissolving into short glinting sparks. Base direction: right-to-left for the primary stroke; the secondary stroke crosses it at 90°. No blade metal body, no armor plate, no character, no ground, no UI, no text. Transparent background. Painterly, thick outline. Single spritesheet PNG, six frames on one row.

### 3-4 堅守（guard）｜青光護盾迴響

**檔名**：`public/assets/battle/guard-shield/guard-shield-sheet.png`  
**尺寸**：spritesheet 720×180（6 幀 × 120×180）  
**風格關鍵詞**：pale cyan aegis, vertical, no cutting arc

**提詞**：

> Anime-style painterly defensive FX spritesheet, 720×180 transparent PNG, six frames arranged left to right each 120×180. Content: a vertical oval aegis shell forming and dispersing; frame progression from a thin pale-cyan hairline vertical arc, to a full translucent oval shell (#c6f4ff at 35% alpha inner, #7dd9ff at 90% alpha outer stroke), peaking with a small brighter ripple concentric within, then softly dispersing into 4 upward-drifting light motes. Base orientation: vertical, symmetric — no left/right base direction; flipX is a no-op for this sheet. No blade, no cutting arc, no character, no ground, no UI text. Transparent everywhere else. Painterly cel-shaded, thick outline, no bloom. Single spritesheet PNG, six frames on one row.

### 3-5 掩護（cover）｜截刀阻線

**檔名**：`public/assets/battle/slash-cover/slash-cover-sheet.png`  
**尺寸**：spritesheet 900×180（6 幀 × 150×180）  
**風格關鍵詞**：intercept blue, crossing sabre, defense-tinted

**提詞**：

> Anime-style painterly interception FX spritesheet, 900×180 transparent PNG, six frames arranged left to right each 150×180. Content: an intercepting cross-cut where a defensive blue slash meets an implied hostile trajectory; frame progression from a thin diagonal blue line rising from bottom-left, to a broad cool-blue crescent (#8eeeff core, #2f9ecf highlight) crossing an imagined intent line at 45°, peaking with a small triangular parry sparkle where the crescent apex sits, then collapsing back into a downward light streak. Base direction: crescent sweeps upward-right blocking a right-to-left threat, so base flipX=false means the defender is on the left; flipX=true when defender is on the right. No blade metal, no character, no red hostile line (that gets drawn by runtime), no ground, no UI text. Transparent background. Painterly, thick outline. Single spritesheet PNG, six frames on one row.

### 3-6 接力（relay）｜雙刀交接刃光

**檔名**：`public/assets/battle/slash-relay/slash-relay-sheet.png`  
**尺寸**：spritesheet 1080×180（6 幀 × 180×180）  
**風格關鍵詞**：amber handoff, twin sequential arcs, warmth

**提詞**：

> Anime-style painterly relay FX spritesheet, 1080×180 transparent PNG, six frames arranged left to right each 180×180. Content: a two-blade handoff trail; frame progression starts with a first warm-amber crescent (#d38b34 core, #f4c66a highlight) mid-arc, then a small bright glow at the crescent midpoint marking the handoff instant, then a second crescent same palette but offset by 30px and rotated 15° emerging from the first's tail, peaking as both crescents overlap in a warm ribbon, then trailing off into two thin parallel amber streaks. Base direction: both crescents sweep right-to-left. No blade metal body, no character, no ground, no UI text, no shadow. Transparent background. Painterly, thick outline. Single spritesheet PNG, six frames on one row.

### 3-7 整備（cycle）｜整流循環（非攻擊 FX）

**檔名**：`public/assets/battle/cycle-ring/cycle-ring-sheet.png`  
**尺寸**：spritesheet 720×180（6 幀 × 120×180）  
**風格關鍵詞**：mint-green loop, breath-restore, not a slash

**提詞**：

> Anime-style painterly recovery FX spritesheet, 720×180 transparent PNG, six frames arranged left to right each 120×180. Content: a circular breathing-restoration ring; frame progression from a thin mint-green hairline ring, to a full glowing double concentric ring (#8fe6c0 core, #b9ffe3 highlight), with 4 small ascending light motes rising from ring interior, peaking as the ring expands slightly with 6 rising motes, then contracting and dispersing into fine sparkles. Base orientation: symmetric circle, flipX no-op. No blade, no cutting arc, no character, no ground, no UI text. Transparent background. Painterly, thick outline, no bloom. Single spritesheet PNG, six frames on one row.

### 3-8 牽制（delay）｜冷氣拖尾干擾

**檔名**：`public/assets/battle/slash-delay/slash-delay-sheet.png`  
**尺寸**：spritesheet 900×180（6 幀 × 150×180）  
**風格關鍵詞**：icy blue, thin drag trail, tempo interference

**提詞**：

> Anime-style painterly interference FX spritesheet, 900×180 transparent PNG, six frames arranged left to right each 150×180. Content: a thin cold-blue trailing streak that seems to pull time backward; frame progression from a small icy-blue mote, to a thin curved drag ribbon (#9cecff core, #6fb8d5 highlight) with a faint 4-tick backward motion blur behind it (four short parallel light streaks trailing to the right of the main streak), peaking with a small hooked barb at the streak tip pointing backward, then dissipating into three tiny frost specks. Base direction: streak sweeps right-to-left; the backward motion-blur ticks trail rightward. No blade metal, no character, no ground, no UI text, no red intent line. Transparent background. Painterly, thick outline. Single spritesheet PNG, six frames on one row.

---

## 四、生成流程／驗收流程

1. 使用者將本文件貼入 AI 圖像生成工具（Midjourney／SDXL／DALL·E 3／Flux）。
2. 對每一節（1-1、1-2 各節、3-1..3-8）**單張獨立生成**，不接受「先生一堆再拼貼」。
3. 生成完畢後：
   - 檔案先存 `assets/candidates/<category>/<slug>/<filename>-candidate-v1.png`。
   - 執行 `tools/validate_art_asset.py` 檢查 alpha、bbox、透明邊界、中央密度。
   - 通過後複製為 `public/assets/.../*-runtime-v1.png`，並更新 `BootScene.preload` 或 `JourneyScene.preload` 的路徑。
4. 實機驗收（1280×720 + 844×390）需截圖並比對本文件的**必要輸出檢查**條目。
5. Art Director（使用者）決定 approved／rejected；失敗要保存原圖到 `references/rejected/` 並記錄具體原因。

## 五、什麼情況要重寫本文件

- 專案風格總結有實質變更（例：整體改成 pixel art）。
- 新增卡型或新怪物 archetype，需要對應新 FX／新 emblem。
- 使用者對某個提詞連續 3 次生成都不滿意，該提詞需重擬並記錄 rejected 版本。

## 六、與現有規格文件的關係

- 美術總規：`docs/art-bible.md` — 本文件不牴觸該規範，屬於實作提詞層。
- 站位／FX 方向：`docs/CURRENT_COMBAT_SPEC.md` 站位與方向章 — 本文件的 base direction 遵守此規範。
- Pipeline：`ASSET_GENERATION_PIPELINE.md` — 本文件為該 pipeline 的具體提詞產出。
