// Tests for the simulation core: src/assets/js/sim/store.js, booking.js and clock.js.
// Everything runs on an in-memory store: nothing touches the network. Run: node --test.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis (instance C), 2026-11-18, round 3.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const S = await import('../src/assets/js/sim/store.js');
const B = await import('../src/assets/js/sim/booking.js');
const C = await import('../src/assets/js/sim/clock.js');
const { createGuard } = await import('../src/assets/js/sim/abp.js');
const { isTaken } = await import('../src/assets/js/availability.js');
const homesJson = JSON.parse(readFileSync(new URL('../src/data/homes.json', import.meta.url), 'utf8'));

function setup({ background = false, now = '2026-11-18T09:00', storage = S.memoryStorage(), channel = null } = {}) {
  const store = S.createStore({ storage, channel, homes: homesJson.homes, listenStorageEvents: false });
  store.reset('test-seed', { now, settings: { background } });
  const guard = createGuard({ store });
  const booking = B.createBooking({ store, guard });
  return { store, guard, booking };
}

test('store: reset writes a cc.sim.v1 document with schema, created, seed, clock and an event log', () => {
  const storage = S.memoryStorage();
  const { store } = setup({ storage });
  const doc = JSON.parse(storage.getItem('cc.sim.v1'));
  assert.equal(doc.schema, 1);
  assert.equal(doc.seed, 'test-seed');
  assert.ok(doc.created);
  assert.equal(doc.clock.now, '2026-11-18T09:00');
  assert.equal(doc.events[0].type, 'sim.created');
  const st = store.getState();
  assert.deepEqual(st.homeOrder, ['salt', 'lagoon', 'hill', 'harbour', 'cape']);
  assert.equal(st.homes.hill.rate.base, 160, 'base rate from homes.json');
  assert.ok(st.stock.cape.firewood && st.stock.cape.gas, 'the Cape House has gas and firewood');
  assert.ok(st.stock.hill.pool, 'the Hill House has pool chemicals');
  assert.equal(st.stock.salt.pool, undefined);
});

test('store: load() replays the saved log; export and import round-trip; bad imports are refused', () => {
  const storage = S.memoryStorage();
  const { store, booking } = setup({ storage });
  booking.book({ homeId: 'salt', from: '2026-11-20', to: '2026-11-23', guests: 2, guest: { name: 'Test (invented)', country: 'GB' } });
  const again = S.createStore({ storage, channel: null, listenStorageEvents: false });
  const st = again.load();
  assert.equal(st.bookingOrder.length, 1);
  assert.deepEqual(st, store.getState());
  const json = store.exportJSON();
  const other = S.createStore({ storage: S.memoryStorage(), channel: null, listenStorageEvents: false });
  other.load();
  assert.equal(other.importJSON(json).ok, true);
  assert.deepEqual(other.getState().bookings, store.getState().bookings);
  assert.equal(other.importJSON('{"schema":2}').ok, false);
  assert.equal(other.importJSON('not json').ok, false);
});

test('store: two tabs stay in step through the channel and shared storage', () => {
  const storage = S.memoryStorage(), hub = S.channelHub();
  const a = S.createStore({ storage, channel: hub.channel(), homes: homesJson.homes, listenStorageEvents: false });
  a.reset('sync');
  const b = S.createStore({ storage, channel: hub.channel(), homes: homesJson.homes, listenStorageEvents: false });
  b.load();
  const seen = [];
  b.subscribe((st, info) => seen.push(info.kind));
  a.dispatch({ type: 'setting.set', data: { key: 'vatExempt53', value: true } });
  assert.equal(b.getState().settings.vatExempt53, true);
  a.setClock({ now: '2026-11-20T10:00' });
  assert.equal(b.clock().now, '2026-11-20T10:00');
  assert.deepEqual(seen, ['sync', 'clock']);
});

test('store: the reducer folds any event carrying ledger lines', () => {
  const { store } = setup();
  store.dispatch({ type: 'note', data: { text: 'x' }, ledger: [{ kind: 'utilities', homeId: 'salt', amount: -90.004 }] });
  const l = store.getState().ledger;
  assert.equal(l.length, 1);
  assert.equal(l[0].amount, -90);
  assert.equal(l[0].date, '2026-11-18');
});

