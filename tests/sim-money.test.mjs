// Tests for src/assets/js/sim/legal.js and money.js: the formulas of
// team/rounds/2/research/LEGAL-PT.md and the P&L. Simulated figures; not legal or tax advice.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis (instance C), 2026-11-18, round 3.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const L = await import('../src/assets/js/sim/legal.js');
const M = await import('../src/assets/js/sim/money.js');
const S = await import('../src/assets/js/sim/store.js');
const B = await import('../src/assets/js/sim/booking.js');
const { createGuard } = await import('../src/assets/js/sim/abp.js');

const marked = r => { assert.equal(r.simulated, true); assert.equal(r.advice, 'not legal or tax advice'); assert.ok(Array.isArray(r.sources)); };

test('tourist tax: Faro EUR 1 in winter, EUR 2 March to October, 16+, the LEGAL-PT example', () => {
  const r = L.touristTax({ municipality: 'Faro', from: '2026-11-18', to: '2026-11-22', guests: { adults: 2, children: [10] } });
  assert.equal(r.amount, 8, '2 x 4 x EUR 1.00 (LEGAL-PT.md 3.1 example)');
  assert.equal(r.payingGuests, 2);
  marked(r);
  assert.ok(r.sources.some(u => u.includes('barlavento')));
  assert.equal(L.touristTax({ municipality: 'Faro', from: '2026-07-01', to: '2026-07-04', guests: 2 }).amount, 12);
  assert.equal(L.touristTax({ municipality: 'Faro', from: '2026-07-01', to: '2026-07-11', guests: 1 }).amount, 14, 'cap of 7 nights (sure: low)');
  assert.equal(L.touristTax({ municipality: 'Faro', from: '2026-02-27', to: '2026-03-03', guests: 1 }).amount, 1 + 1 + 2 + 2, 'the rate changes on 1 March');
  assert.equal(L.touristTax({ municipality: 'Faro', from: '2026-07-01', to: '2026-07-03', guests: { adults: 1, children: [16, 15] } }).amount, 8, 'a 16-year-old pays, a 15-year-old does not');
});

test('tourist tax: Loulé EUR 2 April to October, EUR 1 otherwise, at most 5 nights', () => {
  assert.equal(L.touristTax({ municipality: 'Loulé', from: '2026-11-18', to: '2026-11-25', guests: 2 }).amount, 10, '2 x 5 nights (cap) x EUR 1');
  assert.equal(L.touristTax({ municipality: 'Loulé', from: '2026-04-01', to: '2026-04-03', guests: 2 }).amount, 8);
  assert.equal(L.touristTax({ municipality: 'Loulé', from: '2026-03-30', to: '2026-04-02', guests: 1 }).amount, 1 + 1 + 2);
});

test('tourist tax: none found for Tavira, Lagos and Vila do Bispo on 18 November 2026 (round 4 S4 wording)', () => {
  for (const m of ['Tavira', 'Lagos', 'Vila do Bispo']) {
    const r = L.touristTax({ municipality: m, from: '2026-07-01', to: '2026-07-05', guests: 4 });
    assert.equal(r.amount, 0);
    assert.equal(r.note, 'No municipal tourist tax found on 18 November 2026; check with the câmara.');
    marked(r);
  }
  assert.equal(L.municipalityId('Vila do Bispo'), 'vila-do-bispo');
  assert.equal(L.municipalityId('Loulé'), 'loule');
});

test('VAT: 6 percent included in the price, and the article 53 exemption toggle', () => {
  const v = L.vat(480);
  assert.equal(v.net, 452.83, 'LEGAL-PT.md 3.2 example');
  assert.equal(v.vat, 27.17);
  marked(v);
  const ex = L.vat(480, { exempt53: true });
  assert.equal(ex.vat, 0);
  assert.equal(ex.net, 480);
  assert.equal(L.vat53Check(14000).status, 'within');
  assert.equal(L.vat53Check(16000).status, 'ends-next-year');
  assert.equal(L.vat53Check(19000).status, 'ends-now');
  assert.match(L.vat53Check(19000).warning, /18750/);
});

