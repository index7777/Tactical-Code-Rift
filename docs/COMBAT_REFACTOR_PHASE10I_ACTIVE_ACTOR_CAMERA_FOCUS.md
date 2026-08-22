# Phase 10i — Active Actor Camera Focus

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

在不增加任何角色 pose / sprite 資產的前提下，讓「輪到哪一名我方角色」有清楚但克制的演出，並保持 HUD 不隨戰場 zoom。

玩家決策節奏固定為：

`輪到角色 -> world camera 1.05 + actor 前踏 12~16px + focus ring -> 玩家選牌 / 選目標 -> 確認 -> ACTION / REACTION -> 回位 -> camera 1.0`

## 資產限制

本批不得新增角色姿勢或衍生角色圖。

允許的 presentation 手段只有：

- camera zoom / pan
- actor position tween
- actor alpha
- 現有 sprite scale 的極小調整（若需要）
- focus ring
- 既有 ready / attack / hit pose

不得新增 `focus`、`look-up`、`ready-alt` 或其他為了「輪到角色」而新增的角色美術。

## World / HUD 分層

- 戰場 BG、角色、敵人、actor-local target ring、戰鬥 FX 屬於 world layer。
- Timeline、party HUD、Enemy Intent、Target Preview、Shared Hand、buttons 屬於 HUD layer。
- Active actor focus 只 zoom / pan world；HUD 必須保持 screen-space 固定大小與位置。
- Scene 不得因 camera focus 改寫 domain / controller state。

## Active actor focus

只在我方玩家決策 phase 生效：

- `PLAYER_IDLE`
- `CARD_SELECTED`
- `TARGET_PREVIEW`

當 active actor 是我方角色時：

- world camera zoom 到 `1.05`。
- camera focus 僅輕微偏向 active actor，不把敵方或主要戰場裁出畫面。
- active actor 往戰場中央前踏 `14px`（允許 12~16px 的 tuning）。
- active actor 保留弱 focus ring。
- 其他我方角色可降低 alpha，但不可低到影響隊伍閱讀。
- 選牌 / 選目標 rerender 不得反覆重播「從 HOME 前踏」造成抖動。

## Action / Reaction transition

- 玩家確認後，ACTION / REACTION 從目前 focus position 開始，而不是瞬間跳回 HOME 再衝刺。
- 既有 target-relative close-contact ACTION 保留。
- 行動 resolution 完成後 actor 回 HOME。
- camera 在行動完成後回 `1.0` / world center，再由 Timeline 決定下一 actor。
- Enemy turn 不使用玩家 decision focus；world camera 應回 neutral。

## 與 Phase 10h BG 接入的關係

Phase 10h 負責把使用者提供的 `area01-rail-halt-hd2d-candidate-v2.png` 接進 QA runtime。Phase 10i 不改背景內容；camera focus 必須在該 BG 上重新驗證 ground contact、perspective 與 crop。

## 驗收

自動：

- `npm run build`
- `npm run test`
- focus policy tests：player decision phase / enemy phase / neutral phase。
- focus position test：我方 actor 前踏 14px，非 active actor 不位移。

Browser QA：

- 輪到我方 actor 時 world zoom 約 1.05，HUD 尺寸不變。
- active actor 明顯但不誇張地前踏；其他角色不跳位。
- 選牌與選目標期間 focus 穩定，不會每 click 重播造成畫面抖動。
- 確認後從 focus position 直接進 ACTION / REACTION。
- action 完成後 actor 回 HOME、camera 回 1.0。
- 1280x720 與 844x390 都不裁掉主要戰場資訊。

## 非目標

- 不新增角色美術資產。
- 不改卡牌、Delay、Guard、Intent 或 resolution 規則。
- 不做 camera shake / hit-stop polish。
- 不移除 legacy combat。
