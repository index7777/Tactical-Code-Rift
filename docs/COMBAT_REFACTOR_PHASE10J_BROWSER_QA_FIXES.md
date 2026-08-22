# Phase 10j — Browser QA fixes: Guard copy, guard motion, enemy impact FX, audio, BG wiring

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 目的

修正 current-head GitHub Pages browser QA 暴露的五個 presentation/runtime 問題，不改 combat core 規則：

1. 非千景使用 `護持` 時，卡面仍顯示 `任一友方`，與實際只可 self 的 targetability 不一致。
2. `架勢` 屬守勢／self guard，但確認後仍走 REACTION fallback destination，造成角色向外衝。
3. 敵方攻擊我方時，雖有 target reaction，impact FX 不足或不可見。
4. 新版 RefactorBattleScene 尚未接入戰鬥音樂與基本命中音效。
5. 使用者指定的 `area01-rail-halt-hd2d-candidate-v2.png` 尚未真正被 `RefactorBattleAssets.ts` preload 使用。

## Guard 顯示

- `護持` 的玩家可見 target label 必須依 active actor 的實際 targetability 顯示：
  - 非 `chikage`：`自身`
  - `chikage`：`友方`
- 不把 internal `targetRule = any-ally` 直接暴露成永遠固定的 `任一友方`。
- `架勢`／self guard 顯示 `自身`。

## Guard 演出

- self guard 不得衝向 `reactionPosition`。
- 若 guard target 就是 active actor 或沒有 explicit target，角色維持目前 focus/home position，只做既有 ready/focus 表現與結算。
- 千景對其他友軍 Guard 才允許 REACTION 插入目標附近。
- 不新增角色 pose 資產。

## Enemy impact FX

- 敵方有 direct target 時，enemy lunge 到點必須同時觸發：
  - 既有 slash FX（若 texture 可用）
  - target reaction
  - 一個不依賴新美術資產的短命 impact ring / flash，確保 Pages 上可讀
- impact FX 是 presentation only，不影響傷害或 resolution。

## Audio

- 新版 battle preload `public/assets/battle/battle-music.ogg`。
- Scene create 後建立 looped battle music；若瀏覽器尚未允許 autoplay，於第一次 pointer interaction 後 resume/play。
- 至少提供兩個基本 presentation SFX：player impact 與 enemy impact。repo 目前沒有已接入新版 runtime 的短 one-shot，因此本批使用 WebAudio oscillator one-shot，不新增外部資產、不改 core。
- Scene shutdown/destroy 必須停止 music 並釋放 presentation audio state。

## 新 BG 接線

- 使用者已提供 `area01-rail-halt-hd2d-candidate-v2.png`。
- 由於目前 contents write path 不直接接受 conversation binary，branch 內已建立 q60 JPEG base64 chunks 作 temporary QA derivative。
- `RefactorBattleAssets.ts` 必須把這些 chunks 組成 `data:image/jpeg;base64,...` 並作為 `REFACTOR_BATTLE_BACKGROUND_KEY` 的實際 preload source。
- 不再 preload 舊 `area01-rail-halt-bg-runtime-trial-v1.png` 作 current refactor BG。
- 此 derivative 只供 current-head browser QA；原始 PNG 仍是 source-of-truth，日後有 binary write path 時取代 chunks。

## 驗收

自動：

- `npm run build`
- `npm run test`
- Guard display policy tests：非千景 `護持` => `自身`；千景 => `友方`。
- BG source test 不再指向舊 rail-halt runtime-trial path。

Browser QA：

- 非千景 `護持` 不再顯示 `任一友方`。
- `架勢` 確認後角色不向外衝。
- 敵方攻擊我方有明顯 impact FX。
- battle music 在首次允許音訊互動後循環播放；player/enemy 命中有 one-shot SFX。
- 背景確實是使用者提供的新 rail-halt hd2d candidate derivative。

## 非目標

- 不改 Guard 減傷／承勢規則。
- 不新增角色 pose。
- 不改傷害、Delay、Timeline、Intent core。
- 不移除 legacy combat source。
