# Phase 10g — Floating HUD / Frame Removal

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

依目前 browser QA 與使用者確認的最終方向，新版戰鬥不再把上方 Timeline 與下方 Shared Hand 當成兩塊厚重固定框架。BG 應保持完整可見，角色站位、尺寸與場景透視以完整戰場構圖為優先，HUD 只以浮動資訊元件附著在畫面上。

本批只調整 presentation frame ownership，不改 combat core、Controller、Timeline 規則、手牌規則或 target legality。

## 前置狀態

- Phase 10f 已完成近身接敵、非千景 Guard 候選限制與 battlefield 玩家重複姓名／HP 清理。
- 左側 party HUD 仍承擔我方名稱／HP，保留。
- 右側 enemy Intent panel 仍保留為 compact floating panel。
- 使用者指定 `area01-rail-halt-hd2d-candidate-v2.png` 為優先 BG，但該檔尚未存在於目前 branch 的 public runtime asset path；本批不得把不存在的 URL 寫進 preload。

## Frame removal

移除以下 full-width / large-block 背板：

- 上方 `layout.timeline` 整塊深色矩形。
- 下方 `layout.hand` 整塊深色矩形。

保留：

- 每個 Timeline node 自己的小卡片背景與 active highlight。
- 每張手牌自己的 card background。
- 左側 party HUD panel。
- 右側 Intent panel。
- Target Preview 的局部半透明資訊板。

因此 Timeline / Hand 仍可讀，但不再把 1280×720 世界切成上／中／下三個 UI 帶。

## Battlefield ownership

- `drawBattlefieldBackground()` 仍鋪滿 1280×720。
- Player / enemy HOME、ACTION、REACTION 位置不因 Timeline / Hand 大框存在而被裁切。
- 後續換成 `area01-rail-halt-hd2d-candidate-v2.png` 時，以同一 full-canvas 邏輯重新做透視／scale browser QA。

## HUD readability

移除大框後，Timeline node、手牌卡、Preview、Party、Intent 必須各自維持足夠局部對比，不依靠整條黑底取得可讀性。

- Timeline node 本身維持不透明度與外框。
- 手牌卡本身維持背景與外框。
- phase / active actor 文字可保留於左上，但不得重新建立整條 header bar。
- 不新增 persistent tutorial、legend 或舊 round-planning panel。

## 驗收

自動：

- `npm run build`
- `npm run test`
- 不改 domain / Controller tests 的既有語意。

Browser QA：

- BG 從畫面頂端到下緣連續可見，不再被 top/bottom full-width dark bands 切斷。
- Timeline node 與手牌仍清楚可讀、可點。
- 左側 Party HUD 與右側 Intent 維持 compact floating panel。
- 角色站位看起來屬於場景，而不是被放在 UI 中央帶。
- 1280×720 / 844×390 都不因移除 frame 造成文字／卡牌不可讀。

## 非目標

- 不在本批導入不存在的 BG asset。
- 不改 Guard、Delay、Timeline、Intent 或 Shared Hand 規則。
- 不做最終美術 polish、camera shake、audio mix 或 legacy removal。
