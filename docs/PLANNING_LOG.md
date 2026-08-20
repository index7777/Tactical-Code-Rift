# 規劃與決策紀錄

STATUS = APPEND_ONLY

本文件保存每次採用的建議、實作批次與驗證結果。舊紀錄不覆寫；方向改變時追加新紀錄並指出取代項目。

## 2026-08-15：文件單一真相來源

狀態：`ADOPTED`

- 將 ATB、AP、五槽撲克、舊 HUD、舊接力規則與早期總案移入 `docs/archive/2026-08-legacy-directions/`。
- `docs/README.md` 成為唯一文件入口。
- 現行玩法固定為回合制、每回合速度、公開殺生線、選牌、改線、交鋒、繼刀與崩勢。
- 歷史封存不再參與日常實作判斷。

## 2026-08-15：下一批戰鬥實作

狀態：`PARTIAL_IMPLEMENTED`

批次目標：

1. `YR-P0-03`：殺生線使用獨立 Presenter 與明確生命週期；回合完成零殘線。
2. `YR-P0-06`：角色 HUD 改為跟隨角色的命脈、護符、刀鐔架勢，不依賴細小說明文字。
3. `YR-P0-08`：從 `BootScene` 拆出殺生線與角色 HUD 建構責任。
4. `YR-P0-09`：驗證 4V4 戰場垂直預算、角色與 HUD 不重疊。

完成門檻：

- `npm run test` 與 `npm run build` 通過。
- 桌面 1280×720 與橫向手機 viewport 實際載入。
- 瀏覽器無相關 error／warning。
- 至少驗證規劃、選牌／改線、執行後清線三種可觀察狀態。

本次落地：

- 新增 `FighterHudPresenter`，命脈、護符、刀鐔架勢跟隨角色移動；移除常駐 HP 數字與橫向文字面板。
- 新增 `IntentLayerController`，把規劃、執行、結算三階段的清線責任集中管理。
- 4V4 待機基準從左右邊界往中央收回，保留 `y=182..458` 的四層角色中心。
- 桌面瀏覽器已確認 4V4 角色與隨身 HUD 沒有互相重疊，console 無 error／warning。

尚未完成：

- 殺生線的完整繪製仍在 `BootScene`，下一步要搬入 `IntentLinePresenter`。
- 固定情境的完整回合執行、交鋒五階段截圖與橫向手機 viewport 證據仍待補。
- 普通殺生線目前仍偏暗，聚焦與多線重疊的視覺強度需在下一輪畫面測試調整。

## 2026-08-15：正式戰鬥構圖與 Steam 截圖方向

狀態：`ADOPTED_WITH_CONSTRAINTS`

採用：

- 永久保留上方連續時序條，強化頭像、最終速度與提前／延後掃讀。
- 中央戰場至少保留 50% 畫面高度；底部卡牌控制在 20～25%。
- 敵我錯層站位、低干擾背景、因果絲式殺生線與遠景列車場景語言。
- 建立固定資料的 Steam showcase 情境，展示公開殺意、截刀與時序重排。

限制與修正：

- 時序條不放完整技能名稱或卡片框，只允許攻／守／援圖示與 `↑N／↓N` 差值，避免再次遮畫面。
- 不採固定角色放大 1.5～1.8 倍；依 1V1、3V3、4V4 動態縮放，先保證站位及 HUD 可讀。
- 不採固定水平對位線；錯層只表達空間層次，殺生線仍必須連到本回合真實指定目標。
- 被動殺生線不持續流動；脈衝只屬於焦點與即將執行的線。
- 場景變體先共用黃泉月台分層資產，避免 Demo 階段為多個完全不同背景付出過高美術成本。

## 2026-08-15：殺生線主導、時序降級與難度情報

狀態：`ADOPTED_WITH_HELL_CANDIDATE`

- 改線成功與否由殺生線上的刀鋒鎖、改線重接或截斷直接回答；上方時序條不再重複負責成功判定。
- 時序條永久保留，但責任降為下一行動者、順序變化與連攜相鄰性。
- 當前下令角色自動成為殺生線焦點；只有與他相关及已提交的線強化流動。
- 普通模式保留全局淡線；困難模式只顯示當前角色相关與已提交關係。
- 「地獄完全無殺生線」暫不採用，避免核心玩法退化為猜測；記錄「短暫揭露後只留端點」為待公平性實測候選。
- 角色身旁姓名、代號與頭像已確認不需要；命脈 HUD 只保留 HP、護符、刀鐔架勢與短暫戰鬥狀態。
- 掩護成功時，被攔截的敵方殺生線終點改接到截刀節點，不能再穿過節點連到原目標；同目標其他未攔截技能維持各自原線。
- 敵方未來可用回合開始已公開的護衛／反制條件鏡像改寫我方青白刀路；禁止無預告、看完玩家出牌後才臨時換線。
- 截刀動畫改為敵方沿原攻擊方向逼近、執行掩護指令者同步切入、雙方在原目標前方出招碰撞；禁止只播放掩護者跑位而省略敵方攻擊。
- 術語固定：掩護＝玩家下達的卡牌／指令；截刀＝掩護成功攔截敵方技能的結果與演出；迎擊＝原目標自行正面交鋒；架守＝留在原位防禦自己；改線＝因果終點重接。

## 2026-08-15：繼刀連續交易與規劃撤銷

- 採用「首擊僵直持續 → 首位退與後位進同步 → 末擊才死亡／歸位」的單一連續演出，不允許首擊後先讓目標回槽。
- 繼刀預覽附著在既有刀路的交鋒節點，以雙段金色刀痕表示；不新增殺生線，也不使用戰場浮動「接力」文字。
- 新增規劃階段「上一步」：撤回最近提交的指令或跳過、返還卡牌可選狀態並重算時序與殺生線；執行階段鎖定。
- 實作批次：`ClashPresenter` 保留敗方僵直與雙方戰鬥位置，`ActionPresenter` 接手換位、末擊結算與倒地／歸位，`BootScene` 將接力傷害綁定第二刀命中。
- 對稱補齊：敵方交鋒勝利與敵方單方面命中同樣能承接繼刀；雙方繼刀不再顯示額外文字牌。
- 畫面自證發現截刀仍使用固定中央交鋒座標，與「敵方沿原意圖路徑、掩護者在目標前攔截」衝突；改為依受保護者位置計算局部截刀點，揭牌、碰撞、僵直、鏡頭與繼刀全部共用該點。
- 驗證：`npm run test` 52/52 通過、`npm run build` 通過、`git diff --check` 通過。瀏覽器已實際驗證繼刀規劃、上一步返牌／清線及一輪交鋒接力回位；截刀新座標的固定情境重載連續兩次遭 Browser CDP dispatch timeout，狀態保留為「規則與演出已實作，尚未人工自證」，不得宣稱截刀畫面已完成。

## 2026-08-15：截刀後續攻擊刀路

- 問題原因：規劃繪線以敵方技能槽為容器並只取第一個指令；截刀占用槽後，後續指向同一敵人的單方面重斬仍有規則節拍，卻沒有自己的視覺刀路。
- 採用：交鋒／截刀刀路仍附著敵方技能槽；`player-one-sided` 節拍另外逐一建立獨立青白刀路，直接落到敵人且不顯示第二個交鋒鎖。
- 畫面自證：4V4 中先由 PB 掩護改寫一個敵方技能，再由 PD 指向同一敵人；截刀線保留於截刀點，PD 的單方面刀路獨立直達敵人且沒有第二個交鋒 X。測試手牌為接力指令，因此線尾正確保留 `//` 繼刀標記；重斬共用相同單方面刀路但不帶該標記。
- 驗證：`npm run test` 52/52 通過、`npm run build` 通過、`git diff --check` 通過；本批狀態為「規則、演出與固定情境自證全部通過」。

## 2026-08-15：結束下令與批次跳過

- 規劃未完成時允許直接按「下一回合」；已提交卡牌不變，所有剩餘角色批次記為跳過、不耗牌，並各自取得下一回合一次性速度 +2。
- 批次跳過後立即進入本回合演出；演出結束後再次按「下一回合」才重擲速度、套用補償並建立新意圖。
- 畫面自證：4V4 僅替 PC 提交快斬、其餘三人保持未下令，按「下一回合」後立即進入 PC 的交鋒演出，未要求補齊出牌且未消耗其餘手牌。`npm run test` 52/52、`npm run build`、`git diff --check` 全部通過。

## 2026-08-15：堅守自身目標限制

- 問題原因：輸入層只區分敵對與友方目標，使所有防禦卡共用友方選擇規則，錯誤允許`堅守`指定隊友。
- 修正：`堅守`在滑入預覽與正式提交兩層都只能接受出牌者自身；隊友防護由`掩護`負責，支援卡的友方目標能力不受影響。
- 畫面自證：堅守點隊友時顯示拒絕回饋、卡牌維持選取且規劃者不前進；改點出牌者自身後才顯示架守弧線、消耗該卡並切換下一位。`npm run test` 52/52、`npm run build`、`git diff --check` 全部通過。

## 2026-08-15：多殺意的精確掩護綁定

- 原因：掩護指令只保存受保護角色，Resolver 依敵方遍歷順序自動猜測技能槽；未配對的掩護又被降級為普通支援，造成角色跑去掩護但沒有敵方攻擊的幽靈演出。
- 修正：掩護必須保存確切 `targetNodeId`；多條殺意時要求玩家點選敵人／殺生線，單條時才允許由受保護者自動綁定。明確綁定的掩護保留該槽優先權，未綁定掩護不形成交鋒也不播放支援跑位。
- 視覺驗收：截刀只斷開截刀點到原目標的後半段，敵人到截刀點的紅色前半段必須保留；雙掩護應為兩紅前段＋兩青白刀路，不能讓整組紅線消失。
- 新增測試：雙殺意分別綁定兩張掩護、一張掩護不可消耗兩條殺意、未綁定掩護不可形成截刀或幽靈支援。
- 固定情境自證：PA 同時承受 EA／EB 兩條殺意；PB、PC 的掩護分別指定兩個敵方槽後，規劃畫面保留兩條敵方到截刀點的紅色前段與兩條青白刀路，執行時兩名敵人各自完成逼近、碰撞與受擊／破招演出，沒有單方面掩護跑位。
- 補正：提交前速度驗證與 Resolver 統一使用「角色速度＋卡牌時序」對「敵方速度＋技能時序」，避免 UI 放行但結算拒絕。

## 2026-08-15：下一批死亡演出與結果術語

- 下一批新增 `YR-P2-03`：HP 歸零建立正式斷命狀態，取消後續節拍／殺生線／目標資格；一般末擊與繼刀末擊在實際命中位置倒地，死者不回槽且下一回合不進時序。
- 現有非平手交鋒結果牌「崩解」語意不精確：目前實際效果只是敗方技能取消、後仰、產生破綻，勝方接續傷害與架勢傷害。
- 採用三層術語：交鋒落敗＝`破招`、架勢歸零＝`崩勢`、HP 歸零＝`斷命`。下一批同步拆分規則事件、FX、音效與姿態。
- 實作與自證：生命結算抽至 `VitalResolver`；HP 歸零關閉互動並在實際末擊位置倒地，後續節拍檢查存活狀態，下一回合過濾死者。`death-proof` 固定情境確認敵人不回槽復站且時序由 8 節點降為 7 節點。
- 本批最終驗證：`npm run test` 58/58、`npm run build`、`git diff --check` 全部通過；雙掩護與斷命固定情境畫面自證通過。

本批驗證：

