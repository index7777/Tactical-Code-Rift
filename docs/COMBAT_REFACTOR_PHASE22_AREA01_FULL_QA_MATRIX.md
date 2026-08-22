# Combat Refactor Phase 22 — Area 01 Full QA Matrix

STATUS = CI_VERIFIED_BROWSER_QA_PENDING
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 22 closes the automated QA portion of the seven-node Area 01 Demo before final visual/browser polish and before any asset generation.

This batch does not add combat mechanics. It establishes one deterministic regression matrix that proves the canonical route, encounter bootstraps, progression milestones, upgraded-card handoff, presentation profile availability, and the two required viewport classes remain mutually compatible.

## Canonical battle matrix

The seven battle nodes are fixed:

1. `battle-1`
2. `battle-2-upper`
3. `battle-2-lower`
4. `battle-3-upper`
5. `battle-3-lower`
6. `elite-1`
7. `boss-1`

Expected enemy counts remain `2 / 3 / 3 / 4 / 4 / 3 / 3`.

The QA matrix creates every encounter through `createEncounterBattleBootstrap()` rather than constructing bespoke test-only battle states.

## Implemented automated checks

### Route / encounter integrity

- all seven canonical battle ids resolve through `EncounterCatalog`;
- every encounter creates exactly four player actors;
- every encounter creates the canonical enemy roster and positive HP values;
- `rain-warrior` and `rain-boss` retain their authored HP/resilience cutovers;
- Boss bootstrap retains authored multi-hit Intent capability through `山影連刃 = 6 × 2`.

### Progression integrity

- `battle-1`, either `battle-3-*`, and `elite-1` remain the only three reward milestones;
- upper/lower branch choice cannot produce a fourth reward;
- Quick +2, Guard cap +3 and Heavy +3 remain active together in the Boss-entry deck;
- Boss completion does not create an additional in-Area upgrade.

### Presentation capability

The eight action presentation profiles remain available:

`quick-melee / heavy-melee / guard / disruption / break / enemy-light / enemy-heavy / boss-signature`.

The matrix verifies capability presence only; timing quality remains a browser QA concern.

### Responsive policy

The two mandatory QA viewports remain:

- `1280×720` → `COVER`;
- `844×390` → `FIT`.

Automated tests also verify decision-camera PEEK / FOCUS / TARGETING outputs use zoom `1.05 / 1.08 / 1.12` and remain inside the stage camera safe bounds.

## Automated verification

`src/application/battle/DemoArea01FullQaMatrix.test.ts` now covers the route/encounter, Elite/Boss cutover, progression, presentation-profile and responsive-camera matrix above.

CI run 572 passed:

- `npm run build`;
- `npm run test`.

## Browser QA gate

Phase 22 automated CI does not replace visual browser QA.

Still required before the Demo is considered visually closed:

- 1280×720 and 844×390 route screen;
- all seven battle nodes can enter `PLAYER_IDLE`;
- PEEK → FOCUS → TARGETING readability;
- Quick / Heavy / Guard / Disruption / Break timing distinction;
- enemy-heavy / boss-signature distinction;
- `山影連刃` two visual contacts / one resolver;
- `驟雨橫掃` explicit-target AoE reactions;
- Clash contact / hit-stop / three outcomes;
- reward-choice overlay readability and claim flow;
- no camera ownership fight between decision camera, action sequencer and Clash presentation.

Until that evidence exists, Phase 22 remains `CI_VERIFIED_BROWSER_QA_PENDING`.

## Out of scope

- generated assets;
- card-family replacement plates;
- new combat balance;
- new Clash rules;
- route geometry redesign;
- new cards / deck size changes;
- additional reward systems;
- portrait cut-ins or bespoke Boss cinematics.
