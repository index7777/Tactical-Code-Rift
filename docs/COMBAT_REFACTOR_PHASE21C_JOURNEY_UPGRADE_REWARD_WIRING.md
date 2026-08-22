# Combat Refactor Phase 21c — Journey Upgrade Reward Wiring

STATUS = CI_VERIFIED_BROWSER_QA_PENDING
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 21c wires the Phase 21 / 21b bounded card-family progression into the production Journey → Battle → Journey loop.

The Journey layer owns progression state and reward choice. Combat only consumes the owned family-upgrade list when the next encounter bootstrap is created.

## Registry ownership

The Area 01 Demo run uses one registry key:

- `journey-card-upgrade-progression`

The stored value is normalized through `DemoCardUpgradeRewardState` before use and contains only:

- `ownedUpgradeIds`;
- `claimedMilestones`.

Combat never writes this key.

## Battle entry handoff

Production uses a one-shot application handoff rather than making the battle Scene read Journey registry state directly:

1. `DemoProgressionJourneyScene` normalizes the registry progression state;
2. it calls `prepareDemoCardUpgradeEncounterHandoff(ownedUpgradeIds)`;
3. the next `createEncounterBattleBootstrap()` call consumes that prepared list when no explicit third argument is supplied;
4. the handoff clears immediately after consumption;
5. explicit bootstrap upgrade ids still override the prepared handoff for tests/tools.

This keeps the bootstrap as the only place that applies family upgrades to the shared card definitions before deck creation, while avoiding registry access inside combat core/controller code.

A direct QA battle starts with an empty handoff and therefore preserves the baseline card values.

## Victory / route invariant

The existing production route already moves `JourneyState.currentNodeId` to the selected encounter before entering battle, and `RefactorBattleScene` only returns to Journey after victory; defeat restarts the same battle Scene.

Therefore `DemoProgressionJourneyScene` uses the current Journey node as the just-completed encounter when it is recreated after a victory. It does not mutate progression while combat is active.

No reward is created on defeat/retry.

## Journey reward flow

When Journey is created:

1. normalize the registry progression state;
2. ask `pendingDemoCardUpgradeReward()` for `journey.currentNodeId`;
3. if no reward exists, continue normal route interaction;
4. if a reward exists, display one modal overlay above the route;
5. show every remaining family upgrade as a deterministic choice;
6. selecting one choice calls `claimDemoCardUpgradeReward()` and writes the returned normalized state to the registry;
7. refresh the one-shot encounter handoff with the newly owned upgrade list;
8. close the modal and resume route interaction.

The full-screen reward veil is interactive and sits above route nodes, so route selection cannot be clicked through while the reward is open. No reward is silently auto-selected.

## Player-facing labels

The runtime-only reward overlay uses short family labels and exact Phase 21 effects:

- Quick / 快：`傷害 +2`
- Heavy / 重：`傷害 +3`
- Guard / 守：`Guard 上限 +3`
- Disruption / 擾：`Action Delay -1`
- Break / 破：`Action Delay -1`

No generated reward-card art, icon skin, currency, rarity, or shop UI is added.

## QA observability

Journey publishes read-only host dataset fields:

- `qaUpgradeReward`
- `qaUpgradeChoices`
- `qaOwnedUpgrades`

These are diagnostic only and provide no mutation controls.

## Verification

Automated evidence now covers:

- normalized / claim-once Journey reward state (Phase 21b);
- one-shot upgrade handoff normalization and stale-state clearing;
- prepared Journey upgrades reaching the next encounter bootstrap;
- explicit bootstrap upgrades overriding the prepared handoff;
- a subsequent direct battle returning to baseline after the handoff is consumed;
- build/test pass.

CI run 503 verified Phase 21b reward state. CI run 510 verified Phase 21c Scene composition, handoff, bootstrap integration, full build, and full test suite.

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
