# CODEX_PROJECT_BOOTSTRAP.md

## Universal Capability-Driven Codex Bootstrap

### Core Principle

Bootstrap 不代表安裝全部工具。標準流程：

```text
Detect Project
→ Detect Authoritative Source
→ Enable Core Coding Capabilities
→ Build Capability Registry
→ Execute Tasks
→ Install Optional Capabilities Only When Required
```

## Project Modes

先判斷：

```text
EXISTING_PROJECT
GREENFIELD_PROJECT
```

既有專案：`Detect before changing.`  
全新專案：`Establish conventions before repository growth.`

## Core Capabilities

有 source repository 時，以下屬於 `PROJECT_TOOLING_READY` 的核心能力：

```text
semantic_navigation → Serena
dependency_graph    → Graphify
exact_search        → rg / jq / native tools
build_verification  → project-native build
test_verification   → project-native tests
```

## Optional Capabilities

以下僅在 Task/Gate 真正需要時才啟用：

```text
asset_generation_local
sprite_cleanup
asset_dedup
live_postgresql
container_runtime
load_testing
visual_regression
deployment_tooling
paid_external_generation
```

Optional capability 不 READY，不應自動讓 `PROJECT_TOOLING_READY = NO`。

## Capability Status

```text
NOT_APPLICABLE
NOT_INSTALLED
DETECTED
CONFIG_REQUIRED
READY
BLOCKED
```

## Install Policies

```text
AUTO_SAFE
ON_DEMAND
MACHINE_CHANGE_REQUIRES_APPROVAL
EXTERNAL_COST_REQUIRES_APPROVAL
```

### AUTO_SAFE
低風險、project-scoped、可回復的 tooling/config 可自動處理。

### ON_DEMAND
只有目前 Task 要用時才安裝。

### MACHINE_CHANGE_REQUIRES_APPROVAL
例如 Docker Desktop、WSL、系統服務、驅動、machine-wide runtime，需要使用者授權。

### EXTERNAL_COST_REQUIRES_APPROVAL
任何可能產生 API/cloud/hosted inference 成本的服務，都需明確授權。

## Task Capability Contract

Task/Gate 可宣告：

```yaml
required_capabilities:
  - semantic_navigation
  - dependency_graph
  - live_postgresql
```

資產 Task：

```yaml
required_capabilities:
  - semantic_navigation
  - asset_generation_local
  - sprite_cleanup
```

若未明寫，Codex 可依 Objective / Acceptance Criteria 推導，但不得因模糊需求自動安裝大型 optional tools。

## Task Start Flow

```text
Read AGENTS.md
→ Read Task
→ Determine required_capabilities
→ Read CAPABILITY_REGISTRY.md
→ Resolve only missing required capabilities
→ Execute Task
```

## Capability Resolution

```text
READY
→ continue

NOT_INSTALLED + AUTO_SAFE
→ install/configure + smoke test

NOT_INSTALLED + ON_DEMAND
→ install only because current Task requires it

MACHINE_CHANGE_REQUIRES_APPROVAL
→ stop and request approval

EXTERNAL_COST_REQUIRES_APPROVAL
→ stop and request approval

BLOCKED
→ stop only if current Task requires that capability
```

## Existing Project: Source-of-Truth Detection

在 Serena / Graphify 初始化前先辨識：

```text
Authoritative Source Roots
Generated / Bundled Roots
Vendor Roots
Build Roots
Asset Candidate Roots
```

例如：

```text
src/           INDEX
tests/         INDEX
server/        INDEX
client/        INDEX

dist/          IGNORE
build/         IGNORE
coverage/      IGNORE
node_modules/  IGNORE
*.min.js       IGNORE if generated
art/generated/ IGNORE
```

不得只因檔名猜 generated status，必須先確認來源。

## Serena Rules

有 source code 時，`semantic_navigation` 是核心能力。

流程：

```text
Detect language
→ Install/configure Serena
→ Configure authoritative source roots
→ Ignore generated/bundled outputs
→ Init/refresh
→ Smoke test a named authoritative symbol
```

Smoke test 必須選：

```text
named class
named function
exported symbol
service/module
```

不得使用：

```text
anonymous IIFE
bundled symbol
minified symbol
generated artifact
```

成功後：

```text
semantic_navigation = READY
```

## Graphify Rules

有非 trivial Repository 時，`dependency_graph` 是核心能力。

流程：

```text
Use same authoritative source boundaries
→ Ignore build/vendor/generated outputs
→ Build graph
→ Dependency query
→ Affected/blast-radius query
```

Graphify 是 navigation evidence，不是 source of truth。

## PROJECT_TOOLING_READY

只要求：

```text
AGENTS_READY
semantic_navigation READY
dependency_graph READY
build_verification available
test_verification available
ignore/source-root rules ready
```

不要求：

```text
ComfyUI
Pixelorama
PostgreSQL
Docker
Load testing
Deployment stack
```

## Asset Capability Model

若專案需要 generated visual assets：

```text
ASSET_PIPELINE_APPLICABLE = YES
```

分成：

```text
ASSET_PIPELINE_SPEC_READY
ASSET_PIPELINE_RUNTIME_READY
```

