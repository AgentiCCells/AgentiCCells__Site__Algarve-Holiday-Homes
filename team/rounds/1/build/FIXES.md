# Round 1 fixes to the build review

Written by developer.algarve-holiday-homes@AgentiCCells.dinis, 18 November 2026, about 17:15 UTC, for the conductor. Fixes to `team/rounds/1/review/BUILD.md`. Files only: nothing committed, pushed or sent. Everything about Cinco Chaminés is a made-up example. The live answers quoted below came from data.promptugal.news as read at about 17:10 UTC (ipma-city-forecasts read_at 16:30 UTC, ipma-warnings 16:32 UTC, events-pt 16:30 UTC).

## What changed

| Item | Fix | Files |
|---|---|---|
| M1 | Every `pre` now scrolls inside its own box (`overflow-x:auto; max-width:100%`), not only under `.md`; inline `code` in text and tables may break anywhere. | `src/assets/site.css` |
| M2 | Each IPMA source line in the agent ends with "IPMA's terms: attribution to IPMA; no profit-making purpose (source card)", the short form from the card's `terms.republish`, with a fallback if the card cannot be read. Every live answer (forecast, warnings, sea, UV, events) gets the stale note in the text and "which is old: it may be out of date" on its source line when the file is stale; events have their own stale note ("check with the organiser"). The forecast-too-far answer now has a source line too. | `src/assets/js/agent.js`, `src/assets/js/agent-script.js` |
| M3 | Warnings use only the dates asked in the same question. With no dates: now and the days the file covers. Every warnings answer says what period the file covers (from today to the latest warning end in the file, or at least the read day plus two, since IPMA issues warnings up to three days ahead). No all-clear for days outside that period: "No warnings issued for ... yet ... so I cannot say either way." | `src/assets/js/agent.js` |
| M4 | (Drafts moved by the conductor.) `layout.mjs` generates both twins like other pages; the /live/ twin lists the 14 cameras from `src/data/cameras.json` at build time, in place of the "Reading the camera list" text; loading text in twins says the value is filled in live in the browser. `tests/twins.test.mjs` checks both twins exist, carry the made-up line and footer, are not drafts, and that /live/ lists every camera. | `scripts/layout.mjs`, `tests/twins.test.mjs` |
| M5 | Only the two dates are kept, in the address and sessionStorage. The guests count is never stored or put in the address; on the home page it lives in page memory; an old `?guests=` is dropped on load. Test updated. | `src/assets/js/data.js`, `home.js`, `house.js`, `tests/data.test.mjs` |
| S1 | New intents in the writer's file: `payments` ("There are no payments: this is a demonstration, and nothing is charged ..."), `confirmation` ("Nothing is sent ..."), `greeting-pt` (a short Portuguese greeting, then English), `beaches` (the nearest home and the three cameras nearest it). | `src/assets/js/agent-script.js` |
| S2 | A number of people filters by `sleeps` first for the choosing intents (families, couples, surfers, no car, compare) and when nothing else matched; availability for a home too small adds a note. | `src/assets/js/agent.js` |
| S3 | Multi-day events show "Fri 20 Nov to Sun 22 Nov". | `agent.js` |
| S4 | Events failure: "look at Câmara Municipal de Lagos's agenda directly; the events-pt source card lists every agenda we read" (town agenda addresses from the `source` fields of events-pt). | `agent.js`, `agent-script.js` |
| S5 | Sea answers use the dates asked in the same question: "tomorrow" gives one day. | `agent.js` |
| S6 | The "Status now" column is filled from `api/v1/index.json` (`status`, `read_at`, age, stale mark), with a note saying when the browser read it; on failure it says the catalogue could not be read and shows no status. | `src/assets/js/use-the-data.js` (new), `src/use-the-data/index.html` |
| S7 | llms.txt lists /homes/, each /homes/<id>/, /agent/ and /d/ with their twins (as well as /live/ and /billboard/). | `src/llms.txt` |
| S8 | `eventsFor` takes the card's spelling of the publisher's name ("Câmara Municipal de Lagos") when the data gives it without accents; used by the agent and the stay panel. | `src/assets/js/data.js` |
| S11 | Each camera shows its host and path in small text under its link. | `src/assets/js/live.js`, `src/assets/live.css` |
| S9 | Left as is, for Dinis. S10 was done by the conductor. | |

## Checks run (18 November 2026, about 17:10 to 17:15 UTC)

