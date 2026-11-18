// The scripted agent for Cinco Chaminés (a made-up example).
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18. Code Apache-2.0.
//
// A simulation: the visitor's words are matched in the browser against the writer's pre-written
// intents (agent-script.js); slots are filled from /data/homes.json, /data/cameras.json and the live
// files on data.promptugal.news, read through data.js. There is no live model. Nothing typed is
// stored or sent: the text stays in this page's memory and is gone when the page closes.
//
// Use: mountAgent(rootElement) builds the chat inside rootElement. /agent/ mounts it on #agent.

import { LABEL, HOME_WORDS, MESSAGES, SUGGESTED, FALLBACK, INTENTS } from './agent-script.js';
import * as D from './data.js';
import { isTaken } from './availability.js';

// ---------- small helpers ----------

const TZ = 'Europe/Lisbon';
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

// IPMA weather types in words (lookup table, not data: https://api.ipma.pt/open-data/weather-type-classe.json)
const WEATHER = {
  0: 'no information', 1: 'clear sky', 2: 'partly cloudy', 3: 'sunny intervals', 4: 'cloudy', 5: 'cloudy (high cloud)',
  6: 'showers', 7: 'light showers', 8: 'heavy showers', 9: 'rain or showers', 10: 'light rain', 11: 'heavy rain',
  12: 'intermittent rain', 13: 'intermittent light rain', 14: 'intermittent heavy rain', 15: 'drizzle', 16: 'mist',
  17: 'fog', 18: 'snow', 19: 'thunderstorms', 20: 'showers and thunderstorms', 21: 'hail', 22: 'frost',
  23: 'rain and thunderstorms', 24: 'convective clouds', 25: 'partly cloudy', 26: 'fog', 27: 'cloudy', 28: 'snow showers',
  29: 'rain and snow', 30: 'rain and snow'
};
const WIND = { 1: 'weak', 2: 'moderate', 3: 'strong', 4: 'very strong' };

export const normalise = s => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[‘’‛′]/g, "'").replace(/[“”]/g, '"')
  .toLowerCase().replace(/\s+/g, ' ').trim();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Today in Portugal as YYYY-MM-DD.
export const todayISO = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

const toDate = iso => new Date(iso + 'T12:00:00Z');
const toISO = d => d.toISOString().slice(0, 10);
export const addDays = (iso, n) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return toISO(d); };
const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
const dow = iso => toDate(iso).getUTCDay();

