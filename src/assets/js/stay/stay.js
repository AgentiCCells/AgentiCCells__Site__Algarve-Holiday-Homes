// stay/stay.js: the guest's stay (/stay/) of Cinco Chaminés, a made-up example. After the
// pretend payment the site turns to the experience (Dinis Cruz, 18 November 2026, about 17:20
// UTC): a day-by-day timeline of the booking with the simulated today marked, each day's REAL
// weather as IPMA issued it (or "no real forecast for this day yet"), real events nearby that day
// as the agendas publish them, a plan the guest builds (real events, invented suggestions,
// the agent's ideas, their own lines), getting there from Faro airport (general guidance),
// invented check-in details, messages to the simulated host and issue reports (both go to the
// store through the browser Agent Behaviour Policy guard and show in /admin/), and a review
// once the stay is over.
// State: the simulation in localStorage "cc.sim.v1" (store.js); the plan in localStorage
// "cc.stay.v1", tied to that simulation and cleared with it. Reads: data.promptugal.news (GET).
// Sends nothing. Design: team/rounds/3/design/PROPOSAL.md section 2. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance E), 2026-11-18, round 3.
import { sourceLine, forecastFor, warningsFor, seaFor, uvFor, eventsFor, home as getHome, fmtDay, fmtLocal, addDays, daysBetween, esc, forget, WEATHER_CLASS_URL } from '../data.js';
import { sim, ownBookings, currentStay, markEmbed, isEmbedded, chrome, kb, db, fmtSim, eur, ownLifecycle } from './sim-page.js';
import { SUGGESTIONS, GETTING_THERE, GETTING_THERE_NOTE, checkInFor, ISSUE_KINDS, URGENCY, RAIN_SWAP, looksOutdoor, glyphOf, planText, planICS, sortPlan, drierDay } from './content.js';
import { untrusted, detectInjection } from '../sim/abp.js';
import { hid, toMs, dayOf } from '../sim/util.js';

const app = document.getElementById('stay-app');
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDay = d => { const x = new Date(`${d}T12:00:00Z`); return `${WDL[x.getUTCDay()]} ${x.getUTCDate()} ${MONL[x.getUTCMonth()]}`; };
const plural = (n, a, b = `${a}s`) => `${n} ${n === 1 ? a : b}`;
const days = (from, to) => { const out = []; for (let d = from; d <= to; d = addDays(d, 1)) out.push(d); return out; };

let SIM = null;
const V = { id: null, day: null, tab: 'events', home: null, data: {}, dataFor: null, created: null, lastSeq: 0, draft: { msg: '', issueText: '', issueKind: 'hot water', urgency: 'medium', rating: 5, review: '' }, notice: '' };

const live = document.createElement('p');
live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.setAttribute('role', 'status');
document.body.append(live);
const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };

// ---------- the plan: localStorage "cc.stay.v1", tied to the simulation it belongs to ----------
const PLAN_KEY = 'cc.stay.v1';
let planMem = null;
function plans() {
  if (planMem && planMem.created === V.created) return planMem;
  let d = null;
  try { d = JSON.parse(globalThis.localStorage?.getItem(PLAN_KEY) || 'null'); } catch { d = null; }
  planMem = d && d.created === V.created && d.plans ? d : { created: V.created, plans: {} };
  return planMem;
}
function savePlans() { try { globalThis.localStorage?.setItem(PLAN_KEY, JSON.stringify(plans())); } catch { /* blocked: the plan lives in this page only */ } }
const planOf = id => (plans().plans[id] ||= {});
const dayPlan = (id, d) => (planOf(id)[d] ||= []);

// ---------- start ----------
async function start() {
  markEmbed();
  chrome('stay');
  try { SIM = await sim(); } catch (e) { app.innerHTML = `<p class="status fail">The simulation could not start in this browser (${esc(e.message)}).</p>`; return; }
  V.created = SIM.store.doc()?.created || 'none';
  V.lastSeq = SIM.store.getState().seq;
  try { V.id = new URLSearchParams(location.search).get('booking'); } catch { V.id = null; }
  render(true);
  SIM.store.subscribe(() => {
    const st = SIM.store.getState();
    if (st.seq < V.lastSeq) { V.created = SIM.store.doc()?.created || 'none'; planMem = null; }
    V.lastSeq = st.seq;
    if (!isEmbedded()) ownLifecycle(SIM);
    render(false);
  });
  SIM.bounds.then(() => render(false));
  if (!isEmbedded()) ownLifecycle(SIM);
}

function booking() {
  const st = SIM.store.getState();
  const mine = ownBookings(st, ['paid', 'checked-in', 'checked-out']);
  let b = V.id ? mine.find(x => x.id === V.id) : null;
  if (!b) b = currentStay(st);
  return b;
}

// ---------- the real data for one stay ----------
function loadData(b, home) {
  const key = `${b.id}|${b.from}|${b.to}`;
  if (V.dataFor === key) return;
  V.dataFor = key; V.data = {};
  const d = home.data || {};
  const put = k => r => { if (V.dataFor === key) { V.data[k] = r; render(false); } };
  const fail = k => e => put(k)({ res: { error: e.message || String(e), id: k } });
  forecastFor(d.forecast_id, b.from, b.to).then(put('fc'), fail('fc'));
  seaFor(d.sea_id).then(put('sea'), fail('sea'));
  (async () => {
    let r = await uvFor(d.uv_id);
    if (!r.res.error && !r.days.length && d.uv_fallback_id) r = { ...(await uvFor(d.uv_fallback_id)), fell: true };
    return r;
  })().then(put('uv'), fail('uv'));
  warningsFor(d.warnings_area || 'FAR', b.from, b.to).then(put('wa'), fail('wa'));
  eventsFor(d.events_place, b.from, b.to).then(put('ev'), fail('ev'));
}
const fcDay = date => V.data.fc?.days?.find(x => x.date === date) || null;
function eventsOn(date) {
  const items = V.data.ev?.items || [];
  return items.filter(e => { const s = String(e.start || '').slice(0, 10), en = String(e.end || e.start || '').slice(0, 10); return s && s <= date && en >= date; });
}
const evTime = (e, date) => {
  const s = String(e.start || ''), en = String(e.end || '');
  if (s.slice(0, 10) === date && /T\d\d:\d\d/.test(s)) return s.slice(11, 16);
  if (s.slice(0, 10) < date || (en && en.slice(0, 10) > date)) return 'running';
  return 'all day';
};
const evId = e => `ev-${hid('e', `${e.name}|${e.start}|${e.url || ''}`)}`;

