// home.js: the home page and /homes/ of Cinco Chaminés (a made-up example). "Plan your stay"
// (dates kept in the page address and this tab only), "free for your dates" on each home card,
// and "The Algarve now" strip read live from data.promptugal.news with its sources. Round 3: the
// cards read the simulation in this browser (sim/booking.js over localStorage "cc.sim.v1", with
// the store's simulated clock), so they agree with the home pages and /admin/; dates are offered
// only inside the real-data window; a slim bar links to the visitor's stay once they have booked.
// Sends nothing. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1; round 2: taken cards;
// round 3 (instance E): the simulation and the stay bar.
import { getSource, sourceLine, forecastFor, warningsFor, seaFor, uvFor, stayDates, setStayDates, stayQuery,
  homes, today, addDays, daysBetween, fmtDay, esc, isDay, forget } from './data.js';
import { sim, ownBookings, markEmbed, chrome, eur } from './stay/sim-page.js';

const RT = today(); // the real today: "The Algarve now"
let T = RT;         // the simulated today: availability and the dates offered
let LAST = addDays(RT, 4);
let SIM = null;
const form = document.getElementById('plan');
const msg = document.getElementById('plan-msg');
const homesFor = document.getElementById('homes-for');
// The number of guests lives in this page's memory only (review M5): not in the address, not in storage.
let G = null;

markEmbed();
chrome('visitor');
if (!document.querySelector('link[href="/assets/stay.css"]')) {
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/stay.css'; document.head.append(l);
}
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---------- the slim bar: "Your stay starts Thursday. Open your stay" ----------
function stayBar() {
  let bar = document.getElementById('cc-stay-bar');
  const st = SIM.store.getState();
  const b = ownBookings(st, ['paid', 'checked-in']).sort((x, y) => x.from.localeCompare(y.from))[0];
  if (!b) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('p'); bar.id = 'cc-stay-bar'; bar.className = 'stay-bar'; bar.setAttribute('role', 'status');
    const main = document.getElementById('main'); main?.prepend(bar);
  }
  const h = st.homes[b.homeId];
  const d = daysBetween(T, b.from);
  const when = b.status === 'checked-in' || d <= 0 ? `You are staying at ${h?.name || b.homeId} until ${fmtDay(b.to)}` : d === 1 ? `Your stay at ${h?.name || b.homeId} starts tomorrow` : d < 7 ? `Your stay at ${h?.name || b.homeId} starts on ${WEEKDAY[new Date(`${b.from}T12:00:00Z`).getUTCDay()]}` : `Your stay at ${h?.name || b.homeId} starts on ${fmtDay(b.from)}`;
  bar.innerHTML = `<span>${esc(when)} (simulated).</span> <a href="/stay/?booking=${encodeURIComponent(b.id)}">Open your stay</a>`;
}

// ---------- cards: simulated availability for the chosen dates ----------
async function updateCards() {
  const { from, to } = stayDates();
  const guests = G;
  const list = await homes();
  const q = stayQuery();
  for (const a of document.querySelectorAll('.card a.home-link')) a.href = a.getAttribute('href').split('?')[0] + q;
  for (const card of document.querySelectorAll('.card[data-home]')) {
    const h = list.find(x => x.id === card.dataset.home);
    const p = card.querySelector('.avail');
    if (!h || !p) continue;
    const over = card.querySelector('.taken-over');
    if (!from || !to || !SIM) { p.hidden = true; card.classList.remove('is-taken'); if (over) over.hidden = true; continue; }
    p.hidden = false;
    const av = SIM.booking.availability(h.id, from, to);
    const free = av.free;
    // Round 2 (PROPOSAL.md 2.3): a taken home keeps its picture, faded, with the words over it.
    card.classList.toggle('is-taken', !free);
    if (over) over.hidden = free;
    const tooMany = guests && guests > h.sleeps;
    const qt = free && !tooMany ? SIM.booking.quote(h.id, from, to, { adults: guests || Math.min(2, h.sleeps) }) : null;
    p.className = `avail ${free && !tooMany && qt?.ok ? 'free' : 'taken'}`;
    p.textContent = tooMany ? `Sleeps ${h.sleeps}: too small for ${guests} (invented)`
      : !free ? `Taken on some of your dates (simulated), from ${fmtDay(av.taken[0]?.date || from)}`
      : qt && !qt.ok ? `Free, but ${qt.reasons.join('; ')}`
      : `Free for your dates (simulated): ${qt.nightCount} nights, ${eur(qt.guestPays)} in all (invented)`;
  }
  if (homesFor) homesFor.textContent = from && to
    ? `For ${fmtDay(from)} to ${fmtDay(to)} (${daysBetween(from, to)} nights${guests ? `, ${guests} guests` : ''}). Availability is simulated: it comes from the simulation in your browser, the same one the admin side reads.`
    : homesFor.textContent;
}

