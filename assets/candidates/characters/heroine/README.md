# Heroine candidate record

## `heroine-idle-master-candidate-v1.png`

- Status: identity／silhouette candidate only; not runtime-ready.
- Generation: built-in ImageGen, using `assets/candidates/concepts/heroine-style-costume-candidate-v1.png` as an identity and costume reference.
- Source size: 1024×1536.
- Pixel format verification: 24-bit RGB. The visible checkerboard is baked into the pixels; there is no alpha channel.
- Intended facing: player-side, facing left.
- Intended runtime height: 82–100 px in 4V4; 130–150 px in 1V1.
- Proposed pivot after cleanup: normalized `(0.50, 0.965)` at the shared foot baseline.
- Approved qualities for the next iteration: face, high ponytail, black／vermilion／ivory palette, short haori silhouette, single katana and restrained railway token.
- Required fixes before pose extension: true transparent alpha; separate the two feet slightly; reduce waist straps; shorten the scabbard or rotate it closer to the body; consolidate loose hair strands into a broader shape.
- Reference restrictions: `女主角sample.JPG` and the earlier black-haired warrior reference have unknown provenance. They provide only rendering and broad art-direction cues; do not copy identity, costume, UI, logo or composition.

## Pose production gate

Do not generate `ready / strike / recoil / broken / down` until a cleaned idle identity master passes:

1. true alpha inspection;
2. readable silhouette at 82 px and 100 px;
3. stable face, hair, costume and weapon landmarks;
4. shared canvas and foot baseline metadata;
5. browser composite proof against the World 1 battle background.

## `heroine-idle-master-candidate-v2.png`

- Status: transparent runtime-composite candidate; not release-approved final art.
- Generation: built-in ImageGen edit using v1 as the identity reference. Final built-in output was 1536×1024 24-bit RGB with another baked checkerboard, so it was not accepted directly.
- Cleanup: `tools/clean_character_candidate.py` removes only bright near-neutral pixels connected to the image edge, feathers the immediate neutral boundary and crops to alpha bounds. Result is 461×948 RGBA with corner alpha 0.
- Improvements over v1: separated feet, shorter ponytail and scabbard span, clearer hand-on-hilt idle, tighter silhouette for a four-character lineup.
- Runtime trial: copied non-destructively to `public/assets/battle/heroine-idle-candidate-v2.png` and used only for PA. PB–PD remain prototype placeholders so the trial cannot be mistaken for four approved characters.
- Remaining gate: browser composite at 82–100 px in 4V4 and 130–150 px in 1V1; inspect light-edge halo, ground pivot, facial readability and visual-style mismatch with the pixel placeholders before authoring other poses.

## `heroine-ready-master-candidate-v1.png`

- Status: transparent runtime-composite candidate; not release-approved final art.
- The first generated ready attempt was rejected because its lunge and horizontal blade occupied too much of the 4V4 field. The retained candidate uses a compact two-handed low guard.
- Cleanup result: 684×932 RGBA, corner alpha 0, generated from the approved idle identity and processed with the same cleanup script.
- Runtime trial: PA switches from idle to this ready pose only while she is the current planning focus. The pose does not add a new gameplay ability.
- Remaining concern: the blade extends the silhouette to about 0.73× body height. Browser proof must confirm it does not collide with neighboring player slots or obscure active causality lines.

## `heroine-strike-master-candidate-v1.png`

- Status: transparent runtime-composite candidate; not release-approved final art.
- A first strike output was rejected and not copied into the project because it added a black glow backdrop and an over-wide horizontal attack.
- Retained output uses a compact low diagonal follow-through on a flat white extraction background. Cleanup result: 846×1499 RGBA.
- Runtime role: swaps in immediately before the attacker's final approach/contact. Slash trail, speed and hit force remain runtime FX, not baked into the pose.

## `heroine-recoil-master-candidate-v1.png`

- Status: rejected after runtime review; never use as runtime input.
- Compact backward upper-body recoil with a sheathed weapon; no blood, damage overlay or falling direction variant. Cleanup result: 736×1569 RGBA.
- Rejection reason: conflicts with the adopted SaGa-style low-cost animation rule. Ordinary hit recoil must reuse the current pose with displacement, rotation, tint, hit-stop and FX; it does not justify another full character drawing.

The three adopted runtime pose textures are normalized by `HeroinePose` to the same per-formation display height. Source canvas size never controls perceived actor size.

## SD multi-pose production trial

- The first 3×2 SD pose sheet and its first edited revision are rejected as an idle source: the handle, guard and scabbard mouth did not share one mechanically continuous axis. This is a weapon-continuity failure, not a harmless perspective variation.
- Bulk pose sheets remain the preferred low-cost method because they improve identity, costume and proportion consistency across poses. Each cell must still pass an enlarged weapon／hand／foot continuity review before slicing or runtime adoption.
- The subsequent single-pose idle revision is also rejected: although the handle finally connects to the scabbard mouth, the tsuka is only long enough for one hand and contradicts the two-handed combat poses. The identity master must use a consistent 2.5–3 fist-width handle before adoption.
- A following overcorrection with a handle approaching half the scabbard length is rejected as a long-handle silhouette.
- `heroine-sd-idle-master-candidate-v2.png` is the current idle candidate: one continuous sheathed katana, a handle sized for two chibi hands, and the off hand at the scabbard mouth. Chroma cleanup produced 731×974 RGBA with transparent corners; it is not yet copied into runtime pending browser-scale proof and matching pose-sheet regeneration.
- Ordinary hit recoil still reuses the active drawing with runtime displacement, rotation, tint, hit-stop and FX. A six-cell sheet does not justify adopting every generated cell.
- The production minimum is now three drawings only: sheathed idle, drawn ready, and defeated/down. Attack, guard, clash, recoil and broken stance reuse idle/ready through runtime movement, rotation, squash, tint, hit-stop and separate FX layers.
- Multi-pose sheets may still be generated for identity consistency, but only required cells are extracted. Unused generated poses are not runtime assets.
- `heroine-sd-flat-pose-sheet-candidate-v1.png` and `sd-flat-v1/` are rejected style experiments. Removing every internal value change flattened the established detailed SD anime rendering into a simplified vector-like style.
- Correct rendering boundary: retain intrinsic cel shading, hair／cloth material definition and restrained non-emissive blade value separation. Exclude attack FX, particles, glow, bloom, rim-light effects, environmental color casts, scenery and ground／cast shadows from character source images.
- Current runtime trial uses exactly three detailed SD candidates: `heroine-sd-idle-master-candidate-v2.png`, `heroine-sd-ready-master-candidate-v1.png`, and `sd-three-pose-v1/down.png`. Strike reuses ready; all other reactions remain runtime transforms.
- The three-panel sheet proved unsuitable for long-weapon idle／ready extraction because the drawn blade crossed cell boundaries. Only its self-contained down cell was accepted. Long-weapon standing poses remain single-image outputs unless a future sheet reserves explicit weapon-safe gutters.
- Demo runtime assignment: the same three-pose SD set temporarily drives PA–PD so all allied animation hooks can be evaluated without the old pixel placeholders. This is a shared prototype actor set, not approval for four identical final characters. Enemy archetype art remains unchanged.
