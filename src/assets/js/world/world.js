// world/world.js: /world/ of the Cinco Chaminés simulation (a made-up example), played like a
// small board game. Invented people (team/rounds/2/research/cast.json, drawn by sim/figure.js)
// arrive, ask the site's agent, book, fly to Faro, stay in the five invented homes, have good
// and bad days and leave reviews; invented admins run the homes. The engine is sim/personas.js
// step(), run for every simulated hour this page passes, on the shared store
// (localStorage["cc.sim.v1"]), so /admin/ in another tab sees the same bookings.
// Speeds: pause, 1x (an hour every 10 s), 10x, 100x, and very fast (whole days computed, no
// figures walking). Days stay inside the real-data window (sim/clock.js); weather in bubbles
// only from IPMA's real forecast, otherwise the bubble says there is none.
// Reads this site's files and data.promptugal.news; sends nothing. Code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance F), 2026-11-18, round 3.

import { bookingsList, START } from '../sim/store.js';
import { FALLBACK_BOUNDS, loadBounds } from '../sim/clock.js';
import { createWorld, loadCast, PROFILES } from '../sim/personas.js';
import { figureFor } from '../sim/figure.js';
import { pnl } from '../sim/money.js';
import { nightTakenBy } from '../sim/booking.js';
import { SAFE_ACTIONS } from '../sim/abp.js';
import { esc, addDays, dayOf, daysBetween, toMs } from '../sim/util.js';
import { mountFrame, kindBadge, decisionChip } from './frame.js';

const $ = id => document.getElementById(id);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const eur = n => `€${Math.round(Number(n) || 0).toLocaleString('en-GB')}`;
const fmtDay = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// ---------- the stage's geometry (viewBox 1000 x 560) ----------
const STOPS = { arrivals: 90, website: 300, airport: 520, leaving: 730, team: 910 };
const WALK_Y = 152;
const HOME_X = { cape: 110, harbour: 300, hill: 500, lagoon: 700, salt: 890 }; // west to east
const HOME_Y = 338, FEET_Y = 392;
const SLOTS = [64, -64, 84, -84, 46, -46];

// ---------- state ----------
let store, clock, world, cast, homesFile = [], bounds = FALLBACK_BOUNDS;
let speed = 0, vfTimer = null, vfStart = 0, vfFromDay = null;
let selected = null, dirty = true, lastRender = 0, lastAdvance = 0, carry = 0;
const forecast = { ok: null, byCity: {} }; // ok: null reading, true read, false failed

// ---------- boot ----------
boot().catch(e => { const n = $('w-note'); if (n) n.textContent = `The world could not start: ${e.message}`; });

async function boot() {
  try { const r = await fetch('/data/homes.json'); if (r.ok) homesFile = (await r.json()).homes || []; } catch { /* the store's own list is used */ }
  const sim = await mountFrame('world', { homes: homesFile.length ? homesFile : null });
  store = sim.store; clock = sim.clock;
  cast = await loadCast();
  world = createWorld({ store, clock, cast, weatherFor: regionWeather }).attach();
  world.onEvents(onWorldEvents);
  drawBackground();
  drawRail();
  wire();
  store.subscribe((s, info) => { dirty = true; if (info.kind === 'reset') { stopVF(); clearActors(); drawRail(); } });
  setSpeed(0);
  dirty = true;
  requestAnimationFrame(frame);
  new ResizeObserver(scaleStage).observe($('stage'));
  scaleStage();
  // The real-data window and IPMA's forecast, read in the background.
  loadBounds().then(b => { bounds = b; clock.setBounds(b); dirty = true; }).catch(() => {});
  readForecast();
}

async function readForecast() {
  try {
    const { getSource } = await import('../data.js');
    const res = await getSource('ipma-city-forecasts');
    const cities = res?.latest?.cities || [];
    if (!cities.length) throw new Error('no cities');
    for (const c of cities) forecast.byCity[Number(c.id)] = Object.fromEntries((c.days || []).map(d => [d.date, { rain_pct: d.rain_prob_pct ?? null, tmin: d.t_min_c ?? null, tmax: d.t_max_c ?? null, weather_type: d.weather_type ?? null }]));
    forecast.ok = true;
    forecast.read = new Date().toISOString().slice(11, 16);
  } catch { forecast.ok = false; }
}
const cityOf = homeId => Number((homesFile.find(h => h.id === homeId) || {}).data?.forecast_id) || 1080500;
const weatherAt = (homeId, date) => forecast.byCity[cityOf(homeId)]?.[date] || null;
// For reviews the engine asks one value per date: Faro's (the region's airport city), real or nothing.
function regionWeather(date) { return forecast.byCity[1080500]?.[date] || null; }

// ---------- controls ----------
function wire() {
  document.querySelectorAll('.w-speed button').forEach(b => b.addEventListener('click', () => setSpeed(b.dataset.speed === 'vf' ? 'vf' : Number(b.dataset.speed))));
  $('seed-form').addEventListener('submit', e => { e.preventDefault(); const v = $('seed-in').value.trim(); if (v) newRun(v); });
  $('seed-new').addEventListener('click', () => newRun(`cc-${String(Math.floor(Math.random() * 9000) + 1000)}`));
  $('export').addEventListener('click', exportRun);
  const tabs = [...document.querySelectorAll('.w-tabs [role=tab]')];
  const pick = t => {
    for (const x of tabs) { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $(x.getAttribute('aria-controls')).classList.toggle('on', on); }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', e => { const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (k) { const n = tabs[(i + k + tabs.length) % tabs.length]; pick(n); n.focus(); } });
  });
  pick(tabs[0]);
}

