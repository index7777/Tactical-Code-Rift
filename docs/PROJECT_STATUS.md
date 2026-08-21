# Project Status

STATUS = AUTHORITATIVE_HANDOFF

Updated: 2026-08-21. Baseline: `main` at or after `a0e8d03`.

## Runtime

- Stack: TypeScript, Phaser 3.90, Vite 6 and Vitest.
- Stable player IDs: `rin`, `chikage`, `oboro`, `mo`. Demo actor order is not permanent formation identity.
- Area 01 route, normal encounters, elite encounter and boss encounter hooks are implemented.
- `rain-boss` textual and visual master v2 are Art Director-approved. `boss-1` loads the approved transparent PNG at 158px height; enemy death reuses the universal master and dissolves through runtime FX.
- Canonical verification: `npm run validate:assets`, `npm run test`, `npm run build`, `git diff --check`.
- Canonical build output: `build/web`; Vercel uses the same directory.
- Metadata tooling dependency: `pip install -r requirements-tools.txt`; then run `npm run validate:assets`.

## Immediate gates

1. Execute `docs/NEXT_WORK.md` in order, beginning with stale-state cleanup and 1280×720／844×390 Boss plus seven-encounter runtime QA.
2. Resolve the five live combat-rule conflicts before final Boss balancing.
3. Clear release provenance for user-provided characters, music, monster masters and UI packages.
4. Continue decomposing `BootScene`; player manifest loading, encounter setup, loading screen and battle audio are now extracted.
5. Treat `docs/HANDOFF.md` as historical context only; `PROJECT_STATUS.md` and `NEXT_WORK.md` are the current handoff.

## Git workflow

- `main` is the shared and production branch.
- `sync.bat download` switches to and fast-forwards `main`; it refuses dirty or diverged worktrees.
- Feature branches may be used for isolated work, but cross-machine sync should finish on `main`.
