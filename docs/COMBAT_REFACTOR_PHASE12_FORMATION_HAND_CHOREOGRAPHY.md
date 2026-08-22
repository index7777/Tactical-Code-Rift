# Combat Refactor Phase 12 — 2×2 Formation / Hand Choreography

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把目前「四個獨立景深槽位＋縮矮手牌」重構為可承載完整 4v4 的雙排戰鬥舞台，並讓手牌依戰鬥狀態進出畫面，而不是常駐占據一塊黑色 UI 區。

本批採用使用者指定方向：

1. 我方與敵方都使用上排 2 人、下排 2 人的淺透視隊形。
2. 完整卡牌在 `PLAYER_IDLE` 時沉入畫面下緣，只露出約一半高度。
3. 選牌時 selected card 才完整抽出；其餘牌下沉並退階。
4. 執行／結算期間手牌與決策 UI 全部退場，戰場演出成為唯一主焦點。
5. 不生成新美術；依使用者指示跳過獨立灰盒交付，直接用既有 `tactical-code-rift-card-assets-v1` 卡框與 family 圖案完成 runtime composite QA。

## 取代的舊契約

本文件只取代下列 presentation 細節，不推翻其架構原則：

- Phase 10n 的四個 player slot 各自使用不同 depth band，改為 `REAR`／`FRONT` 兩個 row band；同排角色必須使用相同 scale。
- Phase 10k／10l 的 `COLLAPSED`／`EXPANDED` 縮卡模式，改為完整卡牌的 `PEEK`／`FOCUS`／`TARGETING`／`HIDDEN`／`DISPATCH` 狀態。
- Scene 內固定右側 Intent panel 改為 actor-anchored enemy overhead modules；大型常駐 Intent panel 不再是正式方向。

以下原則仍保留：

- formation 與角色 identity 分離。
- 背景保持 aspect ratio cover，不拉伸、不更換 binary。
- 角色以腳底 pivot 接地，並依 y 進行 depth sort。
- combat core、Preview、damage、Delay、Guard、Timeline ordering 不由 presentation 重算。
- Camera focus、target-relative ACTION 與動作後返回 HOME 繼續沿用純 presentation policy。

## 畫面狀態契約

| Presentation state | Battlefield | Hand | Selected card | Target feedback | Confirm | Timeline／Party |
|---|---|---|---|---|---|---|
| `PEEK` | 主焦點 | 五張完整卡沉入下緣，只露 45–55% | 無 | 無 | 隱藏 | 常駐但低權重 |
| `FOCUS` | 次焦點 | 未選牌再下沉、退暗 | 完整抽出並放大 | 候選目標低強度 | 尚未合法時隱藏 | 降低 alpha |
| `TARGETING` | 目標與卡牌共同主焦點 | 未選牌保持下沉 | 維持完整 | selected target 準星＋接地環＋Preview | 唯一強 CTA | 降低 alpha |
| `HIDDEN` | 唯一主焦點 | 全部沉出畫面 | 隱藏 | 只保留命中／結果回饋 | 隱藏 | 只保留必要讀值 |
| `DISPATCH` | 次焦點 | 五張牌抬高到可選高度 | 不使用技能 selected glow | 無 | 提交調度為中性 CTA | 常駐低權重 |

映射規則：

- `PLAYER_IDLE` → `PEEK`
- `CARD_SELECTED` → `FOCUS`
- `TARGET_PREVIEW` → `TARGETING`
- player／enemy action animation、resolve、等待下一 actor、battle result → `HIDDEN`
- `dispatchMode=true` → `DISPATCH`

`HandPresentationState` 是 presentation-only 狀態，不得加入 core turn state。

## 2×2 Formation 契約

### Row model

雙方共用兩個語義 row：

- `REAR`：畫面較上，scale 較小。
- `FRONT`：畫面較下，scale 較大並略向中央交鋒區靠近。

限制：

- 同排兩人的 scale 必須完全相同，不再出現四人各自忽大忽小。
- front/rear 可見高度差目標為 8–12%，不得超過 15%。
- 同排兩人必須有足夠水平 silhouette separation；透明 bbox 不得重疊超過各自可見寬度的 12%。
- 前後排腳點差目標為 44–60 logical px。
- 我方固定朝右；敵方固定朝左。
- 所有 HOME、action return point 與 death anchor 均從 slot＋foot pivot 推導，不保存角色特例座標。
- encounter 建立時即把 actor id 綁定到 immutable spawn slot；死亡只改 alive／presentation，不移除 slot、不讓其他敵人往前補位。
- 允許前後排輪廓局部重疊，但 front/rear 必須至少有一個清楚的水平錯位，且不得遮住頭部、武器主 silhouette 或 foot contact。
- 明確 render order：ground/ring < rear actor < front actor < overhead/target feedback < damage/result text；同 row 使用穩定 slot index，不依每次 render 的陣列偶然順序。

