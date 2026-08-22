# Combat Refactor Phase 21b — Journey Upgrade Reward Wiring

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Wire Phase 21a's bounded card-family upgrades into the Area 01 Journey flow so milestone victories create exactly one pending reward choice, the chosen family persists for the run, and subsequent encounters bootstrap with the owned upgrades.

This remains a small Demo progression layer, not a deckbuilder expansion.

## Authoritative run state

Add a pure run-state module with:

- `ownedUpgradeIds`: normalized Phase 21a family upgrade ids;
- `claimedMilestones`: milestones already consumed by this run;
- `pendingMilestone`: at most one milestone waiting for a player choice.

Rules:

1. A victory at `battle-1`, either `battle-3-*`, or `elite-1` may open its mapped milestone.
2. A milestone already claimed or already pending cannot be opened twice.
3. Defeat never changes progression.
4. Choosing an upgrade must use one of the currently available family upgrades; owned upgrades cannot be selected again.
5. Choosing resolves `pendingMilestone`, adds the upgrade, and records that milestone as claimed.
6. Run state is normalized/detached at every public boundary.
7. Maximum owned upgrades before the Boss remains three because Area 01 exposes only three unique milestones.

## Registry boundary

Phaser Registry owns one serialized run-state value under a single progression key. Presentation code may read/write that value only through small adapter helpers; combat core does not access Phaser Registry.

`RefactorBattleScene` responsibilities:

- read current owned upgrades during `init()`;
- pass them into `createEncounterBattleBootstrap()`;
- on a real victory, record the current encounter's milestone before returning to Journey;
- on defeat/retry, do not modify progression.

`JourneyScene` responsibilities:

- initialize missing progression state;
- when `pendingMilestone` exists, block route input with a compact reward overlay;
- present only remaining family upgrades;
- persist the chosen upgrade, close the overlay, and restore route input;
- display current owned family upgrades as low-weight route information.

## Reward presentation v1

No new image assets are required.

The reward overlay uses existing Phaser primitives/text and five buttons labeled by family:

- 快攻：傷害 +2
- 重擊：傷害 +3
- 守勢：Guard cap +3
- 干擾：自身 Delay -1
- 破勢：自身 Delay -1

Already-owned families are omitted. The choice is explicit; there is no random roll and no automatic pick.

## Battle handoff

The next encounter must receive the persisted `ownedUpgradeIds` before `createRefactorDeck()` runs. Preview, Resolution, ActionDefinition adapters, Clash, and presentation continue consuming ordinary upgraded card definitions; they do not query progression state.

## Exactly-once behavior

The battle result screen may be rendered repeatedly, and a scene may be restarted after defeat. Therefore milestone mutation must be idempotent:

- result rendering alone does not repeatedly append state;
- recording the same victory twice returns an equivalent state;
- branch-equivalent `battle-3-upper` / `battle-3-lower` share the same `after-battle-3` milestone.

## Verification

Automated evidence must cover:

- initial run state;
- milestone victory opens pending exactly once;
- duplicate victory is idempotent;
- branch-equivalent battle-3 milestones cannot double reward;
- choosing a legal upgrade claims the milestone and persists ownership;
- choosing an owned/unknown upgrade rejects;
- no pending milestone rejects selection;
- three milestones cap the run at three upgrades;
- battle bootstrap receives persisted owned upgrades;
- build/test pass.

Browser QA remains required for the reward overlay and the subsequent upgraded battle values.

## Out of scope

- random rewards;
- currencies, shops, rarity, relics;
- adding/removing cards;
- character-specific decks;
- save-file persistence beyond the current Phaser run Registry;
- generated assets;
- card-family illustration replacement.
