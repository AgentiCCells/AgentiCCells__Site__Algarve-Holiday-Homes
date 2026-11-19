# Round 5 build notes

Written by developer.algarve-holiday-homes@AgentiCCells.dinis, a sub-agent of the conductor, on 19 November 2026 (session clock).

**The brief.** Build the five admin designs in team/rounds/5/design/PROPOSAL.md (passed for build), with the three notes of team/rounds/5/review/PROPOSAL-RECHECK.md and the conductor's answers 1 to 7 in team/rounds/5.md, and close round 4's open items (team/rounds/4/review/RECHECK.md, BUILD.md).

No commit, no push, nobody contacted, nothing installed (the pre-installed Playwright only). board/HOLD.md: absent.

Everything here is a made-up example: an invented business, invented homes and people, a simulation in the visitor's browser. Every figure below was measured in this session (Node 22, the built site in Playwright's Chromium 157.0.8103.78 on linux-x64) unless it is marked as taken from the proposal.

## Order of work (PROPOSAL.md 2.9 and 14, with the re-check's notes)

| Step | What | Ledger fixture |
|---|---|---|
| 1 | Recorded the Ledger baseline on commit db9d993: 13 sections x 390 and 1366 px x light and dark = 52 views, after "Load example activity (simulated)", 30,376 elements | recorded (baseline) |
| 2 | **Token refactor.** Every colour literal in an admin.css rule became a token (`--a-*` design tokens, `--m-*` meaning tokens). One fault was found on the way: `.pill.hot` used `#B4530F` in both modes while `.kpi.warn` used `--a-warn`, so dark mode differed. Fixed with separate `--a-hot` and `--a-hot-edge` tokens. | **0 differences** in colours and screenshots, all 52 views |
| 3a | Answer 6, step 1: Ledger's needs-action colour (the urgent count pill and the warn tile edge) moves to its ink, `#1B232C` light and `#E9EDF1` dark, with the surface colour as the pill text. `#B4530F` was 1.01:1 from the allow edge. An element diff showed that only the hot pills and the warn tiles changed. | re-recorded with that reason |
| 3b | Answer 6, step 2: the dark danger button text moves from `#B42318` (2.41:1 on `#1C232B`) to `#FBE1DE` (12.78:1). The border keeps the deny red; light mode is unchanged. | re-recorded with that reason |
| 3c | **The 12 px floor (4.1; answer 7).** On the admin: labels, pills, chips, occupancy headers and bars, and `code`. Chart labels are sized to the drawing (`fitCharts()`), and an x-axis label that would collide is hidden. Site-wide, the `.k` and `.d` chips are 12 px in modes.css, world.css, play.css and stay.css. | screenshots re-recorded; colours still 0 differences |
| 4 | The five theme files, `design-boot.js`, the chooser, the pins, the `/play/` select, the assistants' names, and the per-home check-out times (below) | colours and screenshots re-recorded: see "Re-recordings" |

## Changes

