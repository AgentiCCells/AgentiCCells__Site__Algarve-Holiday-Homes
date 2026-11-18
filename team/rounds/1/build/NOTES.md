# Round 1 build notes (developer, instance A)

Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance A), 18 November 2026, from the conductor's brief and `team/rounds/1/design/PROPOSAL.md`. Everything on the site about Cinco Chaminés is a made-up example; the figures below in "Checked" come from the live files read on 18 November 2026 about 16:50 UTC.

## What I built

- **Build** (`scripts/build.mjs`): copy `src/`, then `behind.mjs`, the optional `designs.mjs` (round 2), then `layout.mjs`, then the version stamp. The version.json logic is unchanged.
- **Layout** (`scripts/lib.mjs`, `scripts/layout.mjs`): SITE, REPO, NAV as in the proposal (Homes, Agent, Live cameras, Billboard (proposal), Use the data, Behind the scenes; Use with AI in the footer); the made-up band (proposal 2.3, word for word) first on every page; `head()` with canonical, Open Graph and Twitter tags and `og:image` from `<meta name="share-image">` (default `/assets/share/home.png`); footer naming IPMA with its terms, events-pt as reference use, PrompTugal.news data CC BY 4.0, and the version; a docked "Ask the agent" link to `/agent/` on every page but `/agent/` itself. `layout.mjs` also writes the five home pages from one template (`src/homes/_home.html` plus the writer's `src/data/homes.json`), the home cards (`<!--HOME-CARDS-->`), and a Markdown twin per page unless a hand-written `index.md` exists.
- **Behind the scenes** (`scripts/behind.mjs`, adapted from the IPMA data cell, Apache-2.0): six roles with the `.algarve-holiday-homes` suffix, policies, a six-step flow diagram, every round report and round file, the commit timeline from `git log`, and a "What is this site?" section (`#what`, the band's link).
- **Look** (`src/assets/site.css`, `src/assets/favicon.svg`): the proposal's tokens light and dark (`prefers-color-scheme` and `data-theme`), header with a Menu button below 760 px, cards, calendar, stay panel, footer, behind-the-scenes styles.
- **Data** (`src/assets/js/data.js`): the interface instance B codes against: `getSource`, `sourceLine`, `forecastFor`, `warningsFor`, `seaFor`, `uvFor`, `eventsFor`, `stayDates`, `setStayDates`, `homes`, plus helpers (`today`, `addDays`, `fmtDay`, `esc`, `forget`, `stayQuery`, `home`, `uvBand`, `weatherWords`). GETs only, 8 s timeout, one read per page load; stale after twice the card's cadence (hourly 2 h, every 6 hours 12 h); the catalogue's "partly failed" status shown on the source line. `forecastFor` takes an optional fourth argument `{ now }` for tests.
- **Simulated availability** (`src/assets/js/availability.js`): FNV-1a of `"<home>|<today in Lisbon>"`, mulberry32, free gaps 1 to 9 nights, taken runs 2 to 7, one year ahead.
- **Drawings** (`src/assets/js/houses.js`): the five houses and the chimney from the mock-up, as inline SVG using the tokens; used in the browser and at build time.
- **Pages**: `/` (hero, Plan your stay, The Algarve now with a source line per source and IPMA's terms, five cards with "free for your dates (simulated)", the agent entry), `/homes/`, `/homes/{salt,lagoon,hill,harbour,cape}/` (drawing, facts, keyboard calendar with date inputs, booking flow, stay panel with forecast, warnings, sea, UV and events, each with a source line and loading, failure with Try again, stale, empty and out-of-range states), `/d/` (says the five designs come in round 2). Scripts: `home.js`, `house.js`, `site.js` (menu).
- **Booking flow**: Dates, Guests (steppers limited to "sleeps", pets answer per home), Details (box "This form keeps nothing and sends nothing"; name optional, arrival time, note; no email, phone, address or payment fields; the form has no action and no method; submit is caught with `preventDefault`), Review, and the final screen with exactly "This is a demonstration: nothing was booked, nothing was sent, nothing was charged." Typed values live in page memory only and are cleared there.
- **Share cards** (`scripts/cards.mjs`, adapted from the IPMA data cell): 13 PNGs, 1200 x 630, 90 to 114 KB each, no live figures, "Made-up example" in each band: home, homes, home-salt, home-lagoon, home-hill, home-harbour, home-cape, agent, live, billboard, use-the-data, use-with-ai, behind-the-scenes. Pages B and the writer own already point to theirs.
- **Tests** (`tests/data.test.mjs`, fixtures `tests/fixtures/ipma-sea.sample.json`, `ipma-uv.sample.json`, `card.sample.json` added, cut from the live files with IPMA named; the UV fixture has one duplicate and one id 0 entry added by hand, and says so). `node --test`: 11 pass, 1 skipped (the live test). `LIVE=1 node --test tests/data.test.mjs` reads the live files: passed at 16:50 UTC (forecast Faro five days, warnings FAR one yellow rough sea, events lagos 52 in the next 14 days, events-pt "partly failed").

## How to run

```
node scripts/cards.mjs          # only when a card changes (needs Playwright's Chromium)
node scripts/build.mjs && node scripts/validate.mjs && node scripts/leak-scan.mjs
node --test                     # LIVE=1 node --test tests/data.test.mjs for the live check
cd _site && python3 -m http.server 8765
```

## Checked (18 November 2026, about 16:55 UTC)

- build, validator (OK), leak scan (OK), `node --test` (11 pass).
- Playwright at 390 and 1366 px: `/`, `/homes/`, `/homes/lagoon/?from=..&to=..`, `/homes/cape/`, `/behind-the-scenes/`, `/d/`: no horizontal overflow, no console errors or warnings, no block left loading or failed, five source lines on the home page and on each home page. The booking flow walked to the final statement at both widths.
- Screenshots in `shots/`: home and the Lagoon House stay panel at 390 and 1366 px, the review step at 390, the final screen at 1366 (JPEG quality 70).

## Open

1. **Scope**: `scripts/build.mjs` is listed as a gate in my POLICY.md (C6) and is not in the developer's paths in `team/scopes.json`, but the conductor's brief gave it to me. The change is small (it now imports behind.mjs, designs.mjs and layout.mjs). It should be committed under the conductor's trailer, or the scope changed with Dinis's word, or role-scope.mjs will fail. I wrote no `scripts/homes.mjs` for the same reason: the home pages are generated in `layout.mjs`.
2. **Stay dates in sessionStorage**: the brief asked for the address plus sessionStorage. Policy N12 says no storage of form input; dates are not personal, and nothing else typed is stored, but the reviewer should confirm.
3. **Query names**: the proposal says `?arrive=&leave=`, the brief `?from=&to=`. `stayDates()` reads both and writes `from`/`to`.
4. The warnings gloss in English per type (the writer's job in the proposal) is not built; the type is shown in English from the file and the text in Portuguese, labelled.
5. Not tested: a slow or missing file in the browser (the code paths are covered by the Node tests with a 404 and bad JSON, not by a browser run with the network cut); dark mode screenshots; keyboard walk by a person.
6. The events source line uses the card's long publisher line (four publishers); each event also names its own source.
