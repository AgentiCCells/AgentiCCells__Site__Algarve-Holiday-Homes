# Round 4 build notes

Written by developer.algarve-holiday-homes@AgentiCCells.dinis, a sub-agent of the conductor, on 19 November 2026 (session clock). Brief: build every numbered change in team/rounds/4/design/PROPOSAL.md (passed for build) and the two items of team/rounds/4/review/PROPOSAL-RECHECK.md. No commit, no push, nobody contacted. board/HOLD.md: absent.

Everything here is a made-up example: an invented business, invented homes and people, a simulation in the visitor's browser. Every figure below is measured in the session (Node 22, the built site in Playwright's Chromium), or taken from the proposal, as marked.

## Changes

| # | What changed | Files |
|---|---|---|
| 1 | **Guided tour.** "Show me how it works (90 seconds)" under the plan form on `/` (a link to `/play/?tour=1`) and at the end of the /play/ time bar. Start dialog with the conductor's sentence when the visitor has a booking, the backup-failure variant and the "no free dates" variant. Saves the simulation to `cc.tour.backup.v1`, stops the clock, unticks synthetic visitors, resets with seed `tour` at the chosen start. Dates from the clock's weather runs (1.3), with the events-window fallback. Ten steps with run-time dates, times and amounts read from the events and the ledger; ring and dimming, card beside the ring, bottom sheet under 700 px; keys only on the card (Enter or Right arrow for Next, Space to pause), Escape anywhere to the end dialog; auto-advance every 8.5 s without moving focus, paused while focus or the pointer is in the card; reduced motion: no auto-advance, no progress line. End dialog: put back (default) or keep; the "tour was stopped" bar on every mode page. The tour's booking is `by: 'tour'`, its guest `tour: true`, never `typedHere`; it shows as "The tour's booking" in the admin and "The tour's stay at ..." on /stay/. | `src/assets/js/play/tour.js` (new), `play/play.js`, `src/play/index.html`, `src/index.html`, `assets/play.css`, `modes/chrome.js`, `stay/sim-page.js`, `stay/stay.js`, `house.js`, `admin/util.js`, `admin/ops.js`, `admin/biz.js`, `sim/booking.js` |
| 2 | **A world that answers the owner.** /world/ "Your rates" panel (first tab at 390 px): per home -10% / +10%, a number field, minimum nights, "set by you" or "set by Helena (synthetic owner)"; changes go through the guard as the owner (O4) with `by: 'you'` and `rate.manual`. The tick box "Let Helena (synthetic owner) keep moving ...". `sim/demand.js` holds ELASTICITY 1.2, LIST_BOOK 0.85, STRETCH_KEEP 0.6, used by `visit()` (price draw, minimum-stay draw) and the admin what-if. The shadow world (`sim/shadow.js`) forks on the first change and the "What happened, and what if" table shows the seven measures, with the definitions and "Compare from now"; on /play/ a strip under the time bar when synthetic visitors book, with the should-8 sentence. One level of bookings from elsewhere: `state.settings.backgroundKeep` through `nightTakenBy`; the world picks low, medium or high from the seed and offers a select; the agent asks the simulation (`sim/price.js simAvailability`); the line "Bookings from elsewhere: medium (set in World). Reset sets it back." on /play/, the home pages, the five designs and the admin Calendar. The closing window: a visitor whose stay cannot fit is not sent, and the findings say from when. | `sim/demand.js`, `sim/shadow.js`, `sim/score.js` (new), `availability.js`, `sim/booking.js`, `sim/personas.js`, `sim/store.js`, `sim/price.js`, `agent.js`, `world/world.js`, `src/world/index.html`, `assets/world.css`, `admin/biz.js`, `admin/admin.js`, `home.js`, `house.js`, `play/play.js`, the five `src/d/*/kit.js` |
| 3 | **P&L with assumptions.** `sim/assumptions.js`: the decided defaults (reserve 1.0%, building share 75%, mortgage interest 3.2%, management 20%, AIMI 0 as an optional row), each with its ASSUMPTION or INVENTED badge and a "source" note (source by type, date read, how sure, from PNL-DEFAULTS.md); kept in `cc.assumptions.v1`; "I run it myself (0 percent)"; the six round 3 costs edited in the same list through `setting.set`. New P&L rows, gross and net yield tiles ("Simulated, not financial advice."), "Net yield on ... (your value)" per home, the documented-expenses default from spending only. History tourist tax per invented guests (Lagoon 2, Salt 3, Harbour 3, Cape 3, Hill 4). | `sim/assumptions.js` (new), `admin/history.js`, `admin/biz.js`, `admin/admin.js`, `assets/admin.css` |
| 4 | **Run score.** Out of 100 with its four parts, the formula beside it (open at 1366, closed at 390), "so far, day N of M" or "final", the stats line, best runs (at most 10, `cc.world.scores.v1`) with seed, level, rates, costs ("default costs" or "your costs", "other costs: not directly comparable"), "Play this seed again", "Try to beat it: New seed"; export adds the parts and the fingerprint. | `sim/score.js`, `world/world.js`, `src/world/index.html` |
| 5 | **Today policy panel.** "What the agents were stopped from doing today" first in the right column, Today / Last 7 days / This run, the summary sentence, grouped refusals with source words, UNTRUSTED TEXT, whose text (the tour, your text, example activity, an invented guest), the rule's words, links to `#messages/<id>`, `#reviews/<id>`, `#issues/<id>` (scroll and outline), empty and trimmed-log states, the eighth KPI tile "Refused today". `ref` on provenance and `by` on decisions; quotes set as text. | `admin/ops.js`, `admin/util.js`, `admin/admin.js`, `sim/abp.js`, `sim/personas.js`, `stay/sim-page.js`, `agents-mode/agents-mode.js`, `assets/admin.css` |
| 6 | **Legality in full.** `src/data/legal-pt.json`: the 35 rows (14, 4, 10, 7) in the research's own words, built from LEGAL-PT.md by `tests/legal-md.mjs`, the 2.3 table with its nine fields and `checkedNote: "section date"`, "as above" kept, the four formulas, the gaps and the sources. "The rules, row by row": four tables, the how-sure chips (light and dark pairs of section 10), the filter, cards at 390 px, "Not modelled. No source read." for "A company", "How the simulation calculates" with "These formulas are a demonstration. Not legal or tax advice.", the failure line. "Not legal or tax advice" stays at the top and the bottom. | `src/data/legal-pt.json` (new), `tests/legal-md.mjs` (new), `admin/biz.js`, `admin/admin.js`, `sim/legal.js` |
| 7 | **N1**: the five designs price with `rateOf(h)` (the simulation's base, else the file's), add "(the rate set in this browser's simulation)" when it differs, repaint on `storage`, and read the level. **S2**: `doc.clock.playedTo` (latest `at` for a round 3 document); the world plays only hours after it; booking, hold, pay, change, rate and minimum-stay changes are refused before it with one note and "Go there" (home booking step, admin Rates and Bookings, /world/ Your rates, /agents/ through the booking API); the clock pill and /play/ say "(earlier than played, ...)"; the back-in-time note for 6 s on /play/ and /world/ and in the ticker; the ticker header says "newest first, in the order things were done". **S4**: "No municipal tourist tax found on 18 November 2026; check with the câmara."; per-municipality how sure in the checklist and the tax table ("medium (none found)"); "* November up to 23 November only (the simulated today)." | `src/d/*/kit.js` and the five design scripts, `sim/store.js`, `sim/clock.js`, `sim/booking.js`, `sim/personas.js`, `house.js`, `admin/admin.js`, `world/world.js`, `play/play.js`, `modes/chrome.js`, `sim/legal.js`, `admin/biz.js` |
| 0.3 | **Reset** dialog in words, as the proposal; Reset clears `cc.sim.v1` (new first day, every setting default, so the level is 1 again), `cc.stay.v1`, `cc.assumptions.v1`, `cc.world.scores.v1`, `cc.tour.backup.v1` and sessionStorage `cc-stay`. | `modes/chrome.js`, `assets/modes.css` |
| R1 | **Re-check item 1.** No source URL whose host or path names a booking platform: the commission row's note names its sources by type, date read and how sure, with no URL; the P&L notes carry no commercial URL at all. | `sim/assumptions.js` |
| R2 | **Re-check item 2.** The costs fingerprint hashes the assumptions document with the six `state.settings` costs (cleaning, laundry, utilities, insurance, platform commission, IRS rate). | `sim/assumptions.js` |

