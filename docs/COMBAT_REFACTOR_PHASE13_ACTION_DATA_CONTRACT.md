# Combat Refactor Phase 13 — Action Data Contract

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-22

## Objective

Phase 13 formalizes one reusable action-definition contract for the Area 01 combat demo before Clash, boss phases, advanced presentation sequencing, or new asset production.

The contract must be able to describe player-card actions and enemy/Boss actions without Phaser Scene conditionals, without restoring legacy `clashPower / tempo` as the primary combat model, and without moving combat-rule calculations into presentation.

## Boundaries

This phase defines and validates data only.

It does not:

- change current damage, Delay, Guard, Break, specialization, Preview, or Resolution formulas;
- implement Clash resolution;
- implement Boss phase AI;
- implement multi-target/multi-hit resolution;
- change encounter balance;
- change Phaser presentation;
- generate or integrate any new art asset.

Existing `RefactorCardDefinition` and `IntentState` remain authoritative runtime inputs until later migration batches explicitly wire this contract into resolution.

## Core action model

### Ownership

`ActionDefinition` is a semantic catalog record. It describes what an action is allowed to request; it does not itself mutate battle state.

```ts
interface ActionDefinition {
  id: string;
  owner: 'player-card' | 'enemy';
  name: string;
  targetMode: ActionTargetMode;
  hits: readonly ActionHitDefinition[];
  actionDelay: number;
  targetDelay?: number;
  guard?: ActionGuardDefinition;
  breakWindow?: 'armor-break' | 'imbalance';
  interrupt?: boolean;
  statuses: readonly ActionStatusApplication[];
  clash: ActionClashDefinition;
  telegraph: ActionTelegraphDefinition;
  ai?: EnemyActionAiDefinition;
  presentationProfile: ActionPresentationProfile;
}
```

### Target modes

Demo-supported semantic target modes:

- `self`
- `single-enemy`
- `single-ally`
- `any-ally`
- `all-enemies`
- `all-allies`
- `random-enemy`
- `random-ally`
- `none`

Current runtime may only execute a subset. Unsupported modes must remain data-only until an implementation batch adds resolver support.

### Hit definitions

Damage and hit count are explicit rather than encoded in a skill name.

```ts
interface ActionHitDefinition {
  damage: number;
  repeats?: number;
}
```

`repeats` defaults to 1. Multi-hit actions therefore remain one action with a deterministic hit sequence instead of several unrelated actions.

### Typed status payload

String-only status names are insufficient for later Demo actions. New action catalog data uses typed applications:

```ts
interface ActionStatusApplication {
  id: string;
  stacks?: number;
  durationActions?: number;
  magnitude?: number;
}
```

This phase does not define status-resolution semantics beyond validation of non-negative integer/number fields.

### Clash metadata

Phase 13 reserves Clash capability without resolving Clash.

```ts
type ClashMode = 'none' | 'direct' | 'guard-intercept';

interface ActionClashDefinition {
  mode: ClashMode;
  base?: number;
  tags: readonly string[];
}
```

Rules:

- `mode = none` forbids a `base` score.
- active Clash modes require a non-negative integer `base`.
- this metadata must not revive legacy `EnemySkill.clashPower` as the final decision rule.
- Phase B will define Preview/Resolution usage and timing modifiers.

### Telegraph

Enemy/Boss action readability is explicit data:

```ts
interface ActionTelegraphDefinition {
  level: 'normal' | 'danger' | 'signature';
  cue?: string;
}
```

Telegraph is presentation metadata only. It does not alter damage or Delay.

### Enemy AI metadata

Enemy actions may carry selection metadata:

```ts
interface EnemyActionAiDefinition {
  weight: number;
  cooldownActions?: number;
  minPhase?: number;
  maxPhase?: number;
}
```

Phase 13 validates the fields only. Phase C will consume them for Elite/Boss action pools.

### Presentation profile

Action data selects reusable choreography language rather than hard-coding skill ids in Scene code.

Initial allowed profiles:

- `quick-melee`
- `heavy-melee`
- `guard`
- `disruption`
- `break`
- `enemy-light`
- `enemy-heavy`
- `boss-signature`
- `none`

Phase D/E will consume these values. Phase 13 does not implement animation sequencing.

## Validation rules

`createActionDefinition()` must reject:

- missing id/name;
- negative or fractional Delay values;
- actions with no hit/effect/status semantic at all unless presentation profile is `none` and target mode is `none`;
- hit damage below 0;
- repeat count below 1 or fractional;
- target Delay below 0 or fractional;
- invalid Guard ratio/cap;
- Clash base on `none` mode;
- active Clash mode without a base;
- negative AI weight/cooldown/phase;
- `minPhase > maxPhase`;
- invalid status stacks/duration/magnitude.

The factory returns defensive copies of nested arrays so catalog records cannot be mutated through caller-owned arrays.

## Legacy separation

The existing legacy `src/core/battle/BattleTypes.ts` contains `EnemySkill.clashPower` and `tempo`. Phase 13 does not modify or reuse those fields as the new action contract. They remain legacy compatibility data until the encounter/enemy catalog migration explicitly removes their dependency.

The refactor card definitions continue to use their current fields during this phase. Later migration may adapt them into `ActionDefinition`, but no current card behavior changes in Phase 13.

## Demo coverage target

At the end of Phase A, the contract must be expressive enough to represent, as data:

- current five card families;
- single-target direct damage;
- Guard;
- target Delay;
- Interrupt;
- armor-break / imbalance windows;
- multi-hit attacks;
- all-target attacks;
- typed status applications;
- Clash eligibility;
- enemy telegraph level;
- enemy cooldown/weight/phase gates;
- one reusable presentation profile id.

This is an expressiveness gate only, not a claim that every resolver already executes every field.

## Files

New domain files:

```text
src/core/actions/ActionDefinition.ts
src/core/actions/ActionDefinition.test.ts
```

No Phaser imports are permitted.

## Verification

Required:

- unit tests cover valid player and Boss definitions;
- unit tests cover multi-hit, AoE, Clash, status, cooldown and phase metadata;
- unit tests cover invalid numeric and Clash combinations;
- `npm run test`;
- `npm run build`;
- `git diff --check`.

Runtime/browser QA is not required because this phase changes no runtime wiring.
