# 戰鬥重構實作計畫 v1

STATUS = AUTHORITATIVE_FOR_COMBAT_REFACTOR_V1
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目標

本文件回答兩件事：

1. 要改什麼。
2. 以什麼順序改，才能避免在既有 live combat 上繼續堆疊技術債。

本重構採平行新路徑，不直接在現行 round-planning runtime 上覆寫行為。舊 runtime 保持可建置，直到新流程完成基本驗收再切換。

## 現況判讀

目前 `BootScene.ts` 同時承擔 preload、戰鬥初始化、HUD、輸入、選牌、時序、殺生線、規劃、執行與演出組裝；`renderTimeline()` 仍以我方／敵方雙列呈現，並依 initiative/speed 進行位置投影。現有流程的核心是整輪規劃、`PlayerCommand` map 與 `applyPlannedInitiative()`。

這些不是新系統的基礎，因此此次重構不以「修 `renderTimeline()`」或「把殺生線畫漂亮」作為主要工作，而是先建立全新的 domain 與 application flow。

## 新增檔案

第一階段預定新增：

```text
src/core/timeline/BattleTimeline.ts
src/core/timeline/BattleTimeline.test.ts
src/core/timeline/TimelineTypes.ts

src/core/turns/BattleTurnState.ts
src/core/turns/BattleTurnState.test.ts

src/application/battle/BattleTurnController.ts
src/application/battle/BattleTurnController.test.ts
```

第二階段預定新增：

```text
src/core/cards/RefactorCardTypes.ts
src/core/cards/RefactorDeck.ts
src/core/cards/RefactorDeck.test.ts

src/core/intents/IntentState.ts
src/core/intents/IntentResolver.ts
src/core/intents/IntentResolver.test.ts

src/core/status/ControlResilience.ts
src/core/status/BreakWindow.ts
```

第三階段預定新增：

```text
src/presentation/battle/refactor/TimelinePresenter.ts
src/presentation/battle/refactor/HandPresenter.ts
src/presentation/battle/refactor/EnemyIntentPresenter.ts
src/presentation/battle/refactor/TargetPreviewPresenter.ts
src/presentation/battle/refactor/BattleActorPresenter.ts
src/presentation/battle/refactor/RefactorBattleHud.ts
```

入口預定：

```text
src/presentation/scenes/RefactorBattleScene.ts
```

`BootScene.ts` 暫時保留為舊模式，不把新邏輯繼續塞入其中。

## Phase 1：建立單 Timeline Domain

### 要做

建立 `BattleTimelineState`：

```ts
interface TimelineActor {
  actorId: string;
  team: 'player' | 'enemy';
  nextActionAt: number;
  tieBreaker: number;
  alive: boolean;
}
```

提供純函式：

- `sortTimelineActors`
- `nextTimelineActor`
- `delayActor`
- `advanceActor`
- `scheduleAfterAction`
- `removeDeadActor`
- `countCrossedPlayerWindows`

### 不做

- 不接 Phaser。
- 不讀 Sprite。
- 不使用 `RoundPlanner`。
- 不使用 `applyPlannedInitiative()`。
- 不依賴現行 `ActionNode` 排序語意。

### 驗收

必測：

- 敵我共用同一排序。
- 同時間使用固定 tie-breaker。
- Delay 造成順序改變。
- Advance 不低於系統最小值限制。
- 死亡單位移除。
- `countCrossedPlayerWindows()` 對 0／1／2 個窗口結果正確。

## Phase 2：建立單位級 Turn State Machine

狀態：

```text
WAITING_FOR_NEXT_ACTOR
PLAYER_IDLE
CARD_SELECTED
TARGET_PREVIEW
EXECUTING
ENEMY_EXECUTING
RESOLVING
BATTLE_ENDED
```

### 玩家行動約束

- 只有 Timeline 最前方且存活的 player actor 可以操作。
- 一次只能選一張牌。
- 確認後立即執行，不等待其他隊友下令。
- ESC：Preview → Card Selected → Player Idle。
- 執行開始後不可撤回。

### 敵人行動

- 敵人輪到時直接依已公開 Intent 執行。
- 執行後生成下一 Intent。
- 根據該 Intent/skill Delay 將敵人重新排入 Timeline。

## Phase 3：建立新版共享牌庫

### 新卡牌資料不要沿用舊閱讀模型

新卡牌至少包含：

```ts
type RefactorCardCategory =
  | 'quick'
  | 'heavy'
  | 'guard'
  | 'disruption'
  | 'break';

interface RefactorBattleCard {
  id: string;
  name: string;
  category: RefactorCardCategory;
  delay: number;
  targetRule: string;
  effect: CardEffect;
}
```

不把 `clashPower`、舊 `tempo` 當成新卡牌 UI 的必要核心欄位。