function newRun(seed) {
  setSpeed(0);
  clearActors();
  store.reset(seed);
  selected = null;
  $('profile').innerHTML = '<h2 id="profile-h">A person in the world</h2><p class="mini">Choose someone in the row of people below.</p>';
  note(`New run with seed ${seed}: the simulation in this browser was reset to ${fmtDay(dayOf(START))}.`);
}

function setSpeed(sp) {
  stopVF();
  speed = sp;
  document.querySelectorAll('.w-speed button').forEach(b => b.setAttribute('aria-pressed', String(String(sp) === b.dataset.speed)));
  $('vf-msg').hidden = sp !== 'vf';
  $('stage').classList.toggle('vf', sp === 'vf');
  lastAdvance = performance.now(); carry = 0;
  if (sp === 'vf') startVF();
  else if (sp > 0 && atEnd()) note('This run has reached the end of the real-data window. Start a new seed to play again.');
}
const atEnd = () => toMs(clock.now()) >= toMs(`${clock.bounds().to}T23:00`);

// Very fast: one whole day a tick, no walking figures; the panels redraw after every day.
function startVF() {
  clearActors();
  vfStart = performance.now(); vfFromDay = clock.today();
  const tick = () => {
    if (speed !== 'vf') return;
    if (atEnd()) { finishVF(); return; }
    clock.advance(24 * 60);
    render(true);
    vfTimer = setTimeout(tick, 40);
  };
  vfTimer = setTimeout(tick, 0);
}
function finishVF() {
  const days = daysBetween(vfFromDay, clock.today()), secs = ((performance.now() - vfStart) / 1000).toFixed(1);
  note(`Very fast: ${days} simulated days computed in ${secs} s; the run reached the end of the real-data window (${fmtDay(clock.bounds().to)}).`);
  document.body.dataset.vfDone = `${days}|${secs}`;
  setSpeed(0);
}
function stopVF() { if (vfTimer) clearTimeout(vfTimer); vfTimer = null; }
function note(t) { $('w-note').textContent = t; }

// ---------- the loop ----------
// Animated speeds: simulated minutes per real second. 1x = one hour every 10 s.
const MIN_PER_SEC = { 1: 6, 10: 60, 100: 600 };
function frame(t) {
  if (typeof speed === 'number' && speed > 0) {
    const gap = speed === 100 ? 250 : 400;
    if (t - lastAdvance >= gap) {
      carry += ((t - lastAdvance) / 1000) * MIN_PER_SEC[speed];
      lastAdvance = t;
      const whole = Math.floor(carry);
      if (whole >= 1) {
        carry -= whole;
        if (atEnd()) { setSpeed(0); note('The run reached the end of the real-data window. Start a new seed to play again.'); }
        else { batchFrom = clock.now(); clock.advance(whole); }
      }
    }
  }
  animate(t);
  if (dirty && t - lastRender > (speed === 'vf' ? 120 : 250)) render();
  requestAnimationFrame(frame);
}
let batchFrom = null;

// ---------- the stage ----------
function scaleStage() {
  const st = $('stage'), k = st.clientWidth / 1000;
  st.style.setProperty('--k', k.toFixed(4));
  st.style.setProperty('--inv', Math.max(1, 0.95 / k).toFixed(3));
}

function drawBackground() {
  const homes = ['cape', 'harbour', 'hill', 'lagoon', 'salt'];
  const byId = Object.fromEntries(homesFile.map(h => [h.id, h]));
  const stop = (x, name, sub) => `<g><rect x="${x - 68}" y="168" width="136" height="48" rx="8" fill="#fff" stroke="#23262b" stroke-width="2"/><text x="${x}" y="189" text-anchor="middle" class="sn">${esc(name)}</text><text x="${x}" y="207" text-anchor="middle" class="ss">${esc(sub)}</text></g>`;
  const arrow = (a, b) => `<path d="M${a + 74} 192 H${b - 78}" stroke="#545A62" stroke-width="2" stroke-dasharray="6 6"/><path d="M${b - 84} 186 l8 6 -8 6" fill="none" stroke="#545A62" stroke-width="2"/>`;
  const waves = Array.from({ length: 8 }, (_, i) => `<path d="M0 ${480 + i * 18} ${Array.from({ length: 26 }, (_, j) => `q ${20} ${-7} ${40} 0`).join(' ')}" fill="none" stroke="#8FC3D1" stroke-width="2"/>`).join('');
  const homeSvg = homes.map(id => {
    const x = HOME_X[id], h = byId[id] || { name: id, place: '' };
    const src = h.images?.hero?.src ? `/assets/img/${h.images.hero.src}-800.jpg` : '';
    return `<g><clipPath id="cl-${id}"><circle cx="${x}" cy="${HOME_Y}" r="48"/></clipPath>
${src ? `<image href="${esc(src)}" x="${x - 72}" y="${HOME_Y - 48}" width="144" height="96" preserveAspectRatio="xMidYMid slice" clip-path="url(#cl-${id})"><title>${esc(h.name)}: AI-generated picture of an invented house</title></image>` : ''}
<circle id="ring-${id}" cx="${x}" cy="${HOME_Y}" r="48" fill="none" stroke="#23262b" stroke-width="3"/>
<text x="${x}" y="${HOME_Y + 66}" text-anchor="middle" class="hn">${esc(String(h.name).replace(/^The /, ''))}</text>
<text id="hs-${id}" x="${x}" y="${HOME_Y + 83}" text-anchor="middle" class="hs">${esc(h.place)}</text></g>`;
  }).join('');
  $('stage-bg').innerHTML = `<defs><style>.sn{font:700 13px system-ui,sans-serif;letter-spacing:.06em;fill:#1F2328}.ss{font:12px system-ui,sans-serif;fill:#3F454C}.hn{font:700 14px system-ui,sans-serif;fill:#1F2328}.hs{font:12px system-ui,sans-serif;fill:#3F454C}.bt{font:700 13px system-ui,sans-serif;letter-spacing:.1em;fill:#3F454C}.bs{font:12px system-ui,sans-serif;fill:#0E5A72}</style></defs>
<rect x="0" y="0" width="1000" height="250" fill="#FBF8F2"/>
<text x="18" y="26" class="bt">THE JOURNEY</text>
<g aria-hidden="true"><rect x="338" y="62" width="92" height="62" rx="5" fill="#1F2328"/><rect x="344" y="68" width="80" height="50" fill="#fff"/><rect x="348" y="72" width="72" height="8" fill="#A13D1A"/><rect x="348" y="84" width="30" height="28" fill="#CFE8EE"/><rect x="382" y="84" width="38" height="5" fill="#C8C2B6"/><rect x="382" y="93" width="30" height="5" fill="#C8C2B6"/><rect x="380" y="124" width="8" height="10" fill="#1F2328"/><rect x="368" y="133" width="32" height="4" fill="#1F2328"/></g>
<g aria-hidden="true" transform="translate(572 74) rotate(-12)"><path d="M0 10 L78 4 Q92 6 78 14 L0 18 Z" fill="#fff" stroke="#23262b" stroke-width="2"/><path d="M30 10 L52 -14 L60 -14 L48 10 Z M30 16 L50 38 L58 38 L46 16 Z M2 10 L-6 -4 L2 -4 L10 10 Z" fill="#fff" stroke="#23262b" stroke-width="2"/></g>
${stop(STOPS.arrivals, 'ARRIVALS', 'people appear')}${arrow(STOPS.arrivals, STOPS.website)}
${stop(STOPS.website, 'THE WEBSITE', 'browse, ask, book')}${arrow(STOPS.website, STOPS.airport)}
${stop(STOPS.airport, 'FARO AIRPORT', 'travel')}${arrow(STOPS.airport, STOPS.leaving)}
${stop(STOPS.leaving, 'LEAVING', 'review, go home')}
${stop(STOPS.team, 'THE TEAM', 'invented admins')}
<rect x="0" y="250" width="1000" height="370" fill="#F5EBD6"/>
<text x="18" y="276" class="bt">THE COAST, WEST TO EAST</text>
<text x="18" y="294" class="bs">drawn, not a map; home pictures AI-generated, invented houses</text>
<rect x="0" y="462" width="1000" height="158" fill="#CFE8EE"/>${waves}
${homeSvg}`;
}

