# Phase 10k — Adaptive Battle Stage / formation / hand layout

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把 Phase 10j 仍以單一背景手調座標的 presentation 做法，重構為可供未來不同戰鬥背景共用的 Battle Stage layout system。這一批不改 combat core、不增加角色姿勢、不把資產庫內容批量接入；目前 rail-halt HD-2D BG 保持不變，只作第一個 stage profile 的 QA 基準。

核心原則：背景提供可戰鬥空間與 framing contract；UI 必須讓出空間給舞台；角色位置由 formation slot + depth band 推導，不由角色 identity 綁死 x/y。

## Battle Stage Profile

新增純 presentation `BattleStageProfile`，至少描述：

- logical stage size 1280×720。
- `playerZone`、`enemyZone`、`actionZone`。
- `depthBands`：每個 band 提供 y 與 scale；越靠近畫面下方 scale 越大。
- `backgroundFocalPoint`：背景 cover/framing 的構圖焦點。
- `backgroundSafeCrop`：允許裁切方向與最小保留地面帶。
- `hudSafeTop` / `hudSafeBottom`。
- `occlusionLeft` / `occlusionRight`：不可安排角色 HOME 的遮擋區。

目前 rail-halt profile 只作第一個實例。未來 mountain-cut / forest-path / terminal-platform 應只換 profile，不改 Scene 核心。

## Formation slots

- 移除角色 identity -> 固定 HOME 座標的設計依賴。
- 定義 1–4 人 player formation slots；目前四人 roster 依 runtime order 分配 slot，但 slot 本身不得叫 rin/chikage/oboro/mo。
- slot 只描述 stage-relative x 與 depth-band index。
- actor HOME y / scale 從 stage profile 的 depth band 取得。
- `homePositionFor(actorId)` 可保留相容入口，但必須由 actor -> formation index -> stage slot 推導，不再持有角色專屬座標常數。
- enemy baseline 同樣由 `enemyZone` / depth band 推導；目前單一 QA enemy 先使用第一 enemy slot。

## Background framing

新增純 `backgroundFrame()` / presenter policy：

- 不把任意來源圖直接 `setDisplaySize(1280, 720)` 拉伸。
- 以 cover scale 保持來源 aspect ratio。
- 以 `backgroundFocalPoint` 決定裁切 anchor。
- 1280×720 logical stage 必須被完整覆蓋，不露黑邊。
- framing 不得改變目前 BG binary；只改 runtime image display size / crop position。

## Shared Hand adaptive layout

手牌不得永久佔用 170–210px 固定大區域。

定義兩種 presentation state：

- `COLLAPSED`：一般玩家等待／可選牌時，五張牌使用低高度 dock（約 82–92px），只突出卡名與 Delay；類型／target 為次要資訊。
- `EXPANDED`：有 selected card、target preview 或 dispatch 選牌時，hand 上浮／增高到約 116–128px；selected card 可額外上浮，但不能把 battlefield HOME 壓進 HUD。

規則：

- hand state 由 battle view phase + dispatch state 推導，不寫進 combat domain。
- `TARGET_PREVIEW` 的結果應優先靠近 selected card / hand 上緣，不再固定佔用中央一整條寬 panel。
- 1280×720 下 near depth band 的腳點必須和 collapsed hand 保留視覺間距。
- 844×390 等窄高 landscape 可以使用更緊 compact metrics，但不得改卡牌規則。

## Camera focus

Phase 10i 的 `1.05 + 前踏` 保留，但 camera target 改由 stage profile 約束：

- camera focus 不直接 centerOn actor。
- pan 量受 stage safe bounds clamp。
- HUD camera 不參與 world zoom。
- ACTION 有 attacker + target 時，後續可由 action zone / pair bounds 決定 framing；本批至少確保 active focus 不把 formation 或地面帶裁掉。

## 資產邊界

- BG 使用 current-head 已接入 rail-halt HD-2D 圖，不替換、不重新命名、不升 approved。
- 不新增／生成角色 pose。
- 不因 card art、foreground、route-map、enemy FX 已存在就批量接入。
- audio policy 與 canonical enemy mapping 仍為獨立 follow-up，不混入本批。

## 實作邊界

預期新增／修改：

- `src/presentation/battle/refactor/BattleStageProfile.ts`
- `src/presentation/battle/refactor/BattleStageProfile.test.ts`
- `src/presentation/battle/refactor/RefactorHandLayoutPolicy.ts`
- `src/presentation/battle/refactor/RefactorHandLayoutPolicy.test.ts`
- `BattleActorPresenter.ts`：formation slot / stage-derived HOME。
- `RefactorBattleFocusPolicy.ts`：stage-clamped camera target。
- `RefactorBattleScene.ts`：讀 stage / hand policy，不再手寫 identity HOME 與固定 hand 高度。

不把 stage rules 寫進 core/application；全部保持 presentation-only pure policy + Scene wiring。

## 驗收

自動：

- `npm run build`
- `npm run test`
- formation identity independence：同一組 slot 可分配不同 actor id。
- depth band scale 單調增加且 HOME 全部落在 player zone。
- background framing 保持 aspect ratio 且完整 cover 1280×720。
- hand collapsed / expanded state 與 metrics tests。
- active camera target 被 stage safe bounds clamp。

Browser QA：

- 目前 rail-halt BG 上四人像站在同一片月台的不同景深帶，不再像四個獨立手調 y。
- near actor 不和 hand dock 打架。
- hand 收合後 battlefield 明顯增加；選牌／target preview 時再局部展開。
- camera focus、ACTION 接敵、Intent、Timeline 仍可讀。
- 1280×720 與 844×390 不露黑邊、不裁主要操作。

## 非目標

- 不修改 damage / Delay / Intent / Guard / Timeline domain。
- 不做 EncounterCatalog 全敵群接入。
- 不更換背景素材。
- 不處理正式 BGM/SFX policy。
- 不移除 legacy combat。
