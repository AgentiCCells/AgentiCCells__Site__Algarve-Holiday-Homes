# Round 3 build notes, instance C: the simulation core

Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance C), sub-agent of the conductor, on 18 November 2026. Files only: no commit, no push, nobody contacted.

Brief (conductor, round 3): build the simulation core as plain ES modules under `src/assets/js/sim/`, with node tests, following the architecture in `team/rounds/3.md`. Sources used: `team/rounds/2.md` (Dinis's words of about 17:20, 17:25 and 17:40 UTC), `team/rounds/3.md`, `team/rounds/2/research/REAL-DATES.md`, `LEGAL-PT.md`, `SYNTHETIC-USERS.md`, `cast.json`, the ABP JSON in `team/developer/POLICY.md`, `src/assets/js/data.js`, `availability.js`, `src/data/homes.json`.

## What exists now

| File | What it is |
|---|---|
| `src/assets/js/sim/util.js` | date and time helpers (Portugal local times as `YYYY-MM-DDTHH:MM` strings), seeded `rng(key)`, `hid()`, `esc()` |
| `src/assets/js/sim/store.js` | the state document in `localStorage["cc.sim.v1"]`, the event log, the reducer, tab and iframe sync |
| `src/assets/js/sim/clock.js` | the simulated now, bounded by the real-data window; play at any speed |
| `src/assets/js/sim/booking.js` | invented rates, quotes, availability, the booking lifecycle, channels, calendar feed (iCal) import |
| `src/assets/js/sim/legal.js` | the LEGAL-PT.md formulas: tourist tax, VAT and article 53, IRS simplified regime, guest registration, the legality checklist |
| `src/assets/js/sim/money.js` | P&L per home and total for any period, tourist tax by municipality |
| `src/assets/js/sim/abp.js` | the browser Agent Behaviour Policy engine, the policies, `detectInjection()` |
| `src/assets/js/sim/policies.json` | the same policies as data (a test checks it equals `abp.js`) |
| `src/assets/js/sim/personas.js` | the seeded synthetic world: visitors, stays, reviews, issues, admins |
| `src/assets/js/sim/cast.json` | copy of `team/rounds/2/research/cast.json`; at the conductor's request (relaying Dinis) its `what` line no longer names any real person or agent: fictional characters only |
| `src/assets/js/sim/figure.js` | `figure(look, opts)` -> SVG string, plain-SVG reimplementation of the storyboard kit's character |
| `src/assets/js/sim/agents.js` | the scripted "Agents on both sides" scenarios |
| `tests/sim.test.mjs`, `sim-money.test.mjs`, `sim-abp.test.mjs`, `sim-world.test.mjs` | 32 tests; `node --test` passes all 48 tests in the repository (measured 18 November 2026, about 18:00 UTC) |

No module sends anything. The only network read is `loadCast()` (a GET of `sim/cast.json` from the site itself) and `clock.loadBounds()` (through `data.js`, data.promptugal.news only). No `POST`, no beacon. Leak scan: OK (measured). No em dash, hype word or booking-platform brand name in these files (checked with the validator's own patterns by grep).

## API

All modules are ES modules with no dependencies; they run in the browser and in Node 22. Every amount is EUR, rounded to cents; every result the pages show carries `simulated: true` and, for money and law, `advice: 'not legal or tax advice'` and `sources: [urls]`.

### store.js

```js
import { createStore, memoryStorage, channelHub } from '/assets/js/sim/store.js';
const store = createStore({ homes });   // browser: localStorage + BroadcastChannel('cc-sim'); Node: pass { storage: memoryStorage(), channel: null }
store.load();                           // reads cc.sim.v1, or reset(DEFAULT_SEED) when absent or invalid
store.dispatch(event | [events]);       // { type, at?, actor?, data, ledger? } -> appended (seq stamped), folded, saved, broadcast
store.subscribe((state, info) => ...);  // info.kind: event | clock | reset | import | sync | compact | error; returns unsubscribe
store.reset(seed, { now, settings });   // new document: { schema: 1, created, seed, clock, events: [sim.created] }
store.exportJSON(); store.importJSON(text);   // import returns { ok, error? }
store.getState(); store.clock(); store.setClock({ now, speed, playing }); store.compact(); store.sync(); store.close();
```

- Document: `{ schema, key, created, seed, clock: { now, speed, playing }, snapshot: null | { seq, state }, events: [...] }`. The clock is kept outside the event log so playing does not flood it.
- State: `settings` (vatExempt53, irsCoef, irsStartYear, marginalRate, platformCommission, refundLimit, spendLimit, holdMinutes, background, cleaningCost, laundryCost, utilitiesMonthly, insuranceMonthly: all invented defaults in `DEFAULT_SETTINGS`), `homes` (with `rate: { base, listBase, weekendFactor, minNights, cleaningFee }`), `guests`, `bookings` + `bookingOrder`, `blocks` (calendar feed), `stock` per home (linen, towels, welcome packs, cleaning kits; gas and firewood at the Cape House; pool chemicals at the Hill House) with `qty, min, reorderQty, unitCost`, `laundry`, `cleaning`, `issues`, `reviews` (always `trusted: false`), `messages`, `ledger`, `policyLog` (last 1000 in state; all in the log), `taxDrafts`, `visits` (last 300), `stats`.
- Event types: `sim.created, home.rate, setting.set, guest.added, booking.created, booking.status, booking.changed, stock.changed, laundry.changed, cleaning.created, cleaning.done, issue.raised, issue.resolved, review.added, message.added, block.added, policy.logged, tax.drafted, visit, note`. Any event may carry `ledger: [{ kind, homeId, bookingId?, amount, note, passThrough? }]`; kinds: income, refund, vat, commission, tourist-tax (pass-through), cleaning, laundry, supplies, repairs, utilities, insurance.
- Sync: a change saves the document and posts `{ type: 'cc-sim', kind, seq }` on the channel; other tabs (and the `storage` event) re-read the document. If saving fails (quota), the log is folded into `snapshot` and saved again; if that fails the page is told (`kind: 'error'`) and the simulation runs in that tab only.

### clock.js

```js
import { createClock, loadBounds, SPEEDS, realDataFor } from '/assets/js/sim/clock.js';
const clock = createClock({ store, bounds: await loadBounds() });
clock.setDay('2026-11-20'); clock.setTime('2026-11-20T15:00'); clock.advance(90);
clock.play(SPEEDS.day);     // simulated seconds per real second: real 1, minute 60, hour 3600, day 86400, superFast 604800
clock.pause(); clock.tick(realMs); clock.onAdvance((from, to) => ...); clock.days(); clock.realDataFor('2026-11-20');
// -> { date, weather: 'issued' | 'none', events: true | false, sea: bool, how: [...], message }
```

Bounds (`computeBounds`): weather is a list of ranges, the vault copy of 17 November 19:29 UTC (17 to 21 November) plus the live forecast file's dates; sea from the live sea file; events from max(18 November, the file's read date) to the latest event start in the live events file. Fallback constants from REAL-DATES.md: weather 17 to 22 November, events 18 November to 31 December 2026, so the clock runs 17 November to 31 December. A day in a gap says "No real forecast for this day yet: IPMA publishes five days ahead, and nothing is invented." Only the tab that called `play()` drives the clock; the others follow through the store.

### booking.js

```js
import { createBooking, quoteFor, availability, calendar, occupancy, SAMPLE_ICAL } from '/assets/js/sim/booking.js';
const bk = createBooking({ store, guard: createGuard({ store }) });
bk.quote('salt', '2026-11-20', '2026-11-23', { adults: 2, children: [7] }, { channel: 'platform' });
bk.book({ homeId, from, to, guests, guest: { name, country, typedHere: true }, channel: 'direct' }, { actor: 'visitor' });
bk.enquire(o, ctx); bk.hold(id, ctx); bk.pay(id, ctx); bk.checkIn(id, ctx); bk.checkOut(id, ctx);
bk.cancel(id, ctx); bk.changeDates(id, from, to, ctx); bk.importICal(homeId, text, { actor: 'owner' }); bk.expireHolds();
bk.availability(homeId, from, to); bk.calendar(homeId, from, to);
```

- Every method returns `{ ok, error?, decision, events, ... }`; `decision` is the guard's answer (a refused call changes nothing). `ctx`: `{ actor, ownGuestId, provenance, approvedBy }`.
- Invented rates: base from `homes.json` `price_eur_invented`; season factor by month (0.8 in winter to 1.7 in August), 1.3 from 20 December to 2 January, Friday and Saturday nights x 1.15; minimum nights 1 (sleeps 2), 3 (sleeps 6) or 2; cleaning fee 35, 50 or 70.
- Quote: `price` = nights + cleaning (VAT included), `net`, `vat`, `touristTax`, `guestPays` = price + tourist tax, `commission` (platform only, setting `platformCommission` 15 percent, invented), `hostReceives`, `reasons` when not bookable.
- Lifecycle: enquiry, held (until now + 30 simulated minutes), paid (pretend: `payment.note` "Pretend payment: nothing was charged."), checked-in (sets `registrationDue` for foreign guests), checked-out (uses stock, sends linen and towels to the laundry, creates a cleaning job, books cleaning and laundry costs); cancelled from enquiry, held or paid (refund rule, invented: 14+ days before arrival 100 percent, 7 to 13 days 50 percent, else none; tourist tax always returned; an expired hold is cancelled with reason "hold expired").
- Availability, decided: **availability.js is reused, not replaced.** A night is taken when a held (unexpired), paid or checked-in booking or a calendar-feed block covers it, or, when setting `background` is on (default), `availability.isTaken(homeId, day, state.anchor)` says so. The anchor is fixed at 2026-11-17 (not the simulated today), so the background calendar does not reshuffle as the clock moves. Background nights stand for bookings made elsewhere: no money, guests or stock. Note for the pages: the existing pages call `isTaken(home, day, today)` with the real today, so they show a different background calendar from the simulation. To agree, the pages should call `availability()` / `calendar()` from `sim/booking.js` (see requests below).
- Channels: `direct` (this site), `platform` ("a holiday-rental booking platform", commission), `ical` (a calendar feed import: blocks nights, no money; summaries are untrusted text and are flagged by `detectInjection`).

### legal.js and money.js

```js
touristTax({ municipality, from, to, guests }) ; vat(price, { exempt53 }) ; vat53Check(turnoverYear)
irs({ gross, coef, startYear, expenses, marginalRate }) ; registrationDuty(booking, guest) ; addWorkingDays(day, n)
checklist(home, { bookings, guests, now }) ; TOURIST_TAX ; NO_TAX ; SOURCES
pnl(state, { from, to, homeId }) ; ledgerRows(state, opts) ; touristTaxByMunicipality(state, { from, to })
```

- Tourist tax: Faro EUR 2 March to October, EUR 1 otherwise, aged 16+, cap 7 nights (the cap is from guides only, LEGAL-PT.md "sure: low"; the brief did not mention it, I followed the research); Loulé EUR 2 April to October, EUR 1 otherwise, 16+, cap 5 nights; Tavira, Lagos and Vila do Bispo: "none found as of 2026-11-18". The tax is collected and passed on: never revenue, never cost.
- VAT 6 percent inside the price; the article 53 toggle (`settings.vatExempt53`) sets VAT to 0; `vat53Check` warns above EUR 15,000 and EUR 18,750 and never switches by itself.
- IRS: coefficient 0.35 (or 0.50 contention, 0.15 rooms), the 15 percent expenses shortfall at 0.35, first and second year factors, an assumed marginal rate (default 0.30, labelled as an assumption).
- Guest registration: due 3 working days after arrival (weekends and Portuguese holidays skipped), foreign guests only, one checklist item per booking.
- P&L lines per home and total: revenue (income + refunds), vat, commission, costs by kind, netRevenue, profitBeforeTax, the IRS estimate, profitAfterTax, touristTaxCollected; plus `vat53`. All checked against the worked examples in LEGAL-PT.md (EUR 8.00 Faro tax, EUR 452.83 + 27.17 VAT, EUR 7,000 taxable / EUR 2,100 IRS) in `tests/sim-money.test.mjs`.

### abp.js and policies.json

```js
import { createGuard, decide, detectInjection, untrusted, trusted, POLICIES } from '/assets/js/sim/abp.js';
const guard = createGuard({ store });
guard('host-assistant', 'refund.issue', { target, amount: 400, provenance: [untrusted('review', text)], approvedBy });
// -> { decision: 'allow' | 'ask' | 'deny', rule, reason, actor, policy, action, flagged, provenance, ... }  (also logged)
```

- Policies (agenticcells-abp/0.1 subset; extensions `limit_eur` and `see`): `agent.cinco-chamines` (Chaminé, the site's agent, scripted), `guest-assistant` ("Claude, the guest's assistant (simulated)"), `host-assistant` ("Claude, the host's assistant (simulated)"), `housekeeper`, `owner`, `bookkeeper`, `visitor` (the person using the site and synthetic visitors). Cast ids `concierge`, `admin`, `host`, `guest`, `person` map to these.
- Order of checks: no policy (D-default); network or a destination outside the browser (N-no-network); for anything but `read.public` and `booking.quote`, any untrusted item with role `instruction`, or any provenance text that `detectInjection` flags, is denied (N-untrusted-instruction); `share.guest-data` is always denied (N-other-guest-data); a booking action on another guest's booking is denied (N-other-guest-data); then the capability: deny (with its `see` rule, e.g. N-host-only-data, N-guest-private, N-no-real-money), draft (ask: a person sends), plan-apply (ask unless `approvedBy`), allow (ask when `amount` is above `limit_eur`, a number or the setting `refundLimit` / `spendLimit`).
- `detectInjection(text)` matches English and Portuguese instruction-like phrases ("ignore previous", "you are now", "as the system", "refund all", "send me the guest list", "disregard your rules", "ignora as instruções", "a partir de agora és o", "reembolsa todos", "envia-me a lista de hóspedes", "esquece as regras", and a few more) and returns the pattern ids; ordinary questions are tested not to match.

### personas.js

```js
import { createWorld, step, castFrom, loadCast, PROFILES, INJECTIONS } from '/assets/js/sim/personas.js';
const world = createWorld({ store, clock, cast: await loadCast(), weatherFor }).attach();  // runs every hour the clock passes
world.onEvents(evs => animate(evs));       // the events of one batch, for the world page
step(state, '2026-11-20T14:00', { cast, weatherFor, bounds }) -> events   // pure, deterministic
```

- Seed: `rng(state.seed + '|' + hour)`, so the same seed and the same clock give the same world (tested over 30 simulated days).
- Hourly schedule: 00:00 expired holds; 08:00 the owner moves rates (next 14 nights under 35 percent taken: -8 percent, over 80 percent: +8 percent, within 0.75 to 1.4 x the list price), and on the 1st the bookkeeper records utilities and insurance and drafts last month's tourist tax per municipality (decision ask: a person submits); 10:00 check-outs and reviews; 11:00 the housekeeper cleans, logs stock and reorders (over EUR 150 the owner approves); 12:00 the host's assistant orders repairs (over EUR 200 the owner approves); 16:00 check-ins; 18:00 the bookkeeper records guest bulletins ("nothing was sent to SIBA"); 20:00 issues (7 percent a night, 20 percent for the difficult guest): broken boiler, wifi down, noise complaint, broken blind, pool pump (Hill), wood stove (Cape); 08:00 to 22:59 a visitor arrives with probability 0.35 an hour.
- A visit: asks the agent their cast `line`; the injection tester (and 3 percent of others) tries one of `INJECTIONS` and is refused; then up to `tries` homes from their profile, scanning a few arrival days, staying within the window; leaves for "dates taken", "minimum stay", "too many guests", "price" (over budget x 1.1) or "no dates left in the window"; else enquiry, hold and pretend payment, 25 percent through the platform channel (60 percent for the price hunter). The `visit` event carries the steps with minute offsets for animation.
- Review rating: 5, minus 2 / 1 / 0.5 per high / medium / low issue, minus 1 when more than half the nights had rain probability 60 percent or more in the real data (`weatherFor(date)` returns null when there is no real forecast: then weather is neither used nor mentioned), minus 1 when the total was above 90 percent of the budget (plus 0.5 under 60 percent), minus 1.5 for the difficult guest. 12 percent of reviews carry an injected "P.S."; the host's assistant then tries the refund it asks for and is denied, so it shows in the log.
- `weatherFor` is supplied by the page (from `data.js` `forecastFor`), so the engine stays pure and testable.

### figure.js

`figure(look, { pose, mood, scale, prop, hat: 'sun', outfit: 'holiday', flip, kind, label })` and `figureFor(castCharacter, opts)` return an SVG string (viewBox -175 -640 350 660, 70 x 132 px at scale 1). Poses: stand, point, wave, arms-up, shrug, think, sit, walk, hold. Moods: the kit's ten. Props: suitcase, surfboard, laptop, binoculars, broom, mop, ledger, keys, phone, receipt, ticket, balloon, calculator, dog, wheelchair. Agents (`look.colour`) are drawn as the kit's screen-faced robot. Colours are checked (unsafe values fall back to the defaults) and labels escaped. Credit in the header: "Figure design after the storyboard kit of storyboards.sgit.ai, Apache-2.0"; no kit code copied. Rendered and looked at in headless Chrome (all 16 cast members plus variants).

### agents.js

`scenarioList()` and `runScenario(id, { store, guard, booking })` -> `{ title, steps: [{ who, name, text } | { who, tool, args, decision }], events }`. Scenarios: late-arrival, early-check-in, broken-boiler, pet-request, discount-request (ask, then the owner approves 10 percent), injection-message (refund, data sharing and network all denied), refund-above-limit (guest's assistant denied, host's assistant asks a person), other-guest-details (both sides refuse). With a store, allowed calls change the state (arrival note, issue, pretend refund) and every call is logged; without an active booking a stand-in is used and nothing is written.

## Requests for the conductor (existing files I did not touch)

1. `README.md` / `REALITY.md`: add the simulation core once it is wired into pages (REALITY.md: "a thing not written there does not exist").
2. The visitor pages (`src/assets/js/house.js`, `home.js`, `houses.js`) use `availability.isTaken(home, day, realToday)` and `availability.price()`. For the visitor site and the admin to agree, they should read availability and quotes from `sim/booking.js` (`createBooking(...).calendar()` / `.quote()`) with the store's clock. Until then the two calendars differ.
3. Behind the scenes (`scripts/behind.mjs`): credit "figure design after the storyboard kit of storyboards.sgit.ai, Apache-2.0" on the page, as SYNTHETIC-USERS.md 3.4 recommends.
4. `scripts/validate.mjs` checks only `_site/`; the sim files pass its patterns today. If the pages import `sim/*.js`, nothing else is needed: the build copies `src/` as is.
5. `team/scopes.json` / `scripts/role-scope.mjs`: no change needed (all files are under `src/` and `tests/`).
6. Open points for Dinis or the conductor: the Faro 7-night cap (low confidence) is applied; the invented rates, refund rule, commission (15 percent) and costs are proposals; the host's assistant's refund limit (EUR 100) and spend limit (EUR 200) are proposals.

## Limits

- Event log size: 30 simulated days of the world is about 1,000 events and 600 KB (measured); `compact()` runs automatically if the browser refuses to save. A very long super-fast run will compact and lose the early history in the log (the state keeps it).
- Two tabs both playing the clock would both drive it; the page should let one tab play.
- `loadCast()` and `loadBounds()` were not run in a browser in this round (Node tests use file reads and stubs).