// Actors: figures walking a path of keyframes { x, y, t } (real ms), with bubbles that follow them.
const actors = new Set();
let bubbleCount = 0;
function makeFig(ch, { pose = 'stand', mood = 'neutral', prop, outfit, hat, flip } = {}) {
  const el = document.createElement('div');
  el.className = 'fig';
  const o = { mood, prop, outfit, hat, flip, label: ch ? `${ch.name} (invented)` : 'An invented person' };
  el.innerHTML = `<span class="f-walk">${figureFor(ch, { ...o, pose: 'walk' })}</span><span class="f-stand">${figureFor(ch, { ...o, pose })}</span>`;
  $('stage-ov').appendChild(el);
  return el;
}
function addActor(ch, path, opts = {}) {
  if (speed === 'vf' || actors.size >= (innerWidth < 700 ? 8 : 16)) return null;
  const el = makeFig(ch, opts);
  const a = { el, path, bubbles: [], end: path[path.length - 1].t, x: path[0].x, y: path[0].y };
  place(a, path[0].x, path[0].y, false);
  actors.add(a);
  return a;
}
function place(a, x, y, moving) {
  a.x = x; a.y = y;
  a.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  a.el.classList.toggle('moving', moving);
  // Only the newest bubble of a figure shows; bubbles stay inside the stage.
  const shown = a.bubbles.filter(b => b.shown), last = shown[shown.length - 1];
  for (const b of shown) b.el.style.visibility = b === last ? 'visible' : 'hidden';
  if (last) last.el.style.transform = `translate(${bx(x).toFixed(1)}px, ${Math.max(last.el.offsetHeight + 4, y - 78).toFixed(1)}px)`;
}
// bubble(actor or {x,y}, html, cls, fromMs, forMs)
function bubble(target, html, cls, from, dur) {
  if (speed === 'vf') return;
  if (bubbleCount > (innerWidth < 700 ? 3 : 8)) return;
  const el = document.createElement('div');
  el.className = `bub ${cls}`;
  el.innerHTML = html;
  el.style.opacity = '0';
  $('stage-ov').appendChild(el);
  bubbleCount++;
  const b = { el, from, until: from + dur, shown: false, target };
  if (target.el) target.bubbles.push(b);
  else el.style.transform = `translate(${bx(target.x)}px, ${target.y - 60}px)`;
  bubblesAll.add(b);
}
const bubblesAll = new Set();
const bx = x => Math.min(880, Math.max(120, x));
function animate(now) {
  const rm = reduced();
  for (const a of [...actors]) {
    const p = a.path;
    let i = 0; while (i < p.length - 1 && now >= p[i + 1].t) i++;
    if (now >= a.end + (a.linger || 0)) { a.el.remove(); for (const b of a.bubbles) dropBubble(b); actors.delete(a); continue; }
    if (i >= p.length - 1) { place(a, p[i].x, p[i].y, false); continue; }
    const s = p[i], e = p[i + 1];
    const f = Math.min(1, Math.max(0, (now - s.t) / Math.max(1, e.t - s.t)));
    const moving = (s.x !== e.x || s.y !== e.y) && f > 0 && f < 1;
    if (rm) place(a, f < 1 ? s.x : e.x, f < 1 ? s.y : e.y, false); // reduced motion: jump between stops
    else { const g = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; place(a, s.x + (e.x - s.x) * g, s.y + (e.y - s.y) * g - (moving ? Math.abs(Math.sin(now / 90)) * 3 : 0), moving); }
    if (a.fadeAt && now > a.fadeAt) a.el.style.opacity = String(Math.max(0, 1 - (now - a.fadeAt) / 600));
  }
  for (const b of [...bubblesAll]) {
    if (now >= b.until) { dropBubble(b); continue; }
    if (!b.shown && now >= b.from) { b.shown = true; b.el.style.opacity = '1'; }
  }
}
function dropBubble(b) { if (!bubblesAll.has(b)) return; b.el.remove(); bubblesAll.delete(b); bubbleCount--; if (b.target.bubbles) b.target.bubbles = b.target.bubbles.filter(x => x !== b); }
function clearActors() { for (const a of actors) a.el.remove(); actors.clear(); for (const b of bubblesAll) b.el.remove(); bubblesAll.clear(); bubbleCount = 0; }

