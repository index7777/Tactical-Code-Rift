# P7 Combat Readability + Bug Fix

## 目標
- 移除規劃角色腳下光圈，改用角色輪廓外框。
- 頭像改成真正透明背景，並拆成 NOW 與 Timeline 兩套裁切。
- 殺生線降速，讓規劃階段更像「蓄勢待發」而不是資料流。
- 恢復護符的可讀性。
- 修正敵方崩勢重複提示。

## 改動
### Current Actor
- Planning current actor 不再顯示腳下青色 ellipse。
- 使用 8 向 2px 青白 silhouette outline。
- 非當前我方角色輕微降權重。

### Portraits
- 新增 `*-current.png`：NOW 頭肩裁切。
- 新增 `*-timeline.png`：Timeline 臉部裁切。
- 清除 heroine 的棋盤背景與千景/朧黑底，全部以透明 PNG 輸出。

### 殺生線
- Focus 線完整流動週期：5.0 秒。
- 普通線完整流動週期：7.6 秒。
- 流動紋理更短、更細、更暗，避免 pulse/LED 感。

### 護符
- Fighter HUD 加回獨立 cyan shield bar。
- `shield + tempShield` 都會顯示；臨時護符使用更亮的青白色。
- 空護符仍有暗色 track，避免玩家以為系統消失。

### 崩勢重複提示
- `ActionPresenter.cancel()` 以 actor key 去重；同一輪同一角色只播放一次崩勢演出。
- `damage()` 不再另外彈 `崩勢！` 文字，也不再同時播放第二套 collapse FX。
- 崩勢主視覺由 `ActionPresenter.cancel()` 單一負責。

## 未改玩法
速度、交鋒、截刀、卡牌數值、架勢規則、護符吸收順序均未變更。
