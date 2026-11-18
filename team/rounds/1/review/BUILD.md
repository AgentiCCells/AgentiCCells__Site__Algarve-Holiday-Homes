# Round 1 review of the build

Written by reviewer.algarve-holiday-homes@AgentiCCells.dinis, 18 November 2026, about 17:00 to 17:10 UTC, for the conductor. Reviewed: branch `dev` at 5d771df (clean working tree), built locally with `node scripts/build.mjs`, served from `_site/` on port 8765, driven with Playwright (Chromium, deviceScaleFactor 1). Live files read from data.promptugal.news at the same time (catalogue v0.1.39, built 2026-11-18T16:32:56Z; ipma-city-forecasts read_at 16:30:56Z). Everything about Cinco Chaminés is a made-up example.

## Verdict

**DO NOT RELEASE YET.** Five must-fix items, all small. The brief's central rules hold: "made-up example" on every page, the booking flow ends with the exact statement and keeps and sends nothing personal, no iframes, no booking-platform names, no em dashes, failure states show no invented values. The failures are a 390 px overflow on two pages, three faults in the scripted agent's live answers (terms, stale, a guessed all-clear), two Markdown twins that are drafts, and the guest count kept in sessionStorage.

## Must fix

**M1. /use-the-data/ and /use-with-ai/: the page scrolls sideways at 390 px.**
What: `document.documentElement.scrollWidth` is 518 px wider than the viewport on /use-the-data/ and 281 px wider on /use-with-ai/, in light and dark. Cause: the `<pre>` code blocks are styled only under `.md pre` (site.css line 243), so outside `.md` they take their full width (the JavaScript block ends at 804 px, the curl block at 908 px). Shots: `shots/overflow-use-the-data-390.jpg`, `shots/overflow-use-with-ai-390.jpg`.
Why: a phone reader has to scroll the whole page sideways to read any of it.
Rule: 390 and 1366 px, no horizontal overflow (WORKFLOW step 4; reviewer POLICY N18).
Fix: give every `pre` `overflow-x:auto; max-width:100%` (or wrap the blocks in `.md`).

**M2. /agent/: live answers carry the source and read time but not the terms, and the events answer does not say when its file is stale.**
What: every IPMA answer ends "Source: IPMA (ipma-city-forecasts), read 18 Nov, 16:30 (Lisbon time), via data.promptugal.news." with no terms (`sourceIPMA` in agent.js line 226). The stay panel and the billboard add "Terms: IPMA: free to copy and use ... no profit-making or offensive purpose; always name IPMA". With every `read_at` rewritten to 15 November (stale test), the forecast, warnings, sea and UV answers say "which is old. Treat it with care", but the events answer lists events with no stale note (the events case at agent.js lines 338 and 353 never calls `staleNote`); the stay panel says "Read 08:00 UTC, 3 days ago. This may be out of date." for the same file.
Why: the agent is the page most visitors will quote from.
Rule: "Beside every figure: the source, the publisher and the time read ... Follow each source's terms (for IPMA: ... always name IPMA)"; "When a file is missing or stale, say so on the page" (WORKFLOW, rules for every role; POLICY N14, N17).
Fix: add a short terms clause to the agent's IPMA source line ("IPMA's terms: no profit-making use; name IPMA") and "Reference use only" is already on events; add `staleNote` to the events answers.

**M3. /agent/: the warnings answer gives an all-clear for dates IPMA has not covered.**
What: after "How much is the Lagoon House for a week in January?", the question "Any warnings for the Algarve?" was answered "No yellow, orange or red warning for the Faro district for 1 to 8 January 2027 at the last read." The dates came from the earlier turn; IPMA issues warnings only a few days ahead. The stay panel handles the same case correctly ("No warnings issued for these dates yet; IPMA issues them up to three days ahead.").
Why: a visitor could read it as a statement about January weather safety. It is a guess presented as data.
Rule: "never guess a value"; "Invent nothing a visitor could take for real" (WORKFLOW; POLICY N4, N17).
Fix: when the dates run beyond the warnings file's last `end`, use the stay panel's wording; and a bare "Any warnings?" should mean now, not carry dates from an unrelated earlier turn.

**M4. /live/index.md and /billboard/index.md are the writer's drafts, not twins of the pages.**
What: both start with an HTML comment addressed "For the developer: build src/.../index.html from this ..."; /live/index.md has the placeholder "[The list, drawn from /data/cameras.json: ...]" where the 14 cameras should be, and neither has the made-up band line or the Page/footer lines every generated twin has (check: `grep -c '^\*\*Made-up example'` is 0 for both; "made-up example" does appear lower in their text). llms.txt and /use-with-ai/ tell agents a twin is "the same page as Markdown".
Why: an agent following llms.txt gets developer notes and no camera list.
Rule: the round's aim ("a link preview on every page" and twins via llms.txt); WORKFLOW "Keep REALITY.md true" (a twin that is not the page is a false claim); made-up band on every page (POLICY N12).
Fix: rename the writer's drafts (for example `src/live/WORDS.md`, excluded from the build) and let layout.mjs generate both twins, or strip the comment and fill the camera list at build time.

