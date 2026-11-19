PASS: RELEASE

# Round 4 re-check of the build

Written by reviewer.algarve-holiday-homes@AgentiCCells.dinis, round 4, a sub-agent of the conductor, 19 November 2026 (session clock). Files written: this file and `recheck-shots/` (7 JPEGs, q70, each under 250 KB). No commit, no push, nobody contacted, nothing else edited. board/HOLD.md: absent before and after.

Checked: commit 96e3c99 on branch round-3 ("Fixes after review" in team/rounds/4/build/NOTES.md) against my team/rounds/4/review/BUILD.md.

## Verdict: PASS: RELEASE

- **M1:** fixed, and seen working in the browser.
- **The twelve should-fix items:** all fixed in the browser, S4 with one small gap (item 1 below).
- **Gates:** all pass.
- **Rules:** the rules table holds as in BUILD.md.

S9 has no regression on /stay/, /admin/ or the world. It does make an older engine gap slightly wider (item 2 below). That gap is not new in round 4, and it affects 0 to 2 bookings in a 45-day run.

None of the items below blocks the release. They are for round 5.

## For the next round (should fix)

1. **S4, one gap.** Type a new base in a Your rates field and press Enter, or Tab out: the value is kept, but the row still says "set by Helena (synthetic owner)". It changes only at the next redraw (the clock moving, or another change). The redraw skips while the field has focus, and nothing redraws when focus leaves it. **Fix:** call `renderRates` on the panel's `focusout`.
2. **Same-day bookings made after a home's check-in hour never check in.** In /world/, a synthetic booking for today made after the check-in hour stays "paid" in the past for good. These are "last-minute" visitors (lead 0), and twice "surf-couple". The admin then shows a stay that never happened, which is the case the proposal review's must 3 warned about.
   - **Measured,** after Very fast to 31 December, eight seeds:

     | Seed | Bookings left "paid" in the past |
     |---|---|
     | cinco-chamines-1 | 2 (Lagoon, made 17:14 and 15:14) |
     | cc-5 | 2 |
     | cc-7 | 2 |
     | tour | 2 |
     | zebra | 1 |
     | cc-1, cc-2, cc-6 | 0 |

   - **Not new.** Round 3 had the same gap after 16:00. S9 makes it one hour wider for Lagoon and Cape, which now check in at 15:00: the 15:14 booking is one such case.
   - **Fix:** in `step()`, check in a paid booking whose arrival day is today once the hour is at or past the home's check-in hour. That is the catch-up `ownLifecycle` already does for the visitor's own booking (sim-page.js line 131).
3. **Check-out is still 10:00 for every home.** S9 now checks guests in at each home's own time, but `step()` checks everyone out at 10:00 (personas.js line 131). Lagoon and Cape say "check-out 11:00", and the admin says "leaves by 11:00". Yet tour step 7 reads "the guests checked out at 10:00", and the world does the same. Also, the admin's manual check-in still uses a fixed `T16:00` (admin.js line 159). **Fix:** check out at each home's `check_out` hour, and use the home's `check_in` in admin.js.
4. **Step 6's words with data blocked.** With data.promptugal.news blocked, the tour falls back correctly (`forecast: false`). But the card says "IPMA has no forecast for these days yet", while the guest page says "IPMA's forecast could not be read just now". **Fix:** "IPMA has no forecast for these days on this page, and the page says why; nothing is invented."

## Each item

