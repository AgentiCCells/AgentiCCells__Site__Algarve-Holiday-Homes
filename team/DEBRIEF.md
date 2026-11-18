# Debrief: the Algarve holiday homes cell

Written by conductor.algarve-holiday-homes@AgentiCCells.dinis on 2026-11-18, about 19:00 UTC, when Dinis stopped the work (through cells@AgentiCCells.dinis, about 18:55 UTC: the account is at 94 percent of its usage; agents move to another account).

## Live

- https://algarve-holiday-homes.agenticcells.site, v0.1.4 (ef9bff4), round 2: the made-up company Cinco Chaminés and five invented homes (Tavira, Faro, near Loulé, Lagos, Sagres) with labelled AI-generated pictures, simulated availability, a booking flow that keeps and sends nothing and ends "This is a demonstration: nothing was booked, nothing was sent, nothing was charged", a stay panel with IPMA's forecast, warnings, sea and UV and events-pt events read live with source, read time and terms, a scripted agent (simulation), 14 public cameras (link out only, also /data/cameras.json), five designs under /d/ (Revista, Azulejo, Linho, Costa, Postal), Use the data, Use with AI, behind the scenes generated from team/ and git log, a share card per page.
- Not live: round 3 (the modes), on branch `round-3` (180399f), reviewed "do not release yet" with three must-fix items (below).

## Rounds

| Round | What | Status |
|---|---|---|
| 1 | team, gates, research, design, the whole site in one design | released (7e419e6), reviewer's 5 must-fix items fixed first |
| 2 | AI-generated pictures (22 generations, USD 1.47), five designs, billboard removed, Dinis not named on public pages | released (ef9bff4, v0.1.4), 2 must-fix items fixed first |
| 3 | the simulation core and the modes: /admin/, /stay/, /play/, /world/, /agents/ | built and reviewed on branch `round-3`; not released |

Reports: `team/rounds/1.md`, `2.md`, `3.md`, with every role's notes, mock-ups, screenshots and reviews under `team/rounds/<n>/`.

## Dinis's widened brief (17:10 to 17:45 UTC), in short

His words are recorded in full, with times, in `team/rounds/2.md`. In short: the billboard is not for this site; event titles shown as PrompTugal.news publishes them; the name Cinco Chaminés and the six policies approved; Dinis not named on the public pages; AI-generated pictures of the houses through OpenRouter, some in funny places; five professional, distinct designs. Then (17:20 UTC) the site becomes an app with modes, all simulated, all state in the visitor's localStorage: the visitor, the admin (bookings, stock, rates, issues, profit and loss, a legality section mapped to Portuguese law with taxes), side by side in two iframes with a time slider, and a synthetic world of little users (like the storyboards.sgit.ai figures and the newsroom.sgit.ai synthetic-users method) playing it like a game, fast-forward, bad reviews, a big "this is a demo" sign, Agent Behaviour Policies working in the browser against prompt injections; after payment the site turns to the guest's stay (timeline, events, plan, getting there, weather); only dates with real data. (17:25 UTC) A fourth mode: management by Claude on both sides, simulated. (17:40 UTC) The five-round cap lifted. (17:45 UTC) Booking platforms named only by type of service.

## Decisions

- Real-data window: weather as IPMA issued it from the live files (today plus four days) and the two vault copies of 17 November; events 18 November to 31 December 2026. The IPMA vaults hold only two copies (17 November about 19:19 and 19:29 UTC); events-pt has no history. Asked of PrompTugal.news's data team through cells@.
- Policies: forms may keep input in the visitor's own browser for the simulation, never send it; AI pictures allowed when labelled (both at Dinis's word, recorded in the policies' records).
- "Claude (simulated)" used for the two assistants; event titles appear as published, also in the world and the agents' chats.

## Open

1. Round 3 must-fix (team/rounds/3/review/BUILD.md): M1 in /agents/ "Play the guest" typed injection text is forwarded to the host's assistant (agents-mode.js marks the visitor's text trusted; /stay/ refuses the same text); M2 a rate changed in /admin/ does not reach the visitor's cards and home page header, nor the site agent; M3 the switcher's "Guest's stay" item fails contrast. Plus should-fix S1 to S11 (one same-origin HEAD request, clock backwards keeps the future, DENY placement, events publisher link, floating agent button covering content, failure wording, focus ring on date inputs, an unbelievable 75 percent margin, world visitors mostly leaving for "dates taken", Reset leaving a session key).
2. Round 4 (planned): the reviewer's top five (a guided tour; a world that responds to the owner's rates; a believable P&L with editable assumptions; a run score; one place for the policy story in /admin/), the world's background occupancy and window, the legality section in full.
3. Round 5 (planned): five admin designs, a synthetic-user study of the site itself, full review.
4. For PrompTugal.news's data team (through Dinis): restart the vault writes and publish past events, which would widen the real-data window.
5. REALITY.md still describes the seed only; bring it up to date with the live site and the round-3 branch.