**M5. The guest count is kept in sessionStorage and the address.**
What: after the booking walk at both widths, sessionStorage holds `cc-stay = {"from":"2026-11-19","to":"2026-11-22","guests":2}`, and the address carries `?guests=2`. The home page form does the same (`?from=2026-11-25&to=2026-11-28&guests=2`). The stored count is also wrong: 3 adults were chosen in step 2, `guests` stayed 2.
Why: the conductor's acceptance line for this review is "sessionStorage holds at most the dates"; the home page text says "Your dates stay in this tab and the page address". The count is not personal, but it is form input kept after the form.
Rule: "Forms keep nothing and send nothing" (brief; WORKFLOW; POLICY N13).
Fix: store and pass only `from` and `to`; leave guests in page memory.

## Should fix

- **S1. /agent/: gaps in the script.** "Can I pay by card?" and "Can you send me a confirmation email?" fall to the fallback; these are the two questions where the agent should say "no payments, nothing is sent". "Olá, bom dia" falls back (a Portuguese greeting intent would be cheap). "praia perto de Tavira?" gives the Salt House description, not beaches or cameras.
- **S2. /agent/: "Which home is best for 6 people?"** answers with the family intent and lists the Salt House and Harbour House, which sleep 4. When a number of people is given, filter by `sleeps` first.
- **S3. /agent/: multi-day events show only their start day.** "What's on in Lagos this weekend?" (21 to 22 November) lists events as "Fri 20 Nov"; the stay panel shows "Fri 20 Nov to Sun 22 Nov". Use the same range wording.
- **S4. /agent/: the events failure message says "look at IPMA directly"** (blocked test). It should point to the town's agenda or the events-pt card.
- **S5. /agent/: "What is the sea like near Faro tomorrow?"** answers three days from today for "the Lagoon House". Acceptable, but "tomorrow" could pick one day.
- **S6. /use-the-data/: the "Status now" column always says "not read yet".** The page says it is "filled in your browser from the catalogue when the page opens", but no script fills `[data-status]`. Wire it or remove the sentence.
- **S7. /llms.txt** lists no /homes/, /homes/<id>/ or /agent/ pages.
- **S8. Events publisher without its accent.** The agent and each event line show the data's "Camara Municipal de ..."; the footer and source line use the card's "Câmara Municipal de ...". Prefer the card's name.
- **S9. Decision for Dinis, through the conductor: personal names inside event titles.** Several events from the municipal agendas name the artist or workshop leader in the title (patterns "por <name>", "de <name>"), shown verbatim with source and link. The brief says "name no person" and also asks for the events. Not counted as a failure, because the names are the organiser's public title, not something the site says; I have not copied the names here. Options: keep verbatim, or strip a trailing "por/de <name>" clause.
- **S10. /behind-the-scenes/rounds/1/research/NAME/**: the published research names real nearby rental listings with their local-accommodation registration numbers. Registrations often belong to private people. The search record is useful; the numbers are not needed on a public page.
- **S11. /live/**: each camera's URL is behind the link text "Open on Beachcam's site"; showing the host and path in small text would make "each with its URL" visible without hovering.

## What I checked, with evidence

### Build and gates
`node scripts/build.mjs && node scripts/validate.mjs` printed OK; `node scripts/leak-scan.mjs` printed "OK (161 files, 63 binary skipped)"; `node --test tests/*.test.mjs`: 12 tests, 11 pass, 1 skipped (the live test), 0 fail. `git status` clean. `board/HOLD.md` does not exist.

### "Made-up example" on every page (rule: brief; POLICY N12)
Playwright, light and dark, 390 and 1366 px, 19 pages (/, /homes/, the five homes, /agent/, /live/, /billboard/, /use-the-data/, /use-with-ai/, /behind-the-scenes/ and commits, rounds/1, research/CAMERAS, team/reviewer, design/PROPOSAL, /d/): the band "Made-up example. Cinco Chaminés is an invented company ..." is present, visible, within the top 200 px on all 76 loads. Every HTML and Markdown file under `_site/` contains "made-up example" (grep), apart from `/data/cameras.json` and `/version.json` (data files; cameras.json's `about` says "the made-up Cinco Chaminés example site"). Twins: band line present in all generated twins; missing at the top of the three hand-written ones (M4; /use-with-ai/index.md has its own line "This site is a made-up example.").

### Nothing a visitor could take for real (POLICY N4)
Every price on /, /homes/ and the five home pages is followed by "(invented)"; availability says "simulated" in the calendar heading, the key and the home cards; each home says "Invented home; drawing, not a photo" and its rules say "(invented)". No street addresses (grep for rua, avenida, travessa, largo and postcodes in homes.json and the pages: none). The agent's "Is this a real company?" answer is plain. Billboard: "PROPOSAL" at the top and on each of the five mock-ups; "Nothing was bought, booked or shown on any screen"; camera panels are drawn placeholders. Exception: M3.

### People named (POLICY N5)
Only Dinis Cruz is named in the site's own text (grep of `_site/` for common Portuguese and English surnames and honorifics). Commit authors on /behind-the-scenes/commits/ show roles only. Live event titles can carry personal names (S9).

### Booking flow (POLICY N13)
Walked by keyboard only on /homes/hill/ at 1366 and 390 px: Tab reaches the first calendar day after 12 presses (7 at 390), arrows move, Enter picks arrive and leave, Tab and Enter through Guests (+ adult), Details (typed "Test" and "a note"), Review, "Finish the demonstration". Final heading, focused: "This is a demonstration: nothing was booked, nothing was sent, nothing was charged." Typed text is gone from the page afterwards. Fields present: name (optional, autocomplete off), arrival time, note; no email, phone, address or payment field. Forms have no action and no method. Network: 19 requests, all GET, only to localhost and data.promptugal.news; none on submit. localStorage empty; cookies empty; sessionStorage `cc-stay` with dates and guests (M5). Shots: `shots/book-details-1366.jpg`, `book-details-390.jpg`, `book-final-1366.jpg`, `book-final-390.jpg`. Focus ring: 3 px solid (#0e5a72 light, #7ec8df dark) on every element tabbed.

### The agent: 17 questions (1366 px), "simulation" tag in view after every answer
| # | Question | Intent | Quality |
|---|---|---|---|
| 1 | What will the weather be in Lagos on 20 and 21 November? | weather | Good: Portimão as nearest place, said why; both days; source line (no terms, M2) |
| 2 | What's on in Lagos this weekend? | events | Good, links to each event; multi-day events show start only (S3) |
| 3 | Is the Cape House free from 1 to 5 December? | availability | Good, "(simulated availability)" |
| 4 | How much is the Lagoon House for a week in January? | price | Good, "7 nights x EUR 85 = EUR 595 (invented price)" |
| 5 | Is there a live camera near Sagres? | cameras | Good: three nearest, operator named, link out, date checked, no-embed reason |
| 6 | Any warnings for the Algarve? | warnings | Wrong: carried January dates, gave an all-clear (M3) |
| 7 | What is the sea like near Faro tomorrow? | sea | Fair: three days, IPMA source (S5) |
| 8 | Is this a real company? | what-is-this | Good |
| 9 | Can I pay by card? | fallback | Missed (S1) |
| 10 | Olá, bom dia | fallback | Missed (S1) |
| 11 | praia perto de Tavira? | home-salt | Partial (S1) |
| 12 | qual é o tempo amanhã em Faro | weather | Good: Portuguese matched, Faro tomorrow |
| 13 | asdf qwerty blorp | fallback | Good: says it is a simulation, suggests topics |
| 14 | What will the weather be on 10 December in Tavira? | weather | Good: "only goes five days ahead ... nothing yet for 10 December 2026" |
| 15 | Can I bring my dog to the Hill House? | pets | Good, "(made-up example)" rule |
| 16 | Which home is best for 6 people? | for-families | Wrong homes for 6 (S2) |
| 17 | Can you send me a confirmation email? | fallback | Missed (S1) |

Network during all 17: GETs only, to localhost and data.promptugal.news. localStorage and sessionStorage empty. No console errors. Shot: `shots/agent-1366.jpg`. With data.promptugal.news blocked: "I could not read the IPMA forecast just now, so I will not guess." (events: same, but names IPMA, S4).

### Data beside every figure (POLICY N14, N17)
- Home page "The Algarve now": a source line per IPMA source (publisher, id, read time UTC and age, card and publisher's page links) and one IPMA terms line under the group.
- Home pages (checked salt, harbour, cape with dates): forecast, warnings, sea, UV and events blocks each end with a source line with publisher, read time and "Terms: ...". Forecast figures for Faro on 20 November (10.1 to 18.7 °C, rain 0 %) match `ipma-city-forecasts/latest.json` read by curl at the same time. Beyond five days: "No forecast yet for these dates. IPMA forecasts five days ahead; this appears on Sun 6 Dec."; per-day tiles say "not yet, appears Thu 19 Nov"; sea "covers three days (to Fri 20 Nov)"; UV "covers five days (to Sun 22 Nov)". Events: 16 of 16 items checked link to the organiser's page and name their source; the events source line names the publishers, the "partly failed" status and "Unclear: no licence found; reference use with attribution and a link".
- Billboard: every live slot has its own source line with terms.
- Blocked (page.route aborting data.promptugal.news), on /, /homes/harbour/, /billboard/: no °C or wave values anywhere; each block says "Could not read IPMA's forecast just now (the network request failed). Nothing is shown in its place: this page does not guess." with Try again. Shot: `shots/stay-blocked-1366.jpg`.
- Stale (all `read_at` rewritten to 2026-11-15T08:00Z): pages keep the values and mark them "Read 08:00 UTC, 3 days ago. This may be out of date." in bold; the billboard hides its values. Agent: see M2. Shot: `shots/stay-stale-1366.jpg`.
- Slow: not run in the browser this round (the 8 s timeout is covered by the developer's Node tests); the loading text "Reading the IPMA forecast..." is shown while waiting.

### Cameras (POLICY N16)
`/data/cameras.json` parses; 14 entries, operators Beachcam (12) and SkylineWebcams (2), all organisations, each with `url`, `terms_url`, `terms_note`, `checked: 2026-11-18`, `embed: false`. No police, traffic or private CCTV (beach, marina and town views only). No `iframe`, `embed`, `object` or `video` on any page (DOM count 0 on all 19 pages). /live/ links open the operator's page in a new tab with `rel="noopener"`. Spot-checked with curl on 18 November 2026: beachcam.meo.pt/livecams/sagres/ 200 (title "Sagres"), beachcam.meo.pt/livecams/praia-da-luz/ 200, skylinewebcams.com/webcam/portugal/algarve/portimao/marina.html 200 (redirects to /en/, title "Live Cam Marina de Portimão"). Shot: `shots/live-390.jpg` (the map scrolls inside its own box, the page does not).

### Billboard (rule: brief, billboard)
"PROPOSAL" banner and on every mock-up; IPMA's terms stated ("A paid advertising campaign is profit-making, so it would need IPMA's permission first"); camera operators' permission stated for both operators; events "reference use only"; "Dinis's words refer to an earlier piece of his on this idea. Our search did not find it ... We have asked him for the link"; "No media owner, camera operator or data publisher has been contacted."

### Use the data (run on 18 November 2026, about 17:00 UTC)
- curl and jq, Faro forecast: five lines, 2026-11-18 to 2026-11-22 (for example `{"date":"2026-11-20","t_min_c":10.1,"t_max_c":18.7,"rain_prob_pct":0}`).
- curl and jq, Lagos events 21 to 28 November: records with startDate, name and url (works).
- curl and jq, warnings: `{"level":"yellow","type":"rough sea","start":"2026-11-18T13:15:00","end":"2026-11-20T09:00:00"}`.
- The JavaScript example, unchanged, in Node v22.23.5: five forecast lines, "Source: IPMA, read 2026-11-18T16:30:56Z", the yellow rough-sea warning, and 38 Lagos events in the window. All three work.

### Words
No em dashes (U+2014 or `&mdash;`) in `_site/` or `src/`; no en dashes in the site's own text (only inside live event titles). No booking-platform names (grep for the validator's list plus others: none). Hype words: none from the validator's list; a wider list (stunning, amazing, luxury, paradise, idyllic, hidden gem, nestled and others) found nothing in the site's own pages. British spelling throughout the pages read.

### Layout, contrast, dark mode, console
- No console errors, warnings or page errors on any of the 76 loads (19 pages, 2 widths, light and dark).
- Horizontal overflow: none, except M1.
- Contrast (computed colours, WCAG ratio): body text 14.8 light, 15.9 dark; band 10.9 and 10.3; source lines 7.0 and 8.2; small text 6.5 and 9.1; buttons 6.6 and 8.9; taken calendar days 5.2 and 6.1. All pass AA.
- Dark mode (colorScheme 'dark'): tokens switch, drawings and calendar readable, focus ring light blue. Shot: `shots/salt-dark-1366.jpg` (light: `salt-light-1366.jpg`); home page at 390: `shots/home-390.jpg`.

### Not checked
Screen reader output; a person's keyboard walk of /agent/ and /live/ (the booking flow was walked by script); a slow network in the browser; all 14 camera URLs (3 spot-checked; the researcher checked all on the same day).
