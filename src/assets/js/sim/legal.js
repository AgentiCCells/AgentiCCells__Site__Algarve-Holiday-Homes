// sim/legal.js: the Portuguese rules for a holiday rental (Alojamento Local) as formulas, for
// the simulated admin of Cinco Chaminés (a made-up example). From
// team/rounds/2/research/LEGAL-PT.md (researcher, 18 November 2026), sections 2 and 3.
// SIMULATION FOR AN INVENTED BUSINESS. NOT LEGAL OR TAX ADVICE: rules change and depend on each
// owner's situation; check with a qualified professional and the official text.
// Every result carries { simulated: true, advice: 'not legal or tax advice', sources: [...] }.
// Pure functions, no DOM, no network. Code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance C), 2026-11-18, round 3.

import { nightsOf, month, addDays, weekday, round2 } from './util.js';

export const CHECKED = '2026-11-18';
export const ADVICE = 'not legal or tax advice';
export const NOTE = 'Simulation for an invented business. Not legal or tax advice; check with a professional.';

export const SOURCES = Object.freeze({
  regime: 'https://business.turismodeportugal.pt/pt/Planear_Iniciar/Como_comecar/Alojamento_Local/Paginas/alteracao-regime-juridico-alojamento-local.aspx',
  dl76: 'https://diariodarepublica.pt/dr/detalhe/decreto-lei/76-2024-892301177',
  rnal: 'https://rnt.turismodeportugal.pt/RNAL/',
  vatRate: 'https://www.e-konomista.pt/alojamento-local-impostos/',
  vat53: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/Pages/artigo-53-o-do-civa.aspx',
  irs31: 'https://informador.pt/legislacao/lexit/codigos/direito-fiscal/codigo-do-irs/capitulo-ii-determinacao-do-rendimento-coletavel/seccao-iii-rendimentos-empresariais/artigo-31-o-regime-simplificado/',
  faro: 'https://www.barlavento.pt/faro-introduz-novas-regras-e-excecoes-na-taxa-municipal-turistica/',
  faroGuide: 'https://www.eazyal.com/pt/blog/taxa-turistica-faro-algarve-guia',
  loule: 'https://postal.pt/algarve/loule-ja-esta-a-cobrar-taxa-turistica-ate-dois-euros-por-dia/',
  louleReg: 'https://vlex.pt/vid/regulamento-n-786-2024-1043962835',
  tavira: 'https://www.eazyal.com/blog/tavira-tourist-tax-2026',
  lagos: 'https://www.cmjornal.pt/portugal/detalhe/taxa-turistica-podera-chegar-aos-15-milhoes-em-lagos',
  vilaDoBispo: 'https://cm-viladobispo.pt',
  complaints: 'https://www.livroreclamacoes.pt',
});
const meta = sources => ({ simulated: true, advice: ADVICE, disclaimer: NOTE, checked: CHECKED, sources });

// ---------- municipality ids ----------
export function municipalityId(name) {
  return String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '-');
}

// ---------- 2.3 / 3.1 municipal tourist tax ----------
// Rates as data (LEGAL-PT.md 3.1). Faro's 7-night cap is from guides only (sure: low).
export const TOURIST_TAX = Object.freeze([
  { municipality: 'faro', from: '2024-11-01', months: [3, 4, 5, 6, 7, 8, 9, 10], eur: 2, cap: 7, min_age: 16, source: 'Regulamento 1207/2024', sure: 'high; cap low', urls: [SOURCES.faro, SOURCES.faroGuide] },
  { municipality: 'faro', from: '2024-11-01', months: [11, 12, 1, 2], eur: 1, cap: 7, min_age: 16, source: 'Regulamento 1207/2024', sure: 'high; cap low', urls: [SOURCES.faro, SOURCES.faroGuide] },
  { municipality: 'loule', from: '2024-11-01', months: [4, 5, 6, 7, 8, 9, 10], eur: 2, cap: 5, min_age: 16, source: 'Regulamento 786/2024', sure: 'high', urls: [SOURCES.loule, SOURCES.louleReg] },
  { municipality: 'loule', from: '2024-11-01', months: [11, 12, 1, 2, 3], eur: 1, cap: 5, min_age: 16, source: 'Regulamento 786/2024', sure: 'high', urls: [SOURCES.loule, SOURCES.louleReg] },
]);
export const NO_TAX = Object.freeze({
  tavira: { note: `none found as of ${CHECKED}`, urls: [SOURCES.tavira] },
  lagos: { note: `none found as of ${CHECKED}`, urls: [SOURCES.lagos] },
  'vila-do-bispo': { note: `none found as of ${CHECKED}`, urls: [SOURCES.vilaDoBispo] },
});

