# Phase 10c — 戰場／上方行動規劃畫面正規化契約

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

依 GitHub Pages 實機畫面，同步整理新版戰鬥的戰場與上方行動序列／目標預覽區。此批不改 combat domain 規則；只處理 presentation、asset mapping、layout 與可讀性。

使用者回饋指出目前 QA enemy 使用到舊 prototype 怪物資產；本批必須改用目前 rainfall-ridgeline runtime monster 資產，並同步調整上方行動序列畫面，不只修 battlefield 本體。

## 本批要做

### 1. Enemy runtime asset 修正

- `ghost-fire` 僅保留為 deterministic QA internal id。
- 顯示資產改用 `public/assets/battle/generated/monsters/rainfall-ridgeline/` 下目前 runtime monster PNG。
- 禁止再使用 `assets/battle/kamaitachi.png` 作新版主要敵人視覺。
- 玩家可見名稱對應到目前 QA 所使用的正式 monster visual 名稱，避免畫面名稱仍顯示「鬼火」但實際是另一隻怪物。

### 2. 上方行動序列／規劃區

- 保留單一敵我 Timeline，不回復舊雙列 timeline 或整輪 planning。
- 目前左側「行動序列 + phase」改為更緊湊的目前行動狀態區。
- Timeline portrait 與名稱／時間點整合成清楚的節點卡，不再像 debug row。
- active actor 必須有明確 highlight。
- target preview 不直接浮在背景圖片上，改用半透明資訊板。
- 上方區域只顯示玩家當下需要讀的資訊，不加入舊 next-round / killing-intent planning 控制。

### 3. Battlefield 正規化

- 四名隊友站位改成有縱深的戰鬥隊形，避免垂直名單感。
- 角色顯示高度提升並保持四人持續可見。
- 左側空白大面積 party panel 縮為 slim status rail，避免佔用主要戰場。
- enemy 尺寸／位置重新正規化，不再呈現巨型 UI icon 感。
- Intent panel 縮小，保留技能名、目標、傷害、Delay 等必要資訊。

### 4. 不做

- 不改 Timeline domain、牌庫、Intent resolver、specialization 規則。
- 不新增舊 RoundPlanner / PlayerCommand / next-round interaction。
- 不在本批做完整 attack / hit / down sequencing。
- 不把 runtime-trial/candidate 素材標成 approved。

## 驗收

- `npm run test`
- `npm run build`
- 不再 preload `kamaitachi.png` 作 refactor enemy。
- 上方單 Timeline 可辨識 active actor、portrait、名稱與 nextActionAt。
- Preview 有獨立資訊板，不與背景混讀。
- 1280×720 四名隊友與敵人皆可清楚辨識。
- 844×390 不遮住 Timeline、Intent、shared hand。
- `?legacy-combat=1` rollback 不受影響。

## 後續

完成本批後，依新版真實畫面再拆：actor pivot/scale 微調、ACTION/REACTION 位移、attack/hit/down sequencing、FX 對點、正式 enemy encounter assembly。
