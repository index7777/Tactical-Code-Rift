# Phase 9b — Controller / Presentation Wiring 契約

STATUS = AUTHORITATIVE_FOR_PHASE_9B
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 9b 把 Phase 9 的純 Presenter 正式接到 `BattleTurnController` snapshots 與互動方法，但仍不切換預設 runtime。

這一批的目標不是重做規則，而是建立唯一 presentation adapter：Scene 只能透過 adapter 讀 Controller 的 `turn()`、`battle()`、`deck()`、`preview()`，再交給既有 Presenter 產生 view model。

## Source of truth

- `BattleTurnController` 仍是 application flow owner。
- `BattleResolutionState` 仍是 authoritative battle snapshot。
- `RefactorDeckState` 仍是 Shared Hand source of truth。
- `BattlePreviewResult` 仍是 Target Preview source of truth。
- Phaser Scene 不得自行計算傷害、Delay、Timeline reorder、韌性、Break Window、Guard 或角色專精。

## RefactorBattleRuntime

新增 `src/presentation/battle/refactor/RefactorBattleRuntime.ts`，作為 Controller 與 Presenter 間唯一 adapter。

它必須：

1. 只持有既有 `BattleTurnController` reference，不複製一份 mutable combat state。
2. `view()` 每次即時讀 Controller defensive snapshots。
3. Timeline 透過 `buildTimelineNodes()`。
4. Hand 透過 `buildHandCards()`。
5. Preview 透過 `buildTargetPreview()`。
6. Enemy Intent 透過 `buildEnemyIntent()`。
7. 暴露 UI interaction methods：start actor、select card、preview target、cancel、confirm、resolve confirmed player action、dispatch。
8. 每次 interaction 後由 caller 重新呼叫 `view()`；adapter 不快取 stale presentation state。

## View model

`RefactorBattleView` 至少包含：

- `phase`
- `activeActorId`
- `timeline`
- `hand`
- `preview`
- `enemyIntents`
- `vitalsByActorId`
- `canConfirm`
- `canDispatch`

`canConfirm` 只能由目前 Turn State + resolved target preview 判斷；不可由 Scene 猜測。

## Scene wiring

`RefactorBattleScene` 從 Phaser registry 讀取 `refactor-battle-runtime`。

- 有 runtime：以 runtime view model 畫單 Timeline、共享手牌、Intent、HP 與 Target Preview，卡片/目標/確認/取消/調度事件只呼叫 runtime methods。
- 沒有 runtime：顯示明確的 dormant diagnostic，不建立 mock battle state。
- Scene 不負責建立 encounter data、牌組、敵人 AI 或下一 Intent。
- `BootScene` 仍是預設啟動場景；Phase 9b 不加入 feature flag switch。

## Interaction contract

玩家流程：

`PLAYER_IDLE -> select card -> CARD_SELECTED -> target -> TARGET_PREVIEW -> confirm -> EXECUTING -> resolve -> WAITING_FOR_NEXT_ACTOR`

- targetless/self card 的完整 UX 可在後續 interaction polish 補齊；本批先鎖 enemy-target runtime path。
- 調度從 `PLAYER_IDLE` 呼叫，0–2 張，完成後立即 resolve Delay 3。
- Enemy action 的 next Intent 仍由 encounter/application 提供，本批 Scene 不生成 AI Intent。

## 驗收

至少測：

1. runtime `view()` 的 Timeline / Hand / Intent / Preview 全部來自 Controller snapshots。
2. select card 後 hand view 的 `selected` 正確更新。
3. target preview 後 view 顯示 authoritative final damage / actual Delay，不另算。
4. confirm + resolve 後 HP / Timeline view 反映 Controller committed state。
5. cancel 清掉 preview。
6. dispatch 走 Controller 並以 Delay 3 重新排程。
7. view model 對外不暴露可修改 Controller authoritative state 的 reference。
8. `RefactorBattleScene` 無 runtime 時不偷偷建立 mock domain state。

## 非目標

本批不做：

- 切換預設 runtime。
- `?combat-refactor=1` feature flag。
- enemy AI Intent selection。
- production sprites / VFX / animation polish。
- legacy `BootScene` 移除。
- 新增第二套 combat rules。
