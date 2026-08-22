# Phase 9 — 新 Presentation 基礎契約

STATUS = AUTHORITATIVE_FOR_PHASE_9
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 9 開始建立全新的戰鬥 Presentation 路徑，但不把新玩法塞回既有 `BootScene`，也不沿用舊雙 Timeline、整輪規劃、殺生線主導 HUD。

本批只建立 presentation foundation 與平行 `RefactorBattleScene` 骨架；不在本批切換 live runtime。

## 路徑

新增：

- `src/presentation/battle/refactor/TimelinePresenter.ts`
- `src/presentation/battle/refactor/HandPresenter.ts`
- `src/presentation/battle/refactor/TargetPreviewPresenter.ts`
- `src/presentation/battle/refactor/BattleActorPresenter.ts`
- `src/presentation/battle/refactor/EnemyIntentPresenter.ts`
- `src/presentation/battle/refactor/RefactorPresentation.test.ts`
- `src/presentation/scenes/RefactorBattleScene.ts`

`RefactorBattleScene` 可以註冊到 Phaser scene list，但不得成為預設啟動 scene；真正切換由後續 feature flag 批次處理。

## Presentation source of truth

Presenter 只能讀既有 domain/application snapshot：

- Timeline：`BattleTimelineState`
- Shared hand：`RefactorDeckState`
- Target preview：`BattlePreviewResult`
- Intent：`IntentState`
- Party HP：authoritative battle vitals

Presenter 不得重算：

- 傷害
- Delay / 韌性
- Break Window
- 角色專精
- Guard 減傷
- Intent 變更

## 1280×720 layout contract

第一版固定依 1280×720 基準座標構圖：

- 上方單一 Timeline：`y = 0..104`
- 中央 Battlefield：`y = 112..500`，高度 388，超過畫面高度 50%
- 左側 Party rail：Battlefield 內的窄欄
- 右側 Enemy Intent panel：Battlefield 內的窄欄
- 中央 Action Zone：Battlefield 中段
- 底部 Shared Hand：`y = 508..720`

四名我方角色 `rin / chikage / oboro / mo` 都必須有固定 Home Position；位置只服務演出，不帶數值。

## Timeline Presenter

- 只顯示單一敵我混合 Timeline。
- 預設最多 8 個未來節點。
- 嚴格使用 domain 排序結果，不建立第二套 initiative 排序。
- enemy node 可附目前公開 Intent 的簡短資訊。
- 不產生第二條敵方／我方 Timeline。

## Hand Presenter

- 只呈現共享手牌。
- 預期正常 runtime 為 5 張。
- 顯示卡名、category、Delay、target rule 與 selected state。
- 不顯示 AP / Mana / energy cost。

## Target Preview Presenter

只把 `BattlePreviewResult` 轉成 view model，包含：

- final damage
- HP before / after
- lethal
- actual delay
- crossed player windows
- actor next action time
- Intent change
- specialization bonus

不自行推導任何數字。

## Actor Presenter

第一版固定四名我方 Home Position，並提供中央 Action Position；Reaction Position 只保留座標契約，動畫後續再接。

## Enemy Intent Presenter

Intent 與 persistent status 分開；第一版只呈現目前公開 Intent：名稱、目標、直接傷害、Delay 與可延後／打斷／守勢／轉移能力。

## Scene skeleton

`RefactorBattleScene` 本批只驗證新版資訊架構的空殼：

- 單 Timeline 區
- Battlefield 區
- 四名 ally slot
- Action Zone
- Enemy Intent panel
- Shared Hand 區
- `調度` slot

不得 import legacy `RoundPlanner` / `PlayerCommand` / `applyPlannedInitiative`，也不得複製舊 BootScene HUD logic。

## Phase 9 foundation 驗收

1. `npm run build` 通過。
2. `npm test` 通過。
3. Timeline presenter 只輸出一組混合節點，最多 8 個。
4. Hand presenter 不含 AP/Mana 欄位。
5. Target preview presenter 的數值與輸入 `BattlePreviewResult` 一致。
6. 四名我方角色都有 Home Position。
7. Battlefield 高度至少 360px。
8. `RefactorBattleScene` 可編譯且不會取代預設 BootScene。

## 非目標

本批不做：

- feature flag runtime switch。
- 真正 Controller interaction wiring。
- 正式角色／敵人素材組裝。
- 動畫。
- redirect / counter / persistent status UI。
- legacy combat removal。