// ---------- glyphs (drawn here, no picture files) ----------
function glyph(type, size = 26) {
  const g = glyphOf(type);
  const sun = '<circle cx="12" cy="11" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 17.3v2.2M3.5 11h2.2M18.3 11h2.2M6 5l1.5 1.5M16.5 15.5L18 17M6 17l1.5-1.5M16.5 6.5L18 5" stroke="currentColor" stroke-width="1.6"/>';
  const cloud = '<path d="M7 18h10.5a3.5 3.5 0 0 0 .3-7A5.2 5.2 0 0 0 7.8 10 4 4 0 0 0 7 18z" fill="var(--surface)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';
  const body = g === 'sun' ? sun : g === 'sun-cloud' ? `<g transform="translate(-3,-3) scale(.8)">${sun}</g>${cloud}` : g === 'cloud' ? cloud
    : g === 'rain' ? `<g transform="translate(0,-3)">${cloud}</g><path d="M8.5 18.5l-1 2.5M12.5 18.5l-1 2.5M16.5 18.5l-1 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`
    : g === 'fog' ? '<path d="M4 9h16M3 13h18M5 17h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' : '';
  return body ? `<svg class="glyph" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>` : '';
}

// ---------- rendering ----------
function keepFocus(fn) {
  const a = document.activeElement;
  const key = a && app.contains(a) ? (a.id ? `#${CSS.escape(a.id)}` : a.dataset?.key ? `[data-key="${CSS.escape(a.dataset.key)}"]` : null) : null;
  const sel = a && 'selectionStart' in a ? [a.selectionStart, a.selectionEnd] : null;
  fn();
  if (key) { const n = app.querySelector(key); if (n) { n.focus({ preventScroll: true }); if (sel && 'setSelectionRange' in n) { try { n.setSelectionRange(sel[0], sel[1]); } catch { /* not text */ } } } }
}
function render(first) {
  if (!SIM) return;
  keepFocus(() => { app.innerHTML = page(); wire(); });
  if (first && V.focusDay) app.querySelector(`.tl-day[data-day="${V.focusDay}"]`)?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
}

function page() {
  const st = SIM.store.getState();
  const b = booking();
  if (!b) return emptyState(st);
  const h = st.homes[b.homeId];
  if (!V.home || V.home.id !== b.homeId) {
    if (V.homeLoading !== b.homeId) { V.homeLoading = b.homeId; V.home = null; getHome(b.homeId).then(x => { V.home = x; V.homeLoading = null; if (x) { loadData(b, x); render(false); } }); }
  }
  else loadData(b, V.home);
  V.id = b.id;
  const today = SIM.clock.today();
  const stayDays = days(b.from, b.to);
  if (!V.day || !stayDays.includes(V.day)) V.day = stayDays.includes(today) ? today : today < b.from ? b.from : b.to;
  V.focusDay = V.day;
  return [picker(st, b), head(b, h, today, stayDays), timeline(b, h, today, stayDays),
    `<div class="stay-grid">
<div class="col col-day">${dayColumn(b, h, today)}</div>
<div class="col col-plan">${planColumn(b, h)}</div>
<div class="col col-side">${sideColumn(b, h, today)}</div>
</div>`].join('');
}

function emptyState(st) {
  const held = ownBookings(st, ['held']);
  const now = SIM.store.clock().now;
  return `<section class="stay-empty box">
<h1>Your stay</h1>
<p>There is no booking of yours in the simulation in this browser yet. Book one of the five invented homes (pretend: nothing is charged, nothing is sent), and this page turns into your trip: the days, the real weather as IPMA issued it, the real events nearby, and a plan you build.</p>
${held.length ? `<p>${kb('sim', 'Held')} You have a held booking (${esc(st.homes[held[0].homeId]?.name || '')}, ${esc(fmtDay(held[0].from))} to ${esc(fmtDay(held[0].to))}): finish the pretend payment on <a href="/homes/${encodeURIComponent(held[0].homeId)}/">its page</a>.</p>` : ''}
<p><a class="btn" href="/homes/">See the five homes</a> <a class="btn ghost" href="/play/">Try it side by side with the admin</a></p>
<p class="small">Simulated today: ${esc(fmtSim(now))}. Everything here lives in this browser only (localStorage); Reset clears it.</p>
</section>`;
}

function picker(st, b) {
  const mine = ownBookings(st, ['paid', 'checked-in', 'checked-out']);
  if (mine.length < 2) return '';
  return `<div class="stay-picker"><label for="pick-b">Your bookings in this browser</label> <select id="pick-b">${mine.map(x => `<option value="${esc(x.id)}"${x.id === b.id ? ' selected' : ''}>${esc(st.homes[x.homeId]?.name || x.homeId)}, ${esc(fmtDay(x.from))} to ${esc(fmtDay(x.to))} (${esc(x.status)})</option>`).join('')}</select></div>`;
}

