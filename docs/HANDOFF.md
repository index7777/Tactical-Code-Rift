# Tactical Code Rift 接手文件

STATUS = AUTHORITATIVE_HANDOFF

更新時間：2026-08-17（Asia/Taipei）
基準 commit：`745cd65`，但目前工作樹包含大量尚未 commit 的有效實作與資產，**不得 reset、checkout 或清除 untracked files**。

## 新對話第一步

依序完整讀取：

1. `AGENTS.md`
2. `CAPABILITY_REGISTRY.md`
3. `docs/README.md`
4. 本文件 `docs/HANDOFF.md`
5. 依任務路由到 `CURRENT_COMBAT_SPEC.md`、`YOKAI_RAILWAY_DEMO_PLAN.md`、`art-bible.md` 或指定角色／區域規格

禁止把 `docs/archive/` 當現行設計；除非使用者明確要求歷史比較。新決策、批次與驗證結果必須追加到 `docs/PLANNING_LOG.md`。

## 專案與執行方式

- Stack：TypeScript 5.9＋Phaser 3.90＋Vite 6＋Vitest。
- 權威 source：`src/`；build 輸出：`dist/web/`。
- 安裝完成後常用指令：`npm run dev`、`npm run test`、`npm run build`。
- 本地戰鬥驗證常用：`http://127.0.0.1:8878/index.html?draw-proof=1`。
- 旅程驗證：`?journey=1`；怪物固定證據：`?monster-proof=swift|crusher|hexer`。
- 邏輯畫布固定 1280×720；手機驗收使用 844×390 橫向 FIT。
- 最新驗證：`npm run test` 為 27 files／109 tests 全通過；`npm run build` 通過；`git diff --check` 無 whitespace error。Vite 仍有單一 bundle 大於 500 kB 的非阻擋 warning。

## 不可變更的產品方向

- 回合制＋每回合重骰速度，不是 ATB／CTB，也沒有共享 AP。
- 公開敵方意圖，以紅色「殺生線」表達因果；玩家用迎擊、截刀、掩護、牽制與接力改寫或利用意圖。
- 玩家在左、敵人在右；雙方沿 Y 軸錯層，行動時只沿橫向進入交鋒點，不製作八方向移動。
- 上方時序條保留，只顯示角色與最終時序；不塞卡名、公式或教學文字。
- 中央戰場保留給交鋒、追擊、擊退、接力與 FX；底部卡牌約占高度 20–25%。
- 場上角色旁不顯示姓名、頭像或身份框，只保留命脈、護符與刀鐔架勢。
- 場景不是固定車廂戰：包含車頂、停靠迎擊與離車探索。第一區為「雨暮山線」。
- 敵人現有免費 prototype 資產保留，不要因玩家角色換圖而一起替換。

完整規則以 `docs/CURRENT_COMBAT_SPEC.md` 為準，殺生線／HUD／演出以 `docs/YOKAI_RAILWAY_DEMO_PLAN.md` 為準。聊天摘要不能覆蓋這兩份權威文件。

## 現行戰鬥核心摘要

- 每名存活角色每輪一個基礎行動；全隊共用牌庫，手牌補至 5，未使用牌保留。
- 通用卡型：快斬、重斬、破甲、堅守、掩護、接力、整備、牽制；角色能力確定前不得加入角色專屬牌。
- 正面迎擊不要求比敵人快；其他角色替隊友截刀時，角色速度＋卡片時序必須高於敵方最終時序。到場後再比較卡面交鋒威力。
- 堅守只能指定自己，原地防守，不形成交鋒、不改殺生線。
- 掩護逐一綁定敵方技能槽；被截線保留敵人到截刀點的紅色前段，不能整組殺生線一起消失。
- 相殺無接力時快速彈刀後雙方回槽；有接力時敵人保持交鋒點僵直，前一人退場與接力者進場重疊，補刀結束才死亡／擊退／回槽。
- 破招＝單次交鋒落敗；崩勢＝架勢歸零並取消本輪尚未執行行動；斷命＝HP 歸零並移除後續節拍及目標資格。
- 死亡者已提交但未執行的卡仍消耗進棄牌堆，不退回手牌。
- 演出完成自動進下一輪並補牌；勝敗結果層優先截停。

## 戰場方向交換狀態

已完成玩家左／敵人右的鏡像，不只是改出生點：

- `BattleLayout.ts`：1V1～4V4 待機與中央交鋒座標。
- `BootScene.ts`：角色朝向、殺生線、青白刀路、截刀交點、箭頭與接力記號。
- `ClashPresenter.ts`：進場、截刀、卡面左右、碰撞、擊退與相殺彈開方向。
- `BattleLayout.test.ts`：自動保證玩家全部位於 x＜640、敵方位於 x＞640。

1280×720 與 844×390 實機已確認紅線由右側敵人指向左側玩家。

## AI Art Production Pipeline

入口：`.codex/skills/tactical-rift-art-pipeline/SKILL.md`。任何角色／背景生成、修改、整合、核准或否決任務都必須使用此 Skill，並先完整讀取 `docs/art-bible.md`、相關 Character Master／Area Spec、`references/approved/index.json` 與 `references/rejected/index.json`。

