# Round 1 design proposal: Cinco Chaminés (a made-up example)

Written by designer.algarve-holiday-homes@AgentiCCells.dinis, 18 November 2026. **Status: proposal**, for the reviewer, then the developer and the writer.

Read first: the round's aim (`team/rounds/1.md`), the research (`team/rounds/1/research/NAME.md`, `DATA.md`, `CAMERAS.md`, `BILLBOARD.md`) and `src/data/cameras.json`. Every figure below that the site shows live comes from https://data.promptugal.news, read in the browser; the numbers in this file and in the mock-ups are examples from the research read of 18 November 2026, 16:15 UTC (DATA.md), marked as such, or are invented and say so.

Mock-ups (static, not the site): `mockup.html` (open it with `#home` or `#stay`), rendered as `mockup-home-1366.jpg`, `mockup-home-390.jpg`, `mockup-stay-1366.jpg`, `mockup-stay-390.jpg` (Playwright, Chromium, JPEG quality 70). Some forecast, sea and UV values in the stay mock-up are illustrative; the band at the top of the mock-up says so.

Build rules that hold for every change: static HTML, CSS and vanilla JS modules; no third-party scripts, fonts, maps or trackers; no form `action`, no `fetch` other than GETs to data.promptugal.news and our own `/data/`; no `localStorage` of anything a visitor types (a theme choice may be stored). Every page has the made-up band (2.3) and the footer (2.5).

## 1. Site map and URLs

| URL | What | Reads | Cost |
|---|---|---|---|
| `/` | Company line, "Plan your stay" (arrive, leave, guests), "The Algarve now" strip, the five home cards, the agent entry | `index.json`, `ipma-city-forecasts`, `ipma-sea`, `ipma-uv`, `ipma-warnings` latest.json and card.json | medium |
| `/homes/<id>/` for `salt`, `lagoon`, `hill`, `harbour`, `cape` | Drawing, details, availability calendar, stay panel, booking flow | as above plus `events-pt` | high (one template, five data entries) |
| `/agent/` | Full-page scripted agent | homes data plus the five sources | medium |
| (every page) | Docked agent: a round button bottom right, "Ask the agent", opens a panel (360 px wide at 1366, full screen at 390). Same script as `/agent/`; not shown on `/agent/` itself | as `/agent/`, loaded only when opened | low once `/agent/` exists |
| `/live/` | Live from the Algarve: list and drawn map of the 14 cameras, link out only | `/data/cameras.json` | low |
| `/billboard/` | Proposal: "A London billboard, live from the Algarve", four drawn mock-ups | `ipma-*` for the live preview figures | medium |
| `/use-the-data/` | How the site reads each file, with copyable `fetch` snippets | none (links) | low (writer) |
| `/use-with-ai/` | How to point an assistant at the data; links `llms.txt` and each page's `index.md` twin | none | low |
| `/llms.txt`, `/<page>/index.md` | Plain text twins of each page, generated at build | build step | low |
| `/behind-the-scenes/` | Generated: team, policies, workflow, round reports, commit timeline from `git log` | build step | medium |
| `/d/` | Chooser for the five designs (round 2; in round 1 a page that says so) | none | low |
| `/data/cameras.json` | The researcher's file, published as is | none | none |

Home ids, names, places and invented prices: NAME.md, table "The five homes". Keep them in one module `src/js/homes.js` (invented data, labelled in a comment and in each record: `invented: true`).

Navigation order: Homes, Agent, Live cameras, Billboard (proposal), Use the data, Behind the scenes. "Use with AI" sits in the footer.

## 2. Look

### 2.1 Palette (CSS custom properties)