function head(b, h, today, stayDays) {
  const pic = V.home?.images?.hero;
  const n = daysBetween(b.from, b.to);
  const g = b.guests || {};
  const dayN = stayDays.indexOf(today);
  const where = dayN >= 0 ? `day ${dayN + 1} of ${stayDays.length}` : today < b.from ? `starts in ${plural(daysBetween(today, b.from), 'day')}` : 'over';
  const paidAt = b.paidAt ? ` on ${fmtDay(dayOf(b.paidAt))}` : '';
  return `<header class="stay-head">
${pic ? `<img class="stay-pic" src="/assets/img/${esc(pic.src)}-800.jpg" alt="${esc(pic.alt)}" width="800" height="537">` : '<div class="stay-pic"></div>'}
<div class="stay-title">
<h1>Your stay at ${esc(h?.name || b.homeId)}, ${esc(h?.place || '')}</h1>
<p>${esc(longDay(b.from))} to ${esc(longDay(b.to))} ${esc(b.to.slice(0, 4))} · ${plural(n, 'night')} · ${plural(g.adults || 0, 'adult')}${g.children?.length ? `, ${plural(g.children.length, 'child', 'children')}` : ''} ${kb('sim', 'SIMULATED BOOKING')} ${pic ? kb('ai', 'AI PICTURE') : ''}</p>
<p class="clock-line small">Simulated today: <b>${esc(fmtSim(SIM.store.clock().now))}</b>
<button type="button" class="btn ghost small" data-clock="-1">Back one day</button> <button type="button" class="btn ghost small" data-clock="1">Forward one day</button>
<a href="/play/">or move it on the slider in Side by side</a></p>
</div>
<div class="stay-ref"><b>Booking <code>${esc(b.id)}</code></b><span>${b.paidAt ? `paid (pretend)${esc(paidAt)}` : ''}${b.status !== 'paid' ? ` · ${esc(b.status)}` : ''}</span><span>${esc(where)}</span><span>${eur(b.quote?.guestPays)} (invented)</span></div>
</header>`;
}

function timeline(b, h, today, stayDays) {
  const fc = V.data.fc;
  const cards = stayDays.map(d => {
    const w = fcDay(d);
    const past = d < today, isToday = d === today, sel = d === V.day;
    const evN = V.data.ev && !V.data.ev.res?.error ? eventsOn(d).length : null;
    const planN = (planOf(b.id)[d] || []).length;
    const tag = d === b.from ? '<span class="tl-tag">arrival</span>' : d === b.to ? '<span class="tl-tag">departure</span>' : '';
    const wx = !fc ? '<span class="tl-wx muted">reading...</span>'
      : fc.res?.error ? '<span class="tl-wx muted">not read</span>'
      : w ? `<span class="tl-wx">${glyph(w.weather_type, 20)}<b>${esc(Math.round(w.tmin))} / ${esc(Math.round(w.tmax))}°</b></span><span class="tl-meta">rain ${esc(w.rain_pct ?? '?')} %</span>`
      : '<span class="tl-none">No real forecast for this day yet</span>';
    const label = `${longDay(d)}${d === b.from ? ', arrival' : d === b.to ? ', departure' : ''}${isToday ? ', simulated today' : past ? ', past' : ''}${w ? `, ${Math.round(w.tmin)} to ${Math.round(w.tmax)} degrees, rain ${w.rain_pct ?? 'unknown'} percent` : ', no real forecast'}${evN !== null ? `, ${evN} events` : ''}, ${planN} in your plan`;
    return `<li><button type="button" class="tl-day${past ? ' past' : ''}${isToday ? ' today' : ''}" data-day="${d}" data-key="tl-${d}" aria-pressed="${sel}"${isToday ? ' aria-current="date"' : ''} aria-label="${esc(label)}">
${isToday ? '<span class="tl-flag">Simulated today</span>' : ''}${tag}<span class="tl-wd">${esc(WDL[new Date(`${d}T12:00:00Z`).getUTCDay()].slice(0, 3))}</span><span class="tl-date">${esc(fmtDay(d).slice(4))}</span>${wx}<span class="tl-meta">${evN === null ? '' : `${plural(evN, 'event')} · `}${planN} plan</span>${d === b.to ? `<span class="tl-meta">check-out ${esc(h?.check_out || '')}</span>` : ''}</button></li>`;
  }).join('');
  const place = V.home?.data?.forecast_name || 'Faro';
  const note = V.home?.data?.forecast_note && !/same/i.test(V.home.data.forecast_note) ? ` (nearest IPMA place to ${esc(h?.place || '')})` : '';
  const issued = fc?.place?.updated ? `, as issued ${esc(fmtLocal(fc.place.updated))} Portugal time` : '';
  const evTown = V.home?.data?.events_place ? `${V.home.data.events_place[0].toUpperCase()}${V.home.data.events_place.slice(1)} agenda` : 'local agenda';
  return `<section class="timeline" aria-labelledby="tl-h"><h2 id="tl-h" class="sr-only">Your stay, day by day</h2>
<ol class="tl">${cards}</ol>
<p class="tl-legend small">${kb('real')} weather: IPMA, ${esc(place)}${note}${issued}. Events: the ${esc(evTown)}. A dashed box means IPMA has not issued a forecast for that day: nothing is invented.</p>
</section>`;
}

function issuedAge(updated) {
  if (!updated) return '';
  const now = SIM.store.clock().now;
  const mins = Math.round((toMs(now) - toMs(String(updated).slice(0, 16))) / 60000);
  const span = m => { const a = Math.abs(m); const d = Math.floor(a / 1440), h = Math.floor((a % 1440) / 60); return d ? `${plural(d, 'day')}${h ? ` ${plural(h, 'hour')}` : ''}` : h ? plural(h, 'hour') : plural(a % 60, 'minute'); };
  return mins >= 0 ? `IPMA issued it ${esc(fmtLocal(updated))} (Portugal time), ${span(mins)} before the simulated now.`
    : `IPMA issued it ${esc(fmtLocal(updated))} (Portugal time), ${span(mins)} after the simulated now: this is the real forecast as published, which a guest at this simulated moment could not have read yet.`;
}

