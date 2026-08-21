# CAPABILITY_REGISTRY.md

## Current Project State

```text
PROJECT_MODE = GREENFIELD_PROJECT_WITH_SCAFFOLD
REPOSITORY_STATE = GIT_WORKTREE
DETECTED_STACK = TYPESCRIPT_PHASER_VITE
AUTHORITATIVE_SOURCE_ROOTS = src
TEST_ROOTS = src/**/*.test.ts
GENERATED_BUILD_VENDOR_ROOTS = dist, node_modules
```

已建立 HTML-first 的 TypeScript／Phaser／Vite 產品骨架。Capacitor 與 Electron/Steamworks 僅完成架構決策，尚未安裝平台殼。

## Core Capabilities

| Capability | Provider | Policy | Status | Evidence |
|---|---|---|---|---|
| semantic_navigation | Serena 1.7.0 | AUTO_SAFE | READY | 2026-08-18 已修復 CodexSandboxUsers 對 `C:\\Users\\Index7` 根目錄只有 Traverse 的 ACL 問題。`PYTHONIOENCODING=utf-8 serena project health-check` 成功啟動 TypeScript LSP，並完成 `CombatResolutionController` 的 symbols、named-symbol、references smoke tests。 |
| dependency_graph | Graphify CLI | AUTO_SAFE | READY_WITH_WARNING | 權威範圍限定 `src`；2026-08-18 `graphify extract src --code-only --no-cluster --out .` 更新為 306 nodes／824 edges，query smoke 通過；`BootScene.ts`、`JourneyScene.ts` 高度壓縮造成 AST partial-extraction warning，待格式化／拆分。 |
| exact_search | rg / native | AUTO_SAFE | READY | 精確專案文字查詢成功 |
| build_verification | project-native | AUTO_SAFE | READY | Canonical command: `npm run build` |
| test_verification | project-native | AUTO_SAFE | READY | Canonical command: `npm run test`; ATB、input、route tests |

## Optional Capabilities

| Capability | Provider | Policy | Status |
|---|---|---|---|
| asset_generation_local | deterministic Python/Pillow generator | ON_DEMAND | READY_FOR_PROTOTYPE_FX |
| sprite_cleanup | Pixelorama / equivalent | ON_DEMAND | NOT_INSTALLED |
| asset_dedup | imagededup / equivalent | ON_DEMAND | NOT_INSTALLED |
| live_postgresql | project-local PostgreSQL/container | ON_DEMAND | NOT_APPLICABLE |
| container_runtime | Docker/Podman | MACHINE_CHANGE_REQUIRES_APPROVAL | NOT_INSTALLED |
| load_testing | project-approved | ON_DEMAND | NOT_INSTALLED |
| visual_regression | project-approved | ON_DEMAND | NOT_INSTALLED |
| paid_external_generation | project-approved API | EXTERNAL_COST_REQUIRES_APPROVAL | NOT_APPLICABLE |

## Asset Pipeline State

```text
ASSET_PIPELINE_APPLICABLE = YES
ASSET_PIPELINE_SPEC_READY = READY_WITH_RECIPE_VALIDATOR
ASSET_PIPELINE_RUNTIME_READY = YES_FOR_COMBAT_SHOWCASE
```

Specification evidence:

- `docs/art-bible.md`、Character Master／Area Spec、approved／rejected indexes 與專案 Art Skill 已建立。
- deterministic validator、rejection registrar 與最多三次自動迭代規則已建立；正式 approval 仍需 Art Director。

- 四份資產規格檔存在於專案根目錄；要求的 `optional-assets/` 目錄不存在。
- `asset_manifest.schema.json` 可解析並通過 Draft 2020-12 meta-schema 驗證。
- Schema `$id`、`Generic Project`、`Example Faction` 與 `runtime engine` 佔位內容已於 2026-08-17 Batch 0 收尾清理，替換為 `tactical-code-rift.local`／`Tactical Code Rift`／`妖怪`／`Phaser`。
- `asset_recipe.schema.json`、`tools/validate_asset_metadata.py` 與 `npm run validate:assets` 已建立；首份 route-map recipe 已納入驗證。工作流程 registry 與通用引擎 importer 仍屬後續擴充。

Runtime evidence:

- `assets/ASSET_PROVENANCE.md` 記錄展示版角色、敵人、戰場、FX 與音效的來源與 CC0 授權。
- 核准 runtime 檔位於 `public/assets/battle/`；原始下載與解壓候選保留於 `assets/candidates/`。
- 本次未使用 Canva、生成式圖片、Emoji 美術或電子合成音效，亦未安裝額外資產工具。
- `tools/generate_yokai_fx.py` 已可重現產出 noise 與 8-frame 煙霧 flipbook；GLSL 原型與跨引擎參數規格已建立。此能力僅代表試作 FX ready，不代表正式角色／場景資產完成。

## Readiness

```text
PROJECT_TOOLING_READY = READY_WITH_WARNING
```

Web 技術棧、source、build、test、Serena 與 Graphify smoke tests 均已驗證。`BootScene.ts`、`JourneyScene.ts` 仍有圖譜 AST partial-extraction warning；平台封裝是產品後續工作，不阻塞 core bootstrap。

## Resolution Rules

1. 每個 Task 先判定 required capabilities。
2. 只補目前 Task 缺少的能力。
3. Optional tool 不因 bootstrap 而安裝。
4. Machine-wide change 與可能付費的外部服務必須先取得授權。
5. 原始碼與測試建立後才可設定 Serena／Graphify source roots 並進行 smoke test。
6. 永遠分開回報 `PROJECT_TOOLING_READY`、`ASSET_PIPELINE_SPEC_READY`、`ASSET_PIPELINE_RUNTIME_READY`。

## Bootstrap Record

```text
BOOTSTRAP_DATE = 2026-08-13
FILES_ADDED = AGENTS.md
FILES_UPDATED = CAPABILITY_REGISTRY.md
OPTIONAL_INSTALLS_PERFORMED = NONE
PRODUCT_BEHAVIOR_CHANGED = NO
```