```css
:root{--bg:#FBF7F0;--surface:#FFFFFF;--ink:#1F2328;--ink-2:#545A62;--line:#D9D2C5;
--accent:#A13D1A;--on-accent:#FFFFFF;--sea:#0E5A72;--band-bg:#FBE7A1;--band-ink:#3A2E00;
--warn-y:#FFF0B3;--warn-o:#FFD6AD;--warn-r:#F7C6C1;--free:#FFFFFF;--taken:#E4DED3;
--wall:#FFFFFF;--roof:#C2643D;--water:#9FD3E3;--green:#5E7D4A}
/* dark: under @media (prefers-color-scheme:dark) :root:not([data-theme="light"]) and :root[data-theme="dark"] */
{--bg:#16130F;--surface:#221E19;--ink:#F2EDE4;--ink-2:#BDB5A8;--line:#3A342C;
--accent:#F2A07C;--on-accent:#16130F;--sea:#7EC8DF;--band-bg:#E9CF6E;--band-ink:#2A2200;
--warn-y:#4A3D10;--warn-o:#5A3416;--warn-r:#5E2622;--free:#221E19;--taken:#3A342C;
--wall:#E9E2D6;--roof:#B85A36;--water:#2F6F84;--green:#7E9E68}
```

Contrast (WCAG ratio, computed with the WCAG 2 luminance formula; all text pairs pass AA 4.5:1):

| Pair | Light | Dark |
|---|---|---|
| ink on bg | 14.79 | 15.88 |
| ink on surface | 15.80 | 14.21 |
| ink-2 on bg / surface | 6.52 / 6.96 | 9.12 / 8.16 |
| accent (links) on bg / surface | 6.15 / 6.57 | 8.90 / 7.96 |
| on-accent on accent (buttons) | 6.57 | 8.90 |
| sea on bg (chips, focus ring) | 7.22 | 9.89 |
| band-ink on band-bg | 10.85 | 10.26 |
| ink on warn-y / warn-o / warn-r | 13.82 / 11.64 / 10.38 | 9.16 / 9.30 / 10.14 (as text on dark warn fills) |

Colour is never the only signal: warnings carry the word (yellow, orange, red) and a left bar; taken days are struck through and hatched; the stay's leave day is outlined. Accent (warm red-brown) and sea (teal) differ in lightness as well as hue, so they stay apart for red-green colour-blind readers. Drawing fills are decoration only; the drawings keep 2 px ink outlines.

### 2.2 Type and spacing

- Font stack: `system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif`; mono `ui-monospace,"SF Mono",Menlo,Consolas,monospace`. No web fonts.
- Scale (rem): body 1 (16 px), line height 1.55; small 0.8125; source lines 0.75; h3 1.125; h2 1.5; h1 `clamp(1.75rem,4vw,2.5rem)`, line height 1.15. Figures in bold, units after a space ("19 °C").
- Spacing tokens: 4, 8, 12, 16, 24, 32, 48 px (`--s1` to `--s7`); radius 6 px; content width 72rem; 16 px side gutter at 390; no horizontal scroll at 390 (grid children get `min-width:0`, as the mock-up had to).
- Focus: 3 px `--sea` outline, 2 px offset, on every link, button, chip and calendar day.

### 2.3 The made-up band (every page, first thing in `<body>`)

Full width, `--band-bg`, 14 px text, centred, `role="note"`:

> **Made-up example.** Cinco Chaminés is an invented company: the homes, prices, availability and bookings are simulated. The weather, sea, UV and events are real, read live from data.promptugal.news. [What is this site?]

The link goes to `/behind-the-scenes/#what`. Not dismissible. The brand line repeats it: "Cinco Chaminés, holiday homes in the Algarve (a made-up example)". Every price says "(invented)"; every drawing's `aria-label` starts "Drawing of".

### 2.4 Header

Brand (chimney symbol 22 x 36 px, name, the line above in 12 px), nav to the right, no wrapping (`white-space:nowrap`). Below 640 px the nav becomes a "Menu" button (`aria-expanded`, toggles a list under the header). Current page: `aria-current="page"` and a 2 px accent underline.

### 2.5 Footer (every page)

