# Combat Refactor Phase 10n — Grounding / Depth Separation

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 問題

Phase 10m 已把角色站位改成 identity-independent stage formation，並壓縮過大的垂直跨度；Pages 實機回饋仍指出三個畫面問題：整體角色腳點偏高、前後角色 silhouette 仍互相重疊、深度 scale 差不夠明顯，使「畫面下方較近、應更大」的透視讀感不足。

本批不回到逐角色座標修補。調整仍必須由 `BattleStageProfile` 的 depth bands 與 formation slots 驅動，讓未來其他 battle stage 可以沿用相同語義：較低的 depth band 必須具有較大的 perspective scale；slot geometry 必須提供足夠 silhouette separation；角色身份只填入 slot，不擁有專屬 HOME 例外。

## 採用方向

1. Rail-halt 的四個 player depth band 整體下移，利用 BG 下半部地面，而不是為手牌區把角色硬塞回中景。
2. depth scale 梯度加強，明確維持 `far < rear-mid < front-mid < near`；下方角色必須顯著大於上方角色。
3. formation slot 同時增加水平間距與交錯，避免只靠 y 差避重疊。
4. 角色中心 y 與 scale 使用同一份 profile 資料，不允許 Scene 再補 actor-specific scale。
5. 手牌/card master 本批不再縮小；角色空間問題由 stage layout 解決。
6. enemy 仍使用 profile-driven position/scale，並與 player depth contract 使用同一地面邏輯。
7. BG binary、background framing、camera focus、ACTION target-relative approach 與 combat rules 不改。

## Rail-halt QA 校正目標

- player center y 約落在 392 / 420 / 462 / 492 logical px。
- player perspective scale 約 0.88 / 0.96 / 1.07 / 1.16，確保畫面越下方越大。
- 四個 slot 應形成清楚的兩層斜列；任一相鄰 slot 的 x 差不得靠近到造成目前 1280×720 silhouette 黏合。
- near actor 的腳點不得侵入 hand interaction zone；角色可視 bounds 和卡牌之間保留安全距離。
- QA enemy 維持中前景並與 action zone 對峙，不因 player 下移而漂到不同地面系統。

## 程式邊界

- `BattleStageProfile.ts`：調整 rail-halt depth bands、player zone、formation slots；如需要，新增純 presentation helper 驗證 slot separation。
- `BattleActorPresenter.ts`：只消費 profile，不新增角色身份判斷。
- `RefactorBattleScene.ts`：本批原則上不修改；若沒有 profile 外的 bug，不在 Scene 補位置魔數。
- tests 必須驗證 monotonic depth scale、下方較大、formation identity independence 與足夠水平 separation。

## 驗收

自動：

- 四個 player slot 都在 player zone。
- y 嚴格遞增，scale 也嚴格遞增。
- near/far scale ratio >= 1.28，避免透視差只存在於數字、實機看不出來。
- rear pair 與 front pair 均有足夠水平 separation。
- player formation 仍與 actor identity 無關。
- `npm run build`、`npm run test` 通過。

Pages / browser：

- 1280×720：四名玩家整體腳點比 Phase 10m 更低，並確實踩在月台可戰地面。
- 角色輪廓不互相壓住；尤其凜／千景與朧／紅葉各自能單獨辨識。
- 最下方角色明顯比最上方角色大，形成自然前後景深。
- 紅葉不與 Shared Hand 重疊；collapsed / expanded hand 都要驗證。
- active-focus 前踏與 ACTION 後回 HOME 不得造成 scale 或 y 跳變。
- 844×390 回歸 Timeline / Intent / hand 可操作性。

## 非目標

- 不再縮卡牌。
- 不更換或重畫 BG。
- 不修改音樂／音效。
- 不擴敵人 roster。
- 不新增角色 pose 或任何美術資產。
- 不修改 combat domain / resolution。
