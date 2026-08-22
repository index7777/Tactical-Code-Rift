# Combat Refactor Phase 21b — Journey Upgrade Reward State

STATUS = CI_VERIFIED
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 21b adds the pure Journey-owned reward state that turns the Phase 21 milestone policy into a claim-once progression flow. It stops before Phaser reward-choice UI wiring; Phase 21c owns that production integration.

Combat remains a consumer of the owned-upgrade list through `createEncounterBattleBootstrap()`. Combat does not mutate run progression.

## State

A Demo progression run state contains:

- `ownedUpgradeIds`: normalized Phase 21 family upgrade ids;
- `claimedMilestones`: claimed reward milestones.

The only milestones are:

- `after-battle-1`;
- `after-battle-3`;
- `after-elite-1`.

Both `battle-3-upper` and `battle-3-lower` map to the same `after-battle-3` milestone and therefore cannot grant two rewards.

## Reward flow

Given a completed encounter id and current progression state:

1. non-milestone encounters return no pending reward;
2. an already-claimed milestone returns no pending reward;
3. otherwise the pending reward exposes every currently unowned family upgrade as a deterministic choice list;
4. selecting one offered upgrade atomically adds the upgrade and marks the milestone claimed;
5. selecting an unknown, already-owned, or non-offered upgrade is rejected;
6. state normalization rejects unknown upgrade ids and unknown milestone ids.

A claimed milestone may not be reopened by replaying the same encounter.

## Choice policy v1

The Demo deliberately offers all remaining family upgrades instead of a randomized three-card reward roll.

Reason: Area 01 has only three reward checkpoints and five bounded family upgrades. Showing the remaining set keeps the tactical progression legible, deterministic, and testable while avoiding deckbuilder-style reward RNG.

At most three upgrades can be owned through canonical Area 01 progression because there are exactly three claimable milestones.

## Boundaries

This phase adds pure progression-state helpers and unit tests only.

It does not:

- modify Phaser scenes;
- write to the registry;
- display reward choice UI;
- change route geometry;
- change deck size;
- add currencies, rarity, shops, relics, or card acquisition/removal;
- modify Clash or combat resolution;
- generate assets.

## Verification

Automated evidence covers:

- fresh normalized state;
- first milestone exposes five upgrades;
- branch-equivalent battle-3 milestone cannot be claimed twice;
- non-milestone encounters produce no reward;
- claim adds exactly one upgrade and exactly one milestone;
- replay cannot reopen claimed reward;
- duplicate/unknown input handling;
- invalid selection rejection;
- base input arrays remain detached/immutable.

CI run 503 passed `npm run build` and `npm test`.
