// kit.js: the helpers the five designs under /d/ share (Revista, Azulejo, Linho, Costa, Postal) for
// the made-up example site Cinco Chaminés. Each design folder holds an identical copy, so a design
// can be moved or removed on its own. It reads the same modules as the main home page
// (/assets/js/data.js, /assets/js/availability.js) and keeps nothing: the chosen dates go in the
// page address and this tab only, through data.js. GETs only, to data.promptugal.news and this site.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18, round 2.
// Code Apache-2.0.
import * as D from '/assets/js/data.js';
import { isFree, firstTaken, nights, price } from '/assets/js/availability.js';

export { D };
export const T = D.today();
export const esc = D.esc;
export const FAIL = "IPMA's figures could not be read just now";
export const FAIL_EVENTS = 'The town agendas could not be read just now';
export const SOURCES_IPMA = ['ipma-city-forecasts', 'ipma-sea', 'ipma-uv', 'ipma-warnings'];

// ---------- pictures (AI-generated, of invented houses) ----------
export const CAPTION = {
  house: 'AI-generated picture of an invented house, not a photograph.',
  inside: 'AI-generated picture inside an invented house, not a photograph.',
  joke: 'AI-generated joke picture of an invented house, not a photograph.',
  place: 'AI-generated picture of the Algarve, not a photograph.',
};
// Alt text from team/rounds/2/design/IMAGES.md (the designer's proposal); homes.json wins when it has its own.
const ALT = {
  'salt-hero': 'AI-generated picture of the invented Salt House: a low white house with blue trim and one lattice chimney beside pink salt pans at sunset, Tavira\'s old town behind.',
  'salt-inside': 'AI-generated picture of the Salt House roof terrace: two wooden chairs, a jug and a bowl of oranges, the salt pans and the river beyond.',
  'salt-funny': 'AI-generated joke picture: the invented Salt House sitting on top of a big heap of salt, flamingos in the pans around it.',
  'lagoon-hero': 'AI-generated picture of the invented Lagoon House: an old white building by the Ria Formosa with a small first-floor balcony and rowing boats at the quay.',
  'lagoon-inside': 'AI-generated picture of the Lagoon House bedroom: a white double bed, terracotta floor with a blue tile border, balcony doors open to the lagoon.',
  'lagoon-funny': 'AI-generated joke picture: the invented Lagoon House riding on a painted fishing boat in the lagoon, gulls around it.',
  'hill-hero': 'AI-generated picture of the invented Hill House: a white country house with a tiled roof, a stone-edged pool and a pergola among carob trees in the hills.',
  'hill-inside': 'AI-generated picture of the Hill House sitting room: a white fireplace, wooden beams, a long table with almonds and carob pods, the pool through the window.',
  'hill-funny': 'AI-generated joke picture: the invented Hill House built high in a huge carob tree, with a small pool on a branch and almond blossom below.',
  'harbour-hero': 'AI-generated picture of the invented Harbour House: a white town house with a blue cornice and a walled courtyard on a cobbled street, old walls and marina masts behind.',
  'harbour-inside': 'AI-generated picture of the Harbour House courtyard: a blue door, bougainvillea, a lemon tree in a pot and a tiled table with two coffees.',
  'harbour-funny': 'AI-generated joke picture: the invented Harbour House surfing a wave on a giant surfboard below golden cliffs.',
  'cape-hero': 'AI-generated picture of the invented Cape House: a long, low white house with thick walls on a windy clifftop, a surfboard by the outdoor shower, big Atlantic waves behind.',
  'cape-inside': 'AI-generated picture of the Cape House inside: a wood stove alight, two surfboards and wetsuits on a rack, a deep window onto the cliffs.',
  'cape-funny': 'AI-generated joke picture: the invented Cape House balanced on top of a tall sea stack, waves breaking round its foot.',
  'algarve-cliffs': 'AI-generated picture of golden limestone cliffs, sea arches and stacks above a turquoise sea at sunset.',
  'algarve-street': 'AI-generated picture of a quiet whitewashed street with blue and ochre trims, cobbles, bougainvillea and one lattice chimney.',
  'algarve-market': 'AI-generated picture of a market stall: crates of oranges, sacks of almonds, dried figs and carob pods.',
  'algarve-dawn': 'AI-generated picture of an empty beach at dawn, pink sky reflected in wet sand, cliffs to one side and a few seabirds.',
};
// The picture's file name for a home and a kind (hero, inside, funny); reads homes.json's images
// field in either of its likely shapes ("salt-hero" or { name, alt }), else the naming rule.
export function imgName(h, kind) {
  const v = h?.images?.[kind];
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && (v.name || v.file)) return String(v.name || v.file).replace(/-(800|1264|1600)\.jpg$/, '');
  return `${h.id}-${kind}`;
}
export function altFor(h, kind) {
  const v = h?.images?.[kind];
  if (v && typeof v === 'object' && v.alt) return v.alt;
  if (h?.images?.alt?.[kind]) return h.images.alt[kind];
  return ALT[imgName(h, kind)] || `AI-generated picture of the invented ${h?.name || 'house'}.`;
}
export const placeAlt = name => ALT[name] || 'AI-generated picture of the Algarve.';
// An <img> with the two sizes on the site (800 and 1264 px wide, 3:2).
export function picture(name, alt, { sizes = '100vw', eager = false, cls = '' } = {}) {
  const b = `/assets/img/${esc(name)}`;
  return `<img${cls ? ` class="${esc(cls)}"` : ''} src="${b}-800.jpg" srcset="${b}-800.jpg 800w, ${b}-1264.jpg 1264w" sizes="${esc(sizes)}" width="800" height="533" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

// ---------- the stay: dates, simulated availability, invented prices ----------
// stay() -> { from, to, chosen }: the visitor's dates, or example dates (two days on, three nights) when none are chosen.
export function stay() {
  const s = D.stayDates();
  if (s.from && s.to && s.from >= T) return { ...s, chosen: true };
  return { from: D.addDays(T, 2), to: D.addDays(T, 5), chosen: false };
}
// avail(h, s) -> { free, nights, total, first, text, link }
export function avail(h, s) {
  const free = isFree(h.id, s.from, s.to, T);
  const n = nights(s.from, s.to);
  const total = price(h.price_eur_invented, s.from, s.to);
  const first = free ? null : firstTaken(h.id, s.from, s.to, T);
  const text = free
    ? `Free for ${D.fmtDay(s.from)} to ${D.fmtDay(s.to)} (simulated): ${n} night${n === 1 ? '' : 's'}, EUR ${total} (invented)`
    : `Taken on some of these dates (simulated), from ${D.fmtDay(first || s.from)}`;
  return { free, nights: n, total, first, text, link: `/homes/${encodeURIComponent(h.id)}/${D.stayQuery(s)}` };
}
export const stayWords = s => `${D.fmtDay(s.from)} to ${D.fmtDay(s.to)}, ${nights(s.from, s.to)} night${nights(s.from, s.to) === 1 ? '' : 's'}${s.chosen ? '' : ' (example dates: choose your own)'}`;

// bindStay(form, onChange): a form with input[name=arrive], input[name=leave] and an output
// [data-msg]. On submit the dates go into the address and this tab (data.js) and onChange runs.
// The form has no action and no method: nothing is sent.
export function bindStay(form, onChange) {
  if (!form) return;
  const a = form.querySelector('[name=arrive]'), l = form.querySelector('[name=leave]'), msg = form.querySelector('[data-msg]');
  const s = stay();
  a.min = T; a.max = D.addDays(T, 364); l.min = D.addDays(T, 1); l.max = D.addDays(T, 365);
  a.value = s.from; l.value = s.to;
  a.addEventListener('change', () => { if (D.isDay(a.value)) { l.min = D.addDays(a.value, 1); if (!(l.value > a.value)) l.value = D.addDays(a.value, 3); } });
  const say = (t, bad) => { if (msg) { msg.textContent = t; msg.classList.toggle('bad', !!bad); } };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!D.isDay(a.value) || !D.isDay(l.value)) return say('Choose an arrive date and a leave date.', true);
    if (a.value < T) return say('The arrive date is in the past.', true);
    if (l.value <= a.value) return say('The leave date must be after the arrive date.', true);
    D.setStayDates(a.value, l.value);
    say(`Showing the five homes for ${D.fmtDay(a.value)} to ${D.fmtDay(l.value)}. Availability is simulated; prices are invented.`);
    onChange?.(stay());
  });
}

// ---------- live figures ----------
export const one = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? '?' : Number(v).toFixed(d).replace(/\.0$/, ''));
export const range = (a, b, unit) => `${one(a)} to ${one(b)}${unit ? ` ${unit}` : ''}`;
// live() -> { fc, sea, uv, wa, ev } for the strip: Faro today, the Faro coast, UV in Faro, warnings
// for IPMA's area FAR (the Faro district), and the three town agendas for the next seven days.
export async function live() {
  const [fc, sea, uv, wa, faro, lagos, tavira] = await Promise.all([
    D.forecastFor(1080500, T, D.addDays(T, 4)), D.seaFor(1080526), D.uvFor(1080500), D.warningsFor('FAR', T, D.addDays(T, 4)),
    D.eventsFor('faro', T, D.addDays(T, 7)), D.eventsFor('lagos', T, D.addDays(T, 7)), D.eventsFor('tavira', T, D.addDays(T, 7)),
  ]);
  return {
    fc, today: fc.days.find(d => d.date === T) || null,
    sea, seaDay: sea.days.find(d => d.date === T) || sea.days[0] || null,
    uv, uvDay: uv.days.find(d => d.date === T) || uv.days[0] || null,
    wa, ev: { faro, lagos, tavira },
  };
}
// Today's forecast for a home's IPMA place (its own figure in Costa, Linho and Postal).
export async function homeToday(h) {
  const f = await D.forecastFor(h.data?.forecast_id, T, T);
  return { ...f, day: f.days[0] || null };
}
// The source line beside a figure (data.js's, with publisher, file id, read time and age, stale and failure words).
export const src = (res, opts = { terms: false }) => D.sourceLine(res, opts);
// A plain failure note with a Try again button; bindRetry() wires every such button.
export const failNote = (words, ids) => `<p class="fail" role="status"><strong>${esc(words)}.</strong> No figure is shown in place of one that could not be read. <button type="button" class="retry" data-retry="${esc(ids.join(' '))}">Try again</button></p>`;
export function bindRetry(root, rerender) {
  root.addEventListener('click', e => {
    const b = e.target.closest('button[data-retry]');
    if (!b) return;
    for (const id of b.dataset.retry.split(/\s+/).filter(Boolean)) D.forget(id);
    b.disabled = true; b.textContent = 'Reading again...';
    rerender();
  });
}
// IPMA's terms, short, from the forecast card when it can be read.
export const ipmaTerms = res => res?.card?.terms?.summary || 'IPMA: free to copy and use for personal or public use if the use has no profit-making or offensive purpose; always name IPMA as the source.';
// A warning's words: level and type in English from the file, and its end time.
export const warnWords = w => `${w.level.charAt(0).toUpperCase() + w.level.slice(1)} warning: ${w.type}, Faro district, to ${D.fmtLocal(w.end || w.start)}`;
// "Wed 18 Nov" for today in Portugal, and the long form "Wednesday 18 November 2026" for a dateline.
export function dateline(ymd = T) {
  const d = new Date(`${ymd}T12:00:00Z`);
  try { return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d); }
  catch { return ymd; }
}
// The events a column shows: up to n, with date, name (linked), venue and the event's own source.
export function eventItems(items, n = 4) {
  return items.slice(0, n).map(e => `<li><span class="ev-d">${esc(evWhen(e))}</span> ${e.url ? `<a href="${esc(e.url)}">${esc(e.name)}</a>` : esc(e.name)}${e.venue ? `, <span class="ev-v">${esc(e.venue)}</span>` : ''} <span class="ev-s">(source: ${esc(e.source_name)})</span></li>`).join('');
}
// When an event happens, from the visitor's side: all week, on now (until its end), or its day.
function evWhen(e) {
  const s = String(e.start || '').slice(0, 10), en = String(e.end || '').slice(0, 10);
  if (e.through) return 'all week';
  if (s && s < T) return en ? `on now, until ${D.fmtDay(en)}` : 'on now';
  return D.fmtDay(s);
}
export const TOWN = { faro: 'Faro', lagos: 'Lagos', tavira: 'Tavira' };
// A short source line for a figure repeated in a card (the full line sits once in the section):
// holder, file id, read time and age, stale and failure words, and the source card.
export function shortSrc(res) {
  if (!res) return '';
  const holder = String(res.id).startsWith('ipma-') ? 'IPMA' : 'the town agendas';
  const u = res.urls || D.urls(res.id);
  const body = res.error ? `<strong>could not be read just now (${esc(res.error)})</strong>`
    : res.stale ? `<strong class="stale">read ${esc(D.fmtUTC(res.read_at))}, ${esc(D.ago(res.age_min))}; this may be out of date</strong>`
    : `read ${esc(D.fmtUTC(res.read_at))}, ${esc(D.ago(res.age_min))}`;
  return `<p class="src src-short${res.stale ? ' is-stale' : ''}${res.error ? ' is-error' : ''}">Source: ${holder} (<code>${esc(res.id)}</code>) via data.promptugal.news, ${body}. <a href="${esc(u.card)}">Source card</a></p>`;
}
