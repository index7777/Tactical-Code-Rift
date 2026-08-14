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
| semantic_navigation | Serena | AUTO_SAFE | PENDING | 已有 authoritative source；待以 `generatePrototypeRoute` 作 named-symbol smoke test |
| dependency_graph | Graphify | AUTO_SAFE | PENDING | 已有 source dependency；待建立並查詢 dependency 與 affected/blast radius |
| exact_search | rg / native | AUTO_SAFE | READY | 精確專案文字查詢成功 |
| build_verification | project-native | AUTO_SAFE | READY | Canonical command: `npm run build` |
| test_verification | project-native | AUTO_SAFE | READY | Canonical command: `npm run test`; ATB、input、route tests |

## Optional Capabilities

| Capability | Provider | Policy | Status |
|---|---|---|---|
| asset_generation_local | ComfyUI / equivalent | ON_DEMAND | NOT_INSTALLED |
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
ASSET_PIPELINE_SPEC_READY = PARTIAL
ASSET_PIPELINE_RUNTIME_READY = YES_FOR_COMBAT_SHOWCASE
```

Specification evidence:

- 四份資產規格檔存在於專案根目錄；要求的 `optional-assets/` 目錄不存在。
- `asset_manifest.schema.json` 可解析並通過 Draft 2020-12 meta-schema 驗證。
- Schema `$id` 仍指向 `three-kingdoms-online.local`。
- 文件仍含 `Generic Project`、`Example Faction` 與未決的 `runtime engine` 佔位內容。
- 尚無機器可讀 AssetRecipe schema、recipe validator、manifest validation command、workflow registry 實作或引擎 importer。

Runtime evidence:

- `assets/ASSET_PROVENANCE.md` 記錄展示版角色、敵人、戰場、FX 與音效的來源與 CC0 授權。
- 核准 runtime 檔位於 `public/assets/battle/`；原始下載與解壓候選保留於 `assets/candidates/`。
- 本次未使用 Canva、生成式圖片、Emoji 美術或電子合成音效，亦未安裝額外資產工具。

## Readiness

```text
PROJECT_TOOLING_READY = PARTIAL
```

原因：Web 技術棧、source、build 與 test surface 已建立；平台封裝與 Serena／Graphify source smoke test 尚未執行。

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
