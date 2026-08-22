# Combat Refactor Phase 21c — Journey Upgrade Reward UI

STATUS = IMPLEMENTATION_CONTRACT
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 21c wires the bounded Phase 21/21b Demo progression into the production Journey → Battle loop.

After a milestone victory, Journey presents one deterministic family-upgrade choice. The selected upgrade persists for the Area 01 run and is applied to subsequent battle bootstraps. This remains a five-family / three-reward progression layer, not a deckbuilder reward system.

## Ownership

- `DemoCardUpgradeRunState` remains the authoritative pure progression state.
- `JourneyScene` owns the run-state registry entry and reward-choice interaction.
- battle bootstrap only consumes the currently owned upgrade ids.
- combat never mutates progression.
- presentation never recalculates card upgrade values.

Registry key v1:

`demo-card-upgrade-run-state`

The stored value is a normalized `DemoCardUpgradeRunState`.

## Milestone flow

When Journey is created after a completed encounter:

1. read and normalize the current run progression state, creating a fresh state only when no entry exists;
2. call the Phase 21b pure reward offer helper with the current canonical route node id;
3. if a new milestone is pending, persist that pending state and block route selection behind the reward overlay;
4. show every currently unowned family upgrade as a choice;
5. choosing one calls the pure claim helper, persists the resulting state, and refreshes Journey;
6. claimed milestones never reopen on replay.

`battle-3-upper` and `battle-3-lower` remain one shared `after-battle-3` milestone.

## Battle handoff

Before Journey enters a battle encounter it prepares the current owned upgrade ids through the existing application handoff used by `createEncounterBattleBootstrap()`.

A retry of the same encounter must keep the same owned upgrades. Therefore the prepared handoff is treated as the current Area-run battle configuration until Journey prepares a new value or explicitly clears it; it must not disappear merely because one bootstrap read occurred.

The handoff validates/normalizes ids before combat can see them.

## Reward presentation v1

The overlay is intentionally simple and procedural:

- title: `戰術強化`
- one short explanation line;
- one button per remaining family upgrade;
- each option shows family name plus exact deterministic effect;
- no rarity, currency, random roll, card art generation, loot animation, or new card acquisition.

Display copy:

- Quick / 迅式：`快攻傷害 +2`
- Heavy / 重式：`重擊傷害 +3`
- Guard / 守式：`守勢上限 +3`
- Disruption / 擾式：`行動 Delay -1`
- Break / 破式：`行動 Delay -1`

The overlay must absorb pointer input so route nodes cannot be selected before a reward is claimed.

## QA exposure

Journey publishes read-only DOM data for browser QA:

- owned upgrade ids;
- pending milestone id, when present.

This does not expose mutation controls.

## Verification

Automated evidence must cover:

- prepared upgrade handoff survives repeated battle bootstrap reads / retries;
- explicit clear removes prepared upgrades;
- unknown ids still reject;
- Phase 21b reward state remains claim-once;
- production build and full test suite pass.

Browser QA remains required for:

- battle-1 victory → five-choice reward;
- selected upgrade present in the next battle card data;
- battle-3 upper/lower shared milestone cannot double-claim;
- elite victory grants the third and final Area 01 reward;
- 1280×720 and 844×390 reward overlay readability.

## Out of scope

- generated assets;
- deck size changes;
- card acquisition/removal;
- rarity/currency/shop/relic systems;
- fourth reward before the Boss;
- post-Boss reward;
- character-specific deck progression;
- new combat or Clash formulas.
