# Phase 7 — Enemy Action Resolver 契約

STATUS = AUTHORITATIVE_FOR_PHASE_7
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 7 移除 `BattleTurnController.completeResolution(enemyDelay)` 的臨時橋接，讓敵人也透過真正的 authoritative battle state 完成一次行動。

本批仍不實作 AI 決策樹。下一個 Intent 由 application / encounter script 以明確輸入提供；Enemy Action Resolver 負責驗證、執行目前已公開 Intent、清理本次行動後狀態、公開下一 Intent，並依下一 Intent 的 Delay 重新排入單一 Timeline。

## 核心流程

敵人輪到行動時：

1. 驗證該敵人是 Timeline front。
2. 讀取 `intentByEnemyId[enemyId]` 作為目前已公開 Intent。
3. 執行目前 Intent。
4. 若為正常 Intent，依 `targetIds` 對存活目標提交直接傷害。
5. 檢查目標死亡；死亡單位立即從 Timeline 移除。
6. 若目前 Intent 是正常且成功完成：
   - 清除該敵人的 temporary resilience。
   - 讓以該敵人為 target 的未消耗 Break Window 到期。
7. 若目前 Intent 是 `hard-stagger`：
   - 本次不造成傷害。
   - 視為被替換的失敗行動，不觸發「成功行動後」的 resilience reset / Break Window expiry。
8. 若敵人仍存活，驗證並公開 application 提供的下一 Intent。
9. 依下一 Intent 的 `delay` 將敵人重新排入 Timeline。
10. `timeline.currentTime` 推進到本次敵人實際行動時間。

## 下一 Intent 輸入

Phase 7 resolver 接受 `nextIntent`，但不自己決定 AI。

理由：

- encounter script / AI 決策是另一個 domain concern。
- resolver 必須保持 deterministic、可測試。
- UI 只需要在敵人本次行動完成後得到新的公開 Intent。

驗證：

- `nextIntent.enemyId` 必須等於目前敵人。
- `nextIntent.kind` 必須是 `normal`。`hard-stagger` 只能由 Interrupt 產生，不能被 AI 當成主動技能選擇。
- `nextIntent.delay` 直接成為下一次 enemy scheduling 的 Delay source of truth。

## 傷害

Phase 7 v1 只處理 Intent 的直接 `damage`：

- `damage` 未提供時視為 0。
- 每個 `targetIds` 都受到相同直接傷害。
- HP 不低於 0。
- HP 到 0 的角色立即從 Timeline 移除。

本批不處理 guard / redirect / secondary status application；這些在後續專門 resolver 中加入。

## hard-stagger

`hard-stagger` 表示原 Intent 已被打斷並替換。

v1 規則：

- 敵人仍消耗這次 action opportunity。
- 不造成傷害。
- 不視為「成功行動」。
- 不清 temporary resilience。
- 不讓 Break Window 因成功行動自然到期。
- action opportunity 完成後仍公開新的正常 Intent，並依新 Intent Delay 排回 Timeline。

這維持既有「Break Window 在目標下一次成功行動後失效」契約。

## Resilience

正常 Intent 成功完成後：

```text
{ base, temporary } -> { base, 0 }
```

使用既有 `resetTemporaryResilience()`；不重新建立另一套韌性公式。

## Break Window expiry

正常 Intent 成功完成後使用：

`expireWindowsAfterSuccessfulAction(windows, enemyId)`

只移除 target 為該敵人的窗口；其他敵人的窗口不受影響。

## Timeline

- actedAt = enemy 當前 `nextActionAt`。
- `timeline.currentTime = actedAt`。
- 若敵人存活：下一次 `nextActionAt = actedAt + nextIntent.delay`，仍受 Timeline domain 最小 Delay 規則約束。
- 若敵人在自己的 action 中因未來 counter/recoil 等機制死亡，將不排回 Timeline；本批尚無此類 trigger，但 resolver API 不應阻止後續擴充。
- 其他單位只因死亡被移除，不做額外重新排程。

## Controller wiring

`BattleTurnController.completeResolution()`：

- 玩家：維持 Phase 6b 路徑。
- 調度：維持 Delay 3 schedule-only。
- 敵人：不再接受 raw `enemyDelay`；改接受下一個 `IntentState`，並呼叫 `resolveEnemyAction()`。

敵人下一次 Delay 因此來自新的公開 Intent，而不是 UI / Scene 任意傳入數字。

## Phase 7 驗收案例

至少測：

1. 正常單體 Intent 對目標造成正確傷害。
2. HP 不低於 0；死亡角色從 Timeline 移除。
3. 正常敵人行動後 temporary resilience reset 至 0，base 保留。
4. 正常敵人行動後該敵人的 Break Window 到期，其他敵人窗口保留。
5. hard-stagger 不造成傷害。
6. hard-stagger 不 reset temporary resilience。
7. hard-stagger 不 expire Break Window。
8. 下一 Intent 在本次行動後立刻成為 `intentByEnemyId[enemyId]`。
9. 下一 Intent 的 Delay 決定 enemy 新 `nextActionAt`。
10. next Intent enemyId 不一致時拒絕。
11. AI 不得提交 `hard-stagger` 作為 next Intent。
12. source BattleResolutionState immutable。
13. Controller enemy resolution 不再接受 raw Delay。

## 非目標

本批不做：

- AI Intent selection algorithm。
- guard / redirect。
- burn / poison 等持續狀態實際結算。
- counter / recoil triggers。
- 角色專精。
- Phaser / HUD。
- 完整 AOE animation / target presentation。