function dayColumn(b, h, today) {
  const d = V.day, fc = V.data.fc, w = fcDay(d);
  let wx;
  if (!fc) wx = '<p class="status loading" role="status">Reading IPMA\'s forecast...</p>';
  else if (fc.res?.error) wx = `<div class="status fail"><strong>IPMA's forecast could not be read just now</strong> (${esc(fc.res.error)}). Nothing is shown in its place. <button type="button" class="btn small" data-retry="ipma-city-forecasts">Try again</button></div>`;
  else if (w) {
    const sea = V.data.sea?.days?.find(x => x.date === d);
    const uv = V.data.uv?.days?.find(x => x.date === d);
    wx = `<div class="wx-big">${glyph(w.weather_type, 52)}<div><p class="wx-t">${esc(w.tmin)} to ${esc(w.tmax)} °C</p><p>${esc(w.weather)} (<a href="${WEATHER_CLASS_URL}">IPMA type ${esc(w.weather_type)}</a>), rain chance ${esc(w.rain_pct ?? '?')} %, wind ${esc(w.wind)}.</p></div></div>
<ul class="facts-row">
<li><span>Rain chance</span><b>${esc(w.rain_pct ?? '?')} %</b></li>
<li><span>Sea, ${esc(V.data.sea?.place?.name || 'coast')}</span><b>${sea ? `${esc(sea.temp_min)} to ${esc(sea.temp_max)} °C, waves ${esc(sea.waves_min)} to ${esc(sea.waves_max)} m` : V.data.sea ? 'no data' : 'reading...'}</b></li>
<li><span>UV${V.data.uv?.fell ? ', Faro' : ''}</span><b>${uv ? `${esc(uv.index)} ${esc(uv.band)}` : V.data.uv ? 'no data' : 'reading...'}</b></li>
</ul>
<p class="small">${issuedAge(fc.place?.updated)}${V.home?.data?.forecast_note && !/same/i.test(V.home.data.forecast_note) ? ` ${esc(V.home.data.forecast_note)}` : ''}${V.data.sea && !sea ? ' IPMA\'s sea forecast covers three days, so this day has none.' : ''}</p>
${sourceLine(fc.res, { issued: fc.place?.updated })}${V.data.sea && !V.data.sea.res?.error && sea ? sourceLine(V.data.sea.res, { terms: false }) : ''}`;
  } else {
    const first = fc.days?.[0]?.date || fc.last;
    const before = first && d < first;
    wx = `<p class="no-fc">${before ? `No real forecast read for this day: the live file starts on ${esc(fmtDay(first))}. IPMA did issue forecasts for earlier days, but this page reads only the live file, and nothing is invented.` : 'No real forecast for this day yet (IPMA gives five days ahead). It appears here once IPMA issues it; nothing is invented in its place.'}</p>${sourceLine(fc.res)}`;
  }
  const wa = V.data.wa;
  const now = SIM.store.clock().now;
  const warns = wa && !wa.res?.error ? wa.items.filter(x => String(x.start || '').slice(0, 10) <= d && String(x.end || x.start || '').slice(0, 10) >= d) : [];
  const warnHtml = warns.map(x => `<div class="warn-panel ${esc(x.level)}"><p><strong>${esc(x.level)} warning: ${esc(x.type)}</strong>, ${esc(fmtLocal(x.start))} to ${esc(fmtLocal(x.end))} (Portugal time), IPMA area FAR.${toMs(String(x.end).slice(0, 16)) < toMs(now) ? ' Over before the simulated now.' : ''}</p>${x.text ? `<p class="small"><span lang="pt">"${esc(x.text)}"</span> (IPMA, in Portuguese)</p>` : ''}</div>`).join('');
  return `<section class="card" aria-labelledby="day-h"><h2 id="day-h">${esc(longDay(d))} ${w ? kb('real', 'REAL FORECAST') : ''}</h2>
${wx}${warnHtml}${warns.length ? sourceLine(wa.res, { terms: false }) : ''}
</section>
${eventsCard(b, d)}`;
}

function eventsCard(b, d) {
  const ev = V.data.ev;
  const town = V.home?.data?.events_place ? `${V.home.data.events_place[0].toUpperCase()}${V.home.data.events_place.slice(1)}` : 'the town';
  let body;
  if (!ev) body = '<p class="status loading" role="status">Reading the events...</p>';
  else if (ev.res?.error) body = `<div class="status fail"><strong>The events list could not be read just now</strong> (${esc(ev.res.error)}). <button type="button" class="btn small" data-retry="events-pt">Try again</button></div>`;
  else {
    const list = eventsOn(d);
    const inPlan = new Set((planOf(b.id)[d] || []).map(x => x.ref));
    body = list.length ? `<ul class="ev-day">${list.slice(0, 12).map(e => {
      const t = evTime(e, d), id = evId(e), has = inPlan.has(id);
      return `<li><span class="ev-t">${esc(t)}</span><span class="ev-b">${e.url ? `<a href="${esc(e.url)}">${esc(e.name)}</a>` : esc(e.name)}<span class="small">${e.venue ? `${esc(e.venue)} · ` : ''}${esc(e.source_name)}</span></span>${has ? '<span class="in-plan">In plan</span>' : `<button type="button" class="btn ghost small" data-add-ev="${esc(id)}" data-key="add-${esc(id)}">Add</button>`}</li>`;
    }).join('')}</ul>${list.length > 12 ? `<p class="small">${list.length - 12} more on this day; see the agenda.</p>` : ''}`
      : `<p class="status empty">No events found in the ${esc(town)} agenda for this day. An empty list means no source lists one, not that nothing is on.</p>`;
    body += `${V.home?.data?.events_note ? `<p class="small">${esc(V.home.data.events_note)}</p>` : ''}<p class="small">Titles as the agendas publish them. Check times with the organiser.</p>${sourceLine(ev.res)}`;
  }
  return `<section class="card" aria-labelledby="ev-h"><h2 id="ev-h">On nearby that day ${kb('real', 'REAL EVENTS')}</h2>${body}</section>`;
}

