# Combat Refactor Phase 14 — Clash Core

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Objective

Phase 14 introduces deterministic Clash eligibility and result calculation on top of the Phase 13 `ActionDefinition` contract.

Clash is not a sixth card family and does not restore the legacy round-planning `clashPower` model. It is a conditional interaction between one player action and one already-authored enemy action / public Intent.

The same pure resolver must be usable by Preview and Execute. Presentation may display the returned result but may not recalculate Clash scores or decide the winner itself.

## Scope

This batch implements only:

1. Clash eligibility;
2. deterministic player/enemy Clash score calculation;
3. `player-win / draw / enemy-win` result;
4. explicit reasons when Clash is unavailable;
5. unit tests for the core rule.

It does not:

- wire Clash into `BattleTurnController`;
- replace current `BattleActionPreview`;
- cancel or modify an Intent in runtime;
- apply Clash damage, stagger, Break, Guard or Delay consequences;
- implement Clash camera / movement / hit-stop presentation;
- change current card or enemy balance;
- generate or integrate art assets.

Those are later batches after this core rule is stable.

## Eligibility model

Clash requires an authored player action and enemy action using Phase 13 action data.

### Required relationship

The application layer supplies whether both actions actually contest the same combat relationship. The core resolver does not infer target identity from skill names or Phaser objects.

```ts
interface ClashContext {
  sameTargetRelationship: boolean;
  player: ClashScoreModifiers;
  enemy: ClashScoreModifiers;
}
```

If `sameTargetRelationship = false`, Clash is unavailable.

### Mode compatibility

Supported Demo interactions:

- `direct` player action vs `direct` enemy action;
- `guard-intercept` player action vs `direct` enemy action when the enemy action is guardable.

Unsupported in Phase 14:

- any action with `clash.mode = none`;
- enemy `guard-intercept` reactions;
- direct Clash against non-direct environmental / summon / weather actions.

### Tags

`clash.tags` are capability filters.

- Empty tags mean unrestricted within the compatible mode.
- When both sides provide tags, at least one tag must intersect.
- Tags do not add score by themselves.

Examples: `melee`, `blade`, `projectile`, `magic`.

## Score model

Phase 14 deliberately keeps the arithmetic small and deterministic:

```text
finalScore = base + timing + specialization + state
```

```ts
interface ClashScoreModifiers {
  timing?: number;
  specialization?: number;
  state?: number;
}
```

Rules:

- modifiers are signed integers;
- score is clamped to a minimum of 0;
- `base` comes only from the new `ActionDefinition.clash.base`;
- the resolver never reads legacy `EnemySkill.clashPower` or `tempo`;
- presentation cannot provide modifiers directly in production wiring; later application/core integration must derive them from authoritative battle state.

Phase 14 does not yet define the production formula for timing or character specialization. It only defines the deterministic slot where those already-resolved modifiers enter.

## Result

```ts
type ClashOutcome = 'player-win' | 'draw' | 'enemy-win';
```

- player score > enemy score → `player-win`
- equal → `draw`
- player score < enemy score → `enemy-win`

The result itself does not mutate either action or battle state.

## Preview shape

```ts
interface ClashPreview {
  eligible: true;
  playerScore: ClashScoreBreakdown;
  enemyScore: ClashScoreBreakdown;
  outcome: ClashOutcome;
}
```

Unavailable Clash returns:

```ts
interface ClashUnavailable {
  eligible: false;
  reason:
    | 'different-target-relationship'
    | 'player-clash-disabled'
    | 'enemy-clash-disabled'
    | 'mode-incompatible'
    | 'enemy-not-guardable'
    | 'tag-incompatible';
}
```

This reason is primarily for tests/debug/Preview policy. Player-facing copy is a presentation concern.

## Determinism and ownership

`resolveClashPreview()` is a pure function.

It must:

- not mutate either `ActionDefinition`;
- return the same result for the same inputs;
- not read random values, time, Phaser, DOM, Scene state or legacy combat structures;
- be safe to call during Preview and again during authoritative Execute with the same resolved inputs.

The later runtime wiring must follow the existing Preview/Resolution architecture: Execute must consume the same Clash rule rather than introducing a second formula.

## Files

```text
src/core/clash/ClashResolver.ts
src/core/clash/ClashResolver.test.ts
```

No presentation files are changed in this batch.

## Verification

Required unit coverage:

- direct vs direct eligible;
- `none` mode rejects;
- different target relationship rejects;
- guard-intercept requires enemy guardable;
- empty tags are unrestricted;
- incompatible authored tags reject;
- timing / specialization / state modifiers affect final score;
- negative total clamps to 0;
- player win, draw and enemy win;
- resolver does not mutate input actions;
- repeated calls are deterministic;
- no dependency on legacy `clashPower / tempo`.

Required repository gates:

- `npm run build`;
- `npm test`;
- `git diff --check`.

Browser QA is not required because this phase has no runtime wiring or visual changes.
