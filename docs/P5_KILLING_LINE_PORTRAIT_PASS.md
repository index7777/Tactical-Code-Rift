# P5 Killing Line + Portrait Timeline Pass

## 目的
- 讓殺生線從「高速 pulse」改成較慢、持續、蓄勢待發的方向流。
- 讓 NOW 與雙軌時序改用角色立繪裁頭像，而不是縮小戰鬥 Sprite。

## 殺生線
- Focus 線完整循環：約 2.8 秒。
- 非 Focus 線完整循環：約 4.2 秒。
- 流動片段增加、變薄、降亮度，避免 LED / 資料傳輸感。
- 終點標記維持靜態，不再以呼吸放大搶注意力。

## Portrait Timeline
- 我方：PA/PD 使用 heroine portrait；PB 使用千景；PC 使用朧。
- 第一區現有怪物另外建立頭像裁切圖。
- NOW：68x68 頭肩裁切。
- Timeline：24px，一致使用同一 Portrait Source。
- Current node：29px + 金色外框。
- Gameplay initiative 計算完全不變，僅替換 HUD presentation。

## 後續
PA/PD 若未來有各自正式立繪，只需替換 portrait 圖與 mapping，不需要重寫 Timeline。
