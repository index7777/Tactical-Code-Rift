# Steam Demo Visual Polish — P1 Completion

## Goal
Finish the battle presentation pass without changing combat rules. P1 is complete when the player can read the following visually without relying on result text:

1. hostile intent is active and dangerous;
2. a clash has locked at a specific point;
3. `破招`, `相殺`, and `崩勢` feel materially different;
4. PB 千景 and PC 朧 no longer share the same generic attack motion language.

## Implemented in this patch

### Killing-line / clash polish
- Keeps the animated killing-intent flow and clash lock introduced earlier.
- `ClashPresenter.focusCamera()` now formally accepts a fourth `duration` argument.
  - Existing 2–3 argument calls preserve the 190 ms default.
  - Tie clash can call `focusCamera(..., 160)` without TypeScript build failure.
- Tie clash remains a lock-blade beat with slow motion, micro vibration and separation impact.
- Break follow-through keeps weapon stagger, hit-stop, screen flash and stronger camera impact.
- Collapse / 崩勢 keeps its dedicated camera pull-in and intent-cancel presentation.

### 千景 — long-weapon technique language
PB now reads as a naginata user instead of a generic sword sprite:
- longer pre-contact spacing so the polearm does not visually enter the target body;
- visible reach line during anticipation;
- slightly longer wind-up than normal attacks;
- wide crescent sweep at impact;
- gold / muted-violet technique palette;
- character-specific accent also appears when PB wins a clash.

### 朧 — speed / cross-cut technique language
PC now reads as a high-speed ninja instead of a generic sword sprite:
- shorter anticipation and much faster dash;
- three-step afterimage language;
- short linear speed streak before entry;
- crossed impact cuts at contact;
- violet / white technique palette;
- character-specific accent also appears during clashes.

### Hit-stop correction
`ActionPresenter` now uses real-time waiting while scene timeScale is reduced. This avoids accidentally stretching a nominal 110 ms hit-stop into a much longer perceived pause.

## P1 runtime acceptance
Review at the actual 1280×720 battle canvas, four-player / four-enemy setup.

- PB and PC must be distinguishable during attack even when their sprites are viewed around ~100–110 px tall.
- PB must not visually overlap the target with the naginata shaft/body at normal contact.
- PC afterimages must disappear before the actor returns to standby.
- Skill FX must not obscure HP / 護符 / 架勢 bars.
- Killing lines remain more visually important than background detail.
- `破招`, `相殺`, `崩勢` must not use the same timing cadence.
- No gameplay values, card rules, initiative calculations, targeting rules, relay rules, or battle outcomes are changed by P1.

## Next visual pass after P1
P2 should focus on route/battle transition, boss entrance, victory return-to-route, sound mix, and final Steam screenshot composition rather than adding more combat rules.
