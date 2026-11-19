# Round 5 design proposal: the admin in five designs (a made-up example)

Written by designer.algarve-holiday-homes@AgentiCCells.dinis, 19 November 2026. **Status: proposal**, for the reviewer, then the developer and the writer.

**Why this round.** Round 5 aim, item 1 (team/rounds/5.md, conductor, about 06:50 UTC): "`/admin/` in five professional, distinct looks that match the five visitor designs under `/d/` (Revista, Azulejo, Linho, Costa, Postal), on the same simulation and the same policy guard: a chooser in the admin, the choice kept in localStorage, and `/play/` showing the visitor design and the matching admin side by side. Every label, warning, "made-up example", "not legal or tax advice" and source line stays in every design."

Dinis Cruz, 18 November 2026, about 17:20 UTC (team/rounds/2.md): "And again, multiple designs, you know, for each one, right? So you should have 5 designs each." And about 17:10 UTC: "really make sure you have different designs, but they also should look very professional."

**Read with this file.**
- `mockup-admin-themes.html`: a static mock-up of the admin's Today section in all five designs, with a switcher (and a light and dark switch). It links `../../3/design/mock-chrome.css` for the band, the header and the label chips. `?design=revista|azulejo|linho|costa|postal` and `?mode=dark` choose the look.
- `admin-revista.jpg`, `admin-azulejo.jpg`, `admin-linho.jpg`, `admin-costa.jpg`, `admin-postal.jpg`: one shot per design, each with the page at 1366 px in light mode (top 1000 px) and at 390 px in dark mode (top 1000 px) side by side. Made with the pre-installed Playwright (Chromium), JPEG quality 70, 206 to 243 KB each. Neither width scrolls sideways: `scrollWidth` came back as 1366 and 390 for all five designs.
- Every figure in the mock-up (bookings, guests, money, counts) is a made-up example for an invented business. The IPMA warning line only shows the form a source line takes; it is not a reading, and the mock-up says so.

Build rules from earlier rounds still hold: static HTML, CSS and vanilla JS modules; system font stacks only; no third-party scripts, fonts or styles; no form `action`; nothing a visitor types leaves the browser. The simulation (`cc.sim.v1`), the policy guard (`sim/abp.js`), the 13 sections and every word of their content stay as they are. This proposal changes how the admin looks. It does not change what the admin says or does.

## 1. What changes, in one list

1. `admin.css`: every hard-coded colour becomes a token (about 63 literals today), so a theme only has to set tokens (2.2).
2. Five theme files `src/assets/admin-themes/<slug>.css`, each holding tokens for light and dark and a few layout rules, and each scoped to `:root[data-design="<slug>"]` (2.3, 5 to 9).
3. A small boot script that sets `data-design` on `<html>` before the first paint (2.4).
4. A "Design" chooser in the admin's title row, with the choice kept in localStorage under `cc.admin.design.v1` (2.5).
5. `/play/`: a design chooser that sets both frames, so the visitor design and the matching admin show side by side (3).
6. A test that renders every design at 390 and 1366 px, checks for no sideways scroll and checks that every label is present (10).

## 2. Architecture: one admin, five themes

### 2.1 Choice

Cheapest sound option: **one admin markup and one set of scripts, with five theme stylesheets**. The 13 sections are drawn by `ops.js` and `biz.js` from one set of class names (`.kpi`, `.panel`, `.tbl`, `.stopped`, `.lcard`, `.note-box` and the rest). A theme changes tokens (colour, type, radius, row padding, figure size) and adds 20 to 50 layout rules, such as rules, borders, a tile strip or panel headers. It never changes markup or words.

| Option | Files | Rough lines | Risk |
|---|---|---|---|
| A. Five copies of the admin (HTML, CSS, JS) | about 30 | about 7,000 | five places to fix every bug; labels drift apart; the policy guard copied five times |
| B. One markup, per-design templates in JS | about 8 | about 1,500 | every section's HTML forked; the reviewer has to check five versions of each section |
| **C. One markup, five theme stylesheets (proposed)** | **9 changed or new** | **about 700** | a theme can only restyle, so it cannot drop a label; one place for the guard |

Option C keeps every label in every design by construction: the words live in one place, and CSS cannot remove them (2.7 forbids `display:none` on label classes, and the test in section 10 checks).

### 2.2 Tokens in `admin.css`

