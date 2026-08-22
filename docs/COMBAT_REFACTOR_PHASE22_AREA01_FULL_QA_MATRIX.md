# Combat Refactor Phase 22 — Area 01 Full QA Matrix

STATUS = IMPLEMENTATION_CONTRACT
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

The QA matrix must create every encounter through `createEncounterBattleBootstrap()` rather than constructing bespoke test-only battle states.

## Required automated checks

### Route / encounter integrity

- all seven canonical battle ids resolve through `EncounterCatalog`;
- every encounter creates exactly four player actors;
- every encounter creates the canonical enemy roster and positive HP values;
- `rain-warrior` and `rain-boss` retain their authored HP/resilience cutovers;
- Boss bootstrap retains authored multi-hit / AoE Intent capability.

### Progression integrity

- `battle-1`, either `battle-3-*`, and `elite-1` remain the only three reward milestones;
- upper/lower branch choice cannot produce a fourth reward;
- three chosen family upgrades remain active in the Boss-entry deck;
- Boss completion does not create an additional in-Area upgrade.

### Presentation capability

The eight action presentation profiles must remain available:

`quick-melee / heavy-melee / guard / disruption / break / enemy-light / enemy-heavy / boss-signature`.

This matrix verifies capability presence only; timing quality remains a browser QA concern.

### Responsive policy

The two mandatory QA viewports are:

- `1280×720` → normal wide-screen battle policy;
- `844×390` → compact landscape policy.

Automated tests verify both resolve to the currently approved viewport scale modes and that decision-camera policy can produce legal PEEK / FOCUS / TARGETING values without exceeding stage camera bounds.

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

If browser evidence cannot be produced in the current tool environment, status must remain `CI_VERIFIED_BROWSER_QA_PENDING`.

## Out of scope

- generated assets;
- card-family replacement plates;
- new combat balance;
- new Clash rules;
- route geometry redesign;
- new cards / deck size changes;
- additional reward systems;
- portrait cut-ins or bespoke Boss cinematics.