流程固定為：

```text
Read specs and positive/negative references
→ generate one candidate
→ save candidate and provenance
→ deterministic validation
→ runtime-trial integration
→ 1280×720 and 844×390 screenshots
→ explicit Pass/Fail codes
→ maximum three automatic generation attempts
```

候選不因放進 `public/` 就自動 approved；正式核准只能由使用者／Art Director 決定。失敗素材必須保存圖片＋原因，後續生成前重新讀取。不得只看單圖回答「looks good」。

工具：

- `validate_art_asset.py`：尺寸、Alpha、bbox、腳底線、背景中央密度。
- `register_rejection.py`：保存 rejected 圖與具體原因。
- `crop_transparent_asset.py`：只裁透明邊界，不重繪。
- `tools/clean_character_candidate.py`：保守綠幕／亮色背景去背。

新角色生成優先採純綠幕 `#00FF00`＋deterministic cleanup，避免模型把透明棋盤格烘成 RGB。角色本身禁止烘焙 FX、光影、地面或背景。

## 玩家角色狀態

| Slot | 角色 | Runtime | 狀態 | 下一門檻 |
|---|---|---|---|---|
| PA | 女主角 | `heroine-sd-*` 三張 trial | `CANDIDATE_MASTER_NOT_APPROVED` | 核准 Master 與武器一致性 |
| PB | 千景 | `chikage-sd-side-master-runtime-trial-v1.png` | `RUNTIME_QA_PASS_PENDING_ART_DIRECTOR_APPROVAL` | 使用者核准後才做 Ready／Down |
| PC | 朧 | `oboro-sd-side-master-runtime-trial-v1.png` | `RUNTIME_QA_PASS_PENDING_ART_DIRECTOR_APPROVAL` | 使用者核准後才做 Ready／Down |
| PD | 未設計 | 暫時共用女主角 | `BLOCKED_IDENTITY_NOT_DESIGNED` | 等使用者提供名稱與身份 reference |

千景重點：高馬尾、大念珠、舊白寬袖、深紫黑腰封、單柄長薙刀；不對稱設計不可安全水平翻轉。其 v1／v3 因假透明失敗，v2 原版因腳底留白失敗；最終 runtime-trial 是對 v2 做 deterministic crop 的新 candidate。

朧重點：琥珀眼、高馬尾、紅繩、破損披布、左長襪／右網襪，一把短忍刀＋一把苦無；不可水平翻轉。綠幕第一代經 cleanup／crop 即通過。黑衣在手機非焦點 alpha 0.55 下曾失去輪廓，runtime 以 `darkSilhouette` 把最低 alpha 設為 0.72 後複驗通過。

PB／PC 目前只有 Master 圖。`poseLocked` 讓攻擊、受擊與死亡暫用同張 Master 配合 runtime 位移、角度與 FX；這是 trial，不代表衍生動作已完成。

## 背景與音樂狀態

- Area 01 規格：`docs/areas/area-01-rainfall-ridgeline.md`。
- 現行車頂 runtime trial：`world01-rooftop-composite-candidate-v3.png`；v1～v4 都仍是候選／比較檔，不是 release-approved。
- 背景中央 45–50% 必須保持低噪音，不能烘焙人物、UI、殺生線或 FX。
- 旅程曲：`public/assets/music/world-01/zone1-train-bgm.mp3`。
- Boss 曲：`public/assets/music/world-01/zone1-boss-bgm.mp3`。
- 音樂均為使用者提供、prototype-only，release provenance 尚待確認。

## 工作樹與安全注意

- 目前工作樹是 dirty；其中包含使用者要求及已驗證的戰鬥、卡牌、背景、角色、文件與 Pipeline 工作。
- 不得使用 `git reset --hard`、`git checkout --`、清除 untracked、批次刪除候選圖或用舊 commit 覆蓋現況。
- `docs/archive/` 不可讀作現況。
- `public/assets/battle/*runtime-trial*` 是可回復的實機候選，不等於 approved。
- `references/rejected/` 不能拿來作正向設計，但必須在同類生成前閱讀以避免重犯。
- `BootScene.ts` 仍高度壓縮，Graphify 有 partial extraction warning；若重構，需小步驟並每次跑完整 test／build，不能順手改玩法。

## 建議下一步

如果新對話沒有更明確的新指令，先停在下列決策點，不自行大量生圖：

1. 請 Art Director 核准或否決千景 Master。
2. 請 Art Director 核准或否決朧 Master。
3. 核准後，每名角色只先做最低成本 `Ready`、`Down`；普通 Attack／Hit／Break 優先用 Master／Ready＋runtime FX，不擴增骨架與方向圖。
4. 等使用者提供 Player D 名稱與身份 reference，再重複同一 Pipeline。
5. 所有角色 Master 穩定後，再統一檢查四人並排的比例、色值、武器安全範圍與 4V4 手機縮圖。

## 交付前最低驗證

任何程式或 runtime 資產改動至少執行：

```powershell
npm run test
npm run build
git diff --check
```

視覺改動另需使用真實遊戲畫面做 1280×720 與 844×390 截圖，不得只以 source、圖片檔或 build 成功判斷完成。
