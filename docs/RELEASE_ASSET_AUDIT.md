# Release Asset Audit

STATUS = AUTHORITATIVE_RELEASE_GATE

| Asset family | Runtime status | Release status | Required action |
|---|---|---|---|
| Rin, Chikage, Oboro source/runtime | Prototype integrated | BLOCKED: user-provided provenance/license pending | Record owner, source, derivative rights and distribution permission |
| Mo/Redleaf source/runtime | Prototype integrated | BLOCKED: user-provided provenance/license pending | Record owner and commercial redistribution rights |
| Area 01 route-map UI packages | Runtime trial | BLOCKED: generated-sheet provenance and final approval pending | Preserve generator/source terms and Art Director decision |
| Area 01 route/battle backgrounds | Candidate/runtime trial | BLOCKED: native 4K master and final approval pending | Replace sub-2K trial and approve composite |
| World 01 music | Prototype integrated | BLOCKED: ownership/distribution rights pending | Attach license or written authorization |
| CC0 battle samples | Prototype | PASS with retained source records | Keep audit links and hashes |
| Rain Boss | Approved v2 master integrated | BLOCKED: 1254px source below 2K target; runtime composite and release provenance gates remain | Capture 1280×720／844×390 Boss QA, retain approval/provenance, re-author native 2K only if required for release |
| Neutral card frame | Runtime trial | BLOCKED: provenance and final composite approval pending | Keep the authored frame anatomy and verify text placement at target viewports |
| Five card-family visuals | Rejected production specification | BLOCKED: square transparent cutouts cannot fill the authored illustration window | Replace with five 1.44:1 fully opaque full-bleed plates defined by `DEMO_ASSET_REQUIREMENTS_V1.md`; do not promote current files |

Nothing marked `BLOCKED` may be described as release-cleared merely because it exists under `public/`.
