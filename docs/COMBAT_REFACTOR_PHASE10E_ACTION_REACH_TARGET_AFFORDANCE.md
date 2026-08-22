# Phase 10e — 行動接敵距離／單體目標提示修正契約

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

依 GitHub Pages Phase 10d 實機回饋修正兩個 presentation 問題：

1. 玩家 ACTION 前衝距離過短，角色停在中央而沒有真正到敵人面前。
2. 千景「護持」屬單一友方目標，但目前所有合法友軍都同時顯示強烈黃圈，視覺上像是全隊同時生效。

本批只修改演出目的地與目標提示，不改 Guard 規則、target rule、damage、Delay、Timeline 或 specialization。

## 1. ACTION 接敵距離

- 有 explicit target 的玩家 ACTION 不再只使用固定 `actionPosition`。
- 演出目的地應由目前 actor / target 的實際 runtime 位置與顯示尺寸推導。
- 攻擊者應停在目標前方，兩個角色的 visual bounds 接近但不重疊；不可停在戰場中央形成明顯空隙。
- 左右方向必須由 actor 與 target 的 x 關係推導，不硬編碼「玩家永遠由左往右」。
- y 位置跟隨目標接地帶，保持場景透視一致。
- 無 explicit target 的卡仍可使用既有 fallback ACTION position。
- Guard / REACTION 保持靠近被保護友軍，不套攻擊接敵距離。

## 2. 單體目標提示

- `targetableActorIds` 仍表示所有「可點擊的合法單體目標」，不改 Controller / Runtime target legality。
- 所有合法但尚未選定的目標只使用低強度可點擊提示，不使用強烈黃圈。
- 只有 `preview.targetId` 對應的目前已選目標使用黃圈／強 highlight。
- 因此「護持」選牌後可以點任一存活友軍，但畫面不再像一次守護全隊；點選某一人後，只有該人顯示明確黃圈。
- enemy-target card 使用同一套 affordance：合法候選為弱提示，實際 preview target 為強提示。

## 3. 不做

- 不把「護持」改成全隊 Guard。
- 不限制千景只能守自己；仍依既有 Phase 8 規則可指定任一存活友軍。
- 不改 `targetableActorIds()`、`BattleTurnController`、Guard resolver 或 specialization。
- 不做最終 HUD 美術 polish。

## 驗收

自動：

- `npm run test`
- `npm run build`
- 新增純 presentation helper 測試：ACTION destination 在有 target 時靠近 target；左右方向可鏡像。
- 新增 target affordance 測試：候選目標與已選目標的視覺 state 不同。

Browser QA：

- 玩家攻擊衝到敵人面前，不再停在中央留大空隙。
- 千景選「護持」後，四名合法友軍可以點，但不會四人同時黃圈。
- 點其中一名友軍後，只有該名友軍出現強黃圈與 Preview。
- 攻擊卡選敵人時同樣只有目前選定敵人使用強 highlight。
- 1280×720 / 844×390 仍可正常操作。

## 後續

Phase 10e 實機通過後，再處理 down/death、hit-stop、FX 對點與最終 floating HUD；legacy removal 仍等 default / rollback browser regression 完成。
