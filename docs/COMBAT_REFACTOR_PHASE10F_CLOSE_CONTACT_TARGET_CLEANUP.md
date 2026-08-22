# Phase 10f — 近身接敵、守勢目標提示與戰場標籤清理

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

本批只修正 Phase 10e GitHub Pages 實機回饋，不改戰鬥核心規則：

1. 玩家 ACTION 雖已改為 target-relative approach，但實際角色圖含透明邊界，使用完整 display bounds 仍造成視覺上離敵人過遠。
2. 非千景角色使用 `護持` 時，domain 規則實際只允許守自己，但 presentation target candidate 仍把所有存活友軍標成可選，造成多餘藍圈。
3. 左側 party HUD 已承擔我方名稱／HP，因此 battlefield actor 旁重複顯示名稱與 HP 沒有必要，會污染場景構圖。
4. 使用者指定 `area01-rail-halt-hd2d-candidate-v2.png` 作為下一個優先戰場 BG；目前 `combat-refactor-v1` tree 尚無此檔，因此不得先寫死不存在的 runtime URL。檔案進入 branch 後再切換 preload mapping。

## 規則邊界

守勢規則不變：

- 非 `chikage`：守勢只能指定自己。
- `chikage`：可指定任一存活友軍。
- 本批只讓 `RefactorBattleRuntime.targetableActorIds` 與既有 domain legality 對齊，不在 Scene 重算規則。

## 接敵距離

`actionApproachPosition()` 不再把完整透明 PNG display width 當成角色實際身體碰撞寬度。

- 改用較窄的 visual contact radius（display width 的一部分）估算前緣。
- 有 explicit target 的 ACTION 要貼近目標前方，保留極小視覺間距，不重疊穿模。
- 左右方向自動鏡像；y 仍跟隨 target ground band。
- 不影響 REACTION / Guard 的插入位置。

## Target affordance

- `enemy` 卡：所有合法敵人可顯示候選提示；實際 preview target 才強調。
- `any-ally` Guard：
  - active actor 不是千景時，只回傳 active actor 自己。
  - active actor 是千景時，才回傳所有存活友軍。
- 不合法 actor 不顯示候選圈，也不可點擊。

## Battlefield label cleanup

我方 battlefield actor 不再在角色旁重複顯示：

- 名稱
- `生命 current/max`

這些資訊由左側 party HUD 承擔。角色本體只保留必要的 selection / target affordance。

敵方名稱／HP 目前仍保留，後續 final HUD 再統一。

## BG 切換條件

優先目標：`area01-rail-halt-hd2d-candidate-v2.png`。

- 在檔案實際存在於 `combat-refactor-v1` 前，保留目前可載入的 rail-halt runtime-trial BG，避免 GitHub Pages 產生 404 texture。
- 檔案進入 branch 後，runtime copy 應放到 `public/assets/battle/` 或由既有 asset pipeline 產出可公開路徑，再更新 `RefactorBattleAssets.ts`。
- candidate 身分不等於 release approved；本批只是 browser QA 視覺候選。

## 驗收

自動：

- `npm run build`
- `npm run test`
- `actionApproachPosition` 測試確認接敵距離顯著縮短且左右鏡像。
- runtime targetability 測試確認：非千景 Guard 只可 self；千景 Guard 可任一存活友軍。

Browser QA：

- 一般攻擊衝到敵人近身前緣，不再停在明顯空白距離外。
- 凜／朧／紅葉選 `護持` 時只有自己出現可選提示。
- 千景選 `護持` 時才顯示全隊合法候選；實際選中的單一隊友才強調。
- battlefield 我方角色旁不再有重複姓名／HP 文字。
- `area01-rail-halt-hd2d-candidate-v2.png` 一旦進 branch，下一個 Pages build 改用該圖驗場景透視與角色比例。

## 非目標

- 不改 Guard 減傷、承勢或 specialization。
- 不改卡牌 targetRule 資料模型。
- 不移除左側 party HUD。
- 不做 final floating HUD、death sequence、camera shake 或 FX polish。
- 不移除 legacy combat source。