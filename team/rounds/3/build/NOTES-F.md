# Round 3 build notes, instance F: /world/ and /agents/

Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance F), sub-agent of the conductor, on 18 November 2026. Files only: no commit, no push, nobody contacted.

Brief (conductor, round 3): build /world/ (PROPOSAL.md section 5) and /agents/ (section 6) on the simulation core (NOTES-C.md), with the shared frame from instance D (`/assets/js/modes/chrome.js`). Dinis's words used (team/rounds/2.md, about 17:20 and 17:25 UTC): the world "like a game", "my little users ... variations", "go super fast", "a kind of a profit and loss", "some are unhappy ... leave bad reviews", "a big sign ... this is AI generated ... This is a demo ... a list of this is a demo of XYZ", "agent behavior policies, including on the browser ... prompt injection attacks"; and "the management to be done by Claude on both sides ... simulated ... a chat with access to either the user stuff or the admin stuff". Conductor's answer 3 (team/rounds/3.md): "Claude (simulated)" is allowed.

## Files (all mine; nothing else touched)

| File | What |
|---|---|
| `src/world/index.html` | /world/: run controls, stage, sign, panels, persona rail, "This is a demo of ..." list |
| `src/assets/world.css` | the world page, plus the kind and decision badges and the stand-in frame (also used by /agents/) |
| `src/assets/js/world/world.js` | the world: drives `sim/personas.js` `createWorld().attach()` on the shared store, animates its events |
| `src/assets/js/world/frame.js` | mounts D's `mountChrome({ mode, sim: getSim({ homes }) })` (one store per page, shared with the frame); a small stand-in frame only if chrome.js is missing; `kindBadge`, `decisionChip` |
| `src/agents/index.html`, `src/assets/agents-mode.css`, `src/assets/js/agents-mode/agents-mode.js` | /agents/ |
| `src/assets/share/world.png` (140 KB), `agents.png` (105 KB) | share cards, 1200 x 630, rendered with Playwright from a script in my scratchpad (not added to `scripts/cards.mjs`, which other instances edit this round), "made-up example" on each |
| `team/rounds/3/build/shots-f/` | screenshots, JPEG q70, each under 300 KB |

## /world/