| # | What changed | Files |
|---|---|---|
| 2.3 | **The five themes**, generated from the mock-up's blocks and scoped to `:root[data-design="<slug>"]`: light tokens, plus the two dark forms (the media query with `:not([data-theme="light"])`, and `[data-theme="dark"]`). Each has the sentinel `--a-theme-ok:<slug>`. No meaning token is set, no label is hidden, nothing is under 12 px, only `data:` images, and no imports, fonts, fixed layers or animation. | `src/assets/admin-themes/{revista,azulejo,linho,costa,postal}.css` (new) |
| 2.4 | **Boot script.** It reads `?design=` (this view only, not stored), then the stored `cc.admin.design.v1`, then Ledger. An unknown stored value is removed. `theme=light` applies only together with `embed`. If storage is blocked, there is no error. | `src/assets/js/admin/design-boot.js` (new), `src/admin/index.html` |
| 2.5, 2.6 | **The chooser** in the title row. It has a select (Ledger (main), Revista, Azulejo, Linho, Costa, Postal), the link "See the matching visitor design", and the status line "Admin design: X. The visitor's matching design is at /d/x/.". When storage is blocked, it says "Kept for this page only: this browser is not keeping data.". It is hidden when embedded, and it listens for Reset and for `storage`. When a theme file does not arrive, the page shows Ledger and the line "The Linho styles could not be loaded; showing the main admin design." | `src/admin/index.html`, `admin/admin.js`, `assets/admin.css` |
| Answer 4 | **Reset** clears `cc.admin.design.v1`. RESET_WORDS now include "your admin design", and the About panel lists the key. | `modes/chrome.js` |
| 2.7 | **Pins** `data-pin` 1 to 5 on the occupancy names (Salt, Lagoon, Hill, Harbour, Cape) and on the tourist-tax municipality cells (Tavira, Faro, Loulé, Lagos, Vila do Bispo). In Costa they show as `content:attr(data-pin) / ""`, so the number is not read aloud. | `admin/util.js`, `admin/biz.js`, `admin-themes/costa.css` |
| 3 | **`/play/`**. There is a design select. The admin frame uses `/admin/?embed&design=<slug>&theme=light` beside a `/d/` design, and follows the scheme in the main pairing. The page also has the line "The five designs restyle the visitor's home page and the whole admin. A home's own page and the booking flow are in the main design in every case." | `play/play.js`, `src/play/index.html`, `assets/play.css` |
| 4 | **The assistants' names**, as /agents/ gives them: "Claude, the host's assistant (simulated)" and "Claude, the guest's assistant (simulated)". world.js keeps its own copy of the names, because importing chrome.js there would break the world page's stand-in fallback. | `modes/chrome.js`, `admin/ops.js`, `play/play.js`, `world/world.js` |
| 10 | **"And its admin"**: a second screenshot on each of the five `/d/` cards, linked to `/admin/?design=<slug>`. `node scripts/shots.mjs --previews <base> [--admin-only]` writes `src/d/previews/<slug>-admin.jpg` (Today with the example activity, light, 1366 x 900 saved 800 wide, 57 to 72 KB). Requests that leave the site are blocked, so the pictures hold only invented figures and no copied data. | `scripts/shots.mjs`, `scripts/designs.mjs`, `assets/site.css`, `src/d/previews/*-admin.jpg` (new) |
| Walk | **Fixes found while walking the designs:**<br>- Linho at 390: its 8- and 9-tile rule came after its 640 px rule, so phones got four columns and words broke ("Departur/es", "€3,0/05"). The rule now comes first.<br>- Postal, Revista and Costa at 1366: the Money figures in the nine-tile row were split or cut off. Above 1200 px those rows use 1.15rem (Postal 1.05rem, its slab serif being wider); both sizes are over 12 px. | `admin-themes/linho.css`, `revista.css`, `costa.css`, `postal.css` |

### Round 4's open items

| Item | What changed | Files |
|---|---|---|
| Typed rate | /world/ Your rates now redraws on `focusout` too, so a typed rate shows once the field is left. | `world/world.js` |
| Same-day check-in | step() checks in a paid booking on its first day at or after the home's own check-in hour. Before, only the exact hour counted, so a booking made at 17:10 stayed "paid". Ten seeds over the full window: 0 bookings left paid in the past (round 4 measured up to 2). | `sim/personas.js` |
| Own check-out time | Stays check out at the home's own time, from homes.json (Lagoon 11:00, for example), and the review follows at check-out. The admin's example activity uses each home's check_in and check_out instead of a fixed T16:00 and T10:00. | `sim/personas.js`, `admin/admin.js` |
| Step 6 with data blocked | The tour's words are now "IPMA has no forecast for these days on this page, and the page says why; nothing is invented." The guest page says the same thing, so it does not contradict them. | `play/tour.js` |
| The score's occupancy part | **Proposal, applied:** full marks at 80% of sellable nights, not 60%. Ten seeds over 18 November to 31 December, levels from the seed, gave 56% to 69%, all of which were full marks at 60%. Now seeds cc-1, cc-5 and cc-7 give 28.2, 26.3 and 29.7 of 35. The formula shown beside the score says "up to 80% (full marks)". | `sim/score.js` |

## Tests

**New: `tests/round5.test.mjs`** (7 tests, no browser):
- no colour literal outside the token definitions (comments removed before the check), plus the answer 6 values;
- the theme-file rules;
- the boot script in a vm with six cases, plus blocked storage;
- the pins and the assistants' names;
- same-day check-in after 16:00, Salt out at 10:00, Lagoon not before 11:00 and out at 11:00;
- the focusout redraw and step 6's words;
- the score: FULL 0.8, three seeds each between 40% and 80% occupancy, none at 35 points, at least two different point values, and no stay left "paid" in the past.