- `npm run test`：52 項通過。
- `npm run build`：通過。
- 角色身旁身份標記移除已於本機畫面確認；上方時序條仍保留。
- 截刀改線與同步攻擊演出已實作，但瀏覽器在最新互動自證時連續發生控制逾時，因此狀態維持「規則與演出已實作，尚未人工自證」，不得回報完整通過。

## 2026-08-15：狀態生命週期、斷命撤銷與下一批 3–6

- 採用：破綻與崩勢均維持到本輪全部節拍結束，在建立下一輪、重擲速度前清除；本輪崩勢者的尚未執行行動持續取消。
- 採用：斷命者先前提交但尚未執行的攻擊、繼刀、掩護與支援立即失效，且不把其卡牌計入本輪已打出；接力候選與目標選擇均排除死者。
- 實作 3：新增勝利／敗北正式結果層、音樂淡出與再戰入口；`outcome-proof` 固定情境已在瀏覽器確認勝利畫面。
- 實作 4：新增一般、重斬、側襲、繼刀死亡 FX；雙方同時繼刀現在同時結算傷害與死亡，不再只有四人動畫。
- 實作 5：掩護選定受保護者後，可直接點選敵人到匯流點之前的紅色殺生線分支，精確綁定該敵方技能槽；匯流後共用幹線不代表單一技能，不接受精確綁定。
- 實作 6：抽出 `StatusLifecycle`、`CoverSelection`、`DeathPresenter`、`OutcomePresenter`，開始拆解 BootScene。完整 `CombatResolutionController` 與 Graphify AST 警告仍保留為後續架構工作，不宣稱 P0-08 全部完成。
- 驗證：`npm run test` 62/62 通過；`npm run build` 通過；瀏覽器實際操作驗證斷命位置、勝利結果層、再戰入口與殺生線分支點選成立。

## 2026-08-15：列車旅程與多場景框架

- 修正方向：刪除固定車廂柱框。列車是移動據點與旅程線索，不代表每場戰鬥都在車廂內發生。
- 採用三種低成本 Demo 框架：`rooftop` 車頂遭遇、`wayside` 停靠迎擊、`exploration` 離車探索遭遇。三者共用 4V4 戰場預算、殺生線與交鋒座標。
- 實作：新增 `BattlefieldPresenter` 與純資料 `BattlefieldMode`；網址可用 `?scene=rooftop`、`?scene=wayside`、`?scene=exploration` 固定畫面。勝利結果新增「繼續旅程」，依車頂→停靠→探索順序切換下一個原型框架；再戰保留目前場景。
- 自證：車頂模式已由實際瀏覽器截圖確認，中央交鋒帶、4V4 角色與殺生線保持可讀。停靠與探索模式通過建置，但瀏覽器連續擷取逾時、本機 headless 截圖停在載入底色，因此本批不把這兩張列為目視驗收通過。

## 2026-08-15：橫向 2D 動作成本審核

- 否決「側襲依受擊方向倒地」：它會製造沒有額外規則資訊的方向素材分支，與本作水平交鋒帶及禁止自由八方向的原則抵觸。
- 側襲保留金白切入、穿甲與架勢傷害；斷命改用全角色共用側面倒地。重斬與繼刀只改停格、擊退、碎裂、音效與鏡頭，不新增角色方向圖。
- 崩勢、連續繼刀、破招／崩勢／斷命 FX、勝敗流程及 `CombatResolutionController` 拆分均不要求額外方向素材，可繼續列入下一批。

## 2026-08-15：崩勢、接力連續性與三結果 FX

- 破招：從交鋒碰撞抽出冷白兵器碎光、彈刀與短暫失色，不再借用崩勢圓環。
- 崩勢：架勢歸零當下播放五段刀鐔由金至朱紅的連鎖碎裂、水平斷勢線與較強鏡頭震動；本輪後續行動仍由 `broken` 狀態取消。
- 斷命：命脈在角色腳下水平收縮熄滅，再銜接既有碎片與共用側面倒地；重斬／接力只調整強度，不新增方向素材。
- 接力：首位退場與接力者進場保持同步，目標保留首擊後仰與當下座標；新增金色短交棒痕，第二刀命中後才回槽或倒地。
- 新增 `?result-proof=1` 固定情境，提供低架勢單一敵人及破甲／接力手牌。自動測試與建置通過；本次瀏覽器控制環境缺少 `browser` 物件，因此尚未取得互動截圖，畫面驗收維持待確認。

## 2026-08-15：下一批 1／2／3 與列車主線選路

- 執行 1：保留 `result-proof` 固定演出情境與驗收清單；規則／建置再次通過，但本輪仍無可用瀏覽器控制物件，不能把崩勢與接力列為完成目視驗收。
- 執行 2：新增 `CombatResolutionController`，抽出時序／節拍計畫、死亡撤銷後實際卡牌提交與勝敗判定。逐節拍動畫迴圈仍在 `BootScene`，列為 Boss 前必須完成的第二階段拆分。
- 執行 3：新增疾行妖、鎮岳鬼、咒返妖三個有限意圖牌池及速度職能；鎮岳鬼提供高架勢傷害，混合群每輪最多一張 7，咒返妖的正式條件反制延後且不得作弊改線。
- 採用主線：建立 `JourneyScene` 與 `JourneyState`，固定出發／王終點、局部分岔再匯流；戰鬥勝利返回選路，列車移至下一格。事件、探索、伙伴只記錄 placeholder，王節點保留等待 Boss。
- 暫緩：三名玩家角色與多殺生線 Boss 不在本批實作。第 6 項改寫為 P3-01 至 P3-08，包含車頂、停靠、記錄節點、精英、王、結果、重試與最終 15–20 分鐘計時驗收。

### 本批追加：堅守不交鋒

- 使用者校正後採用：堅守是原地立架，不是攻擊迎擊。Resolver 已移除堅守的直接交鋒資格。
- 堅守只在自己的節拍原地播放支援並取得護盾；敵方技能仍保留原殺生線並以單方面攻擊命中，是否先取得護盾由雙方本輪時序決定。
- 新增 `GuardResolution` 測試，固定驗證節拍為 `support → enemy-one-sided` 且不存在 `clash`。

## 2026-08-15：斷命停止待機動畫

- 問題：斷命只關閉互動並播放倒地 Tween，玩家的 `hero-idle` 影格循環與敵人的浮動 Tween 沒有停止，造成倒地後仍持續待機。
- 修正：`DeathPresenter` 取得斷命角色後立即停止 Sprite Animator、殺掉 Sprite 循環 Tween 並清除殘留 Sprite 旋轉，再由共用側面倒地接管角色。
- 範圍：敵我雙方共用同一條死亡入口，避免敵人之後出現相同問題。

## 2026-08-15：素材順序與生成成本策略

- 新增 `DEMO_ASSET_PLAN.md`，納入現行權威文件路由。
- 採用順序：通用卡型 → 怪物意圖與平衡 → 場景／共用 FX → 角色。角色能力與完整角色素材暫緩，不先用角色專屬能力修補卡池問題。
- 卡型先固定快斬、重斬、破甲、堅守、掩護、接力、整備、牽制；免費棄牌、免費追刀與免費破綻傷害維持禁止。
- 怪物先使用疾行妖、鎮岳鬼、咒返妖三種職能，以有限意圖牌池、最高卡配額、公開反制窗口建立深度，不允許結算時作弊改線。
- 動畫成本採少量側面關鍵姿勢＋Phaser 位移／層級／鏡頭／停格＋共用 FX；禁止八方向、方向性死亡、每卡專屬長動畫與以拆骨架為主的 Demo 方案。
- 下一批 `AS-P0` 先完成卡型資料／視覺、疾行妖 candidate、另外兩種怪物規則、九組核心 FX、車頂背景、卡池模擬與雙尺寸畫面自證。
- 本批只完成規劃與文件路由，未宣稱新增素材已具備 runtime readiness。

### 追加：兩方向與 SaGa 式成本分配

- 明確取消換武器／換裝備造成的角色外觀與動畫分支。
- 角色與敵人素材以朝左／朝右兩方向交付；可用鏡像產第二方向初稿，但不對稱服裝、持武器手、傷痕與符號必須校正。
- 採用《Romancing SaGa》式的成本分配：少量待機、攻擊、受擊、瀕死、崩勢、倒地關鍵姿勢，技能差異主要由 FX、節奏、音效、色調與鏡頭建立。
- 不照搬隊列 RPG 的原地放招；本作交鋒、截刀、掩護與接力仍須保留雙方實際接近、碰撞及僵直的空間因果。

### 追加：敵人動畫成本分級

- 雜魚從原規劃的 5～7 種本體姿勢縮減為左右兩向各 `idle / action / down` 三種；普通受擊、頻死、崩勢與不同招式改由 tween、色調、停格與共用 FX 組合。
- 精英只比雜魚多投資 1 張能預告特殊規則的關鍵姿勢；單純數值較高不能成為增加動畫的理由。
- Boss 才允許 2～3 個規則專屬姿勢、部位圖層與階段 FX，但仍不預設骨架或長逐格動畫。

## 2026-08-15：AS-P0 通用卡型、怪物規則與卡牌 UI 第一批

- 實作八種通用卡型與 18 張共用牌庫：快斬 3、重斬 2、破甲 3、堅守 2、掩護 2、接力 2、整備 2、牽制 2。沒有免費動作、免費棄牌或角色專屬牌。
- 整備消耗角色行動，棄至多兩張未提交手牌並補回相同數量；實機固定情境確認結算後牌庫 `13→11`、棄牌 `0→3`，新手牌在補牌動畫後顯示。
- 牽制為威力 4、速度 +2 的干擾攻擊，指定敵人本輪最終時序 −2；時間軸改顯示最終時序值而非原始速度。
- 三種怪物牌池加入視覺 cue 與跨輪不重複同意圖限制；混合群單輪最多一張威力 7 維持不變。
- 免費素材佔位分工：疾行／咒返沿用 CC0 Kamaitachi 的不同 tint／節奏，鎮岳改用 CC0 Dark Knight；不生成玩家角色或新增敵人逐格動畫。
- 卡牌 UI 改為四意圖色系、卡內六角威力徽章、八種程式化圖示、固定速度與效果欄；`card-proof` 固定情境可重現。
- 新增 5,000 組固定種子模擬門檻，涵蓋最高威力覆蓋、平均意圖覆蓋、死手率、功能卡擁塞與重斬密度。
- FX 補充破甲金色碎片、牽制冷色束環與重斬地面衝擊；既有交鋒、破招、崩勢、斷命 FX 繼續共用。
- 驗證：`npm run test` 77/77、`npm run build`、`git diff --check` 通過；1280×720 實機確認卡面與三種免費敵人佔位，整備流程通過。牽制的線與時序重排已目視確認；完整攻擊結算 FX 尚未逐一錄影驗收。

## 2026-08-15：三種怪物規則與完整戰鬥模擬