const dayWords = iso => { const d = toDate(iso); return `${DOW_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MON_SHORT[d.getUTCMonth()]}`; };
export const rangeWords = (from, to) => {
  const a = toDate(from), b = toDate(to);
  const da = a.getUTCDate(), db = b.getUTCDate();
  if (from === to) return `${da} ${MON_LONG[a.getUTCMonth()]} ${a.getUTCFullYear()}`;
  if (a.getUTCFullYear() !== b.getUTCFullYear()) return `${da} ${MON_LONG[a.getUTCMonth()]} ${a.getUTCFullYear()} to ${db} ${MON_LONG[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  if (a.getUTCMonth() !== b.getUTCMonth()) return `${da} ${MON_LONG[a.getUTCMonth()]} to ${db} ${MON_LONG[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  return `${da} to ${db} ${MON_LONG[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
};

// "18 Nov, 16:12 (Lisbon time)", as the writer asks.
const lisbonTime = iso => {
  if (!iso) return 'an unknown time';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
  return `${p.day} ${p.month}, ${p.hour}:${p.minute} (Lisbon time)`;
};
// IPMA warning times are Portugal local time without a zone.
const localTime = s => {
  if (!s) return '';
  const [date, time] = String(s).split('T');
  return `${dayWords(date)}${time ? ' ' + time.slice(0, 5) : ''}`;
};
const listWords = arr => arr.length <= 1 ? (arr[0] || '') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
const num = v => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? null : Number(v);
const fmt = v => { const n = num(v); return n === null ? '?' : (Math.round(n * 10) / 10).toString(); };
const kmBetween = (a, b) => {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const uvBand = i => i === null ? 'unknown' : i < 3 ? 'low' : i < 6 ? 'moderate' : i < 8 ? 'high' : i < 11 ? 'very high' : 'extreme';

// ---------- simulated availability ----------
// The same seeded calendar as the home pages (availability.js: FNV-1a of "<homeId>|<today in
// Lisbon>", mulberry32, free gaps of 1 to 9 nights and taken runs of 2 to 7 nights).
const nightsFree = (homeId, from, nights) => { const t = todayISO(); for (let k = 0; k < nights; k++) if (isTaken(homeId, addDays(from, k), t)) return false; return true; };

// ---------- date and home extraction ----------

const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const monthIndex = m => MONTHS.findIndex(x => x.startsWith(m.slice(0, 3)));
const ORD = '(?:st|nd|rd|th)?';

function makeISO(day, month, year, today) {
  let y = year || Number(today.slice(0, 4));
  if (day < 1 || day > 31 || month < 0 || month > 11) return null;
  let iso = `${y}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!year && iso < today) { y += 1; iso = `${y}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
  const d = toDate(iso);
  if (d.getUTCMonth() !== month) return null;
  return iso;
}

// Returns { from, to, words } (inclusive days) or null. Stays: arrive = from, leave = to.
export function extractDates(text, today = todayISO()) {
  const t = text;
  let m;
  // ISO dates
  const iso = [...t.matchAll(/\b(20\d\d)-(\d\d)-(\d\d)\b/g)].map(x => makeISO(+x[3], +x[2] - 1, +x[1], today)).filter(Boolean);
  if (iso.length) return { from: iso[0], to: iso[1] && iso[1] >= iso[0] ? iso[1] : iso[0] };
  // "21 to 28 november", "21-28 nov", "from 21 until 28 november"
  m = t.match(new RegExp(`\\b(\\d{1,2})${ORD}\\s*(?:to|-|until|till|and)\\s*(\\d{1,2})${ORD}\\s+(?:of\\s+)?${MONTH_RE}\\b(?:\\s+(20\\d\\d))?`));
  if (m) {
    const mi = monthIndex(m[3]); const y = m[4] ? +m[4] : 0;
    const to = makeISO(+m[2], mi, y, today); let from = makeISO(+m[1], mi, y, today);
    if (from && to && from > to) from = makeISO(+m[1], mi, y ? y : Number(to.slice(0, 4)), today);
    if (from && to && from <= to) return { from, to };
  }
  // "21 nov to 2 dec", "november 21", "21 november", "21/11"
  const singles = [];
  for (const x of t.matchAll(new RegExp(`\\b(\\d{1,2})${ORD}\\s+(?:of\\s+)?${MONTH_RE}\\b(?:\\s+(20\\d\\d))?`, 'g'))) singles.push({ at: x.index, iso: makeISO(+x[1], monthIndex(x[2]), x[3] ? +x[3] : 0, today) });
  for (const x of t.matchAll(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})${ORD}\\b(?:,?\\s+(20\\d\\d))?`, 'g'))) singles.push({ at: x.index, iso: makeISO(+x[2], monthIndex(x[1]), x[3] ? +x[3] : 0, today) });
  for (const x of t.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d\d))?\b/g)) singles.push({ at: x.index, iso: makeISO(+x[1], +x[2] - 1, x[3] ? +x[3] : 0, today) });
  const good = singles.filter(s => s.iso).sort((a, b) => a.at - b.at);
  if (good.length >= 2 && good[1].iso >= good[0].iso) return { from: good[0].iso, to: good[1].iso };
  if (good.length) {
    const nm = t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+nights?\b/);
    const n = nm ? (NUMBER_WORDS[nm[1]] || +nm[1]) : 0;
    return { from: good[0].iso, to: n ? addDays(good[0].iso, n) : good[0].iso };
  }
  // words
  const wd = dow(today);
  const satThis = wd === 0 ? addDays(today, -1) : addDays(today, 6 - wd);
  if (/\b(today|tonight|now|right now)\b/.test(t)) return { from: today, to: today };
  if (/\bday after tomorrow\b/.test(t)) return { from: addDays(today, 2), to: addDays(today, 2) };
  if (/\btomorrow\b/.test(t)) return { from: addDays(today, 1), to: addDays(today, 1) };
  if (/\bnext weekend\b/.test(t)) { const s = addDays(satThis, 7); return { from: s, to: addDays(s, 1) }; }
  if (/\b(this|the|coming) weekend\b|\bweekend\b/.test(t)) return { from: wd === 0 ? today : satThis, to: addDays(satThis, 1) };
  if (/\bnext week\b/.test(t)) { const mon = addDays(today, ((8 - wd) % 7) || 7); return { from: mon, to: addDays(mon, 7) }; }
  if (/\b(this|the) week\b/.test(t)) return { from: today, to: addDays(today, (7 - wd) % 7) };
  if (/\bnext few days\b|\bcoming days\b/.test(t)) return { from: today, to: addDays(today, 4) };
  m = t.match(new RegExp(`\\b(?:in|during|for|this|next)\\s+${MONTH_RE}\\b`));
  if (m && /^(mar|may)$/.test(m[1]) && !/\b(in|during) may\b/.test(m[0])) m = null; // "mar" is Portuguese for sea
  if (m) {
    const mi = monthIndex(m[1]);
    const y = Number(today.slice(0, 4)), cm = Number(today.slice(5, 7)) - 1;
    let first = mi === cm ? today : makeISO(1, mi, mi < cm ? y + 1 : y, today);
    if (!first) return null;
    return { from: first, to: addDays(first, 7) };
  }
  m = t.match(/\b(?:on|this|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (m) { const target = DOW.indexOf(m[1]); let d = (target - wd + 7) % 7; if (/\bnext\s+\w+day\b/.test(m[0]) && d === 0) d = 7; const day = addDays(today, d); return { from: day, to: day }; }
  return null;
}

export function extractHome(text) {
  let best = null;
  for (const [id, words] of Object.entries(HOME_WORDS)) {
    for (const src of words) {
      const m = new RegExp(src, 'i').exec(text);
      if (m && (!best || m.index < best.at || (m.index === best.at && m[0].length > best.len))) best = { id, at: m.index, len: m[0].length };
    }
  }
  return best ? best.id : null;
}

export function extractGuests(text) {
  const m = text.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:of us|people|persons|adults|guests|friends)\b/);
  return m ? (NUMBER_WORDS[m[1]] || +m[1]) : null;
}