test('booking: quote uses invented rates with weekend and season factors, minimum nights and the cleaning fee', () => {
  const { booking, store } = setup();
  const h = store.getState().homes.salt;
  assert.equal(B.nightRate(h, '2026-11-18'), Math.round(120 * 0.85)); // Wednesday in November
  assert.equal(B.nightRate(h, '2026-11-20'), Math.round(120 * 0.85 * 1.15)); // Friday night
  assert.equal(B.nightRate(h, '2026-12-24'), Math.round(120 * 1.3)); // festive
  const q = booking.quote('salt', '2026-11-18', '2026-11-21', 2);
  assert.equal(q.ok, true);
  assert.equal(q.accommodation, 102 + 102 + 117);
  assert.equal(q.cleaningFee, 50);
  assert.equal(q.price, 371);
  assert.equal(q.vat, 21);
  assert.equal(q.net, 350);
  assert.equal(q.touristTax, 0, 'Tavira: none found');
  assert.equal(q.guestPays, 371);
  assert.equal(q.simulated, true);
  assert.match(q.note, /nothing is charged/);
  const lagoon = booking.quote('lagoon', '2026-11-18', '2026-11-22', 2);
  assert.equal(lagoon.touristTax, 8, 'Faro: 2 guests x 4 nights x EUR 1 in November');
  assert.equal(booking.quote('hill', '2026-11-18', '2026-11-20', 2).ok, false, 'the Hill House needs 3 nights');
  assert.match(booking.quote('hill', '2026-11-18', '2026-11-20', 2).reasons.join(), /minimum stay of 3/);
  assert.match(booking.quote('lagoon', '2026-11-18', '2026-11-20', 3).reasons.join(), /sleeps 2/);
  assert.match(booking.quote('salt', '2026-11-10', '2026-11-12', 2).reasons.join(), /past/);
  const plat = booking.quote('salt', '2026-11-18', '2026-11-21', 2, { channel: 'platform' });
  assert.equal(plat.commission, 55.65);
  assert.equal(plat.hostReceives, 315.35);
  assert.equal(plat.channelLabel, 'a holiday-rental booking platform');
});

test('booking: the full lifecycle enquiry, held, paid (pretend), checked-in, checked-out', () => {
  const { booking, store } = setup();
  const e = booking.enquire({ homeId: 'hill', from: '2026-11-19', to: '2026-11-23', guests: { adults: 2, children: [7, 11] }, guest: { name: 'The Testers (invented)', country: 'GB' } });
  assert.equal(e.ok, true, e.error);
  const id = e.booking.id;
  assert.equal(store.getState().bookings[id].status, 'enquiry');
  assert.equal(booking.hold(id).ok, true);
  assert.equal(store.getState().bookings[id].status, 'held');
  assert.equal(store.getState().bookings[id].until, '2026-11-18T09:30');
  const p = booking.pay(id);
  assert.equal(p.ok, true);
  const b = store.getState().bookings[id];
  assert.equal(b.status, 'paid');
  assert.equal(b.payment.pretend, true);
  assert.match(b.payment.note, /nothing was charged/);
  const kinds = store.getState().ledger.map(l => l.kind);
  assert.deepEqual(kinds, ['income', 'vat', 'tourist-tax']);
  assert.equal(store.getState().ledger[2].amount, 2 * 4 * 1, 'Loulé: 2 adults aged 16+, 4 nights, EUR 1 in November');
  assert.equal(booking.checkIn(id).ok, false, 'not before arrival');
  store.setClock({ now: '2026-11-19T16:00' });
  const ci = booking.checkIn(id);
  assert.equal(ci.ok, true);
  assert.equal(ci.duty.due, '2026-11-24', '3 working days from Thursday 19 November');
  assert.equal(store.getState().bookings[id].status, 'checked-in');
  store.setClock({ now: '2026-11-23T10:00' });
  const before = store.getState().stock.hill;
  const co = booking.checkOut(id);
  assert.equal(co.ok, true);
  const st = store.getState();
  assert.equal(st.bookings[id].status, 'checked-out');
  assert.deepEqual(st.bookings[id].history.map(h => h.status), ['enquiry', 'held', 'paid', 'checked-in', 'checked-out']);
  // stock depletion
  assert.equal(st.stock.hill.welcome.qty, before.welcome.qty - 1);
  assert.equal(st.stock.hill.cleaning.qty, before.cleaning.qty - 1);
  assert.equal(st.stock.hill.linen.qty, before.linen.qty - 3, 'three bedrooms of linen to the laundry');
  assert.equal(st.stock.hill.towels.qty, before.towels.qty - 8, 'two towels per guest');
  assert.equal(st.stock.hill.pool.qty, before.pool.qty - 1.6, 'pool chemicals 0.4 per night');
  assert.deepEqual(st.laundry.hill, { linen: 3, towels: 8 });
  const job = Object.values(st.cleaning)[0];
  assert.equal(job.status, 'to do');
  assert.ok(st.ledger.some(l => l.kind === 'cleaning') && st.ledger.some(l => l.kind === 'laundry'));
  // the housekeeper's clean brings the laundry back
  const done = B.buildCleaningDone(st, job.id, { now: '2026-11-23T12:00' });
  store.dispatch(done.events);
  const after = store.getState();
  assert.equal(after.cleaning[job.id].status, 'done');
  assert.deepEqual(after.laundry.hill, { linen: 0, towels: 0 });
  assert.equal(after.stock.hill.towels.qty, before.towels.qty - done.lost);
});

