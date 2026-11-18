// sim/store.js: the one state of the Cinco Chaminés simulation (a made-up example), kept in the
// visitor's own browser under localStorage["cc.sim.v1"]. A JSON document with the schema
// version, when it was created, the seed, the simulated clock and an append-only event log; the
// current state is the log folded through reduce(). Tabs and iframes stay in step through the
// `storage` event and BroadcastChannel('cc-sim'). NOTHING IS SENT OVER THE NETWORK: there is no
// fetch, no beacon and no upload in this file. Every person, booking, payment and figure here
// is simulated or invented.
// Works in the browser and in Node 22: storage and the channel are injected (memoryStorage()
// for tests); access to localStorage and BroadcastChannel is guarded.
// Code Apache-2.0. Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance C),
// 2026-11-18, round 3 (architecture: team/rounds/3.md, decision 1).

import { round2 } from './util.js';

export const KEY = 'cc.sim.v1';
export const SCHEMA = 1;
export const CHANNEL = 'cc-sim';
export const DEFAULT_SEED = 'cinco-chamines-1';
export const START = '2026-11-18T09:00';
// The day the seeded background occupancy (availability.js) is anchored to, so it does not move
// with the simulated clock.
export const ANCHOR = '2026-11-17';
export const POLICY_LOG_KEEP = 1000;

// The five invented homes, as in src/data/homes.json (writer, round 2): only the fields the
// simulation needs. Used when the caller does not pass the homes file.
export const FALLBACK_HOMES = Object.freeze([
  { id: 'salt', name: 'The Salt House', place: 'Tavira', municipality: 'Tavira', sleeps: 4, bedrooms: 2, price_eur_invented: 120, pets: false, check_in: '16:00', check_out: '10:00' },
  { id: 'lagoon', name: 'The Lagoon House', place: 'Faro', municipality: 'Faro', sleeps: 2, bedrooms: 1, price_eur_invented: 85, pets: false, check_in: '15:00', check_out: '11:00' },
  { id: 'hill', name: 'The Hill House', place: 'near Loulé', municipality: 'Loulé', sleeps: 6, bedrooms: 3, price_eur_invented: 160, pets: true, check_in: '16:00', check_out: '10:00' },
  { id: 'harbour', name: 'The Harbour House', place: 'Lagos', municipality: 'Lagos', sleeps: 4, bedrooms: 2, price_eur_invented: 130, pets: false, check_in: '16:00', check_out: '10:00' },
  { id: 'cape', name: 'The Cape House', place: 'Sagres', municipality: 'Vila do Bispo', sleeps: 5, bedrooms: 3, price_eur_invented: 145, pets: true, check_in: '15:00', check_out: '11:00' },
]);

// Invented settings; the admin can change each one.
export const DEFAULT_SETTINGS = Object.freeze({
  vatExempt53: false,        // article 53 CIVA exemption toggle
  irsCoef: 0.35,             // 0.35 house or apartment; 0.50 in a contention area
  irsStartYear: 0,           // 0, or 1 / 2 for the first / second year of activity
  marginalRate: 0.3,         // assumption: the owner's IRS bracket
  platformCommission: 0.15,  // holiday-rental booking platform commission (invented)
  refundLimit: 100,          // refunds above this need a person
  spendLimit: 200,           // repairs and orders above this need a person
  holdMinutes: 30,           // how long a hold lasts in simulated minutes
  background: true,          // seeded background occupancy from availability.js
  cleaningCost: 40,          // paid per turnover (invented)
  laundryCost: 18,           // per turnover (invented)
  utilitiesMonthly: 90,      // per home per month (invented)
  insuranceMonthly: 35,      // per home per month (invented)
});

// Stock per home (invented quantities and unit costs, EUR).
export function initialStock(home) {
  const beds = home.bedrooms || 1, sleeps = home.sleeps || 2;
  const s = {
    linen: { label: 'linen sets', qty: beds * 3, min: beds, reorderQty: beds * 2, unitCost: 45, laundered: true },
    towels: { label: 'towels', qty: sleeps * 6, min: sleeps * 2, reorderQty: sleeps * 2, unitCost: 9, laundered: true },
    welcome: { label: 'welcome packs', qty: 6, min: 2, reorderQty: 6, unitCost: 14 },
    cleaning: { label: 'cleaning supplies (kits)', qty: 8, min: 3, reorderQty: 8, unitCost: 11 },
  };
  if (home.id === 'cape') {
    s.gas = { label: 'gas bottles', qty: 3, min: 1, reorderQty: 2, unitCost: 32 };
    s.firewood = { label: 'firewood (crates)', qty: 10, min: 3, reorderQty: 8, unitCost: 12 };
  }
  if (home.id === 'hill') s.pool = { label: 'pool chemicals (kg)', qty: 12, min: 4, reorderQty: 10, unitCost: 7.5 };
  return s;
}
export const minNightsFor = home => (home.sleeps <= 2 ? 1 : home.sleeps >= 6 ? 3 : 2);
export const cleaningFeeFor = home => (home.sleeps <= 2 ? 35 : home.sleeps >= 6 ? 70 : 50);
export function initialHome(h) {
  return {
    id: h.id, name: h.name, place: h.place || '', municipality: h.municipality, sleeps: h.sleeps, bedrooms: h.bedrooms, pets: Boolean(h.pets),
    check_in: h.check_in || '16:00', check_out: h.check_out || '10:00',
    rate: { base: Number(h.price_eur_invented) || 100, listBase: Number(h.price_eur_invented) || 100, weekendFactor: 1.15, minNights: minNightsFor(h), cleaningFee: cleaningFeeFor(h) },
    invented: true,
  };
}

