# Phase 10d — 行動／反應演出接線契約

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

Phase 10c 已把新版戰鬥改為 full-canvas BG、目前 rainfall-ridgeline monster、透視站位與較清楚的單 Timeline／Preview。下一批把既有角色 pose / FX 接到真正的新版 action flow，讓玩家確認後不再只是數值瞬間跳變，而是先看到角色離開 HOME、執行動作、命中／反應，再回 HOME。

本批只做 presentation sequencing。戰鬥結果仍由 `BattleTurnController` / core resolver 決定；Scene 不可自行算傷害、Delay、Guard 或 specialization。

## 前置狀態

- Phase 10c source 已完成，CI run 247 通過；browser visual QA 仍需持續。
- 四名玩家 pose 已由 `PlayerAssetManifest` preload：`idle-a / idle-b / ready / attack-a / attack-b / hit-a / hit-b / down`。
- rainfall-ridgeline QA enemy 目前只有 master runtime visual，因此 enemy 行動先以位置／scale／tint／FX 表達，不假造不存在的 enemy pose sheet。
- 上下框仍屬過渡 overlay；演出位置以 full-canvas battlefield composition 為基準。

## 資料邊界

新增純 presentation plan：

```text
RefactorBattleView
  -> RefactorBattleAnimationPlan
  -> Phaser tween / texture swap / FX
```

Animation plan 可以讀：

- active actor id
- selected card category
- preview target id
- enemy Intent target ids
- HOME / ACTION / REACTION presentation positions

Animation plan 不得讀或重算：

- damage formula
- resilience
- break consumption
- specialization bonus
- authoritative Timeline mutation

## 玩家行動 sequencing

確認卡牌時：

```text
保留目前 rendered view
-> controller confirm（commit card，但尚不 complete resolution）
-> active actor HOME -> ACTION / REACTION
-> ready / attack pose
-> impact FX / target reaction
-> controller complete resolution
-> actor return HOME / idle
-> render authoritative post-resolution view
```

### 類型映射

- `quick / heavy / break / disruption`：使用 ACTION 位移與 attack pose。
- `guard`：使用 REACTION 位移；若指定友軍，往目標附近短暫插入，不做攻擊型 slash。
- `self / none` 若沒有 explicit target，仍可使用 ACTION / REACTION 的短演出，但不得虛構敵方命中。

## 敵方行動 sequencing

`ENEMY_EXECUTING` 不再等 timer 後瞬間 resolve：

```text
敵人 HOME -> 中央短距離 lunge
-> Intent target reaction / slash FX
-> runtime.resolveActiveEnemyAction()
-> enemy 回 HOME
-> render post-resolution view
```

敵人目前沒有正式 attack / hit pose，因此本批只用 tween / scale / tint / FX，不把玩家 pose 套到怪物上。

## Target reaction

- 玩家被命中：若有 `hit-a / hit-b` texture，短暫切換後回 idle；若該 actor 在 authoritative post-resolution 已死亡，下一次 render 由後續 down-state wiring 處理。
- 敵人被命中：master image 做短暫 tint / recoil，不假造不存在的 monster hit frame。
- Guard：被保護目標不播放受擊動作，守勢 actor 使用 REACTION 路徑。

## Input / timer ownership

- 演出期間 Scene input 暫停，避免重複 confirm / target click。
- auto-advance timer 在演出開始前清除。
- tween / delayed-call 在 Scene shutdown / destroy 時必須停止，不得在離開 Scene 後提交 resolution。
- 演出結束後才恢復 input 並重新排 auto advance。

## 明確不做

- 不改 combat core / Controller 規則。
- 不新增 AP、舊 round-planning 或 next-round UI。
- 不把 enemy master 假裝成完整動畫 sheet。
- 不在本批做正式 hit-stop、camera shake、音效混音或粒子 polish。
- 不移除 legacy combat source。
- 不把 runtime-trial BG / prototype pose 升格為 approved。

## 驗收

自動：

- `npm run test`
- `npm run build`
- presentation plan 測試涵蓋 attack / guard / no-target / enemy intent target。
- 新 plan module 不 import core resolver 或 legacy RoundPlanner。

Browser QA：

- 玩家確認後角色會從 HOME 前移並回位，不再瞬間結算。
- quick / heavy / break / disruption 可看到 attack pose / impact reaction。
- 千景 Guard 使用 REACTION 路徑，不播放攻擊型 slash。
- 敵方行動自動播放 lunge / target reaction 後再進下一 actor。
- 演出期間無法重複點擊造成雙重 resolution。
- 1280×720 / 844×390 不因 tween 越界遮住主要操作。

## 後續

Phase 10d 實機穩定後再拆：

- down/death sequence
- hit-stop / camera impulse
- card category 專屬 FX
- enemy 正式動畫組裝
- 移除過渡 Timeline / hand 大框並改為最終 floating HUD