// ---------- world events to animation ----------
let announceAt = 0;
function announce(t) { const n = performance.now(); if (n - announceAt < 3000) return; announceAt = n; $('w-live').textContent = t; }
function legMs() { return speed === 1 ? 2600 : speed === 10 ? 1700 : 1000; }
function onWorldEvents(evs) {
  dirty = true;
  if (speed === 'vf' || !(typeof speed === 'number' && speed > 0)) return;
  const base = performance.now(), start = toMs(batchFrom || evs[0]?.at || clock.now());
  const delayOf = at => Math.min(1800, Math.max(0, ((toMs(at) - start) / 60000) / MIN_PER_SEC[speed] * 1000));
  const s = store.getState();
  for (const e of evs) {
    const t0 = base + delayOf(e.at), d = e.data || {};
    if (e.type === 'visit') animVisit(d.visit, t0);
    else if (e.type === 'booking.status' && d.status === 'checked-in') animCheckIn(s.bookings[d.id], t0, e.at);
    else if (e.type === 'booking.status' && d.status === 'checked-out') animCheckOut(s.bookings[d.id], t0);
    else if (e.type === 'review.added') animReview(d.review, t0);
    else if (e.type === 'issue.raised') bubble({ x: HOME_X[d.issue.homeId], y: HOME_Y - 6 }, `${esc(d.issue.type)}`, 'bad', t0, 2600);
    else if (e.type === 'cleaning.done') { const j = s.cleaning[d.id]; if (j) bubble({ x: HOME_X[j.homeId], y: HOME_Y - 6 }, 'cleaned', 'info', t0, 1800); }
    else if (e.type === 'home.rate') bubble({ x: HOME_X[d.homeId], y: HOME_Y - 6 }, `rate now ${eur(d.rate.base)} <small>(invented)</small>`, 'info', t0, 2000);
  }
}
const chOf = id => cast.byId[id] || null;
const homeName = id => String(store.getState().homes[id]?.name || id).replace(/^The /, '');

function animVisit(v, t0) {
  if (!v) return;
  const ch = chOf(v.persona), L = legMs();
  const inj = v.steps.find(x => x.what === 'tried a prompt injection');
  const looked = v.steps.filter(x => x.what === 'looked at');
  const x0 = STOPS.arrivals - 30 + Math.random() * 40, xw = STOPS.website - 40 + Math.random() * 24;
  const path = [{ x: x0, y: WALK_Y, t: t0 }, { x: xw, y: WALK_Y, t: t0 + L }];
  let t = t0 + L;
  const pause = inj ? 2600 : 1600;
  path.push({ x: xw, y: WALK_Y, t: t + pause }); t += pause;
  const booked = v.outcome === 'booked';
  const dest = booked ? STOPS.airport - 20 + Math.random() * 30 : STOPS.leaving - 20 + Math.random() * 30;
  path.push({ x: dest, y: WALK_Y, t: t + L * (booked ? 1 : 1.6) }); t += L * (booked ? 1 : 1.6);
  const a = addActor(ch, path, { mood: inj ? 'determined' : 'thinking', prop: ch?.prop_proposal });
  if (!a) { if (inj) announce(`Refused: ${ch?.name || 'a visitor'} tried a prompt injection (${inj.rule}).`); return; }
  a.linger = 900; a.fadeAt = t + 300;
  bubble(a, `${esc(v.steps[0]?.line || ch?.line || '')}`, 'q', t0 + 200, L + 600);
  if (inj) {
    bubble(a, `"${esc(inj.text)}"`, 'inj', t0 + L, pause * 0.55);
    bubble(a, `${decisionChip({ decision: inj.decision, rule: inj.rule })} <small>refused: nothing changed</small>`, 'deny', t0 + L + pause * 0.45, pause * 0.55 + 600);
    announce(`Refused: ${ch?.name || 'a visitor'} tried a prompt injection; rule ${inj.rule}.`);
  } else if (looked.length) {
    const lk = looked[looked.length - 1];
    bubble(a, `${esc(homeName(lk.homeId))}, ${esc(fmtDay(lk.from))} to ${esc(fmtDay(lk.to))}${lk.guestPays ? `: ${eur(lk.guestPays)}` : ''}`, 'info', t0 + L, pause);
  }
  if (booked) bubble(a, 'Booked (pretend payment)', 'good', t0 + L + pause, L);
  else bubble(a, `Left: ${esc(v.reason)}`, 'bad', t0 + L + pause, L * 1.6);
}

