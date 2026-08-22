# Combat Refactor Phase 10m — Stage Formation / Scale Calibration

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 問題

Phase 10k 已把角色 HOME 從角色身份固定座標改成 stage profile + formation slots，但 Pages 實機仍顯示「座標合法、空間讀感不一致」：四名玩家的垂直深度差過大，後排角色尺寸沒有隨深度足夠收斂，兩名中前排 silhouette 偏黏，QA enemy 的視覺重量偏小且離中央交戰區過遠。

本批不是替單一角色手調座標，而是校正可重用的 stage formation contract。rail-halt 只是第一個 QA profile；後續 mountain-cut / forest-path / terminal-platform 應沿用同一組語義欄位與推導方式，只替換 profile 資料。

## 採用方向

1. 縮小四個 player depth band 的垂直跨度，讓隊形讀成同一片地面上的前後兩層，而不是四個不同高度的棋盤格。
2. depth scale 仍單調增加，但差距收斂：far 約 0.90、rear-mid 約 0.96、front-mid 約 1.03、near 約 1.08。
3. player formation 主要用 x 展開 silhouette，而不是靠大幅 y 位移避重疊。
4. formation slot 保持 identity-independent；換 party order 不得改變 slot geometry。
5. enemy position 由 profile 的 enemy zone 推導，向中央 action zone 收近；enemy 視覺縮放倍率進 profile，不在 Scene hardcode。
6. actor image box、focus step、camera 1.05、ACTION target-relative approach、hand/card presentation 本批不改。
7. 目前 HD-2D rail-halt BG binary / framing 不改。

## Rail-halt QA profile 校正目標

- player zone：擴大水平可用寬度，避免四人聚成兩團。
- player center y 約落在 370 / 390 / 425 / 445；實際 sprite 腳底再由顯示高度形成一致的地面景深。
- player scale 約 0.90 / 0.96 / 1.03 / 1.08。
- recommended logical x 約形成 `rear-left / rear-right / front-left / front-right` 的斜列，而不是依角色身份指定絕對座標。
- QA enemy 約落在 x 920–940、mid/front depth，並比同深度 player 有約 1.14 的 stage enemy visual multiplier。

## 程式邊界

- `BattleStageProfile.ts` 擁有 zone、depth band、formation slot 與 enemy visual multiplier。
- `BattleActorPresenter.ts` 只消費 profile 推導後的位置與 scale。
- `RefactorBattleScene.ts` 不新增 `rin/chikage/oboro/mo` 專屬位置例外。
- 不在 Scene 以 `if actorId === ...` 修腳點或尺寸。

## 驗收

自動：

- formation geometry 與 actor identity 無關。
- 四個 player slot 都在 player zone。
- depth scale 嚴格隨 depth 增加。
- 四個 player center-y 總跨度 <= 80 logical px。
- rear/front x 具足夠分離，不靠 y 差避免重疊。
- enemy stage position 在 enemy zone 且 enemy scale multiplier 由 profile 提供。
- `npm run build`、`npm run test` 通過。

Pages / browser：

- 1280×720：四人讀成同一月台上的兩層斜列；凜不再像浮在高處、千景/朧 silhouette 不黏、紅葉不壓手牌。
- enemy 視覺重量比前一版提高，但不侵入 Intent panel。
- ACTION 接敵仍落在 target 同一地面帶並能正常回 HOME。
- 844×390：formation、Timeline、手牌與 Intent 仍可辨識。

## 非目標

- 不修改卡牌母版。
- 不修改音樂／音效。
- 不擴敵人 roster。
- 不新增角色 pose 或任何美術資產。
- 不修改 combat domain / resolution。
