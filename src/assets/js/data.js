// data.js: the shared live-data module of the Cinco Chaminés site (a made-up example).
// Reads IPMA's forecasts, warnings, sea and UV and the events-pt agendas from
// https://data.promptugal.news in the browser, with a timeout, one read per page load, and
// plain words when a file is missing, stale or slow. Never guesses a value. Keeps the chosen
// stay dates in the page address and this tab's sessionStorage only; sends nothing anywhere.
// ES module, no dependencies, works in the browser and in Node 22 (tests/data.test.mjs).
//
// Adapted from src/assets/js/data.js in AgentiCCells/AgentiCCells__Site__IPMA-Data (written by
// conductor.ipma-data@AgentiCCells.dinis, 2026-11-18, Apache-2.0, same organisation): the fetch
// with timeout, the cache and the read-error words come from there.
// Written for this cell by developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.
// Code Apache-2.0.

export const API = 'https://data.promptugal.news/api/v1';
export const TIMEOUT_MS = 8000;

// ---------- small helpers ----------
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = n => String(n).padStart(2, '0');
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = s => typeof s === 'string' && ISO_DAY.test(s) && !isNaN(Date.parse(`${s}T12:00:00Z`));

// Today as YYYY-MM-DD in Portugal (Europe/Lisbon), the clock the homes and IPMA's dates use.
export function today(now = new Date()) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
  catch { return now.toISOString().slice(0, 10); }
}
export function addDays(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function daysBetween(a, b) { return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000); }
export function dateRange(from, to) { const out = []; for (let d = from; d <= to; d = addDays(d, 1)) out.push(d); return out; }
// "Fri 20 Nov"
export function fmtDay(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  return isNaN(d) ? String(ymd) : `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
}
// "20 November"
export function fmtLong(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  return isNaN(d) ? String(ymd) : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
// "16:14 UTC"
export function fmtUTC(iso) {
  const d = new Date(iso);
  return isNaN(d) ? 'an unknown time' : `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}