四份 Generic Asset 文件/schema 存在且可驗證：

```text
ASSET_PIPELINE_SPEC_READY = YES
```

不代表本機已可生成。

### Asset Runtime Triggers

`asset_generation_local` 僅在：
- Generate character/icon/environment asset
- Run asset POC
- Batch image generation
- Regenerate visual candidate

`spinner_cleanup`/`sprite_cleanup` 僅在：
- sprite frame cleanup
- animation cleanup
- palette correction
- spritesheet assembly

`asset_dedup` 僅在：
- batch candidates
- near-duplicate pruning
- large asset review batch

### Default Providers

```text
asset_generation_local → ComfyUI or approved equivalent
sprite_cleanup         → Pixelorama or approved equivalent
asset_dedup            → imagededup or approved equivalent
```

Install Policy：

```text
ON_DEMAND
```

### Paid Fallback

```text
NO AUTOMATIC PAID FALLBACK
```

任何 paid/hosted generation：

```text
EXTERNAL_COST_REQUIRES_APPROVAL
```

## Database Capability Trigger

`live_postgresql` 只有 Task 要求以下 evidence 時才需要：

```text
PostgreSQL migration
transaction isolation
restart persistence
concurrency proof
idempotency
rollback
DB-specific constraints
```

優先偵測：

```text
existing local PostgreSQL
existing Testcontainers/container runtime
repository-local disposable runtime
```

採最小侵入方案。

Docker Desktop、WSL、system PostgreSQL service 等：

```text
MACHINE_CHANGE_REQUIRES_APPROVAL
```

Repository-local isolated test runtime 可在 Task 確實需要時採用，前提是：
- test-only
- localhost/isolated
- reproducible
- not production
- ignored from Git

## Load Testing Trigger

只有 Task/Gate 明確要求：

```text
load
stress
P95/P99
multi-client
concurrent users
throughput
```

才要求 `load_testing`。

## CAPABILITY_REGISTRY.md

Bootstrap 必須建立或更新：

```text
CAPABILITY_REGISTRY.md
```

每個 capability 記：

```text
Capability
Provider
Status
Install Policy
Required When
Verification
Notes
```

Codex 不得靠前一個對話的記憶判定工具狀態。

## AGENTS.md Integration

若不存在等價規則，加入：

```text
Before executing a task, determine required capabilities and check CAPABILITY_REGISTRY.md.

Do not install optional tools merely to make bootstrap appear complete.

Serena and Graphify index authoritative source, not build/bundled/generated artifacts.

Optional capability readiness is independent from PROJECT_TOOLING_READY.

Machine-wide changes and paid external services require explicit approval.

Source and tests remain authoritative.
```

保留既有有效規則。

## Existing Project Bootstrap Flow

```text
1. Detect stack
2. Detect authoritative source roots
3. Detect generated/build/vendor roots
4. Configure Serena
5. Serena smoke test
6. Configure Graphify
7. Graphify smoke test
8. Verify build/tests
9. Create/update CAPABILITY_REGISTRY
10. Detect optional capabilities already installed
11. Do NOT install unused optional capabilities
12. Evaluate PROJECT_TOOLING_READY
13. Run Repository Audit only if requested
```

## Greenfield Bootstrap Flow

```text
1. Establish AGENTS.md
2. Establish source/test structure
3. Configure Serena
4. Configure Graphify
5. Build/test smoke project
6. Create CAPABILITY_REGISTRY
7. Add optional asset specs if applicable
8. Do NOT install optional runtimes yet
9. PROJECT_TOOLING_READY
```

## Independent Gates

永遠分開回報：

```text
PROJECT_TOOLING_READY

ASSET_PIPELINE_SPEC_READY
ASSET_PIPELINE_RUNTIME_READY

LIVE_DATABASE_TEST_READY

LOAD_TEST_READY

DEPLOYMENT_READY
```

不得：

```text
Pixelorama missing
→ whole project blocked
```

## Failure Isolation

Asset runtime blocked：
→ 不需要資產的 coding tasks 照常。

Live PostgreSQL blocked：
→ 不需要 live PostgreSQL evidence 的 Task 照常。

Serena / Graphify core capability blocked：
→ `PROJECT_TOOLING_READY = NO`。

## Final Bootstrap Report

```text
PROJECT MODE:

STACK:

AUTHORITATIVE SOURCE ROOTS:

IGNORED GENERATED/BUILD ROOTS:

CORE CAPABILITIES:
semantic_navigation:
dependency_graph:
exact_search:
build_verification:
test_verification:

OPTIONAL CAPABILITIES:
asset_generation_local:
sprite_cleanup:
asset_dedup:
live_postgresql:
container_runtime:
load_testing:

ASSET PIPELINE:
Applicable:
Spec Ready:
Runtime Ready:

PROJECT_TOOLING_READY:

FILES ADDED/MODIFIED:

BLOCKERS:
```

## Final Principle

> Install capabilities because a Task requires them, not because a bootstrap checklist mentions them.

> Core coding intelligence stays ready; specialized runtimes are activated on demand.