`admin.css` already uses `--a-*` tokens for most surfaces, but about 63 colour literals remain (sidebar marks `#E8875E`, pills `#3A4A5B`, result borders `#2E7D4F`, `#C08A00`, `#B42318`, chart blue `#2a78d6`, booking bars `#7FA6D9`, `#D5C6EC`, and others). Split them into two kinds:

- **Theme tokens** (a theme sets them): `--a-bg`, `--a-surface`, `--a-ink`, `--a-ink2`, `--a-line`, `--a-side`, `--a-side-ink`, `--a-side-lab`, `--a-active`, `--a-mark` (current-section mark), `--a-accent` (links), `--a-head` and `--a-head-ink` (panel header band, transparent by default), `--a-pill`, `--a-pill-ink`, `--a-hot` (urgent pill and warn edge), `--a-today`, `--a-wbg`, `--a-wink`, plus `--f-head`, `--f-text`, `--f-num`, `--row` (table cell padding), `--rad` (corner radius) and `--kv` (tile figure size). The site chrome's own tokens (`--bg`, `--ink`, `--band-bg`, `--band-ink`, `--accent`) are set too, the same way the `/d/` designs set them, so the band, header and footer follow the design.
- **Meaning tokens** (no theme may change them): allow, ask and deny; real, simulated, invented and AI-generated; how sure (high, medium, low, unknown); booking kinds (yours, direct, from a booking platform, block, tour); the alert discs (W, S, L, I, B); the chart series (`#2a78d6`, `#eb6834`, the dataviz reference palette). One colour means one thing across the site and across all five designs, as round 4 section 10 set out. These keep their round 3 and round 4 pairs in light and dark.

The default (no `data-design`, or `ledger`) is today's admin, named **Ledger** in the chooser so all six have a name.

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

### 2.4 Boot script

`src/assets/js/admin/design-boot.js`, a classic (non-module) script of about 20 lines, linked in `<head>` before the stylesheets apply:

1. Read `?design=` from the address. If it is one of the six names, use it for this view only, and do not store it.
2. Otherwise read `cc.admin.design.v1` from localStorage, inside try and catch.
3. If the value is unknown or missing, use `ledger`. Remove an unknown stored value.
4. Set `document.documentElement.dataset.design`.

It reads nothing else and sends nothing.

### 2.5 The chooser

In the admin title row, to the left of the home filter: `<label>Design <select id="adm-design">` with six options: Ledger (main), Revista, Azulejo, Linho, Costa, Postal. It is a native `select`, so it works by keyboard and with screen readers without extra code. On change it sets `data-design`, writes `cc.admin.design.v1`, and announces "Admin design: Revista. The visitor's matching design is at /d/revista/." in the existing `#adm-result` status line. A link "See the matching visitor design" follows the select (Ledger links to `/`).

- **Reset** (chrome.js) clears the simulation, not this key. The design is a viewing preference, like the light and dark setting, not part of the simulation. The About panel lists the key among what this browser keeps.
- **Embedded** (`/admin/?embed`, inside `/play/`): the chooser is hidden, because `/play/` chooses for both frames (3), and the frame's address carries `&design=`.

### 2.6 Failure states of the architecture

| What fails | What the reader sees |
|---|---|
| localStorage blocked (private window, blocked site data) | The chooser still works for this page view. Under it: "Kept for this page only: this browser is not keeping data." This uses the `S.persistent` flag the band already uses. |
| A theme file does not arrive (404, slow, blocked) | The admin reads `--a-theme-ok`. If it is not the chosen slug after `load`, the page shows Ledger, sets the select back, and says in the status line: "The Revista styles could not be loaded; showing the main admin design." Nothing is hidden: Ledger is complete on its own. |
| Unknown value in storage or address | Ledger, and the stored value is removed (2.4). |
| JavaScript off | The admin is JavaScript-only today and its `noscript` message stays. With the boot script off too, the page is Ledger. |
| A font in the stack is missing | Each stack ends in a generic family (serif, sans-serif, monospace). The look degrades to a plain face, never to a downloaded one. |
| Windows high-contrast (forced colours) | Every theme keeps borders on tiles, panels and tables, so structure survives when backgrounds are dropped. Themes add no `forced-color-adjust`. |

### 2.7 What a theme may and may not do