function animCheckIn(b, t0, at) {
  if (!b) return;
  const ch = chOf(b.persona), L = legMs();
  const tx = HOME_X[b.homeId] + 40;
  const a = addActor(ch, [{ x: STOPS.airport, y: WALK_Y, t: t0 }, { x: tx, y: FEET_Y, t: t0 + L * 1.4 }], { mood: 'happy', prop: 'suitcase', outfit: 'holiday' });
  if (!a) return;
  a.fadeAt = t0 + L * 1.4; a.linger = 500;
  const w = weatherAt(b.homeId, dayOf(at));
  const txt = w ? `IPMA: rain ${w.rain_pct ?? '?'}%, ${w.tmin ?? '?'} to ${w.tmax ?? '?'} °C today` : forecast.ok === false ? "IPMA's figures could not be read just now" : 'No real forecast for this day yet';
  bubble(a, `${esc(txt)} ${w ? kindBadge('real') : ''}`, w ? 'real' : 'info', t0 + 300, L * 1.4);
}
function animCheckOut(b, t0) {
  if (!b) return;
  const ch = chOf(b.persona), L = legMs();
  const a = addActor(ch, [{ x: HOME_X[b.homeId] + 40, y: FEET_Y, t: t0 }, { x: STOPS.leaving + 10, y: WALK_Y, t: t0 + L * 1.4 }, { x: STOPS.leaving + 10, y: WALK_Y, t: t0 + L * 1.4 + 2200 }], { prop: 'suitcase' });
  if (!a) return;
  a.fadeAt = t0 + L * 1.4 + 1800;
}
function animReview(rv, t0) {
  if (!rv) return;
  const L = legMs();
  const at = { x: STOPS.leaving + 10, y: WALK_Y };
  const good = rv.rating >= 4;
  bubble(at, `${rv.rating}/5 ${esc(String(rv.text).slice(0, 60))}${rv.text.length > 60 ? '...' : ''}`, good ? 'good' : 'bad', t0 + L * 1.4, 2600);
  if (rv.flagged) { bubble({ x: STOPS.leaving + 60, y: WALK_Y - 40 }, `${decisionChip({ decision: 'deny', rule: 'N-untrusted-instruction' })} <small>a review tried to give orders</small>`, 'deny', t0 + L * 1.4 + 900, 2600); announce('Refused: a review held an instruction; the host\'s assistant did not act on it.'); }
}

// Residents: guests staying (beside their home) and the three admins (at the team stop, or the
// housekeeper at a home waiting to be cleaned). Drawn from the state, so they agree with /admin/.
const residents = new Map();
function drawResidents(s) {
  const want = new Map();
  if (speed !== 'vf') {
    const perHome = {};
    for (const b of bookingsList(s).filter(x => x.status === 'checked-in')) {
      const i = perHome[b.homeId] = (perHome[b.homeId] || 0) + 1;
      if (i > SLOTS.length) continue;
      const issue = Object.values(s.issues).some(x => x.bookingId === b.id && x.status === 'open');
      want.set(`g:${b.id}`, { ch: chOf(b.persona), x: HOME_X[b.homeId] + SLOTS[i - 1], y: FEET_Y, o: { mood: issue ? 'worried' : 'happy', outfit: 'holiday', hat: i % 2 ? 'sun' : undefined, flip: SLOTS[i - 1] < 0 } });
    }
    const todo = Object.values(s.cleaning).find(j => j.status === 'to do');
    (cast.admins || []).forEach((ad, i) => {
      let x = STOPS.team - 40 + i * 40, y = WALK_Y;
      if (ad.id === 'housekeeper' && todo) { x = HOME_X[todo.homeId] - 40; y = FEET_Y - 4; }
      want.set(`a:${ad.id}`, { ch: ad, x, y, o: { prop: ad.prop_proposal, mood: 'calm', pose: 'stand' } });
    });
  }
  for (const [k, r] of residents) if (!want.has(k)) { r.el.remove(); residents.delete(k); }
  for (const [k, w] of want) {
    let r = residents.get(k);
    if (!r) { r = { el: makeFig(w.ch, w.o) }; r.el.classList.add('res'); residents.set(k, r); }
    r.el.style.transform = `translate(${w.x}px, ${w.y}px)`;
  }
  for (const id of Object.keys(HOME_X)) {
    const tk = nightTakenBy(s, id, dayOf(clock.now()), { now: clock.now() });
    const job = Object.values(s.cleaning).some(j => j.homeId === id && j.status === 'to do');
    const ring = $(`ring-${id}`), hs = $(`hs-${id}`);
    const place = (homesFile.find(h => h.id === id) || {}).place || '';
    if (ring) ring.setAttribute('stroke-dasharray', tk ? '' : '7 6');
    if (hs) hs.textContent = `${place} · ${job ? 'cleaning' : tk ? (tk.why === 'booking' ? 'occupied' : 'taken (background)') : 'free tonight'}`;
  }
}

// ---------- panels ----------
function render(force) {
  if (!store) return;
  lastRender = performance.now(); dirty = false;
  const s = store.getState();
  const today = dayOf(clock.now()), b = clock.bounds();
  const total = daysBetween(b.from, b.to) + 1, n = Math.min(total, Math.max(1, daysBetween(b.from, today) + 1));
  $('st-day').textContent = n; $('st-days').textContent = total;
  $('st-window').textContent = `(${fmtDay(b.from)} to ${fmtDay(b.to)})`;
  $('st-people').textContent = cast.visitors.length; $('st-admins').textContent = cast.admins.length;
  const bookings = bookingsList(s).filter(x => x.persona);
  $('st-bookings').textContent = bookings.length;
  $('st-unhappy').textContent = s.reviews.filter(r => r.rating <= 2).length;
  const inj = injections(s);
  $('st-inj').textContent = `${inj.blocked} of ${inj.tried}`;
  if (document.activeElement !== $('seed-in')) $('seed-in').value = s.seed || '';
  drawResidents(s);
  renderPnl(s); renderOcc(s, today); renderStock(s); renderReviews(s); renderPolicies(s); renderFound(s, bookings, inj); updateRail(s);
  if (selected) renderProfile(selected);
}

