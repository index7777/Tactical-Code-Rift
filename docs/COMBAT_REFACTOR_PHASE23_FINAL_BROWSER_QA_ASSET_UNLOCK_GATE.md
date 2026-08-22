# Combat Refactor Phase 23 — Final Browser QA / Asset Unlock Gate

STATUS = AUTOMATED_RUNTIME_EVIDENCE_HARNESS_ADDED_REVIEW_PENDING
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

Phase 23 now includes `tools/phase23_browser_qa.mjs` plus `.github/workflows/phase23-browser-qa.yml`.

The harness launches a production Vite preview in headless Chromium and runs both canonical viewport sizes. It physically clicks the route map, battle result CTA, family-upgrade reward choices, one card, one authoritative target, and the confirm CTA. It records PNG evidence plus JSON reports under `artifacts/phase23-browser-qa`.

The automated path checks:

- `depart → battle-1 → battle-2-upper → battle-3-upper → elite-1 → boss-1`;
- reward after battle-1 / battle-3 / elite and no reward after battle-2 / boss;
- exactly three upgrades before Boss and Area 01 clear after Boss victory;
- PEEK → FOCUS → TARGETING → action handoff / return on a legal player turn;
- application console/page errors as workflow failures.

This harness does not replace manual visual judgment for rhythm, silhouette clarity, camera feel, Clash outcome readability, Boss multi-hit/AoE readability, or overlap quality. Those remain the final asset-unlock review.

## Workflow result bridge

Because the Browser-QA workflow runs from a branch push while the normal CI check is PR-triggered, Phase 23 requires one discoverable result bridge for review tooling:

- after every Browser-QA run, the workflow posts the GitHub Actions run id and run URL to the open pull request associated with the tested commit;
- when `summary.json` exists, the comment also reports the per-viewport automated pass/fail state;
- the comment step runs with `always()` so a failed browser test still exposes the run id needed to inspect job logs and uploaded screenshot artifacts;
- failure to produce a visual report must never be converted into a pass by the reporting step.

The bridge is observability only. It does not alter the browser assertions, gameplay, presentation, or the asset-unlock criteria.

## Asset unlock condition

Only after all required checks above pass may the next phase begin generated family-plate production.

The first asset phase is deliberately one-file-at-a-time:

1. Quick illustration plate only;
2. validate size/aspect/opacity/crop and runtime composite;
3. obtain review before Heavy / Guard / Disruption / Break;
4. generated output starts as candidate and is never auto-approved.

The governing plate specification remains `DEMO_ASSET_REQUIREMENTS_V1.md`: opaque full-bleed ~1.44:1 illustration plate, no card frame, card text, numbers, character identity, target icon, Delay badge, or HUD baked into the image.

## Current evidence / blocker

- Phase 22 CI run 515 passed build/test for both route branches, upgrade handoff, Boss entry, and viewport policy regression.
- Phase 23 browser-QA harness commits compile under the normal CI path; CI run 528 passed `npm ci`, `npm run build`, and `npm test` on the workflow/harness head.
- Browser-QA screenshot artifacts still require workflow-result inspection and visual review before this gate can be marked passed.
- No generated asset is produced by this phase.
