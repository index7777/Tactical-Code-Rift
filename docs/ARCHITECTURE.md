# 專案架構

STATUS = AUTHORITATIVE

## 實際技術

- TypeScript（strict）
- Phaser 3.90
- Vite 6
- Vitest
- Web-first；Capacitor、Electron 與 Steamworks 尚未接入

## 權威程式根目錄

```text
src/core/             純規則、戰鬥、卡牌、路線、平衡
src/application/      應用流程與戰鬥解算協調
src/presentation/     Phaser 場景、輸入、HUD、演出與素材載入
public/assets/        runtime 衍生檔，不是母版或核准證明
assets/               來源、候選、recipe 與 provenance
build/web/            Vite／Vercel 輸出，不是權威來源
```

`core` 不得 import Phaser、DOM 或平台 SDK。Phaser Scene 應只負責生命週期與組裝，不直接承擔完整規則或所有素材路徑。

## 角色素材資料流

`src/presentation/assets/player-assets.json` 是目前唯一角色 runtime manifest。`PlayerAssetManifest.ts` 負責把 manifest 轉成 Phaser preload。角色身份由 `PlayerRoster.ts` 管理，站位順序與身份分開。

## 建置與驗證

- `npm run validate:assets`
- `npm run test`
- `npm run build`
- `npm run verify`

標準輸出為 `build/web`，避免舊 `dist/web` 被預覽或同步程式鎖住時導致建置失敗。Vercel 亦使用同一輸出。

## 仍需拆分

`BootScene` 仍過大。已抽出角色 manifest、遭遇設定、loading screen 與戰鬥音樂控制；下一步是 battle preload、動畫登錄、HUD 組裝、規劃輸入與回合執行。
