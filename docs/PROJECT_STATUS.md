# Project Status

STATUS = AUTHORITATIVE_HANDOFF

Updated: 2026-08-21. Baseline: `main` at or after `8bcde52`.

## Runtime

- Stack: TypeScript, Phaser 3.90, Vite 6 and Vitest.
- Stable player IDs: `rin`, `chikage`, `oboro`, `mo`. Demo actor order is not permanent formation identity.
- Area 01 route, normal encounters, elite encounter and boss encounter hooks are implemented.
- `rain-boss` remains an SVG placeholder. No approved Boss Character Master exists; production art is blocked pending Art Director input.
- Canonical verification: `npm run validate:assets`, `npm run test`, `npm run build`, `git diff --check`.
- Canonical build output: `build/web`; Vercel uses the same directory.
- Metadata tooling dependency: `pip install -r requirements-tools.txt`; then run `npm run validate:assets`.

## Immediate gates

1. Obtain and approve the Rain Boss identity/master before generating production poses.
2. Clear release provenance for user-provided characters, music and UI packages.
3. Continue decomposing `BootScene`; player manifest loading, encounter setup, loading screen and battle audio are now extracted.
4. Treat `docs/HANDOFF.md` as historical context only; this file is the current handoff.

## Git workflow

- `main` is the shared and production branch.
- `sync.bat download` switches to and fast-forwards `main`; it refuses dirty or diverged worktrees.
- Feature branches may be used for isolated work, but cross-machine sync should finish on `main`.
