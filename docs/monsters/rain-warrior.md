# 雨夜武者｜Rain Warrior Elite Monster Master

STATUS = MASTER_REFERENCE_RECEIVED_CANDIDATE

## References

- master reference: `assets/candidates/monsters/rainfall-ridgeline/rain-warrior/rain-warrior-master-reference.png`
- side-view reference: not generated yet; must be derived from this master, strict left/right side-view only
- area: `docs/areas/area-01-rainfall-ridgeline.md`
- role in journey: `elite-1` 精英節點主怪，混編一隻濡骸與一隻山犬同場
- source note: user-provided image, received 2026-08-18; provenance is project-local reference until release rights are confirmed

## Identity

- role: first-world elite; teaches disciplined clash under weather pressure — a fallen samurai roaming the ridgeline in a rainstorm
- visual read: rain-soaked leather-black armor with weathered lacquer, long single-edged blade, wet cloth banner or half-cloak
- scale: 1.15–1.25× ordinary player combat height；精英剪影**要一眼比普通怪大**，但仍不能吃掉戰場中央動線

## Palette

- armor: soaked deep indigo-black with cold slate highlights
- cloth (cloak / obi / cords): muted crimson or dark ochre, low saturation
- blade: dark tempered steel with a restrained pale edge line
- skin (if visible): pale storm-grey; eye accent single cold cyan-white point only
- water: light droplet reflections allowed on armor surface but **do not bake rain droplets or splashes into the sprite**

## Body / face / costume rules

- upright combat stance with weight forward; head lowered slightly under the storm
- kabuto / eboshi silhouette allowed but must not exceed body silhouette outline dominance; face covered by mempo or shadow
- shoulder guards asymmetric — 保留一邊寬肩甲＋一邊裸露包紮的對比，禁止水平翻轉
- torn banner or half-cloak flows behind — 是精英剪影的第二讀，不得省略；也不得替換為法術光暈
- 不加任何 glowing eye、鬼氣、燃燒 FX — 精英強度用姿態與比例表達，不用發光

## Weapon dimensions

- one long single-edged tachi / uchigatana — blade length ≈ 0.9–1.0× body height in master silhouette
- weapon in one hand（另一手空著或壓刀鞘），禁止改成雙刀、槍、薙刀
- 刀鞘可留在腰間也可不留，但不可換成非武士系配件

## Silhouette and facing

- strict 2D side-view, facing toward the battlefield center
- 不對稱設計 → **禁止 horizontal flip**；PA/PB/PC/PD 面對它時只能靠 runtime 座標決定觀感
- no 8-direction, 3/4 or frontal combat sprite
- pivot at the feet；不得烘焙地面、水漥、雨線、投影、UI 或殺生線

## Allowed variations

- idle, ready, attack, hit, break and down through runtime transforms / FX first
- cloak sway, blade tilt, rain reflection tint（透過 runtime 微 alpha 或 tint）
- attack pose 可前傾出刀但保留 kabuto silhouette 與披風流線
- 精英 HUD 可比普通怪多一格架勢／HP，但美術端不改圖，只由 gameplay 資料表決定

## Forbidden variations

- 露臉 anime 面容、閃亮乾淨的舞台盔甲、巨大化身（>1.4× 玩家高）
- 血、雨、法陣、鬼火烘進母版
- 換成 katana 以外的武器、雙刀、槍、劍靈化
- 移除披風／烘進靜態披風背景

## Approval gate

This master is awaiting Art Director approval. Do not generate the next elite derivative（例如破招／崩勢／死亡分格）until the user approves or rejects this reference and its derived side-view candidate.