- 疾行妖採`殘影`：慢牌交鋒威力 −2，未被交鋒攔下的慢牌傷害 −4；以快牌破解，不改線也不臨時換技能。
- 鎮岳鬼採`厚甲`：每輪首個非破甲命中傷害 −5；破甲略過減傷並額外削 2 架勢。厚甲只消耗一次，建立首擊破甲、後續追刀的連攜窗口。
- 咒返妖採`咒返`：威力 7 以上的非破甲／牽制牌交鋒威力 −2，單方面命中傷害 −4 並使攻擊者架勢 −2；先破招、崩勢或改用功能牌可解除風險。
- 規則已接入正式交鋒威力解析與玩家命中流程，並新增`殘影／厚甲／咒返`結果 FX；不新增動畫方向或怪物逐格成本。
- 新增完整 4V4 固定種子模擬：使用正式 18 張共用牌庫、抽棄重洗、有限敵意圖池、HP／護符／架勢、崩勢、接力與 18 輪上限。
- 3,000 種子結果：讀規則策略勝率 71.0%、平均 11.17 輪、平均存活 2.29、逾時 0.3%；不讀規則策略勝率 51.9%、平均 11.11 輪、平均存活 1.57、逾時 0.4%。差距來自反制規則而非額外玩家資源。
- 驗證：`npm run test` 83/83、`npm run build`與`git diff --check`通過。瀏覽器載入 1280×720 Canvas 且無 DOM 啟動錯誤，但本批 WebGL 截圖只取得載入底色，未能辨識三種短 FX，因此畫面錄影驗收仍維持待辦，不以程式碼或黑畫面宣稱通過。

## 2026-08-15：怪物規則可視化與診斷報表

- 新增 `?monster-proof=swift`、`crusher`、`hexer` 三個固定 1V1 情境；每個情境固定職能、威力可反制的敵技及五張對照牌，避免重骰使驗收失真。
- 採情境式短提示：選牌並指向怪物時才顯示紅色危險或青綠反制標記；沒有常駐規則說明框。疾行妖顯示`殘影／追上殘影`，鎮岳鬼顯示`厚甲／碎甲`，咒返妖顯示`咒返／斷咒`。
- 三種命中 FX 分離：殘影使用多層輪廓側移、厚甲使用四片護甲碎散、咒返使用雙層逆轉菱印與反向衝擊線；全部是 Phaser 程式化 FX，不增加素材方向與逐格成本。
- 模擬器新增診斷輸出：怪物傷害／擊殺、人口占比及壓力指數、規則觸發與破解率；卡片使用率、成功率、平均傷害與手牌滯留率；首次玩家崩勢輪數、接力傷害占比與 0–4 人存活分布。
- 3,000 場戰術基準仍為勝率 71.0%、平均 11.17 輪；首次玩家崩勢平均 5.66 輪，接力約占玩家有效傷害 4.32%。人口校正壓力指數：疾行 1.10、鎮岳 1.06、咒返 0.74，顯示咒返目前偏低壓，列入後續數值觀察而不是本批直接加強。
- 瀏覽器自證：疾行情境完成慢牌`殘影`與快牌`追上殘影`互動截圖；鎮岳情境完成`碎甲`提示截圖。咒返新分頁可載入且 console 無錯誤，但背景分頁 WebGL 截圖仍為底色，因此咒返命中 FX 錄影未宣稱通過。

## 2026-08-15：第一世界列車地圖背景曲

- 將使用者提供的 `zone1_train_bgm.mp3` 歸檔為 `public/assets/music/world-01/zone1-train-bgm.mp3`，用途固定為第一世界列車前進／選路地圖，不取代戰鬥曲。
- JourneyScene 預載並管理地圖曲：1.1 秒淡入、曲尾提前 1.4 秒淡出、歸零後重播並再次淡入；不使用會在 MP3 接縫硬切的 `loop:true`。
- 選擇迎擊／精英節點時，在列車移動完成後用 650ms 淡出並停止地圖曲，再進入戰鬥。戰鬥勝利返回旅程前，戰鬥曲再用 350ms 歸零停止，避免雙 BGM 疊播。
- 補上失焦／聚焦音量處理及純函式循環時序測試。來源與發行授權尚未提供，因此資產表標記為 prototype-only、release provenance pending。
- 實機旅程切場發現既有 `BootScene` 未宣告正式 scene key，導致列車完成移動與地圖曲淡出後出現 `Scene key not found: BootScene`；本批補上 `super('BootScene')`，使 JourneyScene 能依既定 key 進入戰鬥。
- 驗證：音樂 URL 回應 `200 audio/mpeg`、2,457,296 bytes；瀏覽器無新 console error，實際點選第一個迎擊節點後列車移至節點，地圖保持至淡出完成，再成功進入 4V4 戰鬥。`npm run test` 87/87、`npm run build`與`git diff --check`通過；完整曲長的實時間尾端聽測仍留給人工音訊驗收。

## 2026-08-15：第一世界 Boss 背景曲

- 將 `zone1_train_boss_bgm.mp3` 歸檔為 `public/assets/music/world-01/zone1-boss-bgm.mp3`，獨立註冊為 `boss-battle-music`。
- 新增純規則選擇器：普通迎擊與精英使用 `battle-music`；只有 `boss-*`旅程節點或`?boss-proof=1`使用 Boss 曲。Boss 曲沿用既有 1.2 秒淡入、循環、失焦淡出、勝敗淡出與回旅程停止流程。
- Boss 本體仍在待辦，王節點不會因此被降級成一般 4V4；`boss-proof`只驗證音樂資產及選擇，不代表 Boss 戰完成。
- 音樂由使用者提供但未附發行授權，依資產規則標記 prototype-only、release provenance pending。

## 2026-08-15：第一世界模組化路線與戰鬥資產拆件

- 採用模組化路線圖：背景不得烘入列車、軌道、節點、Icon 或文字；軌道、分岔、站點底座與 Icon 由 Phaser／SVG 組裝，列車使用獨立透明資產沿連線移動。
- 新增候選方向稿：`world01-battle-visual-target-v1.png`、`world01-journey-bg-candidate-v1.png`、`world01-train-candidate-v1.png`，均存於 `assets/candidates/concepts/`，不得視為已核准 runtime 素材。
- 戰鬥 P0 拆為 37 個 source asset：6 背景層、4 氣氛貼圖、15 怪物關鍵姿勢、3 規則覆層、5 共用 FX 原料、4 UI 九宮格。因果線、HUD 數字、文字、鏡頭與位移維持程式化。
- 三種雜魚各限制五張關鍵姿勢；頻死、短受擊與崩勢優先由姿勢變形、FX、停格及鏡頭完成。四名玩家角色 24 張姿勢與 Boss 素材延後至規則定案。
- 建立怪物共用生成提詞與核准流程：先核准 idle，再以同一 reference 生成其餘姿勢；所有生成輸出先進 candidates，經一致性、透明邊緣、pivot 與來源檢查後才可進 runtime。
- 拒絕兩版生成列車：第一版是高細節側視、第二版仍混入側面車輪與過量細節。改以專案原生 SVG 建立真正俯視的低細節 `train-token-topdown.svg`，可沿曲線切線旋轉。
- 我方角色採成熟二次元和風武裝、黑／朱紅／象牙與妖異裝飾的方向；使用者參考圖來源未明，只採風格語言。正式 Sprite 必須轉成全身側視、大形輪廓與六種低成本關鍵姿勢，四人不可共用相同黑髮紅黑女武者剪影。
- 追加女主角畫風參考：採精緻二次元厚塗、乾淨臉部、柔亮髮絲、輪廓光與材質分離，不採參考圖的銀髮、螢光綠或近未來服裝。生成 `heroine-style-costume-candidate-v1.png` 驗證原創黑／朱紅和風鐵道女刀手；檢查為 1536×1024、24-bit RGB，棋盤格背景已烘入而非透明 alpha，因此僅保留概念用途，禁止接入 runtime。
- 本批同步前驗證：`npm run test` 18 files／89 tests 全數通過；`npm run build` 通過；`git diff --check` 通過。Vite 仍回報既有主 bundle 大於 500 kB 警告，本批沒有新增 runtime TypeScript，因此不把該警告誤列為本次美術規劃造成的回歸。

## 2026-08-15：女主角側視母稿開始

- 依使用者決定先從角色進行，但只解除女主角 identity／idle 美術母稿的暫緩；角色能力、專屬牌及其餘角色仍不提前定案。
- 使用已採用的黑／朱紅和風女刀手概念作 identity reference，生成左向全身側視 `heroine-idle-master-candidate-v1.png`。在 100 px 高縮圖仍可辨認高馬尾、短羽織、紅色內襯與刀，輪廓方向通過。
- 技術檢查：1024×1536、24-bit RGB，棋盤格烘入、沒有透明 alpha；腳部略重疊、刀鞘與馬尾佔寬較大。因此狀態是 silhouette candidate，不是 runtime-ready，也暫不以它延伸其他五姿勢。
- 下一道 gate：真正透明的清理／重製 idle、82 px 與 100 px 縮圖、統一腳底 pivot，並在第一世界戰場背景上完成 browser composite 自證。

## 2026-08-15：正式入口改為列車選線

- 發現同步後根網址仍進戰鬥：既有 `BootScene` 只有 query 帶 `journey` 才轉往 `JourneyScene`，上一批美術 commit 沒有修改入口，並非瀏覽器快取問題。
- 修正為無參數根網址預設進入列車選線；`?journey=1` 保留相容。`?battle=1`、`?scene=...` 與既有 proof query 明確保留直接戰鬥入口。
- 從旅程節點送入 `journeyNodeId` 時不得再次跳回地圖，確保選擇迎擊後能進戰鬥。

## 2026-08-15：敵人斷命後退場

- 採用 SaGa 類型的低素材成本退場節奏，而非永久留屍：先保留命中停格、生命線與碎片，再短幅倒下／崩散，約 0.45～0.62 秒後讓敵人本體與 HUD 同步淡出。
- 死亡敵人的 runtime 邏輯物件不立即 destroy，只設為不可互動且視覺隱藏，避免破壞同輪既有 action reference；下一輪本來就會由 `alive` 過濾時序。
- 玩家斷命仍交給敗北演出保留低透明倒下狀態，不因敵人退場規則而在敗北畫面中瞬間消失。

## 2026-08-15：演出後自動進下一回合

- 移除演出結束後再次按「下一回合」的停頓。按鈕改名「結束規劃」，只負責保留已提交指令、將剩餘角色設為跳過並啟動演出。
- 非勝敗情況下，演出與循環牌動畫完成後自動清除本輪狀態、套用跳過速度補償、重骰新速度／意圖、補至五張並進入下一輪。
- 勝利／敗北在自動續回合前判定；結果成立時不得補牌或建立新敵方意圖。

## 2026-08-15：相殺後接力併入同一鏡頭

- 修正另一名角色已提交接力卡時，既有 resolver 將它保留成獨立 `player-one-sided` beat，導致相殺雙方先歸位、接力才重新跑出的錯誤。
- 新增接力連結規劃：相殺或我方交鋒勝利後，搜尋時序中較後且指向同一敵人的接力指令，將其綁定該 clash；補刀前敵人維持交鋒點後仰，來源角色退場與接力角色進場同步。
- 被綁定的接力 beat 不再獨立重播；補刀使用該接力卡自己的怪物傷害／架勢判定，而不是固定假傷害。

## 2026-08-15：同名卡以 instance 單選

- 將手牌選取狀態由物件參照改為明確比較 `instanceId`，確保兩張相同 `definitionId` 的整備卡不會一起呈現選取狀態。
- `card-proof` 固定為單角色且同時持有兩張不同 instance 的整備，用於驗證金框與抬升只作用於被點擊的一張。
- 整備本身仍是消耗一次行動、棄兩張未提交牌再補兩張；被棄換的另一張整備不等於被提交或同時打出。

## 2026-08-15：結果操作固定中央安全區

- 確認再戰資料座標雖是 640，但 HUD 未固定螢幕座標，交鋒 Camera 的 pan／zoom 可能把結果層推到視窗邊緣。
- HUD、手牌、時序改為 scroll factor 0；結果出現前強制 Camera 回到 `(640,360)`、Zoom 1。
- 敗北只保留中央 240 px 寬大型「再戰」。勝利以中央「繼續旅程」為主操作，再戰垂直放在下方，避免左右邊緣與手機安全區問題。
- 驗證：Boss MP3 回應 `200 audio/mpeg`、2,584,405 bytes；`?boss-proof=1`載入戰鬥場景並於首次互動解鎖音訊，console 無錯誤。`npm run test` 89/89、`npm run build`與`git diff --check`通過；因 Boss 本體尚未實作，本批不宣稱王節點實戰切場完成。

