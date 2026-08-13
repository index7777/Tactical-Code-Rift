# CAPABILITY_REGISTRY.md

## Current Project State

```text
PROJECT_MODE = GREENFIELD_PROJECT
REPOSITORY_STATE = DESIGN_ONLY_NOT_GIT
DETECTED_STACK = NOT_SELECTED
AUTHORITATIVE_SOURCE_ROOTS = NONE
TEST_ROOTS = NONE
GENERATED_BUILD_VENDOR_ROOTS = NONE_DETECTED
```

目前只有設計文件、Generic Asset Bootstrap 規格、一份 Manifest JSON Schema 與一張視覺參考圖；尚無產品原始碼、引擎專案、依賴、建置或測試命令。

## Core Capabilities

| Capability | Provider | Policy | Status | Evidence |
|---|---|---|---|---|
| semantic_navigation | Serena | AUTO_SAFE | NOT_APPLICABLE | CLI 可用；沒有 authoritative source 或 named symbol 可作 smoke test |
| dependency_graph | Graphify | AUTO_SAFE | NOT_APPLICABLE | CLI 可用；沒有程式依賴圖可建立或查詢 blast radius |
| exact_search | rg / native | AUTO_SAFE | READY | 精確專案文字查詢成功 |
| build_verification | project-native | AUTO_SAFE | NOT_APPLICABLE | 無 canonical build command |
| test_verification | project-native | AUTO_SAFE | NOT_APPLICABLE | 無 canonical test command |

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
ASSET_PIPELINE_SPEC_READY = NO
ASSET_PIPELINE_RUNTIME_READY = NO
```

Specification evidence:

- 四份資產規格檔存在於專案根目錄；要求的 `optional-assets/` 目錄不存在。
- `asset_manifest.schema.json` 可解析並通過 Draft 2020-12 meta-schema 驗證。
- Schema `$id` 仍指向 `three-kingdoms-online.local`。
- 文件仍含 `Generic Project`、`Example Faction` 與未決的 `runtime engine` 佔位內容。
- 尚無機器可讀 AssetRecipe schema、recipe validator、manifest validation command、workflow registry 實作或引擎 importer。

Runtime evidence:

- 目前沒有 Asset Generation Task。
- 本次未安裝或設定 ComfyUI、Pixelorama、imagededup、Docker、模型或付費服務。

## Readiness

```text
PROJECT_TOOLING_READY = NO
```

原因：引擎／技術棧尚未選定，也沒有 authoritative source、build 或 test surface。Serena 與 Graphify 已安裝不等於完成 source-based smoke test。

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