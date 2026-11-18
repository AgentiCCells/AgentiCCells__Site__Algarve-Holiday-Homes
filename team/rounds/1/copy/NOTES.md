# Round 1 copy: notes

Written by writer.algarve-holiday-homes@AgentiCCells.dinis, 18 November 2026, about 16:20 to 17:00 UTC. Files only: nothing committed, pushed or sent. `board/HOLD.md` did not exist at the start or end.

## What I wrote

| File | What | For the developer |
|---|---|---|
| `src/assets/js/agent-script.js` | ES module: `LABEL`, `SUGGESTED` (8), `FALLBACK`, `MESSAGES` (need a home, default dates, forecast too far, missing, stale, no events, simulated), `HOME_WORDS` (words that name each home) and `INTENTS` (35, in priority order). The slot names and the matching rules are documented in the comment at the top. | Implement the matcher (normalise, first match wins) and the slots. Weather, sea, UV, warnings and events answers are slots only: no figure is written as fixed text (POLICY N14). |
| `src/data/homes.json` | The company (Cinco Chaminés, tagline, `about` saying it is a made-up example) and the five homes from NAME.md, with bathrooms, check-in and check-out, pets, accessibility, `good_for`, `car_needed` and the data places. Everything `"invented": true`. | `good_for` tags feed `{homes:for:<tag>}`; `pets` feeds `{homes:pets}`; `data.uv_fallback_id` is for the two homes on the unconfirmed UV place 1081525. |
| `src/use-the-data/index.html` | Use the data: what data.promptugal.news is, the five sources with latest, reads and card links, the Algarve ids, JavaScript and curl examples, how to read a card, the terms, staleness, how a real business could build this. | The "Status now" cells are `<td data-status="<source id>">not read yet</td>`: fill them from the catalogue (`status`, `read_at`), or remove the column. Uses `/data/homes.json` and `/live/` links. |
| `src/use-with-ai/index.html`, `index.md` | Use with AI, with three prompts and the rules. | The page says every page has a Markdown twin at its address plus `index.md`, as on the IPMA site. If the build does not make twins, tell me and I will change that line (and the same line in `llms.txt`). |
| `src/llms.txt` | Index for agents: pages, this site's files, the data addresses with the Algarve ids, the rules. | Lists `/`, `/live/`, `/billboard/`, `/use-the-data/`, `/use-with-ai/`, `/behind-the-scenes/` and their twins. Home pages are not listed because their paths are not decided; add them when they are. `__VERSION__` is left for the build. |
| `src/billboard/index.md` | Words for the billboard proposal page, with three mock-ups and the data feeding each. | Build the HTML from it. The top comment has a suggested title, description and `data-sources`. |
| `src/live/index.md` | Words for Live from the Algarve. | The camera list is a bracketed placeholder: draw it from `/data/cameras.json`. If this file is also published as the page's twin, replace the placeholder with the list. |

Both HTML pages follow the page contract (doctype, `<!--HEAD-->`, `<!--HEADER-->`, `<main id="main">`, `<!--FOOTER-->`) and contain "made-up example" in the main text.

## What I checked, and how

- **Every data address printed** (llms.txt, index.json, openapi.json, README.md; latest, reads and card for the five sources; events by-place for lagos, faro, tavira and index; by-place now for tavira, faro, loule, lagos, vila-do-bispo, algarve): HTTP 200 with curl, 18 November 2026 at 16:30 UTC.
- **The examples ran.** The JavaScript block ran under Node 22 against the live files (Faro forecast, FAR warnings, Lagos events 21 to 28 November: 38 events). Each curl and jq command was run as printed and returned data. `card.json` keys checked: `publisher`, `terms {summary, quote, quote_lang, page, read_at, republish, open_question}`, `license`, `schedule.cadence`. Catalogue `status` values seen: ok, partly failed, archived.
- **Field names** from team/rounds/1/research/DATA.md, confirmed in the live files: `cities[].id/area/days[]`, `active[].area/level/type/start/end`, `coasts[]`, `places[]` (UV), `places.<place>[]` (events, a list per place), `events[]` in by-place.
- **IPMA's terms** quoted from `ipma-city-forecasts/card.json` `terms.summary`; **events-pt terms** from `events-pt/card.json` (`terms.summary`, `terms.republish`).
- **External links:** ipma.pt forecast and warnings pages answered 200. ANEPC's site (prociv.gov.pt) did not answer from this session, so ANEPC is named without a link.
- **The agent's matching:** a test script ran every suggested question, starter and follow-up, plus some English and Portuguese questions, through the intents in order. Each landed on the intended intent (for example "Is the Harbour House free from 21 to 28 November?" to availability, "Which home is best for surfers?" to for-surfers, "is it step-free?" to accessibility, "qual é o tempo em Lagos" to weather, "blah blah" to the fallback). Every pattern compiles as a RegExp.
- **Wording:** no em dash (grep for U+2014 on all my files: none); no booking-platform names (the validator's list); no hype words (the validator's list and a wider one: only "perfect" appears, as a word a visitor might type in the thanks pattern). No person named but Dinis Cruz.
- **Build and validator:** `node scripts/build.mjs` then `node scripts/validate.mjs` reported only that the layout placeholders are unreplaced and there is no og:image on my two pages, which the developer's layout adds. I removed `_site/` afterwards.

## Sources of the claims

- Homes, company, prices: invented (team/rounds/1/research/NAME.md); bathrooms, times, pets, accessibility and `good_for` are mine, invented and labelled.
- Data places per home: NAME.md, matching the live files read on 18 November 2026.
- Billboard formats: team/rounds/1/research/BILLBOARD.md (Bauer Media Outdoor and media.co.uk read 18 November 2026; AdQuick seen in search results only, and the page says so).
- Camera rules and operators' terms: team/rounds/1/research/CAMERAS.md and src/data/cameras.json.
- Dinis's words: the brief, 2026-11-18 about 16:10 UTC.

## Unsure, or for someone else to decide

- **General knowledge, not checked against a source today:** Faro airport serves the Algarve; the Algarve railway runs Lagos to Vila Real de Santo António through Faro and Tavira, with trains from Lisbon to Faro; the A22 crosses the Algarve; holiday lets in Portugal must be registered as alojamento local and show the number. The answers ask the reader to check current timetables, road rules and registration rules. I left out toll details on purpose (the rules on the A22 have changed).
- **"Most of the cost is the static host and a domain name"** on Use the data: general reasoning, no figure given.
- **UV place 1081525** is shown as "Sagres area, unconfirmed", as DATA.md advises.
- **The billboard page says "We have asked him for the link"**, as the conductor's brief told me to write. The conductor should make sure the question has gone to Dinis.
- **The billboard mock-up 2 pauses the advert during a warning:** a proposal of mine, not a rule from a source.
- **ROLE.md asks for `COPY.md`**; the round brief asked for this NOTES.md, and the agent's intents with their patterns and answers are in `agent-script.js` itself. Say if a separate COPY.md is wanted.
- **The events-pt card says "no AI training".** Use with AI tells agents not to train on or republish the events, and its events prompt keeps to name, date, venue and link. Whether an assistant reading the file for a person counts as reference use is not settled; the card leaves republishing to Dinis.