// IPMA's times carry no zone: they are Portugal local time, shown as given. "Wed 18 Nov 13:15"
export function fmtLocal(s) {
  const m = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)/.exec(s || '');
  return m ? `${fmtDay(m[1])} ${m[2]}:${m[3]}` : (s || 'unknown');
}
export function ago(min) {
  if (min === null || min === undefined) return 'at an unknown time';
  if (min < 1) return 'just now';
  if (min < 90) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.round(min / 60)} hours ago`;
  return `${Math.round(min / 1440)} days ago`;
}

// IPMA weather type codes, from IPMA's class file (a lookup table, not data):
// https://api.ipma.pt/open-data/weather-type-classe.json, read 2026-11-18 (team/rounds/1/research/DATA.md).
export const WEATHER_CLASS_URL = 'https://api.ipma.pt/open-data/weather-type-classe.json';
const WEATHER = {
  0: 'no information', 1: 'clear sky', 2: 'partly cloudy', 3: 'sunny intervals', 4: 'cloudy', 5: 'cloudy (high cloud)',
  6: 'showers', 7: 'light showers', 8: 'heavy showers', 9: 'rain and showers', 10: 'light rain', 11: 'heavy rain',
  12: 'intermittent rain', 13: 'intermittent light rain', 14: 'intermittent heavy rain', 15: 'drizzle', 16: 'mist',
  17: 'fog', 18: 'snow', 19: 'thunderstorms', 20: 'showers and thunderstorms', 21: 'hail', 22: 'frost',
  23: 'rain and thunderstorms', 24: 'convective clouds', 25: 'partly cloudy', 26: 'fog', 27: 'cloudy',
  28: 'snow showers', 29: 'rain and snow', 30: 'rain and snow', '-99': 'no information',
};
export const weatherWords = code => WEATHER[code] ?? (code === null || code === undefined ? 'no information' : `weather type ${code}`);
// IPMA wind-speed-daily-classe.json: 1 weak, 2 moderate, 3 strong, 4 very strong.
const WIND = { 1: 'weak', 2: 'moderate', 3: 'strong', 4: 'very strong' };
export const windWords = (dir, cls) => [dir, WIND[cls]].filter(Boolean).join(', ') || 'no information';
// UV bands, WHO convention.
export function uvBand(i) {
  if (i === null || i === undefined || !Number.isFinite(Number(i))) return 'unknown';
  const v = Number(i);
  return v < 3 ? 'low' : v < 6 ? 'moderate' : v < 8 ? 'high' : v < 11 ? 'very high' : 'extreme';
}

// ---------- reading files ----------
const cache = new Map();
function readError(e) {
  if (e?.name === 'AbortError') return `no answer within ${TIMEOUT_MS / 1000} seconds`;
  if (e instanceof SyntaxError) return 'the file was read but is not valid JSON';
  if (e instanceof TypeError || /fetch|network|load failed/i.test(e?.message || '')) return 'the network request failed';
  return `the file could not be read (${e?.message || 'unknown error'})`;
}
// Resolves (never rejects) to { ok, data, error, status, url }. One read per URL per page load.
export function getJSON(url, { timeout = TIMEOUT_MS } = {}) {
  if (cache.has(url)) return cache.get(url);
  const p = (async () => {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const kill = ctl ? setTimeout(() => ctl.abort(), timeout) : null;
    try {
      const r = await fetch(url, ctl ? { signal: ctl.signal } : {});
      if (!r.ok) return { ok: false, status: r.status, error: `the file answered HTTP ${r.status}`, url };
      return { ok: true, status: r.status, data: await r.json(), error: null, url };
    } catch (e) {
      return { ok: false, status: 0, error: readError(e), url };
    } finally { if (kill) clearTimeout(kill); }
  })();
  cache.set(url, p);
  return p;
}
export const urls = id => ({
  latest: `${API}/${id}/latest.json`, reads: `${API}/${id}/reads.json`, card: `${API}/${id}/card.json`,
  page: `https://data.promptugal.news/sources/${id}/`,
});

// How old a file may be before the page calls it stale: twice the card's cadence
// (hourly: 2 hours; every 6 hours: 12 hours; daily: 48 hours), as DATA.md suggests.
export function staleAfterMin(cadence) {
  const c = String(cadence || '').toLowerCase();
  if (/hourly|every hour/.test(c)) return 120;
  const m = c.match(/every (\d+) hours?/); if (m) return Number(m[1]) * 120;
  if (/daily|every day/.test(c)) return 48 * 60;
  if (/once/.test(c)) return Infinity;
  return 120;
}

const sources = new Map();
// getSource(id) -> { id, latest, card, read_at, age_min, stale, error, status, urls }
// latest and card are the parsed files (or null); error says why latest.json could not be read.
// status is the catalogue's word for the source ("ok", "partly failed", ...), or null.
export function getSource(id, { now = Date.now() } = {}) {
  if (sources.has(id)) return sources.get(id);
  const u = urls(id);
  const p = Promise.all([getJSON(u.latest), getJSON(u.card), getJSON(`${API}/index.json`)]).then(([l, c, idx]) => {
    const latest = l.ok ? l.data : null;
    const card = c.ok ? c.data : null;
    const read_at = latest?.read_at || latest?.provenance?.read_at || null;
    const t = Date.parse(read_at);
    const age_min = Number.isFinite(t) ? Math.max(0, Math.round((now - t) / 60000)) : null;
    const entry = idx.ok ? (idx.data.sources || []).find(s => s.id === id) : null;
    const cadence = card?.schedule?.cadence || entry?.cadence || 'hourly';
    const stale = latest ? (age_min === null ? true : age_min > staleAfterMin(cadence)) : false;
    const error = l.ok ? (latest && typeof latest === 'object' ? null : 'the file holds no data') : l.error;
    return { id, latest, card, read_at, age_min, stale, error, status: entry?.status || null, cadence, urls: u };
  });
  sources.set(id, p);
  return p;
}
// Forget a source so the next getSource() reads it again (the "Try again" buttons).
export function forget(id) {
  sources.delete(id);
  for (const k of [...cache.keys()]) if (k.includes(`/${id}/`) || k.endsWith('/index.json')) cache.delete(k);
}