test('IRS simplified regime: coefficient 0.35 or 0.50, the 15 percent expenses rule, first years', () => {
  const a = L.irs({ gross: 20000, coef: 0.35, expenses: 4000, marginalRate: 0.3 });
  assert.equal(a.taxable, 7000, 'LEGAL-PT.md 3.3 example');
  assert.equal(a.irs, 2100);
  marked(a);
  const short = L.irs({ gross: 20000, coef: 0.35, expenses: 1000 });
  assert.equal(short.shortfall, 2000);
  assert.equal(short.taxable, 9000);
  assert.equal(L.irs({ gross: 20000, coef: 0.5, expenses: 0 }).taxable, 10000, 'no shortfall rule at 0.50');
  assert.equal(L.irs({ gross: 20000, coef: 0.5, startYear: 1 }).taxable, 5000);
  assert.equal(L.irs({ gross: 20000, coef: 0.5, startYear: 2 }).taxable, 7500);
});

test('guest registration: within 3 working days, foreign guests only, a checklist item per booking', () => {
  assert.equal(L.addWorkingDays('2026-11-20', 3), '2026-11-25', 'Friday + 3 working days');
  assert.equal(L.addWorkingDays('2026-11-30', 3), '2026-12-04', '1 December is a holiday');
  const d = L.registrationDuty({ id: 'b1', from: '2026-11-20' }, { country: 'GB' });
  assert.equal(d.applies, true);
  assert.equal(d.due, '2026-11-25');
  assert.equal(d.done, false);
  assert.equal(L.registrationDuty({ id: 'b2', from: '2026-11-20' }, { country: 'PT' }).applies, false);
  const c = L.checklist({ id: 'cape', municipality: 'Vila do Bispo', sleeps: 5 }, { bookings: [{ id: 'b1', homeId: 'cape', from: '2026-11-20', status: 'checked-in', guestId: 'g' }], guests: { g: { country: 'DE' } }, now: '2026-11-26T09:00' });
  assert.equal(c.items.find(i => i.id === 'registration').ok, false, 'one bulletin late');
  assert.equal(c.items.find(i => i.id === 'tourist-tax').label, 'No municipal tourist tax found on 18 November 2026; check with the câmara.');
  assert.match(c.items.find(i => i.id === 'rnal').label, /demonstration, fake/);
});

test('P&L: per home and total from the ledger, tourist tax passed on, VAT and commission out, marked', () => {
  const store = S.createStore({ storage: S.memoryStorage(), channel: null, listenStorageEvents: false });
  store.reset('money', { settings: { background: false } });
  const bk = B.createBooking({ store, guard: createGuard({ store }) });
  bk.book({ homeId: 'lagoon', from: '2026-11-18', to: '2026-11-22', guests: 2 });
  bk.book({ homeId: 'salt', from: '2026-11-20', to: '2026-11-23', guests: 2, channel: 'platform' });
  store.dispatch({ type: 'note', data: { text: 'costs' }, ledger: [{ kind: 'utilities', homeId: 'salt', amount: -90 }, { kind: 'repairs', homeId: 'lagoon', amount: -60 }] });
  const p = M.pnl(store.getState(), { from: '2026-11-01', to: '2026-11-30' });
  marked(p);
  const lq = bk.quote('lagoon', '2026-11-18', '2026-11-22', 2), sq = store.getState().bookings[store.getState().bookingOrder[1]].quote;
  assert.equal(p.homes.lagoon.revenue, store.getState().bookings[store.getState().bookingOrder[0]].quote.price);
  assert.equal(p.homes.lagoon.touristTaxCollected, 8);
  assert.equal(p.homes.salt.commission, -sq.commission);
  assert.equal(p.homes.salt.costs.utilities, -90);
  assert.equal(p.total.revenue, Math.round((p.homes.lagoon.revenue + p.homes.salt.revenue) * 100) / 100);
  assert.equal(p.total.profitBeforeTax, Math.round((p.total.revenue + p.total.vat + p.total.commission + p.total.costsTotal) * 100) / 100);
  assert.ok(p.total.profitBeforeTax < p.total.revenue);
  assert.equal(p.total.irs.coef, 0.35);
  assert.equal(p.total.profitAfterTax, Math.round((p.total.profitBeforeTax - p.total.irs.irs) * 100) / 100);
  assert.equal(M.pnl(store.getState(), { from: '2026-12-01', to: '2026-12-31' }).total.revenue, 0, 'period filter');
  assert.equal(M.pnl(store.getState(), { homeId: 'salt' }).total.revenue, p.homes.salt.revenue);
  assert.deepEqual(M.touristTaxByMunicipality(store.getState()).byMunicipality, { Faro: 8 });
  void lq;
  store.dispatch({ type: 'setting.set', data: { key: 'vatExempt53', value: true } });
  const q = bk.quote('salt', '2026-11-25', '2026-11-28', 2);
  assert.equal(q.vat, 0, 'the exemption toggle reaches quotes');
});
