// home.js: the home page and /homes/ of Cinco Chaminés (a made-up example). "Plan your stay"
// (dates kept in the page address and this tab only), the simulated "free for your dates" on
// each home card, and "The Algarve now" strip read live from data.promptugal.news with its
// sources. Sends nothing. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1; round 2: taken cards.
import { getSource, sourceLine, forecastFor, warningsFor, seaFor, uvFor, stayDates, setStayDates, stayQuery,
  homes, today, addDays, fmtDay, esc, isDay, forget } from './data.js';
import { isFree, firstTaken, nights, price } from './availability.js';

const T = today();
const form = document.getElementById('plan');
const msg = document.getElementById('plan-msg');
const homesFor = document.getElementById('homes-for');
// The number of guests lives in this page's memory only (review M5): not in the address, not in storage.
let G = null;

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
    if (!from || !to) { p.hidden = true; card.classList.remove('is-taken'); if (over) over.hidden = true; continue; }
    p.hidden = false;
    const free = isFree(h.id, from, to, T);
    // Round 2 (PROPOSAL.md 2.3): a taken home keeps its picture, faded, with the words over it.
    card.classList.toggle('is-taken', !free);
    if (over) over.hidden = free;
    const tooMany = guests && guests > h.sleeps;
    p.className = `avail ${free && !tooMany ? 'free' : 'taken'}`;
    p.textContent = tooMany ? `Sleeps ${h.sleeps}: too small for ${guests} (invented)`
      : free ? `Free for your dates (simulated): ${nights(from, to)} nights, EUR ${price(h.price_eur_invented, from, to)} (invented)`
      : `Taken on some of your dates (simulated), from ${fmtDay(firstTaken(h.id, from, to, T) || from)}`;
  }
  if (homesFor) homesFor.textContent = from && to
    ? `For ${fmtDay(from)} to ${fmtDay(to)} (${nights(from, to)} nights${guests ? `, ${guests} guests` : ''}). Availability is simulated: made up in your browser from each home and today's date.`
    : homesFor.textContent;
}

// ---------- plan your stay ----------
if (form) {
  const arrive = form.querySelector('#arrive'), leave = form.querySelector('#leave'), guests = form.querySelector('#guests');
  arrive.min = T; leave.min = addDays(T, 1);
  arrive.max = addDays(T, 364); leave.max = addDays(T, 365);
  const s = stayDates();
  // An old address may still carry ?guests=: drop it, keeping only the dates (review M5).
  try { if (new URLSearchParams(location.search).has('guests')) setStayDates(s.from, s.to); } catch { /* no address */ }
  arrive.value = s.from || addDays(T, 2);
  leave.value = s.to || addDays(T, 7);
  arrive.addEventListener('change', () => { if (isDay(arrive.value)) { leave.min = addDays(arrive.value, 1); if (!(leave.value > arrive.value)) leave.value = addDays(arrive.value, 5); } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const a = arrive.value, l = leave.value, g = Number(guests.value);
    msg.classList.remove('bad');
    if (!isDay(a) || !isDay(l)) { msg.classList.add('bad'); msg.textContent = 'Choose an arrive date and a leave date.'; return; }
    if (a < T) { msg.classList.add('bad'); msg.textContent = 'The arrive date is in the past.'; return; }
    if (l <= a) { msg.classList.add('bad'); msg.textContent = 'The leave date must be after the arrive date.'; return; }
    G = Number.isInteger(g) && g > 0 ? g : null;
    setStayDates(a, l);
    msg.textContent = `Showing the five homes for ${fmtDay(a)} to ${fmtDay(l)}. Open a home for its calendar, weather, sea and events.`;
    updateCards();
    document.getElementById('homes-h')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}
updateCards();

// ---------- the Algarve now ----------
const now = document.getElementById('now');
const one = (v, d = 1) => (v === null || v === undefined ? null : Number(v).toFixed(d).replace(/\.0$/, ''));
async function renderNow() {
  if (!now) return;
  const [fc, sea, uv, wa] = await Promise.all([
    forecastFor(1080500, T, T), seaFor(1080526), uvFor(1080500), warningsFor('FAR', T, T),
  ]);
  const item = (label, res, html) => `<li>${label}: ${res.error ? `<span class="muted">could not read (${esc(res.error)})</span>` : html}</li>`;
  const f = fc.days[0];
  const sd = sea.days.find(d => d.date === T) || sea.days[0];
  const ud = uv.days.find(d => d.date === T) || uv.days[0];
  const w = wa.items[0];
  const items = [
    item('Faro today', fc.res, f ? `<b>${esc(one(f.tmin))} to ${esc(one(f.tmax))} °C</b>, ${esc(f.weather)}, rain ${esc(f.rain_pct ?? '?')} %` : '<span class="muted">no forecast for today in the file</span>'),
    item('Sea, Faro coast', sea.res, sd ? `<b>${esc(one(sd.temp_min))} to ${esc(one(sd.temp_max))} °C</b>, waves ${esc(one(sd.waves_min))} to ${esc(one(sd.waves_max))} m${sd.date !== T ? ` (${esc(fmtDay(sd.date))})` : ''}` : '<span class="muted">no sea forecast in the file</span>'),
    item('UV, Faro', uv.res, ud ? `<b>${esc(one(ud.index))}</b> ${esc(ud.band)}${ud.date !== T ? ` (${esc(fmtDay(ud.date))})` : ''}` : '<span class="muted">no UV forecast in the file</span>'),
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
