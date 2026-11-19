// admin/history.js: the money of the Cinco Chaminés simulation (a made-up example) as P&L lines per
// home and month: a SEEDED, SIMULATED HISTORY for 1 January to 16 November 2026 (so the monthly
// charts have something to read on day one; conductor's answer 1 in team/rounds/3.md), then the
// session's own ledger from 17 November (sim/money.js). The history is computed in the page from
// the seed, the invented rates and the season factors; it is never stored and never real.
// Formulas: team/rounds/2/research/LEGAL-PT.md 3.1 to 3.4 (VAT 6 percent inside the price, the
// platform commission, tourist tax passed on, IRS simplified regime). NOT LEGAL OR TAX ADVICE.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis (instance D), 2026-11-18, round 3.

import { rng, round2, clamp, nightsOf, addDays } from '../sim/util.js';
import { SEASON } from '../sim/booking.js';
import { taxRow } from '../sim/legal.js';
import { irs } from '../sim/legal.js';
import { bookingsList } from '../sim/store.js';
import { costLines, blankLines, LINE_KEYS, linesTotal, documentedDefault, normalise, defaults, yieldOf } from '../sim/assumptions.js';

export const HISTORY_END = '2026-11-16';
export const SESSION_FROM = '2026-11-17';
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
// Guests aged 16 or over per stay, used only by the history's tourist tax (round 4, PROPOSAL.md 3.5;
// INVENTED). Round 3 counted round(sleeps x 0.6), so a flat for two paid for one guest.
export const HISTORY_GUESTS = Object.freeze({ lagoon: 2, salt: 3, harbour: 3, cape: 3, hill: 4 });
export const HISTORY_GUESTS_WORDS = 'The history assumes Lagoon 2, Salt 3, Harbour 3, Cape 3, Hill 4 guests aged 16 or over per stay';
const blank = () => ({ revenue: 0, vat: 0, commission: 0, cleaning: 0, supplies: 0, running: 0, touristTax: 0, nights: 0 });
const addInto = (a, b) => { for (const k of Object.keys(a)) a[k] = round2(a[k] + (b[k] || 0)); return a; };

// One home, one month of the seeded history (positive amounts; costs are subtracted later).
export function historyMonth(S, homeId, m) {
  const h = S.homes[homeId]; if (!h || m > 11) return blank();
  const days = m === 11 ? 16 : DIM[m - 1];
  const r = rng(`${S.seed}|history|${homeId}|${m}`);
  const s = SEASON[m];
  const occ = clamp(0.16 + 0.55 * (s - 0.8) / 0.9 + (r() - 0.5) * 0.14, 0.06, 0.94);
  const nights = Math.round(days * occ);
  const stayLen = h.sleeps >= 6 ? 4.5 : h.sleeps <= 2 ? 3 : 4;
  const stays = nights ? Math.max(1, Math.round(nights / stayLen)) : 0;
  const listBase = h.rate.listBase || h.rate.base;
  const revenue = round2(nights * listBase * s * (1.03 + r() * 0.05) + stays * h.rate.cleaningFee);
  const vat = S.settings.vatExempt53 ? 0 : round2(revenue - revenue / 1.06);
  const commission = round2(revenue * 0.4 * S.settings.platformCommission);
  const cleaning = stays * (S.settings.cleaningCost + S.settings.laundryCost);
  const supplies = round2(stays * (9 + r() * 6));
  const running = round2((S.settings.utilitiesMonthly + S.settings.insuranceMonthly) * days / DIM[m - 1] + (r() < 0.3 ? 40 + r() * 180 : 0));
  // Tourist tax (passed on): guests aged 16+ (invented: about 60 percent of beds) per night, up to the cap per stay.
  const row = taxRow(h.municipality, `2026-${String(m).padStart(2, '0')}-15`);
  const touristTax = row ? round2(stays * (HISTORY_GUESTS[homeId] ?? Math.round(h.sleeps * 0.6)) * Math.min(stayLen, row.cap) * row.eur) : 0;
  return { revenue, vat, commission, cleaning, supplies, running, touristTax, nights };
}

