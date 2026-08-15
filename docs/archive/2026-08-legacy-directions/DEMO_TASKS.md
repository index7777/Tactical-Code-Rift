# Demo 階段與 Tasks

每個 task 都要能由 `npm run dev` 在 HTML 驗收；核心規則要有自動測試。`P0` 未定案前不大量製作正式資產。狀態：`READY` 可做、`BLOCKED` 有依賴、`LATER` 平台後段。

## Phase 0：玩法決策與技術基線

| ID | 狀態 | Task | 依賴 | 驗收標準 |
|---|---|---|---|---|
| P0-01 | DONE | ATB 時序 graybox：統一敵我 ATB、Active/Wait、選招與動畫暫停 | 無 | 規格、自動測試及互動 graybox 已完成 |
| P0-02 | READY | 傷害、防禦、暴擊、治療、護盾、打斷與狀態公式 | P0-01 | 每個公式有上下界與表格測試 |
| P0-03 | READY | 四角色、三小怪、精英與 BOSS 技能卡／AI | P0-02 | 每招有目標、倍率、時序、狀態、AI 優先級 |
| P0-04 | READY | 基礎技能與晶片關係；永久晶片配裝取捨 | P0-02 | 消除「兩槽剛好兩顆」的假選擇 |
| P0-05 | READY | 路線圖、seed、AP、失敗、退出與保留矩陣 | 無 | 三條完整勝敗／中斷流程通過評審 |
| P0-06 | BLOCKED | 局內經濟與最小臨時晶片池 | P0-04～05 | 至少 12 晶片、3 道具；來源與消耗閉合 |

## Phase 1：HTML 垂直切片

| ID | 狀態 | Task | 依賴 | 驗收標準 |
|---|---|---|---|---|
| P1-01 | READY | Web 骨架、核心邊界、路線 smoke test | 無 | `npm run test`、`npm run build` 通過 |
| P1-02 | DONE | input action map 與響應式 HUD | P1-01 | 鍵鼠、手把、觸控共用 game actions；FIT HUD 完成 |
| P1-03 | DONE | ATB graybox：1 英雄 vs 1 敵 | P0-01、P1-02（P0-02/03 最終數值仍後續鎖定） | Active/Wait、勝敗、蓄力與打斷均可見 |
| P1-04 | BLOCKED | 四人戰鬥與敵人 AI | P1-03 | 普通戰從進場到結算無空按鈕 |
| P1-05 | BLOCKED | 5–7 節點 Zone 原型 | P0-05、P1-01 | seed 重現；精英倒二、BOSS 最後、不連續商店 |
| P1-06 | BLOCKED | 存檔與輪迴 | P0-05、P1-04 | reload 可恢復；保留／清除符合矩陣 |
| P1-07 | BLOCKED | 飛空艇晶片配置 graybox | P0-04、P1-06 | 可配裝、阻擋非法配置、開始一輪 |
| P1-08 | BLOCKED | 事件／寶物／商店各一個切片 | P0-06、P1-05 | 每類節點均能結束並產生可追蹤結果 |
| P1-09 | BLOCKED | 15–20 分鐘首個 HTML 閉環 | P1-04～08 | 配置→路線→BOSS→返航完整可玩 |

## Phase 2：Demo 內容完整化

| ID | 狀態 | Task | 依賴 | 驗收標準 |
|---|---|---|---|---|
| P2-01 | BLOCKED | 10 個事件與觸發／去重規則 | P1-08 | 固定 seed 覆蓋所有結果與隱藏事件 |
| P2-02 | BLOCKED | 怪物編成、精英、BOSS 狀態機 | P1-04 | 普通難度完整通關且無 soft-lock |
| P2-03 | BLOCKED | AP 與 8 顆永久晶片 | P0-04、P1-06 | 裝備者成長、滿級、溢出規則正確 |
| P2-04 | BLOCKED | 12+ 臨時晶片、商店與經濟 | P0-06、P1-08 | 每輪至少形成 3 種可辨識構築 |
| P2-05 | BLOCKED | 開場、教學、返航、勝敗及結尾 | P1-09 | 首輪／重玩觸發不重複、不漏播 |
| P2-06 | BLOCKED | 困難／地獄機制與解鎖 | P2-02～04 | 難度不只加 HP；各有機制驗收表 |

## Phase 3：資產與品質

| ID | 狀態 | Task | 依賴 | 驗收標準 |
|---|---|---|---|---|
| P3-01 | BLOCKED | 鎖定 pixel spec、manifest 專案化 | P1-09 | 尺寸、方向、FPS、license/provenance 可驗證 |
| P3-02 | BLOCKED | Lv0 runtime 資產替換 graybox | P3-01 | 必要畫面無 placeholder；來源合規 |
| P3-03 | BLOCKED | 動畫、VFX、音樂、SFX | P3-02 | 音量可調、失焦靜音、無素材缺失 |
| P3-04 | BLOCKED | UX、accessibility、效能 | P2、P3-03 | 中階手機 720p 目標 60fps；資訊不只靠顏色 |
| P3-05 | BLOCKED | QA、平衡、存檔遷移、RC | P3-04 | 無 P0/P1 bug；舊存檔可遷移 |

## Phase 4：手機與 Steam

| ID | 狀態 | Task | 依賴 | 驗收標準 |
|---|---|---|---|---|
| P4-01 | LATER | Capacitor Android shell／實機 | P3-04 | 安裝、返回鍵、暫停恢復、safe area 正確 |
| P4-02 | LATER | Capacitor iOS shell／實機／簽章 | P4-01、macOS/Xcode | 安裝、生命週期與觸控正確 |
| P4-03 | LATER | Electron desktop shell | P3-04 | Windows build、全螢幕、手把、存檔正確 |
| P4-04 | LATER | Steamworks adapter | P4-03、Steam App ID | Overlay、成就、雲存檔、離線模式通過 |
| P4-05 | LATER | 平台 RC 與法務檢查 | P4-01～04 | 隱私、授權、商店素材、安裝測試完成 |

## 下一個建議 Task

執行 `P0-01 + P1-02 + P1-03`，先用 graybox 驗證 ATB 節奏。現公式讓速度 8 約 20 秒才滿條，極可能不適合 15–20 分鐘 Demo；越早實測，越少重做。