### Four-unit layout

```text
REAR      P1      P2                 E2      E1
FRONT        P3      P4         E4      E3
                     ACTION ZONE
```

- front row 向中央收進，形成淺梯形，不做垂直方格。
- player／enemy formation 必須鏡像同一地面透視語義，但不要求像素完全對稱。
- `z` 由 foot y 決定；同 y 時使用穩定 slot order，避免每次 render 閃爍換層。

### 1–4 人分配

- 1 人：front/rear 中間的主位，仍使用合法 foot row anchor。
- 2 人：一 rear、一 front，形成對角線。
- 3 人：rear 2、front 1；front 使用本側主位。
- 4 人：rear 2、front 2。

Boss encounter 可讓 Boss 使用一個主 slot 和較大的 canonical asset scale，但不得更動其他 slot 幾何或以 actor id 寫死座標。

## 角色正規化與接地

- 顯示尺寸從 alpha bbox 可見高度推導，不以來源 canvas 高度推導。
- 同排普通單位的可見高度差限制在 6%；Boss canonical multiplier 另由 encounter/presentation profile提供。
- standing pose 使用共同 foot pivot；切 pose 時保持 foot world position 不變。
- death／dissolve 以 HOME foot anchor 為基準，不得回到先前角色漂浮或死亡錯位。
- rear/front 的 scale 只由 row 決定；active focus 可暫時放大，但返回時必須恢復 slot scale。
- enemy overhead anchor 使用 actor alpha bbox top，而不是來源 canvas top。

## Enemy Overhead HUD

每個敵人使用小型 actor-anchored module，至少包含：

- HP bar／數值。
- Balance／Break 狀態。
- 下一個 Intent 名稱或精簡圖示。
- status icons 與 stack count。
- target candidate／selected affordance。

規則：

- module anchor 預設在可見 bbox 上方 10–18 px。
- rear row 與 front row 使用不同 overhead lane；4 敵人時不得互相遮蓋。
- collision resolver 只允許小幅水平／垂直偏移，不得把 HUD 推成固定右側大面板。
- target ring／準星／接地環由 runtime graphics 組裝，不生成每隻敵人的 targeting skin。
- execute 時保留 HP／Balance；長 Intent 說明與 target preview 退場。

## Hand geometry

卡牌維持完整 master 尺寸，不再用縮短 card height 模擬收合。

### Existing Card Master source pack

> 2026-08-22 correction: the table below records the source pack that Phase 12 received, not an approval of all six files. Runtime evidence later rejected the five square transparent family visuals. Keep only the neutral frame; replacement family illustration plates must follow `DEMO_ASSET_REQUIREMENTS_V1.md`.

使用者指定來源：`D:/Tactical-Code-Rift/tactical-code-rift-card-assets-v1/`

| Logical slot | Source file | Source size | Runtime role |
|---|---|---:|---|
| neutral frame/body | `card-frame-neutral.png` | 1024×1536 RGBA | 所有 family 共用的 2:3 卡身、框線與內部分區 |
| quick visual | `card-family-quick.png` | 1254×1254 RGBA | `REJECTED_SPEC`; negative reference only |
| heavy visual | `card-family-heavy.png` | 1254×1254 RGBA | `REJECTED_SPEC`; negative reference only |
| guard visual | `card-family-guard.png` | 1254×1254 RGBA | `REJECTED_SPEC`; negative reference only |
| disruption visual | `card-family-disruption.png` | 1254×1254 RGBA | `REJECTED_SPEC`; negative reference only |
| break visual | `card-family-break.png` | 1254×1254 RGBA | `REJECTED_SPEC`; negative reference only |

接入規則：

- 一張 runtime card = 1.44:1 全滿版不透明 family illustration plate + neutral frame/body + runtime text/data。
- illustration plate 依 upper art zone cover/crop；不得用透明去背圖，也不可拉伸成 2:3。
- 卡名、Delay、效果、target、數值與 selected glow 不烘進 PNG。
- neutral frame 保留為唯一卡牌邊界；圖窗必須由不透明 plate 先填滿，再疊 frame 與 runtime text。
- neutral frame 維持 runtime-trial gate；五張舊 family 圖已退回，不因已複製到 `public/assets` 就自動標為 approved。
- selected state 仍不得生成獨立圖片；五張 replacement plates 的生成批次由 `DEMO_ASSET_REQUIREMENTS_V1.md` 管理。

