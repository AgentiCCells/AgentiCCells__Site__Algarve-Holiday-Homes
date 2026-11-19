// sim/assumptions.js: the owner's cost assumptions behind the profit and loss of the Cinco Chaminés
// simulation (a made-up example), round 4 (team/rounds/4/design/PROPOSAL.md 3.1 to 3.3; defaults as
// the conductor decided on 19 November 2026, about 04:45 UTC, from team/rounds/4/research/PNL-DEFAULTS.md,
// read 19 November 2026). Every value is an ASSUMPTION the owner can change, or INVENTED (part of the
// made-up business); none is a fact about a real house. Kept in this browser only, in
// localStorage["cc.assumptions.v1"], read and written inside try and catch; Reset clears it. Nothing
// is sent. Simulated figures for an invented business: not legal, tax or financial advice.
// Pure functions plus the storage helpers; no DOM, no network. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 4.

import { fnv1a } from '../availability.js';
import { round2 } from './util.js';

export const KEY = 'cc.assumptions.v1';
export const HOME_IDS = Object.freeze(['salt', 'lagoon', 'hill', 'harbour', 'cape']);
// Invented house values and IMI amounts (PROPOSAL.md 3.1).
const VALUE = { salt: 320000, lagoon: 210000, hill: 560000, harbour: 340000, cape: 390000 };
const IMI = { salt: 520, lagoon: 340, hill: 900, harbour: 550, cape: 630 };
const home = id => ({ houseValue: VALUE[id], managementPct: 20, reservePct: 1.0, imiYear: IMI[id], depreciation: true, buildingShare: 75, years: 50, mortgage: false, loan: null, interestPct: 3.2 });
export const DEFAULTS = Object.freeze({ v: 1, homes: Object.freeze(Object.fromEntries(HOME_IDS.map(id => [id, Object.freeze(home(id))]))), business: Object.freeze({ accountantMonth: 80, aimiYear: 0 }) });
// The six costs that live in the simulation's settings (round 3) and change the margin too
// (review re-check, item 2): the fingerprint hashes them with the assumptions document.
export const SETTING_COSTS = Object.freeze(['cleaningCost', 'laundryCost', 'utilitiesMonthly', 'insuranceMonthly', 'platformCommission', 'marginalRate']);
export const DEFAULT_SETTING_COSTS = Object.freeze({ cleaningCost: 40, laundryCost: 18, utilitiesMonthly: 90, insuranceMonthly: 35, platformCommission: 0.15, marginalRate: 0.3 });

