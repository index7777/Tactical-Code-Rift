# Phase 9d — Feature-Flag QA Interaction Completion

STATUS = AUTHORITATIVE_FOR_PHASE_9D
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

補齊 `?combat-refactor=1` 平行新版戰鬥在實際互動時最先遇到的流程缺口。預設入口仍維持 legacy `BootScene`，本批不做 production cutover。

## 已識別互動缺口

1. enemy 成為 Timeline front 後，runtime 尚無正式 enemy resolution wrapper，流程會停在 `ENEMY_EXECUTING`。
2. Scene 目前只讓 enemy actor 可點，`any-ally` / ally Guard 無法指定友軍。
3. Scene 目前只暴露「調度 0 張」，但 domain 契約是 0～2 張。

## Enemy action ownership

`RefactorBattleRuntime` 接受可注入的 `RefactorEnemyIntentProvider`。provider 由 composition root / QA bootstrap 提供；Scene 只能呼叫 runtime 的 enemy action method，不自行建立 Intent 或決定 damage / Delay。

流程：`WAITING_FOR_NEXT_ACTOR -> ENEMY_EXECUTING -> RESOLVING -> WAITING_FOR_NEXT_ACTOR`。

## Target routing

`RefactorBattleView` 新增 `targetableActorIds`，只依 selected card target rule、active actor 與 living Timeline actor 建立互動候選，不計算任何戰鬥數值。

- `enemy`：living enemy actors。
- `ally` / `any-ally`：living player actors。
- `self` / `none`：不要求額外 target click。

Scene 只替 `targetableActorIds` 掛 target click handler。

## Dispatch

Scene 可保存純 UI ephemeral `dispatchSelection`，最多 2 張。0 / 1 / 2 張都一次交給 `runtime.dispatch()`；這份 selection 不進 Controller 或 authoritative battle state。

## 驗收

- enemy front 可透過 injected provider 完整 resolve。
- 沒 provider 時 runtime 拒絕 enemy resolution。
- enemy card 只暴露 enemy target。
- any-ally Guard 暴露 living player target。
- self / none 不產生額外 target。
- dispatch 0 / 1 / 2 張可提交，3 張仍由 domain 拒絕。
- feature flag 仍是唯一新版 bootstrap 入口；無 flag 保持 legacy 預設。

## 非目標

不做 production default cutover、production AI、browser automation framework、正式素材動畫、正式 20 張牌池、legacy removal。
