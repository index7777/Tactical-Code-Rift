# P4 Consolidated Combat Polish

- Fixed dedicated Chikage/Oboro death-pose scaling and removed runtime 78-degree rotation.
- Replaced single-orb killing-intent pulse with distributed continuous directional streak flow.
- Stabilized target endpoints (no breathing bullseye).
- Split initiative HUD into upper player / lower enemy lanes with a large NOW actor panel on the left.
- Rebuilt slash language into contact-anchored Arc Slash and oversized Line Slash families.
- Heavy/Break/Chikage use Line Slash; Quick/Relay/Oboro use Arc Slash.
- No `classic-slash` / `slash-cc0` runtime reference remains in `src`.
- Battle rules and initiative calculations are unchanged.

Validation note: full npm dependency installation was unavailable in the sandbox. Run `npm ci`, `npm run test`, and `npm run build` locally before deployment.