test('booking: availability combines seeded background occupancy with store bookings and calendar-feed blocks', () => {
  const { booking, store } = setup({ background: true });
  const st = store.getState();
  // background nights match availability.js anchored at the simulation's anchor date
  let takenDay = null, freeRun = null;
  for (let i = 1; i < 60 && (!takenDay || !freeRun); i++) {
    const d = new Date(Date.UTC(2026, 10, 18 + i)).toISOString().slice(0, 10);
    if (!takenDay && isTaken('salt', d, st.anchor)) takenDay = d;
    const d2 = new Date(Date.UTC(2026, 10, 19 + i)).toISOString().slice(0, 10), d3 = new Date(Date.UTC(2026, 10, 20 + i)).toISOString().slice(0, 10);
    if (!freeRun && !isTaken('salt', d, st.anchor) && !isTaken('salt', d2, st.anchor) && d > '2026-11-18') freeRun = [d, d3];
  }
  const t = B.nightTakenBy(st, 'salt', takenDay);
  assert.equal(t.why, 'simulated background occupancy');
  assert.equal(booking.availability('salt', freeRun[0], freeRun[1]).free, true);
  const r = booking.book({ homeId: 'salt', from: freeRun[0], to: freeRun[1], guests: 2, guest: { name: 'A (invented)' } });
  assert.equal(r.ok, true, r.error);
  const av = booking.availability('salt', freeRun[0], freeRun[1]);
  assert.equal(av.free, false);
  assert.equal(av.taken[0].why, 'booking');
  assert.equal(booking.enquire({ homeId: 'salt', from: freeRun[0], to: freeRun[1], guests: 2 }).ok, false, 'no double booking');
  // background off: only store bookings count
  store.dispatch({ type: 'setting.set', data: { key: 'background', value: false } });
  assert.equal(booking.availability('salt', takenDay, B.nightTakenBy(store.getState(), 'salt', takenDay) ? takenDay : takenDay).free, true);
  const cal = booking.calendar('salt', '2026-11-18', '2026-11-25');
  assert.equal(cal.length, 7);
  assert.ok(cal.every(n => typeof n.rate === 'number'));
});

test('booking: holds expire; cancellation refunds by the invented rule; date changes re-quote', () => {
  const { booking, store } = setup();
  const e = booking.enquire({ homeId: 'harbour', from: '2026-12-10', to: '2026-12-14', guests: 2 });
  booking.hold(e.booking.id);
  store.setClock({ now: '2026-11-18T10:00' });
  assert.equal(booking.availability('harbour', '2026-12-10', '2026-12-14').free, true, 'an expired hold frees the nights');
  booking.expireHolds();
  assert.equal(store.getState().bookings[e.booking.id].status, 'cancelled');
  assert.equal(store.getState().bookings[e.booking.id].cancelReason, 'hold expired');

  const r = booking.book({ homeId: 'harbour', from: '2026-12-10', to: '2026-12-14', guests: 2, channel: 'platform' });
  assert.equal(r.ok, true);
  const ch = booking.changeDates(r.booking.id, '2026-12-11', '2026-12-16');
  assert.equal(ch.ok, true, ch.error);
  const nb = store.getState().bookings[r.booking.id];
  assert.equal(nb.from, '2026-12-11');
  assert.equal(nb.quote.nights, 5);
  const income = store.getState().ledger.filter(l => l.bookingId === nb.id && l.kind === 'income').reduce((s, l) => s + l.amount, 0);
  assert.equal(Math.round(income * 100) / 100, nb.quote.price, 'income follows the new quote');
  const c = booking.cancel(nb.id);
  assert.equal(c.ok, true);
  assert.equal(c.fraction, 1, '23 days before arrival: full refund (invented rule)');
  const net = store.getState().ledger.filter(l => l.bookingId === nb.id && ['income', 'refund', 'vat', 'commission', 'tourist-tax'].includes(l.kind)).reduce((s, l) => s + l.amount, 0);
  assert.equal(Math.round(net * 100) / 100, 0, 'a full refund nets to zero');
  assert.equal(B.refundFraction({ from: '2026-11-28' }, '2026-11-18T09:00'), 0.5);
  assert.equal(B.refundFraction({ from: '2026-11-20' }, '2026-11-18T09:00'), 0);
});