## 2026-08-15：整備手動棄換與上一步可用時機

- 修正整備原本自動棄掉前兩張未提交手牌的假實作。現在指定自身後停留在棄牌選擇狀態，必須逐張選滿兩張才提交指令；結算依兩個 `instanceId` 精確棄換，同名卡不會連動。
- 已指派卡、整備本身與牌庫卡不能成為棄換目標；可選牌不足兩張時不允許提交。棄換仍消耗該角色本輪出牌機會，不新增免費棄牌。
- 上一步只在規劃階段且至少已有一張實際卡牌指令時顯示；未出牌、只選牌／選棄牌、只有跳過，以及整段回合演出期間均隱藏並禁止誤觸。
- 新增純邏輯測試，驗證精確選取兩個 instance 及 protected／不存在選擇不會被其他手牌替代。最終驗證為 25 files／106 tests 通過，`npm run build` 與 `git diff --check` 通過。
- Browser 實測 `?card-proof=1`：初始與單選整備時無上一步；指定自身後只將手動點選的一張牌標成紅框「棄」並顯示 1/2；第二張提交後手牌及上一步在演出中隱藏；自動新回合後棄牌為 3（整備本身＋指定兩張）、牌庫 10、手牌補滿 5，console 無 error／warning。

## 2026-08-15：崩勢取消尚未行動

- 程式已有單方面攻擊 beat 的崩勢取消，但 clash 與 support beat 漏掉同一規則，造成先被打崩勢的角色仍能在稍後交鋒或整備／堅守。
- 修正為本輪尚未執行的 clash 若一方已崩勢，該方取消行動、另一方改為單方面命中；雙方皆崩勢則雙方取消。支援行動者若已崩勢也取消。
- 不回溯已經演完的行動；已行動後才崩勢只保留至本輪結束的易傷與視覺狀態。
- 新增 `BrokenActionPolicy` 測試並納入上述 25 files／106 tests 與 build 驗證。

## 2026-08-15：女主角透明側視 idle v2

- 延續女主角資產 Gate，不新增角色能力或專屬牌。保留 v1 的黑髮高馬尾、短羽織、黑／朱紅／象牙與單刀身份，重製為雙腳分開、刀鞘和馬尾較短的嚴格左向戰鬥 idle。
- 生成器再次把棋盤格烘入 24-bit RGB，因此不直接核准。新增 `tools/clean_character_candidate.py`，只移除與畫布邊緣連通的高亮中性色背景並處理邊緣 alpha，產出 461×948 RGBA v2。
- v2 非破壞性接入 PA 作 runtime composite；PB～PD 保留占位角色，避免四人輪廓相同。1V1／2V2／3V3／4V4 依 145／125／110／96 px 動態顯示高度。
- Browser composite 通過：4V4 的 PA 高度 96 px，不蓋底部卡牌或中央演出區；1V1 高度 145 px，腳底 pivot 穩定；透明邊緣未見白框，console 無 error／warning。現行最大落差是 PA 精緻插畫與 PB～PD 像素占位畫風不同，此為已知候選階段差異。
- 接續產出 ready：第一版因長刀與跨步過寬拒收，第二版收成雙手低位防備，清理為 684×932 RGBA，接到 PA 當前規劃焦點。ready 只補足角色狀態閱讀，不新增能力或專屬卡。
- 4V4 Browser 切換到 PA 焦點後，ready 保持在角色槽內，刀身沒有蓋住鄰位、卡牌或主要因果線；idle／ready 切換與 console 通過。最終 `npm run test` 為 25 files／106 tests，`npm run build` 與 `git diff --check` 通過；Vite 只保留既有 bundle size 警告。

## 2026-08-15：女主角 strike／recoil 批次

- 本批只製作 strike 與 recoil；broken／down 延後，先驗證攻擊及受擊姿勢是否能在現有交鋒、單攻、接力與崩勢取消節奏中成立。
- strike 第一版因黑色光暈背景及過寬橫斬拒收且未進專案。保留版改採低位斜斬收刀接觸幀，由 runtime Slash FX 延伸動勢，清理為 846×1499 RGBA。
- recoil 採上身後仰、收臂護身、刀留鞘內的單一通用受擊幀，清理為 736×1569 RGBA；不增加受擊方向或側襲倒地素材。
- 新增 `HeroinePose` 尺寸正規化：不論來源畫布大小，idle／ready／strike／recoil 都維持 1V1～4V4 的既定角色高度。ActionPresenter 與 ClashPresenter 在接近、命中、輸家後仰、接力與回槽時切換並復原姿勢。
- 使用者複核後撤回 recoil runtime：SaGa 式普通受擊沿用當前姿勢，以位移、角度、染色、hit-stop 與 FX 表現，不增加完整受擊圖。recoil 產物標記 rejected，並從 preload、動畫及 Presenter 接線移除；`HeroinePose` 只保留 idle／ready／strike。新增姿勢預算保留給真正改變輪廓與狀態的 broken／down。

## 2026-08-15 — SD 動作表武器連續性檢查

- 採用方向：以同一張多動作表生成後切格，降低逐張生成造成的角色臉型、服裝與比例漂移。
- 驗收修正：首張待機格與第一次局部修正版的刀柄／鍔／鞘口軸線不連續，均判退，不得因整體畫風較好而進 runtime。
- 補作方式：改用單格高解析待機母圖鎖定「單一入鞘刀、刀柄直接接鞘口、無第二武器、刀柄可雙手握（約 2.5～3 拳寬）」，通過後再與其餘合格動作整併。首張單格修正版因刀柄過短一併判退。
- 成本邊界：普通受擊沿用原姿勢加 runtime FX；多格生成結果逐格採用，不要求六格全部投入。
- 最終待機候選：刀柄過短版與長柄過度修正版均判退；目前保留雙手可握、但非長柄比例的 731×974 RGBA 候選。只進候選庫，待同規格動作表與瀏覽器尺寸驗收後才可進 runtime。
- 動作量再收斂：角色第一批只保留「收刀待機／拔刀備戰／倒地」三張。攻擊、堅守、交鋒、受擊、崩勢與接力使用 runtime 變形與獨立 FX，不再為每種結果增加角色圖。
- 素材規則修正：角色母圖不得烘焙攻擊特效、粒子、投影、環境光染色或光暈；但必須保留原本精緻 SD 日系畫風所需的角色內部賽璐璐明暗、髮絲與布料材質。全面平塗會造成風格漂移，已生成的平塗動作表與切格全部判退。
- 三格精緻 SD 表驗收：倒地格完整採用；待機與備戰因長武器跨格而判退。結論是多格表可用於倒地等自含輪廓，拔刀長武器姿勢必須單張生成或預留武器安全溝槽。
- Runtime 批次：接入精緻 SD 待機、備戰、倒地三張；攻擊 animation key 共用備戰圖，死亡切換倒地圖且按站立尺度的 0.52 倍校正，避免橫躺圖被放大。
- 驗證：`npm run test` 26 files／108 tests passed；`npm run build` passed；`git diff --check` 無內容錯誤（僅既有 LF→CRLF 提示）。在 1280×720 瀏覽器實際 4V4 畫面驗收，console 無 error，新 PA 無綠邊、無素材越界、未遮住殺生線；其餘三名仍為舊佔位角色。
- 共用角色接入：依試玩需求，PA～PD 暫時全部使用同一套精緻 SD 待機／備戰／倒地資產，以便一次驗收四人站位、攻擊與死亡 hook。敵方維持怪物資產，避免破壞怪物類型辨識；正式角色仍須逐名替換。
- 共用角色畫面驗證：1280×720、4V4 實際瀏覽器畫面確認 PA～PD 均已換為同一套 SD 角色，四個站位無互相重疊、無綠邊、未遮斷殺生線；敵方三種怪物資產與顯示邏輯未變，console 無 error。

## 2026-08-15 — 第一世界 Demo 戰鬥 BG 最小資產集

- Demo 背景收斂為八個 source asset：兩個共用遠景、車頂兩層、停靠月台兩層、Boss 地標一層、共用前景遮罩一層。探索／事件目前不是戰鬥節點，不先製作專用戰鬥 BG。
- 車頂構圖經三次修正：第一版車頂只佔底部約 20%、第二版遠緣仍低於最上排腳底，均判退；第三版把車頂遠緣放在畫面高度約 24%，讓邏輯座標 `y=182..458` 的四排角色都落在同一可戰地面。
- `rooftop-composite-candidate-v1.png` 已保存為構圖候選。中央戰場低對比、硬體只在極端邊緣；沒有角色、UI、文字、殺生線、攻擊 FX、粒子或速度線。
- Gate：先做 1280×720 真實 4V4 疊圖驗證，再生成／繪製真正分層素材；不得直接把整體候選裁切成假分層並宣稱完成。
- 第一次 runtime 疊圖：站位與地面通過，但 v1 屋頂明度使黑衣非焦點角色幾乎融入；直接提高 18% 的嘗試又過亮而判退。v2 採中間冷藍灰明度並降低縫線對比，作為第二次 runtime 驗證候選。
- 第二次 runtime 疊圖：v2 角色與殺生線可讀性通過，但月亮與上方時序 token 重疊。v3 把較小、較暗的月亮移至畫面中央 `y≈16%`，離開時序安全區且不落在角色站位後方。
- 最終 v3 疊圖驗收：1280×720 4V4 中，四排角色腳底皆位於車頂、黑衣角色輪廓可讀、被動殺生線仍可追蹤、月亮不再與時序 token 重疊，console 無 error。v3 可作 Demo rooftop runtime candidate；正式視差拆層仍未完成。
## 2026-08-17｜現行畫面與玩法一致性審查

- 使用 1280×720 實際瀏覽器畫面檢查 `?battle=1` 首屏及選取快斬後的目標預覽；頁面正常載入、無 framework overlay，console 無 error／warning。
- 畫面高度分配大致符合既定方向：上方時序約 10%、中央戰場約 65%、底部手牌約 25%，4V4 仍保有中央演出空間。角色與卡牌沒有首屏裁切。
- 尚未通過新手可讀性門檻：被動殺生線過淡且多線交叉時難追蹤；左側敵方意圖卡、敵人本體與 HUD 距離過近；聚焦後主線清楚，但青色預覽線與紅色殺生線的方向／因果角色仍需更明確。
- 上方時序維持只顯示角色代號與最終時序值，沒有重新塞入卡名；此項符合現行規格。底部牌庫／棄牌數字可見，但正式棄牌按鈕尚未存在。
- 規則衝突：`整備＝棄 2 補 2` 已在最新設計討論中被否決；抽牌、棄牌不得再和整備綁定。現行程式、卡面、模擬、`CURRENT_COMBAT_SPEC.md` 與驗收表仍是舊規則，在新效果定案前只能標記為待替換，不能視為正式完成。
- 規則衝突：`掩護`卡面宣告護符 9，但截刀形成交鋒後，runtime 只比較威力並處理勝負，沒有取得護符；卡面與結算不一致。
- 規則衝突：正式規格要求死亡者尚未執行的卡不消耗，但 `CombatResolutionController.committedCards()` 目前收集所有非空指令，尚未依死亡取消結果剔除，存在死亡後仍棄牌的風險。
- 截刀規則本身一致：原目標正面迎擊不做速度門檻；其他角色幫忙改線先比較「角色速度＋卡牌時序」是否嚴格高於敵方最終時序，成功形成交鋒後才以卡面交鋒威力判定勝負。速度回答能否趕到，卡面回答能否破招。
- 旅程狀態目前只保存路線節點，不保存隊伍 HP；每場戰鬥重新建立滿 HP 角色。因此現階段沒有回血牌不會造成跨戰鬥軟鎖，但正式主線是否採 HP 持續、車站治療或治療卡仍未定案，不應先加回血牌。
- `GAMEPLAY_INSPIRATIONS.md` 主體仍保留共享 AP、脈衝時序與三槽連攜等舊內容，雖在尾端標為歷史靈感，仍容易被誤讀；現行規則一律以 `CURRENT_COMBAT_SPEC.md` 及 runtime 為準，後續應拆出或封存舊段落。
- 刀光資產與呼叫點存在，但本次首屏／規劃預覽不能證明戰鬥中可辨識；依使用者實機回報，目前仍視為「演出未完成」，必須用固定攻擊情境截取命中幀後才可改狀態。
- 平衡證據衝突：實際戰鬥建立敵我角色時皆為 HP 100／護符 20／架勢 10；完整模擬則使用玩家 HP 44／敵人 HP 40／護符 0／架勢 8。現有 71% 勝率與 11.17 平均輪數不能代表目前瀏覽器 Demo，必須統一資料來源後重跑。
## 2026-08-17 — AI Art Production Pipeline 與戰場方向交換

