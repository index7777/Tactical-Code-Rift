# Phase 8 — 角色專精與守勢／反應契約

STATUS = AUTHORITATIVE_FOR_PHASE_8
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 8 把四名角色的軟專精與守勢反應放進既有 Preview / Execute 共用規則管線。不得在 Phaser presenter、卡面或 Scene 內另算角色加成。

## 守勢

守勢是一個等待下一次敵方直接傷害的反應窗口，不是護盾資源。

- v1 標準守勢：`guardRatio = 0.5`、`guardCap = 8`。
- 實際減傷 = `min(floor(incomingDamage * guardRatio), guardCap)`。
- 只要實際減傷 > 0，本次守勢即消耗。
- 非千景角色只能把守勢放在自己身上。
- `chikage` 可把守勢指定給任意存活友軍。
- 守勢不移動當前敵方事件；它只修改該 Intent 的結果。
- 守勢不可把不存在的傷害變成反應；0 傷害不消耗。

### 千景：承勢

若 `chikage` 建立的守勢成功降低某敵方直接傷害：

- 該攻擊者「下一次」重新排程額外 `+1 Delay`。
- 同一敵方 action 最多觸發一次，即使是多目標 Intent。
- 這不是控制延後，不吃控制韌性，也不增加 temporary resilience。

## 凜：迅擊

`rin` 使用 `quick` 卡時，若其本次行動後的新節點仍排在至少一個原本位於她當前節點之後的敵人節點之前或同時（tie-break 後仍在前），視為成功搶先；本次傷害 `+3`。

Preview 必須直接回傳此 bonus；Execute 只能提交 Preview 結果。

## 朧：干擾

`oboro` 對某敵人在該敵人下一次成功行動前，第一次造成 Delay 時：

- requested Delay `+1`，再進入既有韌性公式。
- 只有 `actualDelay > 0` 才把本 cycle 標記為已使用。
- 敵人成功行動後清除此 cycle 標記。
- hard-stagger 不是成功行動，因此不重置。

## 紅葉：強攻

`mo` 使用 `heavy` 並消耗 `armor-break` 時：

- 在既有破甲 `+50% base damage` 之外，再加 `+4` 固定傷害。
- 此 +4 與破甲一起只在該窗口實際被消耗時成立。

## Domain state

新增可被 resolution state 保存的最小資料：

- `guardByTargetId`：目前等待觸發的守勢反應。
- `oboroDelayUsedByEnemyId`：每名敵人目前成功行動 cycle 中，朧的一次性干擾 bonus 是否已使用。

為維持 migration 相容性，這兩欄在 `BattleResolutionState` 先採 optional；clone / resolver 必須把缺省視為空 state。

## Preview / Execute parity

- Preview 必須顯示凜／朧／紅葉專精後的最終數值。
- 守勢卡 Preview 必須顯示將建立的 guard reaction。
- `resolveBattleAction()` 只提交 Preview 產生的結果，不建立第二套專精公式。
- `resolveEnemyAction()` 才消耗 guard reaction、套用千景承勢、重置朧 cycle。

## Phase 8 驗收

至少測：

1. 一般守勢只能 self；千景可守任意友軍。
2. 20 傷害在 50% / cap 8 守勢下變 12。
3. 千景守勢實際減傷後，敵人下一節點額外 +1，且不改韌性。
4. 凜 quick 搶先成立時 +3，不成立時不加。
5. 朧第一次有效 Delay requested +1；同 cycle 第二次沒有；敵人成功行動後恢復。
6. 紅葉 heavy 消耗 armor-break 時，在 +50% 後再 +4。
7. Preview / Execute 數值一致。
8. 所有新增 state 對外 snapshot 仍 defensive-cloned。

## 非目標

本批不做：

- Phaser / HUD。
- persistent-status ticking。
- counter / recoil queue。
- 多層 guard stacking。
- AOE guard 分攤。
- AI Intent selection。
