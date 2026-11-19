// play/play.js: Side by side (/play/) of Cinco Chaminés, a made-up example. Dinis Cruz, 18
// November 2026, about 17:20 UTC: "open ... both of them, so you can see them side by side ...
// add the booking, then go to the back end, see the booking ... you should see the stock going
// down ... maybe you can even have a slider for time".
// Two frames of this same site (the visitor on the left, /admin/ on the right) share the
// simulation in this browser (localStorage "cc.sim.v1"; the store syncs frames through the
// storage event and BroadcastChannel). One time slider moves the simulated clock, bounded by
// the real-data window (sim/clock.js: real weather as issued, real events); play, pause and
// three speeds. Moving time runs the simulation's hourly work (sim/personas.js step(): check-ins,
// check-outs, stock used, cleanings, reorders, repairs); synthetic visitors only when the
// visitor ticks the box (round 4's world). A ticker shows each store event with its policy
// decision. Reads the site's own files and data.promptugal.news; sends nothing.
// Design: team/rounds/3/design/PROPOSAL.md section 4. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance E), 2026-11-18, round 3.
import { sim, ownBookings, currentStay, chrome, db, fmtSim, eur, ownLifecycle } from '../stay/sim-page.js';
import { SPEEDS } from '../sim/clock.js';
import { createWorld, loadCast, castFrom } from '../sim/personas.js';
import { toMs, fromMs, addDays, dayOf } from '../sim/util.js';
import { forecastFor, fmtDay, esc } from '../data.js';

const $ = id => document.getElementById(id);
const thumb = $('thumb'), rail = $('rail'), ticker = $('ticker'), note = $('play-note');
const HOUR = 60, DAY = 1440;
let SIM = null, world = null, speed = SPEEDS.hour, lastSeq = 0, fullCast = null;
const say = t => { note.textContent = t; };

// ---------- the frames ----------
const frameV = $('frame-v');
function goVisitor(path) {
  frameV.src = path;
  $('addr-v').textContent = `${path} · ${path.startsWith('/stay/') ? 'you are the guest' : 'you are the visitor'}`;
  $('open-v').href = path;
}
frameV.addEventListener('load', () => {
  try {
    const p = frameV.contentWindow.location.pathname + frameV.contentWindow.location.search;
    $('addr-v').textContent = `${p} · ${p.startsWith('/stay/') ? 'you are the guest' : 'you are the visitor'}`;
    $('open-v').href = p;
  } catch { /* another origin: never, the frames are this site */ }
});
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => goVisitor(b.dataset.go)));
async function mountAdmin() {
  const box = $('box-a');
  let ok = false;
  try { const r = await fetch('/admin/', { cache: 'no-store' }); ok = r.ok && /<html/i.test(await r.text()); } catch { ok = false; }
  if (!ok) {
    box.innerHTML = '<p class="status fail frame-fail">This page could not be shown inside the frame: the admin side (/admin/) is not in this copy of the site yet. The simulation still runs; the ticker shows what the admin would see.</p>';
    return;
  }
  box.innerHTML = '<iframe id="frame-a" title="The admin side, inside this page" loading="eager"></iframe>';
  $('frame-a').src = '/admin/?embed';
  $('open-a').href = '/admin/';
}
document.querySelectorAll('.vt').forEach(b => b.addEventListener('click', () => {
  $('frames').dataset.view = b.dataset.view;
  document.querySelectorAll('.vt').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
}));