test('booking: a calendar feed (iCal) import blocks nights and marks untrusted summaries', () => {
  const { booking, store } = setup();
  const r = booking.importICal('cape', B.SAMPLE_ICAL);
  assert.equal(r.ok, true);
  assert.equal(r.count, 2);
  assert.equal(r.flagged.length, 1, 'the injected summary is flagged');
  assert.equal(store.getState().blocks[1].trusted, false);
  assert.equal(booking.availability('cape', '2026-12-05', '2026-12-08').taken[0].why, 'calendar feed');
  const again = booking.importICal('cape', B.SAMPLE_ICAL);
  assert.equal(again.count, 0, 'importing twice adds nothing');
  const denied = booking.importICal('cape', B.SAMPLE_ICAL, { actor: 'visitor' });
  assert.equal(denied.ok, false);
  assert.equal(denied.decision.decision, 'deny');
});

test('booking: every state change asks the guard; a visitor cannot act on another guest\'s booking', () => {
  const { booking, store } = setup();
  const r = booking.book({ homeId: 'salt', from: '2026-11-20', to: '2026-11-23', guests: 2 });
  const log = store.getState().policyLog;
  assert.deepEqual(log.map(l => l.action), ['booking.enquire', 'booking.hold', 'booking.pay']);
  const c = booking.cancel(r.booking.id, { ownGuestId: 'someone-else' });
  assert.equal(c.ok, false);
  assert.equal(c.decision.rule, 'N-other-guest-data');
  const a = booking.enquire({ homeId: 'salt', from: '2026-11-25', to: '2026-11-28', guests: 2 }, { actor: 'agent.cinco-chamines' });
  assert.equal(a.ok, true);
  const p = booking.pay(a.booking.id, { actor: 'agent.cinco-chamines' });
  assert.equal(p.ok, false, 'the site agent never pays');
  assert.equal(p.decision.rule, 'N-no-real-money');
});

test('clock: bounds from the researched constants and from live files; realDataFor', () => {
  const b = C.FALLBACK_BOUNDS;
  assert.equal(b.from, '2026-11-17');
  assert.equal(b.to, '2026-12-31');
  assert.deepEqual(C.realDataFor('2026-11-17', b), { ...C.realDataFor('2026-11-17', b), weather: 'issued', events: false });
  assert.equal(C.realDataFor('2026-11-20', b).weather, 'issued');
  assert.equal(C.realDataFor('2026-11-20', b).events, true);
  assert.equal(C.realDataFor('2026-12-10', b).weather, 'none');
  assert.match(C.realDataFor('2026-12-10', b).message, /No real forecast for this day yet/);
  assert.equal(C.realDataFor('2027-01-05', b).events, false);
  const live = C.computeBounds({
    forecast: { cities: [{ id: 1, days: [{ date: '2026-11-25' }, { date: '2026-11-29' }] }] },
    sea: { coasts: [{ days: [{ date: '2026-11-25' }, { date: '2026-11-27' }] }] },
    events: { read_at: '2026-11-25T10:00:00Z', places: { faro: [{ startDate: '2026-11-26' }], lagos: [{ startDate: '2027-01-20T21:00' }] } },
  });
  assert.equal(live.fallback, false);
  assert.equal(live.to, '2027-01-20');
  assert.equal(live.events.from, '2026-11-25');
  assert.equal(C.realDataFor('2026-11-23', live).weather, 'none', 'the gap between the vault copy and the live file has no real forecast');
  assert.equal(C.realDataFor('2026-11-28', live).weather, 'issued');
  assert.equal(C.realDataFor('2026-11-28', live).sea, false);
});

test('clock: setDay, advance and play are clamped to the window; play speeds tick', async () => {
  const { store } = setup();
  const clock = C.createClock({ store, timers: null });
  assert.equal(clock.setDay('2026-11-25'), '2026-11-25T09:00');
  assert.equal(clock.advance(90), '2026-11-25T10:30');
  assert.equal(clock.setDay('not-a-day'), '2026-11-25T10:30', 'an invalid day is ignored');
  assert.equal(clock.setTime('2027-03-01T10:00'), '2026-12-31T23:59', 'clamped to the end of the window');
  assert.equal(clock.setTime('2026-01-01T10:00'), '2026-11-17T00:00', 'clamped to the start');
  const seen = [];
  clock.onAdvance((from, to) => seen.push([from, to]));
  clock.setDay('2026-11-18', '09:00');
  clock.play(C.SPEEDS.day);
  assert.equal(store.clock().playing, true);
  clock.tick(1000); // one real second at a day per second
  assert.equal(clock.now(), '2026-11-19T09:00');
  clock.play(C.SPEEDS.real);
  clock.tick(30000);
  assert.equal(clock.now(), '2026-11-19T09:00', 'half a minute at real time: not a whole minute yet');
  clock.tick(30000);
  assert.equal(clock.now(), '2026-11-19T09:01');
  clock.pause();
  assert.equal(store.clock().playing, false);
  assert.ok(seen.length >= 3);
  assert.equal(clock.days().length, 45);
  const loaded = await C.loadBounds({ getSource: async () => { throw new Error('offline'); } });
  assert.equal(loaded.fallback, true, 'falls back to the researched constants');
});
