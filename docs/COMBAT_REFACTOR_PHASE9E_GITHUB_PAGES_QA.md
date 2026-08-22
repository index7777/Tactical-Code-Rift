# Phase 9e — GitHub Pages QA Hosting

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目標

Vercel preview 因 Hobby build-rate limit 無法產出 current-head QA deployment，因此本批把 `combat-refactor-v1` 的 feature-flag QA hosting 改由 GitHub Pages 提供。

這是 QA hosting 變更，不是 production default cutover，也不改任何 combat domain / application / presentation 規則。

## 部署契約

- 新增獨立 GitHub Actions workflow，只對 `combat-refactor-v1` push 與手動 dispatch 執行。
- workflow 以 Node 20 執行 `npm ci` 與 `npm run build`。
- Pages artifact 必須直接使用既有 Vite build output `build/web`。
- 使用 GitHub 官方 Pages actions：`actions/configure-pages`、`actions/upload-pages-artifact`、`actions/deploy-pages`。
- workflow 具備最小必要權限：`contents: read`、`pages: write`、`id-token: write`。
- 若 repository Pages 尚未啟用，`configure-pages` 允許由 workflow 啟用 GitHub Actions Pages source。
- Vite 目前 `base: './'`，因此不得為 Pages 再建立第二套 asset path 規則。

## QA URL

部署成功後，以 GitHub Pages project-site URL 的 feature flag 入口驗證：

`https://index7777.github.io/Tactical-Code-Rift/?combat-refactor=1`

沒有 query flag 時，仍必須走 legacy `BootScene`。

## 驗證

GitHub Pages workflow 成功後才進 browser QA：

- 1280×720：單一 Timeline、5 張共享手牌、Target Preview、Confirm、enemy action、調度 0～2、next actor cycle。
- 844×390：同一互動流程可用，且 Phaser FIT scaling 不造成必要控制項無法點擊。
- 友軍 target：千景 `any-ally` Guard 可選活著的友軍。
- 敵軍 target：攻擊 / disruption / break 只能指向活著敵軍。
- 不帶 `combat-refactor=1` 時不得切換新版 runtime。

## 非目標

- 不切 production default runtime。
- 不移除 legacy combat。
- 不新增 production enemy AI。
- 不改卡牌、傷害、Delay、Guard、專精或 Timeline 規則。
- 不以 Pages hosting 成功取代 browser interaction QA。
