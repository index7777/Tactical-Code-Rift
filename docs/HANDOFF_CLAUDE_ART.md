# Claude 交接｜Tactical Code Rift 美術與 FX

日期：2026-08-18

## 先讀文件

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/art-bible.md`
4. `docs/areas/area-01-rainfall-ridgeline.md`
5. `docs/CURRENT_COMBAT_SPEC.md`
6. `docs/PLANNING_LOG.md`
7. `references/approved/index.json`
8. `references/rejected/index.json`

不要使用 `docs/archive/` 作為目前設計依據。

## 母版位置

所有第一區怪物母版候選位於：

`assets/candidates/monsters/rainfall-ridgeline/<id>/<id>-master-reference.png`

目前已收到：

- 濡骸：`wet-corpse`
- 提燈童：`lantern-child`
- 山犬：`mountain-hound`
- 辻傘：`wayfarer-umbrella`

每一隻的規格在：

`docs/monsters/wet-corpse.md`
`docs/monsters/lantern-child.md`
`docs/monsters/mountain-hound.md`
`docs/monsters/wayfarer-umbrella.md`

這些都是使用者提供的母版候選，不等於 runtime approved。沒有使用者核准前，不得製作下一隻或衍生 pose。

## 衍生素材規則

- 嚴格左右側視，只做朝戰場中央的一個方向；安全時才 horizontal flip。
- 不做八方向、正面或 3/4 戰鬥角色。
- 不把背景、地面、陰影、文字、HUD、殺生線或 FX 烘進角色圖。
- 普通怪最低 `idle / ready / down`；attack / hit / break 優先用 runtime 位移、旋轉、hit-stop、染色與 FX。
- 任何衍生素材先存 `assets/candidates/`，經實機截圖與 Art Director 核准後才進 `public/assets/`。

## 斬擊 FX 接入位置

CC0 斬擊序列：

`public/assets/battle/weapon-slash-cc0/classic-slash-sheet.png`

來源與授權：

`assets/ASSET_PROVENANCE.md`

載入與動畫註冊：

`src/presentation/scenes/BootScene.ts`

播放位置：

- 一般行動：`src/presentation/battle/ActionPresenter.ts`
- 交鋒與勝負：`src/presentation/battle/ClashPresenter.ts`

Phaser key：`slash-cc0`，6 幀，`126×150`，動畫 key 同名，24 FPS。

不要再恢復舊的 `slash-fx` 單張圖，也不要把刀光畫進角色母版。

## 其他 FX 分工

- 交鋒：ClashPresenter 的雙方斬擊、命中閃光、後仰與彈開
- 重擊：ActionPresenter heavy 分支，可疊刀斬序列與地面衝擊
- 接力：ActionPresenter relay handoff，先完成交鋒僵直，再由接力者入場
- 破甲：break 分支與碎片／破裂 FX
- 牽制：delay 分支，使用位移拖尾與冷色控制感
- 整備：cycle 分支，使用補牌／整理 FX，不得加入攻擊刀光
- 堅守：guard 分支，原地防守，不移動到交鋒點

## Runtime 驗收

每次素材變更都要：

1. `npm run build`
2. 啟動 HTML demo
3. 截取 1280×720 與 844×390 橫向畫面
4. 檢查 idle、聚焦、交鋒、受擊／崩勢、死亡
5. 具體記錄 `wrong-proportion`、`silhouette-lost`、`alpha-failure`、`runtime-overlap` 等失敗原因
6. 最多自動迭代 3 次；仍失敗就停止並回報

## 當前工作邊界

- 目前只建立母版參考與規格，尚未生成四隻怪物的 side-view runtime 素材。
- 使用者要求逐隻看到圖並核准後才往下；不可批量生成六怪、精英與 Boss。
- 斬擊 CC0 素材已接入，但仍需要使用者在網址版本實機確認刀感與比例。