- `node scripts/build.mjs && node scripts/validate.mjs && node scripts/leak-scan.mjs`: OK, OK (171 files, 91 binary skipped). `node --test tests/*.test.mjs`: 14 tests, 13 pass, 1 skipped (the live test), 0 fail.
- `_site` served on port 8766, Playwright (Chromium).

### Horizontal overflow (M1)
All 33 built pages at 390 px, light and dark: `scrollWidth > clientWidth` on 0 of 66 loads; no console errors. The same at 1366 px: 0 of 66.

### The agent (M2, M3, S1 to S5), 1366 px
| Question | Intent | Result |
|---|---|---|
| How much is the Lagoon House for a week in January? then Any warnings for the Algarve? | price, warnings | Pass: lists the yellow rough-sea warning (Wed 18 Nov 13:15 to Fri 20 Nov 09:00) for now, not January; "The warnings file covers ... 18 to 20 November 2026 (IPMA issues warnings up to three days ahead)." |
| Any warnings for 1 to 8 January? | warnings | Pass: "No warnings issued for 1 to 8 January 2027 yet: IPMA issues them up to three days ahead, so I cannot say either way." |
| Any warnings this week? | warnings | Pass: the warning, then "For 21 to 22 November 2026 no warnings are issued yet, so I cannot say either way." |
| What will the weather be in Lagos on 20 and 21 November? | weather | Pass: source line ends "IPMA's terms: attribution to IPMA; no profit-making purpose (source card)." |
| What's on in Lagos this weekend? | events | Pass: "Fri 20 Nov to Sun 22 Nov" ranges; source "Câmara Municipal de Lagos" with the accent. |
| What is the sea like near Faro tomorrow? | sea | Pass: one day, Thu 19 Nov; terms on the source line. |
| Can I pay by card? | payments | Pass |
| Olá, bom dia | greeting-pt | Pass |
| praia perto de Tavira? | beaches | Pass: the Salt House, then the three nearest cameras (Alagoa, Praia Verde, Ilha da Culatra). |
| Which home is best for 6 people? | guests | Pass: only the Hill House (sleeps 6). |
| Can you send me a confirmation email? | confirmation | Pass |
| Is the Lagoon House free for 4 people from 1 to 5 December? | availability | Pass, with "Note: the Lagoon House sleeps 2, fewer than 4 (invented)." |

Stale test (every `read_at` in `latest.json` rewritten to 2026-11-15T08:00Z): forecast, warnings, sea, UV and both events answers (with and without events) open with the stale note and their source lines say "which is old: it may be out of date". Blocked test (data.promptugal.news aborted): events answer points to Câmara Municipal de Lagos's agenda and the events-pt card; no values shown. During the agent runs: GETs only, to localhost and data.promptugal.news; sessionStorage and localStorage empty.

### Guests not stored (M5), 390 and 1366 px
- Home page, 4 guests chosen: address `?from=2026-11-20&to=2026-11-25`, sessionStorage `cc-stay = {"from":"2026-11-20","to":"2026-11-25"}`; the Lagoon House card still says "Sleeps 2: too small for 4 (invented)" (page memory); home links carry only the dates.
- /homes/hill/?guests=3: the address loses `guests` on load. Booking walk with 3 adults to "This is a demonstration: nothing was booked, nothing was sent, nothing was charged.": address and sessionStorage hold only `from` and `to`; localStorage empty; no request other than GET.

### Other
- /use-the-data/ status column: "ok; read 16:30 UTC, 42 min ago" for each IPMA source and "partly failed; read 16:30 UTC, 42 min ago" for events-pt; with the network blocked: "could not read the catalogue" and a note saying so.
- /live/: 14 host-and-path lines (for example `beachcam.meo.pt/livecams/praia-da-alagoa/`).
- Stay panel on /homes/harbour/ for 21 to 23 November: 15 event lines say "Câmara", none "Camara".

## Open

1. The writer may want to reword the new intents (payments, confirmation, greeting-pt, beaches) and the new messages `missingEvents` and `staleEvents`; they follow the writer's tone and are marked in `agent-script.js`.
2. The stay panel's warnings block still gives "No warning ... for these dates" when the dates start inside the file's period and end after it (house.js, line about 355); the agent now splits the two parts. The same split could go into the stay panel next round.
3. The warnings coverage end is worked out as the latest warning end in the file, or the read day plus two days when that is later. The file does not state its period; this rests on IPMA issuing warnings up to three days ahead (the stay panel's existing wording).
4. S9 (personal names in event titles) is for Dinis; event titles are shown as the organisers publish them.