### `PEEK`

- 五張牌中心約落在 logical y `716–728`，由實際 card height 推導，不寫死裁切矩形。
- 露出高度為卡牌可見高度的 45–55%。
- 必須看得到 family 色、卡名與 Delay／節奏 badge；這些快速判讀資訊要配置在可見上半區。
- 完整卡的 bottom footer 可以在 PEEK 被遮住；抽出後才顯示完整效果與 footer。不得因 footer 被遮住就把 idle 卡重新壓矮。
- 可使用極輕微扇形／rotation，但最大旋轉不得超過 ±4°。
- 不建立全寬黑色 hand background。

### `FOCUS`／`TARGETING`

- selected card 抽到中央偏下的 focus anchor，完整顯示。
- selected 視覺尺度目標為 idle card 的 1.55–1.85 倍；最終值由 1280×720 與 844×390 runtime composite 決定。
- 其他四張牌中心沉到 logical y `748` 以下並降至 35–55% alpha。
- selected card、actor target 與 Preview 必須形成一個 focus 群組；不新增全寬 Preview panel。
- Confirm 固定在右下 safe zone；Cancel 為較小的次要控制。

### `HIDDEN`

- 所有 cards、hand label、dispatch、Confirm、Cancel、card detail 都移出畫面或不可見。
- UI hide 必須在 actor movement／attack FX 開始前完成。
- resolve feedback 結束、actor 返回 HOME 後，才恢復下一個合法 hand state。

### `DISPATCH`

- 五張牌抬到可讀／可點高度，但不得使用技能 selected card 的大幅抽出效果。
- 調度選中只顯示中性 discard marker。
- 提交／取消屬 utility control，不得成為第六張卡。

## Timeline／Party visibility

- Timeline 保持頂部小 portrait node＋細 connector，不生成大型裝置框。
- `PEEK` 時正常可讀；`FOCUS`／`TARGETING` 降低 alpha，但 active actor cue 保留。
- `HIDDEN`／ACTION 時只保留最必要的順序與 HP 讀值，不和 FX 搶焦點。
- Party HUD 不再侵入 player formation；2×2 player zone 必須先成立，再決定 HUD 寬度。

## 工作拆分

### W1 — Pure presentation state policy

- 新增 `BattlePresentationStatePolicy.ts` 與 tests。
- 從 turn phase、dispatch、animation/result 狀態推導 `PEEK／FOCUS／TARGETING／HIDDEN／DISPATCH`。
- 定義各狀態的 hand、Timeline、Party、enemy overhead、Confirm 可見性／alpha。

### W2 — Symmetric formation policy

- 將 `BattleStageProfile` 的四個獨立 depth bands 收斂為 rear/front row contract。
- 新增 player/enemy `formationSlotsFor(count, side)`。
- 1–4 人都必須 deterministic、identity-independent、合法接地。

### W3 — Actor normalization / depth / return

- `BattleActorPresenter` 改讀 row slot 與 alpha bbox normalization。
- 統一 foot pivot、row scale、stable depth sort、pose swap 與 action return。
- 回歸 death／dissolve anchor。

### W4 — Enemy overhead presenter

- 從 `RefactorBattleScene` 拆出 overhead layout/presenter。
- 以 actor bbox top 建 anchor，加入 4-enemy lane/collision policy。
- 移除常駐大型 Intent panel 的正式依賴。

### W5 — Hand presentation state / geometry

- 以新五態取代 `COLLAPSED／EXPANDED`。
- 完整卡牌 PEEK、selected 抽出、其他牌下沉、DISPATCH、HIDDEN metrics 都由純 policy 計算。
- 保留 neutral Card Master anatomy，不保留已拒絕的透明 family cutout 規格。
- 建立 composite：opaque family illustration plate、neutral frame/body、runtime header／Delay／effect text 分層。

### W6 — Scene choreography

- `RefactorBattleScene` 依 presentation state 建立／退掉 HUD。
- card focus、target selection、Confirm、action begin、resolve、return HOME、next actor 形成單一路徑。
- tween 中斷／scene shutdown 必須回收，不得重複提交 action。

### W7 — Responsive profiles