// ---------- matching ----------
// The writer's INTENTS are in priority order. Each intent is scored by how many of its patterns
// match; the first intent (in priority order) with a score above zero wins, so that task intents
// beat home descriptions. The score is kept for the notes and for ties within a follow-up.
const compiled = INTENTS.map(it => ({ ...it, res: it.patterns.map(p => { try { return new RegExp(p, 'i'); } catch { return null; } }).filter(Boolean) }));
export function matchIntent(text) {
  const scored = [];
  compiled.forEach((it, i) => { const score = it.res.reduce((s, r) => s + (r.test(text) ? 1 : 0), 0); if (score) scored.push({ it, i, score }); });
  if (!scored.length) return null;
  scored.sort((a, b) => a.i - b.i);
  return scored[0].it;
}

// ---------- data access (through data.js) ----------

let homesP = null;
async function loadHomes() {
  if (!homesP) homesP = (async () => {
    let list = null;
    try { if (typeof D.homes === 'function') list = await D.homes(); } catch { list = null; }
    if (!Array.isArray(list) || !list.length) {
      const r = await fetch('/data/homes.json');
      const j = await r.json();
      list = j.homes;
    }
    if (list && list.homes) list = list.homes;
    return list;
  })();
  return homesP;
}
let camsP = null;
const loadCameras = () => camsP || (camsP = fetch('/data/cameras.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }));

const hd = (h, k) => (h.data && h.data[k] !== undefined ? h.data[k] : h[k]);
const homeById = (homes, id) => homes.find(h => h.id === id);
const homeLine = h => `[${h.name}](/homes/${h.id}/), ${h.place}: sleeps ${h.sleeps}, from EUR ${h.price_eur_invented} a night (invented)`;
const shortOperator = op => String(op || '').split(' (')[0];
// "The Salt House" in the middle of a sentence reads "the Salt House".
const midName = h => String(h.name).replace(/^The /, 'the ');
// An event source's publisher, without the route details: "Camara Municipal de Tavira, Events ..." -> "Camara Municipal de Tavira".
const publisherName = s => String(s || '').split(/,\s/)[0];

// Problems from a data.js result: returns a message to say instead of figures, or '' when fine.
function resProblem(res, sourceName) {
  if (!res) return MESSAGES.missing.replace('{source}', sourceName);
  if (res.error) return MESSAGES.missing.replace('{source}', sourceName);
  return '';
}
const staleNote = (res, sourceName, msg = MESSAGES.stale) => res && res.stale ? msg.replace('{source}', sourceName).replace('{read_at}', lisbonTime(res.read_at)) + ' ' : '';
const CARD = id => `https://data.promptugal.news/api/v1/${id}/card.json`;
// IPMA's terms in the short form the source card gives (terms.republish), with a link to the card (review M2).
const ipmaTerms = res => {
  const r = res && res.card && res.card.terms && res.card.terms.republish;
  const short = r ? String(r).replace(/^with conditions:\s*/i, '').replace(/\.$/, '') : 'attribution to IPMA; no profit-making purpose';
  return `IPMA's terms: ${short} ([source card](${CARD((res && res.id) || 'ipma-city-forecasts')})).`;
};
const readWords = res => `read ${lisbonTime(res && res.read_at)}${res && res.stale ? ', which is old: it may be out of date' : ''}`;
const sourceIPMA = (res, extra = '') => `Source: IPMA${extra ? ' (' + extra + ')' : ''}, ${readWords(res)}, via data.promptugal.news. ${ipmaTerms(res)}`;
const sourceEvents = (res, pubs) => `Source: ${pubs}, ${readWords(res)}, via data.promptugal.news. Reference use only: check details with the organiser.`;
// Each town's own agenda, for when the events file cannot be read (review S4). Addresses from the
// "source" field of each place in events-pt latest.json, read 2026-11-18.
const AGENDA = {
  lagos: { name: "Câmara Municipal de Lagos's agenda", url: 'https://www.cm-lagos.pt/municipio/eventos' },
  faro: { name: "Teatro das Figuras's agenda (Faro)", url: 'https://teatrodasfiguras.pt/agenda' },
  tavira: { name: "Câmara Municipal de Tavira's agenda", url: 'https://cm-tavira.pt/site/evento/' },
};

// ---------- slots ----------
// Each slot returns { text, source } (source: a short line put at the end of the answer).

async function slot(kind, args, ctx) {
  const homes = await loadHomes();
  const pickHome = id => homeById(homes, id === 'current' ? ctx.home : id);
  const dates = ctx.dates;
  switch (kind) {
    case 'home': {
      const h = pickHome(args[0]); if (!h) return { needHome: true };
      if (!args[1]) return { text: homeLine(h) + '.' };
      const v = h[args[1]];
      return { text: Array.isArray(v) ? v.join(', ') : String(v ?? '') };
    }
    case 'homes': {
      if (args[0] === 'list') return { text: homes.map(h => '- ' + homeLine(h)).join('\n') };
      if (args[0] === 'for') { const tag = args.slice(1).join(':'); return { text: listWords(homes.filter(h => (h.good_for || []).includes(tag)).map(h => `[${h.name}](/homes/${h.id}/)`)) || 'none of the five homes' }; }
      if (args[0] === 'pets') return { text: listWords(homes.filter(h => h.pets).map(h => `[${h.name}](/homes/${h.id}/)`)) || 'none of the homes' };
      return { text: '' };
    }
    case 'link': {
      const h = pickHome(args[1]); if (!h) return { needHome: true };
      return { text: args[0] === 'book' ? `/homes/${h.id}/#book` : `/homes/${h.id}/` };
    }
    case 'dates': return { text: dates ? rangeWords(dates.from, dates.to) : 'your dates' };
    case 'nights': return { text: String(dates ? Math.max(1, diffDays(dates.from, dates.to)) : 7) };
    case 'availability': {
      const h = pickHome(args[0]); if (!h) return { needHome: true };
      const stay = ctx.stay();
      const nights = stay.nights;
      const words = rangeWords(stay.from, stay.leave);
      if (stay.from < todayISO()) return { text: `${words} is in the past.` };
      const small = ctx.guests && ctx.guests > h.sleeps ? ` Note: ${midName(h)} sleeps ${h.sleeps}, fewer than ${ctx.guests} (invented).` : '';
      if (nightsFree(h.id, stay.from, nights)) return { text: `${h.name} is free for ${words} (${nights} night${nights > 1 ? 's' : ''}). [See its calendar](/homes/${h.id}/#book). ${MESSAGES.simulated}${small}` };
      let alt = null;
      for (let k = 1; k <= 30 && !alt; k++) {
        for (const s of [addDays(stay.from, k), addDays(stay.from, -k)]) {
          if (s < todayISO()) continue;
          if (nightsFree(h.id, s, nights)) { alt = s; break; }
        }
      }
      const altText = alt ? ` The nearest free ${nights} night${nights > 1 ? 's' : ''}: ${rangeWords(alt, addDays(alt, nights))}.` : ` I found no free run of ${nights} nights within 30 days.`;
      return { text: `${h.name} is taken on some nights of ${words}.${altText} [See its calendar](/homes/${h.id}/#book). ${MESSAGES.simulated}${small}` };
    }
    case 'price': {
      const h = pickHome(args[0]); if (!h) return { needHome: true };
      const stay = ctx.stay();
      const total = stay.nights * h.price_eur_invented;
      return { text: `${h.name}, ${rangeWords(stay.from, stay.leave)}: ${stay.nights} night${stay.nights > 1 ? 's' : ''} x EUR ${h.price_eur_invented} = EUR ${total} (invented price).` };
    }
    case 'forecast': {
      const h = pickHome(args[0]); if (!h) return { needHome: true };
      const id = hd(h, 'forecast_id'), place = hd(h, 'forecast_name') || h.place;
      const from = dates ? dates.from : todayISO(), to = dates ? dates.to : addDays(todayISO(), 4);
      let r; try { r = await D.forecastFor(id, from, to); } catch (e) { r = { res: { error: String(e) } }; }
      const p = resProblem(r && r.res, 'the IPMA forecast'); if (p) return { text: p, live: true };
      const days = (r.days || []).filter(d => d.date >= from && d.date <= to);
      if (!days.length) return { text: `${staleNote(r.res, 'the IPMA forecast')}${MESSAGES.forecastTooFar.replace('{dates}', rangeWords(from, to))}${r.last ? ` At the last read it runs to ${dayWords(r.last)}.` : ''}`, source: sourceIPMA(r.res, 'ipma-city-forecasts'), live: true };
      const lines = days.map(d => {
        const w = typeof d.weather === 'number' || /^-?\d+$/.test(String(d.weather)) ? (WEATHER[Number(d.weather)] || 'weather type ' + d.weather) : (d.weather || '');
        const wind = d.wind ? `, wind ${typeof d.wind === 'object' ? [d.wind.dir, WIND[d.wind.class] || d.wind.class].filter(Boolean).join(' ') : d.wind}` : '';
        return `- ${dayWords(d.date)}: ${w}, ${fmt(d.tmin ?? d.t_min_c)} to ${fmt(d.tmax ?? d.t_max_c)} °C, rain ${fmt(d.rain_pct ?? d.rain_prob_pct)} %${wind}`;
      });
      const beyond = (r.beyond || []).length ? `\nNo forecast yet for ${r.beyond.length} day${r.beyond.length > 1 ? 's' : ''} of these dates: IPMA forecasts five days ahead.` : '';
      const near = place !== h.place ? `Forecast for ${place}, the nearest IPMA place to ${h.place}${hd(h, 'forecast_note') ? ' (' + hd(h, 'forecast_note').replace(/\.$/, '') + ')' : ''}.` : `Forecast for ${place}.`;
      return { text: `${staleNote(r.res, 'the IPMA forecast')}${near}\n${lines.join('\n')}${beyond}`, source: sourceIPMA(r.res, 'ipma-city-forecasts'), live: true };
    }
    case 'warnings': {
      // Only dates asked in this question count (review M3): a bare "Any warnings?" means now and
      // the days the file covers, never dates carried over from an earlier turn. IPMA issues
      // warnings up to three days ahead, so no all-clear is given for days the file does not cover.
      const qd = args[1] === 'dates' ? ctx.qDates : null;
      const today = todayISO();
      let r; try { r = await D.warningsFor('FAR', qd ? qd.from : today, qd ? qd.to : addDays(today, 10)); } catch (e) { r = { res: { error: String(e) } }; }
      const p = resProblem(r && r.res, 'the IPMA warnings'); if (p) return { text: p, live: true };
      const readDay = r.res.read_at ? todayISO(new Date(r.res.read_at)) : today;
      const coverTo = [r.furthest || '', addDays(readDay, 2)].sort().pop();
      const coverFrom = readDay < today ? readDay : today;
      const covers = `The warnings file covers what IPMA had issued at the last read: ${rangeWords(coverFrom, coverTo)} (IPMA issues warnings up to three days ahead).`;
      const stale = staleNote(r.res, 'the IPMA warnings');
      const src = sourceIPMA(r.res, 'ipma-warnings');
      const items = r.items || [];
      const lines = items.map(w => `- ${String(w.level || '').replace(/^./, c => c.toUpperCase())} warning for ${w.type}, ${localTime(w.start)} to ${localTime(w.end)} (Portugal time).${w.text ? ' IPMA, in Portuguese: "' + w.text + '"' : ''}`);
      if (qd) {
        const words = rangeWords(qd.from, qd.to);
        if (qd.to < today) return { text: `${words} is in the past; I only have the warnings IPMA has issued now. ${covers}`, source: src, live: true };
        const rest = qd.to > coverTo && qd.from <= coverTo ? ` For ${rangeWords(addDays(coverTo, 1), qd.to)} no warnings are issued yet, so I cannot say either way.` : '';
        if (items.length) return { text: `${stale}IPMA warnings for the Faro district during ${words}:\n${lines.join('\n')}\n${rest.trim()} ${covers}`.replace('\n ', '\n'), source: src, live: true };
        if (qd.from > coverTo) return { text: `${stale}No warnings issued for ${words} yet: IPMA issues them up to three days ahead, so I cannot say either way. ${covers} Ask again nearer the time.`, source: src, live: true };
        const a = qd.from > today ? qd.from : today, b = qd.to < coverTo ? qd.to : coverTo;
        return { text: `${stale}No yellow, orange or red warning for the Faro district for ${rangeWords(a, b)} at the last read.${rest} ${covers}`, source: src, live: true };
      }
      if (!items.length) return { text: `${stale}No yellow, orange or red warning for the Faro district now or for ${rangeWords(today, coverTo)}, at the last read. ${covers}`, source: src, live: true };
      return { text: `${stale}IPMA warnings for the Faro district, now and in the days the file covers:\n${lines.join('\n')}\n${covers}`, source: src, live: true };
    }
    case 'sea': {
      const h = pickHome(args[0]); if (!h) return { needHome: true };
      let r; try { r = await D.seaFor(hd(h, 'sea_id')); } catch (e) { r = { res: { error: String(e) } }; }
      const p = resProblem(r && r.res, 'the IPMA sea forecast'); if (p) return { text: p, live: true };
      const all = (r.days || []).slice(0, 3);
      if (!all.length) return { text: MESSAGES.missing.replace('{source}', 'the IPMA sea forecast'), live: true };
      // Dates asked in this question ("tomorrow") pick those days (review S5); otherwise the three days.
      const qd = ctx.qDates;
      const days = qd ? all.filter(d => d.date >= qd.from && d.date <= qd.to) : all;
      if (!days.length) return { text: `${staleNote(r.res, 'the IPMA sea forecast')}IPMA's sea forecast covers ${rangeWords(all[0].date, all[all.length - 1].date)}, so there is nothing yet for ${rangeWords(qd.from, qd.to)}.`, source: sourceIPMA(r.res, hd(h, 'sea_name')), live: true };
      const lines = days.map(d => `- ${dayWords(d.date)}: waves ${fmt(d.waves_min_m ?? d.waves_min)} to ${fmt(d.waves_max_m ?? d.waves_max)} m${(d.wave_dir || d.dir) ? ' from the ' + (d.wave_dir || d.dir) : ''}, sea temperature up to ${fmt(d.sea_temp_max_c ?? d.sea_temp_max ?? d.temp_max)} °C`);
      return { text: `${staleNote(r.res, 'the IPMA sea forecast')}The sea near ${midName(h)} (IPMA's ${hd(h, 'sea_name')}):\n${lines.join('\n')}`, source: sourceIPMA(r.res, hd(h, 'sea_name')), live: true };
    }
    case 'uv': {
      const h = pickHome(args[0]); if (!h) return { needHome: true };
      let id = hd(h, 'uv_id'), name = hd(h, 'uv_name'), note = '';
      let r; try { r = await D.uvFor(id); } catch (e) { r = { res: { error: String(e) } }; }
      if ((!r || !r.days || !r.days.length) && hd(h, 'uv_fallback_id') && !(r && r.res && r.res.error)) {
        id = hd(h, 'uv_fallback_id'); name = 'Faro'; note = ` IPMA has no UV value for the Sagres area just now, so these are for Faro.`;
        try { r = await D.uvFor(id); } catch (e) { r = { res: { error: String(e) } }; }
      }
      const p = resProblem(r && r.res, 'the IPMA UV forecast'); if (p) return { text: p, live: true };
      const byDate = new Map();
      for (const d of (r.days || [])) { const i = num(d.index ?? d.uv); if (i === null) continue; if (!byDate.has(d.date) || byDate.get(d.date) < i) byDate.set(d.date, i); }
      const lines = [...byDate.entries()].sort().map(([date, i]) => `- ${dayWords(date)}: UV ${fmt(i)}, ${uvBand(i)}`);
      if (!lines.length) return { text: MESSAGES.missing.replace('{source}', 'the IPMA UV forecast'), live: true };
      return { text: `${staleNote(r.res, 'the IPMA UV forecast')}UV index for ${name}:${note}\n${lines.join('\n')}`, source: sourceIPMA(r.res, 'ipma-uv'), live: true };
    }
    case 'events': {
      let place, h = null;
      if (['lagos', 'faro', 'tavira'].includes(args[0])) place = args[0];
      else { h = pickHome(args[0]); if (!h) return { needHome: true }; place = hd(h, 'events_place'); }
      const from = dates ? dates.from : todayISO(), to = dates ? dates.to : addDays(todayISO(), 7);
      const town = place.charAt(0).toUpperCase() + place.slice(1);
      let r; try { r = await D.eventsFor(place, from, to); } catch (e) { r = { res: { error: String(e) } }; }
      if (resProblem(r && r.res, 'the events list')) {
        const ag = AGENDA[place];
        return { text: MESSAGES.missingEvents.replace('{agenda}', ag ? `[${ag.name}](${ag.url})` : `the ${town} agenda`), live: true };
      }
      const items = r.items || [];
      const note = h && hd(h, 'events_note') ? ' ' + hd(h, 'events_note') : '';
      const stale = staleNote(r.res, 'the events list', MESSAGES.staleEvents);
      if (!items.length) return { text: stale + MESSAGES.noEvents.replace('{place}', town).replace('{dates}', rangeWords(from, to)) + note, source: sourceEvents(r.res, `events-pt (the ${town} agenda)`), live: true };
      const day = s => String(s || '').slice(0, 10);
      const long = e => e.through || (e.end && diffDays(day(e.start), day(e.end)) > 7);
      const oneOff = items.filter(e => !long(e)).sort((a, b) => String(a.start).localeCompare(String(b.start)));
      const longRun = items.filter(long);
      const line = e => {
        const multi = e.end && day(e.end) > day(e.start);
        const when = long(e) ? `until ${dayWords(day(e.end))}` : multi ? `${dayWords(day(e.start))} to ${dayWords(day(e.end))}` : `${dayWords(day(e.start))}${String(e.start).length > 10 ? ' ' + String(e.start).slice(11, 16) : ''}`;
        return `- [${e.name}](${e.url}), ${when}${e.venue ? ', ' + e.venue : ''}`;
      };
      let text = `${stale}On in ${town}, ${rangeWords(from, to)}:\n`;
      text += oneOff.slice(0, 5).map(line).join('\n');
      if (oneOff.length > 5) text += `\n(and ${oneOff.length - 5} more)`;
      if (longRun.length) text += `${oneOff.length ? '\n' : ''}Also on all through your stay:\n${longRun.slice(0, 3).map(line).join('\n')}`;
      const pubs = [...new Set(items.map(e => publisherName(e.source_name)).filter(Boolean))];
      text += note;
      return { text, source: sourceEvents(r.res, pubs.length ? listWords(pubs) : 'the ' + town + ' agenda'), live: true };
    }
    case 'cameras': {
      let data; try { data = await loadCameras(); } catch { return { text: 'The camera list could not load just now; see [Live from the Algarve](/live/).' }; }
      const h = pickHome(args[0]);
      if (!h) return { text: 'There are public cameras all along the coast; name a home and I will give you the nearest three.' };
      const near = data.cameras.map(c => ({ c, km: kmBetween(h, c) })).sort((a, b) => a.km - b.km).slice(0, 3);
      return { text: `Nearest public cameras to ${midName(h)}:\n${near.map(({ c, km }) => `- [${c.title}](${c.url}), ${shortOperator(c.operator)}, about ${Math.round(km)} km away`).join('\n')}\nLinks go to the operator's own page (checked ${c2words(data.checked)}).` };
    }
    case 'read': {
      let res; try { res = await D.getSource(args[0]); } catch { res = null; }
      return { text: res && res.read_at ? lisbonTime(res.read_at) : 'an unknown time' };
    }
    default: return { text: '' };
  }
}
const c2words = iso => { if (!iso) return 'recently'; const d = toDate(iso); return `${d.getUTCDate()} ${MON_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

// Fill every {slot} in a template; returns { text, sources[], needHome }.
async function fill(template, ctx) {
  const tokens = [...new Set(template.match(/\{[a-z]+(?::[^{}]+)?\}/g) || [])];
  const out = new Map(); const sources = []; let needHome = false;
  await Promise.all(tokens.map(async tok => {
    const [kind, ...args] = tok.slice(1, -1).split(':');
    let r; try { r = await slot(kind, args, ctx); } catch (e) { r = { text: 'Something went wrong reading that just now.' }; }
    if (r.needHome) needHome = true;
    out.set(tok, r);
  }));
  for (const tok of tokens) { const r = out.get(tok); if (r && r.source && !sources.includes(r.source)) sources.push(r.source); }
  // A slot that ends in a list is followed by a line break, so the template's next words start a new paragraph.
  const text = template.replace(/\{[a-z]+(?::[^{}]+)?\}/g, tok => { const v = (out.get(tok) || {}).text ?? ''; return /\n- [^\n]*$/.test(v) || /^- [^\n]*$/.test(v) ? v + '\n' : v; });
  return { text, sources, needHome };
}

const needsDates = tpl => /\{(availability|price|forecast|events):[^}]*:dates\}/.test(tpl);

// ---------- the conversation ----------

export function createAgent() {
  const state = { home: null, dates: null, pending: null };
  async function answer(raw) {
    const text = normalise(raw);
    const today = todayISO();
    const home = extractHome(text);
    const dates = extractDates(text, today);
    const guests = extractGuests(text);
    if (home) state.home = home;
    if (dates) state.dates = dates;
    let intent = matchIntent(text);
    // A follow-up that only names a home after "Which home do you mean?" answers the earlier question.
    if (state.pending && (!intent || /^home-/.test(intent.id)) && home) intent = state.pending;
    state.pending = null;
    // A number of people filters the homes by "sleeps" first (review S2), for the choosing intents
    // and when nothing else matched; a group tag (families, couples, ...) then narrows the list.
    const CHOOSING = { 'for-families': 'families', 'for-couples': 'couples', 'for-surfers': 'surfers', 'no-car': 'no car', compare: null };
    if (guests && (!intent || intent.id in CHOOSING)) {
      const homes = await loadHomes();
      const fit = homes.filter(h => h.sleeps >= guests);
      const tag = intent ? CHOOSING[intent.id] : null;
      const tagged = tag ? fit.filter(h => (h.good_for || []).includes(tag)) : [];
      const list = tagged.length ? tagged : fit;
      const largest = homes.reduce((m, h) => (h.sleeps > m.sleeps ? h : m), homes[0]);
      return {
        intent: 'guests',
        html: render(list.length ? `Homes that sleep ${guests} or more (all invented):\n${list.map(h => '- ' + homeLine(h)).join('\n')}` : `None of the five homes sleeps ${guests}; the largest, ${midName(largest)}, sleeps ${largest.sleeps} (invented).`),
        suggestions: ['Compare the homes', 'Which home is best for a family?']
      };
    }
    if (!intent) return { intent: 'fallback', html: render(FALLBACK), suggestions: SUGGESTED.slice(0, 6) };
    const usedDefault = needsDates(intent.answer) && !state.dates;
    const ctx = {
      home: state.home,
      dates: state.dates,
      qDates: dates, // the dates asked in this question only, not carried over
      guests,
      stay() {
        const d = state.dates;
        if (!d) return { from: addDays(today, 1), leave: addDays(today, 8), nights: 7 };
        const nights = Math.max(1, diffDays(d.from, d.to));
        return { from: d.from, leave: addDays(d.from, nights), nights };
      }
    };
    const filled = await fill(intent.answer, ctx);
    if (filled.needHome) {
      state.pending = intent;
      return { intent: intent.id, html: render(MESSAGES.needHome), suggestions: ['The Salt House', 'The Lagoon House', 'The Hill House', 'The Harbour House', 'The Cape House'] };
    }
    let body = filled.text;
    if (usedDefault) {
      const isWeather = /\{forecast:/.test(intent.answer);
      const defWords = isWeather ? rangeWords(today, addDays(today, 4)) : /\{events:/.test(intent.answer) ? rangeWords(today, addDays(today, 7)) : rangeWords(ctx.stay().from, ctx.stay().leave);
      body += '\n' + MESSAGES.defaultDates.replace('{dates}', defWords);
    }
    return { intent: intent.id, html: render(body, filled.sources), suggestions: intent.suggestions || [] };
  }
  function reset() { state.home = null; state.dates = null; state.pending = null; }
  return { answer, reset, state };
}

// Plain text with [text](url) links and "- " lists, to safe HTML.
function inline(s) {
  let out = ''; let last = 0;
  for (const m of s.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    out += esc(s.slice(last, m.index));
    const url = m[2];
    const safe = /^(https?:\/\/|\/)/.test(url) ? url : '#';
    const ext = /^https?:\/\//.test(url);
    out += `<a href="${esc(safe)}"${ext ? ' rel="noopener" target="_blank"' : ''}>${esc(m[1])}${ext ? '<span class="visually-hidden"> (opens the source\'s page)</span>' : ''}</a>`;
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
}
export function render(text, sources = []) {
  const lines = String(text).split('\n');
  let html = '', list = [];
  const flush = () => { if (list.length) { html += `<ul>${list.map(l => `<li>${inline(l)}</li>`).join('')}</ul>`; list = []; } };
  for (const l of lines) {
    if (/^- /.test(l)) list.push(l.slice(2));
    else { flush(); if (l.trim()) html += `<p>${inline(l.trim())}</p>`; }
  }
  flush();
  if (sources.length) html += sources.map(s => `<p class="agent-source">${inline(s)}</p>`).join('');
  return html;
}

// ---------- the interface ----------

export function mountAgent(root) {
  if (!root) return null;
  const agent = createAgent();
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.innerHTML = `
    <div class="agent-head">
      <h2 class="agent-title">Ask the agent <span class="agent-tag">simulation</span></h2>
      <p class="agent-label" id="agent-label"></p>
    </div>
    <div class="agent-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with the scripted agent" tabindex="0"></div>
    <div class="agent-chips" aria-label="Suggested questions"></div>
    <form class="agent-form" autocomplete="off" novalidate>
      <label for="agent-input" class="visually-hidden">Your question</label>
      <input id="agent-input" class="agent-input" type="text" maxlength="300" placeholder="Ask about a home, dates, the weather or events" aria-describedby="agent-privacy">
      <button type="submit" class="agent-send">Send</button>
      <button type="button" class="agent-reset">Start again</button>
    </form>
    <p class="agent-privacy" id="agent-privacy">Nothing you type is stored or sent anywhere: the matching happens in your browser, and the conversation is gone when you leave the page.</p>`;
  root.querySelector('#agent-label').textContent = LABEL;
  const log = root.querySelector('.agent-log');
  const chips = root.querySelector('.agent-chips');
  const form = root.querySelector('.agent-form');
  const input = root.querySelector('.agent-input');
  let busy = false;

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  function addMsg(who, html) {
    const el = document.createElement('div');
    el.className = `agent-msg agent-msg-${who}`;
    el.innerHTML = who === 'bot'
      ? `<span class="agent-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="10" width="16" height="11" fill="var(--wall,#fff)" stroke="currentColor" stroke-width="1.5"/><path d="M3 11 12 4l9 7" fill="var(--roof,#C2643D)" stroke="currentColor" stroke-width="1.5"/><rect x="15" y="3" width="3" height="5" fill="var(--wall,#fff)" stroke="currentColor" stroke-width="1.5"/></svg></span><div class="agent-bubble"><span class="visually-hidden">Agent: </span>${html}</div>`
      : `<div class="agent-bubble"><span class="visually-hidden">You: </span>${html}</div>`;
    log.appendChild(el); scroll();
    return el;
  }
  function setChips(list) {
    chips.innerHTML = '';
    for (const q of list) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'agent-chip'; b.textContent = q;
      b.addEventListener('click', () => ask(q));
      chips.appendChild(b);
    }
  }
  async function ask(q) {
    q = String(q || '').trim();
    if (!q || busy) return;
    busy = true;
    addMsg('me', esc(q));
    input.value = '';
    const typing = addMsg('bot', `<span class="agent-typing${reduce ? ' still' : ''}" aria-label="The agent is writing"><i></i><i></i><i></i></span>`);
    typing.setAttribute('aria-hidden', 'true');
    const started = performance.now();
    let res;
    try { res = await agent.answer(q); } catch (e) { res = { html: render(FALLBACK), suggestions: SUGGESTED.slice(0, 6) }; }
    const plainLen = res.html.replace(/<[^>]+>/g, '').length;
    const wait = reduce ? 200 : Math.min(400 + 12 * plainLen, 1400);
    const left = wait - (performance.now() - started);
    if (left > 0) await new Promise(r => setTimeout(r, left));
    typing.remove();
    const m = addMsg('bot', res.html);
    m.dataset.intent = res.intent || '';
    setChips(res.suggestions && res.suggestions.length ? res.suggestions : SUGGESTED.slice(0, 4));
    busy = false;
  }
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  root.querySelector('.agent-reset').addEventListener('click', () => {
    agent.reset(); log.innerHTML = ''; greet(); input.focus();
  });
  function greet() {
    addMsg('bot', render('Hello. I am the Cinco Chaminés agent, a simulation with pre-written answers. Ask about the five homes, their simulated availability, or the live weather, sea, warnings and events for your dates.'));
    setChips(SUGGESTED.slice(0, 6));
  }
  greet();
  return { ask, agent };
}

// Auto-mount on /agent/, with ?q= deep links filled in and asked.
const rootEl = typeof document !== 'undefined' && document.getElementById('agent');
if (rootEl) {
  const ui = mountAgent(rootEl);
  const q = new URLSearchParams(location.search).get('q');
  if (q && ui) { const inp = rootEl.querySelector('.agent-input'); inp.value = q.slice(0, 300); ui.ask(q.slice(0, 300)); }
}