Three columns at 1366, stacked at 390:
1. "Cinco Chaminés is a made-up example. Homes, prices, availability and bookings are invented. Weather, warnings, sea and UV: **IPMA, Instituto Português do Mar e da Atmosfera**, via data.promptugal.news; IPMA allows use with no profit-making purpose and asks to be named ([terms](card `terms.page`)). Events: each town's own agenda, reference use with a link. Data files CC BY 4.0, PrompTugal.news."
2. Use the data, Use with AI, Behind the scenes, `/data/cameras.json`.
3. "Made by the AgentiCCells site factory. Code Apache-2.0, text and drawings CC BY 4.0. Version vX" (build replaces `__VERSION__`).

No IPMA logo or house style anywhere.

## 3. The homes as drawings

All drawings are inline SVG, `viewBox="0 0 240 160"`, ground line y = 140, `role="img"` with an `aria-label` beginning "Drawing of". Outlines `stroke="var(--ink)" stroke-width="2"`; fills from the tokens (`--wall`, `--roof`, `--sea` for doors and windows, `--water`, `--green`), so dark mode works with no second drawing. Each house has exactly one chimney, placed with `<use href="#chimney">`. The exact shapes are in `mockup.html`; copy them into `src/js/drawings.js` as strings keyed by home id.

### 3.1 The chimney motif (reusable)

```svg
<symbol id="chimney" viewBox="0 0 24 40">
 <rect x="8" y="20" width="8" height="20" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.5"/>
 <rect x="4" y="10" width="16" height="10" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.5"/>
 <path d="M7 15l2-2.5 2 2.5-2 2.5zM11 15l2-2.5 2 2.5-2 2.5zM15 15l2-2.5 2 2.5-2 2.5z" fill="var(--ink)"/>
 <path d="M3 10L12 2l9 8z" fill="var(--roof)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
 <circle cx="12" cy="1.5" r="1.3" fill="var(--ink)"/>
</symbol>
```

Shaft, a lantern box with three diamond openings (the lattice of the Algarve chimney), a pointed cap and a finial. Placed at 24 x 40 on the roof line (base y = roof top). Also the brand mark and the favicon (`favicon.svg`, the same symbol on `--band-bg`).

### 3.2 The five houses

| Home | Shapes (240 x 160) | Chimney at |
|---|---|---|
| Salt House, Tavira | Low white box x40 y80 w140 h60; roof terrace parapet x40 y72 w140 h8 with railing uprights every 10; two windows and a door. Foreground: a pale water strip y140 to 160 with white horizontal strokes (salt pans) | x152 y32 |
| Lagoon House, Faro | Three-storey block x50 y40 w110 h100; the first floor (y72 to 106) tinted `--band-bg` at 60 % to mark "this flat", with a railed balcony line; water strip with two wave curves; a small boat (hull polygon, mast, sail line) right | x128 y0 |
| Hill House, near Loulé | Hill (curved path, `--green` at 35 %); house x30 y85 w115 h55 with a tiled pitched roof (triangle 22,85 88,58 153,85, `--roof`); pool x158 y130 w62 h10 (`--water`); carob tree: trunk x198 w5 and three green circles | x104 y34 |
| Harbour House, Lagos | Narrow two-storey town house x80 y50 w90 h90 with a `--sea` cornice band (platibanda) x76 y44 w98 h8; walled courtyard x30 y102 w50 h38 with an arched door and a pot plant; two masts behind (thin `--ink-2` lines) | x146 y4 |
| Cape House, Sagres | Long low house x40 y100 w140 h40, outline 3 px (thick walls), mono-pitch roof sloping to the wind, small square windows; three wind strokes from the left (`--sea`, round caps); cliff (`--ink-2` at 35 %) dropping to water bottom right; a bent shrub | x58 y56 |

Cards: drawing above the text at 1366 (five across); at 390 a 120 px drawing beside the text, one card per row. Home page: the drawing sits at the top of the right column above the calendar.

## 4. Availability (simulated)

