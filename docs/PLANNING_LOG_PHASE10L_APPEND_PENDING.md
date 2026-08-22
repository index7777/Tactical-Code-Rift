TEMPORARY_APPEND_RECORD

The canonical append was intentionally not applied here. This file exists only to preserve the Phase 10l append text while `docs/PLANNING_LOG.md` is restored byte-for-byte to its append-only pre-edit blob after a connector full-replacement introduced two unintended historical-line changes.

## 2026-08-22 — Combat refactor Phase 10l card master presentation

狀態：`CI_VERIFIED_BROWSER_QA_PENDING`

- 使用者以既定戰鬥 UI 母版校正 Phase 10k：手牌不能只是縮小舊 rectangle，必須恢復 card anatomy、family identity、selected hierarchy，以及卡牌／調度／確認控制的視覺分工。
- 採用五種穩定 family：quick 冷藍、heavy 朱紅、guard 青綠、disruption 紫、break 金橙；先以程式化 frame / mark 建立結構，不因 runtime 資產目錄已有 card art / frame / icon 就批量接入。
- `HandPresenter` 提供 effect snapshot 與最多兩行 player-facing 摘要；卡面固定 family mark、卡名、效果區與獨立 `Delay N` footer，不再以 target-rule enum 作主要卡面文字。
- selected skill 上浮／略放大／加 family glow；其他牌降低層級。調度選中的棄牌使用較弱的獨立標記，不冒充 skill selected。
- `調度` 改成獨立 utility panel，顯示 `交換 0–2 張 / Delay 3`；CARD_SELECTED／TARGET_PREVIEW 使用獨立 command panel 顯示目前卡名、選擇目標／目標已確認、確認執行／取消。
- Phase 10k 的 adaptive stage 與 collapsed/expanded hand 架構保留；BG、角色站位、combat domain、audio policy、enemy roster 本批均不更動。
- CI run 343 首次 build 因舊 animation-plan test fixtures 缺少新增的 `effect/effectLines` view 欄位而失敗；更新 fixture 後 run 344 build + test 通過。後續 docs/progress commit 的 run 345 亦通過。
- Browser QA 尚未完成：需以 1280×720／844×390 實機確認五張牌是否像同一套卡牌、Delay footer 能否快速橫向掃讀、selected 上浮／glow 是否足夠、調度／確認是否與卡牌明確分離，並回歸 Phase 10k 角色腳點與 camera focus。
