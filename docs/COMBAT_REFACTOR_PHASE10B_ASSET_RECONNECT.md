# Phase 10b — 新戰鬥資產重新接入契約

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把既有 runtime 資產重新接到 `RefactorBattleScene`，先讓新版戰鬥使用實際角色、Timeline portrait、戰場背景與 QA 敵人圖像，再從真實畫面找比例、pivot、遮擋、資產品質與演出問題。

本批不是把 `BootScene` 的舊戰鬥 UI／規則搬回新版，也不讓新版依賴 `BootScene.preload()`。

## 權威來源

- 角色 runtime 對照：`src/presentation/assets/player-assets.json`
- Phaser preload helper：`src/presentation/assets/PlayerAssetManifest.ts`
- 資產規範：`docs/art-bible.md`
- 新版站位：`BattleActorPresenter`
- 新版資料流：`BattleTurnController -> RefactorBattleRuntime -> presenters -> RefactorBattleScene`

## 本批要做

### 1. 新版獨立 preload

`RefactorBattleScene.preload()` 只透過新版 asset helper 載入：

- 四名隊友 pose / portrait（沿用 `queuePlayerAssets()`）
- World 01 rooftop candidate 背景
- QA 敵人顯示圖
- 目前可重用的基礎 slash FX

禁止呼叫或依賴 `BootScene.preload()`。

### 2. 角色本體

- `rin` / `chikage` / `oboro` / `mo` 以 manifest 的角色 pose key 顯示。
- HOME 位置仍由 `PLAYER_HOME_POSITIONS` 決定。
- 生命值、targetable ring 與玩家輸入仍由新版 Scene / Runtime 控制。
- 若個別 texture 不存在，保留安全 fallback，不讓整場 Scene 因單一資產缺失而無法操作。

### 3. Timeline portrait

單一 Timeline 節點優先顯示角色 timeline portrait；文字名稱與 `nextActionAt` 繼續保留。

Enemy 若沒有對應 portrait，使用 QA enemy texture / fallback，不回復舊雙 Timeline renderer。

### 4. 戰場背景

新版 battlefield 區域使用既有 World 01 rooftop runtime candidate 作為背景，裁切／縮放在新版 battlefield 區域內，不覆蓋 Timeline 與 shared hand。

### 5. QA enemy

`ghost-fire` 仍是 Phase 9c deterministic QA enemy 的 internal id。本批只為它提供現有 yokai runtime visual 作 QA 顯示，不宣稱該圖是 `ghost-fire` 的正式 identity master。

## 明確不做

- 不搬回 RoundPlanner、雙 Timeline、殺生線、next-round interaction。
- 不搬回舊 Fighter HUD / Card HUD。
- 不在 presentation 重新計算戰鬥數值。
- 不在本批宣稱 prototype / candidate 素材為 approved。
- 不做正式角色／怪物美術核准。
- 不在本批完成 attack / hit / down 的完整 sequencing；先把真實資產接回，再依 runtime 問題拆下一批演出修正。

## 驗收

自動驗證：

- `npm run test`
- `npm run build`
- asset key / actor mapping 測試通過。
- 新 helper 不 import legacy combat domain。

Browser QA：

- 1280×720：四名隊友皆顯示實際資產，Timeline 可讀，背景不蓋 HUD。
- 844×390：四名隊友、Intent、Timeline、shared hand 仍可辨識。
- `?legacy-combat=1` rollback 不受新版 asset reconnect 影響。
- 無 404、黑框、透明失敗或明顯 pivot 漂移。

## 後續

本批通過後，依實際畫面問題再決定下一批：

- actor scale / pivot normalization
- ACTION / REACTION 位移
- attack / hit / down animation sequencing
- FX 對點
- enemy 正式 visual assembly