// Shorten a card's terms for a line beside a figure; the full terms are on the card (linked).
function shortTerms(card) {
  const t = card?.terms;
  if (!t) return null;
  if (t.summary && t.summary.length <= 200) return t.summary;
  if (t.republish) return t.republish.charAt(0).toUpperCase() + t.republish.slice(1) + '.';
  return t.summary ? t.summary.slice(0, 180).replace(/\s+\S*$/, '') + '...' : null;
}

// sourceLine(res, opts) -> HTML string for the line beside a figure: publisher (from the card),
// source id, read time in UTC and minutes ago, a stale note, the terms and a link to the card.
// opts.issued: IPMA's issue time to add ("IPMA issued 15:31"); opts.terms === false leaves the
// terms out (when a terms line follows); opts.publisher overrides the card's publisher (an event's own source).
export function sourceLine(res, opts = {}) {
  if (!res) return '';
  const u = res.urls || urls(res.id);
  const pub = opts.publisher || res.card?.publisher || (String(res.id).startsWith('ipma-') ? 'IPMA, Instituto Português do Mar e da Atmosfera' : res.id);
  const parts = [`Source: ${esc(pub)} (<code>${esc(res.id)}</code>), via data.promptugal.news.`];
  if (res.error) {
    parts.push(`<strong>Could not read it just now (${esc(res.error)}).</strong>`);
  } else {
    if (opts.issued) parts.push(`IPMA issued ${esc(String(opts.issued).slice(11, 16))} (Portugal time);`);
    const read = `Read ${esc(fmtUTC(res.read_at))}, ${esc(ago(res.age_min))}.`;
    parts.push(res.stale ? `<strong class="stale">${read} This may be out of date.</strong>` : read);
    if (res.status && res.status !== 'ok') parts.push(`<strong>The catalogue says this source is "${esc(res.status)}" at its last run.</strong>`);
  }
  if (opts.terms !== false) {
    const t = shortTerms(res.card);
    parts.push(t ? `Terms: ${esc(t)}` : '<em>The source card could not be read; see it before reuse.</em>');
  }
  const links = [`<a href="${esc(u.card)}">Source card</a>`];
  if (res.card?.reader_page) links.push(`<a href="${esc(res.card.reader_page)}">Publisher's page</a>`);
  parts.push(links.join(' · '));
  return `<p class="src${res.stale ? ' is-stale' : ''}${res.error ? ' is-error' : ''}">${parts.join(' ')}</p>`;
}

// ---------- the five sources, filtered for a place and a stay ----------
const within = (d, from, to) => (!from || d >= from) && (!to || d <= to);

// forecastFor(placeId, from, to) -> { res, place, days: [{date, tmin, tmax, rain_pct, weather, weather_type, wind}], beyond }
// beyond: the dates from..to (not before today) that IPMA's five days do not cover yet.
export async function forecastFor(placeId, fromISO, toISO, { now = today() } = {}) {
  const res = await getSource('ipma-city-forecasts');
  const city = (res.latest?.cities || []).find(c => Number(c.id) === Number(placeId)) || null;
  const all = city?.days || [];
  const days = all.filter(d => within(d.date, fromISO, toISO)).map(d => ({
    date: d.date, tmin: d.t_min_c ?? null, tmax: d.t_max_c ?? null, rain_pct: d.rain_prob_pct ?? null,
    weather: weatherWords(d.weather_type), weather_type: d.weather_type ?? null, wind: windWords(d.wind_dir, d.wind_class),
  }));
  let beyond = [];
  if (fromISO && toISO && city) {
    const last = all.length ? all[all.length - 1].date : addDays(now, -1);
    const start = fromISO > now ? fromISO : now;
    if (start <= toISO) beyond = dateRange(start, toISO).filter(d => d > last);
  }
  return { res, place: city ? { id: city.id, name: city.name, updated: city.updated || null } : null, days, beyond, last: all.length ? all[all.length - 1].date : null };
}

