# Phase 5 — Preview Resolver 契約

STATUS = AUTHORITATIVE_FOR_PHASE_5
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 5 建立一個純計算、不可變的 Preview Resolver。Presentation 不得自行重算傷害、韌性、破勢或 Timeline 位移；HUD 只消費 resolver 回傳的預測結果。

## 輸入

Preview 只接受目前 battle snapshot 的必要資料：

- active actor id。
- selected `RefactorCardInstance`。
- target actor id / current HP / max HP。
- `BattleTimelineState`。
- 目標目前公開 `IntentState`（若為敵人）。
- 目標 `ControlResilienceState`。
- 目前 `BreakWindowState[]`。

Phase 5 不直接持有 Phaser object，也不寫回 controller/deck/timeline。

## 輸出

至少包含：

- `baseDamage`
- `breakBonusDamage`
- `finalDamage`
- `hpBefore / hpAfter`
- `lethal`
- `requestedDelay / actualDelay`
- `crossedPlayerActorIds`
- `crossedPlayerWindows`
- `actorNextActionAt`
- `targetTimelineFrom / targetTimelineTo`
- `intentBefore / intentAfter`
- `intentChange`: `none | moved | interrupted | deleted`
- `consumedBreakWindowIds`
- `createdBreakWindow`
- `ignoredResilience`

## 傷害與破勢

v1 先鎖定：

- 卡牌 `effect.damage` 為基礎傷害。
- `armor-break` 被 `heavy` 消耗時，額外傷害 = `floor(baseDamage * 0.5)`。
- `imbalance` 被 `disruption` 消耗時，不加傷害；本次干擾忽略 1 點韌性。
- Preview 只標記會被消耗的窗口，不直接修改 source snapshot。
- 卡牌若建立 `createBreakWindow`，Preview 回傳待建立窗口描述；真正 id 由 commit/resolution path 生成。

Phase 5 暫不加入凜／千景／朧／紅葉的角色專精數值；專精會在後續 resolver layer 接入，避免把角色規則硬編碼在 presentation contract。

## Delay Preview

若卡牌有 `effect.delayTarget`：

1. 若目標沒有 Intent，視為不可做 Intent control，`actualDelay = 0`。
2. 若 Intent `canDelay = false`，`actualDelay = 0`。
3. 否則使用 `resolveIntentDelay()` 計算韌性。
4. 若消耗 `imbalance`，`ignoredResilience = 1`。
5. 使用 `previewTimelineShift()` 預測目標事件位置與跨過的我方行動窗口。
6. Delay 不刪除或替換 Intent，`intentChange = moved` 僅表示事件位置變動。

## Interrupt Preview

若卡牌 `effect.interrupt = true`：

- 使用 `interruptIntent()`。
- 可打斷時：`intentBefore` 保留原 Intent、`intentAfter = hard-stagger`、`intentChange = interrupted`。
- 不可打斷時：Intent 不變，`intentChange = none`。
- Interrupt 不自動移動當前敵方節點。

## Lethal Preview

若 `hpAfter <= 0`：

- `lethal = true`。
- `intentChange = deleted` 優先於 `moved / interrupted`。
- 回傳 `predictedTimeline` 時移除該 target actor。
- Presentation 因此可以把該敵人的未來 Timeline / Intent 畫成刪除預覽。

Preview 不會真的移除 domain actor；只回傳預測 snapshot。

## Active Actor 自身下一位置

無論卡牌對目標造成什麼效果，都必須同時計算 active actor 使用該卡後的 `actorNextActionAt`：

```text
active actor current nextActionAt + card.definition.delay
```

這個值只用於 Preview。真正 commit 仍由 `BattleTurnController.completeResolution()` 與 Timeline domain 決定。

## Target Rule

Phase 5 resolver 會做最基本 target validation：

- `enemy`：target 必須是 enemy Timeline actor。
- `self`：target 必須等於 active actor。
- `ally` / `any-ally`：target 必須是 player actor。
- `none`：不得提供 target。

不在 Phase 5 處理掩護重定向、範圍攻擊或多目標 selection。

## 不可變性

Resolver 不得 mutate：

- card instance / definition。
- timeline state。
- intent state。
- resilience state。
- break windows。

單元測試必須驗證 source snapshot 在 preview 後不變。

## Phase 5 驗收案例

至少測：

1. 普通傷害：HP 正確下降，Timeline 目標不移動。
2. armor-break + heavy：+50% base damage 並標記窗口消耗。
3. imbalance + disruption：忽略 1 韌性並正確預覽實際延後。
4. Delay 跨過 1 名我方角色：回傳 1 個 action window。
5. 不可延後 Intent：actualDelay 0。
6. Interrupt：Intent 替換為 hard-stagger，Timeline 當前位置不變。
7. 不可 Interrupt：Intent 不變。
8. lethal：target 從 predicted Timeline 移除，Intent change = deleted。
9. active actor 自身 next action position 依 card Delay 計算。
10. preview 前後 source snapshot deep-equal。

## 非目標

本批不做：

- Phaser presenter。
- 真正 commit/resolution mutation。
- 角色專精。
- 千景 guard/redirect preview。
- 多目標／AOE。
- enemy AI Intent generation。
