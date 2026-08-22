# Phase 10 — Default Cutover / Legacy Rollback Contract

STATUS = AUTHORITATIVE_FOR_PHASE10_CUTOVER
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## 前置條件

Phase 10 只在以下條件成立後開始：

- Phase 9f CI 已通過。
- GitHub Pages current-head runtime 可載入並完成戰鬥操作。
- 使用者已完成新版 auto-flow 與中文介面的 browser QA。
- 新版仍維持單 Timeline、共享 5 張手牌、無 AP／Mana、單位級立即結算。

## 本批目標

把新版戰鬥改成預設入口，但保留短期 legacy rollback。

### 預設入口

沒有任何 query flag 時：

```text
RefactorBattleScene -> default
```

composition root 必須建立並注入 `RefactorBattleRuntime`。

### Legacy rollback

短期保留：

```text
?legacy-combat=1
```

只有此 flag 才把 `BootScene` 放到第一啟動順位，且不建立新版 battle runtime。

舊 `?combat-refactor=1` 可以在過渡期繼續被接受，但它不再是啟用新版的必要條件；新版本身已是 default。

## 分層與限制

- 不把任何新版 combat rule 寫回 `BootScene.ts`。
- 不在本批移除 legacy source。
- 不改 core damage / Delay / Intent / specialization 規則。
- 不改 shared deck 規則。
- 不把 rollback 判斷散落在 Scene；入口決策集中在 composition root / 純 policy。
- 不因 cutover 把 presentation enum / internal actor id 改成中文；中文仍只在 presentation display mapping。

## 驗收

至少驗證：

1. 無 query 時預設為新版。
2. `?legacy-combat=1` 時預設為舊 `BootScene`。
3. `?combat-refactor=1` 仍進新版，避免既有 QA URL 失效。
4. 新版 default 時注入 `refactor-battle-runtime`。
5. legacy rollback 時不注入新版 runtime。
6. Scene ordering deterministic。
7. `npm run build`、`npm run test` 通過。
8. GitHub Pages 無 flag URL 可操作新版；legacy flag 可回到舊入口。

## 本批不做

- 不刪 `BootScene`。
- 不刪 `RoundPlanner` / legacy timeline / killing-intent layer。
- 不 merge PR。
- 不移除 rollback flag。

Legacy removal 只能在 default-cutover browser regression 完成後另開下一批執行。
