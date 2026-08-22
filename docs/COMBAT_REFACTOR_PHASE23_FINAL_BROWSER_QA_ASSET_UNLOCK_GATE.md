# Combat Refactor Phase 23 — Final Browser QA / Asset Unlock Gate

STATUS = AUTOMATED_ROUTE_DECISION_QA_PASS_PRESENTATION_HARNESS_RERUN_PENDING
BRANCH = combat-refactor-v1
DATE = 2026-08-23

## Objective

Phase 23 is the final presentation acceptance gate before the first replacement card-family illustration is generated.

Phases 11–22 have code-level and CI evidence for the Area 01 route, combat runtime, bounded family upgrades, action presentation, Clash presentation, Boss multi-hit/AoE, and responsive geometry. This gate does not add combat rules or visual features. It requires runtime evidence that those systems remain readable together in the two canonical viewport classes.

Asset production remains locked until this gate passes. This preserves the approved order: gameplay/data/presentation first, full Demo QA second, generated card-family plates last.

## Required viewports

Run the same acceptance path at both:

- desktop: `1280×720`;
- compact landscape: `844×390`.

The desktop path may use COVER framing and the compact path may use FIT framing according to the existing viewport policy. Passing one viewport does not imply the other passes.

## Required route / progression path

At minimum verify one complete production path:

`depart → battle-1 → battle-2-* → battle-3-* → elite-1 → boss-1`

Evidence must show:

1. battle-1 victory returns to Journey;
2. the first family-upgrade reward modal blocks route click-through;
3. one explicit family choice is claimed;
4. the next battle receives that upgrade exactly once;
5. battle-2 grants no reward;
6. battle-3 grants the shared second milestone once;
7. elite-1 grants the third milestone;
8. Boss entry owns exactly three family upgrades;
9. Boss victory returns to Journey / Area clear without creating a fourth upgrade.

The opposite battle-3 branch remains covered by Phase 22 automated regression; visual QA only needs one full branch unless branch-specific layout or content differs.

## Required decision presentation

For at least one legal player turn, verify the full normal decision chain:

- `PEEK`: active actor is readable without hiding the battlefield;
- `FOCUS`: selected card is dominant and camera emphasis shifts toward the action lane without inventing a target;
- `TARGETING`: the authoritative actor/target relationship is visually clear;
- confirm transitions to `HIDDEN` before action choreography starts;
- after RETURN/HOME, the next legal decision state reacquires camera ownership.

There must be no camera fighting between Phase 20 decision focus and Phase 18/19 action/Clash choreography.

Routine selection must remain battlefield-first; no portrait cut-in is expected for ordinary selection.

## Required action-profile checks

Across the production route or deterministic QA bootstrap, confirm the existing eight presentation profiles remain distinguishable where authored:

- quick-melee;
- heavy-melee;
- guard;
- disruption;
- break;
- enemy-light;
- enemy-heavy;
- boss-signature.

The pass criterion is readable rhythm and semantics, not bespoke assets. Procedural FX and current runtime art remain acceptable for this gate.

Guard and disruption must not impersonate ordinary melee strikes. Heavy actions should read slower/heavier than quick actions. Boss signature should read as a higher-value event than enemy-light.

## Required Clash checks

Using an eligible deterministic Clash case, verify:

`simultaneous approach → anticipation → strike → contact → hit-stop → outcome branch → recovery → HOME`

Check all three authoritative outcomes if reachable through QA fixtures:

- player-win;
- draw;
- enemy-win.

Presentation must not display or recompute a second Clash result. Contact may produce visual feedback only once around the authoritative player-resolution handoff; the enemy resolver must not execute again for the contested Intent.

## Required Boss checks

- `山影連刃`: exactly two visual contacts for `hitCount=2`, while combat resolution is submitted once.
- `驟雨橫掃`: every explicit living `targetId` receives AoE reaction; no dead/non-target actor reacts.
- `終雨`: uses authored `boss-signature` presentation.
- Boss phase/action changes do not introduce camera, overhead, or formation overlap.

## Formation / HUD readability

At both viewports verify:

- rear/front 2×2 actors remain grounded and readable;
- dead enemy slots stay empty and do not compact;
- enemy overhead modules do not collide with each other or the selected-card/Preview focus group;
- Timeline remains legible but secondary during FOCUS/TARGETING;
- hand PEEK exposes the intended upper half and does not become a permanent bottom panel;
- selected card, target feedback, and confirm control form one readable focus hierarchy;
- no clipped essential control in compact landscape.

## Runtime health

The accepted run must have:

- no application Console error;
- no repeated resolution / duplicate action commit;
- no Scene teardown camera error;
- no missing required runtime texture;
- no stuck input after reward modal, action, Clash, victory, or retry transitions.

Autoplay-policy warnings before user input are not treated as application failures.

## Automated evidence harness

Phase 23 includes `tools/phase23_browser_qa.mjs` plus `.github/workflows/phase23-browser-qa.yml`.

