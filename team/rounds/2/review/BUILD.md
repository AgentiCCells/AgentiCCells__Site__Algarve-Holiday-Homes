# Round 2 review of the build

Written by reviewer.algarve-holiday-homes@AgentiCCells.dinis, 18 November 2026, about 17:55 to 18:05 UTC, for the conductor. Reviewed: branch `dev` at 888cdac, built locally with `node scripts/build.mjs`, served from `_site/` on port 8795, driven with Playwright (Chromium 1.63, deviceScaleFactor 1). The working tree also holds untracked `src/assets/js/sim/` and `team/rounds/3/` (round 3 work, not part of this release; see S1). Live files read by the pages at the same time (ipma-city-forecasts read 17:39 to 17:56 UTC, ipma-sea, ipma-uv and ipma-warnings 17:41 to 17:56 UTC, events-pt 17:39 UTC with catalogue status "partly failed"). Everything about Cinco Chaminés is a made-up example.

Read for this review: `team/reviewer/ROLE.md`, `POLICY.md`, `team/rounds/2.md` (Dinis's words of about 17:10 UTC and the decisions taken from them), `team/rounds/1/review/BUILD.md`, `team/rounds/2/design/PROPOSAL.md`, `team/rounds/2/build/NOTES.md` and `NOTES-B.md`.

## Verdict

**DO NOT RELEASE YET.** Two must-fix items, both on source lines in the five designs. Everything else Dinis decided holds: the billboard is gone with no broken link, Dinis is not named on any public page outside behind the scenes, every picture is labelled AI-generated with sensible alt text, none of the 19 pictures shows text, a logo or a real business, failure states show no invented values in every design, the round 1 warnings fix holds, and the five designs are genuinely distinct and professional.

## Must fix

**M1. The five designs: the events source lines and the per-home forecast lines carry no terms.**
What: in Revista, Azulejo, Linho, Costa and Postal the events source line reads "Source: Câmara Municipal de ... (events-pt), via data.promptugal.news. Read 17:39 UTC ... Source card · Publisher's page", with no terms (the main site's home pages add "Unclear: no licence found; reference use with attribution and a link"). The per-home forecast lines (`shortSrc` in `kit.js`, five per page in Azulejo, Linho and Postal; the home features in Revista; the Costa table) give holder, read time and card link but no terms; IPMA's terms appear once, in the strip at the top, several screens away from the home figures. Cause: `kit.js` exports `src = (res, opts = { terms: false })`, and `shortSrc` has no terms clause.
Why: the brief asks for the source, read time and terms beside every figure; round 1 M2 was the same fault on the agent and was fixed there.
Rule: WORKFLOW, rules for every role (source, publisher, time read; follow each source's terms); POLICY N14.
Fix: call `D.sourceLine(res)` with terms for events (or `{terms: true}`), and add a short clause to `shortSrc`, as the agent does: "IPMA's terms: no profit-making use; name IPMA" or, for events, "reference use with attribution and a link".

**M2. Linho at 390 px: the weather line's figures show without their read time or terms.**
What: under 900 px the "Sources and read times" disclosure is closed, so "FARO 22.4 °C, LIGHT RAIN · SEA 19.5 TO 19.8 °C · UV 2.4 LOW · YELLOW WARNING" sits on screen with only the disclosure label beside it; the read time, age and terms are hidden until it is opened. Shot: `shots/linho-390-sources-closed.jpg`. (At 1366 it is open by default and passes; it also opens when a file fails.)
Why: a phone reader sees live figures with no time read, which is the very thing the stale rule guards.
Rule: POLICY N14, N17.
Fix: open it at every width, or put "IPMA, read 17:39 UTC, 16 min ago" in the line itself, outside the disclosure.

## Should fix

- **S1.** The build copies `src/assets/js/sim/` into `_site/assets/js/sim/` and renders `team/rounds/3.md` as `/behind-the-scenes/rounds/3/`. They were untracked when I built; by the end of this review they were committed (28b331c, "Round 3 build (instance C)"), so a release of dev now publishes them. Checked at 18:05 UTC (12 files): no "Dinis" or "Cruz", no platform brand, no em dash; cast.json is marked `"invented": true`; no public page links to them. Not reviewed as a feature (round 3); if round 2 is released alone, release from 888cdac or exclude them.
- **S2.** /d/: the six screenshots have alt text "Screenshot of the ... design" and no note that the pictures in them are AI-generated; add it to the alt or the card line.
- **S3.** Weight: Linho loads 1.84 MB of images at 1366 (14 pictures), the home page 1.21 MB, Postal 1.17 MB. Layout shift: Linho 0.075 at 1366 and 0.037 at 390, Revista 0.045 at 1366; all under 0.1, every other page 0 to 0.006. Linho could lazy-load its picture row and thumbnails harder.
- **S4.** The agent still answers "Tell me about the billboard" with "A billboard idea came up ... it belongs to a different project". Fine as an answer to a direct question; drop the intent if the word should not appear at all.
- **S5.** HTML comments in `_site/d/index.html`, `_site/live/index.html` and `site.css` carry agent identifiers ending `@AgentiCCells.dinis`. Not visible, not a person named, but the conductor may prefer them out of public source.
- **S6.** Events columns in all five designs are long blocks of 12 to 12.5 px text; readable (contrast 6 to 7.7) but the least finished part of each page. Revista's dateline figure ("FARO 19.8 TO 22.4 °C") is a screen away from its source line in the conditions box.
- **S7.** Not checked: a slow file in the browser, a screen reader, a person's keyboard walk.

## Checks, line by line

### Made-up example (POLICY N12)
"Made-up example" visible on all 19 pages loaded (/, /homes/, five /homes/<id>/, /agent/, /live/, /d/, five /d/<slug>/, /use-the-data/, /use-with-ai/, /behind-the-scenes/, /behind-the-scenes/rounds/2/) at 390 and 1366, and in all 17 Markdown twins and /llms.txt (2 to 6 times each). The band now says the pictures are AI-generated. Prices "(invented)", availability "(simulated)" in every design.

### Pictures (decision 6)
- Every `<img>` on the public pages has alt text starting "AI-generated" (or the chooser's "Screenshot of ...", S2) and a caption or chip saying "AI-generated picture of an invented house (or of the Algarve), not a photograph" or "AI picture". All have width and height. All load (Costa's callout pictures are hidden at 390 by design).
- I looked at each of the 19 `src/assets/img/*-800.jpg`: salt hero, inside, funny; lagoon hero, inside, funny; hill hero, inside, funny; harbour hero, inside, funny; cape hero, inside, funny; algarve cliffs, street, market, dawn. None shows legible text, a logo, a sign or a business name. Near misses, all acceptable: a small blank plaque over the door in lagoon-hero, a map of Portugal with no legible words in lagoon-inside, blurred tags on the far stalls in algarve-market, a fort wall in harbour-hero that recalls Lagos (Algarve imagery, captioned as an invented house). The joke pictures read as jokes.
- Share cards: 18 PNGs in `_site/assets/share/`, largest 162,045 bytes (home-cape), all under 300 KB.

### Billboard gone (decision 1)
No `/billboard/` page, card or nav item; no link containing "billboard" on any public page (0 on all 19); every internal link on each page at 1366 returns 200. The word appears on public pages only in behind the scenes (team record, allowed) and in the agent's script (S4).

### Dinis not named (decision 5)
No "Dinis" or "Cruz" in visible text, twins or llms.txt on any page outside /behind-the-scenes/ (which renders `team/`, allowed). The agent's "Who made this?" answer names no person. Only HTML comments carry agent ids (S5).

### Booking platforms
grep of `_site/` outside behind the scenes for the validator's list plus airbnb, booking.com, vrbo, expedia, tripadvisor, holidu: none. The integration note on /use-the-data/ says "a holiday-rental booking platform". No em dashes.

### Source lines (POLICY N14)
Main site: unchanged from round 1 and passing (each home page block ends with source, read time and terms). Designs: 9 to 13 source lines per page with publisher, file id, read time and age; IPMA terms once per page; events and per-home lines without terms (M1); Linho at 390 hides them (M2).

### Failure states (POLICY N17)
With `page.route` aborting data.promptugal.news, at 390 and 1366, on /, /homes/cape/ (with dates) and all five designs: no °C, metre, km/h, % or UV value anywhere; Revista shows "not read" in each conditions row and "FARO: FORECAST NOT READ" in the dateline; Azulejo and Postal "Not read" tiles; Linho "FARO FORECAST NOT READ · SEA NOT READ ..."; Costa "Forecast could not be read just now" in each callout; each with Try again. No page errors. Shot: `shots/all-blocked-1366.jpg`.

### Warnings beyond the file (round 1 fix)
/homes/hill/ 19 to 28 November: "For Sat 21 Nov to Sat 28 Nov no warnings are issued yet, so this page cannot say either way", then "The warnings file covers ... Wed 18 Nov to Fri 20 Nov". 10 to 14 December: "No warnings issued for these dates yet, so this page cannot say either way". Agent, after a January price question then "Any warnings for the Algarve?": lists the current yellow warning, states the file covers 18 to 20 November, no all-clear, with IPMA's terms. The five designs with 10 to 14 December chosen: no all-clear wording anywhere. Holds.

### The five designs, honest view
- **Revista** (travel magazine). Strengths: the most authentic of the five; masthead, double rule and dateline, the conditions box, alternating features with drop caps and the five-day table read like a real magazine. Weaknesses: long (6,500 px at 1366); the dateline figure sits far from its source; events are a dense block.
- **Azulejo** (tiles). Strengths: strongest identity; the CSS tile strip and tile-bordered hero with cobalt panel are well made and clearly Portuguese without copying a maker. Weaknesses: the homes grid is uneven (one large card, four small) and the tile frames get busy; the navy focus ring is weak against the cobalt panel.
- **Linho** (boutique hotel). Strengths: calm, generous, photography-led; the full-bleed hero and alternating panels show the pictures best. Weaknesses: the longest page (7,300 px) and the heaviest (1.84 MB); the weather line depends on a disclosure (M2).
- **Costa** (coast map). Strengths: the most useful; the drawn coast with numbered callouts and the west-to-east table answer "where, and what is the weather there" at a glance; honest labels ("positions are town centres", "not for navigation"). Weaknesses: callouts vanish below 1100 px, so phones get pins and a table only; plainer type than the others.
- **Postal** (postcards). Strengths: warm and playful, the tilted postcard hero with the date form on the lined back is a good idea, stamps and postmarks carry live figures as text. Weaknesses: closest to novelty; the small postmark text and stamp labels are the hardest to read; the postcard grid is crowded at 1366.
All five are distinct from each other and from the main site, use Algarve pictures well, and look professional. Shot: `shots/designs-full-1366.jpg`, tops: `shots/<slug>-1366.jpg`, phones: `shots/all-390.jpg`.

### Layout, keyboard, contrast, console
- Horizontal overflow: 0 px on all 19 pages at 390 and 1366.
- Console: no errors or warnings, no failed requests, on all 38 loads.
- Keyboard: Tab gives a 3 px solid outline on every page (main site #0E5A72; each design its darkest colour: Revista #1C1B19, Azulejo #14306E, Linho #141414, Costa #10252D, Postal #2A1F17).
- Contrast, lowest text pairs from computed styles (WCAG ratio, AA 4.5): main site 6.15 (accent link on bg), 6.52 (ink-2); Revista 6.0 (source lines on the conditions box); Azulejo 7.3; Linho 5.5 (sand links in the source block at 12 px); Costa 6.31; Postal 5.62 (nav links). Picture chips over the worst case of a white picture: Linho scrim .70 gives 8.5, Postal .82 gives 9.0, Costa .85 gives 9.9. Bands 10.9 to 14.0. All pass; NOTES-B's unmeasured colours included.
- Images: see S3.

Shots in `shots/` (JPEG quality 70, each under 250 KB).