// ---------- my plan ----------
function planColumn(b, h) {
  const d = V.day;
  const items = sortPlan(dayPlan(b.id, d));
  const kindBadge = it => it.kind === 'event' ? kb('real', 'REAL EVENT') : it.kind === 'own' ? '<span class="kb own">you wrote this</span>' : it.kind === 'agent' ? kb('sim', 'AGENT IDEA') : kb('inv', 'INVENTED SUGGESTION');
  const list = items.length ? `<ol class="plan">${items.map((it, i) => `<li class="plan-item${looksOutdoor(it) && (fcDay(d)?.rain_pct ?? 0) >= RAIN_SWAP ? ' wet' : ''}">
<label class="sr-only" for="t-${esc(it.id)}">Time for ${esc(it.title)}</label><input type="time" id="t-${esc(it.id)}" class="pt" data-time="${esc(it.id)}" value="${esc(it.time || '')}">
<span class="pi-b"><span>${it.url ? `<a href="${esc(it.url)}">${esc(it.title)}</a>` : esc(it.title)}</span>${kindBadge(it)}${it.note ? `<span class="small">${esc(it.note)}</span>` : ''}</span>
<span class="pi-tools"><button type="button" class="ibtn" data-move="${esc(it.id)}" data-by="-1" data-key="up-${esc(it.id)}" aria-label="Earlier: ${esc(it.title)}"${i === 0 ? ' disabled' : ''}>&uarr;</button><button type="button" class="ibtn" data-move="${esc(it.id)}" data-by="1" data-key="dn-${esc(it.id)}" aria-label="Later: ${esc(it.title)}"${i === items.length - 1 ? ' disabled' : ''}>&darr;</button><button type="button" class="ibtn" data-remove="${esc(it.id)}" data-key="rm-${esc(it.id)}" aria-label="Remove: ${esc(it.title)}">&times;</button></span>
</li>`).join('')}</ol>` : '<p class="status empty">Nothing planned for this day yet. Add a real event, a suggestion or your own line below.</p>';
  return `<section class="card" aria-labelledby="plan-h"><h2 id="plan-h">My plan for ${esc(WDL[new Date(`${d}T12:00:00Z`).getUTCDay()])} ${kb('sim', 'YOUR PLAN, KEPT IN THIS BROWSER')}</h2>
${list}
${agentNote(b, d)}
${tabs(b, h, d)}
<p class="small dl"><button type="button" class="btn ghost small" data-dl="txt">Download my plan (.txt)</button> <button type="button" class="btn ghost small" data-dl="ics">Download my plan (.ics)</button> Built in this page and saved on your device; nothing is uploaded.</p>
</section>`;
}

// The agent's note: rain at least 60 percent in IPMA's real forecast and an outdoor item in the
// plan: propose moving it to the driest other day with a real forecast. The agent never changes the plan itself.
function agentNote(b, d) {
  const w = fcDay(d);
  if (!w || (w.rain_pct ?? 0) < RAIN_SWAP) return '';
  const wet = sortPlan(dayPlan(b.id, d)).find(looksOutdoor);
  if (!wet) return '';
  const stay = days(b.from, b.to).map(x => ({ date: x, rain: fcDay(x)?.rain_pct ?? null }));
  const dry = drierDay(stay, d);
  const text = dry ? `IPMA gives ${w.rain_pct} % rain on ${fmtDay(d)} and ${dry.rain} % on ${fmtDay(dry.date)}. Move "${wet.title}" to ${fmtDay(dry.date)}?`
    : `IPMA gives ${w.rain_pct} % rain on ${fmtDay(d)}, and no other day of your stay has a drier real forecast yet. Keep "${wet.title}", or look at the day's indoor events.`;
  return `<div class="agent-note"><p><strong>Chaminé, the site's agent</strong> ${kb('sim', 'SIMULATED, SCRIPTED')}</p><p>${esc(text)}</p>
<p>${dry ? `<button type="button" class="btn small" data-swap="${esc(wet.id)}" data-to="${esc(dry.date)}">Move it</button> ` : ''}<button type="button" class="btn ghost small" data-keep="${esc(wet.id)}">Keep my plan</button> ${db({ decision: 'ask', rule: 'you decide' })}</p>
<p class="small">The agent changes your plan only when you say so. "Outdoor" is a guess from the kind of suggestion or words in the event's title.</p></div>`;
}