// rate(m, d) -> the row in force for municipality m on date d, or null (no tax found).
export function taxRow(municipality, day) {
  const m = municipalityId(municipality);
  return TOURIST_TAX.filter(r => r.municipality === m && day >= r.from && r.months.includes(month(day)))
    .sort((a, b) => b.from.localeCompare(a.from))[0] || null;
}

// Guests: a number (all aged 16 or over) or { adults, children: [ages], exempt: n }.
export function normaliseGuests(g) {
  if (typeof g === 'number' || typeof g === 'string') { const n = Math.max(0, Math.floor(Number(g) || 0)); return { adults: n, children: [], exempt: 0, total: n }; }
  const adults = Math.max(0, Math.floor(Number(g?.adults) || 0));
  const children = Array.isArray(g?.children) ? g.children.map(Number).filter(Number.isFinite) : [];
  const exempt = Math.max(0, Math.floor(Number(g?.exempt) || 0));
  return { adults, children, exempt, total: adults + children.length };
}

// touristTax({ municipality, from, to, guests }) -> { amount, perNight, payingGuests, taxedNights, cap, note, row, ...meta }
export function touristTax({ municipality, from, to, guests }) {
  const m = municipalityId(municipality);
  const g = normaliseGuests(guests);
  const nights = nightsOf(from, to);
  if (NO_TAX[m]) return { amount: 0, perNight: [], payingGuests: 0, taxedNights: 0, cap: 0, municipality: m, note: `No municipal tourist tax ${NO_TAX[m].note}; check with the câmara.`, ...meta(NO_TAX[m].urls) };
  const rows = nights.map(d => taxRow(m, d));
  if (!rows.some(Boolean)) return { amount: 0, perNight: [], payingGuests: 0, taxedNights: 0, cap: 0, municipality: m, note: `No tourist tax rule known for "${municipality}" in this simulation.`, ...meta([]) };
  const row = rows.find(Boolean);
  const minAge = row.min_age;
  const payingGuests = Math.max(0, g.adults + g.children.filter(a => a >= minAge).length - g.exempt);
  const cap = row.cap;
  const taxed = nights.slice(0, cap);
  const perNight = taxed.map(d => { const r = taxRow(m, d); return { date: d, eur: r ? r.eur : 0 }; });
  const amount = round2(payingGuests * perNight.reduce((s, n) => s + n.eur, 0));
  return { amount, perNight, payingGuests, taxedNights: taxed.length, cap, municipality: m, row: { source: row.source, sure: row.sure },
    note: `${payingGuests} guest(s) aged ${minAge}+ x ${taxed.length} night(s) (cap ${cap}). Collected for the municipality and passed on: never revenue, never cost.`, ...meta(row.urls) };
}

// ---------- 2.1 / 3.2 VAT ----------
export const VAT_RATE = 0.06;
export const VAT53_LIMIT = 15000;
export const VAT53_AT_ONCE = 18750;
// vat(price, { exempt53 }) -> { price, net, vat, rate, ...meta }. price includes VAT (and excludes the tourist tax).
export function vat(price, { exempt53 = false } = {}) {
  const p = round2(price);
  if (exempt53) return { price: p, net: p, vat: 0, rate: 0, exempt53: true, ...meta([SOURCES.vat53]) };
  const net = round2(p / (1 + VAT_RATE));
  return { price: p, net, vat: round2(p - net), rate: VAT_RATE, exempt53: false, ...meta([SOURCES.vatRate]) };
}
// The article 53 check over a year's turnover: a warning, never a silent switch.
export function vat53Check(turnoverYear) {
  const t = round2(turnoverYear);
  let status = 'within', warning = null;
  if (t > VAT53_AT_ONCE) { status = 'ends-now'; warning = `Turnover ${t} is above ${VAT53_AT_ONCE} (the limit plus 25 percent): the article 53 exemption would end at once (medium: check the date rule).`; }
  else if (t > VAT53_LIMIT) { status = 'ends-next-year'; warning = `Turnover ${t} is above ${VAT53_LIMIT}: the article 53 exemption would end from the next year.`; }
  return { turnover: t, limit: VAT53_LIMIT, status, warning, ...meta([SOURCES.vat53]) };
}