- 採用：建立 Art Bible、Character Master／Area Spec、approved／rejected reference 機制與專案 Art Skill。
- 邊界：候選圖不因存在於 runtime 目錄而自動核准；每次最多三次自動迭代，正式核准保留給 Art Director。
- 角色：Player A 僅為 candidate master；Player B／C／D 因缺少身分核准資料而停止猜測並標記 blocked。
- 背景：Area 01「雨暮山線」以中央 45–50% 低噪音、明確接地與低妖異強度作為驗收規則。
- 實作：戰場慣例改為玩家在左、敵人在右；同步調整站位、朝向、殺生線、截刀、交鋒進場、卡面位置與擊退方向。
- 驗證：Art Skill `quick_validate` 通過；`npm run test` 27 files／108 tests 通過；`npm run build` 通過；`git diff --check` 無 whitespace error。
- 資產檢查：Player A candidate 通過 alpha／bbox，但 `foot-baseline-margin` 失敗（bottom gap 32 px）；rooftop v4 尺寸與 16:9 通過，但中央 edge density 0.0235 高於外側 0.0204，不能自動核准，兩者保留 candidate。
- 實機：1280×720 與 844×390 均確認玩家在左、敵人在右；角色朝中央，紅色殺生線由右側敵人連向左側玩家，底部戰鬥操作仍可見。手機橫向採等比縮放並留側邊 letterbox，後續屬 UI responsive 優化，不阻擋本次方向交換。
- 角色新增：使用者指定 Player B 名稱為「千景」並提供身份設計 reference。先建立 Character Master Spec 與單一側視 SD master candidate；依 Art Pipeline，在 master 核准前不批量衍生動作素材。
- 千景素材批次結果：三次 side-view SD master 自動嘗試均未通過。v1／v3 為烘焙棋盤格的 RGB `alpha-failure`；v2 為 RGBA 且造型完整，但腳底透明留白 64 px，觸發 `pivot-failure`。依 Art Pipeline 停止第四次生成，未接入 runtime、未生成衍生動作。
- 千景裁切與實機批次：使用者同意下一步後，對 v2 執行 deterministic alpha crop；輸出 1407×970 RGBA、bottom gap 10 px、bbox area ratio 0.967，全部自動檢查通過。以 runtime-trial 接到 Player B，未升級為 approved、未衍生正式動作。
- 千景 runtime QA：1280×720／844×390 4V4 截圖確認 PB 位於玩家左側第二列、面向右側中央，腳底貼合、薙刀未碰相鄰 HUD、手機縮圖仍可辨識主要 silhouette。狀態升為 `RUNTIME_QA_PASS_PENDING_ART_DIRECTOR_APPROVAL`，不等於正式核准。
- 角色新增：使用者指定 Player C 為「朧」並提供身份設計 reference。採純綠幕生成＋deterministic chroma cleanup，先做單一朝右側視 SD master；核准前不生成衍生動作。
- 朧素材批次：第一代純綠幕候選經 deterministic cleanup／crop 後為 656×861 RGBA、bottom gap 10 px、bbox area ratio 0.922，自動檢查全部通過；以 runtime-trial 配置 Player C，等待實機與 Art Director 核准。
- 朧 runtime QA：1280×720 首驗接地與站列通過；844×390 發現黑衣在非焦點 alpha 0.55 下觸發 `silhouette-lost`。未重生素材，改以 `darkSilhouette` runtime 最低 alpha 0.72 後複驗通過，狀態升為 `RUNTIME_QA_PASS_PENDING_ART_DIRECTOR_APPROVAL`。
- 接手文件批次：建立 `docs/HANDOFF.md` 作為新對話現況入口，記錄權威閱讀順序、現行玩法、玩家左／敵人右、Art Pipeline、角色／背景／音樂狀態、dirty worktree 安全規則、最新驗證與下一決策點；`docs/README.md` 已將其列為第一份權威文件。

## 2026-08-17 — Batch 0：Sim baseline 校正（A4＋A5）

狀態：`ADOPTED`

範圍：僅 sim 與 dead code 清理，不改動 runtime 玩法、不改動平衡參數、不生成資產。目的是取得可信賴的 baseline，供後續 A1–A3 結構修正與 T1–T4 平衡調整對齊。

異動檔案：

- `src/core/battle/RoundPlanner.ts`：刪除 dead export `canIntercept`。
- `src/core/balance/CombatSimulation.ts`：修正 `guard` 分支——護符改為加到隨機一名存活玩家（近似「出牌者自身」），敵方攻擊仍照原目標結算，不再被護符免費吸收。

異動前後（逐檔）：

- `RoundPlanner.ts`
  - Before：`export function canIntercept(command:PlayerCommand,enemy:ActionNode,playerSpeed:number):boolean{return Boolean(enemy.enemySkill&&!enemy.enemySkill.unclashable&&enemy.enemySkill.targetId!==command.actorId&&playerSpeed>enemy.speed)}`
  - After：整行刪除。
  - 影響檔案數：0（grep 確認全專案無呼叫者）。
- `CombatSimulation.ts` 第 33 行 `guard` 分支
  - Before：`if(card.definitionId==='guard'){metrics.cardHits.guard++;player.shield+=card.shield??0;enemyHurts(player,intent.skill,role,round);intent.targetIndex=-1;continue}`
  - After：`if(card.definitionId==='guard'){metrics.cardHits.guard++;const aliveGuards=players.filter(actor=>actor.alive);const guardSelf=aliveGuards[Math.floor(random()*aliveGuards.length)];if(guardSelf)guardSelf.shield+=card.shield??0;enemyHurts(player,intent.skill,role,round);intent.targetIndex=-1;continue}`

Sim baseline 前後（5000 場）：

| 指標 | Before | After | Δ |
|---|---|---|---|
| Tactical winRate | 78.7% | 74.4% | −4.3 pt |
| Naive winRate | 62.9% | 57.0% | −5.9 pt |
| Tactics uplift over naive | 15.7 pt | 17.4 pt | +1.7 pt |
| averageRounds (tactical) | 12.37 | 12.33 | −0.04 |
| averageSurvivors (tactical) | 2.68 | 2.42 | −0.26 |
| Survivor 4 人全通 | 41.3% | 32.2% | −9.1 pt |
| Survivor 0 人全滅 | 18.7% | 22.9% | +4.2 pt |
| swift Pressure | 1.11 | 1.13 | +0.02 |
| crusher Pressure | 1.05 | 0.95 | −0.10 |
| hexer Pressure | 0.72 | 0.80 | +0.08 |
| relayDmgShare | 4.2% | 4.3% | +0.1 pt |
| Guard hit rate | 100% | 99.9% | −0.1 pt |

觀察：

- 雙峰現象（要嘛全通、要嘛全滅）緩解：4 人全通從 41.3% 降到 32.2%，中間狀態（1–3 人存活）合計從 40.0% 上升到 44.8%，戰鬥更常出現拉扯尾段。
- Tactics uplift 由 15.7 pt 提升到 17.4 pt，代表懂規則的回報變得更明確——sim guard 免費吸傷會同時放水給 naive，修正後 naive 掉 5.9 pt。
- hexer Pressure 從 0.72 提到 0.80，接近合理區；後續 T1（hexer 加傷）的加傷幅度可以下修——原建議 `咒裂 8→10 / 返刃式 10→12 / backlash 2→3` 可先改為 `咒裂 8→9 / 返刃式 10→11 / backlash 維持 2`，觀察即可。
- crusher Pressure 由 1.05 降到 0.95：guard shield 不再落在 crusher 目標身上，crusher 傷害無法被錯抵，但 crusher `鎮岳` 每輪只能一張 7 的限制仍在。這個 baseline 之後才適合評估 A2（破甲不消耗厚甲）修正的影響。
- Card stats 幾乎維持不變（quick/heavy/break/relay/delay 使用率與命中率變動 <1 pt），代表本次改動只調整整體壓力，沒有偏袒或懲罰任何卡型。

驗收門檻對齊（`CombatSimulation.test.ts` 與 `BalanceSimulation.test.ts`）：

- winRate 0.42–0.82：74.4% ✓
- winRate > naive + 0.05：17.4 pt ✓
- averageRounds 4–15：12.33 ✓
- timeoutRate < 0.12：2.7% ✓
- averageSurvivors > 0.8：2.42 ✓
- swift ruleTriggers > 0、crusher counterRate > 0、break usageRate > 0、heavy unusedRate > 0：全 ✓
- averageFirstPlayerBreakRound > 0：6.09 ✓
- highestThreatCoverage > 0.72：74.6% ✓
- intentCoverage 0.62–0.98：89.2% ✓
- deadHandRate < 0.08：0.0% ✓
- utilityCongestionRate < 0.12：2.0% ✓
- averageHeavyCards 0.35–0.8：0.57 ✓

尚未執行：

- `npm run test` 與 `npm run build`：目前為 Windows 專案，Linux mount 端無法運行 `node_modules`；下次在 Windows 端執行以確認 27 files / 109 tests 全通過且 build 無新增 error。
- `git diff --check`：同上，需在 Windows 端執行確認無 whitespace error。

下一批（Batch 1）預備範圍：A1 崩勢公式對齊（`VitalResolver` 追加 4 HP + balance 重置 8，並更新 `CURRENT_COMBAT_SPEC.md`）、A2 crusher 破甲不消耗厚甲、A3 移除 crusher 非破甲 clashPower −1。所有數字目標值以本次 baseline 為準。

## 2026-08-17 — 文件與規格清理批（Items 3／4／5／6）

狀態：`ADOPTED`

範圍：純文件、TypeScript 介面欄位、無 runtime 玩法異動；不修改角色行為、不生成資產、不動 sim 公式。

異動檔案：

