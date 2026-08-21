# Phase 5b — Controller Preview Wiring

STATUS = AUTHORITATIVE_FOR_PHASE_5B
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 5b 把 `BattleTurnController` 的 `TARGET_PREVIEW` 狀態接到 Phase 5 的 `BattlePreviewResolver`。此批仍不得引入 Phaser，也不得讓 presentation 自行重算 combat 規則。

## 原則

- Controller 只協調 domain snapshot 與 preview resolver，不複製 resolver 規則。
- Preview source state 與 Preview result 都以 clone snapshot 對外提供，避免 UI 或呼叫端直接 mutate domain state。
- 選擇新卡、取消選牌／目標、開始執行、完成結算時，都必須清除 stale preview。
- 需要目標的卡牌在沒有成功建立 preview result 前不可 confirm。
- `confirmPlayerCard()` 仍只提交牌與 Delay；Phase 5b 不把 preview prediction 當作真正 combat mutation。
- 真正 HP、Intent、韌性、BreakWindow mutation 留給後續 resolution layer。

## Controller 新增資料

新增 `BattlePreviewContextState`：

- `vitalsByActorId`
- `intentByEnemyId`
- `resilienceByEnemyId`
- `breakWindows`

Controller constructor 可接第三個 preview context snapshot。Phase 5b 新 flow 需要該 context 才能建立完整 Target Preview；舊測試／過渡呼叫若沒有 context，仍可保留基本 turn-state 行為，但不得取得假的 preview result。

## API

### `previewPlayerTarget(targetId)`

流程：

1. 必須已選擇手牌中的 card。
2. 依現有 `BattleTurnState.previewTarget()` 切到 `TARGET_PREVIEW`。
3. 從 controller preview context 取 target vitals / enemy Intent / resilience / break windows。
4. 呼叫 `resolveBattlePreview()`。
5. 保存 immutable preview result。
6. 回傳 turn state。

### `preview()`

- 回傳目前 `BattlePreviewResult | undefined` 的深 clone。
- Presentation 只能讀此 API，不直接存取 resolver source objects。

### `setPreviewContext(context)`

- application runtime 可在真正 resolution 後更新最新 HP / Intent / resilience / windows snapshot。
- 更新 context 時清除舊 preview，避免使用過期結果。

## stale preview 清除規則

以下操作必須清除 preview：

- `startNextActor()`
- `selectPlayerCard()`
- `cancelPlayerStep()`
- `confirmPlayerCard()`
- `dispatch()`
- `beginResolution()`
- `completeResolution()`
- `setPreviewContext()`

## 驗收

至少測：

1. 選 `牽制` 指向敵人時，controller preview result 與 resolver 一致，包含 `actualDelay` 與 predicted Timeline。
2. lethal preview 可由 controller 對外讀到 `intentChange = deleted`。
3. presentation 修改 `preview()` 回傳物件，不會污染 controller 內部 preview。
4. 換卡會清掉舊 preview。
5. 取消 target 會清掉舊 preview。
6. 需要 target 的牌在沒有 successful preview result 時不可 confirm。
7. confirm 後 preview 清除，但真正 Timeline / HP 不因 preview 自動 mutation。
8. `setPreviewContext()` 更新資料後，下一次 preview 使用新 snapshot。

## 非目標

本批不做：

- Phaser presenter / BootScene wiring。
- 真正 damage / HP mutation。
- 真正 Intent / resilience / BreakWindow commit mutation。
- guard / redirect。
- 四角色專精。
- AOE / multi-target。