| Item | Result in the browser |
|---|---|
| M1 | **Today's data** (live forecast 19 to 23 November): the tour chose Thu 19 to Sun 22 November. Step 6's day card reads "Thursday 19 November · REAL FORECAST · 12.1 to 20.8 °C ... IPMA issued it ..." (shot `rc-tour-step6-today-1366`). **Live forecast moved six days later** (route on `ipma-city-forecasts/latest.json`; legend "Tue 17 Nov to Sun 29 Nov"): it chose Thu 26 to Sun 29 November, and the card reads "Thursday 26 November · REAL FORECAST · 9.9 to 18.6 °C" (shot `rc-tour-step6-later-window-1366`). **Data blocked:** it falls back to 18 to 21 November with the "no forecast" words (item 4). Step 8 reads EUR 257.55 net of VAT, which is EUR 273 / 1.06: correct. |
| S1 | Escape after clicking inside the visitor frame opens the end dialog. Escape after clicking inside the admin frame does too. Once the tour has ended, Escape in a frame does nothing. |
| S2 | Start dialog: Tab cycles "Not now" and "Start the tour", and Shift+Tab goes back. End dialog: Tab cycles its four controls, seven presses, never outside. |
| S3 (not walked by the developer) | With a visitor booking made first, the end dialog reads, in bold: "Keeping it replaces your own simulation, including your booking." (shot `rc-tour-end-own-1366`). Without one, the sentence is absent. Put back is byte for byte the same in all four runs (1366 today, 1366 later window, 1366 with a booking, 390). |
| S4 | While paused, Lagoon +10% redraws at once: 94, "set by you". Focus stays on the button, and Enter again gives 103. A minimum-night change redraws at once. Typed values: item 1. |
| S5 (not walked by the developer) | I set cleaning to EUR 45 and insurance to EUR 50 in /admin/, then started a new seed `cc-9` in /world/: cleaning 45 and insurance 50. The run is filed as "your costs", and the score says "Costs: your costs". The tour's own simulation also carries 45 and 50. Reset sets them back to 40 and 35. The panel's foot now says where each row is kept and that Reset sets all of them back. |
| S6 | With Lagoon's house value empty: net yield "0.90% ... (€1,610,000 (4 of 5 homes))", which is (2,783 + 3,305 + 3,298 + 3,429) x 365 / 322 / 1,610,000 = 0.90%: correct. Gross yield 6.35%. The per-home row reads "type a house value" for Lagoon. |
| S7 (not walked by the developer) | In the accessibility tree (Playwright `ariaSnapshot` of the panel), all 59 fields have names in words, for example `spinbutton "House value (EUR), The Salt House"` and `spinbutton "Management fee (% of revenue net of VAT), The Lagoon House"`. None has a code-path name left. |
| S8 | "Then the host's assistant tried to share the guest list (a message on booking b-1nji2sy) because of it." |
| S9 | **Tour:** step 5 reads "Time moves to Thu 19 Nov, 15:00, the home's check-in time ... the guests checked in at 15:00". **/stay/** (a visitor's Lagoon booking): "paid" at 14:00, "checked-in" at 15:00; afterwards "checked in Thu 19 Nov 2026, 15:00" and "check-out 11:00". **/admin/:** "arrives 15:00 ... in house". **World:** check-ins at 15:00 and 16:00 only (cc-4242: 18 and 17); scores 87, 80 and 68 for three seeds (89, 80 and 68 before); Very fast still 43 days in 2.5 s with a longest frame gap of 17 ms. Regressions: none, but see items 2 and 3. |
| S10 | /play/: "Let synthetic visitors book too (invented people, scripted; the full game is in World)", with the same words in the note when ticked. |
| S11 | The Reset dialog opens with "Keep" focused. |
| S12 | 390 px start sheet: no text under the buttons, 251 px tall, scrolls (shot `rc-tour-start-390`). Step 9's sheet (the tallest, 337 px): no overlap (shot `rc-tour-step9-390`). |

**Unchanged and checked again:**
- **Backup not writable:** the "Start anyway" dialog and the end dialog with "Close".
- **Admin frame failing (404):** steps 4 and 7 point at the ticker with the note.
- **localStorage blocked entirely:** no errors.
- **Data blocked:** every page and the /play/ legends say so.

## Gates (commit 96e3c99)

- `node scripts/build.mjs`: built `_site/` (dev).
- `validate.mjs`: OK.
- `leak-scan.mjs`: OK (410 files, 522 binary skipped).
- `abp-check.mjs`: OK (6 policies).
- `check-commits.mjs origin/dev HEAD`: OK (13 commits).
- `check-signatures.mjs origin/dev HEAD`: OK (12 checked, 1 older than the check skipped).
- `role-scope.mjs origin/dev HEAD`: OK (13 commits).
- `node --test tests/*.test.mjs`: 84 tests, 83 pass, 1 skipped (the live test), 0 fail.
- **Brand grep:** I grepped `_site/` and `src/` for the usual booking-platform brands, as words and inside URLs: none found. No U+2014 in `_site/` or `src/`.

## Rules, again

- **Pages:** the full sweep of 24 pages at 390 and 1366, light and dark, gives the same result as BUILD.md. "Made-up example" is on every page, with no horizontal overflow and no console errors. Only GETs: 737, 718, 737 and 718 by mode, to 127.0.0.1 and data.promptugal.news. No cookies.
- **Contrast:** the only hits are the captions over pictures already noted in BUILD.md (false positives).
- **Keyboard:** the Tab sweeps of /play/, /world/, /admin/ Money, Legality, Today and `/`, light and dark, show a focus ring on every control.
- **Storage keys:** unchanged. Reset clears all of them.

## How it was checked

- **Server:** `_site` served with `python3 -m http.server` on 127.0.0.1:8841, stopped afterwards.
- **Browser:** pre-installed Playwright 1.63, `chromium.launch()` with no options, deviceScaleFactor 1, a fresh context per scenario. Every request and error was recorded.
- **Stubbed window:** the later forecast window was made by rewriting the dates in the live forecast file in the browser only; nothing was saved.
- **Scripts:** in the session scratchpad, not committed.

## Shots (`recheck-shots/`)

`rc-tour-step6-today-1366`, `rc-tour-step6-later-window-1366`, `rc-tour-end-own-1366`, `rc-tour-start-390`, `rc-tour-step9-390`, `rc-admin-money-assumptions-1366`, `rc-world-after-vf-1366`
