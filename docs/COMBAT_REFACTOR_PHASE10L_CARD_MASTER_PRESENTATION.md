# Phase 10l — Shared Hand / Card Master Presentation

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把 Phase 10k 已完成的 hand 空間自適應，進一步重構成符合既定戰鬥 UI 母版的卡牌 presentation。這一批不改 combat core、不改 BG、不改角色站位、不新增角色 pose；只把目前仍像 debug rectangle 的共享手牌，改成具備卡牌 anatomy、family identity、selected hierarchy、獨立調度與確認控制的正式互動結構。

母版來源為使用者提供的既定戰鬥 UI reference：卡牌不是五個等權按鈕，而是由主視覺區、卡名／分類、效果摘要、Delay footer 組成；不同 family 有穩定視覺語彙，selected card 會上浮／發光，調度與確認／取消必須和卡牌本體分離。

## Card anatomy

每張共享手牌至少固定四層：

1. `family header / art zone`：保留主視覺或程式化 family mark 的位置，不要求本批把所有 art 資產接滿。
2. `name / category zone`：卡名為主，分類為次。
3. `effect zone`：只顯示玩家此刻需要理解的效果摘要，不重複顯示 target rule enum。
4. `Delay footer`：固定在卡底部獨立帶，`Delay N` 是全手牌最快掃讀的節奏資訊。

Collapsed state 可以縮短 effect zone，但不能把 Delay、卡名與 family identity 壓成同一層文字。

## Family identity

目前五個 category 固定 presentation family：

- `quick`：冷藍／青，快速攻擊。
- `heavy`：紅／朱，重擊。
- `guard`：青綠，守勢／護持。
- `disruption`：紫，延後／打斷。
- `break`：金橙，破甲／失衡窗口。

先以程式化 fill / stroke / badge 建立穩定 family identity；只有現有 runtime card frame/icon 明確符合母版與目前 category 時才允許接入，不因 assets 目錄存在就批量載入。

## Effect summary

HandPresenter 應從 `RefactorCardEffect` 建立 presentation-only 摘要，Scene 不自行解讀規則：

- damage：`傷害 N`
- delayTarget：`延後目標 N`
- guard：`下次直接傷害 -50%`，並顯示上限 8（若有）
- interrupt：`打斷意圖`
- armor-break：`建立破甲窗口`
- imbalance：`建立失衡窗口`

若一張卡同時有兩個效果，最多顯示兩行；更完整結果仍由 Target Preview 顯示。

## Selected / dispatch hierarchy

- `PLAYER_IDLE`：五張牌保持完整 family identity，collapsed hand 以卡名 + Delay + 短效果為主。
- `CARD_SELECTED` / `TARGET_PREVIEW`：selected card 上浮、略放大、family glow 加強；其他卡降低 alpha 但仍可辨識。
- dispatch mode：不是 card selected。被選作調度棄牌的卡改用調度標記，不套用技能 selected glow。
- 調度本身維持獨立 utility panel，不畫成第六張 family card。

## Preview / command separation

- Target Preview 靠近 hand 上緣，但視覺上不是第六張卡。
- `確認執行 / 取消` 使用獨立 command panel；不得和 `調度` 共用看起來像卡牌的尺寸與框線。
- `調度` panel 顯示 `交換 0–2 張 / Delay 3`；進入調度後顯示目前選取數。

## 資產邊界

- BG 保持 current-head，不修改、不重新命名。
- 玩家／敵人資產不在本批變更。
- 不新增角色 pose。
- 不把 `public/assets/battle/cards/` 全部 preload；本批先以程式化 card master 讓 anatomy 與互動成立。
- audio policy / enemy canonical mapping 仍維持後續獨立批次。

## 實作邊界

預期新增／修改：

- `src/presentation/battle/refactor/CardMasterPresentation.ts`
- `src/presentation/battle/refactor/CardMasterPresentation.test.ts`
- `src/presentation/battle/refactor/HandPresenter.ts`
- `src/presentation/battle/refactor/HandPresenter.test.ts`（若現有測試不足）
- `src/presentation/battle/refactor/RefactorHandLayoutPolicy.ts`
- `src/presentation/scenes/RefactorBattleScene.ts`

presentation policy 只能讀 card view / effect，不得重新計算 Preview / damage / Delay rules。

## 驗收

自動：

- `npm run build`
- `npm run test`
- 五種 category 都有穩定且不同的 family style。
- effect summary 對 damage / delay / guard / interrupt / break window 有固定輸出。
- selected card 的 presentation metrics 與 unselected 不同；dispatch-selected 不冒充 skill-selected。
- hand layout 仍維持 collapsed / expanded state，並保證五張牌 + utility panel 在 1280×720 logical width 內。

Browser QA：

- 五張手牌第一眼像一組卡牌，不像五個 debug button。
- 不必細讀文字即可分辨 quick / heavy / guard / disruption / break。
- Delay 可沿卡底快速橫向掃讀。
- 選中卡有明顯上浮／glow，其他卡退居次要。
- 調度和確認／取消與卡牌本體明確分離。
- 1280×720 與 844×390 下仍可操作，且不重新壓縮 battlefield HOME。

## 非目標

- 不改 combat rules / Timeline ordering / Intent / Guard domain。
- 不更換 BG。
- 不處理正式 BGM/SFX。
- 不擴充 enemy roster。
- 不移除 legacy combat。
