# Shared Deck — Card Asset Production Plan

This plan follows the cards currently defined in `src/core/cards/BattleCards.ts`.

## Global rule
The deck is shared by the whole party, therefore **card art must not depict one specific heroine as the owner of a card**. Card identity should come from weapon motion, ink shapes, talisman geometry, impact language and color. Character identity is added at runtime through character-specific pose / movement / technique accents.

## Deliverable tiers per card
Each card should eventually have four reusable asset layers:

1. **Card face illustration** — 1024×1536 master, vertical, no character portrait.
2. **Runtime card crop** — 320×480 PNG/WebP derived from the master.
3. **Combat FX sheet** — transparent 512×512 or 1024×512 sprite sheet depending on motion.
4. **SFX family** — one primary cue plus optional impact/release layer.

All FX must work when horizontally flipped; no baked UI text; no baked red killing lines.

---

## 快斬 / `quick`
Current rule: 威力 5 / 時序 +3 / 傷害 10 / 架勢 1.

**Visual fantasy**: immediate draw-cut, speed before weight.

Assets:
- `card-quick-master.png`: two intersecting pale-cyan ink cuts on dark paper.
- `fx-quick-cut-sheet.png`: 6–8 frames; thin crescent + secondary echo cut.
- `fx-speed-afterimage.png`: reusable transparent speed streak.
- `sfx-quick-swish-a.wav`, `sfx-quick-hit-a.wav`.

Runtime notes:
- shortest anticipation;
- do not use a large screen flash;
- PB converts it into a long sweeping polearm cut; PC converts it into a cross-cut with afterimages.

## 重斬 / `heavy`
Current rule: 威力 8 / 時序 −3 / 傷害 16 / 架勢 2.

**Visual fantasy**: commitment, delayed weight, decisive finish.

Assets:
- `card-heavy-master.png`: one thick descending black-red blade stroke with fractured paper edge.
- `fx-heavy-charge-sheet.png`: 5–6 frame anticipation pulse.
- `fx-heavy-cut-sheet.png`: 8–10 frame large blade arc.
- `fx-heavy-ground-shock.png`: short horizontal contact shock.
- `sfx-heavy-swish.wav`, `sfx-heavy-impact.wav`, optional low-frequency tail.

Runtime notes:
- longer anticipation than every other attack card;
- strongest hit-stop except 崩勢;
- wide but brief screen flash.

## 破甲 / `break`
Current rule: 威力 6 / 時序 0 / 傷害 9 / 架勢 3.

**Visual fantasy**: crack the opponent's structure rather than maximize HP damage.

Assets:
- `card-break-master.png`: broken lacquer / armor plate motif, ochre-gold fracture.
- `fx-break-fracture-sheet.png`: 8 frames; wedge strike followed by 5–7 rigid shards.
- `fx-balance-crack.png`: small reusable crack/sigil near target's stance bar.
- `sfx-break-hit.wav`: dry metal/wood split rather than a huge sword boom.

Runtime notes:
- impact should emphasize structural fragments;
- avoid making it visually stronger than 重斬 in raw damage terms.

## 堅守 / `guard`
Current rule: 威力 0 / 時序 0 / 自身護符 12.

**Visual fantasy**: hold position and establish a defensive seal.

Assets:
- `card-guard-master.png`: closed ward / knot / defensive paper-seal geometry.
- `fx-guard-seal-sheet.png`: 6 frames; oval ward forms inward, then stabilizes.
- `fx-shield-hit-sheet.png`: reusable contact ripple for later shield damage.
- `sfx-guard-cast.wav`, `sfx-shield-contact.wav`.

Runtime notes:
- no dash;
- effect stays close to the actor silhouette;
- should not look like healing.

## 掩護 / `cover`
Current rule: 威力 5 / 時序 +2 / 截刀 + 護符 9.

**Visual fantasy**: cut into an existing hostile intent before it reaches the protected ally.

