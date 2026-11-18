# Round 2 build notes (developer, instance B): the five designs

Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 18 November 2026, about 18:10 UTC, from the conductor's brief for round 2, `team/rounds/2.md` (Dinis Cruz, about 17:10 UTC: "really make sure you have different designs, but they also should look very professional ... authentic ... leverage the Algarve imagery") and `team/rounds/2/design/PROPOSAL.md`, section 3. Files only: nothing committed, pushed or sent.

## What I built

Five complete alternative home pages, each in its own folder with `index.html`, `style.css`, its own script and a copy of `kit.js`:

| Design | Path | Look | Pictures | Live figures |
|---|---|---|---|---|
| Revista | `src/d/revista/` | travel magazine: masthead, double-ruled dateline with today's Faro forecast, cover story, conditions box, one feature per home (alternating 7/5 grid, drop cap), five-day weather table, events in three columns, colophon | cover `algarve-street`; each feature `-hero`; first feature adds `-inside` and `-funny` | conditions box (air, sky, sea, waves, UV, FAR warning), week table (Sagres, Portimão, Loulé, Faro), events (Faro, Lagos, Tavira) |
| Azulejo | `src/d/azulejo/` | blue and white tiles drawn in CSS/SVG (the designer's 48 px tile as a data URI): tile strip under the band, tile logo, tile-bordered hero with cobalt panel and the date form, four figure tiles with tile corners, tile-framed homes, events tiles, tile strip over the footer | hero `harbour-hero`; homes `-hero`; one card shows its `-funny` picture, a different home each day of the year | four tiles, today's forecast per home, events |
| Linho | `src/d/linho/` | boutique hotel: one thin weather line (each value links to its source card, full source lines in "Sources and read times", open by default at 900 px and up and whenever a file fails), full-bleed hero at 88 vh, quiet intro with underline date fields, one full-width panel per home (picture 2/3, text 1/3, alternating), picture row, events | hero `cape-hero`; panels `-hero`, each with a `-funny` thumbnail; row `algarve-market`, `-street`, `-dawn` | weather line, today's forecast per home, events |
| Costa | `src/d/costa/` | drawn coast map (the mock-up's 30-point path, viewBox 1100 x 520), pins numbered 1 to 5 west to east at the town centres from the proposal's formula, callouts placed in the map's own coordinates, warning ribbon in the sea, west-to-east table (forecast place and distance, today, sea, UV, simulated availability, invented price), cliff banner, events west to east | callouts and table thumbs `-hero`; banner `algarve-cliffs` | per-home forecast, sea and UV (with the UV fallback place for Lagos and Sagres), FAR warning, events |
| Postal | `src/d/postal/` | postcards: dawn hero with a large postcard turned 2 degrees (message on the front half, date form on the lined back half), "Today's post" as four perforated stamps, five postcards with a mustard chimney stamp and a round SVG postmark carrying today's forecast as text, a sixth market card with the week's events on its back, "Wish you were here?" row | hero `algarve-dawn`; cards `-hero`; market card `algarve-market`; joke row `-funny` | stamps (forecast, sea, UV, warning), postmark per home, events |

Common to all five:

- Page contract: title, description, `<meta name="share-image" content="/assets/share/d-<slug>.png">` (instance A made the cards; the validator finds them), `<!--HEAD-->`, `body data-sources`, `<!--HEADER-->`, `main` with "made-up example" visible (an "also" line linking to All designs and Main site, and a made-up note in the design's own style), `<!--FOOTER-->`.
- The shared band, header, footer and dock are restyled per page through `body.d-<slug>` only; `site.css` is untouched. Each page sets the site's tokens on its body, so header, band and footer follow the design.
- **Light only**, as the proposal says for this round: `color-scheme: light` on the page and its own palette in both modes. Checked with the browser set to dark: body background and ink stay the light palette.
- Homes from `/data/homes.json` through `data.js`; links go to `/homes/<id>/?from=..&to=..`. Without chosen dates the page shows example dates (two days on, three nights) and says "example dates: choose your own". The date form has no action and no method; submit is caught, dates go to the address and this tab through `setStayDates`. Availability from `availability.js` (simulated), prices from `price_eur_invented` (invented), each labelled.
- Every live figure has data.js's `sourceLine` beside it (publisher, file id, via data.promptugal.news, read time and age, stale words, source card); figures repeated in a card get a short line (`shortSrc` in kit.js) with the same holder, id, read time, age, stale and failure words and the card link. IPMA's terms beside the strip.
- Failure: "IPMA's figures could not be read just now" or "The town agendas could not be read just now", no number in place of one, and a Try again button that forgets the source and reads again. Costa's callouts say "Forecast could not be read just now"; Postal's postmark says "NOT READ".
- Pictures: `<img>` with `-800.jpg` and `-1264.jpg` in `srcset`, width and height set, lazy except the hero; every one captioned "AI-generated picture of an invented house (or of the Algarve), not a photograph" and with the alt text from IMAGES.md (kit.js reads `homes.json`'s `images` field first, string or `{name, alt}`, then the IMAGES.md alt).
- System font stacks from the proposal only; no web fonts, no third-party scripts; GETs only to data.promptugal.news and the site. Focus ring 3 px solid in each design's darkest colour, 2 px offset. Warnings carry the word; taken stays are struck through or dashed, never colour alone.

`kit.js` is identical in the five folders (one md5), so each design stands alone; change it in one and copy it to the others.

## Checked (18 November 2026, about 18:00 UTC)

- `node scripts/build.mjs && node scripts/validate.mjs`: OK. `node scripts/leak-scan.mjs`: OK.
- Served `_site` on port 8772; Playwright (Chromium) at 390 x 844 and 1366 x 800, each design: no console errors or warnings, no horizontal overflow, no broken images, no block left loading, "made-up example" in `main`, 9 to 13 source lines per page, none in error with the live files (IPMA files read 17:39 to 17:41 UTC).
- Failure states: with `ipma-city-forecasts` blocked, each page shows the failure note with Try again and the source lines say "Could not read it just now"; same with `events-pt` blocked. No console errors other than the blocked requests themselves.
- Date form at 1366 in dark mode: dates 4 to 9 December go into the address, the home links carry them, the message confirms, and each home shows free or taken (four of five taken, matching `availability.js` in Node). Tab reaches a link with a 3 px solid outline.
- Screenshots in `shots-b/` (JPEG quality 70, all under 300 KB): `<slug>-390.jpg` (top 3200 px) and `<slug>-1366.jpg` (top 1500 to 2100 px, cropped to stay under 300 KB), plus `costa-*-fail.jpg` and `postal-*-fail.jpg` with the forecast file blocked.

## Open

1. Contrast: the palettes and pairs are the proposal's measured tables; the few colours I added (taken-state greys, red text #7A2A10, #7A1A1A, #8A2A0C, #7A1E0E on light grounds, the green #14532D on white) are dark enough by eye but were not measured with a tool.
2. Not done: a slow (rather than failed) file in the browser; a keyboard walk by a person; dark palettes (light only, as proposed).
3. Costa at 1100 px and below hides the callouts (pins only, the table carries the figures), as the proposal says for 390; between 1100 and 1366 the callouts were checked only at 1366.
4. The live events window is today to seven days ahead; events that began earlier show "on now, until ...".
5. Events show the events-pt catalogue status ("partly failed" at the time of checking) on their source lines, as data.js writes it.
