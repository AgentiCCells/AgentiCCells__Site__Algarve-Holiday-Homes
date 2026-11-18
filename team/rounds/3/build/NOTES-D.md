# Round 3 build notes, instance D: the shared mode frame and /admin/

Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance D), sub-agent of the conductor, on 18 November 2026. Files only: no commit, no push, nobody contacted.

Brief (conductor, round 3): the shared frame (`src/assets/js/modes/chrome.js`, `src/assets/modes.css`) first, then `/admin/` per `team/rounds/3/design/PROPOSAL.md` sections 0, 1, 3, 8, 9 and 10, on the simulation core of instance C (`NOTES-C.md`). Dinis's words behind it: team/rounds/2.md, about 17:20 and 17:25 UTC ("show the admin side ... see the booking, rent stuff ... the stock going down ... profit and loss ... a whole legality section ... agent behavior policies, including on the browser").

## What exists now

| File | What it is |
|---|---|
| `src/assets/js/modes/switcher.js` | `MODES`, `modeFor(path)`, `switcherHTML(path)`: the mode switcher as links (pure, used at build time and in the browser) |
| `src/assets/js/modes/chrome.js` | `mountChrome({ mode, sim, band })`, `getSim()`, `badge(kind, label)`, `decisionBadge(decision, rule)`, `fmtSim`, `actorName`, `visitorBooking`, `BANDS`, `esc` |
| `src/assets/modes.css` | switcher, clock pill and menu, About panel, Reset dialog, kind and decision badges (section 10 pairs, light and dark), the policy log drawer |
| `src/admin/index.html` | the admin page: side nav, home filter, result line, content; HEAD, HEADER, FOOTER, title, description, share image |
| `src/assets/admin.css` | design "Ledger": sidebar, KPI tiles, panels, tables that scroll inside their box, occupancy strip, charts, boards; tabs under 900 px |
| `src/assets/js/admin/admin.js` | router (hash routes, `#policies/<rule>` opens the rule), render, live redraw, the guard wrapper `act()`, every action, the example activity, the weather alerts |
| `src/assets/js/admin/ops.js` | Today, Bookings (with a side sheet), Calendar, Cleaning, Stock, Issues, Messages, Reviews |
| `src/assets/js/admin/biz.js` | Rates and rules with what-if, Money (KPIs, three SVG charts, P&L table, table view, CSV), Legality, Integrations, Policies (rendered ABPs, try-it, decisions log with replay) |
| `src/assets/js/admin/history.js` | the seeded money history 1 January to 16 November 2026 (labelled "simulated history" wherever shown, conductor's answer 1) plus the session ledger from 17 November |
| `src/assets/js/admin/util.js` | shared helpers: euro format, guest labels, the occupancy strip, download, CSV, the untrusted quote |
| `src/assets/share/admin.png` | 1200 x 630, 134 KB, rendered with Playwright from `team/rounds/3/build/shots-d/admin-card.mjs` (the card frame of `scripts/cards.mjs`) |
| `scripts/lib.mjs` | two lines, as the brief allowed: `head()` links `/assets/modes.css`; `header()` calls `switcherHTML(path)` after the site bar |

## The frame (for E and F)

```js
import { mountChrome, getSim, badge, decisionBadge } from '/assets/js/modes/chrome.js';
const sim = mountChrome({ mode: 'stay' });   // { store, clock, guard, booking, persistent, boundsReady, embed, unmount }
```

- `getSim()` makes one store, clock, guard and booking API per page; call it (or use `mountChrome`'s result) so every module shares one copy of the state. Bounds start at the researched fallback and are replaced by `loadBounds()` (data.promptugal.news only).
- The band is rewritten per mode (`BANDS`, always "Made-up example." first) and gains "Your browser is not keeping this simulation" when localStorage is blocked.
- Mode pages other than Visitor get `html.mode-app`: brand, switcher and tools in one header row, site navigation hidden (the footer keeps the links). Guest's stay shows "(after you book)" until `visitorBooking(state)` finds a direct booking with no persona.
- Clock pill menu: back one day, forward one hour, forward one day, back to the first real day; after a move it expires holds. Reset: `<dialog>` confirm, then `store.reset()`; other tabs follow through the store's channel.
- Drawer: counts, last decision, open sheet with filters (actor, decision), newest 200 rows, rule badges link to `/admin/#policies/<rule>`; a new deny flashes the left edge (none with reduced motion) and is announced politely. `?embed` leaves the drawer out and opens mode links in the top window.

## Admin, as built

- **Every action** goes through `guard()` with an actor: the owner (confirm, check in or out, cancel, move dates, note, block days, rates, settings, replies, assign cleaning, book a repair, resolve, exports), the host's assistant (reorders, review drafts, "act on the guest's words"), the housekeeper (report an issue, cleaning done), the bookkeeper (record a bulletin). The result line shows the badge, actor, action and reason; ASK offers "Approve as the owner" (re-run with `approvedBy`) or Decline. Measured: a EUR 270 linen reorder asks (H14-limit), approved it is allowed (H14); acting on an injected review or message is denied (N-untrusted-instruction).
- **Example activity** (Today, when the browser is empty): five or six invented bookings placed on free nights around the simulated today (from the cast's names), two messages (one with an injection), two issues, two reviews (one with an injection, which the host's assistant reads and is refused). Labelled invented and simulated.
- **Live**: the store's channel and `storage` event redraw the page; a redraw waits while you type in a field. Measured: a booking made in a second tab appeared in the Bookings table within 0.6 s, with the YOUR BOOKING badge.
- **Money**: KPIs, monthly grouped bars (series #2a78d6 and #eb6834, the designer's validated pair; text in ink), profit by home, small multiples on one scale, P&L table per home with the IRS formula in the row label; table view; VAT article 53 toggle (owner `setting.set`); CSV to the device.
- **Legality**: checklist per home from `legal.checklist()` with "how sure" and sources, VAT bar with the €15,000 and €18,750 marks, tourist tax per municipality (Tavira, Lagos, Vila do Bispo "none found"), IRS with editable inputs, pending bulletins, sources, "Not legal or tax advice" at the top and the bottom.
- **Integrations**: cards by type of service only; the Kai calendar feed import (Harbour House, hatched violet in the calendar); a sample feed with an instruction in a summary line, kept as data and flagged; the note that a real business could bring in bookings from booking platforms.
- **Policies**: the seven policies read from `/assets/js/sim/policies.json` (fallback `POLICIES`), decisions log with filters, counts per rule and "Replay" (reruns `guard.decide` on the logged input: measured "same answer"), and the try-it box with three ready attacks.

## Checked (18 November 2026, about 19:00 UTC to 20:00 UTC)

- `node scripts/build.mjs && node scripts/validate.mjs && node scripts/leak-scan.mjs`: OK, OK. `node --test tests/*.test.mjs`: 52 pass, 0 fail.
- Served `_site` on port 8801; Playwright at 390 and 1366 px, all 13 sections: no console errors, no page errors, no horizontal page overflow (wide tables, the calendar and the cleaning board scroll inside their own box). Actions measured: confirm, rate change, reorder ask then approve, start and resolve an issue (repairs to the ledger), draft and publish a review reply, assistant denied on a review and on a message, try-it attack, replay, sample feed import, check out, assign cleaning, cleaning done. Reload: 56 events before and after, the new Salt House rate kept. Second tab booking appeared live. `/admin/?embed` inside an iframe on the same site: loads, no drawer. `/`, `/stay/`, `/play/`, `/behind-the-scenes/`: the switcher shows, no overflow, no errors.
- Screenshots in `shots-d/` (JPEG, all under 300 KB): admin Today, Money, Calendar, Rates, Legality (top 2,300 px), Policies, Reviews, Issues at 1366; Today, Money, Stock, Reviews at 390; About panel and open drawer at both widths; the visitor header at both widths.

## Requests (files I do not own)

1. **sim/store.js (C or the conductor)**: no event exists for moving an issue to "in progress", for assigning a cleaning job or for a review reply. As built: "Start" re-dispatches `issue.raised` with `started: true` and keeps the first time in `firstRaisedAt`; assignment and review replies are `message.added` with `kind: 'assign'` or `kind: 'review-reply'`. Proposal 8's names (`issue.moved`, `cleaning.scheduled`, `review.replied`, ...) would be cleaner.
2. **Rule ids**: the proposal's ids (`host.C5`, `host.N3`, ...) are not those of `abp.js`; the admin shows the engine's real ids (`H14-limit`, `N-untrusted-instruction`, `O10`). The designer's mock-ups and the writer's copy should follow the engine, or the engine should be renumbered (C's call).
3. **The owner has no `booking.confirm` or `cleaning.assign` capability**: confirm uses `booking.change` (O10) and assign uses `message.send` (O12). Adding the two capabilities to `abp.js` and `policies.json` would read better.
4. **scripts/cards.mjs**: add the admin card (the HTML is in `shots-d/admin-card.mjs`) so `node scripts/cards.mjs` remakes it; I rendered it from my own copy of the frame.
5. **site.css**: `.chip` and `.ph` are global names; the admin scopes its own (`.adm .chip`, `.pnh`). Admin CSS links before site.css (head order), so admin rules that share a name with site.css need `.adm` in front.
6. **README.md and REALITY.md**: add the mode frame and /admin/ once committed.
7. **Validator**: it fails any iframe that is not an embeddable camera. That will hit `/play/` (E) if its iframes are in the static HTML; mine are not affected.

## Open points

- The seeded history, the demand assumption of the what-if (35% fill, elasticity -1.2), the per-stay costs and the platform share in the history are proposals, labelled on the page.
- Stock items are the core's (linen, towels, welcome packs, cleaning kits, gas, firewood, pool chemicals), not the proposal's list (coffee, tea, ...).
- Weather alerts use IPMA's forecast as issued, for the simulated today, only for homes with guests that night; when the simulated today is outside the forecast, no weather alert is shown.
- Not tested: dark-mode screenshots, a screen reader, the page with the network cut (the weather alerts are then left out silently; the rest needs no network).
