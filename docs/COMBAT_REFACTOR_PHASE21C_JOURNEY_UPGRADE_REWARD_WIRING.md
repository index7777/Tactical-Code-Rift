# Combat Refactor Phase 21c — Journey Upgrade Reward Wiring

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 21c wires the Phase 21 / 21b bounded card-family progression into the production Journey → Battle → Journey loop.

The Journey layer owns progression state and reward choice. Combat only receives an explicit list of already-owned upgrade ids when a battle scene is entered.

## Registry ownership

Use one registry key for the Area 01 Demo run:

- `journey-card-upgrade-progression`

The stored value is normalized through `DemoCardUpgradeRewardState` before use.

The registry value contains only:

- `ownedUpgradeIds`;
- `claimedMilestones`.

Combat never writes this key.

## Battle entry

When Journey starts an encounter it passes the currently owned upgrade ids to `RefactorBattleScene` as scene data.

`RefactorBattleScene.init()` passes that explicit list to `createEncounterBattleBootstrap()`.

The bootstrap remains the only place that applies family upgrades to the shared card definitions before deck creation.

Direct QA battle entry without supplied progression keeps the empty-upgrade baseline.

## Victory return

On battle victory, `RefactorBattleScene` returns to `JourneyScene` with only the completed encounter id.

It must not claim a reward itself.

Defeat/retry does not create a reward and does not mutate progression.

## Journey reward flow

When Journey receives a completed encounter id:

1. normalize the registry progression state;
2. ask `pendingDemoCardUpgradeReward()` for that encounter;
3. if no reward exists, continue normal route interaction;
4. if a reward exists, display one modal overlay above the route;
5. show every remaining family upgrade as a deterministic choice;
6. selecting one choice calls `claimDemoCardUpgradeReward()` and writes the returned normalized state to the registry;
7. close the modal and resume route interaction.

The reward overlay must intercept route input while open. No reward may be silently auto-selected.

## Player-facing labels

Use short family labels and exact upgrade effects:

- Quick / 快：`傷害 +2`
- Heavy / 重：`傷害 +3`
- Guard / 守：`Guard 上限 +3`
- Disruption / 擾：`Action Delay -1`
- Break / 破：`Action Delay -1`

This UI is runtime text/geometry only. No generated reward-card art, icon skin, or currency is added.

## QA observability

Journey publishes read-only host dataset fields while the reward overlay is open:

- `qaUpgradeReward`
- `qaUpgradeChoices`
- `qaOwnedUpgrades`

These are diagnostic only and must not provide mutation controls.

## Verification

Automated evidence must cover:

- owned upgrades are passed into battle scene/bootstrap;
- victory return carries completed encounter id but does not mutate progression in battle;
- first milestone can be claimed once;
- battle-3 upper/lower share one claim;
- selected upgrade persists in the registry-shaped state used for the next battle;
- direct battle with no progression preserves base card values;
- build/test pass.

Browser QA remains required for one full `battle-1 victory → reward choice → next battle` path at 1280×720 and 844×390.

## Out of scope

- reward RNG;
- card acquisition/removal;
- deck size changes;
- currencies, rarity, shops, relics;
- character-specific cards;
- save-file persistence outside the current runtime registry;
- new Clash rules;
- balance retuning beyond Phase 21 values;
- generated assets.
