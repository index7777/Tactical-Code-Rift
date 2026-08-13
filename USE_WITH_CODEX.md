# USE_WITH_CODEX.md

## 一般專案

對 Codex 說：

> 讀取 `CODEX_PROJECT_BOOTSTRAP.md` 與 `CAPABILITY_REGISTRY.md`，依此 Repository 執行 bootstrap，做到可以判定 `PROJECT_TOOLING_READY`。不要修改產品行為。不要為了 bootstrap 完整而安裝 optional capabilities；只有目前 Task 真正需要時才安裝。任何 machine-wide change 或可能產生成本的外部服務都先停下來要求授權。

## 有生成資產需求的專案

對 Codex 說：

> 讀取 `CODEX_PROJECT_BOOTSTRAP.md`、`CAPABILITY_REGISTRY.md` 與 `optional-assets/` 下的 Generic Asset Bootstrap 文件。完成 core project bootstrap，並分開回報 `ASSET_PIPELINE_SPEC_READY` 與 `ASSET_PIPELINE_RUNTIME_READY`。不要在目前沒有 Asset Generation Task 時自動安裝 ComfyUI、Pixelorama、dedup、Docker 或付費服務。

## 日常 Task

對 Codex 說：

> 先讀 `AGENTS.md`、目前 Task 與 `CAPABILITY_REGISTRY.md`。判定 `required_capabilities`，只補目前 Task 缺少的能力，再依 AGENTS 規則執行。跨 subsystem 先 Graphify，精確 symbol 用 Serena，完成後跑必要 tests。