function tabs(b, h, d) {
  const T = [['events', 'Events (real)'], ['out', 'Beaches and walks'], ['food', 'Food and indoors'], ['agent', "Agent's ideas"], ['own', 'Write your own']];
  const panel = tabPanel(b, h, d);
  return `<div class="tabs" role="tablist" aria-label="Add to your plan">${T.map(([k, t]) => `<button type="button" role="tab" id="tab-${k}" aria-controls="tabp" aria-selected="${V.tab === k}" tabindex="${V.tab === k ? 0 : -1}" data-tab="${k}">${esc(t)}</button>`).join('')}</div>
<div class="tabp" id="tabp" role="tabpanel" aria-labelledby="tab-${V.tab}">${panel}</div>`;
}
function addRow(title, badge, attrs, note = '', inPlan = false) {
  return `<li><span class="pi-b"><span>${title}</span>${badge}${note ? `<span class="small">${note}</span>` : ''}</span>${inPlan ? '<span class="in-plan">In plan</span>' : `<button type="button" class="btn ghost small" ${attrs}>Add</button>`}</li>`;
}
function tabPanel(b, h, d) {
  const inPlan = new Set(dayPlan(b.id, d).map(x => x.ref));
  const sugg = SUGGESTIONS[b.homeId] || [];
  if (V.tab === 'events') {
    if (!V.data.ev || V.data.ev.res?.error) return '<p class="small">The events are listed in "On nearby that day"; they could not be read just now.</p>';
    const list = eventsOn(d);
    return list.length ? `<ul class="add-list">${list.slice(0, 8).map(e => addRow(`${esc(evTime(e, d))} · ${esc(e.name)}`, kb('real', 'REAL EVENT'), `data-add-ev="${esc(evId(e))}" data-key="tadd-${esc(evId(e))}"`, esc(e.source_name), inPlan.has(evId(e)))).join('')}</ul>` : '<p class="status empty">No real events listed for this day.</p>';
  }
  if (V.tab === 'out' || V.tab === 'food') {
    const pick = sugg.filter(s => (V.tab === 'out' ? s.outdoor : !s.outdoor));
    return `<ul class="add-list">${pick.map(s => addRow(`${esc(s.time)} · ${esc(s.title)}`, kb('inv', 'INVENTED SUGGESTION'), `data-add-s="${esc(s.id)}" data-key="sadd-${esc(s.id)}"`, esc(s.note), inPlan.has(s.id))).join('')}</ul><p class="small">Suggestions written by the team for an invented house. Real places are named only as places; no business is named or recommended.</p>`;
  }
  if (V.tab === 'agent') return agentIdeas(b, d, inPlan);
  return `<form class="own-form" id="own-form" autocomplete="off" novalidate>
<div class="form-row"><label for="own-time">Time</label><input type="time" id="own-time" value="12:00"></div>
<div class="form-row"><label for="own-text">What</label><input type="text" id="own-text" maxlength="80" placeholder="Kept in this browser only"></div>
<label class="small"><input type="checkbox" id="own-out"> Outdoors (the agent will watch the rain)</label>
<div class="actions"><button type="submit" class="btn small">Add to my plan</button></div></form>`;
}
function agentIdeas(b, d, inPlan) {
  const w = fcDay(d);
  const sugg = SUGGESTIONS[b.homeId] || [];
  const evs = V.data.ev && !V.data.ev.res?.error ? eventsOn(d) : [];
  let lead, picks;
  if (!w) { lead = `No real forecast for ${fmtDay(d)} yet, so the agent gives no weather advice. Here are the day's real events and one idea.`; picks = sugg.slice(0, 1); }
  else if ((w.rain_pct ?? 0) >= RAIN_SWAP) { lead = `IPMA gives ${w.rain_pct} % rain on ${fmtDay(d)}: ideas under a roof.`; picks = sugg.filter(s => !s.outdoor); }
  else { lead = `IPMA gives ${w.rain_pct ?? '?'} % rain and ${w.tmax} °C on ${fmtDay(d)}: a day for outside.`; picks = sugg.filter(s => s.outdoor).slice(0, 3); }
  const evPicks = ((w && (w.rain_pct ?? 0) >= RAIN_SWAP) ? evs.filter(e => !looksOutdoor({ kind: 'event', title: e.name })) : evs).slice(0, 3);
  return `<p><strong>Chaminé</strong> ${kb('sim', 'SIMULATED, SCRIPTED')}: ${esc(lead)}</p><ul class="add-list">
${evPicks.map(e => addRow(`${esc(evTime(e, d))} · ${esc(e.name)}`, kb('real', 'REAL EVENT'), `data-add-ev="${esc(evId(e))}" data-key="aadd-${esc(evId(e))}"`, esc(e.source_name), inPlan.has(evId(e)))).join('')}
${picks.map(s => addRow(`${esc(s.time)} · ${esc(s.title)}`, kb('inv', 'INVENTED SUGGESTION'), `data-add-s="${esc(s.id)}" data-agent="1" data-key="asadd-${esc(s.id)}"`, esc(s.note), inPlan.has(s.id))).join('')}
</ul><p class="small">Scripted rules (rain at least ${RAIN_SWAP} % in IPMA's real forecast means indoors), not a live model.</p>`;
}

// ---------- the stay details column ----------
function sideColumn(b, h, today) {
  const ci = checkInFor(h);
  const gt = GETTING_THERE[b.homeId];
  const st = SIM.store.getState();
  const msgs = st.messages.filter(m => m.bookingId === b.id).slice(-8);
  const issues = Object.values(st.issues).filter(i => i.bookingId === b.id);
  const reviewed = st.reviews.find(r => r.bookingId === b.id);
  const canReview = today >= b.to || b.status === 'checked-out';
  const active = ['paid', 'checked-in'].includes(b.status);
  return `<section class="card" aria-labelledby="ci-h"><h2 id="ci-h">Check-in ${kb('inv')}</h2>
<dl class="kv"><dt>Check-in</dt><dd>from ${esc(ci.checkIn)} (${esc(fmtDay(b.from))})</dd><dt>Check-out</dt><dd>by ${esc(ci.checkOut)} (${esc(fmtDay(b.to))})</dd><dt>Key</dt><dd>${esc(ci.key)}</dd><dt>Wi-fi</dt><dd>${esc(ci.wifi)}</dd><dt>Address</dt><dd>${esc(ci.address)}</dd><dt>Status</dt><dd>${esc(b.status)}${b.checkedInAt ? `, checked in ${esc(fmtSim(b.checkedInAt))}` : ''}${b.checkedOutAt ? `, checked out ${esc(fmtSim(b.checkedOutAt))}` : ''}</dd></dl>
</section>
<section class="card" aria-labelledby="gt-h"><h2 id="gt-h">Getting there from Faro airport</h2>
${gt ? `<ol class="gt"><li><b>By car:</b> ${esc(gt.car)}</li><li><b>By train or bus:</b> ${esc(gt.train)}</li><li><b>By taxi or transfer:</b> ${esc(gt.taxi)}</li></ol>` : ''}
<p class="small">${kb('inv', 'GENERAL GUIDANCE')} ${esc(GETTING_THERE_NOTE)}</p>
</section>
<section class="card" aria-labelledby="need-h"><h2 id="need-h">Need something?</h2>
<h3>Message the host ${kb('sim')}</h3>
${msgs.length ? `<ol class="thread">${msgs.map(m => `<li class="${m.from === 'guest' ? 'me' : 'host'}"><span class="small">${m.from === 'guest' ? 'You' : 'Host (simulated)'} · ${esc(fmtSim(m.at))}</span>${esc(m.text)}</li>`).join('')}</ol>` : '<p class="small">No messages yet. The simulated host answers on a script about 20 simulated minutes later.</p>'}
${active ? `<form id="msg-form" class="mini-form" autocomplete="off" novalidate><label for="msg-text">Your message</label><textarea id="msg-text" rows="2" maxlength="300" placeholder="Kept in this browser only">${esc(V.draft.msg)}</textarea><button type="submit" class="btn small">Send to the host (simulated)</button></form>` : '<p class="small">Messages open while the stay is booked or under way.</p>'}
<h3>Report an issue ${kb('sim')}</h3>
${issues.length ? `<ul class="issues">${issues.map(i => `<li><b>${esc(i.type)}</b> (${esc(i.severity)}): ${esc(i.status === 'resolved' ? 'fixed' : i.status === 'open' ? 'new' : i.status)}${i.resolvedAt ? `, ${esc(fmtSim(i.resolvedAt))}` : ''}</li>`).join('')}</ul>` : ''}
${active ? `<form id="issue-form" class="mini-form" autocomplete="off" novalidate>
<div class="form-row"><label for="is-kind">What</label><select id="is-kind">${ISSUE_KINDS.map(k => `<option value="${esc(k.id)}"${V.draft.issueKind === k.id ? ' selected' : ''}>${esc(k.label)}</option>`).join('')}</select></div>
<div class="form-row"><label for="is-urg">How urgent</label><select id="is-urg">${URGENCY.map(u => `<option value="${u.id}"${V.draft.urgency === u.id ? ' selected' : ''}>${esc(u.label)}</option>`).join('')}</select></div>
<div class="form-row"><label for="is-text">Details (optional)</label><textarea id="is-text" rows="2" maxlength="300">${esc(V.draft.issueText)}</textarea></div>
<button type="submit" class="btn small">Report it (simulated)</button></form>` : ''}
<p class="small">Messages and issues go to the simulated host in Admin, through the browser policy guard. Text you type is marked untrusted there: the host's assistant never acts on instructions in it.</p>
${V.notice ? `<p class="notice" role="status">${V.notice}</p>` : ''}
</section>
<section class="card" aria-labelledby="rv-h"><h2 id="rv-h">Review</h2>
${reviewed ? `<p>${kb('sim', 'SIMULATED REVIEW')} You gave ${esc(reviewed.rating)} out of 5: "${esc(reviewed.text)}". It shows in Admin, Reviews.</p>`
    : canReview ? `<form id="rv-form" class="mini-form" autocomplete="off" novalidate><fieldset><legend>Your rating</legend>${[1, 2, 3, 4, 5].map(n => `<label class="rate"><input type="radio" name="rating" value="${n}"${Number(V.draft.rating) === n ? ' checked' : ''}> ${n}</label>`).join('')}</fieldset>
<label for="rv-text">Your review</label><textarea id="rv-text" rows="3" maxlength="400">${esc(V.draft.review)}</textarea><button type="submit" class="btn small">Post the review (simulated)</button>
<p class="small">Stored in this browser and shown in Admin, marked simulated.</p></form>`
    : `<p class="locked">Opens on ${esc(longDay(b.to))}, the day you leave. Your review is stored in this browser and shown in Admin, marked ${kb('sim')}.</p>`}
</section>`;
}