May: set theme tokens; set borders, rules, padding, radius, shadows, letter-spacing, text-transform on headings and labels; draw decoration with `::before` and `::after` (no text in `content`, except `attr(data-pin)` numbers in Costa, which repeat the home's order and add no meaning).

May not: hide, shrink below 12 px or recolour any label (`.k`, `.d`, `.sure`, `.src`, `.note-box`, `.res`, `.whose`, `.untr-q`, `.disclaimer`, `.band`, `.adm-who`, `.srcn`, the "simulated" and "invented" badges); change meaning tokens; use `display:none` on anything but decoration; put text in pseudo-elements; set `position:fixed` over content; animate.

## 3. `/play/`: the visitor design and the matching admin side by side

`/play/` already shows `frame-v` (the visitor) and `frame-a` (`/admin/?embed`) with the ticker between them. Add one control to the view-toggle row:

`<label>Design <select id="play-design">`, with options "Main site with the Ledger admin", "Revista, both sides", "Azulejo, both sides", "Linho, both sides", "Costa, both sides", "Postal, both sides".

On change:
- `frame-v.src` becomes `/` for main, or `/d/<slug>/`; the pane's "Home page" button follows.
- `frame-a.src` becomes `/admin/?embed&design=<slug>` (`ledger` for main). The frame reloads; the simulation is in localStorage, so nothing is lost.
- The pane addresses read "/d/revista/ · you are the visitor" and "/admin/ · Revista design · you are the owner".
- "Open in its own tab" links carry the design (`/d/revista/`, `/admin/?design=revista`).
- The choice is written to `cc.admin.design.v1`, so the admin opened on its own afterwards matches. The play page starts from the stored choice.

**What the reader must be told.** The five visitor designs restyle the home page only (round 2, PROPOSAL.md question 2). A home's own page, the booking flow and "your stay" are in the main design. One line under the frames says: "The five designs restyle the visitor's home page and the whole admin. A home's own page and the booking flow are in the main design in every case."

**Light and dark.** The `/d/` designs are light only (round 2, 3 "Common to all five"); the admin themes follow the system setting. Side by side in dark mode, the left frame is light and the right is dark. This is acceptable and honest about the two builds; see question 2.

**At 390 px** `/play/` already stacks the panes and offers "Visitor only" and "Admin only"; the design select sits above them, full width. **Failure:** if `/d/<slug>/` cannot be read, the existing frame failure line is used ("This page could not be shown inside the frame"); the admin frame still shows its design.

Cost: `src/play/index.html` +8 lines, `src/assets/js/play/play.js` about +40 lines, `src/assets/play.css` about +10 lines.

## 4. Common to all five designs

- **Same simulation, same guard, same 13 sections**: Today, Bookings, Calendar, Cleaning, Stock, Issues, Messages, Reviews (Operations); Rates and rules, Money, Legality, Integrations (Business); Policies (Agents). Same counts in the pills, same order, same hash routes.
- **Labels that stay, word for word, in every design** (the test in 10 checks each):
  - the band: "**Made-up example.** The back office of an invented business ..." with "Not legal or tax advice" and the warning when the browser keeps nothing;
  - "SIMULATED", "INVENTED", "REAL", "ASSUMPTION" chips; "SIMULATED HISTORY", "SIMULATED REVIEW"; "(invented person)" under "Signed in as the owner";
  - the decision chips "ALLOW", "ASK", "DENY" with the rule id, in the result line and in the policy log drawer;
  - "Claude, the host's assistant (simulated)" and "Claude, the guest's assistant (simulated)" wherever an assistant is named (see question 1);
  - Money: "Simulation for an invented business. Not tax or legal advice; check with a certified accountant." and the source note of every assumption;
  - Legality: the source, checked date and how-sure columns, "A simulation, not legal or tax advice", the research's words as written;
  - every live figure's source line: holder (IPMA, Instituto Português do Mar e da Atmosfera), file id, via data.promptugal.news, read time and age, terms, link to the source card; and the failure words ("IPMA's figures could not be read just now", "The rules could not be read just now");
  - "Injection flagged" and the quoted untrusted text, shown as material.
- **Focus**: 3 px outline in the design's ink, 2 px offset; in dark sidebars, the side ink. Contrast against every background it sits on is at least 3:1 (it is the text ink, so at least 6:1).
- **Density** is a token, not a new layout: `--row` sets table cell padding, `--kv` the tile figure size. From densest to most open: Costa (row 4 px), Ledger (6), Azulejo (6), Postal (6), Revista (7), Linho (11).
- **390 px**: the sidebar becomes the sticky, sideways-scrolling bar it is today in every design; tiles go two across; wide tables and the calendar scroll inside their own box (`.tscroll`, `.oc-scroll`), never the page; Legality's row table becomes cards (`.lcards`), as round 4 built. 16 px side gutters.
- **Never**: no design imitates a booking platform's back office, a real accounting product, a real magazine, a real tile maker or IPMA. No platform brand names; "a booking platform" as today.

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
| urgent pill | `#8E3A1E` with white | `#9E4424` with white |
| band | `#EFE3C2` with ink | `#3A3220` with `#F2EEE6` |

**Type.** Headings and figures `"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua","URW Palladio L",Caladea,Georgia,serif`, weight 400; section h1 32 px, panel h2 19 px italic. Tables and body text `"Avenir Next","Segoe UI",Inter,"Helvetica Neue",Arial,sans-serif` (the visitor design's label face, so tables stay readable at 13 px). Tile labels uppercase, 0.1 em tracking, 11 px. Source lines italic in the serif.

**Density.** Comfortable: row 7 px, tile figure 27 px.

**Sidebar.** Paper column with a double rule on its right, like a page gutter; the current section in italic with an accent bar.

**Today tiles.** No boxes: a strip between two ink rules, tiles separated by hairlines, like a contents line. A warn tile gets a 3 px accent rule on top, and its word ("1 urgent") still says why.

**Tables.** Horizontal rules only; a double rule under the header row; headers in small uppercase. Numbers right-aligned in tabular figures.

**Policy panel.** The result line is a boxed notice with a 1 px ink border and the deny-red left edge. "What the agents were stopped from doing" has a serif italic headline over a 2 px ink rule, with the quoted text set off by the red rule as today. On Policies, each policy is a ruled entry, with the rule id in the mono face.

**Money.** The nine-tile strip as on Today; charts keep the series colours, with gridlines in `--a-line` and labels in ink. The profit and loss table gets the double rule under the header and a 2 px ink rule above the totals, like a printed account. The note-box is a ruled notice on the warn background.

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
| urgent pill | `#7A4A00` (ochre) with white | `#B4530F` with white |
| band | `#DCE6F7` with ink | `#1A2A55` with `#E8EEFA` |

**Type.** Headings `Optima,Candara,"Gill Sans","Gill Sans MT","Noto Sans","Segoe UI",Carlito,sans-serif`, uppercase with 0.08 em tracking for the h1, panel headers and tile labels; text `"Gill Sans","Gill Sans MT",Calibri,Carlito,"Segoe UI",system-ui,sans-serif`.

**Density.** Medium: row 6 px, tile figure 23 px.

**The tile.** The team's own 48 x 48 SVG from `/d/azulejo/style.css` (drawn by the team, copies no real tile), as a 14 px strip across the top of the main column. It is decoration (no text, no meaning) and stays at 390.

**Today tiles.** White squares with a 2 px cobalt border and a filled quarter-circle in the top right corner. A warn tile has a 6 px ochre left edge plus its word.

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
| urgent pill | ink with linen text (inverted) | `#EFEBE3` with `#121211` |
| band | `#E7E0D3` with ink | `#26231F` with `#EFEBE3` |

**Type.** Headings and figures `Didot,"Bodoni 72","Bodoni MT","Noto Serif Display","DejaVu Serif",Georgia,serif`, weight 400; h1 42 px (30 px at 390), panel h2 22 px. Text and labels `"Helvetica Neue",Helvetica,Inter,Arial,sans-serif`. Sidebar and tile labels uppercase, 0.14 to 0.24 em tracking, 11 to 12 px.

**Density.** The most open: row 11 px, tile figure 32 px, 34 px between columns. The eight Today tiles go four across in two rows at 1366, so the figures can be large.

**Sidebar.** No fill; spaced capitals; the current section underlined (1 px, 5 px offset), not filled.

**Today tiles.** No boxes: each tile is a hairline above a label and a large thin figure. A warn tile's hairline turns ink, and its word says why.

**Tables.** Hairlines, spaced capital headers at 10 px with 0.2 em tracking (above the 12 px floor only for the header row: see question 3), generous rows.

**Policy panel.** A 1 px ink rule over a Didot headline; the quoted text keeps its red rule. Linho is the calmest design, so the deny-red edge stands out more here than anywhere else, as it should.

**Money.** Charts on the linen with hairline gridlines; the P&L table in hairlines with an ink rule above totals; the note-box on `#F3E6C4` with `#5A3E10` text.

**Legality.** Cards look the same at every width (hairline boxes), but the row table stays above 640 px.

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
| pins and urgent | `#A63D17` with white | the same |
| band | `#FBE7A1` with ink | `#3A3214` with `#FBE7A1` |

**Type.** Headings `ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Segoe UI",Inter,system-ui,sans-serif`; text `system-ui,-apple-system,"Segoe UI",Inter,Roboto,Arial,sans-serif`; figures, dates and number cells `ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,"JetBrains Mono",monospace` with tabular numbers.

**Density.** The densest: row 4 px, tile figure 22 px, 13 px table text.

**Sidebar.** Deep sea, with the current section as a pill shape running to the right edge.

**Today tiles.** White, 10 px radius, a 5 px deep-sea stripe on top; a warn tile's stripe turns pin red, and its word says why.

**Tables.** Land-coloured header row, mono numbers; the calendar and occupancy rows carry the home's pin number (1 Salt, 2 Lagoon, 3 Hill, 4 Harbour, 5 Cape, west to east as in `/d/costa/`) in a white-ringed red disc before the name. The name is always written as well.

**Policy panel.** A dashed rule under the panel head, like a chart's margin line; refusal times in mono.

**Money.** Mono figures throughout the tiles and the P&L table; chart labels in mono; series colours unchanged.

**Legality.** Land header row; the municipal tourist tax table puts the pin number beside each municipality where a home sits in it.

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
| urgent pill | ink with card colour | `#F2D27A` with ink |
| band | `#F2D27A` with ink | `#3E300C` with `#FBEFC8` |

**Type.** Headings and figures `Rockwell,"Roboto Slab","Zilla Slab","DejaVu Serif",Georgia,serif`, 700; text `Charter,"Bitstream Charter",Cambria,Caladea,Georgia,serif`; sidebar group labels, tile labels and table headers `"Avenir Next Condensed","Arial Narrow","Liberation Sans Narrow",Arial,sans-serif`, uppercase.

**Density.** Medium: row 6 px, tile figure 22 px (figures never wrap: `white-space:nowrap`, found in the mock-up at 1366, where "€6,840" broke).

**Today tiles.** Cards with a light shadow (none in dark mode) and a 14 x 17 px stamp, drawn in CSS, in the bottom right corner (decoration only). A warn tile has a 5 px terracotta left edge plus its word.

**Tables.** Condensed uppercase headers; rules in `--a-line`.

**Policy panel.** A card with the mustard header; the result line has an 8 px decision-colour edge, the widest of the five, to suit the heavier type.

**Money.** Each chart and table is a card with a mustard header; the note-box on the warn colours. Chart series unchanged; orange `#eb6834` on the card colour is 3.15:1, above the 3:1 needed for a mark, with values written beside the bars as today.

**Legality.** Cards at every width under 640 px, as today; headers mustard.

## 10. Tests and checks (for the developer)

`tests/admin-designs.mjs` (Playwright, as `scripts/shots.mjs` already uses), about 80 lines:
- for each of the six designs, at 390 and 1366 px, light and dark: open `/admin/?design=<slug>#<section>` for all 13 sections after "Load example activity (simulated)";
- assert `scrollWidth <= innerWidth`;
- assert the band text, "SIMULATED", "invented person", "Not tax or legal advice" (Money), "not legal or tax advice" (Legality), a source line with "IPMA" and "read" (Today alerts, or the failure words), and a DENY chip are visible (non-zero box, computed opacity 1, font size at least 12 px; 10 px only for Linho's table header row, see question 3);
- compute the contrast of the computed `color` on the nearest opaque background for every `.k`, `.d`, `.src`, `.kl`, `.kv`, `th`, `td` and sidebar link, and fail below 4.5:1;
- tab through the page and check every focused element shows an outline.

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
| | white on urgent pill | 7.57 | 6.35 |
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
| | white on urgent pill | 7.48 | 5.02 |
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
| | white on pin and urgent | 6.36 | 6.36 |
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
| | urgent pill | 15.81 | 10.92 |

Band contrast is at least 9:1 in every design and mode (lowest: Azulejo light, 9.96), the rule the `/d/` designs set in round 2.

Marks, not text (3:1 needed): chart blue `#2a78d6` is 4.42 on white, 3.68 on Revista dark, 3.56 on Azulejo dark and 3.64 on Costa dark; chart orange `#eb6834` is 3.20 on white, 3.15 on Postal's card, 5.43 on Linho dark and 4.93 on Postal dark. Each bar also carries its value as text.

Colour-blind check: in every design, warn tiles and urgent pills carry a word or a count beside the colour, decisions carry their word (ALLOW, ASK, DENY), and booking kinds differ by pattern (platform bars are striped, background occupancy is hatched, yours is solid), as Ledger does today.

## 12. Keyboard and 390 px

- Tab order is unchanged by design: band link, header, sidebar sections, chooser, home filter, content. Themes do not reorder (no `order`, no `flex-direction:row-reverse`).
- The chooser is a native `select`: arrow keys change it, and the change is announced in the status line.
- The sticky sideways sidebar at 390 keeps the current section scrolled into view (existing behaviour) and shows its mark as a 3 px bottom border in `--a-mark` in every design.
- Every scrolling box (`.tscroll` with `tabindex="0"` and `role="region"`, the calendar) is reachable by keyboard, as round 4 built.
- Checked in the mock-up: no sideways page scroll at 390 in any of the five designs (`scrollWidth` 390), in light and dark.

## 13. Cost

| # | Change | Files | Rough lines | Reads | Failure state |
|---|---|---|---|---|---|
| 1 | Tokens in `admin.css` (2.2) | `src/assets/admin.css` | about 60 changed, 25 new | none | Ledger unchanged when no design is set |
| 2 | Five theme files (5 to 9) | `src/assets/admin-themes/*.css` | 5 x 70 to 110, about 450 | none | file missing: Ledger and a line saying so (2.6) |
| 3 | Boot script (2.4) | `src/assets/js/admin/design-boot.js` | about 20 | address, `cc.admin.design.v1` | storage blocked: this view only |
| 4 | Chooser and its link (2.5) | `src/admin/index.html` (+8), `src/assets/js/admin/admin.js` (+35) | about 45 | `cc.admin.design.v1` | as 3 |
| 5 | `/play/` design select (3) | `src/play/index.html`, `src/assets/js/play/play.js`, `src/assets/play.css` | about 60 | `cc.admin.design.v1`, `/d/<slug>/` | frame failure line, as today |
| 6 | Test (10) | `tests/admin-designs.mjs` | about 80 | the built site | fails the build |
| 7 | Chooser screenshots (10) | `scripts/shots.mjs` | about 15 | the built site | swatches, as round 2 |
| 8 | About panel: name the new key (writer) | `src/assets/js/modes/chrome.js` | 1 | none | none |

Total: 9 new or changed source files plus one test, about 700 lines, most of them tokens. No new data, no new requests beyond five small stylesheets from this site.

## 14. Numbered changes for the developer and the writer

1. Turn `admin.css` colour literals into theme tokens and meaning tokens (2.2).
2. Add the five theme files with the palettes in 5 to 9 and the layout rules shown in `mockup-admin-themes.html` (its `<style>` holds each theme in a block headed with the file's name; the build version splits them and adds the dark media-query copy).
3. Add `design-boot.js` and link it and the five files in `src/admin/index.html` (2.3, 2.4).
4. Add the chooser, its status line, its link to the visitor design and the failure lines (2.5, 2.6).
5. Add the `/play/` design select and the line about what the designs restyle (3).
6. Writer: the chooser's words, the `/play/` line, and the About panel's list of keys.
7. Add `tests/admin-designs.mjs` and the chooser screenshots (10).

## 15. Questions for the conductor

1. **"Claude (simulated)" in the admin.** The `/agents/` page names "Claude, the host's assistant (simulated)". The admin names the same actor "the host's assistant" (`ACTOR_NAMES` in `modes/chrome.js`). The brief asks that "Claude (simulated)" stay in every design, and the mock-up uses the `/agents/` wording. Should the writer change `ACTOR_NAMES` and `ACTOR_WORDS` to the `/agents/` wording so the admin says it too? It is a word change in two places, not a design change.
2. **Dark mode side by side.** The `/d/` visitor designs are light only, and the admin themes follow the system setting. Is a light visitor frame beside a dark admin frame acceptable in `/play/`, or should `/play/` pass `&theme=light` to the admin frame when a `/d/` design is chosen? (About 3 lines either way.)
3. **Linho's table headers.** Linho's spaced capital headers read best at 10 px. 10 px is under the 12 px floor the test uses for labels, though they are headers, not labels. Allow 10 px for table header rows only in Linho, or set them at 11 px with less tracking?