function injections(s) {
  // An attempt: an action (not a public answer or a quote) whose instruction came from untrusted or instruction-like text.
  const fl = s.policyLog.filter(e => !SAFE_ACTIONS.includes(e.action) && ((e.flagged && e.flagged.length) || (e.provenance || []).some(p => !p.trusted && p.role === 'instruction')));
  return { tried: fl.length, blocked: fl.filter(e => e.decision === 'deny').length, list: fl };
}

function renderPnl(s) {
  const from = dayOf(s.created || START);
  const p = pnl(s, { from }).total;
  const costs = -(p.commission + p.costsTotal);
  // cumulative profit before income tax, by day (ledger minus the tourist tax, which is passed on)
  const byDay = {};
  for (const e of s.ledger) { if (e.kind === 'tourist-tax' || e.date < from) continue; byDay[e.date] = (byDay[e.date] || 0) + e.amount; }
  const days = []; let run = 0;
  for (let d = from; d <= dayOf(clock.now()); d = addDays(d, 1)) { run += byDay[d] || 0; days.push(run); }
  let line = '';
  if (days.length > 1) {
    const lo = Math.min(0, ...days), hi = Math.max(1, ...days);
    const pts = days.map((v, i) => `${(i / (days.length - 1) * 280).toFixed(1)},${(52 - (v - lo) / (hi - lo) * 48).toFixed(1)}`).join(' ');
    line = `<svg class="spark" viewBox="0 0 280 56" role="img" aria-label="Cumulative profit before income tax, day 1 to ${days.length}: from ${eur(days[0])} to ${eur(days[days.length - 1])}"><line x1="0" x2="280" y1="${(52 - (0 - lo) / (hi - lo) * 48).toFixed(1)}" y2="${(52 - (0 - lo) / (hi - lo) * 48).toFixed(1)}" stroke="#C8C2B6" stroke-dasharray="3 3"/><polyline points="${pts}" fill="none" stroke="#2a78d6" stroke-width="2.5"/></svg>`;
  }
  $('pnl').innerHTML = `<p class="big">${eur(p.profitBeforeTax)}</p><p class="mini">profit before income tax since ${esc(fmtDay(from))} &middot; revenue ${eur(p.netRevenue)} (VAT out) &middot; costs and commission ${eur(costs)} &middot; tourist tax collected and passed on ${eur(p.touristTaxCollected)}</p>${line}<p class="mini">${days.length > 1 ? `cumulative, day 1 to ${days.length}. ` : ''}Simulated money for an invented business; not legal or tax advice.</p>`;
}

function renderOcc(s, today) {
  const now = clock.now();
  let tonight = 0, nights = 0, taken = 0;
  const start = dayOf(s.created || START);
  const rows = s.homeOrder.map(id => {
    const t = nightTakenBy(s, id, today, { now });
    if (t) tonight++;
    for (let d = start; d <= today; d = addDays(d, 1)) { nights++; if (nightTakenBy(s, id, d, { now })) taken++; }
    const word = t ? (t.why === 'booking' ? 'booked' : t.why === 'calendar feed' ? 'feed' : 'taken') : 'free';
    return `<div class="occ"><span>${esc(homeName(id))}</span><span class="bar"><i style="width:${t ? 100 : 0}%"></i></span><span>${word}</span></div>`;
  }).join('');
  $('occ').innerHTML = `${rows}<p class="mini">${tonight} of ${s.homeOrder.length} tonight &middot; ${nights ? Math.round(taken / nights * 100) : 0}% over the run. "booked": this run's people; "taken": bookings made elsewhere (simulated background).</p>`;
}

function renderStock(s) {
  const rows = [];
  for (const id of s.homeOrder) for (const [k, it] of Object.entries(s.stock[id] || {})) rows.push({ id, k, it, r: it.qty / Math.max(1, it.min) });
  rows.sort((a, b) => a.r - b.r);
  const asks = s.policyLog.filter(e => e.action === 'stock.reorder' && e.decision === 'ask').length;
  $('stock').innerHTML = rows.slice(0, 6).map(({ id, it }) => {
    const low = it.qty <= it.min;
    return `<div class="occ stk"><span>${esc(homeName(id))}: ${esc(it.label)}</span><span class="bar"><i class="${low ? 'low' : ''}" style="width:${Math.min(100, it.qty / (it.min * 3) * 100).toFixed(0)}%"></i></span><span>${esc(it.qty)}</span></div>`;
  }).join('') + `<p class="mini">Hatched: at or under the reorder point. The housekeeper reorders up to EUR 150; above that the owner is asked (${asks} ${decisionChip({ decision: 'ask', rule: 'K5-limit' })} so far).</p>`;
}

function renderReviews(s) {
  const rv = s.reviews.slice(-6).reverse();
  const avg = s.reviews.length ? (s.reviews.reduce((t, r) => t + r.rating, 0) / s.reviews.length).toFixed(1) : null;
  $('rv-avg').textContent = avg ? `${avg} average, ${s.reviews.length} reviews` : '';
  $('reviews').innerHTML = rv.length ? rv.map(r => `<div class="rv ${r.rating <= 2 ? 'low' : ''}"><b class="stars">${r.rating}/5</b> ${esc(r.authorName)}, ${esc(homeName(r.homeId))}: "${esc(r.text)}"${r.flagged ? ` <span class="k untr">instruction-like text, marked</span>` : ''}</div>`).join('') + '<p class="mini">All simulated, written by the simulation; shown as text, never obeyed.</p>'
    : '<p class="mini">No reviews yet: guests review when they check out.</p>';
}