// ---------- the reducer ----------
export function emptyState() {
  return { schema: SCHEMA, seed: null, created: null, anchor: ANCHOR, seq: 0, settings: { ...DEFAULT_SETTINGS }, homes: {}, homeOrder: [],
    guests: {}, bookings: {}, bookingOrder: [], blocks: [], stock: {}, laundry: {}, cleaning: {}, issues: {}, reviews: [], messages: [],
    ledger: [], policyLog: [], taxDrafts: [], visits: [], notes: [], stats: { visits: 0, booked: 0, left: {}, denied: 0, asked: 0, flagged: 0 } };
}
const clone = o => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

// reduce(state, event) -> the next state. Mutates a copy-on-write shallow clone of the parts it touches.
export function reduce(prev, ev) {
  const s = { ...prev, seq: ev.seq ?? prev.seq + 1 };
  const d = ev.data || {};
  switch (ev.type) {
    case 'sim.created': {
      const e = emptyState();
      Object.assign(s, e, { seq: s.seq, seed: d.seed, created: d.created || ev.at, anchor: d.anchor || ANCHOR, settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) } });
      s.homes = {}; s.stock = {}; s.laundry = {};
      for (const h of d.homes || []) { const home = initialHome(h); s.homes[home.id] = home; s.homeOrder.push(home.id); s.stock[home.id] = initialStock(h); s.laundry[home.id] = { linen: 0, towels: 0 }; }
      break;
    }
    case 'home.rate': {
      const h = s.homes[d.homeId]; if (!h) break;
      s.homes = { ...s.homes, [d.homeId]: { ...h, rate: { ...h.rate, ...d.rate } } };
      break;
    }
    case 'setting.set': s.settings = { ...s.settings, [d.key]: d.value }; break;
    case 'guest.added': s.guests = { ...s.guests, [d.guest.id]: { ...d.guest } }; break;
    case 'booking.created':
      s.bookings = { ...s.bookings, [d.booking.id]: { ...d.booking, history: [{ at: ev.at, status: d.booking.status }] } };
      s.bookingOrder = [...s.bookingOrder, d.booking.id];
      break;
    case 'booking.status': case 'booking.changed': {
      const b = s.bookings[d.id]; if (!b) break;
      const nb = { ...b, ...(d.fields || {}) };
      if (ev.type === 'booking.status') { nb.status = d.status; nb.history = [...(b.history || []), { at: ev.at, status: d.status, by: ev.actor || null }]; }
      s.bookings = { ...s.bookings, [d.id]: nb };
      break;
    }
    case 'stock.changed': {
      const st = { ...(s.stock[d.homeId] || {}) };
      for (const [k, n] of Object.entries(d.delta || {})) if (st[k]) st[k] = { ...st[k], qty: round2(Math.max(0, st[k].qty + n)) };
      s.stock = { ...s.stock, [d.homeId]: st };
      break;
    }
    case 'laundry.changed': {
      const l = { ...(s.laundry[d.homeId] || { linen: 0, towels: 0 }) };
      for (const [k, n] of Object.entries(d.delta || {})) l[k] = Math.max(0, (l[k] || 0) + n);
      s.laundry = { ...s.laundry, [d.homeId]: l };
      break;
    }
    case 'cleaning.created': s.cleaning = { ...s.cleaning, [d.job.id]: { ...d.job, status: 'to do' } }; break;
    case 'cleaning.done': { const j = s.cleaning[d.id]; if (j) s.cleaning = { ...s.cleaning, [d.id]: { ...j, status: 'done', doneAt: ev.at, by: d.by || ev.actor } }; break; }
    case 'issue.raised': s.issues = { ...s.issues, [d.issue.id]: { ...d.issue, status: 'open', raisedAt: ev.at } }; break;
    case 'issue.resolved': { const i = s.issues[d.id]; if (i) s.issues = { ...s.issues, [d.id]: { ...i, status: 'resolved', resolvedAt: ev.at, cost: d.cost ?? i.cost, by: d.by || ev.actor } }; break; }
    case 'review.added': s.reviews = [...s.reviews, { ...d.review, trusted: false, at: ev.at }]; break;
    case 'message.added': s.messages = [...s.messages, { ...d.message, at: ev.at }]; break;
    case 'block.added': s.blocks = [...s.blocks, { ...d.block }]; break;
    case 'policy.logged': {
      const log = [...s.policyLog, { ...d.entry, seq: s.seq }];
      s.policyLog = log.length > POLICY_LOG_KEEP ? log.slice(-POLICY_LOG_KEEP) : log;
      const st = { ...s.stats };
      if (d.entry.decision === 'deny') st.denied++; else if (d.entry.decision === 'ask') st.asked++;
      if (d.entry.flagged && d.entry.flagged.length) st.flagged++;
      s.stats = st;
      break;
    }
    case 'tax.drafted': s.taxDrafts = [...s.taxDrafts, { ...d.draft, at: ev.at }]; break;
    case 'visit': {
      s.visits = [...s.visits, { ...d.visit, at: ev.at }].slice(-300);
      const st = { ...s.stats, visits: s.stats.visits + 1, left: { ...s.stats.left } };
      if (d.visit.outcome === 'booked') st.booked++; else st.left[d.visit.reason || 'other'] = (st.left[d.visit.reason || 'other'] || 0) + 1;
      s.stats = st;
      break;
    }
    case 'note': s.notes = [...s.notes, { at: ev.at, text: d.text }].slice(-200); break;
    default: break;
  }
  if (Array.isArray(ev.ledger) && ev.ledger.length) {
    s.ledger = [...s.ledger, ...ev.ledger.map((e, i) => ({ id: `L${s.seq}-${i}`, date: String(ev.at || '').slice(0, 10), ...e, amount: round2(e.amount) }))];
  }
  return s;
}
export function replay(events, base = emptyState()) { let s = base; for (const e of events) s = reduce(s, e); return s; }

