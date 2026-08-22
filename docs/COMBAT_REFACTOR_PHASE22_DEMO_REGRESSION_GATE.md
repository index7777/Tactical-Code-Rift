# Combat Refactor Phase 22 — Area 01 Demo Regression Gate

STATUS = CI_VERIFIED_BROWSER_QA_PENDING
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 22 closes the code-level regression gate for the seven-node Area 01 Demo before any new asset production.

This phase does not invent new combat rules. It verifies that route progression, bounded card-family upgrades, encounter bootstrap, and the two required viewport classes remain mutually compatible after Phases 11–21.

## Route regression

Automated regression covers both canonical branches:

- `depart → battle-1 → battle-2-upper → battle-3-upper → elite-1 → boss-1`
- `depart → battle-1 → battle-2-lower → battle-3-lower → elite-1 → boss-1`

For each route:

1. `battle-1` victory exposes the first upgrade reward;
2. the claimed upgrade reaches the next encounter deck exactly once through the one-shot handoff;
3. `battle-2-*` grants no reward;
4. `battle-3-*` grants the shared `after-battle-3` milestone exactly once;
5. `elite-1` grants the third and final Area 01 upgrade;
6. Boss entry receives all three owned upgrades;
7. `boss-1` grants no additional upgrade.

The branch-equivalent `battle-3` milestone remains impossible to double-claim through the Phase 21b reward-state rules.

## Combat regression boundary

`DemoArea01ProgressionRegression.test.ts` inspects the deck created by `createEncounterBattleBootstrap()` but does not duplicate card formulas. It verifies observable upgraded definitions already produced by Phase 21.

The regression uses Quick first, Guard second, Heavy third and confirms Boss entry sees all three simultaneously. After the one-shot handoff is consumed, a direct bootstrap returns to baseline values.

## Responsive code gate

The two required viewport classes are fixed regression inputs:

- 1280×720 desktop → `COVER`;
- 844×390 compact landscape → `FIT`.

Presentation geometry tests from Phases 12, 18, 19, and 20 remain authoritative for formation, hand, action, Clash, and decision-camera math.

Browser visual QA is still required; automated tests do not claim visual approval.

## Out of scope

- new combat balance;
- new progression rewards;
- route topology changes;
- new UI skinning;
- generated assets;
- browser screenshot approval.

## Verification

Automated evidence covers:

- both Area 01 branch progressions;
- three claim-once milestones;
- upgrade handoff consumption at each next encounter;
- Boss entry with exactly three upgrades;
- no Boss reward;
- direct-bootstrap baseline after handoff consumption;
- desktop/compact viewport policy regression.

CI run 515 passed `npm run build` and `npm test`.

Remaining gate: browser QA at 1280×720 and 844×390 for the complete battle-1 victory → reward choice → next battle flow, plus final presentation readability across the seven encounters.