// ---------- the time bar ----------
const bnd = () => SIM.clock.bounds();
const lo = () => toMs(`${bnd().from}T00:00`), hi = () => toMs(`${bnd().to}T23:59`);
const pct = t => Math.max(0, Math.min(100, ((toMs(t) - lo()) / (hi() - lo())) * 100));
function drawRail() {
  const b = bnd();
  const span = (from, to) => `left:${pct(`${from}T00:00`)}%;width:${Math.max(0.6, pct(`${to}T23:59`) - pct(`${from}T00:00`))}%`;
  $('rail-wx').innerHTML = b.weather.map(r => `<span style="${span(r.from, r.to)}"></span>`).join('');
  $('rail-ev').innerHTML = `<span style="${span(b.events.from, b.events.to)}"></span>`;
  const wxFrom = b.weather.map(r => r.from).sort()[0], wxTo = b.weather.map(r => r.to).sort().pop();
  $('lg-wx').textContent = `${fmtDay(wxFrom)} to ${fmtDay(wxTo)}${b.live.weather ? '' : ', from the researched dates: the live file could not be read'}`;
  $('lg-ev').textContent = `${fmtDay(b.events.from)} to ${fmtDay(b.events.to)}${b.live.events ? '' : ', from the researched dates: the live file could not be read'}`;
  const ticks = [];
  for (let d = b.from; d <= b.to; d = addDays(d, 7)) ticks.push(`<span style="left:${pct(`${d}T00:00`)}%">${esc(fmtDay(d).slice(4))}</span>`);
  $('ticks').innerHTML = ticks.join('');
  thumb.setAttribute('aria-valuemin', '0');
  thumb.setAttribute('aria-valuemax', String(Math.round((hi() - lo()) / 60000)));
}
function drawClock() {
  const c = SIM.store.clock();
  const t = c.now;
  thumb.style.left = `${pct(t)}%`;
  thumb.setAttribute('aria-valuenow', String(Math.round((toMs(t) - lo()) / 60000)));
  const rd = SIM.clock.realDataFor(dayOf(t));
  const words = `${fmtSim(t)}, simulated. ${rd.weather === 'issued' ? 'Real weather exists for this day.' : 'No real forecast for this day.'} ${rd.events ? 'Real events exist for this day.' : 'No real events for this day.'}`;
  thumb.setAttribute('aria-valuetext', words);
  $('tb-now').innerHTML = `<b>${esc(fmtSim(t).replace(/, (\d\d:\d\d)$/, ''))}</b><span>${esc(t.slice(11, 16))} simulated</span>`;
  const playing = SIM.clock.playing();
  $('tb-play').textContent = playing ? 'Pause' : 'Play';
  $('tb-play').setAttribute('aria-pressed', String(playing));
}
function move(minutes) {
  const t = fromMs(toMs(SIM.store.clock().now) + minutes * 60000);
  SIM.clock.setTime(t);
}
$('tb-back').addEventListener('click', () => move(-DAY));
$('tb-hour').addEventListener('click', () => move(HOUR));
$('tb-day').addEventListener('click', () => move(DAY));
$('tb-play').addEventListener('click', () => {
  if (SIM.clock.playing()) { SIM.clock.pause(); say('Paused.'); }
  else if (SIM.store.clock().now >= `${bnd().to}T23:59`) say('The real data ends here: move the slider back to play again.');
  else { SIM.clock.play(speed); say(`Playing at ${speed === 1 ? 'real time' : speed === SPEEDS.hour ? 'one simulated hour a second' : 'one simulated day a second'}.`); }
  drawClock();
});
document.querySelectorAll('#tb-speed [data-speed]').forEach(b => b.addEventListener('click', () => {
  speed = Number(b.dataset.speed);
  document.querySelectorAll('#tb-speed [data-speed]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
  if (SIM.clock.playing()) SIM.clock.play(speed);
}));
thumb.addEventListener('keydown', e => {
  const map = { ArrowRight: HOUR, ArrowUp: HOUR, ArrowLeft: -HOUR, ArrowDown: -HOUR, PageUp: DAY, PageDown: -DAY };
  if (map[e.key] !== undefined) { e.preventDefault(); move(map[e.key]); }
  else if (e.key === 'Home') { e.preventDefault(); SIM.clock.setTime(`${bnd().from}T00:00`); }
  else if (e.key === 'End') { e.preventDefault(); SIM.clock.setTime(`${bnd().to}T23:59`); }
});
function fromPointer(e) {
  const r = rail.getBoundingClientRect();
  const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  const ms = lo() + f * (hi() - lo());
  SIM.clock.setTime(fromMs(Math.round(ms / 3600000) * 3600000));
}
rail.addEventListener('pointerdown', e => {
  if (!SIM) return;
  rail.setPointerCapture?.(e.pointerId);
  fromPointer(e); thumb.focus({ preventScroll: true });
  const mv = ev => fromPointer(ev);
  const up = () => { rail.removeEventListener('pointermove', mv); rail.removeEventListener('pointerup', up); rail.removeEventListener('pointercancel', up); };
  rail.addEventListener('pointermove', mv); rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up);
});

