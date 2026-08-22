# Combat Refactor Phase 14b — Clash Preview Consequence

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Objective

Phase 14b translates the deterministic Phase 14 Clash result into one shared semantic consequence object that Preview and Execute can both consume later.

This batch intentionally stops before `BattleTurnController` wiring. The goal is to define one authoritative meaning for `player-win`, `draw`, and `enemy-win` so Phaser presentation never decides what a Clash result means.

## Boundaries

This batch:

- defines Clash consequence semantics;
- exposes a pure resolver from `ClashResolution` to consequence data;
- adds optional Clash data to `BattlePreviewResult` without changing current card/Intent behavior;
- preserves current Preview output when no authored Clash input is supplied;
- adds unit tests.

This batch does not:

- enable Clash on the current ten QA cards;
- author Clash metadata for current enemy Intents;
- change damage or Intent resolution in live runtime;
- wire Clash into `BattleTurnController`;
- consume or remove an Intent after Clash;
- add Clash animation, camera, FX, text, or assets.

## Consequence model

```ts
type ClashEffectMode = 'full' | 'half' | 'none';
type ClashIntentMode = 'cancel' | 'half' | 'full';

interface ClashConsequence {
  outcome: 'player-win' | 'draw' | 'enemy-win';
  playerEffectMode: ClashEffectMode;
  enemyIntentMode: ClashIntentMode;
}
```

Semantics:

| Outcome | Player action | Enemy Intent |
|---|---|---|
| `player-win` | `full` | `cancel` |
| `draw` | `half` | `half` |
| `enemy-win` | `none` | `full` |

`half` means deterministic floor division for integer damage when a later integration batch applies the consequence. Non-damage semantic effects are not automatically halved in this batch; later wiring must explicitly define which effects survive a draw.

## Preview integration boundary

`BattlePreviewInput` may optionally receive an already-resolved Clash package:

```ts
interface BattlePreviewClashInput {
  resolution: ClashResolution;
}
```

`BattlePreviewResult` may expose:

```ts
clash?: {
  resolution: ClashResolution;
  consequence?: ClashConsequence;
};
```

Rules:

- unavailable Clash returns the unavailable resolution and no consequence;
- eligible Clash returns both resolution and consequence;
- current battle math remains unchanged in Phase 14b even when Clash data is attached;
- later Phase 14c must apply the same consequence object during Preview and Execute rather than duplicating outcome logic.

## Why consequence is separate from score calculation

`ClashResolver` answers who won. `ClashConsequenceResolver` answers what that result means.

Keeping these separate prevents score arithmetic from becoming coupled to HP, Intent, Break, Guard, Timeline, or presentation code, and makes later balance changes auditable.

## Verification

Required tests:

- player win maps to full/cancel;
- draw maps to half/half;
- enemy win maps to none/full;
- unavailable Clash produces no consequence;
- Battle Preview remains byte-for-byte equivalent in its existing fields when no Clash input is present;
- optional Clash metadata is returned defensively;
- `npm run test`;
- `npm run build`;
- `git diff --check`.

No browser QA is required because this batch does not alter runtime behavior or presentation.