## Tests

New: `tests/round4.test.mjs`, 20 tests (and `tests/legal-md.mjs`, the parser it shares with the data file):

- 1.7: the date choice with two stubbed windows (17 to 21 November gives 18 November, 3 nights; 26 to 30 November gives 26 November, 3 nights, Lagoon free on each) and with none (the events window, `forecast: false`), plus null when Lagoon is taken throughout; the step actions on a memory store (by `tour`, no `typedHere`, V4 V5 V6, check-in at 16:00, check-out 10:00, cleaned 11:30, linen and towels down, net of VAT from the ledger, the two DENY N-untrusted-instruction entries, "the tour", nothing counted as the visitor's).
- 2.4: keep 1 equals round 3, 0 gives none, 0.45 gives 19% of nights (measured; target about 20%); the agent and the calendar agree on every night for all five homes at 0.45 and at 1; the closing window.
- 2.1, 2.2, 2.3: the demand values (0.85, 0.68, 0.95 cap; 60, 36, 22), the what-if's factors, the owner skipping manual homes and `ownerAuto` off; a shadow with unchanged rates equals the real world over six days.
- 3.4 with the recomputed values, EUR 50 a home: Salt 2,831, Lagoon 547, Hill 3,387, Harbour 3,349, Cape 3,487, all 13,601 (measured 13,601), 13.1%, net yield 0.85%; "I run it myself" 34,435 (33%); documented expenses 50,680 (measured 50,679), no reserve or depreciation, no shortfall.
- 3.1, 3.2 formulas, both switches at once, a house value of 0, blocked storage; 3.5: Lagoon EUR 4.00 a night sold in July, EUR 2.00 in November, Hill within EUR 0.50 of EUR 8.00.
- 4: the score's corners; the fingerprint (default equals default, one changed assumption differs, each of the six settings differs, a non-cost setting does not); best runs keep 10, highest first.
- 5: a held visitor message gives "your text", a working `#messages/<id>` link and its landing `data-item`; `<img src=x onerror=...>` is shown as text; the tour's message gives "the tour"; example activity; an invented guest; the empty state.
- 6.4 and 6.2: the file equals the parsed research, 35 rows by section, the 2.3 fields, Tavira's blanks, "as above"; the page's advice lines, filter, tables, failure line, S4 words.
- N1, S2 (back then forward adds no events; refused with the note, no booking, not logged; works at playedTo; round 3 documents), Reset, and the brand grep over the sources and the built site.

Changed: `tests/sim-money.test.mjs`, two assertions now expect the S4 sentence exactly ("No municipal tourist tax found on 18 November 2026; check with the câmara.") instead of the old "none found as of 2026-11-18" the proposal replaces.

## How it was checked

- `node scripts/build.mjs`: built `_site/` (dev).
- `node scripts/validate.mjs`: OK.
- `node scripts/leak-scan.mjs`: OK (403 files, 492 binary skipped).
- `node scripts/abp-check.mjs`: OK (6 policies).
- `node --test tests/*.test.mjs`: 82 tests, 81 pass, 1 skipped (the live test), 0 fail.
- The brief's grep of `_site/` for the four booking-platform brand names (URLs included): nothing found.
- Playwright (pre-installed, `chromium.launch()` with no options; `_site` served on localhost; scripts in the session scratchpad, not committed), at 390 and 1366 px:
  - Every mode page, the five designs, /agent/ and /agents/: no console or page errors, only GET requests, no horizontal page scroll.
  - The tour from `/play/?tour=1`, all ten steps: the ring found each target; dates 18 to 21 November (the window started 17 November), EUR 262 plus EUR 6 tourist tax, check-in 16:00, check-out 10:00, cleaned 11:30, EUR 247.17 net of VAT, the two refusals in the Today panel marked "the tour"; put back: the backup key gone.
  - A second run with a visitor booking first: the start dialog's bold sentence; auto-advance moved the step and left focus where it was; Escape at step 5 opened the end dialog; "Keep" left "The tour's booking" in Bookings; reduced motion: "Press Next when you are ready" and no automatic step; the stopped-tour bar on /world/ put the copy back and went away.
  - /world/: seed `cc-4242` (level low, chosen by the seed), Lagoon +10%, Very fast: 43 days in 2.5 s with the shadow (round 3 measured 41 days in 2.1 s without one); score 89 of 100 with its parts and formula; best runs row; the comparison table; Back one day gave the note and "(earlier than played, ...)"; the admin's "Apply as the owner" then refused with the note and "Go there".
  - /admin/: the Today panel (all three ranges, a link landing outlined), Money (the panel, "I run it myself", a house value kept in `cc.assumptions.v1`, a source note, the yield tiles), Legality (the filter: 4 low rows as table rows at 1366 and as cards at 390), Calendar's level line; /play/ strip after a rate change in the admin frame; Reset's words and the three new keys gone.

## Not done, or done differently

- **Step 5 card.** The proposal's words say "a welcome pack leaves the stock" at check-in; in the simulation the welcome pack and the rest are taken from stock at check-out (`consumptionFor`), so the card says "the guests checked in at [16:00]. What they use leaves the stock when they check out (step 7)." and step 7 lists what went down. The writer may polish; nothing untrue is shown.
- **3.5 December check.** The seeded history ends on 16 November, so there is no December history to test; the test checks November, which has the same winter rate (EUR 1) as December.
- **"Changes the nights from now on".** A new level changes which nights bookings from elsewhere take across the whole window, not only from now; the world's note says so instead ("bookings already made stay").
- **The closing-window line.** It says "From [day] visitors whose stay could not fit before the real data ends on [date] were not sent (not counted as leaving)", because one-night visitors can still fit after that day, so "no visitor could fit" would not be true.
- **legal-pt.json** was generated by the developer from LEGAL-PT.md (the proposal names the writer, with the researcher checking); the test compares it with the note field by field, so any drift fails. It is still worth the researcher's look.
- **Commission and other commercial sources** are shown by type, date read and how sure; no web address of a commercial or platform source is shown anywhere (re-check item 1). Official addresses (Portal das Finanças) are named in words in the notes, not linked.
- **Not walked in the browser:** the backup-not-writable dialog, the frame-failure fallback (ticker) and the slow-shadow drop (Very fast stayed under 8 s); the code paths are there and the words are as the proposal.
- `node scripts/shots.mjs` screenshots for the round report were not made; the walk's own screenshots stay in the session scratchpad.

## Fixes after review

Brief: the conductor's message asking for M1 and the twelve should-fix items of team/rounds/4/review/BUILD.md (verdict DO NOT RELEASE YET), on top of commit 33f1eb6. No commit, no push, nobody contacted. board/HOLD.md: absent.

| Item | What changed | Files |
|---|---|---|
| M1 | `chooseDates` counts only the days in the live forecast ranges (`kind: 'live'`), the days /stay/ can show; not even those when the live file could not be read. Fallbacks as before, both with `forecast: false`: the stored copy's days, then the events window. | `play/tour.js` |
| S1 | Escape stops the tour from inside either frame: the same capture listener is added to each frame's document when it loads. | `play/tour.js` |
| S2 | Tab and Shift+Tab stay inside the start and end dialogs. | `play/tour.js` |
| S3 | When the visitor had a booking before the tour, the end dialog adds "Keeping it replaces your own simulation, including your booking." | `play/tour.js` |
| S4 | /world/ Your rates redraws at once after a change, paused or not; a focused button keeps its focus; only a field being typed in holds the redraw. | `world/world.js` |
| S5 | The six cost settings (cleaning, laundry, utilities, insurance, commission, IRS rate) carry over to a new seed in World and into the tour's simulation; the tour's put-back restores the visitor's own document as before. The panel's foot now says where each row is kept and that Reset sets all of them back. | `world/world.js`, `play/tour.js`, `admin/biz.js` |
| S6 | Gross and net yield count only the homes with a house value (their revenue, profit and value) and say "(4 of 5 homes)" when one is left out. | `admin/history.js`, `admin/biz.js` |
| S7 | The assumption fields are labelled in words, for example "House value (EUR), The Salt House". | `admin/biz.js` |
| S8 | A refusal whose target is "message b-..." reads "(a message on booking b-...)". | `admin/ops.js` |
| S9 | The engine checks guests in at each home's own check-in time (The Lagoon House and The Cape House 15:00, the others 16:00); the tour moves the clock to that time and reads the time from the event, with no fixed 16:00. | `sim/personas.js`, `play/tour.js` |
| S10 | /play/: "Let synthetic visitors book too (invented people, scripted; the full game is in World)", and the same in the note when it is ticked. | `src/play/index.html`, `play/play.js` |
| S11 | The Reset dialog opens with "Keep" focused. | `modes/chrome.js` |
| S12 | Room above the buttons in the tour's dialogs and sheet; the sheet scrolls at 390 px. | `assets/play.css` |

Tests: `tests/round4.test.mjs` gains two tests (22 in all). The reviewer's M1 test: stored copy 17 to 21 and live 25 to 29 November gives a stay inside 25 to 29 November with `forecast: true`; today's shape (live 19 to 23) stays inside 19 to 23; no live range, or a live file not read, gives `forecast: false`. A second test covers S5 (a changed cleaning cost survives a new seed and is not "default costs"), S6 (the four valued homes' profit over EUR 1,610,000, and "(4 of 5 homes)" on the page), S7, S8 and S9 (Lagoon checks in at 15:00). The tour test's stub ranges are now `kind: 'live'` and its check-in time 15:00.

How it was checked:

- `node scripts/build.mjs`: built. `validate.mjs`: OK. `leak-scan.mjs`: OK (410 files). `abp-check.mjs`: OK (6 policies).
- `node --test tests/*.test.mjs`: 84 tests, 83 pass, 1 skipped (the live test), 0 fail.
- The brief's grep of `_site/` for the four booking-platform brand names: nothing found.
- Playwright (`chromium.launch()`, no options) at 1366 and 390 px. The live forecast file was routed and every date moved six days later, so the window read "Tue 17 Nov to Sun 29 Nov".
  - The tour chose Thu 26 to Sun 29 November. 25 November is taken at The Lagoon House under seed `tour`.
  - Step 5 read "Time moves to Thu 26 Nov, 15:00, the home's check-in time ... checked in at 15:00".
  - Step 6's day card on /stay/ showed "REAL FORECAST" for Thursday 26 November, with IPMA's issue time.
  - Escape pressed inside the visitor frame opened the end dialog. Tab stayed in the end dialog six times out of six.
  - On /world/, Lagoon +10% while paused redrew at once: 85 to 94, "set by you", focus kept on the button.
  - Reset opened with "Keep" focused. The 390 px start sheet has every line clear of the buttons.
  - No console or page errors.
- Not walked in the browser this time: the S3 sentence, the S5 carry-over (covered by the unit test) and S7 with a screen reader. Each was checked in code and in the tests.