- 1280×720：完整 4v4、五張 PEEK hand、四個 enemy overhead。
- 2560×1440／2K CSS viewport：logical layout 不放大到粗糙，canvas sampling 與資產 source gate分開驗證。
- 844×390：採 compact anchors／間距，不改規則、不刪除可操作功能。

### W8 — Runtime QA and regression

- 七個 route encounters 逐場進入 `PLAYER_IDLE`、選牌、選目標、Confirm、ACTION、返回 HOME。
- 4v4 壓力場檢查八個 actor、四個 enemy overhead、Timeline、Party、PEEK hand 無 overlap。
- 勝利、敗北重試、Boss clear、音樂／音效與 Console／404 回歸。

## 預期檔案影響

新增約 3–5 個 pure presentation 檔與對應 tests：

- `BattlePresentationStatePolicy.ts`
- `BattleFormationPolicy.ts`（若不併入 `BattleStageProfile.ts`）
- `EnemyOverheadLayoutPolicy.ts`
- 對應 `.test.ts`

主要修改約 5 個既有檔：

- `BattleStageProfile.ts`／test
- `BattleActorPresenter.ts`／test
- `RefactorHandLayoutPolicy.ts`／test
- `RefactorBattleScene.ts`
- 視拆分結果調整 `RefactorBattleAnimationPlan.ts` 或新增 presenter；不得把更多 layout 細節塞回 Scene。

預估總量：8 個工作包、約 12–16 個 source/test 檔有新增或修改。這是 presentation refactor，不是單次座標修補。

## 實作批次與停止點

### Batch A — Graybox architecture

- 完成 W1、W2、W5 pure policies 與 unit tests。
- 用程序化矩形確認 4v4＋PEEK／FOCUS／HIDDEN layout。
- 停止點：直接交 1280×720、844×390 runtime composite QA，不生成資產。

### Batch B — Runtime presenters

- 完成 W3、W4、W6。
- 接入現有 actor assets 與指定的 1 frame＋5 family PNG；完成 crop/composite、selected／target／execute choreography。
- 卡牌來源只可升到 `runtime-trial` 供 QA；是否 approved 仍由 Art Director 另行決定。
- 停止點：正式站先驗證 battle-3-upper 4v4 壓力場與 boss-1。

### Batch C — Full route regression

- 完成 W7、W8。
- 七節點、勝敗、Boss、Console、音訊與 responsive QA。
- 只有 layout 已證明需要材質 skin 時，才另開 asset candidate batch；本 Phase 不生成。

## 自動驗收

- 4 人 formation 固定為 rear 2／front 2。
- 同排 scale 完全相同；front/rear scale ratio 在 1.08–1.15。
- 1–4 人雙方 slots 都在合法 zone 且 identity-independent。
- stable depth sort 與 foot anchor deterministic。
- `PLAYER_IDLE` 推導 `PEEK`，selected／target／animation／dispatch 映射正確。
- PEEK 露出比例在 45–55%；HIDDEN 全部 card bounds 位於 viewport 下方。
- 五張牌與 Confirm/Cancel 在 1280×720、844×390 profile 內不越界。
- 四個 enemy overhead layout 不互相重疊且不壓 Timeline／hand。
- `npm run test`、`npm run build`、`git diff --check` 通過。

## Browser QA

- 1280×720 與 844×390 都能辨識上二／下二，角色腳點在同一地面透視系統。
- 同排普通角色沒有忽大忽小；front row 僅比 rear row略大。
- 我方與敵方都能容納四人，actor、overhead HUD、target ring 不互相遮擋。
- idle 手牌確實是完整卡藏入下緣，不是壓扁的半張卡。
- selected card 完整抽出；其他牌下沉；Confirm 是唯一強 CTA。
- ACTION 開始前手牌退場，命中／傷害／Break 等結果是畫面主焦點。
- action 完成後 actor 精準返回 HOME，手牌恢復正確狀態。
- BG 不被拉伸、不新增黑色底板、不出現 Console error／404／黑框。

## 非目標

- 不生成或自行核准 UI、卡牌、角色、敵人、FX、BG 資產；只允許非破壞性接入使用者指定的既有 card source pack 作 runtime trial。
- 不更換 BG、音樂或音效。
- 不改 combat domain、卡牌效果、Timeline ordering、敵人 AI、數值平衡。
- 不新增角色 cut-in；未來若要做，必須另開 Character Master／runtime presentation batch。
- 不因參考圖存在 AP／EP／共享 HP 等資訊，就發明本遊戲不存在的規則。
- 不以角色 id、敵人 id 或單一 BG 寫死 formation 例外。