// Where each default comes from: the badge and the note the "source" link opens. Sources by type, the
// date read and how sure, as PNL-DEFAULTS.md gives them; no web address of a commercial source.
export const SOURCES = Object.freeze({
  houseValue: { badge: 'invented', note: 'Invented values for invented houses. Plausibility: the Algarve median bank valuation was about EUR 2,988 per square metre in June 2026 (INE, as reported in the press; read 19 November 2026; how sure: low to medium). Type what your house would sell for.' },
  managementPct: { badge: 'assumption', note: 'Range found: 15% to 30% of rental income (full service 20% to 30%; one guide 20% to 40%). Sources: a property-management software vendor\'s guides and a buyer\'s agent\'s guide (commercial); read 19 November 2026; how sure: low. A full-service manager at 25% to 30% often includes cleaning and laundry; if yours does, set those to 0 so they are not counted twice.' },
  reservePct: { badge: 'assumption', note: '"1% a year is a common rule of thumb, more by the sea": a consumer finance site, 14 September 2026; read 19 November 2026; how sure: medium. Money set aside for repairs and replacements: set aside, not spent; not a tax expense. The simulation\'s own repairs are on top.' },
  imiYear: { badge: 'invented', note: 'IMI = your house\'s tax value (VPT, on your IMI bill) x the municipal rate; 0.30% in all five towns for 2026, from the press (how sure: medium); the range 0.3% to 0.45% is set by the Código do IMI, article 112 (Portal das Finanças, read 19 November 2026; how sure: high). Check your own bill. These amounts are invented.' },
  aimiYear: { badge: 'assumption', note: 'Due only if your houses\' tax values add up to more than EUR 600,000 per person (Código do IMI, articles 135-B, 135-C and 135-F, Portal das Finanças, read 19 November 2026; how sure: high). Whether it applies depends on who owns the homes (one person, a couple taxed jointly, or a company), which this made-up example leaves open.' },
  accountantMonth: { badge: 'assumption', note: 'EUR 30 to 150 a month for a holiday let without organised accounts, in a services marketplace\'s price guide (commercial; read 19 November 2026; how sure: low). The professional body publishes no fee scale. Ask for quotes.' },
  depreciation: { badge: 'assumption', note: 'Spreads the building\'s cost over its life: an accounting view of wear, not a tax figure here.' },
  buildingShare: { badge: 'assumption', note: 'When the deed does not split land and building, land is taken as 25% of the total (Decreto Regulamentar 25/2009, article 10, Portal das Finanças, read 19 November 2026; how sure: high). The land does not wear out; only the building is spread.' },
  years: { badge: 'assumption', note: '50 years is the residential tax life (2% a year; a legal-texts site, read 19 November 2026; how sure: medium); an accountant may use 20 to 40 years for a holiday let (a professional body\'s answer; how sure: medium).' },
  mortgage: { badge: 'assumption', note: 'What a loan costs you. Only the interest is a cost; repaying the loan is not. You can have both this and depreciation.' },
  loan: { badge: 'assumption', note: 'Default 60% of the house value. Banks are limited to 80% of the value for a loan that is not for a permanent home (Banco de Portugal recommendation, as reported in the press; read 19 November 2026; how sure: medium).' },
  interestPct: { badge: 'assumption', note: 'National average on housing loans, September 2026: 3.194% (INE, as reported by a comparison site and a personal-finance site; read 19 November 2026; how sure: medium). Yours depends on your spread.' },
  cleaningCost: { badge: 'invented', note: 'Invented, as in round 3; cleaning and laundry together EUR 45 to 69 a turnover in what the research saw (a review site and a holiday-rental listing; read 19 November 2026; how sure: low).' },
  laundryCost: { badge: 'invented', note: 'Invented, as in round 3; cleaning and laundry together EUR 45 to 69 a turnover in what the research saw (how sure: low).' },
  utilitiesMonthly: { badge: 'invented', note: 'Invented: no public figure found (read 19 November 2026; how sure: unknown).' },
  insuranceMonthly: { badge: 'invented', note: 'Multi-risk insurance with civil liability is mandatory (LEGAL-PT.md section 1, how sure: high); the amount is invented: no public Portuguese price found (read 19 November 2026; how sure: unknown).' },
  platformCommission: { badge: 'assumption', note: 'About 15%, from 10% to 25%. Sources, by type only: one booking platform\'s own help page on host fees (read 19 November 2026; how sure: high for that platform\'s own fee) and management-software vendors\' and agencies\' guides on another platform (how sure: low). Direct bookings pay none.' },
  marginalRate: { badge: 'assumption', note: '30.6% applies to taxable income between EUR 23,089 and 29,397 (Código do IRS, article 68, as on the Portal das Finanças on 19 November 2026; how sure: high for the table). Your IRS bracket.' },
  documented: { badge: 'assumption', note: 'The default counts the simulated spending only (cleaning, laundry, consumables, utilities, insurance, repairs, platform fees, management, accountant, IMI, AIMI and mortgage interest), not the maintenance reserve (set aside, not spent) or depreciation (no invoice). Which costs count is for your accountant.' },
});
export const FOOT = 'Ranges and sources: team research of 19 November 2026. Not legal, tax or financial advice.';

