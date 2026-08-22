# Combat Refactor Phase 21 — Demo Card Upgrade Progression

STATUS = PHASE21B_IMPLEMENTATION_IN_PROGRESS
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 21 adds a bounded Area 01 progression layer to the current shared 10-card combat kit without turning the Demo into a large deckbuilder.

The player keeps the same card definitions and deck size. Progression only upgrades one of the five existing card families at fixed route milestones.

This phase does not add card acquisition, card removal, rarity, currencies, shops, relics, character-locked decks, or generated assets.

## Progression model

A run owns a set of family upgrade ids. Each family may be upgraded at most once:

- `quick-v1`
- `heavy-v1`
- `guard-v1`
- `disruption-v1`
- `break-v1`

The set is additive across Area 01 and contains no duplicate stacking.

A completed run can own at most three family upgrades before the Boss.

## Reward milestones

Area 01 uses three reward checkpoints:

1. victory at `battle-1` -> first family upgrade;
2. victory at either `battle-3-upper` or `battle-3-lower` -> second family upgrade;
3. victory at `elite-1` -> third family upgrade.

`battle-2-upper` / `battle-2-lower` are branch-combat pacing nodes and do not grant an additional upgrade. `boss-1` ends the Area and does not grant an upgrade used inside Area 01.

The milestone policy is based on canonical encounter ids, not visual route coordinates.

## Upgrade values v1

Upgrades deliberately modify existing semantics only:

| Family | Upgrade |
| --- | --- |
| Quick | each Quick card gains `+2` authored damage |
| Heavy | each Heavy card gains `+3` authored damage |
| Guard | each Guard card gains `+3` guard cap; ratio is unchanged |
| Disruption | each Disruption card action Delay is reduced by `1`, minimum `0` |
| Break | each Break card action Delay is reduced by `1`, minimum `0` |

No upgrade adds a new target rule, status, Clash mode, Break kind, interrupt flag, or presentation profile.

## Phase 21a — Pure upgrade rules / battle bootstrap seam

Implemented pure `DemoCardUpgradeProgression` owns:

- family upgrade ids;
- milestone lookup by completed encounter id;
- validation / normalization of an owned upgrade set;
- stable remaining-choice order;
- deterministic application of owned upgrades to `RefactorCardDefinition` values.

The module returns detached card definitions and effects. Base card definitions remain immutable.

Duplicate upgrade ids are normalized to one owned upgrade. Unknown upgrade ids are rejected.

`createEncounterBattleBootstrap()` accepts an explicit owned-upgrade list and applies it before creating the shared deck. Preview, Resolution, ActionDefinition adapters, Clash, and presentation continue consuming ordinary upgraded card definitions; they do not independently know about progression.

CI run 499 verified Phase 21a build/tests.

## Phase 21b — Journey reward / run-state wiring contract

The run owns one normalized `DemoCardUpgradeRunState`:

- `ownedUpgradeIds` — selected family upgrades;
- `claimedMilestones` — reward milestones already consumed;
- `pendingMilestone` — at most one reward awaiting player choice.

Rules:

1. Returning to Journey after victory at `battle-1`, either `battle-3-*`, or `elite-1` offers the mapped milestone exactly once.
2. `battle-3-upper` and `battle-3-lower` map to the same `after-battle-3` milestone and can never grant two rewards in one run.
3. Defeat/retry never enters the Journey reward path and does not mutate progression.
4. While a reward is pending, route-node input is blocked; only remaining unowned family upgrades are selectable.
5. Choosing an upgrade adds exactly one owned family, claims the pending milestone, clears `pendingMilestone`, and persists the detached normalized state.
6. Unknown or already-owned upgrades reject; duplicate stored values normalize rather than stack.
7. Journey Registry is the run persistence boundary. Combat core never reads Phaser Registry.
8. Immediately before Journey starts the next `RefactorBattleScene`, it prepares the existing encounter handoff with current `ownedUpgradeIds`; `createEncounterBattleBootstrap()` consumes that handoff before deck creation.
9. Re-rendering or restarting Journey at the same completed milestone is idempotent.

### Reward presentation v1

No new image assets are required. The overlay uses Phaser primitives/text and explicit family choices:

- 快攻：傷害 +2
- 重擊：傷害 +3
- 守勢：Guard cap +3
- 干擾：自身 Delay -1
- 破勢：自身 Delay -1

Already-owned families are omitted. There is no random roll and no automatic selection.

Journey also shows currently owned upgrades as low-weight route information; this display has no gameplay authority.

### Registry / application boundary

A small application adapter owns the Registry key, normalization, exactly-once milestone mutation, choice persistence, and encounter-handoff preparation. `JourneyScene` calls that adapter; it does not duplicate progression rules.

The existing one-shot `DemoCardUpgradeEncounterHandoff` remains presentation/application transport only. Explicit bootstrap arguments still take precedence in tests and non-Journey callers.

### Verification required for Phase 21b

Automated evidence must cover:

- missing Registry state initializes cleanly;
- milestone victory opens pending exactly once;
- branch-equivalent battle-3 rewards cannot double grant;
- legal choice persists ownership and claims the milestone;
- owned/unknown/no-pending selections reject;
- next encounter handoff receives persisted ownership;
- the handoff remains one-shot;
- build/test pass.

Browser QA remains required for the reward overlay, blocked route input while pending, and a subsequent battle showing upgraded card values.

## Out of scope

- deck size changes;
- card acquisition/removal;
- rarity/currency/shop systems;
- character-specific cards;
- random reward rolls;
- save persistence beyond the current run Registry;
- new Clash balance;
- generated assets.
