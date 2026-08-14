# 技術架構決策

## 目標與選定技術

同一套遊戲核心先以 HTML5 快速測試，之後封裝至 iOS／Android 與 Steam。Demo 第一優先是 15–20 分鐘「單輪」閉環。

- TypeScript（strict）＋ Phaser 3：2D 遊戲核心與呈現
- Vite：Web 開發與輸出 `dist/web`
- Vitest：純邏輯測試
- 手機後段：Capacitor，共用 Web bundle
- Steam 後段：Electron；Steamworks 僅存在 desktop adapter

這套 Web-first 技術最直接符合 HTML 優先驗證，且手機與 Steam 可重用輸出。代價是它不適合大型原生 3D／主機遊戲，但目前 2D 像素 ATB Demo 不受此限制。Capacitor、Electron、Steamworks SDK、簽章工具目前不安裝，等具體平台 task 才啟用。

## 程式邊界

```text
src/core          純 TypeScript：ATB、傷害、晶片、路線、輪迴、存檔模型
src/application   Use cases：開始一輪、結算、返航、裝卸晶片
src/presentation  Phaser scenes、HUD、動畫、輸入映射
src/infrastructure Web／Capacitor／Electron 的存檔、音效、平台 adapter
assets/source     原始資產與 provenance，不直接載入
public/assets     通過審核的 runtime 資產
dist              生成檔，不是 authoritative source
```

`core` 不得 import Phaser、DOM 或任何平台 SDK。鍵鼠、手把、觸控先轉成共同 game actions。平台功能以介面注入。

## 畫面、輸入與存檔

- 邏輯畫布 1280×720、16:9、FIT letterbox、pixel art 整數取樣。
- 手機預設橫向並避開 safe area；Steam 所有流程支援 XInput 與鍵鼠；Web 支援鍵鼠與觸控。
- tile、角色尺寸、方向數、動畫 FPS 要由 graybox 實測後鎖定，不從參考圖推定。
- 存檔分 `ProfileState`（永久）及 `RunState`（局內），帶 schema version。正式版 Web/手機/桌面分別使用 IndexedDB、Capacitor、Electron userData adapter。

## Canonical commands 與發布順序

1. `npm run test`：核心規則。
2. `npm run build`：生成可直接部署的 HTML 版本。
3. Mobile task：同 bundle 放入 Capacitor shells，測 safe area、觸控、暫停／恢復。
4. Steam task：同 bundle 放入 Electron，加入手把、Overlay、成就、雲存檔 adapter。