- Module `src/js/availability.js`, pure functions, tested in `tests/`.
- Seed: FNV-1a 32-bit hash of the string `"<homeId>|<today as YYYY-MM-DD in Europe/Lisbon>"`; PRNG mulberry32 from that seed. Same home, same day: same calendar on every device; it changes once a day.
- Generation, from today to today + 365: alternate a free gap of 1 to 9 nights and a taken run of 2 to 7 nights (both from the PRNG), starting with a free gap. Days before today are shown faded and cannot be picked.
- Price: nights x the home's invented nightly price; no fees, no taxes, nothing else. Shown as "5 nights, EUR 425 (invented)".
- Display: a month grid (Monday first) with previous and next month buttons; a range can be picked only over free nights (the leave day may be a taken day, since that night is not used). States: free (outlined), taken (struck through, hatched, `aria-disabled="true"`, `aria-label="19 November, taken (simulated)"`), your nights (accent fill), leave day (accent outline), today (bold number).
- Legend under the grid: free, taken (struck through), your nights, leave. Heading tag "simulated availability" and the line "Simulated: made up in your browser from the home and today's date."
- Keyboard: the grid is `role="grid"` with one tab stop (roving `tabindex`); arrows move by day and week, Home and End to week start and end, Page Up and Page Down by month; Enter or Space sets arrive, then leave; Escape clears. A live region announces "Arrive 20 November. Choose the leave date." Two plain date inputs sit under the grid as an alternative and stay in sync.
- Dates chosen on `/` ("Plan your stay") pass as `?arrive=2026-11-20&leave=2026-11-25&guests=2`; home cards then show "free for your dates" or "taken on some of your dates" (simulated).

## 5. Booking flow (a demonstration)

Steps in the right column, under the calendar, as a step list (`<ol>`, current step `aria-current="step"`): 1 Dates, 2 Guests, 3 Details, 4 Review, then the final screen. All on the home page, no page loads, Back on every step.

1. **Dates**: from the calendar; Next is disabled until a valid range.
2. **Guests**: adults and children steppers, limited to the home's "sleeps"; "Pets?" yes or no (answer: "This made-up company does not take pets in the Lagoon House" or similar, set per home in `homes.js`, invented).
3. **Details**: first line, before any input, in a box: "This form keeps nothing and sends nothing. It is part of a demonstration: there is no booking system behind it." Fields: name (optional), arrival time (select), a note (optional). No email, no phone, no address, no payment fields of any kind; no card number, expiry or security code inputs. The `<form>` has no `action` and no `method`; submit is a button of `type="button"`; `autocomplete="off"`.
4. **Review**: home, dates, nights, guests, invented total; "Nothing will be sent." Button "Finish the demonstration".
5. **Final screen**, in a bordered box with the chimney drawn large, exactly: **This is a demonstration: nothing was booked, nothing was sent, nothing was charged.** Under it: "Start again" and "Ask the agent about your stay". The values typed are cleared from memory on this screen.

Failure states: none needed (no network). Cost: medium.

## 6. The stay panel

Shown on `/homes/<id>/` under the details once dates are chosen (and on load with no dates: "Pick dates to see the weather, sea and events for your stay"; the "now" values show instead). Heading "Your stay: Fri 20 to Wed 25 November". One block per source, each ending in a source line (0.75 rem, `--ink-2`):

`Source: <card.publisher> (<source id>). <IPMA issued hh:mm;> read hh:mm UTC, <n> min ago. Terms: <card.terms.summary, shortened>. <link to card.reader_page>`

Place per home: NAME.md, table "How each home maps to the data" (forecast id, sea coast id, UV id, events place, warnings area FAR). Read places from `homes.js`, ids from that table.

