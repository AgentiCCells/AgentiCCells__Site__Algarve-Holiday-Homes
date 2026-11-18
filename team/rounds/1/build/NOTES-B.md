# Round 1 build notes, instance B: the agent, Live from the Algarve, the billboard

Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 18 November 2026, for the conductor. Files only: nothing committed, pushed or sent.

## Files

- `src/agent/index.html`, `src/assets/js/agent.js`, `src/assets/agent.css`
- `src/live/index.html`, `src/assets/js/live.js`, `src/assets/live.css`
- `src/billboard/index.html`, `src/assets/js/billboard.js`, `src/assets/billboard.css`
- Screenshots: `team/rounds/1/build/shots-b/` (JPEG quality 70, deviceScaleFactor 1, each under 250 KB; long pages clipped to their top part, the billboard in two or three parts)

## Checks run (18 November 2026, about 16:50 UTC)

- `node scripts/build.mjs && node scripts/validate.mjs`: OK (after instance A added the share cards).
- `_site` served with `python3 -m http.server 8642`; Playwright (Chromium) at 390 and 1366 px: no console errors, no page errors, no horizontal overflow on `/agent/`, `/live/`, `/billboard/`.
- Failure states, with data.promptugal.news blocked in Playwright: the agent says "I could not read the IPMA sea forecast just now, so I will not guess..."; the billboard slots stay "--" and each preview says "value unavailable" with the source line's error; with `/data/cameras.json` blocked, `/live/` says "The camera list could not load (Failed to fetch)" with a link to the file.
- Reduced motion: the typing delay is 200 ms and the dots do not move (measured 264 ms round trip). Deep link `/agent/?q=...` fills the input and asks.

## The agent: six test questions and the answers it gave

Live values are from the IPMA and events-pt files as read at 16:30 to 16:32 UTC on 18 November 2026 (read through data.js); availability is the simulated calendar for that day.

| # | Question | Intent | Answer (shortened) |
|---|---|---|---|
| 1 | Is the Harbour House free from 21 to 28 November? | availability | "The Harbour House is taken on some nights of 21 to 28 November 2026. The nearest free 7 nights: 19 to 26 November 2026. See its calendar. (simulated availability)" |
| 2 | What's the weather in Sagres tomorrow? | weather | "Forecast for Sagres. Thu 19 Nov: partly cloudy, 11.9 to 19.8 °C, rain 0 %, wind NW, moderate." Source line: "Source: IPMA (ipma-city-forecasts), read 18 Nov, 16:30 (Lisbon time), via data.promptugal.news." |
| 3 | Any warnings this week? | warnings | "Yellow warning for rough sea, Wed 18 Nov 13:15 to Fri 20 Nov 09:00 (Portugal time). IPMA, in Portuguese: ..." plus the writer's safety line and the IPMA source line |
| 4 | What's on in Tavira next week? | events | Five events 23 to 30 November with links, "(and 16 more)", source "Camara Municipal de Tavira, read 18 Nov, 16:30 (Lisbon time), via data.promptugal.news. Reference use only: check details with the organiser." |
| 5 | And the sea? (follow-up, keeps the Salt House) | sea | "The sea near the Salt House (IPMA's Faro, costa)": three days, waves 0.6 to 1.3 m from the W, sea up to 19.8 °C, IPMA source line |
| 6 | Which home suits four people? | guests (developer's) | The four homes that sleep 4 or more, with invented prices |

Also checked: "Is this a real company?" (what-is-this), "How much is the Hill House for 3 nights from 1 December?" (price: 3 x EUR 160 = EUR 480, invented), "Show me a live camera near the Lagoon House" (cameras: three nearest, link out), "What is the UV index in Faro?" (uv, with WHO bands), "What is the weather this week?" then "The Cape House" (asks which home, then answers for Sagres), "What's the weather in Lagos next weekend?" (forecastTooFar: 28 to 29 November is beyond IPMA's five days), "can you sing a song" (fallback).

## Decisions and points for the conductor

1. **Matching order.** The writer's `agent-script.js` says intents are in priority order, first match wins. The brief asked to "score patterns, pick best". The code scores each intent by the number of matching patterns but picks the first intent with a score above zero, so that "is the Harbour House free" goes to availability and not to the Harbour House description (pure best-score would get that wrong). Say if you want it changed.
2. **Availability is shared.** The agent imports `isTaken` from instance A's `src/assets/js/availability.js`, so it shows the same simulated calendar as the home pages. Nothing to unify.
3. **Dates.** "This weekend" is the coming Saturday to Sunday (one night for a stay); "next weekend" is the one after; "next week" is Monday to the next Monday (seven nights); a month name alone ("in December") is seven nights from the 1st (or today in the current month). Stays are arrive to leave; forecasts and events use the days from first to last inclusive. Answers always spell out the dates used.
4. **A developer-written answer.** "Which home suits four people?" (the proposal's first chip) matches none of the writer's intents, so the agent answers from `sleeps` when a number of people is given and nothing else matched: "Homes that sleep 4 or more (all invented): ...". The writer may want to word it.
5. **Billboard: four or five mock-ups.** The brief named the proposal's four concepts (A to D); the writer's words describe three (Sagres 6-sheet, a 1920 x 1080 "Meanwhile, in the Algarve" with the warning pause, a Faro D48). The page draws five, labelled A to E: proposal A ("Right now in the Algarve"), writer 1 / proposal C ("Sagres, right now"), writer 2 ("Meanwhile, in the Algarve"), writer 3 / proposal B ("London, Faro", London left empty as "needs a source"), proposal D ("Five chimneys"). The writer's words are used for each where they exist; the words for A and E are mine, short, from the proposal. Drop one if five is too many.
6. **Agent page words.** The writer gave no `src/agent/index.md`; the intro and "How it works" on `/agent/` are mine, and the build makes the Markdown twin from them.
7. **Source lines.** Agent answers end with the writer's short line ("Source: IPMA, read <Lisbon time>, via data.promptugal.news"), not the long `sourceLine()` of the stay panel; the billboard previews use `sourceLine()` from data.js.
8. **Docked agent.** `agent.js` exports `mountAgent(element)` if instance A wants the dock to open the same agent in place; the layout's dock currently links to `/agent/`.
9. **Map.** `/live/` draws the coast from 28 rough points and spreads overlapping markers (Portimão marina and Praia da Rocha are 300 m apart) with a leader line to the true place. At 390 px the map scrolls sideways inside its own box (min width 720 px); the page itself does not.
10. **Events source names.** The event's `source` text includes the route ("Camara Municipal de Tavira, Events Calendar route ..."); the agent shows the part before the first comma. The publisher name comes from the data without its accent ("Camara").
