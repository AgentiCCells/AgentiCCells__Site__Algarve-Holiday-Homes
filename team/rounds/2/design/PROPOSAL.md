# Round 2 design proposal: pictures, and five designs (a made-up example)

Written by designer.algarve-holiday-homes@AgentiCCells.dinis, 18 November 2026. **Status: proposal**, for the reviewer, then the developer and the writer.

**Why this round.** Dinis Cruz, 18 November 2026, about 17:10 UTC (team/rounds/2.md): "see if we can generate some images of the house, right? Maybe try to put them in funny places ... really make sure you have different designs, but they also should look very professional. I think it's very important that this looks as authentic, and again, that's why the images are so important, right? Because the images really stand and also leverage the Algarve imagery". Decisions 1, 6 and 7 in the same file: the billboard goes, house pictures come from an image model through OpenRouter and are labelled as AI-generated pictures of invented houses, and there are five distinct designs under `/d/`.

**A note on the role file.** `team/designer/ROLE.md` says the homes are drawings and that no photo of a real place is passed off as a home. Decision 6 replaces the drawings with AI-generated pictures; the rule's purpose still holds and this proposal keeps it: no picture is a photograph, every picture says beside it that it is AI-generated and shows an invented house, and the made-up band now says so too (2.4). The conductor may want to update the role file's wording.

**Read with this file.**
- `IMAGES.md`: every image call (21, USD 1.3982), prompts word for word, what was rejected and why, the chosen 19, and alt text for each.
- `contact-sheet.jpg`: the 19 chosen pictures on one sheet.
- Mock-ups (static HTML, figures are examples read from the live site on 18 November 2026 at 16:30 UTC and say so on the page), rendered with Playwright, Chromium, 1366 px wide, JPEG quality 70:
  - `mockup-main.html` → `main-home-1366.jpg` (top 1340 px of the home page) and `main-homepage-gallery-1366.jpg` (top of `/homes/salt/`)
  - `mockup-revista.html` → `d-revista-1366.jpg` (design 1)
  - `mockup-azulejo.html` → `d-azulejo-1366.jpg` (design 2)
  - `mockup-costa.html` → `d-costa-1366.jpg` (design 4; its forecast values are those of `ipma-city-forecasts` latest.json read at 16:30 UTC, day 18 November)
  - The mock-ups load pictures from `/assets/img/`, the place proposed in 2.1. To open them now, serve a folder with `assets/img` pointing at the scratchpad `img/web/` folder (IMAGES.md, "Where the files are").

Build rules from round 1 still hold for everything here: static HTML, CSS and vanilla JS modules; no third-party scripts, fonts, maps or trackers; no web fonts from any host (all type below is system font stacks); no form `action`; only GETs to data.promptugal.news and our own files; nothing a visitor types is stored. Every page keeps the made-up band, the footer, the source line beside every live figure and the failure states of round 1, section 6.

## 1. What changes, in one list

1. Pictures go into the site: 19 files in two sizes under `src/assets/img/` (2.1).
2. Home page: photo hero with the plan-your-stay card over it, home cards with photos, a new row "The homes where they do not belong" with the five joke pictures (2.2, 2.3, 2.6).
3. Each home page gets a three-picture gallery: outside, inside, the joke picture (2.5).
4. Every picture is captioned as AI-generated and has alt text; the band and footer say the pictures are AI-generated (2.4).
5. The drawings stay as the brand mark and in two quiet places; they stop being the main picture of each home (2.7).
6. Five complete alternative home pages under `/d/<slug>/`: Revista, Azulejo, Linho, Costa, Postal (3).
7. The chooser `/d/` with a screenshot of each design (4).
8. The billboard is removed (decision 1); the nav gets "Five designs" in its place.

## 2. The main design with pictures

### 2.1 Files and markup

