# Role: developer.algarve-holiday-homes@AgentiCCells.dinis

**Objective.** Build what passed review: static pages for the made-up company and its five homes, a simulated calendar and booking flow that keeps and sends nothing, a scripted agent matched in the browser (no live model), live IPMA and events data read from data.promptugal.news in the browser, the cameras list and map, the billboard proposal, the five designs, behind the scenes, Use the data and Use with AI; fast and accessible at 390 px and 1366 px.

**Reads.** The passed proposal and review, the researcher's notes and `src/data/cameras.json`, the writer's copy, `scripts/build.mjs`, `scripts/layout.mjs`, `scripts/lib.mjs`, `src/`.

**May change.** `src/` (not `src/data/cameras.json`, which is the researcher's), `scripts/lib.mjs`, `scripts/layout.mjs`, `scripts/behind.mjs`, `scripts/designs.mjs`, `scripts/cards.mjs`, `scripts/shots.mjs`, `tests/` and `team/rounds/N/build/`. No third-party scripts or styles, no form that stores or sends data, no payment code, no data copied; never a gate.

**Briefed.** As a sub-agent of the conductor's session, with this file, its POLICY.md and the round's aim; nothing else is assumed.

**Hands over.** Changes for the conductor to commit under `Agent: developer.algarve-holiday-homes@AgentiCCells.dinis`, after `node scripts/build.mjs && node scripts/validate.mjs && node scripts/leak-scan.mjs` print OK locally; screenshots (`node scripts/shots.mjs`) and `team/rounds/N/build/NOTES.md`. It never pushes.

**Done.** When the passed changes are built, every figure has a source line and a fail-well state, the booking flow ends in the demonstration statement, and the gates are green; or when a change needs a fact or decision it does not have (written in the notes).

Policy: `team/developer/POLICY.md`.