- `src/core/cards/BattleCards.ts`：移除 `BattleCard.cycleCount?` 型別欄位（無人使用；規格禁止整備操作牌庫）。
- `src/core/cards/BattleCards.test.ts`：`toBeUndefined()` 型別檢查改成 `'cycleCount' in cardDefinitions.cycle).toBe(false)`，保留 regression 語意，避免介面移除後編譯錯誤。
- `docs/GAMEPLAY_INSPIRATIONS.md`：整份重寫，刪除舊 ATB／共享 AP／脈衝時序／三槽連攜／飛空艇／晶片與已消失模組表；只保留主要參考、原創延伸摘要、參考邊界、對外描述原則。
- `docs/archive/2026-08-legacy-inspirations/GAMEPLAY_INSPIRATIONS-legacy.md`：新增，保留 GAMEPLAY_INSPIRATIONS.md 舊版原文供追溯。
- `docs/COMBAT_ACCEPTANCE_CHECKLIST.md`：新增「待處理規則衝突」段落，把 A1／A2／A3、掩護截刀護符、`?discard-proof=1` 情境列為 TODO。
- `asset_manifest.schema.json`：`$id` 從 `three-kingdoms-online.local` 改為 `tactical-code-rift.local`；`title` 從 `Generic Asset Manifest Schema` 改為 `Tactical Code Rift Asset Manifest Schema`。
- `ASSET_MANIFEST.md`、`ASSET_RECIPE_SCHEMA.md`、`ASSET_GENERATION_PIPELINE.md`：批次替換 `Generic Project → Tactical Code Rift`、`Example Faction → 妖怪`、`runtime engine → Phaser`、`three-kingdoms-online.local → tactical-code-rift.local`；共 47 處。
- `CAPABILITY_REGISTRY.md`：`ASSET_PIPELINE_SPEC_READY` 從 `READY_FOR_CANDIDATE_QA` 改為 `READY_PLACEHOLDER_CLEARED_PENDING_RECIPE_VALIDATOR`；spec evidence 段的四項佔位 bullet 收斂為一句「已於 2026-08-17 Batch 0 收尾清理」記錄。

Placeholder 替換規則：

- `three-kingdoms-online.local` → `tactical-code-rift.local`
- `Generic Project` → `Tactical Code Rift`
- `Example Faction` → `妖怪`（因專案敵人分類為妖怪體系）
- `runtime engine` → `Phaser`（專案技術棧為 Phaser 3.90）

未處理項目（下一批候選）：

- 機器可讀 AssetRecipe schema、recipe validator、manifest validation command、workflow registry 實作、engine importer 仍缺；`ASSET_PIPELINE_SPEC_READY` 只到 `READY_PLACEHOLDER_CLEARED_PENDING_RECIPE_VALIDATOR`，未晉升 `READY`。
- BootScene 單行壓縮拆分（Item 2）暫緩，改為下一批獨立處理。

驗收門檻對齊：

- `BattleCards.test.ts`：三段既有 assertion 全部保留；新的 `'cycleCount' in cardDefinitions.cycle` 檢查通過（field 不存在時屬性檢測 false）。
- 其他改動皆為 markdown／JSON 註解／文字置換，不影響 test 集。

## 2026-08-17 — Batch 1：結構衝突修正（A1／A2／A3）

狀態：`ADOPTED`

範圍：對齊 sim 與 runtime 的崩勢公式、修正 crusher 破甲互動、移除規格未載明的 crusher 隱藏罰則。runtime 玩法首次因 sim baseline 而改動，須以 Windows 端 `npm run test` / `npm run build` 完整驗收後才視為完成。

異動檔案：

- `src/core/battle/VitalResolver.ts`：崩勢公式對齊 sim。新增 `BROKEN_HP_PENALTY = 4`、`BROKEN_BALANCE_REFILL = 8` 兩個 export const；`resolveDamage` 在 `justBroken` 時追加 4 HP 內傷並將 balance 重置為 8。（A1）
- `src/core/battle/VitalResolver.test.ts`：更新 `keeps shield and stance outcomes separate from death` 期望值（原 hp:18/balance:0 改為 hp:14/balance:8/hpLoss:6），並新增 `adds the broken HP penalty once and refills balance on the same hit` 驗證同一路徑不重觸發、balance 不重複回滿。（A1）
- `docs/CURRENT_COMBAT_SPEC.md`：崩勢術語補寫「本擊追加 4 點 HP 內傷、架勢重置為 8」與「broken 旗標維持到本輪演出結束，下一輪建立時清除」。（A1）
- `src/core/battle/MonsterRules.ts`：`resolveMonsterHit` crusher 分支的 `consumeTrait = true` 僅在非破甲攻擊時設立；破甲仍加 2 balanceDamage 但不消耗厚甲。`resolveMonsterClashPower` 移除 crusher 非破甲 clashPower −1 罰則。（A2＋A3）
- `src/core/battle/MonsterRules.test.ts`：`crusher + break` 期望 `consumeTrait:false`（原 true）；`crusher + heavy` 的 clashPower 期望 8（原 7）。

異動前後（逐檔）：

- `VitalResolver.ts`
  - Before：`const balance = Math.max(0, state.balance - balanceDamage); const justBroken = !state.broken && balance === 0; ...`（崩勢時 balance 停 0、不追加 HP）
  - After：新增 `BROKEN_HP_PENALTY`／`BROKEN_BALANCE_REFILL` 常數；崩勢時 `hp = Math.max(0, hp - directHpLoss - 4)`、`balance = 8`；`hpLoss` 改為 `state.hp - hp` 反映實際扣血。
- `VitalResolver.test.ts`
  - Before：`expect(result).toMatchObject({ hp: 18, ..., balance: 0, justBroken: true, ... })`
  - After：`expect(result).toMatchObject({ hp: 14, ..., balance: 8, ..., hpLoss: 6 })` 並新增二段崩勢後不重疊觸發的檢查。
- `CURRENT_COMBAT_SPEC.md`
  - Before：`` `崩勢`：架勢歸零；取消尚未執行的行動並進入易受終結狀態。 ``
  - After：`` `崩勢`：架勢歸零；本擊追加 4 點 HP 內傷、架勢重置為 8，並取消本輪尚未執行的行動…broken 旗標維持到本輪演出結束，下一輪建立時清除。 ``
- `MonsterRules.ts` crusher `resolveMonsterHit` 分支
  - Before：`if(archetype==='crusher'&&context.traitReady){consumeTrait=true;if(card.definitionId==='break'){balanceDamage+=2;cue='stone-guard'}else{damage=Math.max(1,damage-5);cue='stone-guard'}}`
  - After：`if(archetype==='crusher'&&context.traitReady){if(card.definitionId==='break'){balanceDamage+=2;cue='stone-guard'}else{damage=Math.max(1,damage-5);consumeTrait=true;cue='stone-guard'}}`
- `MonsterRules.ts` `resolveMonsterClashPower`
  - Before：`if(archetype==='swift'&&card.tempo<=0)return Math.max(0,card.clashPower-2);if(archetype==='crusher'&&card.definitionId!=='break')return Math.max(0,card.clashPower-1);if(archetype==='hexer'&&card.clashPower>=7&&card.definitionId!=='break'&&card.definitionId!=='delay')return Math.max(0,card.clashPower-2);return card.clashPower`
  - After：移除 crusher 分支 → `if(archetype==='swift'&&card.tempo<=0)return Math.max(0,card.clashPower-2);if(archetype==='hexer'&&card.clashPower>=7&&card.definitionId!=='break'&&card.definitionId!=='delay')return Math.max(0,card.clashPower-2);return card.clashPower`
- `MonsterRules.test.ts`
  - Before：`crusher+break → consumeTrait:true`；`crusher+heavy clashPower → 7`
  - After：`crusher+break → consumeTrait:false`；`crusher+heavy clashPower → 8`

Sim baseline 前後（5000 場，Batch 0 → Batch 1）：

| 指標 | Batch 0 | Batch 1 | Δ |
|---|---|---|---|
| Tactical winRate | 74.4% | 77.4% | +3.0 pt |
| Naive winRate | 57.0% | 63.2% | +6.2 pt |
| Tactics uplift | 17.4 pt | 14.2 pt | −3.2 pt |
| averageRounds (tactical) | 12.33 | 12.36 | +0.03 |
| averageSurvivors (tactical) | 2.42 | 2.55 | +0.13 |
| Survivor 4 人全通 | 32.2% | 35.0% | +2.8 pt |
| Survivor 0 人全滅 | 22.9% | 20.0% | −2.9 pt |
| swift Pressure | 1.13 | 1.15 | +0.02 |
| crusher Pressure | 0.95 | 0.89 | −0.06 |
| hexer Pressure | 0.80 | 0.81 | +0.01 |
| Quick hit rate | 46.8% | 51.4% | +4.6 pt |
| Break avgDmg | 6.24 | 6.19 | −0.05 |

觀察：

- A3 移除 crusher 非破甲 clashPower −1 → 快斬對 crusher 的命中率上升，帶動 tactical 與 naive 勝率各升 3 與 6 個百分點。naive 升幅較大代表這條隱形罰則本質上是對「隨便打」的懲罰，移除後 naive 得利較多，也符合原本平衡分析的預期（naive 63% 過高）。
- 這使 T4（玩家 HP 44→42）需重新評估——目前 tactical 77.4% 仍在 82% test 門檻內，但 naive 63.2% 與 Batch 0 前的 62.9% 幾乎持平，代表 A3 之後又需要一輪壓力上調。
- A2 修正的 crusher 破甲不消耗厚甲，讓 crusher Pressure 微降（0.95→0.89）——原因是破甲不再順便清厚甲，玩家出破甲後仍需一張非破甲來吃厚甲減傷，但 sim 策略函式優先選擇 break vs crusher，會導致同輪只出一張破甲後其他攻擊面對厚甲時 damage −5。這符合規格意圖。
- crusher counterRate 維持 45.7%——A2 未破壞既有 counter 讀取。

驗收門檻對齊：

- `VitalResolver.test.ts`：三段既有 test + 一段新 test，共 4 段全部 self-consistent。
- `MonsterRules.test.ts`：六段既有 test，兩處數字期望更新對齊新公式。
- `CombatSimulation.test.ts`：winRate 0.42–0.82 ✓（77.4%）、uplift > 5 ✓（14.2 pt）、其餘門檻無變動皆通過。
- `BalanceSimulation.test.ts`：不受本批影響，仍全過。

尚未執行：

- Windows 端 `npm run test` / `npm run build` / `git diff --check`。
- 掩護截刀護符（PLANNING_LOG 8/17 conflict #2）尚未在 runtime 實作，屬 Batch 2 候選。
- 平衡調整 T1–T4 需以 Batch 1 baseline 重新規劃：hexer 加傷可維持原建議、T4 玩家 HP 降到 42 建議提早執行以平衡 A3 移除後的 naive 勝率抬升。

## 2026-08-17 — 第一區暖身難度斜坡（battle-1／battle-2）

狀態：`ADOPTED`

原因：使用者實測第一區戰鬥「連場都打不過」。sim `tactical` 策略 77.4% 勝率內建完美卡片決策，與第一次接觸的玩家實際手感差距過大；且第一戰即直接 4v4 全種混合敵人，沒有難度斜坡讓玩家逐步認識三種怪物規則。

異動檔案：

- `src/presentation/scenes/BootScene.ts`：`rebuild()` 內敵人數量決定段加入 `if(this.journeyNodeId==='battle-1'||this.journeyNodeId==='battle-2')this.ec=2;`。elite-1 與 boss-1 維持 4 敵人。

異動前後：

- Before（line 108 尾）：無 journey-node 專屬 ec 調整；`this.ec` 沿用 constructor 預設 4。
- After（line 108–110）：新增註解＋一行 override，`battle-1`／`battle-2` 強制 `ec=2`；其他節點（elite-1／boss-1／無 journeyNodeId 直接跳戰場）維持原設定。

派生效果：

