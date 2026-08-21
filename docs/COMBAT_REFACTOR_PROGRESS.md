# 戰鬥重構進度

BRANCH = combat-refactor-v1
DATE = 2026-08-22

本文件只記錄 `COMBAT_REFACTOR_V1.md`、`COMBAT_REFACTOR_IMPLEMENTATION_PLAN.md` 與各 Phase contract 的實作進度，不取代規格。

## Phase 1 — Single Timeline Domain

狀態：`VERIFIED`

- 單一敵我 Timeline。
- `nextActionAt` 排序。
- deterministic tie-break。
- Delay / advance / 行動後重新排程。
- 死亡移除。
- crossed player action windows 計算。

CI：run 100 通過。

## Phase 2 — Unit-level Turn State Machine

狀態：`VERIFIED`

- `WAITING_FOR_NEXT_ACTOR`
- `PLAYER_IDLE`
- `CARD_SELECTED`
- `TARGET_PREVIEW`
- `EXECUTING`
- `ENEMY_EXECUTING`
- `RESOLVING`
- `BATTLE_ENDED`
- 只有 Timeline 最前角色可行動。
- 玩家確認後立即執行，不等待其他隊友預排。

CI：run 104 通過。

## Phase 3 / 3b — Shared Hand + Controller Wiring

狀態：`VERIFIED`

- 共用 5 張手牌。
- 出 1 補 1，未使用牌保留。
- deterministic reshuffle。
- 調度 0～2 張，Delay 3。
- 無 AP / Mana。
- Controller 只能提交手牌內 card instance。
- 卡牌自身 Delay 驅動玩家重新排程。

CI：run 114 曾因測試把下一 actor 寫死而失敗；修正為依 Timeline 絕對排序後，run 125 全數通過。

## Phase 4 — Intent / Control Resilience / Break Window

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE4_DOMAIN.md`

- Intent 與 persistent status 分離。
- Delay 保留 Intent；Interrupt 替換為 hard-stagger。
- 韌性 = base + temporary。
- 成功延後才增加 temporary resilience。
- 敵人成功行動後清 temporary。
- armor-break 只被 heavy 消耗。
- imbalance 只被 disruption 消耗。
- break window 在目標成功行動後失效。

CI：run 125 通過。

## Phase 5 — Immutable Preview Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5_PREVIEW.md`

- 普通傷害 / HP / lethal preview。
- armor-break + heavy：+50% base damage preview。
- imbalance + disruption：忽略 1 韌性 preview。
- Delay preview：actual delay、舊/新 Timeline 位置、crossed player windows。
- Interrupt preview：Intent → hard-stagger，不移動當前事件。
- lethal preview：從 predicted Timeline 刪除目標、Intent change = deleted。
- active actor 自身 future Timeline 位置。
- source snapshot deep immutability。
- Preview 回傳 `targetResilienceAfter`，供 commit 直接採用。

CI：run 130 曾因 `RefactorCardCategory` / `BreakWindowConsumer` 型別邊界失敗；加入明確 adapter 後，run 132 build / test 全數通過。

## Phase 5b — Controller Preview Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE5B_CONTROLLER_PREVIEW.md`

- Controller 目標選擇直接呼叫 `resolveBattlePreview()`。
- `preview()` 對外只回 defensive clone。
- stale preview 在換卡、取消、確認、調度與 resolution boundary 清除。
- targeted card 沒有成功 preview 不可 confirm。

CI：run 137 build / test 全數通過。

## Phase 6 — Battle Resolution / Commit

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE6_RESOLUTION.md`

- `BattleResolutionState` 集中 authoritative timeline / vitals / Intent / resilience / break windows snapshot。
- `resolveBattleAction()` 強制 active actor 必須是 Timeline front。
- Resolution 先呼叫 `resolveBattlePreview()`，再提交同一份 damage / lethal / Delay / Intent / Break Window 結果。
- HP、Delay、temporary resilience、Interrupt、破勢消耗／建立與 lethal cleanup 都已有真正 commit path。
- deterministic break-window id：`bw:<sequence>:<kind>:<targetId>`。
- resolver 對輸入 state 保持 immutable。
- 測試包含 Preview / Resolution parity。

CI：run 143 build / test 全數通過。

## Phase 6b — Controller / Authoritative Resolution Wiring

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE6B_CONTROLLER_RESOLUTION.md`

