// sim/price.js: the headline price of each invented home of Cinco Chaminés (a made-up example),
// "from EUR X a night (invented)". When this browser holds the simulation (localStorage
// "cc.sim.v1"), X is that home's base rate there (homes[id].rate.base), so a rate the owner sets
// in /admin/ shows on the home cards, the home page header and the site agent's answers; with no
// simulation yet, X is price_eur_invented from homes.json. Reads only; writes and sends nothing.
// Works in Node for the tests (the storage is passed in). Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 3 (review M2).
import { KEY, validDoc, replay, emptyState, reduce, FALLBACK_HOMES, DEFAULT_SEED, START, ANCHOR } from './store.js';
import { availability } from './booking.js';

// simState(storage) -> the simulation's current state, or null when there is none (never creates one).
export function simState(storage) {
  try {
    const s = storage === undefined ? globalThis.localStorage : storage;
    const t = s?.getItem(KEY);
    if (!t) return null;
    const d = JSON.parse(t);
    if (!validDoc(d)) return null;
    return replay(d.events, d.snapshot ? d.snapshot.state : emptyState());
  } catch { return null; }
}

// nightFrom(id, state, fallback) -> the base rate a night in the simulation, else the file's price.
export function nightFrom(id, state, fallback) {
  const b = Number(state?.homes?.[id]?.rate?.base);
  if (Number.isFinite(b) && b > 0) return Math.round(b);
  const f = Number(fallback);
  return Number.isFinite(f) && f > 0 ? Math.round(f) : null;
}

export const fromWords = n => `from EUR ${n} a night`;

// paintRates(state, root): every <span data-rate-home="<id>" data-rate-file="<EUR>"> gets the number.
export function paintRates(state, root = globalThis.document) {
  if (!root?.querySelectorAll) return;
  for (const el of root.querySelectorAll('[data-rate-home]')) {
    const n = nightFrom(el.dataset.rateHome, state, el.dataset.rateFile);
    if (n !== null && el.textContent !== String(n)) el.textContent = String(n);
  }
}

// ---------- availability as the simulation sees it (round 4, PROPOSAL.md 2.4, review must 2) ----------
// The site agent asks this instead of availability.js, so it agrees night by night with the home
// calendars and the booking (both read SIM.booking.availability, through nightTakenBy and the level
// of bookings from elsewhere). With no simulation in this browser yet it uses the state a new one
// would start with (and creates nothing).
export function freshState() {
  return reduce(emptyState(), { seq: 1, type: 'sim.created', at: START, data: { seed: DEFAULT_SEED, created: START, anchor: ANCHOR, homes: FALLBACK_HOMES.map(h => ({ ...h })) } });
}
function simNow(storage) {
  try { const s = storage === undefined ? globalThis.localStorage : storage; const d = JSON.parse(s?.getItem(KEY) || 'null'); return validDoc(d) ? d.clock.now : null; } catch { return null; }
}
// simAvailability(homeId, from, to, storage) -> { free, taken } as SIM.booking.availability gives it.
export function simAvailability(homeId, from, to, storage) {
  const st = simState(storage) || freshState();
  return availability(st, homeId, from, to, { now: simNow(storage) || START });
}
