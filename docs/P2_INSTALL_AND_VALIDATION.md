# P2 安裝與驗證

直接把替換包內容合併到專案根目錄並覆蓋同名檔案，不要刪除整個 src。

本批程式檔：
- src/presentation/battle/ActionPresenter.ts
- src/presentation/battle/ClashPresenter.ts
- src/presentation/scenes/BootScene.ts
- src/presentation/scenes/JourneyScene.ts

驗證命令：
`npm ci && npm run test && npm run build`

本執行環境嘗試 `npm run build` 時，現有 node_modules 無法解析 phaser/vitest，因此無法完成完整 dependency-based build。額外發現並移除了本批唯一可辨識的 noUnusedLocals 問題（未使用 bladeArc）。

特別回歸：ClashPresenter.focusCamera 維持 `(x, y, zoom = 1.14, duration = 190)` 四參數 signature，避免先前 Vercel TS2554。
