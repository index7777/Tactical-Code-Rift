# Combat Refactor Phase 21 — Demo Card Upgrade Progression

STATUS = PHASE21A_CI_VERIFIED_JOURNEY_WIRING_PENDING
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

## Data boundary

Implemented pure `DemoCardUpgradeProgression` owns:

- family upgrade ids;
- milestone lookup by completed encounter id;
- validation / normalization of an owned upgrade set;
- stable remaining-choice order;
- deterministic application of owned upgrades to `RefactorCardDefinition` values.

The module returns detached card definitions and effects. Base card definitions remain immutable.

Duplicate upgrade ids are normalized to one owned upgrade. Unknown upgrade ids are rejected.

## Battle bootstrap boundary

`createEncounterBattleBootstrap()` now accepts an explicit owned-upgrade list as its third argument and applies it before creating the shared deck.

The default remains an empty list, so existing story encounters remain behavior-identical until Journey progression wiring supplies upgrades.

The combat resolver, Preview, ActionDefinition adapter, Clash rules, and presentation sequencer consume the upgraded card data through the existing card definition boundary; they do not independently know about progression.

## Journey ownership

The Journey layer will own the run's selected upgrade ids and reward-choice interaction. Combat must not write progression state.

Phase 21a stops before reward-choice UI and registry persistence. It establishes the pure rules and bootstrap seam first.

## Verification

Automated coverage includes:

- exact three milestone ids / branch equivalence;
- no reward on battle-2 or boss;
- each family upgrade value;
- duplicate ownership does not stack;
- unknown upgrade ids reject;
- base definitions remain unchanged;
- empty-upgrade bootstrap keeps current combat values;
- upgraded definitions are applied before deck instantiation.

CI run 499: `npm run build` passed and `npm test` passed.

## Phase 21b pending

Still pending:

- Journey registry persistence for owned upgrade ids;
- post-victory reward detection exactly once per milestone;
- family-upgrade choice presentation;
- feeding the persisted upgrade list into the next `RefactorBattleScene` bootstrap;
- route/battle browser QA.

## Out of scope

- deck size changes;
- card acquisition/removal;
- rarity/currency/shop systems;
- character-specific cards;
- new Clash balance;
- generated assets.