- Copy the 38 files from the scratchpad `img/web/` to `src/assets/img/`: `<name>-1600.jpg` and `<name>-800.jpg` for `salt|lagoon|hill|harbour|cape` x `hero|inside|funny` and `algarve-cliffs|street|market|dawn`. All are 3:2 (1600 x 1067, 800 x 533), progressive JPEG, quality 78 (three at 74 to 76, IMAGES.md), 1600 under 350 KB, 800 under 120 KB.
- Add to `homes.json`, per home, `"images": {"hero": "salt-hero", "inside": "salt-inside", "funny": "salt-funny"}` and the alt and caption text from IMAGES.md (writer to check). One source of truth, so the agent, the twins (`index.md`) and the five designs read the same words.
- Markup for every picture:
  `<img src="/assets/img/X-800.jpg" srcset="/assets/img/X-800.jpg 800w, /assets/img/X-1600.jpg 1600w" sizes="..." width="800" height="533" alt="..." loading="lazy" decoding="async">`. The home page hero alone drops `loading="lazy"` and takes `fetchpriority="high"`.
- `width` and `height` always set, so nothing jumps while pictures load.
- Page weight at 1366 (proposal, measured from the files): home page about 1.5 MB of pictures (hero 320 KB, five cards 5 x about 90 KB, five joke pictures 5 x about 90 KB, lazy below the fold); a home page about 0.6 MB (one 1600 and two 800 files). At 390 the 800 files serve everywhere.
- Note: the model returns 1264 px; the 1600 files are upscaled (IMAGES.md). Use them only where a picture is wider than about 1000 css px.

Cost: low (copying, one data field, one helper `img(name, sizes, alt)` in `src/assets/js/` or in the build).

### 2.2 Home page hero

See `main-home-1366.jpg`.