- Controller 直接持有 `BattleResolutionState`。
- Preview 直接讀 authoritative battle state。
- confirm 保存 committed card / target，不提前改 HP 或 Timeline。
- 玩家 `completeResolution()` 呼叫 `resolveBattleAction()` 一次提交戰鬥結果。
- 調度是唯一 player-side schedule-only 路徑，Delay 3。
- `battle()` / `preview()` 都只回 defensive clone。

CI：run 148 build / test 全數通過，因此 Phase 6b 升為 VERIFIED。

## Phase 7 — Enemy Action Resolver

狀態：`VERIFIED`

先行文件：`docs/COMBAT_REFACTOR_PHASE7_ENEMY_ACTION.md`

- `resolveEnemyAction()` 強制 enemy 必須是 Timeline front 且必須已有公開 Intent。
- 正常 Intent 提交直接傷害；HP 到 0 的目標立即從 Timeline 移除，但 vitals 保留 HP=0。
- 成功行動後 temporary resilience reset、該敵人的 Break Window 到期。
- `hard-stagger` 消耗 action opportunity但不視為成功行動。
- 下一 Intent 由 application / encounter script 明確輸入，必須屬於同一 enemy 且為 `normal`。
- 下一 Intent Delay 成為 enemy scheduling source of truth。
- Controller enemy path 不再接受 raw `enemyDelay`。

CI：run 155 build / test 全數通過，因此 Phase 7 升為 VERIFIED。

## Phase 8 — Actor Specialization + Guard / Reaction

狀態：`IMPLEMENTED_PENDING_CI`

先行文件：`docs/COMBAT_REFACTOR_PHASE8_SPECIALIZATION_GUARD.md`

新增：

- `src/core/reactions/GuardState.ts`
- `src/core/reactions/Phase8CombatRules.test.ts`

已更新：

- `src/core/preview/BattlePreviewResolver.ts`
- `src/core/resolution/BattleResolutionResolver.ts`
- `src/core/enemy/EnemyActionResolver.ts`
- `src/application/battle/BattleTurnController.ts`

已實作：

- 標準守勢使用 50% 減傷、單次上限 8；只有實際減傷 > 0 才消耗。
- 非千景角色只能對自己建立守勢；`chikage` 可指定任意存活友軍。
- Guard reaction 存在 authoritative `BattleResolutionState.guardByTargetId`，Preview / Controller snapshot 皆 defensive clone。
- 千景守勢成功降低直接傷害時觸發承勢：攻擊者下一次排程 `+1 Delay`，同一 enemy action 最多一次；此效果不經控制韌性。
- 凜 `quick` 在自身下一節點仍成功搶在原本前方至少一個敵人之前時，該次攻擊 +3。
- 朧對同一敵人成功行動前第一次有效 disruption Delay：requested Delay +1；只有 actual Delay > 0 才寫入 cycle flag；敵人成功行動後重置。
- 紅葉 `heavy` 消耗 armor-break 時，在原本 +50% base damage 之外再 +4 固定傷害。
- Preview 回傳 `specializationBonusDamage`、`oboroBonusApplied`、`createdGuardReaction`；Execute 直接提交同一份 Preview 結果。
- Enemy resolver 真正消耗 guard、回傳 guard reduction、套用承勢並重置朧 cycle。

目前刻意不做：

- redirect / 掩護換目標。
- persistent-status application / tick。
- counter / recoil trigger queue。
- AOE guard stacking / damage split。
- Phaser / BootScene / HUD。

## 下一批

先讓 Phase 8 CI 通過。通過後進新的 presentation path：先建立 `src/presentation/battle/refactor/` 的 Timeline / Hand / Target Preview / Actor / Intent presenters 與 `RefactorBattleScene` 骨架，仍不沿用舊雙列 Timeline 與整輪規劃 HUD。
