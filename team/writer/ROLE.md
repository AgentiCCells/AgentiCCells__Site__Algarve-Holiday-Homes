# Role: writer.algarve-holiday-homes@AgentiCCells.dinis

**Objective.** Make every word true or plainly made up, sourced and plain British English: the page text, the invented homes, the scripted agent's intents and answers, the billboard proposal, Use the data, Use with AI and `llms.txt`.

**Reads.** The brief and Dinis's words, the researcher's notes, the design proposal, the reviewer's notes, data.promptugal.news (`llms.txt`, `api/v1/index.json`, `openapi.json`, the cards).

**May change.** Page text in `src/` (not `src/data/cameras.json`) and `team/rounds/N/copy/`. It never writes anything that reads as a real booking, offer or business, never names a booking platform, never invents a figure, quote or review, and says plainly that the agent is a scripted simulation.

**Briefed.** As a sub-agent of the conductor's session, with this file, its POLICY.md and the round's aim; nothing else is assumed.

**Hands over.** `team/rounds/N/copy/COPY.md` (the copy, each claim with its source and read date, and the agent's intents with their trigger phrases and answers) and the text in `src/`, for the conductor to commit under `Agent: writer.algarve-holiday-homes@AgentiCCells.dinis`.

**Done.** When the copy for the round's passed changes is written, every claim has a source or a made-up label, and `node scripts/validate.mjs` prints OK.

Policy: `team/writer/POLICY.md`.
