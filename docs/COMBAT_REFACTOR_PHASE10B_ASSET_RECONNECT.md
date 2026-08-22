# Phase 10b — 新戰鬥資產重新接入契約

STATUS = IMPLEMENTED_PENDING_CI
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

## 已實作

### 1. 新版獨立 preload

`RefactorBattleScene.preload()` 透過 `RefactorBattleAssets.ts` 載入：

- 四名隊友 pose / portrait（沿用 `queuePlayerAssets()`）
- World 01 rooftop candidate 背景
- QA 敵人 yokai 顯示圖
- 基礎 slash FX

不呼叫也不依賴 `BootScene.preload()`。

### 2. 角色本體

- `rin` / `chikage` / `oboro` / `mo` 以 manifest 的 `idle-a` texture 顯示。
- HOME 位置仍由 `PLAYER_HOME_POSITIONS` 決定。
- 生命值、targetable ring 與玩家輸入仍由新版 Scene / Runtime 控制。
- texture 不存在時保留 ring fallback，避免單一資產失效讓 Scene 無法操作。

### 3. Timeline portrait

單一 Timeline 的玩家節點優先顯示 manifest timeline portrait；角色名與 `nextActionAt` 保留。

`ghost-fire` 以 QA enemy texture 顯示；其他未知 enemy 仍可 fallback 文字。

### 4. 戰場背景

新版 battlefield 區域使用既有 World 01 rooftop runtime candidate；party rail、Intent panel 與 hand 仍由新版 layout 疊在上層。

### 5. QA enemy

`ghost-fire` 仍是 Phase 9c deterministic QA enemy 的 internal id。現有 `kamaitachi.png` 只作 QA visual，不宣稱是 `ghost-fire` 的正式 identity master。

## 測試

新增 `RefactorBattleAssets.test.ts`：

- 四角色 manifest mapping
- pose key / timeline portrait key
- `ghost-fire` QA visual mapping
- 未知 enemy 不假造 texture key

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
