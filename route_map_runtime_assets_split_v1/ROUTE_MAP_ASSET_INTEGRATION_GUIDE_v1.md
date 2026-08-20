# Route Map / Battle Scene Asset Integration Guide v1

> 給 AI / 開發者使用的素材規劃、用途與拼接契約。

## 核心契約
- BG 可以是完整場景；所有動態前景、Node Frame、Node Icon、Node FX、Connection primitives 必須分層。
- 程式負責位置、狀態、幾何、文字與動畫；PNG 只負責視覺。
- 禁止把 Frame + Icon + FX + Text 焙成單張 production PNG。
- Route connection geometry 必須由程式根據 node coordinates 產生。

## 標準拼接
**Route Node（後→前）：** FX → Frame → Icon → 程式文字。

**Battle（後→前）：** BG → 遠景 atmosphere → units → contact shadow / puddle → ground weather → foreground props → HUD。

## Assets

### Battle Foreground

| 檔名 | 用途 | 拼接 | 限制 |
|---|---|---|---|
| fg-wet-ground-shadow.png | 角色/敵人腳下的濕地接觸陰影 | 角色腳底下方；Multiply/Normal，低 alpha；依角色寬度縮放 | 不可當背景；每個單位可各放一份 |
| fg-wet-ground-shadow-wide.png | 大型敵人或多人區域的寬版濕地陰影 | 大型妖怪腳下或 Boss 區域 | 避免與 puddle 強反光同時過亮 |
| fg-rain-splash-small.png | 小型落雨濺水 | 角色腳邊、空地隨機生成；可做短生命週期粒子 | 不要固定烘在角色 sprite |
| fg-rain-splash-medium.png | 較強落雨濺水 | 攻擊落地、重型敵人移動、環境雨效 | 可隨機 flip/scale |
| fg-ground-mist-low.png | 貼地霧塊 | 戰場地面前後景；緩慢水平漂移 | 置於角色腳部附近但避免遮臉 |
| fg-fog-strip.png | 長條薄霧 | 戰場中遠景分層；低 alpha 緩慢捲動 | 與 ground mist 分開控制 |
| fg-puddle-reflection-soft.png | 低強度積水反光 | 角色附近地面或背景燈光下 | Normal/Add，alpha 很低 |
| fg-puddle-reflection-strong.png | 暖燈強反光 | 燈籠、站台燈等暖光下方 | 只在有對應光源的場景使用 |
| fg-stone-debris-a.png | 小型石塊前景 | 山道、神社、破損場地 | 可作前景遮擋物 |
| fg-stone-debris-b.png | 大型石塊前景 | Elite/Boss 或山路場景 | 避免阻擋戰鬥可讀性 |
| fg-rail-debris.png | 破木/鐵道殘骸 | 鐵道、站台戰場前景 | 場景限定，不應全圖通用 |
| fg-lantern-foreground.png | 和風石燈籠前景 | 神社/山道邊緣，作視差前景 | 不要放在角色主要站位 |

### Node Frame

| 檔名 | 用途 | 拼接 | 限制 |
|---|---|---|---|
| node-frame-normal.png | 一般未選節點框 | Frame 層；中心再疊 Icon | 不含文字 |
| node-frame-current.png | 目前選取節點框 | Frame 層；可再疊 current halo | 金色焦點只表示 current/selected |
| node-frame-cleared.png | 已完成節點框 | Frame 層；可疊 cleared ring | 完成後降低整體亮度 |
| node-frame-locked.png | 鎖定節點框 | Frame 層；不可點擊 | 鎖定視覺已較強，不再疊 danger aura |
| node-frame-elite.png | Elite 節點框 | Frame + elite icon + elite aura | 暗紅危險語言 |
| node-frame-boss.png | Boss 節點框 | Frame + boss icon + boss aura | Boss 尺寸可比 normal 放大約 10–20% |

### Node Icon

| 檔名 | 用途 | 拼接 | 限制 |
|---|---|---|---|
| icon-start.png | 出發/列車節點符號 | 置中疊在 node frame | 圖示不承擔 frame 狀態 |
| icon-battle.png | 普通戰鬥符號 | normal/current/cleared frame 共用 | 狀態由 frame/FX 決定 |
| icon-elite.png | Elite 妖面符號 | elite frame 中央 | 不可單獨代表紅色狀態 |
| icon-boss.png | Boss 妖面符號 | boss frame 中央 | Boss label 仍由程式文字顯示 |
| icon-event.png | 事件/御札符號 | event 類節點 | 事件種類可由程式 metadata 決定 |
| icon-rest.png | 休息/燈籠符號 | rest 類節點 | 不烘入『休息』文字 |
| icon-reward.png | 獎勵/錢袋符號 | reward/shop 類節點 | 若商店另有需求可後續獨立 shop icon |

