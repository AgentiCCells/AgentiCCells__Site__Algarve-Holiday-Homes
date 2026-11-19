# Round 5 design proposal: the admin in five designs (a made-up example)

Written by designer.algarve-holiday-homes@AgentiCCells.dinis, 19 November 2026. **Status: proposal, revised after review.** The review is team/rounds/5/review/PROPOSAL.md ("CHANGES BEFORE BUILD"), and the conductor's answers 1 to 5 are in team/rounds/5.md (about 07:30 to 08:00 UTC). This version is for the reviewer's recheck, then the developer and the writer.

## Changes after review

| Item | What was asked | Done in |
|---|---|---|
| Must 1 | A 12 px floor for every label, tile label, sidebar label and table header, with no exception (conductor's answer 3) | 4.1; 5 (Revista labels 12 px); 7 (Linho labels and headers 12 px, tracking 0.12 em, checked at 390); 10 (the exception removed); mock-up and shots |
| Must 2 | Costa's pins and urgent stripe away from the deny red; the warn and ok chip tokens become meaning tokens; `--a-hot` at least 1.5:1 from allow, ask and deny | 2.2 (token lists); 2.3 (hot rule); 8 (pins `#0B4F63` with white, stripe and urgent pill in ink); 9 (Postal's warn edge moved off terracotta as well); 10 (hot-distance check); 11 (table); mock-up and shots |
| Must 3 | Reset clears `cc.admin.design.v1` too (conductor's answer 4) | 2.5; 2.6; 13 rows 4 and 9 |
| Must 4 | When `/play/` shows a `/d/` design, the admin frame is light (conductor's answer 2) | 2.4 (`theme=light`, view only); 3; 10 |
| Must 5 | Proof that the token refactor leaves Ledger unchanged; each literal listed with its token | 2.8 (all 45 uses in rules, with their tokens); 2.9 (before-and-after comparison, committed as a test); 13 row 1 |
| Must 6 | A test that `release.sh` really runs | 10 (`tests/admin-designs.test.mjs` and `tests/ledger-unchanged.test.mjs`, serving `_site` themselves, skipping with a reason without Playwright); `release.sh` unchanged |
| Should 1 | Costa's pin number needs a markup attribute, kept from screen readers | 2.7; 8 (`data-pin` written by `ops.js` and `biz.js`; `content: attr(data-pin) / ""`) |
| Should 2 | The contrast test covers more classes, each against its own background | 10 |
| Should 3 | The longer assistant names reach every mode's drawer, the ticker and /world/ (conductor's answer 1) | 4 (exact strings, `ACTOR_NAMES` and `ACTOR_WORDS`, drawer truncation check at 390); 10; 13 row 8 |
| Should 4 | Say which "Signed in as the owner" words stay | 4 ("Helena (invented person)", conductor's answer 5); mock-up |
| Should 5 | Revista's urgent pill not in the link colour | 5 (ink pill); 11 |

**Why this round.** Round 5 aim, item 1 (team/rounds/5.md, conductor, about 06:50 UTC): "`/admin/` in five professional, distinct looks that match the five visitor designs under `/d/` (Revista, Azulejo, Linho, Costa, Postal), on the same simulation and the same policy guard: a chooser in the admin, the choice kept in localStorage, and `/play/` showing the visitor design and the matching admin side by side. Every label, warning, "made-up example", "not legal or tax advice" and source line stays in every design."

Dinis Cruz, 18 November 2026, about 17:20 UTC (team/rounds/2.md): "And again, multiple designs, you know, for each one, right? So you should have 5 designs each." And about 17:10 UTC: "really make sure you have different designs, but they also should look very professional."

**Read with this file.**
- `mockup-admin-themes.html`: a static mock-up of the admin's Today section in all five designs, with a switcher (and a light and dark switch). It links `../../3/design/mock-chrome.css` for the band, the header and the label chips. `?design=revista|azulejo|linho|costa|postal` and `?mode=dark` choose the look.
- `admin-revista.jpg`, `admin-azulejo.jpg`, `admin-linho.jpg`, `admin-costa.jpg`, `admin-postal.jpg`: one shot per design, each with the page at 1366 px in light mode (top 1000 px) and at 390 px in dark mode (top 1000 px) side by side. Re-taken after review with the pre-installed Playwright (Chromium), JPEG quality 70, 209 to 244 KB each.
- What the re-take checked, in light and dark at both widths for all five designs: `scrollWidth` came back as 1366 and 390 (no sideways scroll), no text in the admin or the band rendered under 12 px, and the 14 occupancy day headers all kept one line.
- Every figure in the mock-up (bookings, guests, money, counts) is a made-up example for an invented business. The IPMA warning line only shows the form a source line takes; it is not a reading, and the mock-up says so.

Build rules from earlier rounds still hold: static HTML, CSS and vanilla JS modules; system font stacks only; no third-party scripts, fonts or styles; no form `action`; nothing a visitor types leaves the browser. The simulation (`cc.sim.v1`), the policy guard (`sim/abp.js`) and the 13 sections stay as they are. This proposal changes how the admin looks. Three word changes come with it, each a decision of the conductor's: the assistants' names (answer 1), the Reset words (answer 4) and the chooser's own words.

## 1. What changes, in one list

1. `admin.css`: the 45 colour literals that sit in rules outside the token definitions become tokens (63 distinct values in the file, counting the definitions). A theme then only has to set tokens. Ledger is proven unchanged before and after (2.2, 2.8, 2.9).
2. Five theme files `src/assets/admin-themes/<slug>.css`, each holding tokens for light and dark and a few layout rules, and each scoped to `:root[data-design="<slug>"]` (2.3, 5 to 9).
3. A small boot script that sets `data-design` (and, in a `/play/` frame showing a `/d/` design, `data-theme="light"`) on `<html>` before the first paint (2.4).
4. A "Design" chooser in the admin's title row, with the choice kept in localStorage under `cc.admin.design.v1`. Reset clears it (2.5).
5. `/play/`: a design chooser that sets both frames, so the visitor design and the matching admin show side by side (3).
6. A 12 px type floor on the admin page in every design, Ledger included (4.1).
7. The assistants named as `/agents/` names them, everywhere (4).
8. A `data-pin` attribute on home rows in the calendar, the occupancy strip and the tourist-tax table (2.7, 8).
9. Two tests that `release.sh` runs: the five designs, and Ledger unchanged (10).

## 2. Architecture: one admin, five themes

### 2.1 Choice

Cheapest sound option: **one admin markup and one set of scripts, with five theme stylesheets**. The 13 sections are drawn by `ops.js` and `biz.js` from one set of class names (`.kpi`, `.panel`, `.tbl`, `.stopped`, `.lcard`, `.note-box` and the rest). A theme changes tokens (colour, type, radius, row padding, figure size) and adds 20 to 50 layout rules, such as rules, borders, a tile strip or panel headers. It never changes words. The one markup change is the `data-pin` attribute (2.7), the same in every design.

| Option | Files | Rough lines | Risk |
|---|---|---|---|
| A. Five copies of the admin (HTML, CSS, JS) | about 30 | about 7,000 | five places to fix every bug; labels drift apart; the policy guard copied five times |
| B. One markup, per-design templates in JS | about 8 | about 1,500 | every section's HTML forked; the reviewer has to check five versions of each section |
| **C. One markup, five theme stylesheets (proposed)** | **14 new or changed, with tests** | **about 900** | a theme can only restyle, so it cannot drop a label; one place for the guard |

Option C keeps every label in every design by construction: the words live in one place, and CSS cannot remove them (2.7 forbids hiding label classes, and the test in section 10 checks).

### 2.2 Tokens in `admin.css`

Two kinds of token.

**Theme tokens (a theme sets them).**
- Surfaces and text: `--a-bg`, `--a-surface`, `--a-ink`, `--a-ink2`, `--a-line`, `--a-today`.
- Sidebar: `--a-side`, `--a-side-ink`, `--a-side-lab`, `--a-active`, `--a-mark` (the current-section mark), `--a-side-cur-ink`, `--a-side-focus`, `--a-side-rule`.
- Links, panel headers and counts: `--a-accent` (links), `--a-head` and `--a-head-ink` (the panel header band, transparent by default), `--a-pill`, `--a-pill-ink`.
- "Needs action": `--a-hot` and `--a-hot-ink` (the urgent pill and the warn tile edge; today's `--a-warn`). See the rule in 2.3.
- Type and density: `--f-head`, `--f-text`, `--f-num`, `--row` (table cell padding), `--rad` (corner radius) and `--kv` (tile figure size).
- The site chrome's own tokens (`--bg`, `--ink`, `--band-bg`, `--band-ink`, `--accent`) are set too, the same way the `/d/` designs set them, so the band, header and footer follow the design.

**Meaning tokens (no theme may change them).** One colour means one thing across the site and across all five designs, as round 4 section 10 set out. These keep their round 3 and round 4 pairs in light and dark:
- allow, ask and deny: `--m-allow-edge`, `--m-ask-edge`, `--m-deny-edge` and the decision chips;
- the warn and ok chips: `--a-wbg` and `--a-wink` ("due", "late", "clean by 13:00", the note-box), `--a-ok` and `--a-ok-ink` ("in house", "done", "key returned"), moved here from the theme list at review;
- real, simulated, invented and AI-generated; ASSUMPTION (`--m-assum-bg`, `--m-assum-ink`); how sure (high, medium, low, unknown);
- booking kinds (yours, direct, from a booking platform, block, background, tour);
- the alert discs (W, S, L, I, B);
- the chart series (`#2a78d6`, `#eb6834`, the dataviz reference palette);
- the real-data underline.

The default (no `data-design`, or `ledger`) is today's admin, named **Ledger** in the chooser so all six have a name. Ledger's own values are exactly today's (2.9).

### 2.3 The theme files

`src/assets/admin-themes/revista.css`, `azulejo.css`, `linho.css`, `costa.css`, `postal.css`. Each has the same shape:

```css
/* tokens, light */
:root[data-design="revista"]{ --a-bg:#FAF8F3; ... --f-head:...; --row:7px; --rad:0; --kv:1.7rem }
/* tokens, dark: twice, as admin.css does, for the system setting and for the site's own switch */
@media (prefers-color-scheme:dark){ :root[data-design="revista"]:not([data-theme="light"]){ ... } }
:root[data-design="revista"][data-theme="dark"]{ ... }
/* a sentinel the admin reads to know the file arrived (2.6) */
:root[data-design="revista"]{ --a-theme-ok:revista }
/* layout rules: 20 to 50, only on existing classes */
[data-design="revista"] .kpis{ ... }
```

`src/admin/index.html` links all five after `admin.css`. Each file is small (2 to 4 KB, under 1.5 KB compressed), and only the chosen one matches, so the cost of loading the others is a few kilobytes. In return there is no script-inserted stylesheet and no flash of the wrong design.

**The "needs action" rule.** A theme's `--a-hot` must be at least 1.5:1 (WCAG contrast ratio) from each of the allow, ask and deny edge colours (`#2E7D4F`, `#C08A00`, `#B42318`), in light and dark, so an urgent pill never reads as a decision. All five themes now use their ink for it (section 11 gives the ratios). Ledger keeps today's `#B4530F` (2.9); see question 1.

### 2.4 Boot script

`src/assets/js/admin/design-boot.js` is a classic (non-module) script of about 25 lines, linked in `<head>` before the stylesheets apply. It does four things:

1. **Read `?design=` from the address.** If it is one of the six names, it uses it for this view only and does not store it.
2. **Otherwise read `cc.admin.design.v1`** from localStorage, inside try and catch.
3. **Fall back.** If the value is unknown or missing, it uses `ledger` and removes an unknown stored value.
4. **Set `document.documentElement.dataset.design`.** If the address has both `embed` and `theme=light`, it also sets `data-theme="light"` for this view only. It never stores that, and without `embed` it ignores `theme`.

It reads nothing else and sends nothing.

### 2.5 The chooser

The chooser sits in the admin title row, to the left of the home filter: `<label>Design <select id="adm-design">`. It has six options: Ledger (main), Revista, Azulejo, Linho, Costa, Postal. It is a native `select`, so it works by keyboard and with screen readers without extra code.

On change it does three things:
- sets `data-design`;
- writes `cc.admin.design.v1`;
- announces "Admin design: Revista. The visitor's matching design is at /d/revista/." in the existing `#adm-result` status line.

A link "See the matching visitor design" follows the select; for Ledger it links to `/`.

- **Reset clears the choice** (conductor's answer 4: "Reset clears everything this site keeps, with no exception"). In `modes/chrome.js`:
  - `KEPT_KEYS` gains `'cc.admin.design.v1'`;
  - `RESET_WORDS` becomes "This deletes, in this browser only: your simulation (bookings, messages, the admin's changes), your stay plan, your cost assumptions, your best scores, your admin design, and a tour's saved copy if one is waiting. Real data is read again.";
  - the admin and `/play/` listen for the existing `cc-reset` event and go back to Ledger at once.

  `tests/round4.test.mjs` asserts the exact list and words today. The developer updates those two expected values in the same commit: that records the conductor's decision and does not weaken the check.
- **Embedded** (`/admin/?embed`, inside `/play/`): the chooser is hidden, because `/play/` chooses for both frames (3), and the frame's address carries `&design=` (and `&theme=light` for a `/d/` design).
- The About panel's list of what this browser keeps names the key.

### 2.6 Failure states of the architecture

| What fails | What the reader sees |
|---|---|
| localStorage blocked (private window, blocked site data) | The chooser still works for this page view. Under it: "Kept for this page only: this browser is not keeping data." This uses the `S.persistent` flag the band already uses. |
| A theme file does not arrive (404, slow, blocked) | The admin reads `--a-theme-ok`. If it is not the chosen slug after `load`, the page shows Ledger, sets the select back, and says in the status line: "The Revista styles could not be loaded; showing the main admin design." Nothing is hidden: Ledger is complete on its own. |
| Unknown value in storage or address | Ledger, and the stored value is removed (2.4). |
| Reset in another tab or frame | The `storage` event for `cc.admin.design.v1` (now removed) sets Ledger in every open admin. |
| JavaScript off | The admin is JavaScript-only today and its `noscript` message stays. With the boot script off too, the page is Ledger. |
| A font in the stack is missing | Each stack ends in a generic family (serif, sans-serif, monospace). The look degrades to a plain face, never to a downloaded one. |
| Windows high-contrast (forced colours) | Every theme keeps borders on tiles, panels and tables, so structure survives when backgrounds are dropped. Themes add no `forced-color-adjust`. |

### 2.7 What a theme may and may not do

**May:**
- set theme tokens;
- set borders, rules, padding, radius, shadows, letter-spacing, and text-transform on headings and labels;
- draw decoration with `::before` and `::after`. The only text allowed is Costa's pin number, `content: attr(data-pin) / ""`: the number comes from a `data-pin` attribute that `ops.js` and `biz.js` write on each home's row (1 Salt, 2 Lagoon, 3 Hill, 4 Harbour, 5 Cape) in every design. The empty alternative text keeps it from being read aloud, and the home's name is always written beside it.

**May not:**
- hide label classes (`.k`, `.d`, `.sure`, `.src`, `.note-box`, `.res`, `.whose`, `.untr-q`, `.disclaimer`, `.band`, `.adm-who`, `.srcn`, the "simulated" and "invented" badges), set them under 12 px, or recolour them;
- change meaning tokens;
- use `display:none` on anything but decoration;
- put any other text in pseudo-elements;
- set `position:fixed` over content;
- animate.

### 2.8 The 45 colour uses in rules, and the token for each (review must 5)

Each value stays exactly as it is in Ledger. "M" is a meaning token, "T" a theme token. Values whose dark form differs today keep their dark form inside the same token.

| Rule in `admin.css` | Property | Value today | Token |
|---|---|---|---|
| `.adm-side a[aria-current]` | border-left-color | `#E8875E` | T `--a-mark` |
| `.adm-side a[aria-current]` (900 px) | border-bottom-color | `#E8875E` | T `--a-mark` |
| `.adm-side a[aria-current]` | color | `#fff` | T `--a-side-cur-ink` |
| `.adm-side a:focus-visible` | outline | `#7EC8DF` | T `--a-side-focus` |
| `.pill` | background | `#3A4A5B` | T `--a-pill` |
| `.pill` | color | `#fff` | T `--a-pill-ink` |
| `.adm-who` | border-top | `#3A4A5B` | T `--a-side-rule` |
| `.pill.hot` | background | `#B4530F` | T `--a-hot` (Ledger value) |
| `.res-allow` | border-left-color | `#2E7D4F` | M `--m-allow-edge` |
| `.res-ask` | border-left-color | `#C08A00` | M `--m-ask-edge` |
| `.res-deny` | border-left-color | `#B42318` | M `--m-deny-edge` |
| `.btn-s.danger` | border-color | `#B42318` | M `--m-deny-edge` |
| `.btn-s.danger` | color | `#B42318` | M `--m-deny-text` (same value; see question 2) |
| `.flag` | color | `#B42318` | M `--m-deny-text` |
| `.untr-q` | border-left | `#B42318` | M `--m-deny-edge` |
| `.kpi.hi` | border-left | `#2a78d6` | M `--m-series-1` |
| `.vfill` | background | `#2a78d6` | M `--m-series-1` |
| `.disc` | color | `#fff` | M `--m-disc-ink` |
| `.disc` | background | `#4E5966` | M `--m-disc` |
| `.d-W` | background | `#0E5A72` | M `--m-disc-w` |
| `.d-S` | background | `#B4530F` | M `--m-disc-s` |
| `.d-L` | background | `#7A4A00` | M `--m-disc-l` |
| `.d-I` | background | `#B42318` | M `--m-disc-i` |
| `.d-B` | background | `#1E3A8A` | M `--m-disc-b` |
| `.oc-h.real` | border-bottom-color | `#2E7D4F` | M `--m-real-edge` |
| `.ul` | border-bottom | `#2E7D4F` | M `--m-real-edge` |
| `.oc-b.direct` | border | `#7FA6D9` | M `--m-book-edge` |
| `.oc-b.yours` | background | `#1E3A8A` | M `--m-yours-bar` (not `--a-yours`, whose dark value differs) |
| `.oc-b.yours` | color | `#fff` | M `--m-yours-bar-ink` |
| `.sw.yours` | background | `#1E3A8A` | M `--m-yours-bar` |
| `.oc-b.platform` | background (stripe) | `#D5C6EC` | M `--m-plat-stripe` |
| `.oc-b.platform` | border | `#A58BD0` | M `--m-plat-edge` |
| `.sw.platform` | background (stripe) | `#B9A3DE` | M `--m-plat-swatch` |
| `.oc-b.block` | border | `#C9A400` | M `--m-block-edge` |
| `.oc-b.tour` | background | `#1F2328` | M `--m-tour` |
| `.oc-b.tour` | color | `#fff` | M `--m-tour-ink` |
| `.oc-b.tour` | border | `#FBE7A1` | M `--m-tour-ring` |
| `.sw.tour` | background | `#1F2328` | M `--m-tour` |
| `.sw.tour` | outline | `#FBE7A1` | M `--m-tour-ring` |
| `.k.assum` | background | `#DDF0F4` | M `--m-assum-bg` |
| `.k.assum` | color | `#0E4A5C` | M `--m-assum-ink` |
| `.k.assum` (dark, system) | background | `#134652` | M `--m-assum-bg` (dark) |
| `.k.assum` (dark, system) | color | `#DDF0F4` | M `--m-assum-ink` (dark) |
| `.k.assum` (dark, switch) | background | `#134652` | M `--m-assum-bg` (dark) |
| `.k.assum` (dark, switch) | color | `#DDF0F4` | M `--m-assum-ink` (dark) |

The other 18 distinct values in the file are token definitions already (`--a-bg`, `--a-book` and the rest, light and dark). They keep their names: the ones listed in 2.2 as meaning tokens become meaning tokens by rule, with no change of name or value.

### 2.9 Proof that Ledger is unchanged (review must 5)

Order of work:

1. **Baseline, before any change.** On the current build, after "Load example activity (simulated)", for all 13 sections, at 390 and 1366 px, light and dark (52 views), record:
   - the computed `color`, `background-color`, `background-image`, `border-top/right/bottom/left-color`, `outline-color`, `box-shadow`, `fill` and `stroke` of every element, into `tests/fixtures/ledger-colours.json` (keyed by section, width, mode and a stable element path);
   - a PNG screenshot of each view at deviceScaleFactor 1. The SHA-256 of each PNG goes into `tests/fixtures/ledger-shots.json`, together with the Chromium version and platform.
2. **Token refactor (2.2, 2.8).** With no `data-design`, require zero differences in both fixtures. Record the counts (elements compared, views compared, differences: 0) in team/rounds/5/build/.
3. **Type floor (4.1).** This step changes sizes on purpose, so the screenshot fixture is re-recorded in the same commit, with the reason in the build notes. The colour fixture must still show zero differences.
4. **Themes, chooser, `/play/`.** Both fixtures must still show zero differences for Ledger.

`tests/ledger-unchanged.test.mjs` holds the comparison. The colour check always runs. The screenshot check runs only when the Chromium version and platform match the fixture, and says so when it skips.

## 3. `/play/`: the visitor design and the matching admin side by side

`/play/` already shows `frame-v` (the visitor) and `frame-a` (`/admin/?embed`) with the ticker between them. Add one control to the view-toggle row:

`<label>Design <select id="play-design">`, with options "Main site with the Ledger admin", "Revista, both sides", "Azulejo, both sides", "Linho, both sides", "Costa, both sides", "Postal, both sides".

On change:
- **Visitor frame:** `frame-v.src` becomes `/` for main, or `/d/<slug>/`. The pane's "Home page" button follows.
- **Admin frame:** `frame-a.src` becomes `/admin/?embed&design=<slug>&theme=light` for a `/d/` design, and `/admin/?embed&design=ledger` for the main pairing. The frame reloads; the simulation is in localStorage, so nothing is lost.
- **Addresses:** the panes read "/d/revista/ · you are the visitor" and "/admin/ · Revista design · you are the owner".
- **"Open in its own tab":** the links carry the design (`/d/revista/`, `/admin/?design=revista`), but not `theme`, so the admin opened alone follows the reader's scheme.
- **Stored choice:** the choice is written to `cc.admin.design.v1`, so the admin opened on its own afterwards matches. The play page starts from the stored choice, and goes back to the main pairing on Reset.

**Light and dark (conductor's answer 2).** The `/d/` visitor designs are light only, so when `/play/` shows one, the admin frame follows it in light (`theme=light`, read by the boot script for that frame only, 2.4). The main pairing passes no `theme`, so both frames keep following the reader's colour scheme, as today.

**What the reader must be told.** The five visitor designs restyle the home page only (round 2, PROPOSAL.md question 2). A home's own page, the booking flow and "your stay" are in the main design. One line under the frames says: "The five designs restyle the visitor's home page and the whole admin. A home's own page and the booking flow are in the main design in every case."

**At 390 px** `/play/` already stacks the panes and offers "Visitor only" and "Admin only"; the design select sits above them, full width. **Failure:** if `/d/<slug>/` cannot be read, the existing frame failure line is used ("This page could not be shown inside the frame"); the admin frame still shows its design.

Cost: `src/play/index.html` +8 lines, `src/assets/js/play/play.js` about +45 lines, `src/assets/play.css` about +10 lines.

## 4. Common to all five designs

- **Same simulation, same guard, same 13 sections**: Today, Bookings, Calendar, Cleaning, Stock, Issues, Messages, Reviews (Operations); Rates and rules, Money, Legality, Integrations (Business); Policies (Agents). Same counts in the pills, same order, same hash routes.
- **Labels that stay, word for word, in every design** (the test in 10 checks each; it reads `textContent`, so Linho's capitals do not matter):
  - the band: "**Made-up example.** The back office of an invented business ...", with "Not legal or tax advice" and the warning when the browser keeps nothing;
  - the "SIMULATED", "INVENTED", "REAL" and "ASSUMPTION" chips, "SIMULATED HISTORY" and "SIMULATED REVIEW";
  - "Signed in as the owner" with "Helena (invented person)", as today (conductor's answer 5; the first mock-up's "an invented person" is corrected);
  - the decision chips "ALLOW", "ASK" and "DENY" with the rule id, in the result line and in the policy log drawer;
  - the assistants, named as `/agents/` names them (conductor's answer 1): "Claude, the host's assistant (simulated)" and "Claude, the guest's assistant (simulated)". The details are below;
  - Money: "Simulation for an invented business. Not tax or legal advice; check with a certified accountant.", and the source note of every assumption;
  - Legality: the source, checked date and how-sure columns, "A simulation, not legal or tax advice", and the research's words as written;
  - every live figure's source line: holder (IPMA, Instituto Português do Mar e da Atmosfera), file id, via data.promptugal.news, read time and age, terms, and a link to the source card. Also the failure words: "IPMA's figures could not be read just now" and "The rules could not be read just now";
  - "Injection flagged" and the quoted untrusted text, shown as material.
- **The assistants' names, in detail** (writer and developer):
  - In `modes/chrome.js`, `ACTOR_NAMES` changes `'host-assistant'` to "Claude, the host's assistant (simulated)" and `'guest-assistant'` to "Claude, the guest's assistant (simulated)".
  - In `admin/ops.js`, `ACTOR_WORDS` changes the same two entries to the same strings. A sentence then reads "Claude, the host's assistant (simulated) tried to refund EUR 5,000 (review r-2)".
  - The person stays apart from the assistant: `visitor` stays "visitor" and "A visitor", and a guest's own words stay "the guest" or "the guest's message". The guest is a person, not Claude.
  - The new names reach every mode page's policy drawer, the `/play/` ticker and `/world/`. At 390 px, the drawer's one-line summary (`.pd-last`) must still be one line ending in an ellipsis, and the ticker items must wrap without sideways scroll. The test in 10 checks both.
- **Focus**: 3 px outline in the design's ink, 2 px offset; in dark sidebars, the side ink. Contrast against every background it sits on is at least 3:1 (it is the text ink, so at least 6:1).
- **Density** is a token, not a new layout: `--row` sets table cell padding, `--kv` the tile figure size. From densest to most open: Costa (row 4 px), Ledger (6), Azulejo (6), Postal (6), Revista (7), Linho (11).
- **390 px**: the sidebar becomes the sticky, sideways-scrolling bar it is today in every design; tiles go two across; wide tables and the calendar scroll inside their own box (`.tscroll`, `.oc-scroll`), never the page; Legality's row table becomes cards (`.lcards`), as round 4 built. 16 px side gutters.
- **Never**: no design imitates a booking platform's back office, a real accounting product, a real magazine, a real tile maker or IPMA. No platform brand names; "a booking platform" as today.

### 4.1 The 12 px floor (review must 1; conductor's answer 3)

No text on the admin page renders under 12 px in any design, Ledger included, and no test has an exception. This covers every label, tile label, sidebar group label, table header, chip, pill, legend, occupancy day header and bar label, and the drawer's chips while on `/admin/`.

Ledger has nine rules under 12 px in `admin.css` today:
- `.adm-gt`, `.pill`, `.adm .chip`, `.oc-b`, `.vmark span` and `.sure`, at .72 to .74 rem;
- `.oc-h span`, at .68 rem;
- the chart axis labels `.chart .ax` and `.chart .lab`, at 10 and 11 px.

In `modes.css`, the `.k` and `.d` chips are 11 px. All of these go to 12 px (`.75rem`, or 12 px in the SVG charts, with the axis ticks thinned where 12 px labels would collide) on the admin page through `.mode-admin` rules, in step 3 of 2.9. Whether the chips go to 12 px on the other mode pages as well is question 3.

In the mock-up, every theme now renders nothing under 12 px at 390 and 1366, in light and dark (measured in Chromium).

## 5. Revista admin: the editor's desk

**One line.** The admin as the magazine's back room: ruled columns, a serif headline per section, figures set like a contents page.

**Palette.**

| Token | Light | Dark |
|---|---|---|
| bg | `#FAF8F3` paper | `#1A1917` |
| surface | `#FFFFFF` | `#22201D` |
| ink | `#1C1B19` | `#F2EEE6` |
| ink2 | `#5C5850` | `#B8B1A4` |
| line | `#D8D1C3` | `#3D3933` |
| sidebar | `#F0ECE3` column, ink text | `#141311`, `#E8E2D6` text |
| accent (links, current mark) | `#8E3A1E` | `#EBA683` |
| pill | `#E2DACB` with ink | `#3D3933` with `#F2EEE6` |
| urgent pill and warn rule (`--a-hot`) | ink `#1C1B19` with paper text | `#F2EEE6` with `#1A1917` |
| band | `#EFE3C2` with ink | `#3A3220` with `#F2EEE6` |

The urgent pill is ink, not the link colour (review should 5), so links and alerts stay apart; the count and its word carry the meaning.

**Type.** Headings and figures `"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua","URW Palladio L",Caladea,Georgia,serif`, weight 400; section h1 32 px, panel h2 19 px italic. Tables and body text `"Avenir Next","Segoe UI",Inter,"Helvetica Neue",Arial,sans-serif` (the visitor design's label face, so tables stay readable at 13 px). Tile labels and table headers uppercase, 12 px, 0.06 to 0.08 em tracking. Source lines italic in the serif, 12 px.

**Density.** Comfortable: row 7 px, tile figure 27 px.

**Sidebar.** Paper column with a double rule on its right, like a page gutter; the current section in italic with an accent bar.

**Today tiles.** No boxes: a strip between two ink rules, tiles separated by hairlines, like a contents line. A warn tile gets a 3 px ink rule on top, and its word ("1 urgent") still says why.

**Tables.** Horizontal rules only; a double rule under the header row; headers in uppercase. Numbers right-aligned in tabular figures.

**Policy panel.** The result line is a boxed notice with a 1 px ink border and the deny-red left edge. "What the agents were stopped from doing" has a serif italic headline over a 2 px ink rule, with the quoted text set off by the red rule as today. On Policies, each policy is a ruled entry, with the rule id in the mono face.

**Money.** The nine-tile strip as on Today; charts keep the series colours, with gridlines in `--a-line` and labels in ink. The profit and loss table gets the double rule under the header and a 2 px ink rule above the totals, like a printed account. The note-box keeps the meaning warn colours.

**Legality.** Row table with rules only; the how-sure chips unchanged; the Source column in the italic serif.

## 6. Azulejo admin: the tile board

**One line.** Cobalt and white: a tile strip across the top, square tiles with a quarter-tile corner, panel headers as cobalt bands.

**Palette.**

| Token | Light | Dark |
|---|---|---|
| bg | `#F6F8FC` | `#0D1630` |
| surface | `#FFFFFF` | `#142146` |
| ink | `#14306E` | `#E8EEFA` |
| ink2 | `#3D4F75` | `#B3C1E0` |
| line | `#B9C8E6` | `#2C3E6E` |
| sidebar | `#14306E`, white text, labels `#C9D6F0`, current `#1F4FA3` | `#0A1126`, `#E8EEFA`, labels `#A9B9DC`, current `#22408A` |
| accent | `#1F4FA3` | `#A8C1F5` |
| panel header | `#1F4FA3` with white | `#22408A` with white |
| pill | `#DCE6F7` with ink | `#22408A` with white |
| urgent pill and warn edge (`--a-hot`) | ink `#14306E` with white | `#E8EEFA` with `#0D1630` |
| band | `#DCE6F7` with ink | `#1A2A55` with `#E8EEFA` |

The first version's ochre `#7A4A00` urgent pill is gone: it was 1.48:1 from the allow edge and 1.14:1 from the deny edge, under the 1.5 rule.

**Type.** Headings `Optima,Candara,"Gill Sans","Gill Sans MT","Noto Sans","Segoe UI",Carlito,sans-serif`, uppercase with 0.08 em tracking for the h1, panel headers and tile labels; text `"Gill Sans","Gill Sans MT",Calibri,Carlito,"Segoe UI",system-ui,sans-serif`.

**Density.** Medium: row 6 px, tile figure 23 px.

**The tile.** The team's own 48 x 48 SVG from `/d/azulejo/style.css` (drawn by the team, copies no real tile), as a 14 px strip across the top of the main column. It is decoration (no text, no meaning) and stays at 390.

**Today tiles.** White squares with a 2 px cobalt border and a filled quarter-circle in the top right corner. A warn tile has a 6 px ink left edge plus its word.

**Tables.** The header row on pale blue `#DCE6F7` with ink text; cobalt rules; numbers in tabular figures.

**Policy panel.** The stopped panel sits under a cobalt header band "WHAT THE AGENTS WERE STOPPED FROM DOING", with its links in white, underlined. The result line keeps its decision-colour edge. Policies are tile cards in a grid.

**Money.** Cobalt header bands on each chart and table. The chart series stay blue and orange, and the blue series sits on white, so it does not merge with the cobalt (4.42:1 against white, above the 3:1 needed for a mark). The totals row is ruled in cobalt.

**Legality.** Header band per legal section; how-sure chips unchanged. The "checked" date is in ink2.

## 7. Linho admin: the concierge's book

**One line.** Quiet and open: linen and black, spaced capitals, large thin figures, hairlines, the fewest boxes of the five.

**Palette.**

| Token | Light | Dark |
|---|---|---|
| bg | `#F4F1EB` linen | `#121211` |
| surface | `#FBFAF7` | `#1B1A18` |
| ink | `#141414` | `#EFEBE3` |
| ink2 | `#5E5A53` | `#ABA59A` |
| line | `#D6CFC2` | `#34312C` |
| sidebar | the page colour, ink text, hairline on its right | the same |
| accent (links, underlined) | `#7B5B34` sand | `#D2B48A` |
| pill | outline only, ink text | the same |
| urgent pill and warn rule (`--a-hot`) | ink with linen text (inverted) | `#EFEBE3` with `#121211` |
| band | `#E7E0D3` with ink | `#26231F` with `#EFEBE3` |

**Type.** Headings and figures `Didot,"Bodoni 72","Bodoni MT","Noto Serif Display","DejaVu Serif",Georgia,serif`, weight 400; h1 42 px (30 px at 390), panel h2 22 px. Text and labels `"Helvetica Neue",Helvetica,Inter,Arial,sans-serif`. Sidebar links, sidebar group labels, tile labels and table headers: uppercase, **12 px, 0.12 em tracking** (the first version had 10 to 11 px with 0.2 em; tracking is reduced so the larger size still fits).

**Checked at 390 px in the mock-up.**
- The Today tiles go two across. The longest label, "HOMES OCCUPIED TONIGHT", takes two lines; every other label fits on one. The figures do not wrap.
- The 14 occupancy day headers keep one line.
- The sidebar bar scrolls inside itself, as in every design.

**Density.** The most open: row 11 px, tile figure 32 px, 34 px between columns. The eight Today tiles go four across in two rows at 1366, so the figures can be large.

**Sidebar.** No fill; spaced capitals; the current section underlined (1 px, 5 px offset), not filled.

**Today tiles.** No boxes: each tile is a hairline above a label and a large thin figure. A warn tile's hairline turns ink, and its word says why.

**Tables.** Hairlines; spaced capital headers at 12 px with 0.12 em tracking; generous rows.

**Policy panel.** A 1 px ink rule over a Didot headline; the quoted text keeps its red rule. Linho is the calmest design, so the deny-red edge stands out more here than anywhere else, as it should.

**Money.** Charts on the linen with hairline gridlines; the P&L table in hairlines with an ink rule above totals; the note-box keeps the meaning warn colours.

**Legality.** Above 640 px the row table stays, in hairlines; under it, hairline cards.

## 8. Costa admin: the chart room

**One line.** The coast's working room: deep-sea sidebar, white panels on a pale sea, mono figures, numbered home pins, the densest of the five.

**Palette.**

| Token | Light | Dark |
|---|---|---|
| bg | `#EEF6F8` pale sea | `#08171C` |
| surface | `#FFFFFF` | `#0F242B` |
| ink | `#10252D` | `#E3F1F4` |
| ink2 | `#3F5961` | `#A7C2C9` |
| line | `#C9D9DD` | `#24434C` |
| sidebar | `#0B4F63` deep, white text, labels `#BFE0E8`, current `#06394A` | `#061115`, `#E3F1F4`, labels `#9FBCC4`, current `#123844` |
| accent | `#0B4F63` | `#7FCBDD` |
| table header | `#F5EBD6` land with ink | `#2A2618` with `#F5EBD6` |
| tile stripe | `#A9D3DE` sea | `#2F7F94` |
| urgent pill and warn stripe (`--a-hot`) | ink `#10252D` with white | `#E3F1F4` with `#08171C` |
| home pins | `#0B4F63` with white digits and a white ring | the same |
| band | `#FBE7A1` with ink | `#3A3214` with `#FBE7A1` |

**What changed at review (must 2).** The first version used `#A63D17` for the pins, the warn stripe and the urgent pill. That is 1.03:1 against the deny red `#B42318`, so to the eye it is the same colour, and a reader would have seen refusals where there were none.
- **Pins** are now deep sea `#0B4F63`, which is blue against the red: white digits on it are 9.08:1.
- **The warn stripe and the urgent pill** are ink. Ink is 9.86:1 against the normal sea stripe in light, and 3.96:1 in dark, so a warn tile still stands out, and its word says why.

**Type.** Headings `ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Segoe UI",Inter,system-ui,sans-serif`; text `system-ui,-apple-system,"Segoe UI",Inter,Roboto,Arial,sans-serif`; figures, dates and number cells `ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,"JetBrains Mono",monospace` with tabular numbers.

**Density.** The densest: row 4 px, tile figure 22 px, 13 px table text.

**Sidebar.** Deep sea, with the current section as a pill shape running to the right edge.

**Today tiles.** White, 10 px radius, a 5 px sea stripe on top; a warn tile's stripe is ink, and its word says why.

**Tables.** Land-coloured header row, mono numbers. The calendar and occupancy rows carry the home's pin number (1 Salt, 2 Lagoon, 3 Hill, 4 Harbour, 5 Cape, west to east as in `/d/costa/`) in an 18 px deep-sea disc with a white ring, digits at 12 px, before the name:
- the number comes from the row's `data-pin` attribute, `content: attr(data-pin) / ""` (2.7, review should 1);
- the name is always written as well, and screen readers hear only the name.

**Policy panel.** A dashed rule under the panel head, like a chart's margin line; refusal times in mono.

**Money.** Mono figures throughout the tiles and the P&L table; chart labels in mono; series colours unchanged.

**Legality.** Land header row. The municipal tourist tax table puts the pin number beside each municipality where a home sits in it, from the same `data-pin` attribute.

## 9. Postal admin: the sorting office

**One line.** Warm and handled: terracotta sidebar, panels as cards with a mustard header and a dashed edge, a small stamp on every tile.

**Palette.**

| Token | Light | Dark |
|---|---|---|
| bg | `#F3E9D8` | `#1E1712` |
| surface | `#FFFDF8` card | `#2A211A` |
| ink | `#2A1F17` | `#F5EBDD` |
| ink2 | `#5E4B3C` | `#C9B6A2` |
| line | `#DCCDB4` | `#4A3A2D` |
| sidebar | `#A3361F` terracotta, white text, labels `#FBE3DA`, current `#7F2716` with a mustard edge | `#4A1A10`, `#F5EBDD`, labels `#E3C3B6`, current `#6E2A1A` |
| accent | `#A3361F` | `#F0A08A` |
| panel header | `#F2D27A` mustard with ink, dashed terracotta edge under it | `#3E300C` with `#FBEFC8` |
| pill | card colour with ink | `#F5EBDD` with `#2A1F17` |
| urgent pill and warn edge (`--a-hot`) | ink with card colour | `#F2D27A` with ink |
| band | `#F2D27A` with ink | `#3E300C` with `#FBEFC8` |

The warn tile edge was terracotta in the first version, the same family as the deny red. It is now ink (`--a-hot`), for the same reason as Costa. The terracotta sidebar and links stay: they are not decisions.

**Type.** Headings and figures `Rockwell,"Roboto Slab","Zilla Slab","DejaVu Serif",Georgia,serif`, 700; text `Charter,"Bitstream Charter",Cambria,Caladea,Georgia,serif`; sidebar group labels, tile labels and table headers `"Avenir Next Condensed","Arial Narrow","Liberation Sans Narrow",Arial,sans-serif`, uppercase.

**Density.** Medium: row 6 px, tile figure 22 px (figures never wrap: `white-space:nowrap`, found in the mock-up at 1366, where "€6,840" broke).

**Today tiles.** Cards with a light shadow (none in dark mode) and a 14 x 17 px stamp, drawn in CSS, in the bottom right corner (decoration only). A warn tile has a 5 px ink left edge plus its word.

**Tables.** Condensed uppercase headers; rules in `--a-line`.

**Policy panel.** A card with the mustard header; the result line has an 8 px decision-colour edge, the widest of the five, to suit the heavier type.

**Money.** Each chart and table is a card with a mustard header; the note-box keeps the meaning warn colours. Chart series unchanged; orange `#eb6834` on the card colour is 3.15:1, above the 3:1 needed for a mark, with values written beside the bars as today.

**Legality.** Cards at every width under 640 px, as today; headers mustard.

## 10. Tests (for the developer; review must 6 and should 2)

`scripts/release.sh` runs `node --test tests/*.test.mjs`, so both tests are named `*.test.mjs`. `release.sh` is the conductor's gate and is not changed.

**Shared set-up.**
- **Serving:** each test serves `_site` itself on a free port, using `node:http` and a few lines of static serving.
- **Without Playwright:** if `require('playwright')` fails, the test reports a skip with the reason "Playwright is not installed: the admin design checks did not run". It uses `test(name, { skip: reason }, fn)`, so the skip shows in the output and is never silent. (No test in `tests/` uses Playwright yet; the review mentions a live test that does, which I did not find. This sets the pattern.)
- **Speed:** one browser and one context per design. Hash navigation moves between the 13 sections without reloads. Light and dark come from `colorScheme` on the context. The run is 6 designs x 2 widths x 2 modes.

**`tests/admin-designs.test.mjs`** (about 150 lines). For each of the six designs (Ledger, Revista, Azulejo, Linho, Costa, Postal), at 390 and 1366 px, light and dark, after "Load example activity (simulated)", for all 13 sections, it checks:
1. **No sideways scroll:** `scrollWidth <= innerWidth`.
2. **Labels present and visible** (non-zero box, computed opacity 1, read from `textContent`):
   - the band text and "Not legal or tax advice";
   - "SIMULATED";
   - "Helena (invented person)";
   - "Not tax or legal advice" on Money and "not legal or tax advice" on Legality;
   - a source line with "IPMA" and "read" on Today, or the failure words;
   - a DENY chip;
   - "Claude, the host's assistant (simulated)" wherever an assistant acts.
3. **The 12 px floor:** every element that holds its own text node renders at 12 px or more. There is no exception for any design or class.
4. **Contrast at least 4.5:1:** the computed `color` against the nearest opaque background behind that element (walking up the tree, so text on a header band or the band is checked against the band). It covers:
   - links;
   - `.k`, `.d`, `.chip`, `.sure`, `.pill` (count pills, normal and hot), `.btn-s`, `.whose` and `.untr-q`;
   - `.src`, `.kl`, `.kv`, `.ks`, `th` and `td`;
   - sidebar links and labels;
   - the band and its link;
   - text on the panel header bands (Azulejo's white on cobalt, Postal's ink on mustard).
5. **Needs action stays apart from decisions:** each theme's computed `--a-hot` is at least 1.5:1 from `#2E7D4F`, `#C08A00` and `#B42318`. Ledger's value is checked to be today's `#B4530F` (question 1).
6. **Keyboard focus:** tabbing through the page, every focused element shows an outline.
7. **The `/play/` case:** `/play/` with each `/d/` design gives an admin frame whose `<html>` has `data-theme="light"` (in a dark context too). With the main pairing, the frame follows the context's scheme.
8. **The longer names:** on `/admin/` and `/play/` at 390, the drawer's `.pd-last` is a single line (height at most 1.5 times its line height) ending in an ellipsis when it overflows, and the ticker does not scroll sideways.
9. **Reset:** after Reset, `cc.admin.design.v1` is gone and `data-design` is `ledger`.

**`tests/ledger-unchanged.test.mjs`** (about 70 lines): the before-and-after comparison of 2.9, against `tests/fixtures/ledger-colours.json` and `tests/fixtures/ledger-shots.json`.

`scripts/shots.mjs` adds the five admin designs to the `/d/` chooser cards as a second screenshot ("and its admin").

## 11. Contrast (WCAG 2 formula; text needs 4.5:1)

Computed with the WCAG 2 relative luminance formula (script in this agent's scratchpad, not shipped). Meaning-token pairs are unchanged from round 3 section 10 and round 4 section 10 and are not repeated.

| Design | Pair | Light | Dark |
|---|---|---|---|
| Revista | ink on bg | 16.22 | 15.18 |
| | ink on surface | 17.21 | 14.04 |
| | ink2 on bg | 6.67 | 8.25 |
| | ink2 on surface | 7.08 | 7.63 |
| | accent on surface | 7.57 | 7.98 |
| | accent on bg | 7.13 | 8.63 |
| | sidebar ink on sidebar | 14.60 | 14.40 |
| | sidebar label on sidebar | 6.00 | 7.67 |
| | sidebar ink on current | 16.22 | 11.52 |
| | pill ink on pill | 12.40 | 9.91 |
| | urgent pill text on urgent pill | 16.22 | 15.18 |
| | ink on today highlight | 14.54 | 12.32 |
| | warn ink on warn bg | 9.08 | 9.65 |
| | band ink on band | 13.47 | 10.95 |
| Azulejo | ink on bg | 11.77 | 15.36 |
| | ink on surface | 12.52 | 13.51 |
| | ink2 on bg | 7.67 | 9.89 |
| | ink2 on surface | 8.16 | 8.70 |
| | accent on surface | 7.76 | 8.69 |
| | accent on bg | 7.30 | 9.89 |
| | sidebar ink on sidebar | 12.52 | 16.09 |
| | sidebar label on sidebar | 8.56 | 9.51 |
| | sidebar ink on current | 7.76 | 8.32 |
| | white on panel header | 7.76 | 9.68 |
| | ink on table header and pill `#DCE6F7` | 9.96 | (white on `#22408A`) 9.68 |
| | urgent pill text on urgent pill | 12.52 | 15.36 |
| | warn ink on warn bg | 6.76 | 9.63 |
| | band ink on band | 9.96 | 11.98 |
| Linho | ink on bg | 16.34 | 15.77 |
| | ink on surface | 17.65 | 14.63 |
| | ink2 on bg | 6.08 | 7.66 |
| | ink2 on surface | 6.57 | 7.11 |
| | accent on surface | 5.94 | 8.81 |
| | accent on bg | 5.50 | 9.49 |
| | accent on today highlight `#E7E0D3` | 4.72 | n/a |
| | sidebar ink on sidebar | 16.34 | 15.77 |
| | sidebar label on sidebar | 6.08 | 7.66 |
| | ink on current and band | 14.04 | 12.37 (current), 13.16 (band) |
| | urgent pill, inverted | 16.34 | 15.77 |
| | warn ink on warn bg | 7.94 | 9.59 |
| Costa | ink on bg | 14.48 | 15.79 |
| | ink on surface | 15.85 | 13.88 |
| | ink2 on bg | 6.82 | 9.74 |
| | ink2 on surface | 7.47 | 8.57 |
| | accent on surface | 9.08 | 8.79 |
| | accent on bg | 8.29 | 9.99 |
| | sidebar ink on sidebar | 9.08 | 16.52 |
| | sidebar label on sidebar | 6.50 | 9.52 |
| | sidebar ink on current | 12.41 | 10.84 |
| | ink on table header (land) | 13.39 | 12.77 |
| | ink on today highlight `#CFE8EE` | 12.40 | (on `#123844`) 10.84 |
| | white digits on pin `#0B4F63` | 9.08 | 9.08 |
| | urgent pill text on urgent pill | 15.85 | 15.79 |
| | warn stripe against normal stripe (a mark, 3:1) | 9.86 | 3.96 |
| | warn ink on warn bg | 8.36 | 8.77 |
| | band ink on band | 12.87 | 10.35 |
| Postal | ink on bg | 13.36 | 15.01 |
| | ink on surface | 15.81 | 13.38 |
| | ink2 on bg | 6.85 | 9.02 |
| | ink2 on surface | 8.11 | 8.04 |
| | accent on surface | 6.65 | 7.59 |
| | accent on bg | 5.62 | 8.51 |
| | accent on today highlight `#F7EBCB` | 5.70 | n/a |
| | sidebar ink on sidebar | 6.76 | 12.31 |
| | sidebar label on sidebar | 5.51 | 8.81 |
| | sidebar ink on current | 9.53 | 8.86 |
| | ink on panel header and band | 10.92 | 11.20 |
| | pill ink on pill | 15.81 | 13.63 |
| | urgent pill text on urgent pill | 15.81 | 10.92 |

**Needs action against the decision colours** (2.3: at least 1.5:1 from each):

| `--a-hot` | vs allow `#2E7D4F` | vs ask `#C08A00` | vs deny `#B42318` |
|---|---|---|---|
| Revista light `#1C1B19` | 3.41 | 5.64 | 2.62 |
| Revista dark `#F2EEE6` | 4.36 | 2.64 | 5.68 |
| Azulejo light `#14306E` | 2.48 | 4.10 | 1.90 |
| Azulejo dark `#E8EEFA` | 4.33 | 2.62 | 5.65 |
| Linho light `#141414` | 3.65 | 6.03 | 2.80 |
| Linho dark `#EFEBE3` | 4.24 | 2.57 | 5.53 |
| Costa light `#10252D` | 3.14 | 5.19 | 2.41 |
| Costa dark `#E3F1F4` | 4.36 | 2.64 | 5.68 |
| Postal light `#2A1F17` | 3.19 | 5.26 | 2.44 |
| Postal dark `#F2D27A` | 3.43 | 2.08 | 4.47 |
| Ledger, today, unchanged `#B4530F` | 1.01 | 1.64 | 1.31 (question 1) |

Band contrast is at least 9:1 in every design and mode (lowest: Azulejo light, 9.96), the rule the `/d/` designs set in round 2.

Marks, not text (3:1 needed): chart blue `#2a78d6` is 4.42 on white, 3.68 on Revista dark, 3.56 on Azulejo dark and 3.64 on Costa dark; chart orange `#eb6834` is 3.20 on white, 3.15 on Postal's card, 5.43 on Linho dark and 4.93 on Postal dark. Each bar also carries its value as text.

Colour-blind check: in every design, warn tiles and urgent pills carry a word or a count beside the colour, decisions carry their word (ALLOW, ASK, DENY), booking kinds differ by pattern (platform bars are striped, background occupancy is hatched, yours is solid), and Costa's pins carry their number and sit beside the name.

**Found while listing the literals (not caused by this proposal).** In Ledger's dark mode, `.btn-s.danger` text `#B42318` on the dark surface `#1C232B` is 2.41:1, under 4.5:1. The refactor keeps it as it is, because 2.9 requires zero differences. Question 2 proposes the fix as a separate, recorded step.

## 12. Keyboard and 390 px

- Tab order is unchanged by design: band link, header, sidebar sections, chooser, home filter, content. Themes do not reorder (no `order`, no `flex-direction:row-reverse`).
- The chooser is a native `select`: arrow keys change it, and the change is announced in the status line.
- The sticky sideways sidebar at 390 keeps the current section scrolled into view (existing behaviour) and shows its mark as a 3 px bottom border in `--a-mark` in every design.
- Every scrolling box (`.tscroll` with `tabindex="0"` and `role="region"`, the calendar) is reachable by keyboard, as round 4 built.
- Checked in the re-taken mock-up: no sideways page scroll at 390 in any of the five designs (`scrollWidth` 390), in light and dark, with the 12 px floor in place.

## 13. Cost

| # | Change | Files | Rough lines | Reads | Failure state |
|---|---|---|---|---|---|
| 1 | Tokens in `admin.css`, proven unchanged (2.2, 2.8, 2.9) | `src/assets/admin.css` | about 50 changed, 35 new | none | Ledger unchanged when no design is set, checked by row 10 |
| 2 | 12 px floor on the admin page (4.1) | `src/assets/admin.css` | about 12 | none | none |
| 3 | Five theme files (5 to 9) | `src/assets/admin-themes/*.css` | 5 x 70 to 110, about 450 | none | file missing: Ledger and a line saying so (2.6) |
| 4 | Boot script (2.4) | `src/assets/js/admin/design-boot.js` | about 25 | address, `cc.admin.design.v1` | storage blocked: this view only |
| 5 | Chooser, its link, Reset listener (2.5) | `src/admin/index.html` (+8), `src/assets/js/admin/admin.js` (+40) | about 50 | `cc.admin.design.v1` | as 4 |
| 6 | `data-pin` on home rows (2.7, 8) | `src/assets/js/admin/ops.js`, `biz.js` | about 6 | `homes.json` order | none: the name is always written |
| 7 | `/play/` design select and `theme=light` (3) | `src/play/index.html`, `src/assets/js/play/play.js`, `src/assets/play.css` | about 65 | `cc.admin.design.v1`, `/d/<slug>/` | frame failure line, as today |
| 8 | Assistants' names (4) (writer) | `src/assets/js/modes/chrome.js` (`ACTOR_NAMES`), `src/assets/js/admin/ops.js` (`ACTOR_WORDS`) | 4 | none | none |
| 9 | Reset clears the design (2.5) | `src/assets/js/modes/chrome.js` (`KEPT_KEYS`, `RESET_WORDS`), `tests/round4.test.mjs` (the two expected values) | 4 | none | none |
| 10 | Tests (10, 2.9) | `tests/admin-designs.test.mjs`, `tests/ledger-unchanged.test.mjs`, `tests/fixtures/ledger-colours.json`, `tests/fixtures/ledger-shots.json` | about 220, plus generated fixtures | the built `_site` | fails the release; skips with a stated reason without Playwright |
| 11 | Chooser screenshots (10) | `scripts/shots.mjs` | about 15 | the built site | swatches, as round 2 |
| 12 | About panel names the new key (writer) | `src/assets/js/modes/chrome.js` | 1 | none | none |

Total: 14 new or changed source and test files, plus two generated fixtures; about 900 lines, most of them tokens and tests. No new data, and no new requests beyond five small stylesheets from this site.

## 14. Numbered changes for the developer and the writer, in order

1. Record the Ledger baseline (2.9, step 1) on the current build.
2. Turn the 45 colour uses into tokens (2.2, 2.8). Zero differences against the baseline.
3. Apply the 12 px floor on the admin page (4.1). Re-record the screenshot fixture, with the reason; colours still show zero differences.
4. Add the five theme files with the palettes in 5 to 9 and the layout rules shown in `mockup-admin-themes.html`. Its `<style>` holds each theme in a block headed with the file's name; the build version splits them and adds the dark media-query copy.
5. Add `design-boot.js`, and link it and the five files in `src/admin/index.html` (2.3, 2.4).
6. Add the chooser, its status line, its link to the visitor design, the Reset listener and the failure lines (2.5, 2.6). Change `KEPT_KEYS` and `RESET_WORDS`, and the two expected values in `tests/round4.test.mjs`.
7. Add `data-pin` in `ops.js` and `biz.js` (2.7).
8. Add the `/play/` design select, `theme=light`, and the line about what the designs restyle (3).
9. Writer: the assistants' names in `ACTOR_NAMES` and `ACTOR_WORDS` (4); the chooser's words; the `/play/` line; the About panel's list of keys.
10. Add `tests/admin-designs.test.mjs`, `tests/ledger-unchanged.test.mjs` and the chooser screenshots (10).

## 15. Questions for the conductor

The first version's three questions are answered (team/rounds/5.md, answers 1 to 3) and written in: the `/agents/` names (4), a light admin frame beside a `/d/` design (3), and 12 px for Linho's table headers with no exception (4.1, 7, 10). Answers 4 and 5 (Reset clears the design; "Helena (invented person)") are in 2.5 and 4.

New:

1. **Ledger's own "needs action" orange.** Ledger's urgent pill and warn edge `#B4530F` are 1.01:1 from the allow edge and 1.31:1 from the deny edge, so they would fail the 1.5 rule the review set for themes. Ledger stays exactly as it is in this round, because the refactor must show zero differences. Should a later, recorded step move Ledger's `--a-hot` to its ink `#1B232C`, as the five themes do? That is about 2 lines, and the colour fixture would be re-recorded with that one change.
2. **A dark-mode contrast gap in Ledger, found while listing literals.** The "danger" button text `#B42318` on the dark surface is 2.41:1. Fix it as its own step after the refactor? The proposal is the dark deny-chip ink `#FBE1DE`, 12.78:1, about 3 lines, with the fixture re-recorded for that one rule.
3. **The 12 px floor beyond `/admin/`.** The `.k` and `.d` chips are 11 px in `modes.css` on every mode page. This proposal raises them on `/admin/` only (4.1). Raise them site-wide as well? Raising them everywhere keeps one size for one label, at the cost of rechecking the other pages at 390.