// ---------- plan your stay ----------
function setLimits() {
  if (!form) return;
  const arrive = form.querySelector('#arrive'), leave = form.querySelector('#leave');
  arrive.min = T; leave.min = addDays(T, 1);
  arrive.max = addDays(LAST, -1); leave.max = LAST;
}
if (form) {
  const arrive = form.querySelector('#arrive'), leave = form.querySelector('#leave'), guests = form.querySelector('#guests');
  setLimits();
  const s = stayDates();
  // An old address may still carry ?guests=: drop it, keeping only the dates (review M5).
  try { if (new URLSearchParams(location.search).has('guests')) setStayDates(s.from, s.to); } catch { /* no address */ }
  arrive.value = s.from || addDays(T, 2);
  leave.value = s.to || addDays(T, 7);
  arrive.addEventListener('change', () => { if (isDay(arrive.value)) { leave.min = addDays(arrive.value, 1); if (!(leave.value > arrive.value)) leave.value = addDays(arrive.value, 5) > LAST ? LAST : addDays(arrive.value, 5); } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const a = arrive.value, l = leave.value, g = Number(guests.value);
    msg.classList.remove('bad');
    if (!isDay(a) || !isDay(l)) { msg.classList.add('bad'); msg.textContent = 'Choose an arrive date and a leave date.'; return; }
    if (a < T) { msg.classList.add('bad'); msg.textContent = `The arrive date is before the simulated today (${fmtDay(T)}).`; return; }
    if (l <= a) { msg.classList.add('bad'); msg.textContent = 'The leave date must be after the arrive date.'; return; }
    if (l > LAST) { msg.classList.add('bad'); msg.textContent = `No real data after ${fmtDay(LAST)}: this demonstration only offers days with real weather or real events. Pick a leave date up to then.`; return; }
    G = Number.isInteger(g) && g > 0 ? g : null;
    setStayDates(a, l);
    msg.textContent = `Showing the five homes for ${fmtDay(a)} to ${fmtDay(l)}. Open a home for its calendar, weather, sea and events.`;
    updateCards();
    document.getElementById('homes-h')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}
updateCards();

sim().then(x => {
  SIM = x;
  T = SIM.clock.today(); LAST = SIM.clock.bounds().to;
  setLimits(); updateCards(); stayBar();
  SIM.bounds.then(b => { LAST = b.to; setLimits(); });
  SIM.store.subscribe(() => { T = SIM.clock.today(); setLimits(); updateCards(); stayBar(); });
}).catch(() => { /* the cards stay without availability; the page still works */ });

// ---------- the Algarve now ----------
const now = document.getElementById('now');
const one = (v, d = 1) => (v === null || v === undefined ? null : Number(v).toFixed(d).replace(/\.0$/, ''));
async function renderNow() {
  if (!now) return;
  const [fc, sea, uv, wa] = await Promise.all([
    forecastFor(1080500, RT, RT), seaFor(1080526), uvFor(1080500), warningsFor('FAR', RT, RT),
  ]);
  const item = (label, res, html) => `<li>${label}: ${res.error ? `<span class="muted">could not read (${esc(res.error)})</span>` : html}</li>`;
  const f = fc.days[0];
  const sd = sea.days.find(d => d.date === RT) || sea.days[0];
  const ud = uv.days.find(d => d.date === RT) || uv.days[0];
  const w = wa.items[0];
  const items = [
    item('Faro today', fc.res, f ? `<b>${esc(one(f.tmin))} to ${esc(one(f.tmax))} °C</b>, ${esc(f.weather)}, rain ${esc(f.rain_pct ?? '?')} %` : '<span class="muted">no forecast for today in the file</span>'),
    item('Sea, Faro coast', sea.res, sd ? `<b>${esc(one(sd.temp_min))} to ${esc(one(sd.temp_max))} °C</b>, waves ${esc(one(sd.waves_min))} to ${esc(one(sd.waves_max))} m${sd.date !== RT ? ` (${esc(fmtDay(sd.date))})` : ''}` : '<span class="muted">no sea forecast in the file</span>'),
    item('UV, Faro', uv.res, ud ? `<b>${esc(one(ud.index))}</b> ${esc(ud.band)}${ud.date !== RT ? ` (${esc(fmtDay(ud.date))})` : ''}` : '<span class="muted">no UV forecast in the file</span>'),
    item('Warning, Faro district', wa.res, w ? `<b>${esc(w.level)}, ${esc(w.type)}</b>${wa.items.length > 1 ? ` and ${wa.items.length - 1} more` : ''}` : '<b>none</b> at the time read'),
  ];
  const lines = [fc.res, sea.res, uv.res, wa.res].map(r => sourceLine(r, { terms: false })).join('');
  const terms = fc.res.card?.terms?.summary || 'IPMA: free to copy and use for personal or public use if the use has no profit-making or offensive purpose; always name IPMA as the source.';
  const failed = [fc.res, sea.res, uv.res, wa.res].filter(r => r.error);
  now.innerHTML = `<ul>${items.join('')}</ul><div class="srcs">${lines}<p class="src">Terms (IPMA's, from the source card): ${esc(terms)}</p>
${failed.length ? `<p><button class="btn small" type="button" id="now-retry">Try again</button> <a class="small" href="https://www.ipma.pt/en/">See ipma.pt directly</a></p>` : ''}</div>`;
  document.getElementById('now-retry')?.addEventListener('click', () => {
    for (const r of failed) forget(r.id);
    now.innerHTML = '<p class="status loading" role="status">Reading again...</p>';
    renderNow();
  });
}
renderNow();
