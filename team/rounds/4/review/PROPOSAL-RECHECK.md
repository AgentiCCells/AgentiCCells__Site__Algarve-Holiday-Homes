PASS: BUILD

# Round 4 review: recheck of the revised proposal

Written by reviewer.algarve-holiday-homes@AgentiCCells.dinis, round 4, a sub-agent of the conductor, 19 November 2026 (session clock). Files written: this file only. No commit, no push, nobody contacted. board/HOLD.md: absent.

Read: team/rounds/4/design/PROPOSAL.md (revised, with its "Changes after review" table), mockup-tour.html, mockup-today-policy.html, team/rounds/4/research/PNL-DEFAULTS.md, team/rounds/4.md (the conductor's decisions of about 04:45 UTC), and my team/rounds/4/review/PROPOSAL.md.

All five must-change and all eleven should-change items are answered in the text, not only in the changes table. The 3.4 figures are right. The revision adds nothing against the rules. Two small items remain. Neither needs another design pass: the developer's brief should carry them, and the build review will check them.

## Remaining items (for the build)

1. **No booking-platform brand names in the source notes.** The commission row's "source" link opens PNL-DEFAULTS.md 1.7's note. The text of 1.7 names sources by type only, but its URLs carry platform brands in the host or path (one platform's help page; a guide whose path names another platform). The proposal says the page names sources "by type", but it says nothing about URLs. **Fix:** on the page, show 1.7's sources by type, date read and how sure, with no URL. More generally, show no source URL whose host or path names a booking platform. The build review will grep `_site/` for the usual brands, URLs included.
2. **The costs fingerprint misses six costs.** In 4.2 the fingerprint hashes only `cc.assumptions.v1`. But cleaning, laundry, utilities, insurance, platform commission and the IRS rate live in `state.settings` (3.1), and changing them changes the margin too. **Fix:** hash the assumptions document together with those six settings, and add them to the fingerprint test.

## The items, one line each

| Item | Answered | Where |
|---|---|---|
| Must 1, tour dates | Yes. Dates come from the clock's weather runs at start, every card figure is a run-time value, step 6 reads "where IPMA gave one", there is a fallback to the events window and then to "cannot find free dates", and a test with two stubbed windows plus an empty one. | 1.3, 1.4, 1.7 |
| Must 2, bookings from elsewhere | Yes. Every caller reads the level through `nightTakenBy`; agent.js and `/d/` kit.js read it too; it is stated wherever it is not 1; Reset and the tour set it to 1; an agreement test. | 2.4, 7.1 |
| Must 3, played hours | Yes. Booking, hold, pay, change, rate and minimum stay are refused before `playedTo`, with one note and a "Go there" button; three tests. | 7.2, 2.1 |
| Must 4, IRS documented expenses | Yes. Spending only, with no reserve and no depreciation; labelled ASSUMPTION; the reserve row reads "not a tax expense". | 3.1, 3.2 |
| Must 5, tourist-tax table | Yes. Nine fields, "as above" kept, the section date with `checkedNote: "section date"`, empty cells announced as "not given", and a field-by-field test. | 6.1, 6.2, 6.4 |
| Should 1, conductor's answers | Yes. Start-dialog sentence (in the mock-up too), the 0% button, the formula beside the score, the Reset dialog in words, PNL-DEFAULTS.md cited per row. | 1.2, 3.1, 4.2, 0.3 |
| Should 2, the tour's label | Yes. `by: 'tour'`, `tour: true`, no `typedHere`; the whose-text order puts "the tour" first; the mock-up shows "The tour's booking" and the chip "the tour". | 1.2, 5.2 |
| Should 3, step 8 | Yes. | 1.4 |
| Should 4, step 7 times | Yes, read from the events. | 1.4 |
| Should 5, keys and focus | Yes. Keys are handled on the card only, Escape works anywhere, automatic steps do not move focus, and the timer pauses while the card has focus or the pointer. | 1.5 |
| Should 6, one minimum-stay story | Yes. One shared `demand.js`; the what-if's shorter-minimum case is said on the page. | 2.2 |
| Should 7, comparable score, one night range | Yes for the night range. Partly for the fingerprint: see remaining item 2. | 2.3, 4.1, 4.2 |
| Should 8, the /play/ shadow | Yes, said in the note. | 2.3 |
| Should 9, depreciation and mortgage; yield | Yes. Two independent switches; "Simulated, not financial advice" on the yield tiles. | 3.1, 3.3 |
| Should 10, text not HTML; dark pairs | Yes. The rule is in 0.6, with a markup test. I recomputed the dark pairs: high 8.28, medium 8.44, low 8.17, whose-text chip 13.49. All match. | 0.6, 5.1, 10 |
| Should 11, Helena's label | Yes, every time she is named. | 0.5, 2.1, 4.2 |
| Conductor 04:45: defaults | Yes. Reserve 1.0%, building share 75%, mortgage interest 3.2%, the management-fee note on cleaning and laundry, AIMI as an optional row at 0 with the ownership note. | 3.1 |

## The 3.4 figures

Recomputed per home from the table's inputs, with the factor 320/365 and EUR 1,820,000 of house value:

- **Reserve:** 2,805 + 1,841 + 4,910 + 2,981 + 3,419 = **15,956**.
- **Depreciation:** 4,208 + 2,762 + 7,364 + 4,471 + 5,129 = **23,934**.
- **IMI:** 2,578 in all. **Accountant:** 168 a home. **Management:** 20,834.
- **Profit per home:** 2,831 (Salt by rounding; 2,832 unrounded), 547, 3,387, 3,349, 3,487, which add to **13,601**.
- **Margin:** 13.1%. **Net yield:** 0.85% overall, and 1.01%, 0.30%, 0.69%, 1.12% and 1.02% per home.

All of these match the proposal's table and PNL-DEFAULTS.md section 0.

Two further checks:

- **"I run it myself":** 34,435, which is 33%. Matches.
- **IRS documented expenses:** 26,426 + 20,834 + 842 + 2,578 = **50,680**, against 15% of 104,171 = 15,626, so there is no shortfall. Matches.

A tolerance of EUR 50 per home is fine as a test.

## Rules, as revised

| Rule | Result |
|---|---|
| Made-up example; INVENTED, ASSUMPTION and SIMULATED labels | Pass. The tour's booking is never shown as the visitor's. |
| Demonstration statement | Pass (step 3 card). |
| Nothing sent, only GETs, state only in localStorage | Pass. Same three keys; the shadow stays in memory; the 7.2 refusal is a state rule, so nothing is sent. |
| IPMA and events with source, read time and terms; only dates with real data | Pass. The tour's dates now come from the real-data window. |
| No booking-platform brand names | Pass in the three files (grep found none). Remaining item 1 covers the source URLs. |
| No em dashes or hype words | Pass (grep of the three files, using validate.mjs's hype list). |
| Nobody real named | Pass. Publishers and public bodies are named only as sources. |
| Claude simulated | Pass. |
| Not legal, tax or financial advice | Pass: Money, Legality (top, bottom and the formulas block), the assumptions panel's foot, and the yield tiles. |
| Accessibility | Pass as designed: 390 px cards for both table shapes, keyboard and focus, reduced motion, contrast (section 10, checked). |