const num = (v, d, lo = 0, hi = 1e9) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
// normalise(doc) -> a full assumptions document: every field there, numbers in range, else the default.
export function normalise(doc) {
  const out = { v: 1, homes: {}, business: {} };
  for (const id of HOME_IDS) {
    const d = DEFAULTS.homes[id], x = doc?.homes?.[id] || {};
    out.homes[id] = {
      houseValue: num(x.houseValue, d.houseValue), managementPct: num(x.managementPct, d.managementPct, 0, 100), reservePct: num(x.reservePct, d.reservePct, 0, 20),
      imiYear: num(x.imiYear, d.imiYear), depreciation: typeof x.depreciation === 'boolean' ? x.depreciation : d.depreciation,
      buildingShare: num(x.buildingShare, d.buildingShare, 0, 100), years: num(x.years, d.years, 1, 200),
      mortgage: typeof x.mortgage === 'boolean' ? x.mortgage : d.mortgage, loan: x.loan === null || x.loan === undefined || x.loan === '' ? null : num(x.loan, null),
      interestPct: num(x.interestPct, d.interestPct, 0, 30),
    };
  }
  const b = doc?.business || {};
  out.business = { accountantMonth: num(b.accountantMonth, DEFAULTS.business.accountantMonth), aimiYear: num(b.aimiYear, DEFAULTS.business.aimiYear) };
  if (b.documented !== undefined && b.documented !== null && b.documented !== '') out.business.documented = num(b.documented, undefined);
  return out;
}
export const defaults = () => normalise(DEFAULTS);
const ls = storage => (storage === undefined ? (() => { try { return globalThis.localStorage || null; } catch { return null; } })() : storage);
// read(storage) -> { doc, kept: true | false | null } (null: storage blocked; defaults used, said on the page).
export function read(storage) {
  const s = ls(storage);
  if (!s) return { doc: defaults(), kept: null };
  try { const t = s.getItem(KEY); return { doc: t ? normalise(JSON.parse(t)) : defaults(), kept: Boolean(t) }; } catch { return { doc: defaults(), kept: null }; }
}
export function write(doc, storage) {
  const s = ls(storage); if (!s) return false;
  try { s.setItem(KEY, JSON.stringify(normalise(doc))); return true; } catch { return false; }
}
export function clear(storage) { const s = ls(storage); try { s?.removeItem(KEY); return true; } catch { return false; } }
// set(doc, path, value) -> a new document with one field changed ('homes.salt.houseValue', 'business.accountantMonth').
export function set(doc, path, value) {
  const d = normalise(doc), [a, b, c] = String(path).split('.');
  if (a === 'homes' && d.homes[b] && c) d.homes[b][c] = value;
  else if (a === 'business' && b) d.business[b] = value;
  return normalise(d);
}
// runItMyself(doc) -> management 0 percent for all five homes (conductor's answer 2).
export const runItMyself = doc => { const d = normalise(doc); for (const id of HOME_IDS) d.homes[id].managementPct = 0; return d; };

// ---------- the formulas (PROPOSAL.md 3.2) ----------
export const loanOf = h => (h.loan === null || h.loan === undefined ? round2(h.houseValue * 0.6) : h.loan);
// costLines(doc, homeId, days, revenueNet) -> the time costs of one home for a period of `days` days.
export function costLines(doc, homeId, days, revenueNet) {
  const a = normalise(doc), h = a.homes[homeId], b = a.business;
  if (!h) return blankLines();
  const y = days / 365;
  return {
    management: round2((h.managementPct / 100) * Math.max(0, revenueNet)),
    reserve: round2(h.houseValue * (h.reservePct / 100) * y),
    imi: round2(h.imiYear * y),
    aimi: round2((b.aimiYear * y) / HOME_IDS.length),
    accountant: round2((b.accountantMonth * 12 * y) / HOME_IDS.length),
    depreciation: h.depreciation ? round2(((h.houseValue * (h.buildingShare / 100)) / h.years) * y) : 0,
    interest: h.mortgage ? round2(loanOf(h) * (h.interestPct / 100) * y) : 0,
  };
}
export const blankLines = () => ({ management: 0, reserve: 0, imi: 0, aimi: 0, accountant: 0, depreciation: 0, interest: 0 });
export const LINE_KEYS = Object.freeze(['management', 'reserve', 'imi', 'aimi', 'accountant', 'depreciation', 'interest']);
export const linesTotal = l => round2(LINE_KEYS.reduce((t, k) => t + (l[k] || 0), 0));
// The default "documented expenses" for the IRS 15% rule: simulated spending only (review must 4).
// spending = the round 3 costs (platform fees, cleaning and laundry, consumables, utilities, insurance, repairs).
export const documentedDefault = (spending, l) => round2(spending + l.management + l.accountant + l.imi + l.aimi + l.interest);
export const houseValueOf = (doc, ids = HOME_IDS) => { const a = normalise(doc); return ids.reduce((t, id) => t + (a.homes[id]?.houseValue || 0), 0); };
// yieldOf(amountToDate, days, value) -> a year's yield (0..1) or null when there is no value to divide by.
export const yieldOf = (amount, days, value) => (value > 0 && days > 0 ? (amount * 365) / days / value : null);

// ---------- the fingerprint (PROPOSAL.md 4.2; review re-check item 2) ----------
const sortKeys = v => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v);
export function settingCosts(settings = {}) { return Object.fromEntries(SETTING_COSTS.map(k => [k, Number(settings?.[k] ?? DEFAULT_SETTING_COSTS[k])])); }
// fingerprint(doc, settings) -> a short hash of the assumptions document and the six cost settings.
export function fingerprint(doc, settings) {
  return fnv1a(JSON.stringify(sortKeys({ assumptions: normalise(doc), settings: settingCosts(settings) }))).toString(36);
}
export const DEFAULT_FINGERPRINT = fingerprint(DEFAULTS, DEFAULT_SETTING_COSTS);
export const costsWord = fp => (fp === DEFAULT_FINGERPRINT ? 'default costs' : 'your costs');
