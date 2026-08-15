# AGENTS.md

## Task Start

1. Read the current Task and `CAPABILITY_REGISTRY.md`.
2. Read `docs/README.md` and only the authoritative files it routes to for the current Task.
3. Never use `docs/archive/` as current design input unless the Task explicitly asks for historical comparison.
4. Append adopted recommendations, implementation batches, and verification results to `docs/PLANNING_LOG.md`.
5. Determine only the capabilities required by that Task.
6. Detect the actual engine, language, authoritative roots, and generated roots; do not infer them from design documents.

## Tooling Rules

- Do not install optional tools merely to make bootstrap appear complete.
- Serena and Graphify index authoritative source and tests, not confirmed build, bundled, vendor, minified, or generated artifacts.
- Serena smoke tests require a named authoritative symbol.
- Graphify smoke tests require dependency and affected/blast-radius queries.
- Machine-wide changes and paid external services require explicit approval.

## Asset Rules

- Asset generation, cleanup, deduplication, containers, models, and paid services activate only for a concrete Task requiring them.
- Generated outputs begin as candidates and are never automatically approved as final assets.
- Keep provenance and license metadata for release assets.
- Do not treat the current reference image as production-ready without provenance review.

## Verification

- Source and tests are authoritative over graphs, reports, and design claims.
- Record canonical build and test commands after the product scaffold exists.
- Keep core tooling, asset specification, and asset runtime readiness as separate gates.
