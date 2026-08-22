# Combat Refactor Phase 10p — Card Master Asset Reuse

STATUS = SUPERSEDED_BY_PHASE10Q_GENERATED_ASSET_PRODUCTION
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 狀態修正

本文件保留作過程紀錄。使用者已明確校正：需求是安排生成新的 UI / UX / HUD 美術資產，不是以既有 SVG 當最終母版視覺。

因此本文件原本採用的 quick / heavy / guard / delay / break SVG，只能保留為 temporary fallback / semantic reference，不再是最終 art target。

正式資產生產方向已由 `docs/COMBAT_REFACTOR_PHASE10Q_GENERATED_BATTLE_UI_ASSET_PRODUCTION_PLAN.md` 取代。

仍有效的限制：

- 禁止角色 × 卡牌素材。
- 禁止每個 card definition 一張插畫。
- 禁止 selected / disabled / hover 等 state-specific 圖片。
- 卡牌仍須由 reusable master pieces + runtime text/data 組裝。
- existing SVG 不因存在就自動進 final runtime。

Phase 10p 已完成的 `CardFamilyAssetPolicy` / preload wiring 可保留作 fallback 技術路徑，但不能作為「不生成新卡牌美術」的理由。下一批依 Phase 10q 先生成 neutral card frame 與五張通用 family key visuals，再做 runtime composite QA。