Assets:
- `card-cover-master.png`: two converging paths with one pale intervention stroke.
- `fx-cover-entry-sheet.png`: short cyan-white interception wedge / arc.
- `fx-cover-lock.png`: compact clash marker at the interception point.
- `sfx-cover-entry.wav`.

Runtime notes:
- FX must never resemble a new red killing line;
- route to the interception point should be cyan/white and disappear at contact;
- the hostile line remains the enemy's visual language.

## 接力 / `relay`
Current rule: 威力 4 / 時序 +2 / 傷害 7 / 命中後補刀.

**Visual fantasy**: one attacker creates the opening and another passes through the same attack lane.

Assets:
- `card-relay-master.png`: two brush strokes crossing in sequence, not simultaneously.
- `fx-relay-handoff-sheet.png`: 6 frames; small gold transfer streak between outgoing/incoming actor.
- `fx-relay-finish-sheet.png`: compact follow-up crescent.
- `sfx-relay-pass.wav`, `sfx-relay-hit.wav`.

Runtime notes:
- visual priority is **handoff timing**, not a giant effect;
- first attacker must visibly vacate the contact lane as the second enters.

## 整備 / `cycle`
Current project rule: 威力 0 / 時序 −1 / 自身架勢 +3 / 清除破綻.

**Visual fantasy**: recover composure and reset fighting posture.

Assets:
- `card-cycle-master.png`: circular knot / re-tied cord / repaired seal motif.
- `fx-cycle-reset-sheet.png`: 8 frames; muted green-teal ring closes inward then releases.
- `fx-exposed-cleanse.png`: tiny broken red mark dissolves from actor.
- `sfx-cycle-reset.wav`.

Runtime notes:
- no card-draw imagery; this is no longer the rejected discard-two/draw-two version.
- should visually read as stance recovery, not HP healing.

## 牽制 / `delay`
Current rule: 威力 4 / 時序 +2 / 傷害 5 / 架勢 1 / 目標時序 −2.

**Visual fantasy**: a light attack that interrupts the opponent's rhythm.

Assets:
- `card-delay-master.png`: clipped circular timing seal crossed by a thin blade line.
- `fx-delay-bind-sheet.png`: 6–8 frames; blue-gray compression ring around the target.
- `fx-timeline-delay-tick.png`: tiny HUD-compatible reverse tick / notch used on timeline.
- `sfx-delay-hit.wav`, `sfx-delay-tick.wav`.

Runtime notes:
- impact is deliberately smaller than 快斬 / 破甲;
- the important payoff is the timeline response, so reserve a clear HUD cue.

---

# Character-specific source assets

The shared card FX above should be combined with a very small character pose set.

## PA / default swordswoman
- `idle`
- `ready`
- `strike`
- `hit`
- `down`

## PB 千景 / naginata
Required next source-art upgrade:
- `idle`
- `ready-low`: weapon extended horizontally, obvious long-reach silhouette.
- `sweep`: hips/shoulders rotated, blade tracing a wide arc.
- `thrust-break`: forward point for 破甲 / 牽制 variation.
- `hit`
- `down`

Important: create poses as **side-view combat assets**, not character-sheet three-quarter illustrations.

## PC 朧 / ninja
Required next source-art upgrade:
- `idle`
- `ready-crouch`
- `dash-cut`: body leaning strongly into horizontal movement.
- `cross-cut`: secondary hand/weapon prepared for second cut.
- `hit`
- `down`

Important: the body lean is more important than adding clothing detail. Runtime afterimages are generated by code and should not be baked into the PNG.

# Production priority

P0 — needed before Steam combat trailer capture:
1. PB `sweep` and PC `dash-cut` source poses.
2. Heavy, Break and Quick combat FX sheets.
3. Relay handoff FX.
4. SFX differentiation for quick/heavy/break/clash.

P1 — improves readability:
5. Cover intercept FX.
6. Delay timeline tick.
7. Guard and Cycle support effects.

P2 — storefront polish:
8. final card-face illustrations for all eight cards;
9. alternate FX variants / crit-like embellishments only after baseline consistency is approved.
