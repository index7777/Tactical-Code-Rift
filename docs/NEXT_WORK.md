# 下一階段交接清單

STATUS = AUTHORITATIVE_NEXT_WORK

Updated: 2026-08-21. Baseline: `main` at or after `a0e8d03`.

這份文件供新 Codex 對話直接接手。開始工作前依序讀取 `AGENTS.md`、`CAPABILITY_REGISTRY.md`、`docs/README.md`、本文件，以及每個工作項目列出的權威規格。不得使用 `docs/archive/` 作為目前設計輸入。

## 已完成，不要重做

- 正式角色 ID 為 `rin`、`chikage`、`oboro`、`mo`；PA／PB／PC／PD 與 A／B／C／D 不是角色身份或永久站位。
- Area 01 七個戰鬥節點已有可進入的 encounter hook；最近一次正式 QA 的敵人數為 2／3／3／4／4／3／3。
- F1「雨夜沿線月台」、F2「山壁切通」、F3「林間參道」、F4「終點月台」已接入對應節點，狀態仍是 `runtime-trial`。
- `雨暮驛・站守` 文字與視覺母版 v2 已由 Art Director 核准；runtime PNG 為 `public/assets/battle/generated/monsters/rainfall-ridgeline/rain-boss-master-runtime-v1.png`，顯示高度 158px。
- 敵人共用單一母版處理待機、攻擊、受擊與崩勢；死亡使用 runtime 向上碎散／淡出，不製作 down 圖。
- 最近一次 `npm run verify` 通過：31 個測試檔、120 項測試；production bundle 為 `index-C8zsUK8I.js`。

## 執行順序

### P0-1：修正現況文件與驗收語意

目的：消除「Boss 仍是 SVG 佔位圖」及「敵人死亡必須倒地」等過期敘述。

範圍：

- 更新仍宣稱 `rain-boss` 未生圖／未核准的程式註解與權威文件。
- 將敵人死亡驗收改為消散；玩家死亡規則維持現況，兩者不可混寫。
- 檢查 `PROJECT_AUDIT_2026-08-21.md`：保留為當日稽核快照，不直接改寫歷史發現；在本文件與 `PROJECT_STATUS.md` 說明哪些項目已解決。

完成條件：`rg -n "rain-boss.*placeholder|rain-boss.*尚未|Boss.*no approved master" src docs` 不再命中目前狀態文件或 live-code 註解；歷史紀錄可保留但必須明示日期／快照性質。

### P0-2：Boss 與七節點實機 QA

權威輸入：`docs/monsters/rain-boss.md`、`docs/areas/area-01-encounter-bg-plan.md`、`docs/art-bible.md`。

必驗畫面：

- `boss-1` 於 1280×720 與 844×390：站守 158px 高度、完整信號刀、腳底 baseline、HUD、三名敵人、殺意線和卡牌區均不重疊。
- 站守受擊、崩勢、兩招共用母版演出，以及死亡碎散／淡出。
- 七個 encounter 均能由直接 QA 入口建立：一個 canvas、四名玩家、正確敵人數、round 1、非 busy，素材無 404、黑框或 console error。
- F1–F4 在兩種尺寸的中央戰鬥區與地標都保持可讀。

失敗時：依 `docs/art-bible.md` 記錄 `runtime-overlap`、`pivot-failure` 等明確代碼；不得因 build 通過就宣稱視覺核准。

### P0-3：定案並修正戰鬥規則衝突

權威輸入：`docs/CURRENT_COMBAT_SPEC.md`、`docs/COMBAT_ACCEPTANCE_CHECKLIST.md` 與 source/tests。

逐項處理：

1. 崩勢是否追加 HP 傷害，以及 balance 是否重置。
2. Crusher 厚甲應在破甲攻擊或非破甲攻擊時消耗。
3. Crusher 面對非破甲卡的 clashPower −1 是否為正式規則。
4. 掩護卡 `shield=9` 是否真的進入 runtime 結算。
5. 建立正式棄牌固定情境並完成自證。

每項都必須先有規格決策，再同步 source、tests 與驗收表；不可只改其中一層。

### P1-1：完成真正的 Boss 規則

目前站守只有專用外觀、背景、BGM、兩招與節點編成，仍沿用一般敵人框架。下一批需定義：

- 專屬 HP／架勢與數值來源。
- `雨斬・終`、`山影連刃` 的循環、AI 優先級與反制窗口。
- 是否需要階段變化；若需要，只使用 runtime 眼縫／閉塞器／信號框微光，不新增角色圖。
- 辻傘與縊鬼死亡後，站守及剩餘隨從的行為。
- Boss 勝利／失敗後的正式路線收尾。

不得以增加動畫或單純提高 HP 取代 Boss 機制設計。

### P1-2：玩家素材生產品質

- Rin、Chikage、Oboro 的 128×128 action source 仍是 prototype，不得插值後宣稱高解析。
- 統一四名玩家的來源畫布、腳底 pivot、顯示高度、邊緣處理與細節密度。
- 加入 alpha 小碎點、色邊、透明 padding、atlas bleed 與 duplicate runtime key 檢查。
- 先以戰鬥合成畫面判斷最明顯的角色，再依 Art Pipeline 一次處理一名；不得批量生成後自動核准。

### P1-3：正式環境來源與路線清晰度

- 路線與 F1–F4 現有來源約 1672×941，足以 runtime trial，但不符合原生 2K／4K production gate。
- 路線節點框 256×256、圖示 160×160，均為縮小顯示，來源解析度不是主要模糊原因。
- 844×390 的整體 canvas 下縮與 5–6px 連接線才是小畫面柔化風險；先做實機比較，再調線寬／對比，不要先重畫節點。
- 正式替換後移除 release manifest 中的 `candidate`／`runtime-trial` 命名，並保留 source → approved → runtime 的 provenance 鏈。

### P1-4：發布授權閘門

需補齊可稽核證據：

- Rin、Chikage、Oboro、Mo：作者／擁有人、原始來源、修改權與商業散布權。
- Area 01 route-map UI packages：生成或交付來源、使用條款與 Art Director 最終決策。
- World 01 normal／Boss music：所有權或書面散布授權。
- 使用者提供的怪物 master：來源與衍生／發布權。

在證據完成前，只能稱為 prototype 或 runtime trial，不得稱為 release-cleared。

### P2：架構與自動品質閘門

- 繼續拆分 `BootScene.ts`：asset manifest、scene assembler、planning input、execution presenter。
- 將怪物、背景、FX、audio 的散落路徑納入 typed manifest；檢查 key 唯一、檔案存在、尺寸與 alpha。
- 增加 route-to-battle smoke、1280×720／844×390 screenshot baseline、console／network failure gate。
- 逐步將剩餘 runtime SVG 遷移或驗證為可靠格式，排除 WebGL `texImage2D: bad image data` 警告。
- 分離 inbox／source／candidates／approved／runtime；`.tmp/` 只存未追蹤 QA 輸出。

## 每批共同驗證

```text
npm run verify
git diff --check
git status --short
```

視覺或場景變更另需：

- 實際 Phaser scene，不接受只看來源圖。
- 1280×720 與 844×390 證據。
- 無 HTTP 404、黑色素材框或 console error。
- 將採用決策、批次內容與驗證結果追加至 `docs/PLANNING_LOG.md`。

## Git 與工作區

- `main` 是跨電腦共享與 Vercel production branch。
- 不得提交 `.tmp/`。
- 開始前確認 worktree；不得覆蓋使用者或其他對話的未提交修改。
- 完成安全且可驗證的一批後才 commit／push；文件敘述必須與該 commit 的 source 一致。
