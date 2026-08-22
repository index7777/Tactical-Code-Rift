# Phase 9c — Feature Flag Bootstrap

STATUS = AUTHORITATIVE_FOR_PHASE_9C
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 9c 讓新版戰鬥可以透過明確 query flag 啟動，但在沒有 flag 時完全維持 legacy `BootScene` 為預設入口。

啟動條件只有：

```text
?combat-refactor=1
```

## 啟動規則

- 沒有 flag：`BootScene` 仍是第一個啟動 Scene。
- 有 `combat-refactor=1`：`RefactorBattleScene` 成為第一個啟動 Scene。
- 新版 Scene 必須在 create 前取得真正的 `RefactorBattleRuntime`。
- Runtime 由 application bootstrap 建立並注入 Phaser registry：

```text
refactor-battle-runtime
```

- `RefactorBattleScene` 不得自行建 mock controller / mock battle state。
- legacy `BootScene` 不得被修改成新版戰鬥容器。

## QA bootstrap state

Phase 9c 使用一份 deterministic QA encounter，只為了讓新 runtime 可以被真正啟動與操作；它不是正式 20 張牌池，也不是 production encounter balance。

QA encounter 必須：

- 同時建立 `rin / chikage / oboro / mo` 四名我方單位。
- 至少一名敵人與公開 Intent。
- 使用單一 mixed Timeline。
- 建立 5 張 shared hand 的 deterministic deck。
- 牌組至少覆蓋 quick / heavy / guard / disruption / break 五種類型。
- 不使用 AP / Mana。
- 不讀 `RoundPlanner`、`PlayerCommand`、legacy `BattleCards` 或 `applyPlannedInitiative()`。

## Bootstrap ownership

新增 application factory：

```text
src/application/battle/createRefactorBattleBootstrap.ts
```

它負責：

```text
BattleResolutionState
+ RefactorDeckState
→ BattleTurnController
→ RefactorBattleRuntime
```

`main.ts` 只負責：

1. 讀 query flag。
2. 決定 Scene 啟動順序。
3. 在 Phaser `preBoot` 階段把 runtime 放入 registry。

`main.ts` 不包含卡牌規則、Intent 規則或 Timeline 計算。

## 驗收

至少測：

1. bootstrap 產生四名我方與至少一名敵人。
2. shared hand 初始為 5 張。
3. Timeline 第一節點可由 controller 正常開始。
4. QA deck 同時含 quick / heavy / guard / disruption / break。
5. bootstrap 建立兩次結果 deterministic。
6. source state 不依賴 Phaser。
7. 無 flag 時 Scene 順序仍以 `BootScene` 開頭。
8. 有 `?combat-refactor=1` 時 Scene 順序以 `RefactorBattleScene` 開頭，且 registry 已有 runtime。

## 非目標

本批不做：

- 切換 production 預設入口。
- 移除 legacy combat。
- 正式 20 張牌池。
- enemy AI Intent selection。
- production encounter 數值平衡。
- 新角色／敵人素材與動畫。
