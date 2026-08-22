# Legacy Combat Archive

STATUS = HISTORICAL_RECOVERY_POINTER

The pre-refactor Phaser combat remains recoverable from Git history and is not a runtime mode.

- Last production-main snapshot before replacement: `cd49f7417f290a29bb35fa4d4cc415b605404ddb`.
- Recovery tag: `legacy-combat-pre-refactor-20260822`.
- Historical primary scene: `src/presentation/scenes/BootScene.ts` at that tag.
- Historical supporting presenters: `src/presentation/battle/` at that tag.
- Historical rules remain documented by the files present at that tag.

Do not restore the legacy entry flag or run both combat systems in production. If a past design or effect is needed, inspect the tag and port only the required concept or asset through the current refactor interfaces.

The old visual FX files stay in `public/assets/battle/fx/` and the provenance ledger. They are intentionally not connected to the replacement battle presentation in the first integration batch, so later revisions can evaluate and adopt them deliberately.
