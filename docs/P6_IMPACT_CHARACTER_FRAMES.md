# P6 — Impact & Character Frame Pass

## 目標

把戰鬥從「角色滑到目標旁 + 小型 FX」提升成明確的 JRPG 技能節奏：

`待機 → 蓄勢 → 接敵 → 主攻擊幀 → 命中停頓 → 受擊幀 → 回位`

本輪不改任何戰鬥規則、卡片數值、速度、交鋒判定或目標規則。

## 角色動作幀

### 千景 / 朧

正式使用現有 Character Master 的多張 runtime pose：

- idle-a / idle-b：低頻 620ms 循環，保持待機生命感，不做高頻抖動。
- ready：接敵前蓄勢。
- attack-a：突進 / 揮擊前半。
- attack-b：接觸點主攻擊幀。
- hit-a / hit-b：受擊兩段。
- down：獨立死亡姿勢，沿用 P4 修正，不套 52% fallback 縮放與 78° 旋轉。

千景與朧仍然維持不同節奏：

- 千景：長蓄勢、較慢接敵、Line Slash、較長 hit-stop。
- 朧：短蓄勢、高速切入、Arc / Cross Slash、殘影。

### 共用女主 runtime

新增 idle-a / idle-b 與 attack-a / attack-b 的低成本插值幀，讓 PA / PD 不再完全站死。
這些是 runtime 過渡素材，不取代未來正式 Character Master 的手繪 key pose。

## 斬擊與衝擊

### Arc Slash

用於快斬、朧、接力：

- contact point 半徑提高。
- 刀面有明顯寬度，不是單線。
- 145ms 左右完成展開與消散。
- 不往敵人身後飛，不作 projectile。

### Line Slash

用於重斬、破甲、千景：

- 主斬線約 470px 級，副斬線分層延遲出現。
- 允許大幅超過角色 bounding box。
- 以接觸點為中心，表現「畫面被切開」而非小月牙。

## Hit-stop / Camera Punch

- 快斬：約 68ms
- 普通：約 88ms
- 重斬：約 132ms
- 破招 / 崩勢級：約 152ms
- Clash：約 120ms

命中瞬間加入非常短的 zoom punch + shake，再快速回到戰場鏡頭。

## Clash

交鋒同樣套入 ready → attack-a → attack-b，破招追擊也不再只換一張 strike 圖。
敗方若為玩家角色，使用 hit-a / hit-b 讀出受擊節奏。

## 驗收重點

1. 千景的薙刀攻擊是否有「蓄勢後橫切整個空間」的重量。
2. 朧是否像高速切入，而不是角色平移後亮一下。
3. 快斬與重斬在不看卡名時是否能靠節奏與 FX 區分。
4. 角色待機時是否有生命感，但不影響殺生線閱讀。
5. 斬擊不得出現穿越目標後飛到背後的舊半圓 projectile 行為。