const LEVELS = ['yellow', 'orange', 'red'];
// warningsFor(area, from, to) -> { res, items: [{level, type, start, end, text}], furthest }
// Only yellow and above whose dates overlap from..to (local dates). furthest: the latest end of any warning listed.
export async function warningsFor(area, fromISO, toISO) {
  const res = await getSource('ipma-warnings');
  const active = res.latest?.active || [];
  const items = active.filter(w => w.area === area && LEVELS.includes(String(w.level).toLowerCase()))
    .filter(w => { const s = String(w.start || '').slice(0, 10), e = String(w.end || w.start || '').slice(0, 10); return (!toISO || s <= toISO) && (!fromISO || e >= fromISO); })
    .map(w => ({ level: String(w.level).toLowerCase(), type: w.type || w.type_pt || 'warning', type_pt: w.type_pt || null, start: w.start, end: w.end, text: w.text || '' }))
    .sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level) || String(a.start).localeCompare(String(b.start)));
  const furthest = active.reduce((m, w) => (String(w.end || '') > m ? String(w.end) : m), '').slice(0, 10) || null;
  return { res, items, furthest };
}

// seaFor(seaId) -> { res, place, days: [{date, temp_min, temp_max, waves_min, waves_max, wave_dir}] }
export async function seaFor(seaId) {
  const res = await getSource('ipma-sea');
  const coast = (res.latest?.coasts || []).find(c => Number(c.id) === Number(seaId)) || null;
  const days = (coast?.days || []).map(d => ({
    date: d.date, temp_min: d.sea_temp_min_c ?? null, temp_max: d.sea_temp_max_c ?? null,
    waves_min: d.waves_min_m ?? null, waves_max: d.waves_max_m ?? null, wave_dir: d.wave_dir || null,
  }));
  return { res, place: coast ? { id: coast.id, name: coast.name } : null, days };
}

// uvFor(uvId) -> { res, place, days: [{date, index, band}] }. Id 0 is ignored (no place);
// when a place has two entries for a date, the higher index is kept (DATA.md).
export async function uvFor(uvId) {
  const res = await getSource('ipma-uv');
  const entries = (res.latest?.places || []).filter(p => Number(p.id) !== 0 && Number(p.id) === Number(uvId));
  const by = new Map();
  for (const p of entries) for (const d of p.days || []) {
    const v = Number(d.index);
    if (!Number.isFinite(v)) continue;
    if (!by.has(d.date) || v > by.get(d.date)) by.set(d.date, v);
  }
  const days = [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, index]) => ({ date, index, band: uvBand(index) }));
  return { res, place: entries.length ? { id: entries[0].id, name: entries[0].name ?? null } : null, days };
}

