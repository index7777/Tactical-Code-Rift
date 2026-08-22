# Combat Demo Completion / Asset / Enemy Balance Plan

STATUS = PLANNING_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

把目前新版戰鬥從「規則與基本 presentation 可運作」推到使用者提供參考圖所代表的 Demo 完成度：戰場為主體、常駐 HUD 輕量、選牌後進入明確 focus mode、目標預演直接落在戰場、執行時決策 UI 退場並由 action / hit feedback 接管。

本文件只做規劃與數值提案；不接入資產、不修改 runtime、不生成新圖。

## Demo 範圍

Demo 以目前 `EncounterCatalog` 的 7 場戰鬥為完整範圍：

- Normal ×5：`battle-1`、`battle-2-upper`、`battle-2-lower`、`battle-3-upper`、`battle-3-lower`
- Elite ×1：`elite-1`
- Boss ×1：`boss-1`

四名玩家沿用目前生命基準：凜 40、千景 44、朧 36、紅葉 48。

## 1. 要做到參考方向，一共還要做多少事情

以「deliverable」計算，不把每個小函式拆成工作項：**必做 29 項，選配 polish 5 項，共 34 項上限。**

### A. 戰鬥畫面狀態 / Focus Mode — 4

1. PLAYER_IDLE：戰場 S、五張牌 A、常駐 HUD B。
2. CARD_SELECTED：selected card 真正放大／前移，其他牌退階。
3. TARGET_PREVIEW：selected card + selected target 成為唯一主 focus 群組。
4. EXECUTE_RESOLVE：card detail / target preview / command UI 退場，action FX 接管。

### B. Shared Hand / Card Presentation — 4

5. Card Master candidate 驗收與最終 anatomy。
6. 5 family visual 的 crop / alpha / safe-zone 規格。
7. selected-card detail layout（runtime text，不烘數字）。
8. Dispatch 與 Card decision 完全分層。

### C. Target / Preview — 4

9. single target reticle。
10. any-ally guard target affordance。
11. AoE / multi-target preview contract（Boss 需要）。
12. Timeline / damage / Delay / window preview 與戰場 target 同步。

### D. Timeline / Party / Enemy Info — 5

13. compact Timeline：6–8 nodes、active、ghost/new position。
14. Party HUD：portrait / HP / status 極簡化。
15. Enemy overhead HP / status module。
16. Enemy Intent cue 從大型面板降級成 overhead / modular info。
17. active / selected / critical accent 規則統一，常駐 UI 不用強 glow。

### E. Action / Combat Feedback — 5

18. normal hit presentation。
19. Guard success presentation。
20. Delay / control success presentation。
21. Break / armor-break / imbalance presentation。
22. lethal / interrupt / critical hierarchy（可以共用 existing impact，不必各生整套素材）。

### F. Enemy Action Data / AI — 4

23. 正式 EnemyActionDefinition schema。
24. deterministic intent rotation / weighted policy。
25. target-selection policy。
26. multi-target / multi-hit / phase / telegraph 等 Demo 所需 action semantics。

### G. Encounter Balance / QA — 3

27. 5 Normal encounter HP / damage / action cadence 校正。
28. Elite / Boss 專用數值、phase、Intent rotation 校正。
29. 1280×720 / 16:10 / 21:9 / 844×390 + full-route playtest / balance regression。

### Optional polish — 最多 5

- camera shake profile
- hit-stop profile
- screen flash / vignette profile
- extra status pop cue
- extra Boss transition presentation

沒有 browser/playtest 證據前不做。

## 2. 一共缺多少資產、缺多少母版

### 2.1 已有且可繼續用的 runtime asset 類別

- 四名玩家 8-pose runtime + current/timeline portraits。
- rainfall-ridgeline 普通／精英／Boss enemy masters + portraits。
- rail-halt / mountain-cut / forest-path / terminal-platform BG。
- shared slash / impact FX。
- battle / boss music、swish / impact SFX。
- 已生成 Card Master candidate：neutral frame ×1 + 5 family visuals ×5。

### 2.2 Card generated candidates

目前已有 **6 個 candidate slots**，但仍屬 candidate，不視為 release-approved：

1. card-frame-neutral
2. quick family visual
3. heavy family visual
4. guard family visual
5. disruption family visual
6. break family visual

### 2.3 Demo 真正還缺的「新 static production asset」

**必缺 3 個，最多選配再 2 個。**

必缺：

1. `break-feedback-core`：只有碎裂／破甲的固定材質核心，不烘 `BREAK` 文字、不烘傷害數字、不烘 screen bloom。
2. `guard-feedback-core`：只有固定 shield / deflect visual core，不烘 pulse / glow timing。
3. `delay-control-feedback-core`：只有固定 delay/control 識別核心，不烘數字、沙漏時點、動態 ring。

選配（browser QA 證明需要才做）：