// ---------- 2.2 / 3.3 IRS, simplified regime ----------
export const IRS_COEF = Object.freeze({ house: 0.35, contention: 0.5, rooms: 0.15 });
// irs({ gross, coef, startYear: 0|1|2, expenses, marginalRate }) -> { taxable, shortfall, irs, ...meta }
export function irs({ gross = 0, coef = 0.35, startYear = 0, expenses = 0, marginalRate = 0.3 } = {}) {
  const g = round2(gross);
  const factor = startYear === 1 ? 0.5 : startYear === 2 ? 0.75 : 1;
  let taxable = g * coef * factor;
  let shortfall = 0;
  if (coef === 0.35) { shortfall = Math.max(0, 0.15 * g - expenses); taxable += shortfall; }
  return { gross: g, coef, startYearFactor: factor, shortfall: round2(shortfall), taxable: round2(taxable), marginalRate, irs: round2(taxable * marginalRate),
    assumption: 'marginalRate is an assumption: your IRS bracket',
    caveat: 'IRS is assessed on all your income for the year at progressive rates; this is a rough share for the holiday homes only.', ...meta([SOURCES.irs31]) };
}

// ---------- guest registration (foreign guests): within 3 working days ----------
// Portuguese national holidays near the simulation window (fixed dates; movable ones for 2026 and 2027).
export const PT_HOLIDAYS = Object.freeze(['2026-04-03', '2026-04-05', '2026-06-04', '2026-10-05', '2026-11-01', '2026-12-01', '2026-12-08', '2026-12-25', '2027-01-01', '2027-03-26', '2027-03-28', '2027-04-25', '2027-05-01']);
export function addWorkingDays(day, n, holidays = PT_HOLIDAYS) {
  let d = day, left = n;
  while (left > 0) { d = addDays(d, 1); const w = weekday(d); if (w !== 0 && w !== 6 && !holidays.includes(d)) left--; }
  return d;
}
// registrationDuty(booking, guest) -> a checklist item for one booking.
export function registrationDuty(booking, guest = {}) {
  const foreign = String(guest.country || 'XX').toUpperCase() !== 'PT';
  const due = addWorkingDays(booking.from, 3);
  return { id: `reg-${booking.id}`, bookingId: booking.id, applies: foreign, due, done: Boolean(booking.registeredAt), doneAt: booking.registeredAt || null,
    label: foreign ? `Send the accommodation bulletin (SIBA) for each foreign guest by ${due} (3 working days from arrival), and record the departure.` : 'Portuguese guests are not reported through SIBA.',
    rule: 'Lei 23/2007, article 16 (3 working days: high; which body runs SIBA today: low)', ...meta([]) };
}

// ---------- the legality checklist per home (LEGAL-PT.md section 4) ----------
export function checklist(home, { bookings = [], guests = {}, now } = {}) {
  const m = municipalityId(home.municipality);
  const tax = NO_TAX[m] ? `No municipal tourist tax ${NO_TAX[m].note}; check with the câmara.` : `Municipal tourist tax applies (${m === 'faro' ? 'EUR 2 March to October, EUR 1 otherwise, 16+, cap 7 nights (cap: low)' : 'EUR 2 April to October, EUR 1 otherwise, 16+, cap 5 nights'}).`;
  const duties = bookings.filter(b => b.homeId === home.id && ['paid', 'checked-in', 'checked-out'].includes(b.status)).map(b => registrationDuty(b, guests[b.guestId]));
  const pending = duties.filter(d => d.applies && !d.done);
  const late = now ? pending.filter(d => d.due < String(now).slice(0, 10)) : [];
  return {
    homeId: home.id,
    items: [
      { id: 'rnal', label: `RNAL number shown in every advert: RNAL 00000/AL (demonstration, fake)`, ok: true, source: SOURCES.rnal },
      { id: 'insurance', label: 'Multi-risk insurance with civil liability, valid (simulated date: 2027-06-30)', ok: true, source: SOURCES.regime },
      { id: 'safety', label: 'Fire extinguisher, fire blanket, first-aid kit, 112 notice', ok: true, source: SOURCES.dl76 },
      { id: 'complaints', label: 'Complaints book, paper and electronic', ok: true, source: SOURCES.complaints },
      { id: 'capacity', label: `Capacity within limits (sleeps ${home.sleeps}; at most 30 guests and 9 bedrooms)`, ok: (home.sleeps || 0) <= 30, source: SOURCES.dl76 },
      { id: 'condominium', label: 'Condominium: no authorisation needed since November 2024; opposition resolutions recorded: none', ok: true, source: SOURCES.regime },
      { id: 'tourist-tax', label: tax, ok: true, source: NO_TAX[m] ? NO_TAX[m].urls[0] : (m === 'faro' ? SOURCES.faro : SOURCES.loule) },
      { id: 'municipal-rules', label: `Municipal AL regulation or contention area for ${home.municipality}: none found as of ${CHECKED} (unknown: check the câmara)`, ok: null, source: null },
      { id: 'registration', label: `Guest bulletins: ${pending.length} pending, ${late.length} late`, ok: late.length === 0, source: null },
    ],
    duties, ...meta(Object.values(SOURCES)),
  };
}
