// sim/money.js: the profit and loss of the Cinco Chaminés simulation (a made-up example), per
// home and in total, for any period, from the store's ledger. Formulas from
// team/rounds/2/research/LEGAL-PT.md section 3.4. SIMULATED FIGURES FOR AN INVENTED BUSINESS;
// NOT LEGAL OR TAX ADVICE. The tourist tax is shown as collected and passed on: never revenue,
// never cost. Pure functions, no DOM, no network. Code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance C), 2026-11-18, round 3.

import { round2 } from './util.js';
import { irs, vat53Check, ADVICE, NOTE, SOURCES, CHECKED } from './legal.js';

export const COST_KINDS = Object.freeze(['cleaning', 'laundry', 'supplies', 'repairs', 'utilities', 'insurance']);
export const KINDS = Object.freeze(['income', 'refund', 'vat', 'commission', 'tourist-tax', ...COST_KINDS]);

const blank = () => ({ revenue: 0, income: 0, refunds: 0, vat: 0, commission: 0, costs: Object.fromEntries(COST_KINDS.map(k => [k, 0])), costsTotal: 0, touristTaxCollected: 0, entries: 0 });
function add(t, e) {
  const a = Number(e.amount) || 0;
  t.entries++;
  if (e.kind === 'income') { t.income += a; t.revenue += a; }
  else if (e.kind === 'refund') { t.refunds += a; t.revenue += a; }
  else if (e.kind === 'vat') t.vat += a;
  else if (e.kind === 'commission') t.commission += a;
  else if (e.kind === 'tourist-tax') t.touristTaxCollected += a;
  else if (COST_KINDS.includes(e.kind)) { t.costs[e.kind] += a; t.costsTotal += a; }
}
function finish(t, settings) {
  for (const k of ['revenue', 'income', 'refunds', 'vat', 'commission', 'costsTotal', 'touristTaxCollected']) t[k] = round2(t[k]);
  for (const k of COST_KINDS) t.costs[k] = round2(t.costs[k]);
  t.netRevenue = round2(t.revenue + t.vat);                       // VAT taken out
  t.profitBeforeTax = round2(t.netRevenue + t.commission + t.costsTotal);
  const expenses = round2(-(t.commission + t.costsTotal));
  t.irs = irs({ gross: Math.max(0, t.netRevenue), coef: settings.irsCoef, startYear: settings.irsStartYear, expenses, marginalRate: settings.marginalRate });
  t.profitAfterTax = round2(t.profitBeforeTax - t.irs.irs);
  return t;
}

// pnl(state, { from, to, homeId }) -> { period, homes: {id: lines}, total: lines, vat53, simulated, advice, sources }
// from and to are inclusive YYYY-MM-DD (either may be omitted).
export function pnl(state, { from = null, to = null, homeId = null } = {}) {
  const homes = {};
  const ids = homeId ? [homeId] : state.homeOrder;
  for (const id of ids) homes[id] = blank();
  const total = blank();
  for (const e of state.ledger) {
    if ((from && e.date < from) || (to && e.date > to)) continue;
    if (homeId && e.homeId !== homeId) continue;
    if (e.homeId && homes[e.homeId]) add(homes[e.homeId], e);
    add(total, e);
  }
  for (const id of Object.keys(homes)) finish(homes[id], state.settings);
  finish(total, state.settings);
  const year = String(to || from || '2026').slice(0, 4);
  const turnoverYear = state.ledger.filter(e => e.date.startsWith(year) && (e.kind === 'income' || e.kind === 'refund' || e.kind === 'vat')).reduce((s, e) => s + e.amount, 0);
  return {
    period: { from, to }, homes, total, vat53: vat53Check(turnoverYear),
    simulated: true, advice: ADVICE, note: NOTE, checked: CHECKED,
    sources: [SOURCES.vatRate, SOURCES.vat53, SOURCES.irs31, SOURCES.faro, SOURCES.loule, SOURCES.tavira, SOURCES.lagos, SOURCES.vilaDoBispo],
  };
}

// The ledger rows for a period, newest last, for a table on the admin page.
export function ledgerRows(state, { from = null, to = null, homeId = null, kinds = null } = {}) {
  return state.ledger.filter(e => (!from || e.date >= from) && (!to || e.date <= to) && (!homeId || e.homeId === homeId) && (!kinds || kinds.includes(e.kind)));
}

// Tourist tax collected per municipality for a period (what the bookkeeper files).
export function touristTaxByMunicipality(state, { from = null, to = null } = {}) {
  const out = {};
  for (const e of ledgerRows(state, { from, to, kinds: ['tourist-tax'] })) {
    const m = state.homes[e.homeId]?.municipality || 'unknown';
    out[m] = round2((out[m] || 0) + e.amount);
  }
  return { byMunicipality: out, simulated: true, advice: ADVICE, sources: [SOURCES.faro, SOURCES.loule] };
}
