# Phase 6b — Controller / Authoritative Resolution Wiring

STATUS = AUTHORITATIVE_FOR_PHASE_6B
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 6b 將 `BattleTurnController` 從過渡期的「自己持有 Timeline + 外部 Preview Context + 玩家只排 Delay」改成真正持有 `BattleResolutionState`，並在玩家行動完成時透過 `resolveBattleAction()` 提交戰鬥狀態。

此批仍不接 Phaser / BootScene。

## 核心決策

`BattleResolutionState` 成為新戰鬥 runtime 的 authoritative battle snapshot：

- `timeline`
- `vitalsByActorId`
- `intentByEnemyId`
- `resilienceByEnemyId`
- `breakWindows`
- `nextBreakWindowSequence`

Controller 不再另外持有一份 `previewContextState`。Preview 直接從 authoritative resolution state 取 snapshot。

## 玩家流程

### 選牌

- `selectPlayerCard(instanceId)` 仍只允許共享手牌內 instance。
- 換牌時清掉 stale preview。

### Preview

`previewPlayerTarget(targetId)`：

1. 驗證目前有選牌。
2. 從 `BattleResolutionState` 讀 target HP / Intent / resilience / break windows / Timeline。
3. 呼叫 `resolveBattlePreview()`。
4. 保存 immutable preview result 供 presentation 讀取。
5. 不修改 authoritative state。

### Confirm

`confirmPlayerCard()`：

- 需要目標的卡必須已有成功 preview。
- 卡牌此時從共享手牌提交／棄置／補牌。
- Controller 保存一份 committed card snapshot 與 committed target id。
- 此時仍不把傷害或控制寫進 authoritative battle state。
- 進入 `EXECUTING` 後不可取消。

### Resolution

`completeResolution()` 在玩家 action 時：

1. 必須存在 committed card。
2. 以 authoritative `BattleResolutionState` + committed card + committed target id 呼叫 `resolveBattleAction()`。
3. 用 resolver 回傳 state 完整替換 Controller 內 authoritative battle state。
4. 清除 committed action / preview。
5. 進入 `WAITING_FOR_NEXT_ACTOR`。

因此正式 runtime 路徑為：

```text
Shared Hand card
→ Preview (pure)
→ Confirm (card commit)
→ Execute animation boundary
→ Resolution (resolveBattleAction)
→ authoritative HP / Intent / resilience / break windows / Timeline
→ next actor
```

## Preview / Execute Parity

Phase 6b 不允許 Controller 在 Execute 時自行重算：

- damage
- armor-break bonus
- ignored resilience
- actual delay
- lethal
- intent replacement

這些全部由 Phase 6 `resolveBattleAction()` 透過相同 `resolveBattlePreview()` 路徑取得。

## 調度

調度沒有 combat target effect，因此不呼叫 `resolveBattleAction()`。

- 交換 0～2 張。
- Delay 3。
- 完成時只對 authoritative `BattleResolutionState.timeline` 做 `scheduleAfterAction()`。
- 其他 HP / Intent / resilience / break windows 不變。

這是 Phase 6b 唯一保留的 player-side schedule-only 路徑。

## Enemy 過渡路徑

Phase 6b 尚未建立 Enemy Action Resolver / AI Intent sequence，所以敵方暫時保留：

- `ENEMY_EXECUTING`
- `completeResolution(enemyDelay)` 顯式提供 action delay。
- 只更新 authoritative resolution state's Timeline。

但 Timeline 不再有第二份 Controller-local copy。

後續 Phase 7 會替換成真正 enemy successful-action resolver：

- resolve Intent
- reset temporary resilience
- expire break windows
- choose / reveal next Intent
- schedule enemy next action

## 對外 Snapshot

Controller 提供 defensive clone：

- `battle()`：完整 `BattleResolutionState`
- `timeline()`：從 `battle().timeline` 投影
- `preview()`：`BattlePreviewResult`
- `deck()`：共享牌組 snapshot

Presentation 不得取得 mutable internal reference。

## 移除的過渡 API / 狀態

Phase 6b 移除：

- Controller-local `timelineState`
- `BattlePreviewContextState`
- `previewContextState`
- `setPreviewContext()`
- 玩家 `pendingActionDelay`

玩家 action 的 Delay 不再由 controller 自己傳給 `scheduleAfterAction()`；它包含在 committed card 中，由 `resolveBattleAction()` 提交。

調度與敵方過渡路徑可各自保存必要的 pending delay / kind，但不得恢復成通用玩家 Delay source。

## 驗收條件

至少驗證：

1. Phase 6 CI 已通過後才開始本批。
2. Preview 直接讀 authoritative battle state，不需 `setPreviewContext()`。
3. Confirm 後 card 從共享手牌消耗，但 HP / enemy Timeline 尚未提前 mutation。
4. `completeResolution()` 後普通傷害真正降低 target HP。
5. Delay card 真正移動 enemy Timeline 並累積 temporary resilience。
6. lethal card 真正移除 enemy Timeline / Intent / target break windows。
7. Break card 真正建立 deterministic break window。
8. heavy + armor-break 真正消耗 window 並套用 Preview 相同增傷。
9. Controller `battle()` / `preview()` 回傳 defensive clone。
10. 調度仍是 Delay 3 完整 action，且不改 HP / Intent。
11. Enemy 過渡 resolution 更新同一份 authoritative Timeline。
12. 不修改 Phaser / BootScene。

## 非目標

本批不做：

- Enemy Intent AI sequence。
- Enemy damage resolver。
- 成功敵方行動後 temporary resilience reset。
- break-window 成功行動 expiry wiring。
- 千景 guard / redirect。
- 四角色專精。
- AOE / multi-target。
- 新 HUD。
