# Combat Refactor Phase 21b — Upgrade Run State

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 21b adds the pure Area 01 run-state that owns card-family upgrade reward progress between battles. It builds on Phase 21a's upgrade values and bootstrap seam, but still stops before Phaser reward-choice UI.

## Ownership

Progression state belongs to the Journey/run layer, not to combat resolution. Combat receives only the already-owned upgrade ids when a battle bootstrap is created.

The run state stores:

- owned `DemoCardUpgradeId[]`;
- claimed `DemoUpgradeMilestone[]`;
- at most one pending reward milestone.

All returned state must be detached from the input state.

## Victory reward transition

`offerDemoUpgradeRewardAfterVictory(state, encounterId)` uses the authoritative Phase 21 milestone lookup.

- non-milestone encounters return an unchanged detached state;
- a milestone already claimed or already pending cannot create another reward;
- `battle-3-upper` and `battle-3-lower` both map to `after-battle-3`, so the branch can grant only one reward;
- a pending reward must be resolved before a different milestone can be offered.

A battle defeat never calls this transition.

## Choice transition

`chooseDemoUpgradeReward(state, upgradeId)` is valid only while a reward is pending.

- the selected family upgrade must still be available;
- the upgrade is added exactly once;
- the pending milestone moves to claimed;
- pending is cleared;
- no automatic/random choice is allowed.

Unknown or already-owned upgrade ids are rejected. A run therefore owns at most three family upgrades before the Boss because there are only three unique reward milestones.

## Battle handoff

`demoOwnedUpgradeIds(state)` returns a detached normalized list suitable for passing into `createEncounterBattleBootstrap(journeyNodeId, seed, ownedUpgradeIds)`.

No resolver, Preview, Clash, enemy AI, presentation profile, or Phaser object may be imported here.

## Verification

Automated evidence must cover milestone offering, branch de-duplication, pending reward blocking, valid selection, rejection of duplicate/unknown/no-pending choices, detached state, and a complete three-reward run.

## Out of scope

- Phaser reward-choice UI;
- registry serialization/wiring;
- card art or generated assets;
- currencies, shops, rarity, card acquisition/removal;
- additional reward milestones.
