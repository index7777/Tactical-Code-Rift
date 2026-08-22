# Combat Refactor Phase 9f — Auto Flow + Chinese Presentation

STATUS = AUTHORITATIVE_PHASE_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 9e 的 GitHub Pages QA 已證明新版戰鬥可以載入並互動，但 QA scene 仍把非玩家決策狀態暴露成「開始下一角色／執行敵方行動」按鈕，且大量玩家可見文字直接顯示英文 internal id / enum。Phase 9f 將 presentation 從 QA step runner 調整為正常遊戲流：玩家只在真正需要做決策時操作，其餘 turn transition 由 presentation sequencer 自動推進；玩家可見隊友名稱與介面文字改為中文。

## 不變條件

- 不修改 combat domain 規則、Delay、Intent、Resilience、Break Window、specialization 計算。
- 不把 auto-flow 寫進 `BattleTurnController`；Controller 仍只提供 authoritative state transition。
- 不把中文顯示名稱寫回 actor id。內部 actor id 仍為 `rin` / `chikage` / `oboro` / `mo`。
- legacy `BootScene` 仍是沒有 `?combat-refactor=1` 時的預設入口。
- 不啟動 Phase 10 cutover。

## 玩家可見中文名稱

- `rin` → `凜`
- `chikage` → `千景`
- `oboro` → `朧`
- `mo` → `紅葉`
- `ghost-fire` → `鬼火`

卡牌分類：

- `quick` → `迅擊`
- `heavy` → `重擊`
- `guard` → `守勢`
- `disruption` → `擾亂`
- `break` → `破勢`

目標規則：

- `enemy` → `敵方`
- `self` → `自身`
- `ally` → `友方`
- `any-ally` → `任一友方`
- `none` → `無需指定`

## Auto-flow 契約

`RefactorBattleScene` 在 render 後應依 authoritative `RefactorBattleView` 安排 presentation-only timer：

1. `WAITING_FOR_NEXT_ACTOR`：短暫停頓後自動呼叫 `runtime.startNextActor()`。
2. `ENEMY_EXECUTING` / `canResolveEnemy`：短暫停頓後自動呼叫 `runtime.resolveActiveEnemyAction()`。
3. 玩家 `PLAYER_IDLE`、`CARD_SELECTED`、`TARGET_PREVIEW`：停止 auto-flow，等待玩家選牌、選目標、確認或調度。
4. 玩家確認時仍由 runtime 執行 `confirmCard()` + `resolveConfirmedPlayerAction()`；完成後下一個非決策 state 再由 auto-flow 接手。
5. 每次重新 render 前必須取消舊 timer，避免重複 transition。
6. Scene shutdown / destroy 時取消 timer。

## UI 契約

移除玩家可操作的：

- `開始下一角色`
- `執行敵方行動`

這兩個 transition 改為自動執行。

玩家保留：

- 選牌
- 選擇合法目標
- 確認執行
- 取消
- 調度 0–2 張

玩家可見 UI 不直接顯示英文 phase enum、actor id、category enum、target-rule enum；內部 debug 資訊若需要保留，必須與主要玩家資訊分離。

## 驗證

至少新增 presentation 純函式測試，鎖定：

- 四名隊友中文名。
- enemy QA actor 中文名。
- card category / target-rule 中文化。
- auto-flow policy 只對非玩家決策 state 自動前進，不對玩家決策 state 自動前進。

Canonical verification：

- `npm run build`
- `npm test`

Browser QA：

- 玩家不再需要按「開始下一角色」或「執行敵方行動」。
- enemy turn 可自行演進並回到下一個玩家 actor。
- 1280×720 / 844×390 都不因 auto-flow timer 產生重複行動。
