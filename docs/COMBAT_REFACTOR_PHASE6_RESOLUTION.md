# Phase 6 — Battle Resolution / Commit 契約

STATUS = AUTHORITATIVE_FOR_PHASE_6
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 6 建立真正寫回戰鬥狀態的 `BattleResolutionResolver`。本批的核心要求不是新增另一套公式，而是讓 Preview 與 Execute 共用同一個規則來源：

- Preview 負責產生完整、不可變的預測結果。
- Resolution 必須先取得同一份 Preview 計算結果，再把該結果提交成新的 battle state。
- Resolution 不得自行重寫傷害、破勢加成、實際延後、韌性忽略、Intent 替換或 lethal 判定公式。

因此 HUD Preview 與真正 Execute 的數值必須一致。

## BattleResolutionState

Phase 6 使用一個純資料 battle snapshot：

- `timeline: BattleTimelineState`
- `vitalsByActorId: Record<string, PreviewActorVitals>`
- `intentByEnemyId: Record<string, IntentState | undefined>`
- `resilienceByEnemyId: Record<string, ControlResilienceState | undefined>`
- `breakWindows: BreakWindowState[]`
- `nextBreakWindowSequence: number`

不持有 Phaser object、sprite、scene 或 animation callback。

## Resolution 輸入

`resolveBattleAction()` 至少接受：

- `state`
- `activeActorId`
- `card`
- `targetId?`

Resolver 必須驗證 active actor 是目前 Timeline 最前單位；不能讓非當前 actor 直接 commit。

## 與 Preview 的共用規則

Resolution 必須呼叫 `resolveBattlePreview()` 取得：

- 最終傷害與 HP 預測。
- lethal。
- 實際延後。
- Intent moved / interrupted / deleted。
- 破勢窗口消耗與建立描述。
- active actor 的下一行動時間。
- 預測 Timeline。

若 Preview 計算需要產生 commit 才需要的後狀態（例如控制後的新韌性），Preview contract 可以增加純資料欄位，但不得因此產生 side effect。

## Commit 順序

一次玩家卡牌 Resolve 按下列順序提交：

1. 驗證 active actor 為 Timeline front。
2. 用目前 snapshot 呼叫 `resolveBattlePreview()`。
3. 套用 target HP。
4. 套用 Intent 結果：
   - `none / moved`：保留 Intent 內容。
   - `interrupted`：替換成 hard-stagger。
   - `deleted`：刪除該敵人 Intent。
5. 套用控制後韌性。
6. 移除被消耗的 Break Window。
7. 若卡牌建立 Break Window，產生 deterministic id 並加入；若 target 已死亡則不建立。
8. 若 target 死亡：從 Timeline 移除、刪除其 Intent、刪除其所有 Break Window。
9. active actor 依卡牌 Delay 排回 Timeline。
10. `timeline.currentTime` 推進到 active actor 本次實際行動時間。

## Break Window ID

Resolution 不使用隨機 id。

格式：

```text
bw:<sequence>:<kind>:<targetId>
```

每建立一個 window，`nextBreakWindowSequence += 1`。

這讓 replay / test / save state 保持 deterministic。

## 死亡

死亡定義：`hpAfter === 0` 且行動前 HP > 0。

死亡後：

- vitals 保留，HP 固定 0，供結果畫面／死亡演出讀取。
- Timeline 移除該 actor。
- enemy Intent 移除。
- 該 target 的 Break Window 全部移除。
- 不建立新的 Break Window。

Phase 6 不處理復活。

## 韌性

若本次卡牌有 Intent Delay：

- Resolution 使用 Preview / Intent resolver 已算出的 post-control resilience。
- actualDelay > 0 才會累積 temporary resilience，規則沿用 Phase 4。
- 不能由 Resolution 再算一次不同版本的 actualDelay。

成功敵人行動後的 temporary resilience reset 屬於 enemy-action completion wiring，會在後續 controller integration 補上。

## Interrupt

Interrupt 成功：

- Intent 替換為 `hard-stagger`。
- 不額外移動當前敵方節點。
- active actor 仍照自己卡牌 Delay 排回 Timeline。

## Timeline

Commit 後 Timeline 必須與 Preview 的排序結果一致，差別只有：

- commit state 的 `currentTime` 會正式推進到 active actor 本次行動時間。
- Preview 是暫存預測；Resolution 回傳的是新的 authoritative battle state。

## 不可變性

`resolveBattleAction()` 不得 mutate 輸入 state。

必須回傳新物件，包含：

- 新 Timeline。
- 新 vitals map。
- 新 Intent map。
- 新 resilience map。
- 新 Break Window array。

## Resolution Result

回傳至少包含：

- `state`
- `preview`
- `activeActorId`
- `targetId?`
- `damageDealt`
- `lethal`
- `createdBreakWindowId?`

Presentation／animation 可以讀 result，但不能反向修改 domain。

## Phase 6 驗收案例

至少測：

1. 普通傷害真正降低 HP，active actor 依 Delay 排回 Timeline。
2. Delay 真正移動敵人節點並更新 temporary resilience。
3. imbalance + disruption commit 後忽略韌性結果與 Preview 一致。
4. Interrupt 真正替換 Intent 為 hard-stagger。
5. armor-break + heavy 真正消耗 window 並套用 +50% base damage。
6. 建立破勢牌產生 deterministic Break Window id。
7. lethal 將 HP 設為 0、移除 Timeline actor / Intent / Break Window。
8. Preview 與 Resolution 的 damage / lethal / target Timeline 結果一致。
9. 非 Timeline front actor 不得 resolve。
10. source battle state 在 resolve 前後保持 immutable。

## 非目標

本批不做：

- Phaser/UI。
- BootScene wiring。
- 千景 guard / redirect。
- 四角色專精。
- AOE / multi-target。
- enemy AI Intent generation。
- enemy successful action 後的下一 Intent 選擇。
- legacy runtime 移除。