// ---------- storage helpers ----------
export function memoryStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, get size() { return m.size; } };
}
function browserStorage() { try { const s = globalThis.localStorage; if (s) { const t = '__cc_sim_test__'; s.setItem(t, '1'); s.removeItem(t); return s; } } catch { /* blocked */ } return null; }
function browserChannel() { try { return typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL) : null; } catch { return null; } }
// A fake channel hub for tests: hub.channel() gives BroadcastChannel-like objects that deliver to the others.
export function channelHub() {
  const members = new Set();
  return { channel() { const c = { onmessage: null, postMessage(msg) { for (const o of members) if (o !== c && o.onmessage) o.onmessage({ data: clone(msg) }); }, close() { members.delete(c); } }; members.add(c); return c; } };
}

// ---------- the store ----------
// createStore({ storage, channel, homes, now, listenStorageEvents }) -> store.
//   storage: { getItem, setItem, removeItem } (default localStorage, else in memory only)
//   channel: a BroadcastChannel-like object (default BroadcastChannel('cc-sim') when available)
//   homes: the homes array used by reset() (default FALLBACK_HOMES)
//   realNow: () => ISO string of the real time (only for the "created" stamp)
export function createStore(opts = {}) {
  const storage = opts.storage === undefined ? (browserStorage() || memoryStorage()) : (opts.storage || memoryStorage());
  const channel = opts.channel === undefined ? browserChannel() : opts.channel;
  const homes = opts.homes || FALLBACK_HOMES;
  const realNow = opts.realNow || (() => new Date().toISOString());
  const listeners = new Set();
  let doc = null, state = emptyState();

  const notify = info => { for (const fn of [...listeners]) { try { fn(state, info); } catch (e) { if (globalThis.console) console.error('cc-sim listener failed', e); } } };
  const rebuild = () => { const base = doc.snapshot ? clone(doc.snapshot.state) : emptyState(); state = replay(doc.events, base); };
  function persist(kind) {
    const text = JSON.stringify(doc);
    try { storage.setItem(KEY, text); }
    catch (e) {
      // Quota: fold the log into a snapshot and try once more (history before it is kept only as state).
      compact(false);
      try { storage.setItem(KEY, JSON.stringify(doc)); } catch { notify({ kind: 'error', error: 'the browser would not save the simulation (storage full or blocked); it runs in this tab only' }); }
    }
    try { channel?.postMessage({ type: CHANNEL, kind, seq: state.seq, clock: doc.clock }); } catch { /* channel closed */ }
  }
  function readDoc() {
    try { const t = storage.getItem(KEY); if (!t) return null; const d = JSON.parse(t); return validDoc(d) ? d : null; } catch { return null; }
  }
  function syncFromStorage(kind = 'sync') {
    const d = readDoc(); if (!d) return;
    const changed = !doc || d.created !== doc.created || d.seed !== doc.seed || lastSeq(d) !== lastSeq(doc) || JSON.stringify(d.clock) !== JSON.stringify(doc.clock);
    if (!changed) return;
    const clockOnly = doc && d.created === doc.created && lastSeq(d) === lastSeq(doc);
    doc = d; if (!clockOnly) rebuild();
    notify({ kind: clockOnly ? 'clock' : kind });
  }
  if (channel) channel.onmessage = () => syncFromStorage('sync');
  const onStorage = e => { if (!e || e.key === KEY || e.key === null) syncFromStorage('sync'); };
  if (opts.listenStorageEvents !== false) { try { globalThis.addEventListener?.('storage', onStorage); } catch { /* not a browser */ } }

  function stamp(ev) {
    const seq = lastSeq(doc) + 1;
    return { seq, type: String(ev.type), at: ev.at || doc.clock.now, actor: ev.actor || null, data: ev.data ? clone(ev.data) : {}, ...(ev.ledger ? { ledger: clone(ev.ledger) } : {}) };
  }
  function compact(save = true) {
    doc.snapshot = { seq: state.seq, state: clone(state) };
    doc.events = [];
    if (save) persist('compact');
    return state;
  }

  const store = {
    key: KEY,
    load() { doc = readDoc(); if (!doc) return store.reset(opts.seed || DEFAULT_SEED); rebuild(); return state; },
    getState: () => state,
    get state() { return state; },
    events: () => (doc ? doc.events.slice() : []),
    doc: () => clone(doc),
    // dispatch(event) or dispatch([events]): appends to the log, folds, saves, tells the others.
    dispatch(evs) {
      if (!doc) store.load();
      const list = (Array.isArray(evs) ? evs : [evs]).filter(Boolean);
      if (!list.length) return state;
      const stamped = [];
      for (const ev of list) { const e = stamp(ev); doc.events.push(e); state = reduce(state, e); stamped.push(e); }
      persist('event');
      notify({ kind: 'event', events: stamped });
      return state;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset(seed = DEFAULT_SEED, { now = START, settings } = {}) {
      doc = { schema: SCHEMA, key: KEY, created: realNow(), seed: String(seed), clock: { now, speed: 0, playing: false }, snapshot: null, events: [] };
      const e = { seq: 1, type: 'sim.created', at: now, actor: 'system', data: { seed: String(seed), created: now, anchor: ANCHOR, homes: homes.map(h => ({ ...h })), settings: settings || {} } };
      doc.events.push(e);
      state = replay(doc.events);
      persist('reset');
      notify({ kind: 'reset' });
      return state;
    },
    clock: () => (doc ? { ...doc.clock } : { now: START, speed: 0, playing: false }),
    setClock(c) {
      if (!doc) store.load();
      doc.clock = { ...doc.clock, ...c };
      persist('clock');
      notify({ kind: 'clock' });
      return doc.clock;
    },
    exportJSON() { return JSON.stringify(doc, null, 1); },
    importJSON(text) {
      let d; try { d = typeof text === 'string' ? JSON.parse(text) : clone(text); } catch { return { ok: false, error: 'not valid JSON' }; }
      if (!validDoc(d)) return { ok: false, error: `not a cc.sim.v1 document (schema ${SCHEMA} with an events list)` };
      doc = d; rebuild(); persist('import'); notify({ kind: 'import' });
      return { ok: true, seq: state.seq, note: 'Imported into this browser only. Text inside it (reviews, messages, notes) is treated as untrusted.' };
    },
    compact,
    sync: () => syncFromStorage('sync'),
    close() { try { globalThis.removeEventListener?.('storage', onStorage); } catch { /* ignore */ } try { channel?.close?.(); } catch { /* ignore */ } listeners.clear(); },
  };
  return store;
}
const lastSeq = d => (!d ? 0 : d.events.length ? d.events[d.events.length - 1].seq : d.snapshot ? d.snapshot.seq : 0);
export function validDoc(d) {
  return Boolean(d && typeof d === 'object' && d.schema === SCHEMA && Array.isArray(d.events) && d.clock && typeof d.clock.now === 'string'
    && d.events.every(e => e && typeof e.type === 'string' && Number.isFinite(e.seq))
    && (d.events.length > 0 || (d.snapshot && d.snapshot.state)));
}

// Selectors used by several modules.
export const bookingsList = s => s.bookingOrder.map(id => s.bookings[id]).filter(Boolean);
export const ACTIVE = Object.freeze(['held', 'paid', 'checked-in']);