- `battle-1` 與 `battle-2` 敵人組合變為 `[swift, crusher]`（`(['swift','crusher','hexer'])[i%3]` 取前兩項），玩家先接觸「快牌 vs 殘影」與「破甲 vs 厚甲」兩條規則，hexer 咒返延到 elite 才登場。
- 玩家 pc 維持 4；4 對 2 差距讓玩家有隊伍調度空間認識機制。
- 隨機目標分配仍然：2 敵人隨機挑 4 玩家，被集火機率理論上比 4v4 低。

未動：

- A1 崩勢懲罰（+4 HP／balance 重置 8）仍在 `VitalResolver` 上線；使用者尚未明確指示是否 revert。runtime 難度中崩勢代價仍偏高，若加上本斜坡後實測仍難，建議 revert A1。
- sim baseline 不受本次影響（sim 一律跑 4v4 全種）；如需驗證斜坡後的第一戰勝率，需另建 `simulateOne` 的 2v4 變體。

Windows 端驗證：

- `npm run test`：BootScene 沒有專門單元測試，變動不影響 `BattleLayout.test.ts`／`BattleCore.test.ts`／等其餘 27 個測試檔的斷言。
- `npm run build`：預期通過。
- 實機驗證入口：`?journey=1` → 選 `battle-1` → 應看到玩家 4、敵人 2（swift + crusher），左側玩家、右側敵人。

## 2026-08-17 — 卡組配比調整（藍綠色壓迫）

狀態：`ADOPTED`

原因：使用者實測「一堆藍綠色被迫防守」。sim 統計側佐證：guard 62% 未使用、cover 63% 未使用、cycle 74% 未使用。18 張中 6 張防禦／支援（33%）過多，且未使用卡跨輪保留讓爛手手感累積。

異動檔案：

- `src/core/cards/BattleCards.ts`：`teamDeckRecipe` 從 `[3quick,2heavy,3break,2guard,2cover,2relay,2cycle,2delay]` 調整為 `[4quick,2heavy,3break,1guard,2cover,2relay,1cycle,3delay]`。總 18 張不變；防禦＋支援 6→4；攻擊＋干擾 12→14。

異動前後：

- Before：`['quick','quick','quick','heavy','heavy','break','break','break','guard','guard','cover','cover','relay','relay','cycle','cycle','delay','delay']`
- After：`['quick','quick','quick','quick','heavy','heavy','break','break','break','guard','cover','cover','relay','relay','cycle','delay','delay','delay']`

配比變動摘要：

| 卡 | Before | After | Δ | 理由 |
|---|---|---|---|---|
| quick 快斬 | 3 | 4 | +1 | 主戰攻擊補充 |
| heavy 重斬 | 2 | 2 | 0 | 稀有終結牌感 |
| break 破甲 | 3 | 3 | 0 | 對 crusher 必需 |
| guard 堅守 | 2 | 1 | −1 | 只保護自己且 62% 爛手 |
| cover 掩護 | 2 | 2 | 0 | 唯一救隊友途徑 |
| relay 接力 | 2 | 2 | 0 | 保留 |
| cycle 整備 | 2 | 1 | −1 | 74% 爛手 |
| delay 牽制 | 2 | 3 | +1 | 攻擊性干擾補位 |

手牌 5 張期望值變化：

- 攻擊 1.94 → 2.22（+0.28）
- 干擾 1.39 → 1.67（+0.28）
- 防禦 1.11 → 0.83（−0.28）
- 支援 0.56 → 0.28（−0.28）

平均每兩手牌只會抽到 1 張防禦，替代先前每手牌 1 張以上的防禦壓迫。

測試影響：

- `BattleCards.test.ts` 第 3 段只斷言「八家族都存在」與 `cycle.restoreBalance:3, clearExposed:true`，未斷言各家族張數。本次改動不會破壞既有 test。
- `BalanceSimulation.test.ts` 使用 `createTeamDeck()`：avgHeavyCards 期望 0.35–0.8，新 recipe 仍為 2 張 heavy → 期望值 5×2/18=0.56，通過。deadHandRate 期望 <0.08、intentCoverage >0.62：攻擊卡增加會提升 intentCoverage，通過。

Sim 尚未重跑：需要另外對 `CombatSimulation.simulateOne` 跑一次 5000 場，觀察 tactical／naive 勝率、guard/cycle 使用率、hexer Pressure 變化。此為下一步，本節僅記 recipe 變更。

## 2026-08-17 — 待處理：護符持續性設計

狀態：`PROPOSED_PENDING_DIRECTION`

使用者新回饋：「被迫防守沒有代價，例如護甲上來本局可有效減傷」。目前護符（shield）在 `VitalResolver.resolveDamage` 中被單次傷害吸收即消失（`blocked = min(shield, damage); shield -= blocked;`）——一場堅守只擋一次，之後又暴露在滿傷害下，等於防禦牌只買到一發保命。

候選方向（不含實作，等使用者選）：

- **A. 護符轉為固定減傷（Damage Reduction %）**：`resolveDamage` 保留 shield 但不消耗；每次受擊按 `shield_remaining / cap × max_dr%`（如 40%）減傷。shield 隨回合自然衰減或到戰鬥結束才清。改動集中在 `VitalResolver`，不動卡面。
- **B. 拆成「護符（單擊吸收，即用即銷）」與「護甲（本局持續減傷）」**：guard 給護甲、cover 仍給護符。護甲用一個新欄位 `armor?:number` 表達；受擊時先吸 armor 定量（如 4）、再吸護符、再進 HP。需改 `VitalState`、`resolveDamage`、`FighterHudPresenter`。
- **C. 護符半消耗**：受擊只消耗 `Math.ceil(blocked/2)` 或按 50% 保留；shield 用得更久。改動最小但語意有點含糊，玩家難算。
- **D. 引入「防禦姿態」buff 而非增加護符**：堅守 → 出牌者本局內下一段 N 輪內每擊 −Y 傷；不動 shield 語意，但要新增 buff 生命週期管理，改動最重。

規格衝突：現行 `CURRENT_COMBAT_SPEC.md` 只描述「護符 12」、「護符 9」，未定義是否單擊消耗。任何選項都需要同步更新規格與 `art-bible.md` 若涉及 UI（護甲條 vs 護符條）。

建議：優先 A 或 B。A 動 code 最少，B 語意最清楚。等使用者選擇後才實作，本節先入 log 做決策記錄。
## 2026-08-18 — 角色清晰度與死亡 HUD 清理／Bootstrap 重驗

狀態：`IMPLEMENTED`；視覺候選仍需 Art Director 核准。

採用：

- `HeroinePose.heroineDisplayHeight()` 將玩家角色顯示高度依隊伍規模調整為 1V1 160、2V2 138、3V3 122、4V4 108 logical px。這是 runtime 可讀性修正，不重繪或重新猜 Character Master。
- 死亡 HUD 由 `FighterHudPresenter.refresh()` 以 `alive=false` 作為生命週期閘門：隱藏 root、崩勢／破綻文字、護符與架勢標記並清空血條；死亡不再建立「斷命」浮字。
- `canIntercept` 恢復為與現行規則一致的「替代者速度必須高於目標最終時序」純函式，避免靜態稽核批次讓 build／測試失效。
- 卡片實例測試改以目前正式配方中的四張快斬驗證 instanceId 唯一性，不再假設整備有兩張。

實機驗證：

- `?draw-proof=1`（1280×720）確認玩家在左、敵人在右；4V4 角色輪廓比原 96px 更易讀，中央仍保留交鋒空間。
- `?death-proof=1` 確認死亡生命週期不再顯示死亡者 HUD 狀態；死亡證據仍需在實際擊殺結算瞬間補拍一次。

自動驗證：`npm run test` 27 files／111 tests 通過；`npm run build` 通過（Vite 仍有非阻擋 bundle size warning）；`git diff --check` 通過。

 Bootstrap 重驗：Graphify 已更新 `src` 為 306 nodes／824 edges，query smoke 與 `FighterHudPresenter` affected query 通過。Serena 的 `EPERM lstat C:\\Users\\Index7` 已於 2026-08-18 修復：在使用者目錄根層為 `CodexSandboxUsers` 補上非遞迴 Read & Execute 權限；以 `PYTHONIOENCODING=utf-8` 執行的 `serena project health-check` 已通過 symbols、named-symbol 與 references smoke tests。`semantic_navigation=READY`。
## 2026-08-18 — Bootstrap 修復後回歸驗證

狀態：`VERIFIED`。

- `serena project health-check`（`PYTHONIOENCODING=utf-8`）成功；TypeScript LSP、symbols、named-symbol 與 references smoke tests 均通過。
- `graphify` 的 `FighterHudPresenter` query 與 `BootScene` affected query 通過。
- `npm run build` 通過。完整 `npm run test` 在並行負載下曾因 3,000 場模擬超過 Vitest 預設 5 秒而 timeout；單獨以 `--testTimeout=15000` 重跑後 27 files／111 tests 邏輯全部通過。
## 2026-08-18｜千景／朧角色素材完善（runtime trial）

- 原因：使用者要求完善新角色素材，但千景與朧目前仍是 `RUNTIME_QA_PASS_PENDING_ART_DIRECTOR_APPROVAL`，不能重新猜服裝或無限生成衍生圖。
- 採用：保留兩張 Master 作單一身份來源；以 `HeroinePose.ts` 補齊 PB／PC 的 ready、attack、hit、down runtime 表現。死亡使用 52% 顯示高度、78° 倒地與低彩 tint，回到非死亡姿態時恢復 0°／白色 tint，避免額外資產與方向漂移。
- 驗收：先跑角色單元測試、build、diff check；實機仍需 1280×720 與 844×390 戰鬥截圖，最後由 Art Director 決定是否核准 Master。

## 2026-08-18｜PD 死亡素材修正（runtime trial）

- 問題：PD 使用原 `heroine-sd-down-v1.png` 時，透明底部保留 32 px，進入 4V4 的縮放後死亡角色看起來過小且漂浮。
- 修正：只做 deterministic alpha crop，產生 `heroine-sd-down-v2.png`（9 px baseline gap），未重繪角色；BootScene 已改載入新候選。
- 驗證：角色 validator 通過 true-alpha、bbox、baseline、usable-crop；仍需在正式戰鬥場景擷取死亡畫面確認比例與接地，資產狀態維持 runtime-trial。

## 2026-08-18｜準備階段角色辨識與動作幀盤點

- 採用：準備階段不再降低其他存活玩家的角色或 HUD 透明度；以 `idle` 與當前角色的 `ready` pose、中心聚焦與殺生線亮度區分狀態。
- 動作盤點：PA／PD 使用既有 `idle / ready / strike / down` 最低集；千景／朧因 Master 尚未核准，維持單一 Master 加 runtime `ready / strike / hit / down` 位移、旋轉、染色與 FX，不生成新的身份猜測圖。死亡素材已由 PD 的 deterministic crop 修正。
- 缺口：千景／朧獨立 Ready／Down 圖仍須 Art Director 先核准 Master；核准前不自動生成衍生 pose。

## 2026-08-18｜千景／朧核准與卡型 FX 語彙

- 決策：使用者核准千景與朧 Master；兩份 Character Master 與 approved index 已更新。
- 採用：攻擊不再只依賴單張撞擊圖。快斬使用雙道弧形刀光，重斬使用厚弧刀光＋地面衝擊，破甲使用裂片，牽制使用冷色束縛環，接力使用交接金色刀路，堅守使用護盾橢圓，掩護使用中途截斷符號，整備使用綠色回復環。
- 範圍：沿用 Romancing SaGa 式「少量角色幀＋強烈瞬間 FX」；不新增八方向、武器切換或角色骨架動畫。