// The session's ledger as the same lines, by home and month (from 17 November).
export function sessionLines(S, { homeId = null, month = null, to = null } = {}) {
  const out = blank();
  for (const e of S.ledger) {
    if (homeId && e.homeId !== homeId) continue;
    if (month && Number(e.date.slice(5, 7)) !== month) continue;
    if (to && e.date > to) continue;
    const a = Number(e.amount) || 0;
    if (e.kind === 'income' || e.kind === 'refund') out.revenue += a;
    else if (e.kind === 'vat') out.vat -= a;
    else if (e.kind === 'commission') out.commission -= a;
    else if (e.kind === 'cleaning' || e.kind === 'laundry') out.cleaning -= a;
    else if (e.kind === 'supplies') out.supplies -= a;
    else if (['utilities', 'insurance', 'repairs'].includes(e.kind)) out.running -= a;
    else if (e.kind === 'tourist-tax') out.touristTax += a;
  }
  for (const b of bookingsList(S)) {
    if (homeId && b.homeId !== homeId) continue;
    if (!['paid', 'checked-in', 'checked-out'].includes(b.status)) continue;
    out.nights += nightsOf(b.from, b.to).filter(d => (!month || Number(d.slice(5, 7)) === month) && (!to || d <= to) && d.startsWith('2026')).length;
  }
  for (const k of Object.keys(out)) out[k] = round2(out[k]);
  return out;
}

// The number of days of a period (PROPOSAL.md 3.2): year to date is 1 January to `to`; a month is
// its days up to `to` (0 for a month after it).
export function periodDays({ month = null, to = '2026-12-31' } = {}) {
  const tm = Number(String(to).slice(5, 7)), td = Number(String(to).slice(8, 10));
  if (!month) return DIM.slice(0, tm - 1).reduce((a, b) => a + b, 0) + td;
  return month < tm ? DIM[month - 1] : month === tm ? td : 0;
}
// lines(S, { homeId, month, to, assumptions }) -> history + session for one home (or all) and one
// month (or year to date), with the owner's cost assumptions (sim/assumptions.js; the decided
// defaults when none are given) as lines of their own.
export function lines(S, { homeId = null, month = null, to = '2026-12-31', assumptions = null } = {}) {
  const ids = homeId ? [homeId] : S.homeOrder;
  const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1);
  const a = assumptions ? normalise(assumptions) : defaults();
  const days = periodDays({ month, to });
  const t = blank(), extra = blankLines();
  // The yields count only homes with a house value (review S6): their revenue, profit and value.
  const y = { net: 0, profit: 0, value: 0, homes: 0 };
  for (const id of ids) {
    const one = blank();
    for (const m of months) if (m <= 11) addInto(one, historyMonth(S, id, m));
    addInto(one, sessionLines(S, { homeId: id, month, to }));
    const net = round2(one.revenue - one.vat);
    const l = costLines(a, id, days, net);
    for (const k of LINE_KEYS) extra[k] = round2(extra[k] + l[k]);
    const value = a.homes[id]?.houseValue || 0;
    if (value > 0) { y.net += net; y.profit += net - (one.commission + one.cleaning + one.supplies + one.running) - linesTotal(l); y.value += value; y.homes++; }
    addInto(t, one);
  }
  // Session lines without a home (none today) still count in the total.
  if (!homeId) { const all = sessionLines(S, { month, to }), per = blank(); for (const id of ids) addInto(per, sessionLines(S, { homeId: id, month, to })); for (const k of Object.keys(t)) t[k] = round2(t[k] + (all[k] - per[k])); }
  t.extra = extra;
  t.days = days;
  t.houseValue = y.value;
  t.valuedHomes = y.homes; t.homesCount = ids.length;
  t.yieldNet = round2(y.net); t.yieldProfit = round2(y.profit);
  return finish(t, S.settings, a);
}
export function finish(t, settings, assumptions = null) {
  const a = assumptions ? normalise(assumptions) : defaults();
  if (!t.extra) t.extra = blankLines();
  t.costs = round2(t.commission + t.cleaning + t.supplies + t.running);      // the round 3 spending
  t.extraTotal = linesTotal(t.extra);
  t.netRevenue = round2(t.revenue - t.vat);
  t.profit = round2(t.netRevenue - t.costs - t.extraTotal);
  t.documentedDefault = documentedDefault(t.costs, t.extra);
  t.documented = Number.isFinite(a.business.documented) ? a.business.documented : t.documentedDefault;
  t.irs = irs({ gross: Math.max(0, t.netRevenue), coef: settings.irsCoef, startYear: settings.irsStartYear, expenses: t.documented, marginalRate: settings.marginalRate });
  if (t.days && t.houseValue !== undefined) { t.grossYield = yieldOf(t.yieldNet ?? t.netRevenue, t.days, t.houseValue); t.netYield = yieldOf(t.yieldProfit ?? t.profit, t.days, t.houseValue); }
  return t;
}
// The months that have figures up to the simulated today (1..12).
export const monthsTo = today => Array.from({ length: Number(today.slice(5, 7)) }, (_, i) => i + 1);
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export { addDays };