| Block | Rule | Out of range | Empty |
|---|---|---|---|
| Forecast | `ipma-city-forecasts`, city by id; one tile per day of the stay from arrive to leave: date, `t_min_c` to `t_max_c` °C, weather words from the IPMA weather-type table (small lookup in our code, linked to IPMA's class file), rain %, wind direction and class | Days beyond the five IPMA gives: dashed tile "not yet, appears <date - 4 days>". Whole stay beyond: "No forecast yet for these dates. IPMA forecasts five days ahead; this appears on <date>." | n/a |
| Warnings | `ipma-warnings` `active[]` with `area == "FAR"` and overlap with the stay (compare local dates: `start.slice(0,10) <= leave && end.slice(0,10) >= arrive`); level word and bar colour (yellow `#8A6D00` bar, orange `#B5541A`, red `#A11A1A`), type, start and end in Portugal time, IPMA's Portuguese text in italics labelled "IPMA, in Portuguese" with a short English gloss written by the writer only for known types. Note when the warning text names a coast the home is not on (west coast versus south coast). | Stay beyond the furthest `end`: "No warnings issued for these dates yet; IPMA issues them up to three days ahead." | "No warning for the Algarve (Faro district) at the time read." |
| Sea | `ipma-sea` coast by id, days in the stay: sea temperature min to max, waves min to max m | "Sea forecast covers three days; not yet for these dates." | n/a |
| UV | `ipma-uv`, place by id (ignore id 0; take the maximum per date when two entries); band word (WHO: low, moderate, high, very high, extreme). For 1081525 label "IPMA UV place 1081525 (Sagres area, unconfirmed)" as DATA.md says | as sea | n/a |
| Events | `events-pt`, `place` from `homes.js`; keep events overlapping arrive to leave (DATA.md filter). Two lists: "On during your stay" and "On all through your stay" (multi-week exhibitions). Each: name as a link to `url`, date, venue, "Check details with the organiser." Source line uses the event's `source`. | n/a (60-day window: past that, "Events are listed up to 60 days ahead.") | "No events listed for <town>. An empty list means no source covers the place, not that nothing is on." |

Common states, per block, never a guessed value:
- **Loading**: a grey block with "Reading IPMA forecast..." (no spinner animation under `prefers-reduced-motion`).
- **Failure** (network error, non-200, bad JSON, 8 s timeout): "Could not read the IPMA forecast just now (<reason>). [Try again] [See it on IPMA's page]".
- **Stale**: from `read_at`; hourly sources stale after 2 hours, events after 12 hours (DATA.md). The source line turns bold: "Read 5 hours ago: this may be out of date." Values still shown.
- **Partly failed**: when `index.json` status is "partly failed", say so on the source line with the card's own words.

Cost: high (the core of the site). Shared module `src/js/data.js` (fetch with timeout, card cache per page, age words).

## 7. The scripted agent

**Interface** (`/agent/` and the docked panel): header "Ask the agent" with the tag "simulation"; directly under it, always visible and not scrolling away: **"Simulation: pre-written answers matched in your browser, no live model."** Then the log (`role="log"`, `aria-live="polite"`), visitor messages right in `--surface` with an ink border, agent messages left with the chimney avatar, chips of suggested questions under the latest answer, and an input with a Send button. Typing delay: dots for `min(400 + 12 x answer length, 1400)` ms, then the full answer at once; with `prefers-reduced-motion`, 200 ms and no dots animation. Answers that use live data carry the same source line as the stay panel, small, under the answer. Clear button "Start again". Nothing is stored between visits.

**Matching** (`src/js/agent.js`, intents in `src/js/intents.js` by the writer): lower-case, strip accents and punctuation; score each intent by keyword hits (weights in the file); pick the top above a threshold, else fallback. Extract slots before matching: home (names, ids, town names: Tavira, Faro, Loulé, Lagos, Sagres), dates (today, tomorrow, this weekend, next weekend, weekday names, "20 Nov", "20/11", ISO), guests (a number with people, adults, guests). A follow-up keeps the last home and dates ("and the sea?").

**Live answers**, example: "What's the weather in Lagos next weekend?" resolves Lagos to the Harbour House, forecast place Portimão 1081100 (about 15 km, said in the answer), next weekend to Sat and Sun; if both within five days: "Portimão, the nearest IPMA forecast place to Lagos: Sat 21, 14 to 20 °C, clear, rain 0 %; ..." plus source line; if not: "IPMA forecasts five days ahead, so next weekend's forecast appears on Tuesday. Today in Portimão: ...". On failure: "I could not read IPMA's forecast just now; here is IPMA's own page."

**Intents to cover** (answers written by the writer, each says what is invented):

| Intent | Answers from |
|---|---|
| homes | the five homes, one line each, links |
| compare | two homes side by side (sleeps, features, invented price) |
| availability | simulated calendar for a home and dates |
| price | invented nightly price x nights |
| book | how the demonstration flow works; link to the home's booking steps; "nothing is booked" |
| weather | forecast for place and dates (live) |
| warnings | FAR warnings overlapping the dates (live) |
| sea | sea temperature and waves (live) |
| UV | UV index and band (live) |
| events | events for the place and dates, with links (live) |
| cameras | nearest cameras from `cameras.json`, link out |
| getting there | invented general guidance (Faro airport, drive times as rough figures marked approximate) |
| pets | per home, invented |
| accessibility | per home, invented (the Lagoon House step-free to the lift) |
| what is this site | made-up example, the factory, behind the scenes link |
| fallback | "I only know a few pre-written things" plus six chips |

Chips on first open: "Which home suits four people?", "Is the Hill House free next week?", "Weather in Lagos next weekend?", "Any warnings this week?", "What's on in Tavira?", "What is this site?".

Cost: medium (matcher) plus the writer's intents.

## 8. Live from the Algarve (`/live/`)

- Intro, plain: "Public live cameras along the Algarve coast, published by their operators. We link to each operator's page. We do not show their streams or stills here: both operators' terms need their permission for that (checked 18 November 2026)." Link to `/data/cameras.json`.
- Map: inline SVG, `viewBox` from lon -9.0 to -7.35 and lat 36.95 to 37.35, equirectangular with x scaled by cos(37°) (about 0.8). The coast is a hand-drawn polyline from about 15 coarse points (Cabo de São Vicente -8.997,37.023; Sagres -8.94,37.00; Lagos -8.67,37.10; Portimão -8.53,37.12; Albufeira -8.25,37.08; Quarteira -8.10,37.07; Faro -7.93,37.00; Cabo de Santa Maria -7.87,36.96; Tavira -7.65,37.12; Vila Real de Santo António -7.42,37.19; plus the west coast north to Arrifana -8.87,37.29) labelled "Coast drawn from rough points, not to survey accuracy". Land `--surface`, sea `--water` at 40 %. Each camera a numbered circle (r 7, `--sea`, white number), each home a small chimney symbol; numbers match the list. Circles are links (focusable, `aria-label` = camera title and operator). No map tiles.
- List (table at 1366, cards at 390): number, title, place, operator (as in the JSON), "Open on the operator's page" (external link, `rel="noopener"`), terms link, "Checked 18 November 2026", embed "No: link only". Group by "Near the Salt House" and so on (CAMERAS.md) and "Further along the coast".
- Rule in code: render an embed only if `embed === true` and `embed_url` is set; none are today. Failure: if `cameras.json` cannot load, "The camera list could not load" and a link to the file.

Cost: low to medium.

## 9. Billboard mock-ups (`/billboard/`)

Page heading "A London billboard, live from the Algarve" with a large **PROPOSAL** tag. First paragraph quotes Dinis's words with the time (brief, 2026-11-18, about 16:10 UTC) and says: "His earlier published piece on this was not found; the link will follow when he gives it." Every mock-up carries the word PROPOSAL inside the frame (top left, 4 % of height, on `--band-bg`) and a caption "Mock-up: not an advert, not booked with any media owner".

Frames: digital six-sheet 1080 x 1920 (portrait, `viewBox="0 0 1080 1920"`) and D48 2880 x 2160 (landscape 4:3, `viewBox="0 0 2880 2160"`), drawn at page width with a thin ink frame and a drawn London street context (a bus-shelter outline for the six-sheet, a roadside frame on two legs for the D48). Sizes: BILLBOARD.md.

| Concept | Layout | Data slots |
|---|---|---|
| A. "Right now in the Algarve" | Six-sheet: top 40 % a camera frame drawn as an outlined, hatched rectangle labelled "live camera, with the operator's permission"; below, huge "Right now in the Algarve: 19 °C, sea 18 °C, UV 3", then a time line "Faro, 16:14 London time" and "Source: IPMA" | `ipma-city-forecasts` Faro today `t_max_c` (or a current reading if one is added later), `ipma-sea` Faro coast `sea_temp_max_c`, `ipma-uv` Faro index, read time |
| B. "London 9 °C. Faro 19 °C." | D48: two columns, left grey London (value left as a labelled empty slot: no London source in our data; needs one), right warm Faro with the chimney drawing | Faro from `ipma-city-forecasts`; London slot empty, marked "needs a source" |
| C. "The sea at Sagres today" | Six-sheet: wave height and sea temperature very large over a drawn sea; camera placeholder for the Sagres camera (Beachcam page) labelled as in A | `ipma-sea` Sagres coast `waves_max_m`, `sea_temp_max_c` |
| D. "Five chimneys" | D48: the five house drawings in a row with each town's max temperature under it | four forecast places from NAME.md |

Rules, stated on the page under the mock-ups, plainly:
- **IPMA**: its terms allow use only with no profit-making purpose and ask to be named. A commercial billboard is a profit-making use, so it would need IPMA's written permission first. Until then these stay drawings.
- **Cameras**: Beachcam's terms need prior, express permission to relay its streams on third-party platforms; SkylineWebcams' need written permission for advertising use. No real frame is shown; placeholders only.
- **Events**: events-pt allows reference use only; no event listings on a billboard without the organisers' permission.
- How it would run: the media owner's system swaps pre-approved templates when the figures change (to be confirmed with a media owner; BILLBOARD.md). Nobody has been contacted.
- A live preview beside each mock-up fills the slots from today's data with the usual source line and failure state ("value unavailable: the slot stays empty, it never shows an old value as current").

Cost: medium (four SVG templates, one fill function).

## 10. Five designs for round 2 (`/d/<slug>/`)

Same pages, same data modules, same band, footer, statement and source lines; only CSS tokens, the hero and the drawing style change. Each palette must pass the same contrast table before it ships.

| Slug | Name | Idea | Palette (bg / ink / accent) |
|---|---|---|---|
| `azulejo` | Azulejo | Blue and white tile grid; drawings in cobalt line only; data in tiles | #F7F9FC / #14213D / #1F4FA3 |
| `cal` | Lime wash | Near-white, wide margins, one ochre line per section, large type; quiet | #FFFFFF / #222222 / #8A5A00 |
| `postcard` | Postcard | Each home a postcard with a stamp-shaped data block (today's figures as the "postmark") | #F4EBDD / #2B2118 / #9C2F2F |
| `tide-table` | Tide table | Dense, tabular, mono figures; the stay as a timetable; for readers who want the numbers | #0F1A1F / #E6EEF0 / #7FD1C7 |
| `night` | Night coast | Dark by default, the coast map as hero with the cameras and homes lit; the billboard ideas up front | #0B0F14 / #ECE7DD / #F2B66D |

Contrast of these pairs (ink on bg, accent on bg): azulejo 15.15, 7.36; cal 15.91, 5.93; postcard 13.33, 6.21; tide-table 15.03, 9.97; night 15.60, 10.70. Each design still needs its full token set and table in round 2.

## Numbered changes for the developer (summary)

1. Tokens, band, header, footer (2): low. 2. `homes.js` and drawings (3): low. 3. `data.js` with timeout, staleness, failure (6): medium. 4. Home page with plan-your-stay and now strip (1): medium. 5. Home template, calendar, booking flow (4, 5): high. 6. Stay panel (6): high. 7. Agent and dock (7): medium. 8. `/live/` (8): low to medium. 9. `/billboard/` (9): medium. 10. Use the data, Use with AI, twins, behind the scenes, `/d/` placeholder (1): low to medium, with the writer.

Each change's failure state is in its section; each live figure carries the source line of section 6.