### Node FX

| 檔名 | 用途 | 拼接 | 限制 |
|---|---|---|---|
| fx-current-halo.png | 目前節點金色 halo | Frame 後方；緩慢 pulse/rotate | 不應烘入 current frame |
| fx-available-pulse.png | 可選節點冷色 pulse | Frame 後方；低頻 alpha pulse | available 狀態使用 |
| fx-cleared-ring.png | 完成狀態淡色 ring | Frame 後方或上方 | 可降低 saturation |
| fx-elite-aura.png | Elite 紅黑妖氣 | Elite frame 後方，慢速旋轉/呼吸 | 不要套普通戰鬥節點 |
| fx-boss-aura.png | Boss 強妖氣環 | Boss frame 後方；尺度略大 | Boss 專用 |

### Connection Primitives

| 檔名 | 用途 | 拼接 | 限制 |
|---|---|---|---|
| conn-texture.png | 路線基礎紋理 | 程式先畫幾何線，再沿線套/拉伸 texture | 不要用 PNG 決定路徑形狀 |
| conn-glow.png | 選中路線暖金 glow | 疊在 selected path 上 | 只亮當前/可確認路徑 |
| conn-dot-normal.png | 一般連接點 | branch/joint 位置 | 小尺寸，避免搶 node |
| conn-dot-current.png | 目前路徑連接點 | selected joint | 與 selected path 同步 |
| conn-dot-danger.png | 危險路徑連接點 | Elite/Boss branch | 暗紅 |
| conn-particles-light.png | 普通/可選路線微粒 | 沿 available/selected path 少量移動 | 低密度 |
| conn-particles-danger.png | 危險路線微粒 | Elite/Boss 路徑 | 低密度暗紅 |

## Node 狀態矩陣

| 狀態 | Frame | Icon | FX |
|---|---|---|---|
| Normal battle | node-frame-normal | icon-battle | — |
| Available battle | node-frame-normal | icon-battle | fx-available-pulse |
| Current battle | node-frame-current | icon-battle | fx-current-halo |
| Cleared battle | node-frame-cleared | icon-battle | fx-cleared-ring |
| Locked | node-frame-locked | 依節點類型 | — |
| Elite | node-frame-elite | icon-elite | fx-elite-aura |
| Boss | node-frame-boss | icon-boss | fx-boss-aura |
| Start | node-frame-normal/current | icon-start | 依 current 狀態 |
| Event | node-frame-normal/current | icon-event | 依 current/available 狀態 |
| Rest | node-frame-normal/current | icon-rest | 依 current/available 狀態 |
| Reward | node-frame-normal/current | icon-reward | 依 current/available 狀態 |

## Hard Rules
- 不得把節點 Frame、Icon、FX、文字重新合併成單一 production PNG。
- 不得把角色或敵人烘進 Battle BG。
- 不得把 UI 文案、節點名稱、序號或數值烘進素材。
- 不得用固定 PNG 決定 Route connection 的幾何。
- 透明素材必須保留真正 RGBA alpha；禁止黑底假透明或棋盤格。
- 新素材命名沿用 kebab-case，並依 battle-foreground / node-frame / node-icon / node-fx / connection-primitives 分類。
- reference/ 只供 QA 與視覺追溯，runtime 不得直接載入母版。
- 若新增狀態，優先用既有 Frame + Icon + FX 組合；只有視覺語意真的不同才新增 PNG。

## 建議 runtime tree
```text
public/assets/route/production/
  battle-foreground/
  node-frame/
  node-icon/
  node-fx/
  connection-primitives/
```

若 repo 已有固定 asset root，沿用既有 root，只採用上述分類契約。

## 驗收 Gate
- Production PNG 單檔用途單一且可獨立使用。
- Overlay / Frame / Icon / FX 必須是真 RGBA alpha。
- 六種主要節點狀態可由分層組合完成。
- Route 座標改變不需要重畫 connection PNG。
- Battle foreground 不遮擋角色、武器、HUD、血條與 targeting line。
- Build 不依賴 ZIP/materializer；正式素材實體存在 repo。