- **Engine:** every simulated hour this tab passes runs `step()` (sim/personas.js) and dispatches one batch to the shared store (`localStorage["cc.sim.v1"]`), so /admin/ in another tab sees the run's bookings, stock and money. D's clock menu ("forward one day") also runs the world, since it moves the same clock.
- **Speeds** (simulated minutes per real second): 1x = 6 (an hour every 10 s, as proposed), 10x = 60, 100x = 600; the clock is moved at most every 250 to 400 ms so the store is not saved every frame. **Very fast** advances one whole day per tick with no walking figures; measured in headless Chrome: 30 simulated days in 1.5 s, the whole window (43 days to 31 December) in 2.3 s, at 390 and 1366.
- **Stage:** SVG background (journey: arrivals, the website, Faro airport, leaving, the team; the coast west to east with the five homes' AI-generated pictures in circles, labelled; the sea). Figures from `sim/figure.js` in an HTML layer scaled with the stage; walkers move along keyframe paths with requestAnimationFrame (ease, a small bob, the walk pose while moving). Residents (guests checked in, beside their home in holiday clothes; the three admins at the team stop, the housekeeper at a home waiting for its clean) are drawn from the state.
- **Bubbles:** the persona's question to the agent; an injection attempt in red monospace followed by `DENY N-untrusted-instruction`; homes looked at with the invented price; booked or "Left: reason"; reviews (green 4 to 5, red otherwise; a review carrying an instruction shows its own DENY); issues, cleaning and rate changes at the homes. Check-in bubbles carry the weather **only** from IPMA's live forecast file for that home's city and that day, marked REAL; otherwise "No real forecast for this day yet", or "IPMA's figures could not be read just now". The review engine is given Faro's real forecast (the region's airport city) or nothing.
- **Reduced motion:** figures jump between stops, nothing slides or fades in (checked: 0 moving figures with `reducedMotion: 'reduce'`).
- **Panels:** P&L for the run (profit before income tax, revenue with VAT out, costs and commission, tourist tax passed on, a cumulative line), occupancy tonight and over the run, stock lowest first (hatched at or under the reorder point), reviews feed with average, policies at work (asks and denials, the untrusted text in red), "what this run found" ordered by estimated cost (lost sales by reason, repairs and refunds, low reviews, attempts held), persona rail (state per person) with the profile (record fields, the journey in time order with decision badges, outcome, rating, value to the business, "A test instrument, not a real guest ..."). At 390 px the panels become tabs and the sign moves under the stage.
- **Seed:** typed or "New seed"; either resets the simulation in this browser (said in the status line). Export downloads the run as JSON.
- **Counts:** "Injection attempts blocked X of Y" counts actions (not public answers) whose instruction came from untrusted or instruction-like text; in every run measured, all were denied.

## /agents/

- Always visible, sticky: "Simulated: scripted conversations, no live model, nothing sent."
- Columns: "Claude, the guest's assistant (simulated: scripted, no live model)", "Between them", "Claude, the host's assistant (...)", each assistant with a small agent figure (violet, teal). At 390 px one column at a time with a Guest / Between / Host switch and unseen counts.
- **Watch:** the eight scenarios of `sim/agents.js`; Run (850 ms a line; all at once with reduced motion), Step, Reset scenario. Tool calls are cards (tool, arguments, ALLOW/ASK/DENY with the rule id and reason). An ASK card has Approve and Refuse; approving re-runs the guard with `approvedBy: "you (playing the owner)"` and logs it; an approved refund or discount on a real booking is written to the ledger as a pretend refund. Measured: injection-message 3 DENY, other-guest-details 3 DENY, refund-above-limit 1 ASK and 1 DENY.
- **Play the guest / Play the host:** typed text (or a suggestion chip) is matched in the browser to intents. Guest: late arrival, early check-in, a problem (issue raised, repair ordered), pet, discount (ASK for the owner), refund (guest's side DENY, host's side ALLOW or ASK by the EUR 100 limit), cancel (ASK; approving cancels in the store), another guest's details (DENY), weather (IPMA live forecast or "no real forecast"), injection text (DENY). Host: arrivals today, reorder what is low, change a rate (ASK), refund N (ALLOW or ASK), reply to the latest review (draft, ASK; an injected review shows its DENY), share the guest list (DENY, and N-no-network), occupancy. Unknown text: "In this demo I follow a script; try one of these."
- Without an active booking the scenarios use the core's stand-in (only the policy log is written); "Give the guest a booking" books three nights for an invented guest through `sim/booking.js` (pretend payment).

## Checks (measured 18 November 2026, about 18:30 UTC, `_site` served on port 8803)

- `node scripts/build.mjs && node scripts/validate.mjs && node scripts/leak-scan.mjs`: OK, OK. `node --test`: 52 pass, 0 fail (no tests of mine failed; I added none).
- Playwright, Chromium, 390 and 1366: no console errors on either page; no horizontal page scroll; the world's animation runs (walkers moving, bubbles) and a DENY bubble shows within 3 s at 100x; very fast as above; /agents/ all scenarios, both play modes and approvals run.

## Open points for the conductor

1. Many synthetic visitors leave for "dates taken" or "no dates left in the window" (the background occupancy plus the short window): that is the core's behaviour (personas.js), shown honestly in "what this run found".
2. The share cards are rendered by a scratchpad script; if wanted, its two cards can be added to `scripts/cards.mjs` when nobody else is editing it.
3. The site's docked "Ask the agent" link sits over the lower right of both pages (layout, not mine).
4. REALITY.md and README.md should list /world/ and /agents/ once committed.