**New: `tests/admin-designs.test.mjs`** (3 browser tests).
1. Six designs x 2 widths x 2 modes x 13 sections. Each view is checked for:
   - no sideways scroll;
   - every required label;
   - nothing under 12 px (SVG text scaled by its drawing);
   - contrast of at least 4.5:1;
   - the needs-action colour at least 1.5:1 from allow, ask and deny (the default included, re-check note 1);
   - a focus outline across 45 Tabs;
   - KPI tiles: no figure cut off by its tile in any design, and no word broken across lines in the five new designs (added after the walk).
2. `/play/`: the light frame, the open-a link without a theme, the drawer and ticker at 390, Reset, and a 404 on a theme file.
3. The `.k` and `.d` chips are 12 px on /, a home page, /stay/, /play/, /world/, /agents/ and /agent/, at 390 and 1366, light and dark, with no sideways scroll.

**New: `tests/ledger-unchanged.test.mjs`, `tests/ledger-record.mjs`, `tests/browser.mjs`, and `tests/fixtures/ledger-{colours,shots}.json`.**
- Colours are always compared.
- Screenshots are compared only on the recorded Chromium and platform; otherwise the test says so.
- Digests are the first 40 hex characters of SHA-256, so the leak scan prints OK. The scan and its allowlist are unchanged (the coordinator's note).

**Changed expectations, each for a decided change:**
- `round4.test.mjs`:
  - the tour's check-out is T11:00 (Lagoon's own time, RECHECK item 3);
  - the 4.1 title and FORMULA say 80%, plus `FULL.occupancy` 0.8 (the score item);
  - RESET_WORDS includes "your admin design", and KEPT_KEYS includes `cc.admin.design.v1` (answer 4);
  - the refused-action sentence begins "Claude, the host's assistant (simulated) tried" (answer 1, the /agents/ names).
- `sim-world.test.mjs`: the weather test steps at 2026-11-21T11:00, Cape's own check-out time, not 10:00 (RECHECK item 3).

No check was weakened, removed or skipped.

## Re-recordings of the Ledger fixtures (reasons as written into each fixture's `history`)

1. Baseline before any round 5 change, on commit db9d993.
2. Answer 6, step 1: the needs-action colour moves to the ink (#B4530F was 1.01:1 from the allow edge).
3. Answer 6, step 2: the dark danger button text moves from #B42318 (2.41:1) to #FBE1DE (12.78:1).
4. Step 3, the 12 px floor: screenshots only. Sizes change on purpose; colours showed zero differences.
5. **Step 4: the Design chooser in the title row.** It adds 12 elements to every view: the wrapper, its paragraph, the label, the select with six options, the link and the note. That makes 31,000 elements, which is 30,376 + 52 x 12. To check that nothing else changed, the chooser was removed in the page and the wrapper unwrapped: then all 52 views equalled the previous recording. So the per-home check-out times and the pins change no Ledger colour.

## How it was checked

- `node scripts/build.mjs`: built `_site/` (dev).
- `node scripts/validate.mjs`: OK.
- `node scripts/leak-scan.mjs`: OK (461 files).
- `node scripts/abp-check.mjs`: OK (6 policies).
- `node --test tests/*.test.mjs`: 95 tests; 94 pass, 0 fail, 1 skipped. The skip is data.test.mjs "live files", which needs the network and was skipped before this round.
- The brand grep of `_site` (the usual booking-platform names, as in the validator): empty.
- **The walk:** six designs (Ledger and the five) x 390 and 1366 x light and dark x 13 sections, in Playwright with outside requests blocked.
  - In all 24 runs: no page errors or console errors, no failed request to the site, and no sideways scroll. Each theme's sentinel applied.
  - Screenshots of Today, Calendar, Money and Policies were looked at for every run (96 files, in the session's scratchpad, not kept in the repository). The two tile faults above were found and fixed this way.
- `/d/` at 390 and 1366: the five admin pictures load, with no sideways scroll and no page errors.

## Not done, or open

- **Ledger splits four Money figures at 1366** ("€111,364" and three others run onto two lines in the nine-tile row). This has been so since round 4's nine-tile row. Ledger stays unchanged in this round, so it was not fixed. The tile check in admin-designs.test.mjs exempts Ledger from the split check only, and says why. A fix is about 1 line, with a recorded re-recording. **Question for the conductor:** fix it in round 6?
- `/d/` has one `code` element at 11.7 px ("events-pt" in the intro). It was there before this round and is outside the round's floor (the admin plus the `.k` and `.d` chips). It was not changed.
- The visitor previews in `src/d/previews/<slug>.jpg` were not retaken. They read live data, and this session blocked outside requests.
