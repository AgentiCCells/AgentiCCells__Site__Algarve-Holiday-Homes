CHANGES BEFORE BUILD

# Round 4 review: the design proposal (before build)

Written by reviewer.algarve-holiday-homes@AgentiCCells.dinis, round 4, a sub-agent of the conductor, 19 November 2026 (session clock). Files written: this file only. No commit, no push, nobody contacted. board/HOLD.md: absent.

Read: CLAUDE.md, team/reviewer/ROLE.md and POLICY.md, team/WORKFLOW.md, team/rounds/2.md, team/rounds/4.md (aim and the conductor's answers of about 04:20 UTC), team/rounds/4/design/PROPOSAL.md, mockup-tour.html, mockup-today-policy.html, team/rounds/3/review/BUILD.md and RECHECK.md. Checked against code on branch round-3: sim/clock.js, sim/booking.js, sim/personas.js, stay/sim-page.js, admin/biz.js, agent.js, house.js, sim/policies.json, and team/rounds/2/research/LEGAL-PT.md.

The proposal is careful and covers all seven aim items. Five things would make the build wrong or misleading if built as written. All are small to fix in the proposal.

## Must change

1. **The tour's dates are fixed, but the real weather window moves.** The tour books Lagoon for 19 to 22 November and step 6 says "The guest's page shows the real forecast for Faro for these days". sim/clock.js computes the weather window at run time: the vault copy covers 17 to 21 November, and the live file covers today to today + 4. From about 23 November, 22 November has no forecast. Later the events for those days may also leave the live feed. Step 6 would then claim something the page does not show. **Fix:** at tour start, choose the dates from `SIM.clock` bounds: the first 3-night stay inside the weather window where Lagoon is free under seed `tour`. Start the clock at 09:00 on the day before. If no 3 nights with a forecast exist, use the longest run there is. Put every date and time in the cards in brackets as run-time values (step 1 "Wed 18 Nov 2026, 09:00", steps 2, 5 and 7). Step 6 says "where IPMA gave one" instead of "for these days". Test the step table with the bounds stubbed to two different windows.

2. **"Bookings from elsewhere" has no single source of truth.** Section 2.4 says "the visitor-facing pages and the five designs pass nothing and keep today's calendar". But house.js gets its calendar from `SIM.booking.availability`, which reads the shared state. So once /world/ sets `settings.backgroundKeep`, the same level reaches the home pages and the admin in every tab. agent.js line 93 calls `isTaken` directly with no state and would still use the full level. The site agent would then call a night taken that the calendar and booking allow. **Fix:** state it plainly. Every caller reads `state.settings.backgroundKeep` through `nightTakenBy`, and agent.js switches to `SIM.booking.availability`. Reset and the tour set it back to 1. The /play/ legend and the home calendar say "Bookings from elsewhere: medium (set in World)" whenever it is not 1. Add a test that agent.js and house.js agree for keep 0.45.

3. **S2 as proposed leaves new bookings unplayed.** `runBetween` would play only hours later than `playedTo`. Suppose the viewer goes back to 20 November and books 21 to 24 November. When they move forward, those hours are under `playedTo`, so no check-in, cleaning or stock use ever happens. The booking stays "paid" in the past for good, and the admin shows a stay that never happened. **Fix:** while `now < playedTo`, refuse the actions that need played hours (book, hold, rate change, minimum stay). Use one note: "You are looking at hours already played. Move to [playedTo] to book or change rates." Add a test that a booking attempt before `playedTo` is refused with that reason.

4. **The IRS "documented expenses" would count money that is not an expense.** Section 3.2 sets the 15% rule's documented expenses to "the new cost total". That total includes the maintenance reserve, which is money put aside, not spent, and depreciation, which has no invoice. LEGAL-PT.md 2.2 says these must be "shown (on e-Fatura, or standard deductions)". With the six new lines, a house owner would read that the rule "adds nothing" for reasons that are not true. **Fix:** default documented expenses to the simulated spending only: cleaning, laundry, consumables, utilities, insurance, platform fees, management, accountant, IMI and mortgage interest. Leave out the reserve and depreciation. Label the default ASSUMPTION, with the note "which costs count is for your accountant". On the Maintenance reserve row, say "set aside, not spent; not a tax expense".

5. **"The legality section in full" would drop most of the tourist-tax table.** Section 6.2 gives every table the columns Rule, What it says, Source, Checked and How sure. LEGAL-PT.md 2.3 has nine columns: Municipality, Rate, Season, Night cap, Age, Exemptions, In force, Source and How sure. It has no per-row "Checked"; the date comes from its intro, "Values as found on 18 November 2026". **Fix:** in legal-pt.json, keep 2.3's own fields and show them as their own table and cards. Set `checked` from the section's date with `checkedNote: "section date"`, and invent no per-row note. Make the 35-row test also check that each 2.3 row has rate, season, night cap, age, exemptions and in force exactly as the research gives them, blanks included.

## Should change

1. **Fold in the conductor's answers (team/rounds/4.md, about 04:20 UTC).** None of these is in the proposal yet:
   - the start-dialog sentence for a visitor with their own booking
   - the one-click "I run it myself (0 percent)" button
   - the score's formula shown beside the score
   - a Reset dialog that names what goes in words ("your simulation, your stay plan, your cost assumptions, your best scores, a tour set aside")
   - citing team/rounds/4/research/PNL-DEFAULTS.md beside each default once it exists; until then, ASSUMPTION
2. **Label the tour's booking and text as the tour's.** Step 3 passes `typedHere: true`, and 5.2 counts any text with `who: 'visitor'` as "your text". So the tour's booking shows YOUR BOOKING (as in the mock-up) and its message shows "your text", although 5.1 lists a "the tour" chip. **Fix:** tag the tour's events with `data.by: 'tour'` and do not set `typedHere`. Show "The tour's booking" and the chip "the tour". Never count them as yours, even after "Keep what the tour did".
3. **Step 8 calls a year's row "the booking's money".** Step 8's card says "The booking's money" but points at Lagoon's P&L row. Under seed `tour` that row holds the seeded history and the time-based costs as well. **Fix:** point at the booking's own ledger lines, or reword: "Lagoon's year so far now includes this stay: [EUR 257.55] net of VAT ...".
4. **Step 7 has hard-coded times.** It says "cleaned at 11:00", and the mock-up's ticker shows check-out 10:00 and cleaning 11:35. Read the times from the events.
5. **Tour keys clash with the page.** On /play/, Right arrow is the slider's key, and Space and Enter already press any focused button. A global handler would do both. **Fix:**
   - Next and Pause keys act only while focus is in the card. Escape acts anywhere.
   - An automatic advance updates the live region and does not move focus. Focus moves to the card title only when the viewer pressed Next or after a step they started.
   - Moving focus every 8.5 s pulls a keyboard user away from wherever they are.
6. **One minimum-stay story.** World uses `0.6 ^ extra`, while the admin what-if uses 8% less demand for each extra night (biz.js line 26). The "one story" claim holds only for price. Share one constant in both places, or show both assumptions where each is used.
7. **Make the score comparable and define its measures.**
   - Best runs made with different cost assumptions are not comparable. Store an assumptions fingerprint with each run and show "default costs" or "your costs" in the table.
   - Define the night range in O and in 2.3's occupancy: either nights from the run's or comparison's start up to today, or all nights booked in the window. Do not mix "to the end of the window" with "as booked so far".
8. **The /play/ shadow.** After the fork, the viewer's own bookings in /play/ reach only the real world. Then "only the rates differ" is not true. Either replay the viewer's own events into the shadow or say so in the note.
9. **Depreciation and mortgage are offered as either/or.** "Pick the one that fits you" suggests that an owner with a loan has no depreciation. Allow both, or say "one of the two, to keep the example simple". Add "Simulated, not financial advice" to the yield tiles.
10. **Today panel details.**
    - Render the excerpts and quotes as text (`textContent`), never as HTML. They are untrusted text.
    - Give the dark-mode pairs for the high, medium and low chips; only unknown and ASSUMPTION have them.
11. **Label Helena every time.** Make the tick box "Let Helena (synthetic owner) keep moving ...", so the invented name never appears without its label.

## The brief's rules, one line each (as proposed)

| Rule | Result |
|---|---|
| Made-up example | Pass: band on both mock-ups; INVENTED and ASSUMPTION badges defined; the score and history labelled SIMULATED. |
| Demonstration statement | Pass: the tour's step 3 card carries it word for word; the normal flow is unchanged. |
| Nothing sent, only GETs, state only in localStorage | Pass: three new keys, all in localStorage with try and catch, all cleared by Reset; the shadow stays in memory. |
| IPMA and events with source, read time and terms | Pass as long as the tour points at the existing /stay/ source lines; no new figure from the data. Must 1 for the tour's dates. |
| Only dates with real data | Fail as written (must 1); the closing window in 2.4 is sound. |
| No booking-platform brand names | Pass: grep of the three files found none; "booking-platform commission" is generic. |
| No em dashes or hype words | Pass: grep for em and en dashes and for validate.mjs's hype list found none. |
| Nobody real named | Pass: Dinis Cruz in the record only; Helena is an invented persona (should 11). |
| Claude simulated, never live | Pass: "Claude, the guest's/host's assistant (simulated)" kept (0.5). |
| Not legal or tax advice | Pass on Money and Legality, top and bottom plus the formulas block; must 4 for the IRS expenses; should 9 for the yield. |
| Aim, seven items | All covered: 1 tour, 2 world, 3 P&L, 4 score, 5 Today panel, 6 legality, 7 N1, S2 and S4. Must 3 and 5 change how items 7 and 6 are built. |
| Formulas stated | Yes for conversion, minimum stay, the six cost lines, the yields and the score. I recomputed 3.4 from its inputs: 77,745 - (20,834 + 7,978 + 2,578 + 842 + 22,338) = EUR 23,175 (22%); net yield 1.45%. Both match. |
| Failure states | Given for each change: backup not writable, frame or target missing, booking refused, tab closed, no change yet, slow run, no house value, storage blocked, log trimmed, text not found, legal-pt.json not read, no simulation for /d/. |
| Accessibility | 390 and 1366, reduced motion, focus ring, words before colour and the contrast table are all given. Should 5 for the keys, should 10 for the dark pairs. |
| Facts checked | Legal rows: 14 + 4 + 10 + 7 = 35, matches. EUR 257.55 = 273 / 1.06. Rule ids V4, V5 and V6 exist. `keepRefused` refunds EUR 400, which matches the mock-up. `step()` seeds from `seed|now`, `rate.listBase` exists and ELASTICITY is -1.2 in biz.js: all match. |