// ---------- actions ----------
function addItem(b, d, item) {
  const list = dayPlan(b.id, d);
  if (item.ref && list.some(x => x.ref === item.ref)) return;
  list.push({ id: hid('p', `${item.ref || item.title}|${Date.now()}|${list.length}`), order: list.length, ...item });
  savePlans(); render(false); say(`Added to your plan for ${fmtDay(d)}: ${item.title}.`);
}
function guestCtx(b, text, source) {
  return { who: 'visitor', target: b.id, ownGuestId: b.guestId, subjectGuestId: b.guestId, provenance: text ? [untrusted(source, text, 'data')] : [] };
}
function wire() {
  const b = booking();
  app.querySelector('#pick-b')?.addEventListener('change', e => { V.id = e.target.value; V.day = null; V.dataFor = null; V.home = null; render(false); try { history.replaceState(null, '', `?booking=${encodeURIComponent(V.id)}`); } catch { /* no history */ } });
  app.querySelectorAll('[data-clock]').forEach(x => x.addEventListener('click', () => {
    const t = SIM.clock.today(); SIM.clock.setDay(addDays(t, Number(x.dataset.clock)));
    say(`Simulated today: ${fmtSim(SIM.store.clock().now)}.`);
  }));
  if (!b) return;
  app.querySelectorAll('.tl-day').forEach(x => x.addEventListener('click', () => { V.day = x.dataset.day; render(false); app.querySelector(`.tl-day[data-day="${V.day}"]`)?.focus(); }));
  app.querySelectorAll('[data-retry]').forEach(x => x.addEventListener('click', () => { forget(x.dataset.retry); V.dataFor = null; render(false); }));
  const findEv = id => (V.data.ev?.items || []).find(e => evId(e) === id);
  app.querySelectorAll('[data-add-ev]').forEach(x => x.addEventListener('click', () => {
    const e = findEv(x.dataset.addEv); if (!e) return;
    const t = evTime(e, V.day);
    addItem(b, V.day, { ref: x.dataset.addEv, kind: 'event', title: e.name, time: /^\d\d:\d\d$/.test(t) ? t : '', url: e.url || null, note: `${e.venue ? `${e.venue}, ` : ''}${e.source_name}` });
  }));
  app.querySelectorAll('[data-add-s]').forEach(x => x.addEventListener('click', () => {
    const s = (SUGGESTIONS[b.homeId] || []).find(y => y.id === x.dataset.addS); if (!s) return;
    addItem(b, V.day, { ref: s.id, kind: 'invented', title: s.title, time: s.time, outdoor: s.outdoor, note: s.note });
  }));
  app.querySelectorAll('[data-time]').forEach(x => x.addEventListener('change', () => {
    const it = dayPlan(b.id, V.day).find(y => y.id === x.dataset.time); if (!it) return;
    it.time = x.value; savePlans(); render(false);
  }));
  app.querySelectorAll('[data-move]').forEach(x => x.addEventListener('click', () => {
    const list = sortPlan(dayPlan(b.id, V.day)); const i = list.findIndex(y => y.id === x.dataset.move); const j = i + Number(x.dataset.by);
    if (i < 0 || j < 0 || j >= list.length) return;
    const [a, c] = [list[i], list[j]]; [a.time, c.time] = [c.time, a.time]; [a.order, c.order] = [c.order, a.order];
    savePlans(); render(false); app.querySelector(`[data-move="${a.id}"][data-by="${x.dataset.by}"]:not([disabled])`)?.focus() || app.querySelector(`[data-move="${a.id}"]`)?.focus();
    say(`Moved ${a.title} ${Number(x.dataset.by) < 0 ? 'earlier' : 'later'}.`);
  }));
  app.querySelectorAll('[data-remove]').forEach(x => x.addEventListener('click', () => {
    const list = dayPlan(b.id, V.day); const i = list.findIndex(y => y.id === x.dataset.remove); if (i < 0) return;
    const [gone] = list.splice(i, 1); savePlans(); render(false); app.querySelector('#plan-h')?.focus?.(); say(`Removed ${gone.title}.`);
  }));
  app.querySelectorAll('[data-swap]').forEach(x => x.addEventListener('click', () => {
    const list = dayPlan(b.id, V.day); const i = list.findIndex(y => y.id === x.dataset.swap); if (i < 0) return;
    const [it] = list.splice(i, 1); dayPlan(b.id, x.dataset.to).push(it); savePlans();
    say(`Moved ${it.title} to ${fmtDay(x.dataset.to)}.`); render(false);
  }));
  app.querySelectorAll('[data-keep]').forEach(x => x.addEventListener('click', () => {
    const it = dayPlan(b.id, V.day).find(y => y.id === x.dataset.keep); if (it) { it.outdoor = false; it.kept = true; if (it.kind === 'event') it.kind = 'event'; savePlans(); }
    say('Kept your plan as it is.'); render(false);
  }));
  const tabsEl = app.querySelectorAll('[role="tab"]');
  tabsEl.forEach((x, i) => {
    x.addEventListener('click', () => { V.tab = x.dataset.tab; render(false); app.querySelector(`#tab-${V.tab}`)?.focus(); });
    x.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault(); const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabsEl.length - 1 : (i + k + tabsEl.length) % tabsEl.length;
      V.tab = tabsEl[n].dataset.tab; render(false); app.querySelector(`#tab-${V.tab}`)?.focus();
    });
  });
  app.querySelector('#own-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const t = app.querySelector('#own-text').value.trim(); if (!t) { say('Write what you plan first.'); return; }
    addItem(b, V.day, { kind: 'own', title: t, time: app.querySelector('#own-time').value, outdoor: app.querySelector('#own-out').checked });
  });
  app.querySelectorAll('[data-dl]').forEach(x => x.addEventListener('click', () => {
    const h = SIM.store.getState().homes[b.homeId]?.name || b.homeId;
    const ics = x.dataset.dl === 'ics';
    const text = ics ? planICS(b, h, planOf(b.id)) : planText(b, h, planOf(b.id));
    const url = URL.createObjectURL(new Blob([text], { type: ics ? 'text/calendar' : 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = `my-plan-${b.from}.${ics ? 'ics' : 'txt'}`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
  // drafts survive re-rendering
  const keepDraft = (sel, k) => app.querySelector(sel)?.addEventListener('input', e => { V.draft[k] = e.target.value; });
  keepDraft('#msg-text', 'msg'); keepDraft('#is-text', 'issueText'); keepDraft('#rv-text', 'review');
  app.querySelector('#is-kind')?.addEventListener('change', e => { V.draft.issueKind = e.target.value; });
  app.querySelector('#is-urg')?.addEventListener('change', e => { V.draft.urgency = e.target.value; });
  app.querySelectorAll('input[name="rating"]').forEach(r => r.addEventListener('change', () => { V.draft.rating = Number(r.value); }));

  app.querySelector('#msg-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const text = V.draft.msg.trim(); if (!text) { say('Write a message first.'); return; }
    const d = SIM.guard('visitor', 'message.send', guestCtx(b, text, 'guest message'));
    if (d.decision !== 'allow') { V.notice = `${db(d)} The policy did not pass this message: ${esc(d.reason)} It is logged; nothing was sent.`; render(false); say(`Refused: ${d.reason}`); return; }
    SIM.store.dispatch({ type: 'message.added', actor: 'visitor', data: { message: { id: hid('m', `${b.id}|${SIM.store.getState().seq}|${text}`), from: 'guest', who: 'visitor', bookingId: b.id, homeId: b.homeId, text, trusted: false, flagged: detectInjection(text).flagged } } });
    V.draft.msg = ''; V.notice = `${db(d)} Sent to the simulated host in Admin (in this browser only).`; render(false); say('Message sent to the simulated host.');
  });
  app.querySelector('#issue-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const kind = ISSUE_KINDS.find(k => k.id === V.draft.issueKind) || ISSUE_KINDS[0];
    const text = V.draft.issueText.trim();
    const d = SIM.guard('visitor', 'issue.raise', guestCtx(b, text, 'guest issue report'));
    if (d.decision !== 'allow') { V.notice = `${db(d)} The policy did not pass this report: ${esc(d.reason)}`; render(false); say(`Refused: ${d.reason}`); return; }
    const issue = { id: hid('i', `${b.id}|${SIM.store.getState().seq}|${kind.id}`), homeId: b.homeId, bookingId: b.id, type: kind.id, severity: V.draft.urgency, cost: kind.cost, reportedBy: 'visitor', text: text || `${kind.label} (reported by the guest)`, trusted: false };
    SIM.store.dispatch({ type: 'issue.raised', actor: 'visitor', data: { issue } });
    V.draft.issueText = ''; V.notice = `${db(d)} Reported: "${esc(kind.label)}" is now in Admin, Issues.`; render(false); say('Issue reported to the simulated host.');
  });
  app.querySelector('#rv-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const text = V.draft.review.trim(); if (!text) { say('Write a few words for the review first.'); return; }
    const d = SIM.guard('visitor', 'review.post', guestCtx(b, text, 'guest review'));
    if (d.decision !== 'allow') { V.notice = `${db(d)} The policy did not pass this review: ${esc(d.reason)}`; render(false); say(`Refused: ${d.reason}`); return; }
    const st = SIM.store.getState();
    SIM.store.dispatch({ type: 'review.added', actor: 'visitor', data: { review: { id: hid('r', b.id), homeId: b.homeId, bookingId: b.id, rating: V.draft.rating, text, author: 'visitor', authorName: st.guests[b.guestId]?.name || 'You', trusted: false, flagged: detectInjection(text).flagged } } });
    V.draft.review = ''; render(false); say('Review posted in the simulation.');
  });
}

start();
