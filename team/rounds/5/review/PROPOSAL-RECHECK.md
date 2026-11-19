PASS: BUILD

# Round 5 review: re-check of the revised proposal

Written by reviewer.algarve-holiday-homes@AgentiCCells.dinis, round 5, a sub-agent of the conductor, 19 November 2026 (session clock). Files written: this file only. No commit, no push, nobody contacted. board/HOLD.md: absent.

**Read:** team/rounds/5/design/PROPOSAL.md as revised (commit c3f8035, with its "Changes after review" table), the mock-up, and team/rounds/5.md answers 1 to 7.

**Checked:**
- I recomputed every new contrast and distance figure with the WCAG 2 formula. All of them match.
- The mock-up has no text under 12 px, and no `#A63D17` left.
- It now shows "Helena (invented person)".
- No em dashes and no booking-platform brand names in the proposal or the mock-up.

All six must-change and all five should-change items are answered in the text itself, not only in the table. Nothing in the revision breaks a rule.

## For the developer's brief

Answers 6 and 7 were given after this revision (commit 37903e8), so three places in the proposal still describe the earlier plan. The brief should carry them, and the build review will check them.

1. **Answer 6, Ledger's "needs action" colour.**
   - The plan as revised: Ledger's urgent pill and warn edge stay `#B4530F`. Section 10, test 5 checks that Ledger keeps this value, and section 15 asks question 1.
   - What answer 6 decided: Ledger's needs-action colour moves to its ink `#1B232C`. I measured the distances as 3.15, 5.20 and 2.41 against allow, ask and deny. Ledger's dark-mode danger button moves to `#FBE1DE`, at 12.78:1.
   - How: two steps of their own, after step 2 of 2.9 (the zero-difference proof). Each step re-records the fixtures, with its reason written down.
   - Test 5 then applies the same 1.5:1 rule to Ledger as to the themes, instead of checking for `#B4530F`.
2. **Answer 7, the 12 px chips site-wide.** 4.1 and test 3 cover `/admin/` only. The `.k` and `.d` chips should go to 12 px in `modes.css` on every page. Test 3, or a separate check, should then cover the other mode pages at 390 and 1366 px:
   - `/`, a home page, `/stay/`, `/play/`, `/world/`, `/agents/` and `/agent/`;
   - with no sideways scroll on any of them.
3. **The 2.9 order.** Add the two answer 6 steps to the order of work, so the zero-difference proof stays a clean step before any intended change.

## Items, one line each

| Item | Answered | Where |
|---|---|---|
| Must 1, 12 px floor, no exception | Yes. Every theme, Ledger included; Linho at 0.12 em tracking; the exception removed from the test; the mock-up re-measured. The site-wide part comes from answer 7: item 2 above. | 4.1, 5, 7, 10 |
| Must 2, meaning colours | Yes. Costa's pins are `#0B4F63` with white (9.08). Costa's and Postal's hot colour is ink. The warn and ok chips are meaning tokens. The 1.5:1 rule and its test are in place. The distance table is correct (for example Costa light 3.14, 5.19, 2.41). Ledger's own value: item 1 above. | 2.2, 2.3, 8, 9, 10, 11 |
| Must 3, Reset clears the design | Yes. `KEPT_KEYS`, `RESET_WORDS`, the Reset listener and the storage event; the round 4 test's two expected values change in the same commit, as the conductor decided. | 2.5, 2.6, 13 |
| Must 4, light admin frame beside a /d/ design | Yes. `theme=light` is read for this view only, and only with `embed`. It is never stored and never carried to "Open in its own tab". | 2.4, 3, 10 |
| Must 5, proof that Ledger is unchanged | Yes. Colour and screenshot fixtures over 52 views; each of the 45 colour uses is listed with its token; the screenshot check skips with a stated reason on another Chromium or platform. | 2.8, 2.9 |
| Must 6, tests that run | Yes. Both files are `*.test.mjs`, serve `_site` themselves, and skip with a stated reason when Playwright is not installed. `release.sh` is unchanged. | 10 |
| Should 1, pin numbers | Yes. `data-pin` on every home row in every design, and `content: attr(data-pin) / ""`. | 2.7, 8 |
| Should 2, contrast scope | Yes. The test checks each element against the background behind it. | 10 |
| Should 3, assistants' names | Yes. Exact strings; the guest kept apart; the drawer and ticker checked at 390 px. | 4, 10 |
| Should 4, owner line | Yes. "Helena (invented person)" (answer 5), in the mock-up too. | 4 |
| Should 5, Revista urgent pill | Yes. Ink, not the link colour. | 5 |

**Note.** Section 10 says no test in `tests/` uses Playwright, and that the live test I mentioned could not be found. My earlier reviews meant the skipped live data test in the suite, which skips for its own reason. The pattern of skipping with a stated reason is the same.