function renderPolicies(s) {
  const list = s.policyLog.filter(e => e.decision !== 'allow').slice(-6).reverse();
  $('pol-n').textContent = `${s.stats.denied || 0} blocked`;
  $('pol').innerHTML = list.length ? `<ul>${list.map(e => {
    const fl = (e.provenance || []).find(p => p.flagged || (!p.trusted && p.role === 'instruction'));
    const who = cast.byId[e.who]?.name || e.who || e.actor;
    const then = e.decision === 'deny' ? 'refused; nothing changed' : 'handed to a person';
    return `<li>${decisionChip(e)} <b>${esc(who)}</b> &rarr; ${esc(e.actor)}: <code>${esc(e.action)}</code>${e.amount ? ` EUR ${esc(e.amount)}` : ''}${fl ? `<q>${esc(fl.excerpt)}</q>` : ''} <span class="mini">${esc(then)}.</span></li>`;
  }).join('')}</ul>` : '<p class="mini">No refusals yet. Run the world: the injection tester will try.</p>';
}

function renderFound(s, bookings, inj) {
  const avg = bookings.length ? bookings.reduce((t, b) => t + (b.quote?.price || 0), 0) / bookings.length : 400;
  const items = [];
  const left = Object.entries(s.stats.left || {}).filter(([r]) => r !== 'injection refused');
  const why = { 'dates taken': 'the dates they wanted were taken', 'minimum stay': 'the minimum stay was longer than their trip', 'too many guests': 'no home sleeps their group', price: 'the total was over their budget', 'no dates left in the window': 'no dates left in the real-data window', 'nothing suitable': 'nothing suitable' };
  for (const [r, n] of left) items.push({ cat: 'Blocks a sale', cost: n * avg, text: `${n} visitor${n === 1 ? '' : 's'} left because ${why[r] || r} (about ${eur(n * avg)} of stays, estimated at this run's average).` });
  const repairs = -s.ledger.filter(e => e.kind === 'repairs').reduce((t, e) => t + e.amount, 0);
  const refunds = -s.ledger.filter(e => e.kind === 'refund').reduce((t, e) => t + e.amount, 0);
  const issues = Object.values(s.issues);
  if (issues.length) items.push({ cat: 'Costs a payment', cost: repairs + refunds, text: `${issues.length} problem${issues.length === 1 ? '' : 's'} in stays (${[...new Set(issues.map(i => i.type))].join(', ')}): repairs ${eur(repairs)}${refunds ? `, refunds ${eur(refunds)}` : ''}.` });
  const low = s.reviews.filter(r => r.rating <= 3);
  if (low.length) items.push({ cat: 'Costs trust', cost: 0, text: `${low.length} review${low.length === 1 ? '' : 's'} at 3 or below: ${low.slice(-2).map(r => `${r.authorName} "${String(r.text).slice(0, 50)}..."`).join('; ')}` });
  if (inj.tried) items.push({ cat: 'Held', cost: -1, text: `${inj.blocked} of ${inj.tried} prompt-injection attempts blocked; no money moved, no data shared.` });
  items.sort((a, b) => b.cost - a.cost);
  $('found').innerHTML = items.length ? `<dl class="found">${items.map(i => `<dt>${esc(i.cat)}</dt><dd>${esc(i.text)}</dd>`).join('')}</dl>` : '<p class="mini">Nothing yet. Press 1&times; or Very fast.</p>';
}

// ---------- the persona rail and the profile ----------
function personaState(s, id) {
  const bs = bookingsList(s).filter(b => b.persona === id);
  const home = b => homeName(b.homeId);
  const staying = bs.find(b => b.status === 'checked-in'); if (staying) return `Staying, ${home(staying)}`;
  const coming = bs.find(b => b.status === 'paid'); if (coming) return `Booked, ${fmtDay(coming.from)}`;
  const visits = s.visits.filter(v => v.persona === id);
  const blocked = visits.filter(v => v.steps.some(x => x.what === 'tried a prompt injection')).length;
  if (id === 'injection-tester' && blocked) return `Blocked x${blocked}`;
  const last = bs.filter(b => b.status === 'checked-out').pop();
  if (last) { const r = s.reviews.find(x => x.bookingId === last.id); return r ? `Left ${r.rating}/5` : 'Left'; }
  const lv = visits[visits.length - 1];
  if (lv) return lv.outcome === 'left' ? `Left: ${lv.reason}` : 'Booking';
  return 'Not arrived yet';
}
function adminState(s, id) {
  const e = [...s.policyLog].reverse().find(x => x.actor === id);
  return e ? `${e.action.replace('.', ' ')}` : 'Waiting';
}
function drawRail() {
  const people = [...cast.visitors, ...cast.admins];
  $('rail').innerHTML = people.map(c => `<li><button type="button" class="pc ${c.side === 'admin' ? 'admin' : ''}" data-id="${esc(c.id)}" aria-pressed="false">${figureFor(c, { scale: 0.5, mood: 'neutral' })}<b>${esc(c.name)}</b><span class="state" id="ps-${esc(c.id)}">...</span></button></li>`).join('');
  $('rail').querySelectorAll('.pc').forEach(b => b.addEventListener('click', () => { selected = b.dataset.id; renderProfile(selected); $('rail').querySelectorAll('.pc').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('profile').focus({ preventScroll: innerWidth >= 1000 }); if (innerWidth < 1000) $('profile').scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); }));
  dirty = true;
}
function updateRail(s) {
  for (const c of cast.visitors) { const el = $(`ps-${c.id}`); if (el) el.textContent = personaState(s, c.id); }
  for (const c of cast.admins) { const el = $(`ps-${c.id}`); if (el) el.textContent = adminState(s, c.id); }
}