The harness launches a production Vite preview in headless Chromium and runs both canonical viewport sizes. It physically clicks the route map, battle result CTA, family-upgrade reward choices, one card, one authoritative target, and the confirm CTA. It records PNG evidence plus JSON reports under `artifacts/phase23-browser-qa`.

The automated path checks:

- `depart → battle-1 → battle-2-upper → battle-3-upper → elite-1 → boss-1`;
- reward after battle-1 / battle-3 / elite and no reward after battle-2 / boss;
- exactly three upgrades before Boss and Area 01 clear after Boss victory;
- PEEK → FOCUS → TARGETING → action handoff / return on a legal player turn;
- all five player action presentation profiles plus enemy-light / enemy-heavy / boss-signature;
- deterministic player-win / draw / enemy-win Clash presentation cases;
- Boss `山影連刃` two-contact presentation, `驟雨橫掃` explicit living-target reactions, and boss-signature profile selection;
- immutable enemy formation slots after a forced death;
- application console/page errors as workflow failures.

The harness uses the inherited Phaser scene key `JourneyScene` for `DemoProgressionJourneyScene`, allows up to 30 seconds for battle-scene preload on CI, runs both viewports even if one fails, and writes `summary.json` before surfacing a combined failure. These behaviors keep runtime failures distinguishable from harness timing/key errors.

Automated screenshots support review but do not replace human judgment for motion feel, silhouette clarity, contact readability, and overlap quality. The asset-unlock decision must still distinguish deterministic semantic evidence from subjective visual acceptance.

## Workflow result bridge

Because the Browser-QA workflow runs from a branch push while the normal CI check is PR-triggered, Phase 23 requires one discoverable result bridge for review tooling:

- after every Browser-QA run, the workflow posts the GitHub Actions run id and run URL to the open pull request associated with the tested commit;
- when `summary.json` exists, the comment also reports the per-viewport automated pass/fail state;
- the comment step runs with `always()` so a failed browser test still exposes the run id needed to inspect job logs and uploaded screenshot artifacts;
- failure to produce a visual report must never be converted into a pass by the reporting step.

The bridge is observability only. It does not alter the browser assertions, gameplay, presentation, or the asset-unlock criteria.

## Current evidence / blocker

- Phase 22 CI run 515 passed build/test for both route branches, upgrade handoff, Boss entry, and viewport policy regression.
- The first Phase 23 Browser-QA run (`32592527157`) failed because the harness expected a non-existent Phaser scene key `DemoProgressionJourneyScene`; the subclass inherits `JourneyScene`. This was a harness defect, not a runtime failure.
- The second Browser-QA run (`32592809366`) passed the corrected journey-key check but exposed that a 12-second active-scene wait was too short for the CI route-transition plus battle preload; no page or console error was recorded.
- Commit `1663565b95a659e01babe3d1599324580ae92d2d` hardened scene waits to 30 seconds and guarantees per-viewport reports / `summary.json` on failure.
- Browser-QA run `32593020524` passed the complete automated route/progression + normal decision path at both `1280×720` and `844×390`; later route/decision reruns also remained green.
- Manual review of the automated PEEK / FOCUS / TARGETING / HIDDEN screenshots confirms the normal decision hierarchy is visible at both viewports, with FIT side bars expected on compact landscape and no obvious selected-card / enemy-overhead collision in the captured path.
- The harness was then extended to exercise all eight presentation profiles, deterministic Clash outcomes, Boss multi-hit/AoE, and dead-slot preservation. Browser-QA run `32593707854` reached that extended section but failed in the harness with `ReferenceError: dir is not defined` inside `forceEnemyPresentation`; build/preload and the earlier route/decision stages succeeded. The failure is test-harness plumbing, not evidence of a combat/runtime defect.
- Commit `72db61d971e38a8611602464a3647039568a4882` threads the viewport evidence directory into every `forceEnemyPresentation` call. Normal CI run 537 passed `npm ci`, `npm run build`, and `npm test` on this fix.
- A fresh Phase 23 Browser-QA run on the fixed harness is now the blocking automated evidence. After it passes, the remaining task is manual review of the generated profile/Clash/Boss/dead-slot screenshots for readability and overlap quality.
- Asset generation remains locked. No generated asset is produced by this phase.

## Asset unlock condition

Only after all required checks above pass may the next phase begin generated family-plate production.

The first asset phase is deliberately one-file-at-a-time:

1. Quick illustration plate only;
2. validate size/aspect/opacity/crop and runtime composite;
3. obtain review before Heavy / Guard / Disruption / Break;
4. generated output starts as candidate and is never auto-approved.

The governing plate specification remains `DEMO_ASSET_REQUIREMENTS_V1.md`: opaque full-bleed ~1.44:1 illustration plate, no card frame, card text, numbers, character identity, target icon, Delay badge, or HUD baked into the image.