4. `intent-danger-mark-core`：若 enemy overhead 的 heavy / charged Intent 僅靠文字讀不清。
5. `boss-phase-transition-core`：若 Boss phase transition 缺少固定識別材質。

Target reticle、AoE ring、trajectory、selected glow、damage numbers、CRIT/BREAK 文字、HP fill、Timeline connector 全部為 runtime/procedural，不算缺 asset。

因此：

- **目前空缺 mandatory static asset = 3**
- **optional static asset = 0–2**
- **Card candidate 已有 = 6，但尚待 production approval**

### 2.4 Presentation 母版

以「可重用 presentation master」計算，Demo 需要 **7 套母版**：

1. Battle Stage master — 已有 `BattleStageProfile`，需 browser calibration，不缺。
2. Card Master — 已有 candidate / Phase 10l anatomy，需定稿，不缺新概念。
3. Selected Card Focus master — **缺**。
4. Target Preview master — **缺**。
5. Compact Timeline master — **缺**。
6. Enemy Overhead / Intent master — **缺**。
7. Execute / Combat Feedback master — **缺**。

Party HUD 不另外算華麗美術母版；它應服從 compact HUD rules，以程序化資訊 layout 為主。

結論：**7 套 presentation masters 中，2 套已有基礎、5 套仍缺正式定稿。**

## 3. 攻擊與行動目前缺的系統資料

目前 `IntentState` 有 name / targetIds / damage / delay / canDelay / canInterrupt / canGuard / canRedirect / statusEffects，Card 有 category / delay / targetRule / effect。這足夠 single-target prototype，但不足以支援完整 Demo enemy / elite / boss 行動。

建議新增 `EnemyActionDefinition`，至少補以下資料：

### Identity / presentation

- `id`
- `name`
- `family`: quick / standard / heavy / control / special
- `cue`: presentation cue key，不是 baked asset path
- `priority`: Intent UI hierarchy

### Targeting

- `targetMode`: single / all-players / random-n / lowest-hp / highest-hp / self
- `targetCount`
- `retargetOnDeath`

### Result

- `damage`
- `hitCount`
- `damagePerHit` 或明確 total semantics
- `playerDelay`：是否延後玩家下一行動
- `statusPayload[]`：可實際被 resolver 執行的 typed status，而不是只有 string label
- `selfStatusPayload[]`

### Timeline / control interaction

- `actionDelay`
- `canDelay`
- `canInterrupt`
- `canGuard`
- `canRedirect`
- `controlResistanceOverride?`

### Telegraph / AI

- `telegraphLevel`: normal / danger / signature
- `weight`
- `cooldownActions`
- `cannotRepeat`
- `requiresHpBelow?`
- `requiresHpAbove?`
- `phase?`
- `previousActionExclusion?`

### Boss / Elite only

- `phaseId`
- `phaseThreshold`
- `phaseEntryAction?`
- `enrageThreshold?`
- `summon / add policy?`（Demo 可先不做）

### Presentation timing（資料，不是圖片）

- `windupMs`
- `contactMs`
- `recoveryMs`
- `cameraProfile`
- `hitStopProfile`
- `sfxCue`
- `fxCue`

這些欄位讓 action system 可以共用 presentation，而不是每個敵人寫 Scene 特例。

## 4. Demo 普通怪物 HP / 攻擊設計

### 數值目標

- 一般小怪預期承受約 2–4 次標準我方命中；不要每隻都被一張 heavy 秒殺，也不要拖成 Boss。
- 普通怪 single hit 約玩家最大生命的 15–30%。
- telegraphed heavy 最多約 30–36%，而且必須能 Guard / Delay / Interrupt 至少一種方式應對。
- Normal base control resilience 以 0 為主，較厚重／控制型可為 1。

### 建議 HP / resilience

| Enemy | HP | Base resilience | 定位 |
|---|---:|---:|---|
| lantern-child | 34 | 0 | fast / low HP |
| wet-corpse | 42 | 0 | baseline melee |
| mountain-hound | 40 | 0 | fast pressure |
| noose-ghost | 40 | 1 | control |
| lost-monk | 48 | 1 | control / mid |
| wayfarer-umbrella | 58 | 1 | heavy / high HP |

### 建議 Intent

#### lantern-child

- `鬼火疾走`：7 damage、action Delay 3、single、normal。
- `燈影截`：8 damage、action Delay 4、single、normal。

#### wet-corpse

- `柴刀斬`：9 damage、Delay 5、single。
- `濡手`：7 damage、Delay 4、single；Demo v1 不加額外 status，避免無用系統膨脹。

#### mountain-hound

- `濡鬃撲咬`：8 damage、Delay 3、single。
- `山影追咬`：9 damage、Delay 4、single。

#### noose-ghost