## 2026-08-18｜PA／PD 死亡圖接地修正

- 問題：橫躺死亡圖沿用 standing sprite 的中心 pivot，PA／PD 在 4V4 會向上浮，視覺上不像倒在原站位。
- 修正：所有玩家角色記錄共同 `heroBaseY`；down pose 依顯示高度差補回 `(baseHeight - downHeight) / 2`，恢復 idle／ready 時回到原始 local Y。PB／PC 的 runtime down transform 同樣沿用此基準。
- 驗證：HeroinePose 5/5、build、diff check 通過；需再以 1280×720／844×390 截取四槽死亡畫面完成人工驗收。

## 2026-08-18｜移除戰鬥底部行動 Log 欄位

- 問題：底部 y=548 的狀態框會把行動 log 顯示在戰場與卡牌區之間，佔用畫面並干擾角色／殺生線閱讀。
- 修正：保留內部 `status` 作為輸入驗證與 debug state sink，但不再加入玩家可見 HUD，也不保留底部欄位框。

## 2026-08-18｜千景／朧動作候選與卡型 FX 完整化

- 實作：新增 `tools/generate_character_pose_trials.py`，從核准 Master deterministic 產生千景／朧 `ready / attack / hit / down`，不改身份設計；BootScene 與 HeroinePose 已載入並切換這些 runtime-trial 圖。
- FX：快斬雙刀弧、重斬厚弧＋地面衝擊、破甲裂片、牽制冷色束縛環、接力金色交接刀路、整備綠色回復環、堅守護盾橢圓、掩護截斷符號均已分流。
- 驗收狀態：素材 deterministic validator 對 ready 與 crop 後候選通過；須再完成 1280×720／844×390 的 idle、attack、hit、down 截圖人工驗收，未通過前維持 runtime-trial。

## 2026-08-18｜第一區雨暮山線怪物與路線 Demo

- 採用 6 種普通怪規則：濡骸（基礎交鋒）、提燈童（高速截刀）、山犬（高速壓線）、辻傘（慢速重擊）、縊鬼（高架勢傷害）、迷途僧（牽制）；精英為雨夜武者（居合／踏込／崩し），Boss 為雨暮山主。
- 路線改為出發 → battle-1 → 上／下分線各 2 戰 → 精英 → Boss；移除第一區的伙伴、事件與探索節點，保留事件型別供未來擴充。
- 新增路線視覺素材：`route-bg-rainfall-ridgeline.svg`、`track-segment.svg`、`node-icons.svg`；JourneyScene 已接入雨暮山背景與俯視列車 token。

## 2026-08-18｜斬擊 FX 加強與角色 texture 載入修正

- 問題：原本交鋒仍以 `slash-fx` 圖片作主視覺，刀刃感不足；千景／朧新增 pose texture 需要明確載入並切換，否則部署版可能出現黑方塊或缺圖。
- 修正：ClashPresenter 新增雙層刀刃弧（厚色刃光＋白色刃緣拖尾）；ActionPresenter 保留卡型專屬 FX。BootScene 明確 preload 千景／朧 pose v1/v2，HeroinePose 依 Master prefix 切換 texture，idle 時切回 Master。
- 驗證：本地 runtime pose 檔案均存在，validator 對實際使用的 v2 attack 素材通過；build、角色測試與 diff check 待本批完成後執行。

## 2026-08-18｜刀斬拖尾與缺圖 fallback

- 使用者回饋：原斬擊仍不像刀，黑方塊表示千景／朧 pose texture 在部分 runtime／部署環境載入失敗。
- 修正：斬擊改為厚外弧＋白色內刃＋命中白閃＋方向性碎片，交鋒與單體攻擊共用；HeroinePose 切換 texture 前檢查 texture manager，缺圖時保留 Master，不再把失敗 key 渲染成黑方塊。
- 驗證：HeroinePose 5/5、build、diff check 通過。Vercel 需重新部署本批 build 後才能看到新 FX 與 fallback。

## 2026-08-18｜CC0 刀斬素材候選接入與怪物母版審核門

- 使用者否決原程序化斬擊，要求改用免費可商用資產；採用 OpenGameArt `Weapon Slash - Effect` 的 CC0 Classic 6 幀序列，組成 `public/assets/battle/weapon-slash-cc0/classic-slash-sheet.png`，ActionPresenter 與 ClashPresenter 改以播放序列取代舊單張斬擊。
- 怪物不再批量視為完成。濡骸先做為第一張候選母版預覽；只有使用者核准後，才製作提燈童，依序逐隻審核。
- 狀態：斬擊候選已接入待實機截圖驗收；濡骸母版仍為候選，未核准；其餘怪物暫停生成。

## 2026-08-18｜濡骸母版由使用者提供

- 使用者提供 `ChatGPT Image 2026年8月18日 下午11_18_32.png` 作為濡骸母版參考；已保存至 `assets/candidates/monsters/rainfall-ridgeline/wet-corpse/wet-corpse-master-reference.png`。
- 建立 `docs/monsters/wet-corpse.md`，固定蓑笠、濕纖維、蒼白肢體、鏽蝕厚刃、比例、側視與禁止變體。
- 狀態：母版候選等待 Art Director 核准；未生成其他怪物，下一步只會製作濡骸 side-view 候選並先展示。

## 2026-08-18｜提燈童母版由使用者提供

- 使用者提供 `ChatGPT Image 2026年8月18日 下午11_21_20.png` 作為提燈童母版參考；已保存至 `assets/candidates/monsters/rainfall-ridgeline/lantern-child/lantern-child-master-reference.png`。
- 建立 `docs/monsters/lantern-child.md`，固定小型比例、破蓑笠、濕髮、紅繩鈴鐺、紙燈籠與側視規則；藍色鬼火只列為 runtime FX，不得烘焙進角色。
- 狀態：提燈童母版候選等待 Art Director 核准；尚未生成山犬等後續怪物。

## 2026-08-18｜山犬母版由使用者提供

- 使用者提供 `ChatGPT Image 2026年8月18日 下午11_23_41.png` 作為山犬母版參考；已保存至 `assets/candidates/monsters/rainfall-ridgeline/mountain-hound/mountain-hound-master-reference.png`。
- 建立 `docs/monsters/mountain-hound.md`，固定濕黑毛、四足低伏輪廓、紅色裂紋、符札與鈴鐺；紅色妖氣列為 runtime FX，不烘焙進 sprite。
- 狀態：山犬母版候選等待 Art Director 核准；尚未生成辻傘等後續怪物。

## 2026-08-18｜辻傘母版與 Claude 交接

- 使用者提供 `ChatGPT Image 2026年8月18日 下午11_26_22.png` 作為辻傘母版參考；已保存至 `assets/candidates/monsters/rainfall-ridgeline/wayfarer-umbrella/wayfarer-umbrella-master-reference.png`。
- 建立 `docs/monsters/wayfarer-umbrella.md`，固定破傘主輪廓、單眼、符札、鈴鐺與慢速重擊定位；紅色煙霧列為 runtime FX。
- 建立 `docs/HANDOFF_CLAUDE_ART.md`，記錄母版位置、斬擊 CC0 FX 接入點、衍生素材規則、驗收流程與目前工作邊界。
- 狀態：辻傘母版候選等待 Art Director 核准；尚未生成 side-view 或後續怪物。
# 2026-08-19｜D 槽改版黑畫面／閃退與同步結構修復

- 狀態：`VERIFIED_PENDING_SYNC`
- 建置錯誤：`BootScene` 的 killing-intent tween 把 `number | null` 傳給 `CubicBezier.getPoint`；改以 `t.getValue() ?? 0` 保證合法進度值。
- 執行期根因：BootScene 在顯示路線前預載兩首戰鬥 MP3，JourneyScene 又阻塞載入旅程 MP3；WebAudio 解碼期間 Phaser 場景停在 LOADING，造成十多秒黑畫面，使用者體感為閃退。
- 修正：路線入口跳過全部戰鬥素材；旅程與戰鬥音樂改為畫面建立後背景載入，音訊慢或失敗不再阻塞場景。
- 斬擊修正：`classic-slash-sheet.png` 為 750×150、6 幀，frameWidth 由 126 修為 125，恢復第 6 幀。
- Git 修復：前次 `71502a6` 誤刪受追蹤 `src` 並加入 ZIP／RAR；本批重新追蹤現行 `src`，大型本機備份保留但由 Git 忽略。
- 驗證：27 files／115 tests 通過；正式 build 通過；D 槽 `:5174` 實測路線與 `?draw-proof=1` 4v4 戰場均成功顯示。

# 2026-08-19｜修正 Vercel 交鋒鏡頭建置錯誤

- 狀態：`VERIFIED`
- 原因：平手交鋒呼叫 `focusCamera(clashX, clashY, 1.32, 160)`，但函式僅宣告三個參數，TypeScript 在 Vercel 建置時回報 TS2554。
- 修正：`focusCamera` 新增可選 `duration` 參數，預設維持 190ms；平手交鋒保留原設計的 160ms 鏡頭壓進，其餘呼叫行為不變。
- 驗證：`npm run test` 27 files／115 tests 全通過；`npm run build` 通過；`git diff --check` 通過。Vite bundle size warning 不阻擋部署。

## 2026-08-20 — Named player assets and identity separation

- Adopted stable player character IDs: `rin`, `chikage`, `oboro`, and `mo`; removed PA/PB/PC/PD from authoritative source and tests.
- Kept current DEMO placement in `actorIndex`, explicitly separate from character identity so future party formation can reorder the roster.
- Integrated the 8-pose runtime contract for all four characters. Rin uses the corrected horizontal set from `chikage_oboro_rin_split_assets_v1`; Chikage and Oboro use the same package; Mo uses `momiji_rin_single_assets_v1`.
- Integrated current/timeline portraits for all four and Mo attack FX. Assets remain runtime trials with user-supplied provenance/license pending.
- Verification: production build passed; full suite passed (29 files, 117 tests). Deterministic PNG checks passed for all Rin, Chikage and Oboro runtime frames; all Mo frames report `foot-baseline-margin` at 6 px and remain a runtime-trial QA issue rather than approved final assets.
- Runtime screenshots at 1280×720 and 844×390 show all four named characters facing right with readable silhouettes, grounded pivots, consistent scale, and no actor/HUD overlap. The mobile landscape layout remains readable. Existing unrelated legacy SVG loader errors were still present in the console.

## 2026-08-20 — Safe branch-aware sync scripts

- Added `sync.bat` as the interactive entry point for status, download, and upload.
- Download now fast-forwards the current named branch and refuses dirty, detached, missing-remote, or diverged states.
- Upload now supports the current named branch, fetches before acting, refuses when its remote is ahead, previews tracked and untracked files, and requires explicit `YES`, `COMMIT`, and `PUSH` confirmations.
- Cancelling after staging performs a non-destructive mixed reset; working files remain intact.
- Replaced corrupted sync messages with ASCII-safe text so Windows consoles display the safety prompts reliably.

## 2026-08-20 — Fix Rin/Mo black textures in production lifecycle

- Root cause: named player assets were queued from `BootScene.init()`. Chikage and Oboro were also loaded by legacy `preload()` entries, masking the lifecycle bug for those two characters, while Rin and Mo became missing black textures in the Vercel production build.
- Moved the named-player asset queue into the actual Phaser `preload` lifecycle for all four characters.
- Verification: clean alternate production output completed successfully; Rin and Mo runtime files were present under the generated Vercel-style output; full suite passed (29 files, 117 tests).