function renderProfile(id) {
  const c = cast.byId[id]; if (!c) return;
  const s = store.getState(), rec = c.record || {}, p = PROFILES[id];
  const field = (k, v) => v ? `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>` : '';
  let journey = '', outcome = '', cost = '';
  if (c.side === 'visitor') {
    const steps = [];
    for (const v of s.visits.filter(x => x.persona === id)) {
      for (const st of v.steps) {
        const when = esc(`${fmtDay(dayOf(v.at))} ${String(v.at).slice(11, 16)}`);
        if (st.what === 'asked the agent') steps.push([v.at, `${when}: asked the site's agent "${esc(st.text)}" ${decisionChip({ decision: st.decision, rule: '' })}`]);
        else if (st.what === 'tried a prompt injection') steps.push([v.at, `${when}: tried <q class="inj">${esc(st.text)}</q> ${decisionChip(st)}`]);
        else if (st.what === 'looked at') steps.push([v.at, `${when}: looked at ${esc(homeName(st.homeId))}, ${esc(fmtDay(st.from))} to ${esc(fmtDay(st.to))}${st.guestPays ? `, ${eur(st.guestPays)}` : ''}${st.ok ? '' : ` (${esc((st.reasons || []).join('; ') || 'not bookable')})`}`]);
        else if (st.what === 'booked') steps.push([v.at, `${when}: booked ${esc(homeName(st.homeId))}, ${esc(st.channel)}, ${eur(st.guestPays)} (pretend payment: nothing was charged)`]);
        else if (st.what === 'left') steps.push([v.at, `${when}: left (${esc(st.reason)})`]);
      }
    }
    const bs = bookingsList(s).filter(b => b.persona === id);
    for (const b of bs) {
      for (const h of (b.history || []).filter(h => ['checked-in', 'checked-out', 'cancelled'].includes(h.status))) steps.push([h.at, `${esc(fmtDay(dayOf(h.at)))}: ${esc(h.status.replace('-', ' '))}, ${esc(homeName(b.homeId))}`]);
      for (const i of Object.values(s.issues).filter(i => i.bookingId === b.id)) steps.push([i.raisedAt, `${esc(fmtDay(dayOf(i.raisedAt)))}: reported ${esc(i.type)} (${esc(i.status)})`]);
    }
    steps.sort((x, y) => String(x[0]).localeCompare(String(y[0])));
    journey = steps.length ? `<ol>${steps.slice(-12).map(x => `<li>${x[1]}</li>`).join('')}</ol>` : '<p class="mini">Not arrived yet in this run.</p>';
    const rv = s.reviews.filter(r => r.author === id).pop();
    outcome = rv ? `${rv.rating} of 5: "${esc(rv.text)}" ${kindBadge('sim', 'Simulated review')}` : esc(personaState(s, id));
    const money = s.ledger.filter(e => bs.some(b => b.id === e.bookingId) && ['repairs', 'refund'].includes(e.kind)).reduce((t, e) => t + e.amount, 0);
    const paid = bs.filter(b => ['paid', 'checked-in', 'checked-out'].includes(b.status)).reduce((t, b) => t + (b.quote?.price || 0), 0);
    cost = `${paid ? `brought ${eur(paid)} in stays` : 'no stay booked'}${money ? `; repairs and refunds ${eur(-money)}` : ''}`;
  } else {
    const acts = s.policyLog.filter(e => e.actor === id).slice(-8).reverse();
    journey = acts.length ? `<ol>${acts.map(e => `<li>${esc(fmtDay(dayOf(e.at)))} ${esc(String(e.at).slice(11, 16))}: <code>${esc(e.action)}</code> ${esc(e.target || '')} ${decisionChip(e)}</li>`).join('')}</ol>` : '<p class="mini">Nothing done yet in this run.</p>';
  }
  $('profile').innerHTML = `<h2 id="profile-h" class="sr-only">Profile</h2>
<div class="w-ph">${figureFor(c, { scale: 0.7, mood: c.side === 'admin' ? 'calm' : 'neutral' })}<div>
<h3>${esc(c.name)} ${kindBadge('inv')} ${kindBadge('sim', c.side === 'admin' ? 'Synthetic admin' : 'Synthetic user')}</h3>
<p class="mini">${esc(c.role || '')}${c.budget_eur ? ` &middot; budget ${eur(c.budget_eur)} (invented)` : ''}${p ? ` &middot; party ${p.adults + p.children.length}, ${p.nights} night${p.nights === 1 ? '' : 's'}` : ''}</p>
${c.line ? `<p><b>Arrives asking:</b> "${esc(c.line)}"</p>` : ''}</div></div>
<dl class="grid">${field('Situation', rec.situation)}${field('Arrives with', rec.arrives_with)}${field('Knows', rec.knows)}${field('Does not know', rec.does_not_know)}${field('Decides on', rec.decides_on)}${field('Leaves when', rec.leaves_when)}${field('Patience', rec.patience)}${field('Screen', rec.screen)}
<dt>Journey</dt><dd>${journey}</dd>${outcome ? `<dt>Outcome</dt><dd>${outcome}</dd>` : ''}${cost ? `<dt>To the business</dt><dd>${esc(cost)}</dd>` : ''}</dl>
<p class="disc">A test instrument, not a real guest, not evidence about real visitors. Invented, played by the simulation's scripts. Profile fields from the newsroom record format.</p>`;
}

function exportRun() {
  const blob = new Blob([store.exportJSON()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cinco-chamines-world-${(store.getState().seed || 'run').replace(/[^\w-]/g, '')}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
