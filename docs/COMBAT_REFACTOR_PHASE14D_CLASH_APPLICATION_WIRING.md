# Combat Refactor Phase 14d — Clash Application Wiring

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Objective

Phase 14d wires the Phase 14 / 14b / 14c Clash rules into the application layer without putting eligibility, timing, score, or consequence logic in Phaser.

The controller must be able to derive a deterministic Clash candidate from the selected player card, its explicit target, public enemy Intent data, and the authoritative Timeline. The resulting `ClashResolution` is then carried from Preview into Execute and committed by the already-authoritative Phase 14c resolution path.

This batch enables Clash only in the isolated refactor QA bootstrap. The seven Area 01 story encounters remain unchanged until their enemy action data is migrated in the later encounter-data phase.

## Boundaries

This batch may:

- introduce a pure application-level Clash planner;
- use explicitly authored Phase 13 `ActionDefinition` records for Clash-capable QA cards and the QA enemy Intent;
- derive a deterministic contested enemy from card target / protected ally + public Intents + Timeline;
- derive the initial Demo timing modifier from authoritative Timeline distance and player action Delay;
- derive the initial Rin / Chikage Clash specialization modifiers;
- let `BattleTurnController` expose Clash-adjusted Preview and commit exactly that Clash package during Execute;
- add QA-bootstrap Clash authoring and tests.

This batch does not:

- infer Clash from legacy `EnemySkill.clashPower` or `tempo`;
- infer enemy action identity from display names inside the controller;
- enable Clash in the seven Area 01 encounter bootstrap;
- add Clash UI copy, iconography, camera work, motion, hit-stop or FX;
- generate assets;
- change non-Clash cards or story-encounter combat behavior.

## Explicit authored catalog

`BattleTurnController` receives an optional application-owned Clash catalog:

```ts
interface ClashApplicationCatalog {
  playerActionByCardDefinitionId: Readonly<Record<string, ActionDefinition | undefined>>;
  enemyActionByIntentId: Readonly<Record<string, ActionDefinition | undefined>>;
}
```

The catalog is explicit data. A missing record means that action does not opt into Clash in this runtime.

Phase 14d QA authoring:

- `qa-quick-cut`: direct Clash;
- `qa-quick-feint`: direct Clash;
- `qa-heavy-cleave`: direct Clash;
- `qa-heavy-strike`: direct Clash;
- `qa-guard-cover`: guard-intercept Clash;
- disruption / break / self-guard remain non-Clash in this batch;
- `ghost-fire-rush`: direct Clash.

Story encounters do not receive a catalog yet.

## Candidate relationship

### Direct

For a player action authored as `direct`:

- the card must target an enemy;
- that exact enemy must have a public Intent;
- that Intent must have an authored enemy ActionDefinition in the catalog;
- the exact target enemy is the only candidate.

### Guard intercept

For a player action authored as `guard-intercept`:

- the card target is the ally being protected;
- eligible candidates are living enemies whose public Intent currently targets that ally and whose Intent has an authored enemy ActionDefinition;
- if multiple enemies qualify, choose the one that acts earliest on the authoritative Timeline;
- Timeline tie order uses existing deterministic ordering.

The planner does not inspect Phaser objects, screen positions or skill names.

## Timing modifier v1

Phase 14 reserved a `timing` score slot but did not define production arithmetic. Phase 14d defines the first Demo application rule:

```text
lead = contestedEnemy.nextActionAt
     - activePlayer.nextActionAt
     - playerAction.actionDelay

playerTiming = clamp(lead, -2, +2)
enemyTiming = 0
```

Interpretation:

- a fast player action used well before the threatened enemy action gains timing advantage;
- a slow committed action can incur a timing penalty;
- the modifier is bounded so authored Clash base values remain the primary move identity;
- enemy timing is neutral in this first version because the enemy move is already represented by its authored base score and public scheduled action.

This formula reads only the new ActionDefinition action Delay and the new Timeline. It does not read legacy tempo.

## Specialization modifier v1

Initial Clash specialization is deliberately small:

- Rin using a `quick` direct Clash: `+1` player specialization;
- Chikage using `guard-intercept`: `+1` player specialization;
- all other Phase 14d QA cases: `0`;
- enemy specialization: `0`.

No additional state modifier is authored in Phase 14d; both sides use `state = 0`.

## Preview / Execute ownership

On `previewPlayerTarget()`:

1. resolve the normal explicit target;
2. ask the pure Clash application planner for a candidate and `ClashResolution`;
3. call `resolveBattlePreviewWithClash()` when a Clash package exists, otherwise use the normal preview path;
4. store the returned Clash-adjusted preview.

On `confirmPlayerCard()` the controller must preserve the already-previewed Clash package together with the committed card/target.

On `completeResolution()` the controller passes that same resolution + contested enemy id into `resolveBattleAction()`. The controller must not recalculate the Clash score after confirmation.

This preserves the existing rule: Preview and Execute share one authoritative consequence path.

## QA runtime scope

`createRefactorBattleBootstrap()` supplies the QA Clash catalog. This allows the isolated `ghost-fire` QA battle to exercise Clash behavior.

`createEncounterBattleBootstrap()` supplies no Clash catalog in Phase 14d. Therefore the seven story encounters remain byte-for-byte equivalent in combat behavior until their formal enemy action migration.

## Verification

Required tests:

- direct card selects only its explicit enemy target as contested enemy;
- guard-intercept selects an enemy Intent that targets the protected ally;
- multiple guard-intercept candidates choose earliest Timeline enemy deterministically;
- timing modifier follows the bounded lead formula;
- Rin quick receives +1 specialization;
- Chikage guard-intercept receives +1 specialization;
- missing authored player/enemy action produces no Clash package;
- controller Preview exposes the same Clash result later committed by Execute;
- cancel/reselect clears stale Clash state;
- QA bootstrap enables Clash;
- story encounter bootstrap remains Clash-disabled;
- no dependency on legacy `clashPower` / `tempo`;
- `npm run build`;
- `npm test`;
- `git diff --check`.

Browser QA is optional in Phase 14d because no new presentation is added. Visual Clash affordance and choreography are later phases.