### 牌庫規則

- 共享 deck。
- 手牌 5。
- 出 1 補 1。
- 未用牌保留。
- discard 空間與 draw pile 共用。
- reshuffle deterministic testable。

### 調度

```text
選 0～2 張 → 棄掉 → 抽等量 → 當前角色 Delay 3
```

調度不是 free action。

## Phase 4：Intent / 韌性 / 破勢

### IntentState

至少包含：

```ts
interface IntentState {
  id: string;
  enemyId: string;
  name: string;
  targetIds: string[];
  damage?: number;
  delay: number;
  canDelay: boolean;
  canInterrupt: boolean;
  canGuard: boolean;
  canRedirect: boolean;
  statusEffects: string[];
}
```

### 韌性

拆成：

```ts
baseResilience
temporaryResilience
```

每次成功延後前計算：

```text
actualDelay = max(0, requestedDelay - effectiveResilience)
```

成功行動後：

```text
temporaryResilience = 0
```

### 破勢

以明確 expiration condition 表示：

```text
expiresWhenTargetSuccessfullyActs
```

不再使用「1 回合」文字。

## Phase 5：Preview Resolver

建立純計算 preview，不直接改 battle state。

輸入：

```text
current battle snapshot
active actor
selected card
candidate target
```

輸出：

```text
final damage
predicted HP
consumed break window
actual delay
old timeline position
new timeline position
crossed ally windows
intent replacement/removal/modification
active actor next position
lethal boolean
```

Presentation 不自行重算規則。

## Phase 6：新 Presentation 平行路徑

### TimelinePresenter

只做：

- 單列 Timeline。
- 6～8 個節點。
- active actor。
- enemy intent summary。
- ghost old position。
- preview new position。
- lethal removal preview。

禁止：

- 雙列 enemy/player lane。
- 依舊 initiative 反向投影。
- 把完整卡面塞進 Timeline。

### EnemyIntentPresenter

敵人旁顯示：

```text
技能名
20 → 紅葉
狀態 icon
可延後 / 可打斷
```

Intent 與持續狀態分離。

### HandPresenter

- 5 張共享手牌。
- 卡面沒有 AP cost。
- 顯示卡名、類型、核心效果、Delay。
- Selected card 上浮。
- 其他牌 dim。
- 調度在手牌右側，視覺上屬同一操作區但不是第六張牌。

### TargetPreviewPresenter

只在 Target Preview 出現：

- `HP 28 → 0`
- `基礎延後 2 / 韌性 1 / 實際 1`
- `+1 行動窗口`
- `Intent 20 → 10`

不做常駐規則教學板。

## Phase 7：角色站位 Presenter

`BattleActorPresenter` 定義三種位置：

```text
HOME
ACTION
REACTION
```

### HOME

- 四名角色視覺等價。
- 小幅度縱深差。
- 不暗示前排後排。

### ACTION

- 當前角色向中央移動約 0.5～1 個身位。
- 不改任何 gameplay distance。

### REACTION

- 千景掩護、近身斬擊等短暫演出。
- 完成後回 HOME。

## Phase 8：角色專精

### rin

迅擊成功創造搶位時 +3 傷害。

### chikage

守勢可指定友軍；成功減傷後攻擊者下一次行動 +1 Delay。

### oboro

每名敵人在其成功行動前第一次被她延後時額外 +1。

### mo

強攻消耗破勢時 +4 固定傷害。

專精必須由 core 計算，UI 只讀 final preview。

## Phase 9：Feature Flag 接入

先新增：

```text
?combat-refactor=1
```

開啟時進 `RefactorBattleScene`。

沒有 flag 時仍進舊 `BootScene`。

目的：

- 可持續比對新舊。
- 不影響 main 目前可用流程。
- 新流程尚未完成時仍可跑既有 QA。

## Phase 10：切換與移除 Legacy

只有下列全部成立才切換預設入口：

- 新 core 測試完整。
- `npm run test` 通過。
- `npm run build` 通過。
- `git diff --check` 通過。
- 1280×720 可完整操作。
- 844×390 不遮住角色、Intent、Timeline 與手牌。
- 四角色持續可見。
- 無 AP／舊 next-round 控制。
- 單 Timeline Preview 可辨識 delay / interrupt / guard / kill 四種結果。

之後才移除：

- 舊整輪規劃入口。
- 舊雙列 Timeline renderer。
- 舊常駐 killing-intent planning layer。
- 舊 skip bonus / next-round interaction。

## 第一個實作批次

下一個 code batch 僅做 Phase 1：

```text
BattleTimeline domain + tests
```

不碰 UI，不碰素材，不碰 Boss，不碰現行 BootScene。

原因：Timeline 是新系統唯一真正的 scheduling source of truth。先把這層穩定，再往上接 Turn Controller 與 HUD。
