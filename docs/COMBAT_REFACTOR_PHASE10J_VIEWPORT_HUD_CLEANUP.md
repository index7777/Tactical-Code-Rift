# Phase 10j — Viewport cover / battlefield composition / floating HUD cleanup

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

依 current-head GitHub Pages 截圖修正新版戰鬥的 presentation 問題。這一批不改 combat core、不增加美術資產、不更換目前已接入的 HD-2D BG；只整理 viewport、角色舞台、interaction affordance 與 floating HUD，使背景／角色重新成為畫面主體。

## 實機問題

1. 寬螢幕使用 `Phaser.Scale.FIT` 時左右出現黑色 letterbox。
2. 四名我方集中在畫面左側，silhouette 分離不足，中央戰場留白過大。
3. actor ring 在非互動狀態仍常駐，像 debug collider。
4. Party HUD 與 Intent panel 面積高於資訊量。
5. Shared Hand 卡片過高，過度佔用戰場高度。
6. Intent target 必須永遠顯示 runtime 已公開的目標名稱，不允許只有「目標」但值空白。
7. active actor focus 必須保留 Phase 10i 的 world-camera + 前踏語意，HUD 不跟 camera zoom。

## Viewport policy

- 保留 1280×720 logical design coordinates。
- 一般桌面／中寬橫向 viewport（viewport aspect <= 1.95）使用 cover / envelop 行為消除左右黑柱。
- 超寬或窄高風險 viewport 保留 FIT，避免為消黑柱裁掉 Timeline／Shared Hand 操作區。
- cover 模式允許裁切少量上下 world/HUD 邊緣，因此 top/bottom 互動元件必須留安全距離。
- 不拉伸 canvas，不改 BG 圖內容。

## Battlefield composition

我方 HOME 由四人擠成兩團，改成更清楚的前後錯位戰列；保持玩家在左、敵人在右：

- 後排 x 約 330–370。
- 前排 x 約 430–490。
- y 繼續驅動 perspective scale。
- enemy 基準 x 約 930–980。
- 角色不得排成直線，但 silhouette 需彼此分離，腳點以目前 HD-2D BG 的月台地面為準。

## Actor affordance

- DEFAULT 存活角色：不畫 ring。
- active player：弱 focus ring。
- legal target candidate：弱候選 ring。
- selected target：強 selected ring。
- dead / non-targetable / non-active：不顯示互動 ring。
- ring 是 interaction feedback，不是角色常駐裝飾。

## Floating HUD

### Party rail

- 縮成 slim rail，只保留四人生命讀值；不得用大面積空白框。
- 本批不強制接 portrait 或新增狀態 icon。

### Intent

- 縮為 compact card。
- 顯示 `技能名 / 目標 / 傷害 / 延遲`。
- targetIds 有值時必須經 `actorDisplayName()` 顯示；空 target 才顯示 `—`。

### Shared Hand

- 保留五張共享手牌與調度。
- 降低卡高與底部占用；卡名、Delay 為主要層級，類型與 target 為次要層級。
- 不因 assets 目錄已有 card art / frame / icon 就在本批硬接。

### Timeline

- 保留既有單 Timeline，不回到 full-width panel。
- active node 繼續高亮；本批只做必要安全區與 spacing 調整，不改排序語意。

## 資產邊界

- BG 保持 current-head 接入版本，不重新命名、不替換、不升級 approved。
- 玩家角色繼續只走 `player-assets.json` / `PlayerAssetManifest`。
- 本批不擴充 enemy roster、不接 route-map PNG、不批量接 card/foreground/FX 素材。
- 音訊 asset correctness 另批處理；不把 viewport cleanup 與 BGM policy 改動混在同一 commit。

## 驗收

自動：

- `npm run build`
- `npm run test`
- viewport mode policy tests：16:9 / current desktop ratio 選 cover；超寬 ratio 保留 FIT。
- actor affordance tests：DEFAULT 不要求 ring；focus/candidate/selected 才有 ring。
- layout tests：四名 HOME silhouette x 間距與 HUD compact bounds。

Browser QA：

- current desktop viewport 不再看到左右黑柱。
- 1280×720 與 844×390 的 Timeline、Intent、Party rail、hand 都可操作且不被裁切。
- 四名我方 silhouette 清楚分離，腳點不浮空；敵人仍在右側。
- 非互動角色沒有常駐 debug-like ring。
- Intent 目標名稱可讀。
- active actor camera 1.05 / 前踏 / focus ring / 回位仍正常。

## 非目標

- 不改 damage / Delay / Timeline / Guard / Intent 規則。
- 不更換 BG。
- 不增加角色 pose。
- 不接完整 EncounterCatalog 多敵人。
- 不移除 legacy combat source。
