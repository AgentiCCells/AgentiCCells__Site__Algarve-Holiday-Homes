# Round 3 build: fixes after the review

Written by developer.algarve-holiday-homes@AgentiCCells.dinis, a sub-agent of the conductor, on 19 November 2026 (session clock). Brief: the conductor's list of items from `team/rounds/3/review/BUILD.md` (M1, M2, M3, S1, S3, S5, S6, S7, S8, S11). Not done here, as briefed: S2, S4, S9, S10. No commit, no push, nobody contacted.

## Items

| Item | What changed | Files |
|---|---|---|
| M1 | "Play the guest" on /agents/: the guest's words now go through `principal()` (new in sim/abp.js): trusted as the principal's, but instruction-like text keeps its flag. The injection turn is in a new pure module: a refund is tried only when a "refund all" phrase was typed (no amount made up), a guest-list read only when a guest-list phrase was typed, then `message.send` to the host's assistant. Every one is DENY N-untrusted-instruction, as on /stay/. The assistant's reply is built from the decisions: "My policy refused to act on it or pass it on ... (DENY N-untrusted-instruction, in the log): nothing was done and nothing was sent." | `src/assets/js/sim/abp.js`, `src/assets/js/agents-mode/guest-turn.js` (new), `src/assets/js/agents-mode/agents-mode.js` |
| M2 | The headline price reads "From EUR X a night (invented)". The build wraps X in `<span data-rate-home data-rate-file>`; in the browser, X is the simulation's `homes[id].rate.base` when this browser holds a simulation, else homes.json. Painted on load and on every store change (other tabs too). The site agent's home line, its price slot and the five home answers in agent-script.js (`{home:<id>:price_eur_invented}`) read the same rate without creating a simulation. The admin's message now says what is true: "Visitors in this browser now see the new base price on the home cards, the home page, the site agent and every quote, in every tab." The five designs under /d/ still show the file's price (not in the brief). | `src/assets/js/sim/price.js` (new), `scripts/layout.mjs`, `src/assets/js/home.js`, `src/assets/js/house.js`, `src/assets/js/agent.js`, `src/assets/js/agent-script.js`, `src/assets/js/admin/admin.js` |
| M3 | `.modes a.waiting[aria-current]` now uses `var(--bg)` on the ink pill (italic, to show it waits): light #FBF7F0 on #1F2328, dark #16130F on #F2EDE4, both well over 4.5:1. The non-current waiting item keeps `--ink-2` on `--bg` (already over 4.5:1). | `src/assets/modes.css` |
| S1 | `mountFrame()` imports the chrome module directly (a GET); no HEAD request. If the import fails, the stand-in is used as before. | `src/assets/js/world/frame.js` |
| S3 | On /stay/, a refused review's DENY now shows beside the review form (`#rv-note`), not in "Need something?". A message or review the policy refused for instruction-like text is kept in this browser as untrusted, flagged text marked `held` (never passed on, never published, no scripted host reply, left out of the review averages), and the host's assistant then tries to act on it (refund.issue, share.guest-data or booking.change, as on /admin/) and is logged DENY N-untrusted-instruction beside it. /admin/ Messages and Reviews show "HELD BY THE POLICY" with "INSTRUCTION-LIKE TEXT FLAGGED". Nothing is sent anywhere. | `src/assets/js/stay/sim-page.js` (`keepRefused`, `ownLifecycle` skips held), `src/assets/js/stay/stay.js`, `src/assets/js/admin/ops.js` |
| S5 | The events source line names and links the town's own agenda (Câmara Municipal de Tavira, Teatro das Figuras for Faro, Câmara Municipal de Lagos; addresses as in agent.js, from events-pt read 2026-11-18), on the home pages and /stay/. `sourceLine()` takes `page` and `pageLabel`. | `src/assets/js/data.js`, `src/assets/js/house.js`, `src/assets/js/stay/stay.js` |
| S6 | The floating "Ask the agent" button is hidden on `html.mode-app` pages (/stay/, /admin/, /play/, /world/, /agents/); the footer still links to /agent/. | `src/assets/modes.css` |
| S7 | /admin/ Today shows "Weather alerts could not be read" with the reason and the source line when IPMA's forecast (or the homes list) cannot be read; nothing while it is still being read. /play/ events legend adds ", from the researched dates: the live file could not be read" when the live events file is missing, as the weather legend does. | `src/assets/js/admin/admin.js`, `src/assets/js/admin/ops.js`, `src/assets/js/play/play.js` |
| S8 | Date inputs get the 3 px focus ring on `:focus` and `:focus-within` (the browser focuses the fields inside a date input, so `:focus-visible` did not match it). | `src/assets/site.css` |
| S11 | Reset also removes localStorage `cc.stay.v1` and sessionStorage `cc-stay`. | `src/assets/js/modes/chrome.js` |

## Tests

New: `tests/round3-fixes.test.mjs`, 9 tests:

- M1: three injected texts (English, refund, Portuguese) each give only DENY N-untrusted-instruction, `message.send` among them, no amount, a refund only when typed; the reply names the rule and says nothing was sent; ordinary words still get ALLOW G11.
- M2: no simulation gives the file price and creates nothing; after `home.rate` to 200 the price reads 200, also after compaction; the built `/` and `/homes/salt/` carry the rate span; agent-script.js has no fixed price left.
- M3: the CSS rule, and the contrast of `--bg` on `--ink` in light and dark computed from site.css.
- S1, S11: no `method: 'HEAD'` in frame.js; Reset removes `cc-stay`.
- S3: a refused message and review are kept held, flagged and untrusted; the host's assistant gets DENY N-untrusted-instruction, logged with the thread's target; no scripted reply to a held message; the admin's Messages and Reviews mark them; a held review is left out of the average.
- S5: the line for Tavira, Faro and Lagos links the town's agenda, not agendalx.pt or the card's list of publishers.
- S7: the alert shows on a failed read and on a failed homes list, not while reading; the play legend code.

## How it was checked

- `node scripts/build.mjs`: built `_site/` (dev).
- `node scripts/validate.mjs`: OK.
- `node scripts/leak-scan.mjs`: OK (366 files, 464 binary skipped).
- `node scripts/abp-check.mjs`: OK (6 policies).
- `node --test tests/*.test.mjs`: 62 tests, 61 pass, 1 skipped (the live test), 0 fail.
- Browser smoke run (playwright-core in the session scratchpad, the machine's Chrome, `_site` served on localhost; not committed):
  - Home card for the Salt House: "From EUR 120 a night (invented)", then "From EUR 200 a night (invented)" at once after a `home.rate` event, and after a reload; the home page header too; the site agent's answer about the Salt House says EUR 200.
  - /agents/ Play the guest with the reviewer's text: one `message.send` card, DENY N-untrusted-instruction, no refund card, and the reply matching the log.
  - /stay/ with a paid booking: the injected message gives DENY for the visitor and DENY for the host's assistant in the notice; /admin/ Messages shows it HELD, flagged and with the DENY beside it.
  - /stay/ switcher item: `rgb(251,247,240)` on `rgb(31,35,40)`.
  - Date input on `/` focused: outline solid 3 px.
  - Dock hidden on /agents/, shown on `/`.
  - With data.promptugal.news blocked: /admin/ shows "Weather alerts could not be read"; the /play/ events legend says it uses the researched dates.
  - Only GET requests; no page errors or console errors.

## Not done

- The review form path of S3 was checked by the unit test, not in the browser.
- The five designs under /d/ (`src/d/*`) still show the price from homes.json; they are design previews and were not in the brief.