- `濕繩纏`：6 damage、Delay 5、single；若 player-delay system 完成，追加 `playerDelay +1`。
- `吊影`：8 damage、Delay 5、single。

#### lost-monk

- `錫杖牽制`：8 damage、Delay 5、single；可作 control family。
- `迷途印`：6 damage、Delay 6；若 typed status system 完成，再加入短效 status，否則 Demo v1 只保留低傷害 control cue。

#### wayfarer-umbrella

- `開傘壓`：12 damage、Delay 6、single、danger。
- `傘骨重劈`：15 damage、Delay 7、single、danger；必須 canGuard / canDelay / canInterrupt。

## 5. Demo Elite / Boss HP 與攻擊設計

## Elite — rain-warrior

### 建議數值

- HP：**120**（目前 72 過短，容易被 heavy + break combo 快速刪除）
- Base resilience：**1**
- 預期戰鬥：在兩個 adds 存活的情況下約 8–12 個玩家 action window 完成主體擊殺。
- Encounter：rain-warrior + mountain-hound + wet-corpse 保留。

### Intent rotation

1. `踏込`
   - 10 damage
   - Delay 4
   - single
   - normal / fast

2. `居合`
   - 16 damage
   - Delay 7
   - single
   - danger
   - canGuard / canDelay / canInterrupt

3. `崩し`
   - 8 damage
   - Delay 5
   - single
   - control
   - 若 player-delay system 完成：`playerDelay +2`

AI：不連續兩次 `居合`；優先形成 fast → control → heavy 的可讀節奏，而不是純亂數。

## Boss — rain-boss

### 建議數值

- HP：**240**（目前 128 對 14–18 damage heavy 與 break combo 偏短）
- Base resilience：**1**；仍允許玩家用 disruption，但 temporary resilience 會阻止無限延後。
- Phase 1：100–71%
- Phase 2：70–36%
- Phase 3：35–0%
- Encounter：rain-boss + wayfarer-umbrella + noose-ghost 保留；Demo 不新增 summon system。

### Boss Intent set

#### `雨斬`

- 12 damage
- Delay 5
- single
- normal
- 全 phase 可用

#### `山影連刃`

- 6 × 2 hit（total 12）
- Delay 5
- single
- Phase 1+ 
- 需要 `hitCount` system；Guard 應定義成對整個 Intent 還是每 hit 生效，Demo 建議對整個 Intent 套一次減傷 cap。

#### `驟雨橫掃`

- 8 damage × all living players
- Delay 7
- danger
- Phase 2+
- 需要 `targetMode = all-players` 與 multi-target resolution / preview。

#### `壓雨`

- 10 damage
- Delay 6
- single
- control
- Phase 2+
- 若 player-delay system 完成：`playerDelay +2`

#### `終雨`

- 18 damage
- Delay 8
- single
- signature / danger
- Phase 3 only
- 不可連續使用；必須公開 telegraph，canGuard / canDelay / canInterrupt。

### Boss AI policy

- Phase 1：`雨斬 / 山影連刃`，建立基本讀法。
- Phase 2：加入 `驟雨橫掃 / 壓雨`，迫使玩家考慮 Guard、Delay 與多人 HP。
- Phase 3：加入 `終雨`，但不移除既有 Intent；signature attack 之後至少隔 2 次 Boss action 才可再出。
- Intent 決策 deterministic / seeded；避免完全亂數造成 QA 不可重現。

## Balance Gate

### Normal

- 任何普通敵人不得在無 Break 的情況下被 1 張 standard card 穩定秒殺。
- 一般敵人的非 danger hit 不應對 36 HP 的朧造成超過約 30% 最大生命。
- Umbrella heavy 15 約為朧 41.7%，因此必須是明確 danger Intent 且可反制。

### Elite

- 至少讓玩家看到一次 fast / control / heavy 三種節奏。
- 居合不能在未 telegraph / 無 counterplay 情況下連發。

### Boss

- 至少跨 2 個 phase 才算有效 QA run；理想完整 run 必須看到 Phase 3 signature attack。
- disruption 必須有效，但不能靠無限 Delay 讓 Boss 永久不行動。
- AoE preview、Guard、Break、Delay、Timeline reorder 都至少在 Boss fight 有一次可驗證情境。

## 執行順序

1. 先定稿本文件與 `BATTLE_UI_VISUAL_HIERARCHY_ASSET_PRIORITY.md`，不生成、不接圖。
2. 補 `EnemyActionDefinition` / typed action data contract 與 tests。
3. 做 Normal enemy data migration + deterministic Intent policy。
4. 做 Elite data / AI。
5. 做 Boss phase / multi-target / multi-hit data / resolver。
6. 完成 selected-card focus / target preview / execute-state presentation。
7. 最後才生成缺少的 3 個 mandatory combat-feedback static cores，且一檔一 logical asset。
8. 全 7 encounter balance / browser QA 後才調 final numbers。