// ---------- the ticker ----------
const ACT = { visitor: 'visitor', owner: 'owner', housekeeper: 'housekeeper', bookkeeper: 'bookkeeper', 'host-assistant': "host's assistant", 'guest-assistant': "guest's assistant", 'agent.cinco-chamines': 'site agent', system: 'the simulation' };
const who = a => ACT[a] || a || 'the simulation';
function summary(ev, st) {
  const d = ev.data || {};
  const home = id => st.homes[id]?.name || id;
  const bk = id => st.bookings[id];
  const gname = b => (b && st.guests[b.guestId]?.typedHere ? 'You' : b?.persona ? `A synthetic guest (${b.persona})` : 'A guest');
  switch (ev.type) {
    case 'booking.created': { const b = d.booking; return [`${gname(b)} asked for ${home(b.homeId)}, ${fmtDay(b.from)} to ${fmtDay(b.to)} (${b.channel}).`, 'visitor → admin bookings']; }
    case 'booking.status': {
      const b = bk(d.id); const h = b ? home(b.homeId) : 'a home';
      const w = { held: `Dates held at ${h} for ${b ? `${fmtDay(b.from)} to ${fmtDay(b.to)}` : ''}: the calendar shows them taken.`, paid: `Paid (pretend) for ${h}: ${eur(b?.quote?.guestPays)}, nothing charged. The admin's books get the line.`,
        'checked-in': `Checked in at ${h}.`, 'checked-out': `Checked out of ${h}: stock used, laundry out, a cleaning job made.`, cancelled: `Booking at ${h} cancelled (${d.fields?.cancelReason || 'cancelled'}).` }[d.status] || `Booking ${d.id} is now ${d.status}.`;
      return [w, d.status === 'checked-out' ? 'stay → admin stock' : 'visitor → admin bookings'];
    }
    case 'booking.changed': return [d.fields?.from && d.fields?.to ? `Booking dates changed to ${fmtDay(d.fields.from)} to ${fmtDay(d.fields.to)}.` : `Booking ${d.id} updated (${Object.keys(d.fields || {}).join(', ') || 'details'}).`, 'admin bookings'];
    case 'stock.changed': { const parts = Object.entries(d.delta || {}).filter(([, n]) => n).map(([k, n]) => `${st.stock[d.homeId]?.[k]?.label || k} ${n > 0 ? '+' : ''}${n}`); return [`Stock at ${home(d.homeId)}: ${parts.join(', ') || 'no change'}${d.reason ? ` (${d.reason})` : ''}.`, 'stay → admin stock']; }
    case 'laundry.changed': return null;
    case 'cleaning.created': return [`Cleaning job for ${home(d.job.homeId)}, due ${fmtDay(d.job.due)}.`, 'admin cleaning'];
    case 'cleaning.done': return ['Cleaning done; the laundry is back on the shelf.', 'admin cleaning'];
    case 'issue.raised': return [`Issue at ${home(d.issue.homeId)}: ${d.issue.type} (${d.issue.severity}).`, 'guest text → admin issues'];
    case 'issue.resolved': return [`Issue fixed${d.cost ? `, ${eur(d.cost)} (invented)` : ''}.`, 'admin → guest'];
    case 'message.added': return d.message.from === 'guest' ? [`Guest message to the host: "${String(d.message.text).slice(0, 80)}"`, 'guest text → admin'] : [`The host replied: "${String(d.message.text).slice(0, 80)}"`, 'admin → guest'];
    case 'review.added': return [`Review of ${home(d.review.homeId)}: ${d.review.rating} out of 5${d.review.flagged ? ', with instruction-like text (marked)' : ''}.`, 'guest text → admin reviews'];
    case 'home.rate': return [`Rate at ${home(d.homeId)} moved to ${eur(d.rate?.base)} base${d.why ? `: ${d.why}` : ''}.`, 'admin rates → visitor prices'];
    case 'setting.set': return [`Setting ${d.key} changed.`, 'admin'];
    case 'block.added': return [`Calendar feed blocked ${home(d.block.homeId)} ${fmtDay(d.block.from)} to ${fmtDay(d.block.to)}.`, 'calendar feed → admin'];
    case 'visit': return [`A synthetic visitor ${d.visit.outcome === 'booked' ? 'booked' : `left (${d.visit.reason || 'no reason given'})`}.`, 'synthetic visitor'];
    case 'note': return [d.text, 'admin'];
    case 'tax.drafted': return [`Tourist tax draft for ${d.draft.municipality}: ${eur(d.draft.amount)} (a person submits; nothing sent).`, 'admin legality'];
    case 'sim.created': return ['The simulation was reset to its first day.', 'reset'];
    default: return [ev.type, ''];
  }
}
function item(ev, pol, st) {
  const s = ev ? summary(ev, st) : null;
  if (ev && !s) return '';
  const p = pol?.data?.entry;
  const at = (ev || pol).at;
  const text = s ? s[0] : `${who(p.actor)} asked to ${p.action}${p.target ? ` (${p.target})` : ''}.`;
  return `<li class="tk${p && p.decision !== 'allow' ? ` tk-${esc(p.decision)}` : ''}"><span class="tk-at">${esc(fmtSim(at))}</span><span class="tk-text">${esc(text)}</span>${s && s[1] ? `<span class="tk-dir">${esc(s[1])}</span>` : ''}${p ? `<span class="tk-dec">${db(p)} <span>${esc(who(p.actor))} · ${esc(p.action)}: ${esc(p.reason)}</span></span>` : ''}</li>`;
}
function pull() {
  const st = SIM.store.getState();
  if (st.seq < lastSeq) { ticker.innerHTML = ''; lastSeq = 0; }
  const evs = SIM.store.events().filter(e => e.seq > lastSeq);
  if (!evs.length) { lastSeq = Math.max(lastSeq, st.seq); return; }
  lastSeq = evs[evs.length - 1].seq;
  const out = [];
  let pending = null;
  for (const e of evs) {
    if (e.type === 'policy.logged') { if (pending) out.push(item(null, pending, st)); pending = e; continue; }
    if (pending && pending.data?.entry?.decision === 'allow') { out.push(item(e, pending, st)); pending = null; continue; }
    if (pending) { out.push(item(null, pending, st)); pending = null; }
    out.push(item(e, null, st));
  }
  if (pending) out.push(item(null, pending, st));
  const html = out.filter(Boolean).reverse().slice(0, 40).join('');
  if (!html) return;
  ticker.querySelector('.tk-empty')?.remove();
  ticker.querySelectorAll('.tk-new').forEach(x => x.classList.remove('tk-new'));
  ticker.insertAdjacentHTML('afterbegin', html.replace(/<li class="tk/g, '<li class="tk-new tk'));
  while (ticker.children.length > 80) ticker.lastElementChild.remove();
  setTimeout(() => ticker.querySelectorAll('.tk-new').forEach(x => x.classList.remove('tk-new')), 3000);
}

// ---------- the simulation's hourly work while time moves here ----------
// The visitor's own stay gets no invented review or issue from the engine: those are theirs to write.
function filterOwn(st, events) {
  const own = new Set(ownBookings(st).map(b => b.id));
  return events.filter(e => {
    if (e.type === 'review.added') return !own.has(e.data.review.bookingId);
    if (e.type === 'issue.raised') return !own.has(e.data.issue.bookingId);
    if (e.type === 'message.added' && e.data.message.from === 'guest') return !own.has(e.data.message.bookingId);
    if (e.type === 'policy.logged' && ['review.post', 'issue.raise'].includes(e.data.entry.action) && own.has(e.data.entry.target)) return false;
    return true;
  });
}
async function startWorld(weatherFor) {
  try { fullCast = await loadCast(); } catch { fullCast = null; }
  const castNow = () => { const c = fullCast ? castFrom(fullCast) : castFrom(null); return $('synth').checked ? c : { ...c, visitors: [] }; };
  const store = SIM.store;
  // A store wrapper: the engine dispatches its batch through it, minus the visitor's own reviews and issues.
  const wrapped = { ...store, getState: () => store.getState(), clock: () => store.clock(), dispatch: evs => store.dispatch(filterOwn(store.getState(), [].concat(evs))) };
  let w = createWorld({ store: wrapped, clock: SIM.clock, cast: castNow(), weatherFor });
  w.attach();
  world = w;
  $('synth').addEventListener('change', () => {
    world.detach();
    world = createWorld({ store: wrapped, clock: SIM.clock, cast: castNow(), weatherFor }); world.attach();
    say($('synth').checked ? 'Synthetic visitors now arrive as time moves (invented people, scripted; round 4 adds their figures).' : 'Synthetic visitors stopped. Your bookings and the admin carry on.');
  });
}

async function start() {
  chrome('play');
  SIM = await sim();
  lastSeq = Math.max(0, SIM.store.getState().seq - 30);
  drawRail(); drawClock(); pull();
  SIM.bounds.then(() => { drawRail(); drawClock(); });
  SIM.store.subscribe(() => { ownLifecycle(SIM); drawClock(); pull(); });
  const stay = currentStay(SIM.store.getState());
  goVisitor(stay ? `/stay/?booking=${encodeURIComponent(stay.id)}` : '/');
  mountAdmin();
  // Real rain chances for the engine's reviews (Faro, IPMA): null where no real forecast exists.
  const wx = new Map();
  try { const f = await forecastFor(1080500, bnd().from, bnd().to); for (const d of f.days) wx.set(d.date, { rain_pct: d.rain_pct, weather: d.weather }); } catch { /* no weather: the engine says nothing about it */ }
  await startWorld(date => wx.get(date) || null);
  window.addEventListener('pagehide', () => { if (SIM.clock.playing()) SIM.clock.pause(); });
}
start();
