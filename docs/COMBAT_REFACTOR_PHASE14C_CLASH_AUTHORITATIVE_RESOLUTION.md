# Combat Refactor Phase 14c — Clash Authoritative Resolution

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Objective

Phase 14c applies the Phase 14b `ClashConsequence` to the same Preview -> Execute rules path used by normal battle resolution.

The goal is to make Clash consequences authoritative without moving any decision into Phaser, without duplicating Preview/Execute formulas, and without enabling Clash on current production cards/enemy actions yet.

## Boundaries

This batch may:

- scale/suppress the player action according to `playerEffectMode`;
- derive a contested enemy Intent preview according to `enemyIntentMode`;
- allow `resolveBattleAction()` to commit the exact Clash-adjusted preview when an explicit Clash package is supplied;
- expose the contested enemy id and before/after Intent in the returned Clash preview data.

This batch does not:

- author Clash metadata for the current ten QA cards;
- infer a contested enemy from skill names, target rules, or Scene objects;
- add Controller auto-selection of a Clash candidate;
- implement multi-hit/AoE Clash;
- implement Clash choreography, camera, FX, text, or assets;
- change existing non-Clash runtime behavior.

## Authoritative input

Clash remains explicit application data. Resolution never searches the battlefield for a possible opponent.

```ts
interface BattlePreviewClashInput {
  resolution: ClashResolution;
  contestedEnemyId?: string;
  enemyIntent?: IntentState;
}
```

For an eligible Clash, `contestedEnemyId` and `enemyIntent` are required. Unavailable Clash may be carried for UI/debug visibility without a contested Intent.

The contested enemy is separate from the card target because `guard-intercept` targets an ally while contesting an enemy's Intent.

## Player consequence application

`playerEffectMode` is applied through the existing `resolveBattlePreview()` path. Clash does not reimplement specialization, Break, lethal, Timeline, or HP arithmetic.

### `full`

Use the authored card effect and current damage modifiers unchanged.

### `half`

For Phase 14c:

- first compute the normal player damage result, including existing Break and actor-specialization damage bonuses;
- final integer damage = `floor(normalFinalDamage / 2)`;
- Guard ratio = `ratio / 2`;
- Guard cap = `floor(cap / 2)` when present;
- target Delay is suppressed;
- Interrupt is suppressed;
- Break-window creation is suppressed.

Existing Break-window consumption may still contribute to the damage calculation on a draw because the player action partially connects. The final combined damage is halved afterward.

This is intentionally conservative: non-damage control effects are not granted on a draw unless a later design contract explicitly authorizes them.

### `none`

Suppress damage, target Delay, Guard, Interrupt and Break-window creation. Existing Break windows are not consumed. The action still pays its authored action Delay because the card was committed and time was spent attempting the Clash.

## Enemy Intent consequence application

The contested enemy Intent is transformed independently from the card target.

### `cancel`

The current Intent becomes `hard-stagger` using the existing Intent semantic helper. It retains the action Delay slot but deals no damage/status effect when the enemy reaches that action.

### `half`

- integer damage = `floor(damage / 2)`;
- status effects are removed because typed fractional status semantics do not yet exist;
- target ids, action Delay and counterplay flags remain unchanged.

### `full`

The Intent remains unchanged.

The Preview exposes `enemyIntentBefore`, `enemyIntentAfter`, and `enemyIntentChange` under its Clash result. Presentation reads these values; it does not recompute them.

## Direct-target precedence

When the card target and `contestedEnemyId` are the same enemy, normal player card effects are resolved first and the Clash enemy consequence is authoritative for the contested Intent afterward.

Therefore:

- player win always leaves the contested Intent canceled even if the full player card also had Delay/Interrupt semantics;
- draw suppresses player control semantics and leaves the enemy Intent in its half form;
- enemy win suppresses player effects and preserves the full Intent.

HP/lethal handling still comes from the existing player Preview. If the player action kills the contested enemy, normal lethal cleanup wins and the enemy Intent is removed with the actor.

## Resolution wiring

`BattleResolutionInput` may carry the same explicit Clash package.

`resolveBattleAction()` must call `resolveBattlePreviewWithClash()` exactly once and commit that returned preview. Execute may not rerun Clash outcome logic separately.

No Clash input must preserve the existing `resolveBattleAction()` result.

## Verification

Required tests:

- player win keeps full player damage and converts contested Intent to hard stagger;
- draw floors the final player damage after current damage modifiers, suppresses control effects, and halves enemy damage while removing status effects;
- enemy win suppresses player damage/effects and preserves enemy Intent;
- action Delay is still paid on draw/enemy win;
- guard-intercept can target an ally while mutating a separate contested enemy Intent;
- lethal player win removes the target enemy and its Intent normally;
- unavailable/no Clash preserves existing behavior;
- Preview and Execute return the same Clash consequence data;
- source card/Intent/Clash inputs remain unmutated;
- `npm run test`;
- `npm run build`;
- `git diff --check`.

Browser QA is not required because current production cards/enemy actions still do not opt into Clash in this batch.