// The publisher's words for an event's source: "https://x (Teatro das Figuras, Faro, agenda page)" -> the bracket.
function sourceName(src) {
  const s = String(src || '');
  const m = s.match(/\(([^)]+)\)\s*$/);
  if (m) return m[1];
  try { return new URL(s.split(/\s/)[0]).host.replace(/^www\./, ''); } catch { return s || 'the event\'s source'; }
}
// The card's spelling of a publisher's name (with its accents) when the data gives it without:
// "Camara Municipal de Tavira" -> "Câmara Municipal de Tavira" if the card's publisher has it (review S8).
const ACC = { a: '[aàáâãä]', e: '[eèéêë]', i: '[iìíîï]', o: '[oòóôõö]', u: '[uùúûü]', c: '[cç]', n: '[nñ]' };
export function cardSpelling(name, cardPublisher) {
  const n = String(name || ''), pub = String(cardPublisher || '');
  if (!n || !pub) return n;
  const src = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[aeiouc n]/gi, ch => ACC[ch.toLowerCase()] || ch);
  try { const m = pub.match(new RegExp(src, 'i')); return m ? m[0] : n; } catch { return n; }
}
const withCardName = (s, pub) => { const [first, ...rest] = String(s).split(/,\s/); return [cardSpelling(first, pub), ...rest].join(', '); };
// eventsFor(place, from, to) -> { res, items: [{name, start, end, venue, url, source_name, through}] }
// through: the event runs all through from..to (a long exhibition). Window: now to 60 days ahead.
export async function eventsFor(place, fromISO, toISO) {
  const res = await getSource('events-pt');
  const list = res.latest?.places?.[place] || [];
  const items = list.map(e => {
    const start = String(e.startDate || '').slice(0, 10), end = String(e.endDate || e.startDate || '').slice(0, 10);
    return { name: e.name || 'an event', start: e.startDate || null, end: e.endDate || null, s: start, e: end,
      venue: e.location?.name || null, url: e.url || null, source_name: withCardName(sourceName(e.source), res.card?.publisher), source: e.source || null };
  }).filter(x => x.s && (!toISO || x.s <= toISO) && (!fromISO || x.e >= fromISO))
    .map(({ s, e, ...x }) => ({ ...x, through: Boolean(fromISO && toISO && s < fromISO && e > toISO) }))
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  return { res, items };
}

// ---------- the chosen stay: page address and this tab only ----------
// Only the two dates are kept (review M5): never the number of guests or anything else typed.
const KEY = 'cc-stay';
function store() { try { return globalThis.sessionStorage || null; } catch { return null; } }
// stayDates() -> { from, to } (null where none). Reads ?from=&to= (also ?arrive=&leave= from
// the design proposal), then this tab's sessionStorage.
export function stayDates() {
  let from = null, to = null;
  try {
    const q = new URLSearchParams(globalThis.location?.search || '');
    from = q.get('from') || q.get('arrive'); to = q.get('to') || q.get('leave');
  } catch { /* no location */ }
  if (!(isDay(from) && isDay(to))) {
    try { const s = JSON.parse(store()?.getItem(KEY) || 'null'); if (s) { from = s.from; to = s.to; } } catch { /* nothing kept */ }
  }
  if (!(isDay(from) && isDay(to) && from < to)) { from = null; to = null; }
  return { from, to };
}
// setStayDates(from, to): puts the dates in the address (?from=&to=) and this tab's
// sessionStorage; null clears them. Any old ?guests= is dropped. Nothing is sent anywhere.
export function setStayDates(from, to) {
  const ok = isDay(from) && isDay(to) && from < to;
  try {
    const u = new URL(globalThis.location.href);
    for (const k of ['from', 'to', 'arrive', 'leave', 'guests']) u.searchParams.delete(k);
    if (ok) { u.searchParams.set('from', from); u.searchParams.set('to', to); }
    globalThis.history?.replaceState(globalThis.history.state, '', u.pathname + u.search + u.hash);
  } catch { /* no location */ }
  try {
    const s = store();
    if (s) ok ? s.setItem(KEY, JSON.stringify({ from, to })) : s.removeItem(KEY);
  } catch { /* storage blocked: the address still holds the dates */ }
  return ok ? { from, to } : { from: null, to: null };
}
// A query string carrying the stay to another page: "?from=..&to=.." or "".
export function stayQuery({ from, to } = stayDates()) {
  const q = new URLSearchParams();
  if (from && to) { q.set('from', from); q.set('to', to); }
  const s = q.toString(); return s ? `?${s}` : '';
}

// ---------- the homes (invented) ----------
let homesP = null;
// homes() -> the five invented homes from /data/homes.json (an array; [] if the file cannot be read).
export function homes() {
  if (!homesP) homesP = getJSON(new URL('/data/homes.json', globalThis.location?.href || 'https://algarve-holiday-homes.agenticcells.site/').href)
    .then(r => (r.ok ? r.data.homes || [] : []));
  return homesP;
}
export async function home(id) { return (await homes()).find(h => h.id === id) || null; }