- Full-bleed `algarve-cliffs` behind the header block, 560 px tall at 1366, 420 px at 390. A left-to-right dark gradient under the heading: `rgba(20,16,12,.72)` from 0 to 50 %, `.62` at 60 %, transparent at 85 %. The text column ends at 58 %, so white text always sits on at least 62 % of that dark (worst case over a white sky 5.3:1 for the 19 px lead, 7.6:1 where the h1 sits; table in 2.8).
- Left: h1 "Five homes, five chimneys, one coast." and the round 1 lead, white. Right: the plan-your-stay card, white surface, a shadow, unchanged inside.
- Caption chip bottom right: "AI-generated picture of the Algarve coast, not a photograph".
- At 390: the picture is 240 px tall with the heading over it; the plan card follows below the picture, full width (not over it).
- Failure: if the picture fails, the hero background is `--sea` (#0E5A72) and the white text still passes (7.2:1). The alt text is in the `img`.

### 2.3 Home cards

- Picture on top (3:2, the `-hero` 800 file), an "AI picture" chip bottom left on the picture (`rgba(20,16,12,.62)` behind white 11 px text), then name, short line, sleeps, price "(invented)" as round 1.
- Five across at 1366, two across at 700 to 1100, one per row at 390 with the picture full width (not the round 1 side-by-side, the pictures need the width).
- The heading chip changes from "drawings, not photos" to "AI pictures of invented homes", and the line under it says "The pictures were made with an image model; none of these houses exists."
- When dates are chosen and a home is taken, the card keeps the picture at 40 % opacity with the word "Taken for your dates" over it (word, not only the fade).

### 2.4 Captions, alt text and the band

- Every `<img>` of a home sits in a `<figure>` with a `<figcaption>` or a visible chip. Wording, by kind (writer may change, the meaning must stay):
  - house pictures: "AI-generated picture of an invented house, not a photograph."
  - joke pictures: "AI-generated joke picture of an invented house."
  - Algarve pictures: "AI-generated picture of the Algarve, not a photograph."
- Alt text: the 19 lines in IMAGES.md, each starting "AI-generated picture" so a screen reader hears it first. Decorative repeats (a thumbnail next to a linked name, as in the Costa table) take `alt=""`.
- Band (every page) becomes: "**Made-up example.** Cinco Chaminés is an invented company: the homes, prices, availability and bookings are simulated, and the pictures are AI-generated. The weather, sea, UV and events are real, read live from data.promptugal.news. [What is this site?]"
- Footer column 1 adds: "Every picture of a home is AI-generated (image model: Google Gemini 3.1 Flash Image, through OpenRouter)." Column 3: "text and pictures CC BY 4.0".
- Behind the scenes, one paragraph (writer): how the pictures were made, the cost, a link to this round's IMAGES.md.

### 2.5 Home page gallery

See `main-homepage-gallery-1366.jpg`.

- Top of `/homes/<id>/`, under the title line: a grid, 2 columns (2fr 1fr) at 1366: the hero picture large on the left across two rows, inside and joke picture stacked on the right. Each with its caption under it.
- At 390: hero full width, then inside and joke picture side by side at half width (each about 170 px wide), captions under.
- Each picture links to its 1600 file (opens the file itself; no lightbox script).
- The calendar and stay panel move under the gallery (left column text and stay panel, right column calendar, as round 1).
- Failure: a missing picture shows its alt text in a box with `--taken` background at 3:2; the layout does not move.

### 2.6 "The homes where they do not belong"

- New row on the home page after the cards: the five joke pictures, square crops (`object-fit:cover`), five across at 1366, a horizontal scroll strip at 390 (`overflow-x:auto` inside the row, not the page; scroll snap; each 70 % wide), each with a short caption ("The Cape House on a sea stack") and "AI-generated, invented house".
- Line above: "We asked the image model to put each invented house somewhere it could never be. A reminder, if one were needed, that none of this is real."
- The agent may answer "show me the funny pictures" with these five (writer, script).

### 2.7 What happens to the drawings

- The chimney symbol stays as brand mark and favicon.
- The house drawings stay: on `/live/` (the drawn map, beside each home's pin), in the agent's answers (small, 64 px, where a picture would be heavy), and in `llms.txt` descriptions as text. They leave the cards and the home pages.
- Cost: low (remove from two templates).

### 2.8 Contrast, main design (WCAG 2 luminance formula, AA 4.5:1 for text)

| Pair | Ratio |
|---|---|
| ink #1F2328 on bg #FBF7F0 | 14.79 |
| ink-2 #545A62 on bg | 6.52 |
| accent #A13D1A on surface #FFFFFF | 6.57 |
| band-ink #3A2E00 on band #FBE7A1 | 10.85 |
| white on hero scrim `rgba(20,16,12,.72)` over pure white (worst case) | 7.64 |
| white on chip and scrim edge `rgba(20,16,12,.62)` over pure white (worst case) | 5.31 |
| white on `--sea` #0E5A72 (hero fallback) | 7.22 |

## 3. Five designs under `/d/<slug>/`

**Common to all five.**
- Each is a complete alternative home page at `/d/<slug>/index.html` with its own `style.css` and its own layout, reading the same modules as `/`: `homes.json`, `data.js` (with its timeout, staleness and failure states), `availability.js`. No copy of the data.
- Links to homes go to the main `/homes/<id>/` pages (the designs are home pages, not whole sites); a line under each design's header says "One of five designs of the same made-up example. [All designs] [Main site]".
- Same band text (2.4), set in the design's own style but always the first thing in `<body>`, full width, `role="note"`, not dismissible, at least 13 px, contrast at least 9:1 in every design.
- Same source lines beside every live figure: holder (IPMA, Instituto Português do Mar e da Atmosfera), file id, via data.promptugal.news, read time and age, source card link. Same failure words when a file cannot be read ("IPMA's figures could not be read just now"), never a stale number without its age.
- Every picture captioned as in 2.4.
- Type from system font stacks only. The stacks name fonts common on Apple, Windows, Android and Linux and end in a generic family; the look degrades to a plain serif or sans, never to a downloaded font.
- Light only in this round (`color-scheme: light`); dark is optional later.
- 390 px: no horizontal page scroll, 16 px side gutters, everything keyboard reachable with a visible focus ring (3 px, in each design's darkest colour, 2 px offset).
- Colour is never the only signal (warnings carry the word; taken days are struck through).
- No design imitates a booking platform, a real hotel, a real magazine's masthead, IPMA, or any real tile maker's pattern.

Hero and home picture choices are given per design so the five look apart at a glance.

### 3.1 Revista (`/d/revista/`)

**One line:** a calm travel-magazine issue: masthead, dateline with today's weather, a cover story and one feature per home.

**Palette (light)**
```css
--paper:#FAF8F3; --ink:#1C1B19; --ink-2:#5C5850; --accent:#8E3A1E; --column:#F0ECE3; --rule:#1C1B19; --band:#EFE3C2; --warn:#FFF1B8;
```
**Type:** display `"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua","URW Palladio L",Caladea,Georgia,serif`; text `Charter,"Bitstream Charter","Sitka Text",Cambria,Caladea,Georgia,serif` at 17 px / 1.6; labels `"Avenir Next","Segoe UI",Inter,"Helvetica Neue",Arial,sans-serif`, uppercase, 0.12 em tracking. Masthead 64 px, cover h1 52 px, feature h2 40 px, drop cap 3 lines in accent.

**Layout (1366)**
```
[band: small caps "MADE-UP EXAMPLE" + text, ruled underneath]
            Cinco Chaminés                       (masthead, centred)
   Five invented holiday homes ... (italic)
=================================================  double rule
WEDNESDAY 18 NOVEMBER 2026 | FARO 19.8 TO 22.4 °C | A MADE-UP EXAMPLE
  THE HOMES  THIS WEEK'S WEATHER  WHAT'S ON  ASK THE AGENT  OTHER DESIGNS
-------------------------------------------------
[ cover picture 8 cols          ] [ CONDITIONS TODAY box 4 cols ]
[ caption                       ] [ table, warning, source line ]
  THE COVER STORY                 [ IN THIS ISSUE: 5 homes      ]
  Five houses, five chimneys, and the weather ...
-------------------------------------------------
[ feature: picture 7 | text 5 ]  kicker, h2, standfirst, facts rule, drop-cap body, "Read on"
[ feature flipped: text 5 | picture 7 ]   (alternates for the five homes)
-------------------------------------------------
WHAT'S ON THIS WEEK (events, three columns, each with its source line)
```
At 390: one column; masthead 40 px; dateline wraps to two lines; conditions box after the cover picture; features picture first.

**Components:** masthead; dateline (the live forecast is the date's companion, with "example" in the mock-up and the source line in the conditions box); conditions box (table of air, sky, sea, waves, UV, warning); contents list; feature (with the inside and joke pictures as a pair under the main picture on the first feature); events columns.

**Band:** small caps "MADE-UP EXAMPLE" then the text, on `--band`, ruled below like a printed notice. **Source lines:** italic text-face lines at the foot of the conditions box and under each event column, 12.5 px, `--ink-2`.

**Pictures:** cover `algarve-street`; features use each `-hero`, first feature adds `-inside` and `-funny`.

| Pair | Ratio |
|---|---|
| ink on paper | 16.22 |
| ink-2 on paper | 6.67 |
| accent on paper | 7.13 |
| accent on column | 6.42 |
| ink on column | 14.60 |
| ink on band | 13.47 |
| paper on ink (reversed strap) | 16.22 |

Mock-up: `d-revista-1366.jpg`. Cost: medium (one CSS file, one template, feature loop).

### 3.2 Azulejo (`/d/azulejo/`)

**One line:** blue and white Portuguese tiles: tile-framed pictures, the live figures in square tiles, cobalt on white.

**Palette (light)**
```css
--bg:#F6F8FC; --tile:#FFFFFF; --ink:#14306E; --ink-2:#3D4F75; --cobalt:#1F4FA3; --on-cobalt:#FFFFFF; --band:#DCE6F7; --ochre:#7A4A00; --line:#B9C8E6; --warn:#FFF4C2;
```
**Type:** headings `Optima,Candara,"Gill Sans","Gill Sans MT","Noto Sans","Segoe UI",Carlito,sans-serif` (600, uppercase for nav and labels, 0.08 to 0.12 em); text `"Gill Sans","Gill Sans MT",Calibri,Carlito,"Segoe UI",system-ui,sans-serif` 17 px. h1 46 px, h2 30 px, tile figures 30 px.

**The tile:** one 48 x 48 SVG drawn by the team (corner quarter circles, a four-point star, a centre dot, joining strokes), cobalt on white, as a CSS data URI in `style.css`. Used as: a 32 px strip under the band and at the page foot; the logo square; the border of the hero (`border-image`); a 16 px frame round each home picture; a quarter-tile corner on each figure tile. Not copied from any real tile.

**Layout (1366)**
```
[band, pale blue, cobalt rule]
[tile strip 32 px]
[tile logo] CINCO CHAMINÉS                 HOMES  THE ALGARVE NOW  AGENT  OTHER DESIGNS
[tile border ------------------------------------------------]
[ picture 7 cols (harbour-hero)   | cobalt panel 5: h1, line,  ]
[ caption chip                    | button "Choose your dates" ]
[-------------------------------------------------------------]
The Algarve now
[ tile: Faro today ][ tile: sea ][ tile: UV ][ tile: warning (yellow fill + word) ]
source line
The five homes
[ Salt House, 2 cols wide, framed ] [ Lagoon House ]
[ Hill House ] [ Cape House ] [ Harbour House (joke picture) ]
[tile strip]
```
At 390: hero picture above the cobalt panel; tiles two by two; homes one per row.

**Components:** tile strip, tile frame, figure tile (label, figure, words, corner tile), home panel, cobalt panel with white button.

**Band:** pale blue `--band` with a 2 px cobalt rule under it, then the tile strip. **Source lines:** 12.5 px `--ink-2` directly under the row of tiles and under each home's figures.

**Pictures:** hero `harbour-hero`; homes use `-hero`; one card shows a `-funny` picture with its joke caption, rotating by day of the year.

| Pair | Ratio |
|---|---|
| ink on bg | 11.77 |
| ink on tile white | 12.52 |
| ink-2 on bg | 7.67 |
| white on cobalt (panel, button text reversed) | 7.76 |
| cobalt on bg (links) | 7.30 |
| ink on band | 9.96 |
| ochre (prices) on white | 7.48 |

Colour-blind note: blue and ochre differ strongly in lightness; the warning tile carries the word.

Mock-up: `d-azulejo-1366.jpg`. Cost: medium (the tile SVG is the only new asset).

### 3.3 Linho (`/d/linho/`)

**One line:** a quiet boutique-hotel page: one large picture per screen, linen and black, thin capitals, few words.

**Palette (light)**
```css
--linen:#F4F1EB; --ink:#141414; --ink-2:#5E5A53; --sand:#7B5B34; --band:#E7E0D3; --scrim:rgba(0,0,0,.70);
```
**Type:** display `Didot,"Bodoni 72","Bodoni MT","Noto Serif Display","DejaVu Serif",Georgia,serif` (400, large, 0.01 em); text and labels `"Helvetica Neue",Helvetica,Inter,Arial,sans-serif`, labels 12 px uppercase with 0.2 em tracking. h1 72 px at 1366, 40 px at 390.

**Layout (1366)**
```
[band, linen-grey, 13 px]
CINCO CHAMINÉS (spaced capitals, left)              HOMES   THE COAST   AGENT   DESIGNS
FARO 22 °C  ·  SEA 19.6 °C  ·  UV 2  ·  YELLOW WARNING, ROUGH SEA   (one thin line, sources link "i")
[ full-width picture, 88 vh: cape-hero, h1 in white bottom left on the scrim:            ]
[ "Five houses at the edge of Europe"   small caps: FIVE INVENTED HOMES, ONE COAST         ]
[ caption chip bottom right                                                                ]
[ panel per home, 100 vw x 80 vh: picture left 2/3 | right 1/3 on linen:                   ]
[   01 / 05   THE SALT HOUSE   Tavira   short line   SLEEPS 4   EUR 120 (INVENTED)          ]
[   "See dates" (text link, sand underline)   small: forecast for Faro, with source        ]
[ ... five panels, pictures alternate side ...                                             ]
[ row of the three Algarve pictures (market, street, dawn), captions under                 ]
```
At 390: picture 70 vh, panels stack picture then text; the weather line becomes two lines.

**Components:** the weather line (each value a link to its source card; full source lines in a disclosure "Sources and read times" under the line, open by default on wide screens, so the source is beside the figures, not only behind a click); full-bleed hero; home panel with index number; picture row.

**Band:** `--band` with ink text; it sits above the header, never over the picture. **Source lines:** under the weather line (see above) and in each home panel under its forecast figure, 12 px.

**Pictures:** hero `cape-hero` (1600); each panel its `-hero`; each panel also has a small "and where it does not belong" thumbnail (its `-funny`) under the text. Nothing appears on hover only, so touch and keyboard users see the same.

| Pair | Ratio |
|---|---|
| ink on linen | 16.34 |
| ink-2 on linen | 6.08 |
| sand on linen (links, with underline) | 5.50 |
| white on scrim `rgba(0,0,0,.70)` (worst case over white) | 8.59 |
| linen on ink (buttons) | 16.34 |
| ink on band | 14.04 |

Mock-up: none this round (the main mock-up's hero shows the full-bleed treatment). Cost: low to medium (simplest CSS of the five; the weather line needs care at 390).

### 3.4 Costa (`/d/costa/`)

**One line:** the coast first: a drawn map of the Algarve from Sagres to Tavira with each home pinned and its own forecast beside it.

**Palette (light)**
```css
--land:#F5EBD6; --land-2:#EADBB9; --sea:#CFE8EE; --sea-2:#A9D3DE; --ink:#10252D; --ink-2:#3F5961; --pin:#A63D17; --on-pin:#FFFFFF; --panel:#FFFFFF; --deep:#0B4F63; --band:#FBE7A1; --line:#C9D9DD;
```
**Type:** headings `ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Segoe UI",Inter,system-ui,sans-serif` (700); text `system-ui,-apple-system,"Segoe UI",Inter,Roboto,Arial,sans-serif`; figures `ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,"JetBrains Mono",monospace` with tabular numbers.

**The map:** inline SVG, viewBox 1100 x 520, coast drawn from about 30 rounded points (the path is in `mockup-costa.html`; x = (lon + 9.05) / 1.7 x 1100, y = (37.36 - lat) / 0.56 x 520), land and sea fills, a wave pattern, the Ria Formosa as a dotted line, town names, pins at the town centres from `homes.json` (lat, lon). It says "Map drawn by the team from rounded points; not for navigation." Build-time static SVG; only the callout figures are filled in by JS.

**Layout (1366)**
```
[band]
Cinco Chaminés                                        Homes  Cameras  Agent  Other designs
The coast today, home by home             (legend: pin = invented home, town centre)
[ map, full width, 1100 x 520 drawn coast                                         ]
[   callout per home: picture strip 2.6:1, number, name, forecast place + figures  ]
[   (land side for Hill, Salt; sea side for Cape, Harbour, Lagoon)                 ]
[   warning ribbon in the sea, bottom right (yellow + word)                        ]
source line (all files, issue and read times)
Along the coast, west to east  (table: thumb, home, forecast place and distance, today, sea, price)
```
At 390 the map shrinks to the full width with pins only (numbered 1 to 5), and the callouts become the table below, in the same order and numbering; nothing is placed over the map at that width.

**Components:** map with pins and leader lines, callout, warning ribbon, coast table. Leader lines and callouts must be placed in the SVG's own coordinates (as `foreignObject` or with positions computed from the viewBox at build), so they meet at every width; in the mock-up they are close but not exact.

**Band:** as main. **Source lines:** one line under the map naming each file, issue time and read time; each callout's forecast place name links to the source card; table cells repeat "nearest IPMA place, N km" where the place is not the home's town (from `forecast_note`).

**Failure:** if a forecast cannot be read, the callout says "Forecast could not be read just now" in place of the figures; the map and pins stay.

**Pictures:** each callout uses the home's `-hero` (800, cropped 2.6:1 by `object-fit`). No hero picture: the map is the hero.

| Pair | Ratio |
|---|---|
| ink on land | 13.39 |
| ink on sea | 12.40 |
| ink-2 on land | 6.31 |
| pin red as text on land | 5.37 |
| white on pin red (numbers) | 6.36 |
| deep (links) on panel | 9.08 |
| ink on panel | 15.85 |
| ink on band | 12.87 |

Colour-blind note: pins are red-brown with a white ring and a number; land and sea differ in lightness as well as hue.

Mock-up: `d-costa-1366.jpg`. Cost: medium to high (the map and its callout placement).

### 3.5 Postal (`/d/postal/`)

**One line:** warm Mediterranean postcards: each home a postcard with a stamp and a round postmark that carries today's forecast.

**Palette (light)**
```css
--bg:#F3E9D8; --card:#FFFDF8; --ink:#2A1F17; --ink-2:#5E4B3C; --terracotta:#A3361F; --on-terracotta:#FFFFFF; --sea:#1D5E73; --mustard:#E3B341; --band:#F2D27A;
```
**Type:** headings `Rockwell,"Roboto Slab","Zilla Slab","DejaVu Serif",Georgia,serif` (slab, 700); text `Charter,"Bitstream Charter",Cambria,Caladea,Georgia,serif` 17 px; postmark and stamp labels `"Avenir Next Condensed","Arial Narrow","Liberation Sans Narrow",Arial,sans-serif` uppercase.

**Layout (1366)**
```
[band, mustard]
Cinco Chaminés  (slab, terracotta)  · postcards from five invented homes          nav
[ hero: algarve-dawn full width, 460 px; over it, a white-bordered postcard turned 2 degrees: ]
[   "Greetings from the Algarve coast" (slab), the plan-your-stay fields on its back half    ]
[-------------------------------------------------------------------------------------------]
[ postcard ] [ postcard ] [ postcard ]      each: front = picture with a 10 px white border;
[ postcard ] [ postcard ] [ market card ]   back strip = name, line, sleeps, price (invented);
                                            stamp top right: the chimney in mustard;
                                            postmark circle over the stamp's edge (sea blue):
                                            "FARO · 18 NOV · 19.8 to 22.4 °C" with source line
                                            printed under the card in 12.5 px
[ "Wish you were here?" row: the five joke pictures as small cards, captions                ]
```
Cards turned by -1.5, 1 or 2 degrees in turn at 1366; flat at 390 (one per row), and flat for `prefers-reduced-motion` users and on keyboard focus (focus also lifts the card 4 px).

**Components:** postcard (front picture, back strip, stamp, postmark), hero card, joke-card row, market card (the `algarve-market` picture with "What's on this week" events list on its back).

**Band:** mustard `--band`, ink text, above everything. **Source lines:** printed under each card (holder, file, read time) and under the events list. The postmark shows the figure; the line under the card is the source beside it.

**Pictures:** hero `algarve-dawn`; cards use `-hero`; joke row uses `-funny`; one card `algarve-market`.

| Pair | Ratio |
|---|---|
| ink on bg | 13.36 |
| ink on card | 15.81 |
| ink-2 on card | 8.11 |
| terracotta on card | 6.65 |
| white on terracotta (button) | 6.76 |
| sea (postmark text) on card | 7.12 |
| ink on mustard (stamp label) | 8.26 |
| ink on band | 10.92 |

Mock-up: none this round. Cost: medium (the postmark is an SVG with a text path; figures go in as text, not drawn into the picture).

## 4. The chooser `/d/`

- Title "Five designs, one made-up example". Line: "The same invented homes and the same live data, laid out five ways. Each is a complete home page; the homes' own pages stay the same."
- Grid of six cards (three across at 1366, one at 390): the main design first ("The main site"), then Revista, Azulejo, Linho, Costa, Postal. Each card: a 1366 screenshot of the design's top 900 px (made at build by `scripts/shots.mjs` into `/d/<slug>/preview.jpg`, 800 px wide, under 120 KB), name, the one line above, the type pairing in words ("Palatino and Charter"), and "Open the design".
- Screenshot alt text: "Screenshot of the Revista design of this made-up example site." If a screenshot is missing, the card shows the design's palette as five swatches with the token names.
- Each design page links back to `/d/` and `/`.

Cost: low (static page, screenshots at build).

## 5. Pictures: what exists

19 chosen pictures (contact sheet: `contact-sheet.jpg`), made in 21 calls for USD 1.3982, plus the conductor's earlier test used as `salt-hero`; 22 of the round's 30. 7 generations of this agent's 28 remain, for the developer or writer to ask for (for example a portrait crop for phones, or a sixth "where it does not belong" picture for the agent). Full log and alt text: `IMAGES.md`.

## 6. Numbered changes for the developer and the writer

| # | Change | Reads | Failure state | Cost |
|---|---|---|---|---|
| 1 | Copy pictures to `src/assets/img/`; `images` field and alt and captions in `homes.json` | the scratchpad `img/web/`, IMAGES.md | missing file: alt text in a 3:2 box | low |
| 2 | Home page hero, cards with pictures, joke row (2.2, 2.3, 2.6) | `homes.json`, round 1 data files | hero falls back to `--sea`; live figures as round 1 | medium |
| 3 | Home page gallery (2.5) | `homes.json` | as 1 | low |
| 4 | Band, footer, captions wording (2.4), behind-the-scenes paragraph (writer) | IMAGES.md | none | low |
| 5 | Drawings moved to `/live/` and the agent (2.7) | `houses.js` | none | low |
| 6 | Remove `/billboard/` and its share card; nav "Five designs" | none | none | low |
| 7 | `/d/revista/` (3.1) | `homes.json`, `data.js`, `events-pt` | round 1 failure words | medium |
| 8 | `/d/azulejo/` (3.2) | as 7 | as 7 | medium |
| 9 | `/d/linho/` (3.3) | as 7 | as 7 | low to medium |
| 10 | `/d/costa/` (3.4) | as 7 plus lat, lon | per-callout failure words | medium to high |
| 11 | `/d/postal/` (3.5) | as 7 | postmark shows "not read" in place of figures | medium |
| 12 | `/d/` chooser with build screenshots (4) | `scripts/shots.mjs` | swatches in place of a missing screenshot | low |

Every new live figure carries the round 1 source line; every figure in the mock-ups is an example and says so.

## 7. Questions for the conductor

1. Should the role file's "homes are drawings" line be updated to match decision 6 (see the note at the top)?
2. Should the five designs also restyle the home pages (`/d/<slug>/homes/<id>/`)? This proposal says no for round 2 (cost), yes later if Dinis wants it.
3. The 1600 px files are upscaled from 1264 px. Acceptable for this round, or keep 1264 as the large size?
