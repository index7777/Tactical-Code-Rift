# Phase 10c — 戰場／上方行動規劃畫面正規化契約

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

依 GitHub Pages 實機畫面，同步整理新版戰鬥的戰場與上方行動序列／目標預覽區。此批不改 combat domain 規則；只處理 presentation、asset mapping、layout 與可讀性。

使用者回饋指出目前 QA enemy 使用到舊 prototype 怪物資產；本批必須改用目前 rainfall-ridgeline runtime monster 資產，並同步調整上方行動序列畫面，不只修 battlefield 本體。

另確認目前上下 HUD 框架只是過渡結構，後續會移除，不應拿它們當成 BG 或角色站位的永久裁切邊界。因此本批的世界構圖以完整 1280×720 場景為基準，HUD 視為 overlay；角色大小與站位可使用更大的視覺空間。

## 本批要做

### 1. Enemy runtime asset 修正

- `ghost-fire` 僅保留為 deterministic QA internal id。
- 顯示資產改用 `public/assets/battle/generated/monsters/rainfall-ridgeline/` 下目前 runtime monster PNG。
- QA 對應先使用 `lantern-child-master-runtime-v1.png`，玩家可見名稱使用「提燈童子」。
- 禁止再使用 `assets/battle/kamaitachi.png` 作新版主要敵人視覺。

### 2. 新 BG 與完整場景畫布

- 不再使用歷史 rooftop composite。
- Phase 10c QA 改用目前 Area 01 F1 `area01-rail-halt-bg-runtime-trial-v1.png`。
- BG 以完整 1280×720 畫布鋪設，不裁成 `y=112..500` 的舊 battlefield panel。
- 上下 Timeline / hand 目前只是 overlay；未來框架移除後 BG 不需要重新設計或重新裁切。
- 背景仍是 runtime-trial，不標成 approved。

### 3. 場景透視與角色站位

- 角色站位不再綁死在左側垂直名單。
- 四名隊友使用前後錯位的舞台隊形；同一隊仍保持視覺等價，不建立 gameplay 前後排。
- 顯示大小需跟畫面 y 位置有輕微透視縮放：較高／較後方的角色略小，較低／較前方的角色略大。
- 透視縮放只屬 presentation，不影響 target、距離或戰鬥規則。
- 玩家側與敵方側都應有足夠空間向中央 ACTION / REACTION 位移。
- 不以目前 hand panel 的上緣作角色腳底硬限制；但過渡版仍需保持基本可操作性。

### 4. 上方行動序列／規劃區

- 保留單一敵我 Timeline，不回復舊雙列 timeline 或整輪 planning。
- 目前左側「行動序列 + phase」改為更緊湊的目前行動狀態區。
- Timeline portrait 與名稱／時間點整合成清楚的節點卡，不再像 debug row。
- active actor 必須有明確 highlight。
- target preview 不直接浮在 BG 高對比區，改用半透明資訊板。
- 上方區域只顯示玩家當下需要讀的資訊，不加入舊 next-round / killing-intent planning 控制。

### 5. Battlefield 正規化

- 左側空白大面積 party panel 縮為 slim status rail 或 overlay，不再決定角色站位。
- enemy 尺寸／位置重新正規化，不再呈現巨型 UI icon 感。
- Intent panel 縮小並視為 overlay，只保留技能名、目標、傷害、Delay 等必要資訊。
- 角色／怪物的視覺比例優先對齊背景的地面線與場景透視，而不是對齊 UI 框。

### 6. 不做

- 不改 Timeline domain、牌庫、Intent resolver、specialization 規則。
- 不新增舊 RoundPlanner / PlayerCommand / next-round interaction。
- 不在本批做完整 attack / hit / down sequencing。
- 不把 runtime-trial/candidate 素材標成 approved。

## 驗收

- `npm run test`
- `npm run build`
- 不再 preload `kamaitachi.png` 或 rooftop composite 作 refactor battle 主資產。
- 使用 `area01-rail-halt-bg-runtime-trial-v1.png` 作完整畫布 BG。
- 上方單 Timeline 可辨識 active actor、portrait、名稱與 nextActionAt。
- Preview 有獨立資訊板，不與背景混讀。
- 四名隊友以帶輕微透視縮放的舞台隊形呈現，且四人持續可見。
- 新怪物 visual 與玩家可見名稱一致。
- 1280×720 / 844×390 仍可操作。
- `?legacy-combat=1` rollback 不受影響。

## 後續

完成本批後，依新版真實畫面再拆：actor pivot/scale 微調、ACTION/REACTION 位移、attack/hit/down sequencing、FX 對點、正式 enemy encounter assembly，以及移除過渡上下 HUD 框架。
