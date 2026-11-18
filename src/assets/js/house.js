// house.js: one home's page on the Cinco Chaminés site (a made-up example).
// - The simulated availability calendar (availability.js): a keyboard grid with one tab stop,
//   plus two plain date inputs kept in sync.
// - The demonstration booking: dates, guests, details, review, and the final screen. The form
//   has no action and no method; nothing is stored, nothing is sent, there are no payment fields.
//   The values typed live in this page's memory only and are cleared on the final screen.
// - The stay panel: the IPMA forecast, warnings, sea and UV and the events-pt events for the
//   chosen dates, read live from data.promptugal.news, each block with its source line and its
//   loading, failure, stale and out-of-range states. Never a guessed value.
// Design: team/rounds/1/design/PROPOSAL.md, sections 4 to 6. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.
import { sourceLine, forecastFor, warningsFor, seaFor, uvFor, eventsFor, stayDates, setStayDates, home as getHome,
  today, addDays, daysBetween, dateRange, fmtDay, fmtLong, fmtLocal, esc, isDay, forget, WEATHER_CLASS_URL } from './data.js';
import { isTaken, isFree, firstTaken, nights, price, HORIZON_DAYS } from './availability.js';
import { chimney } from './houses.js';

const T = today();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const id = document.body.dataset.home;
const bookEl = document.getElementById('book-body');
const stayEl = document.getElementById('stay-blocks');
const stayH = document.getElementById('stay-h');
const staySub = document.getElementById('stay-sub');
const LAST = addDays(T, HORIZON_DAYS);
// Which coast each invented home is on, to note when IPMA's warning text names another coast.
const COAST = { salt: 'south', lagoon: 'south', hill: 'south', harbour: 'south', cape: 'west and south' };

const S = { home: null, from: null, to: null, month: T.slice(0, 7), focus: T, step: 1,
  adults: 2, children: 0, pets: 'no', name: '', arrival: '', note: '' };

const live = document.createElement('p');
live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.setAttribute('role', 'status');
document.body.append(live);
const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };

const euro = n => `EUR ${n}`;
const plural = (n, a, b = `${a}s`) => `${n} ${n === 1 ? a : b}`;

async function start() {
  S.home = await getHome(id);
  if (!S.home) {
    bookEl.innerHTML = '<p class="status fail">The list of homes (/data/homes.json) could not be read, so the calendar cannot be made up. Try reloading the page.</p>';
    stayEl.innerHTML = '';
    return;
  }
  const s = stayDates();
  if (s.from && s.to && s.from >= T && s.to <= addDays(LAST, 1)) { S.from = s.from; S.to = s.to; S.month = s.from.slice(0, 7); S.focus = s.from; }
  S.adults = Math.min(2, S.home.sleeps);
  // An old address may still carry ?guests=: drop it, keeping only the dates (review M5).
  try { if (new URLSearchParams(location.search).has('guests')) setStayDates(S.from, S.to); } catch { /* no address */ }
  renderBook();
  renderStay();
}

// ======================= booking: the steps =======================
const STEPS = ['Dates', 'Guests', 'Details', 'Review'];
function stepList() {
  return `<ol class="steps" aria-label="Booking steps (a demonstration)">${STEPS.map((t, i) => {
    const n = i + 1; const cur = S.step === n;
    return `<li${cur ? ' aria-current="step"' : ''}${S.step > n ? ' class="done"' : ''}>${n} ${t}</li>`;
  }).join('')}</ol>`;
}
function renderBook(focusHeading = false) {
  if (S.step === 1) bookEl.innerHTML = stepList() + datesStep();
  else if (S.step === 2) bookEl.innerHTML = stepList() + guestsStep();
  else if (S.step === 3) bookEl.innerHTML = stepList() + detailsStep();
  else if (S.step === 4) bookEl.innerHTML = stepList() + reviewStep();
  else bookEl.innerHTML = finalStep();
  wire();
  if (focusHeading) bookEl.querySelector('.step-h')?.focus();
}
const goStep = n => { S.step = n; renderBook(true); };

// ---------- step 1: dates and the calendar ----------
function dayState(d) {
  const past = d < T, beyond = d > LAST;
  const taken = !past && !beyond && isTaken(id, d, T);
  const inStay = S.from && (S.to ? d >= S.from && d < S.to : d === S.from);
  const leave = S.to && d === S.to;
  return { past, beyond, taken, inStay, leave };
}
function dayLabel(d, st) {
  const bits = [fmtLong(d)];
  if (d === T) bits.push('today');
  if (st.past) bits.push('past');
  else if (st.beyond) bits.push('beyond the simulated year');
  else if (st.taken) bits.push('taken (simulated)');
  else bits.push('free (simulated)');
  if (st.inStay) bits.push(d === S.from ? 'your arrive day' : 'one of your nights');
  if (st.leave) bits.push('your leave day');
  return bits.join(', ');
}
function calendar() {
  const [y, m] = S.month.split('-').map(Number);
  const first = `${S.month}-01`;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday first
  if (!(S.focus.slice(0, 7) === S.month)) S.focus = (T.slice(0, 7) === S.month) ? T : first;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<td role="gridcell"></td>');
  for (let k = 1; k <= dim; k++) {
    const d = `${S.month}-${String(k).padStart(2, '0')}`;
    const st = dayState(d);
    const cls = ['d', st.past || st.beyond ? 'past' : '', st.taken ? 'taken' : '', st.inStay ? 'in' : '', st.leave ? 'leave' : '', d === T ? 'today' : ''].filter(Boolean).join(' ');
    const off = st.past || st.beyond || st.taken;
    cells.push(`<td role="gridcell"><button type="button" class="${cls}" data-day="${d}" tabindex="${d === S.focus ? 0 : -1}" aria-label="${esc(dayLabel(d, st))}"${off ? ' aria-disabled="true"' : ''}${st.inStay || st.leave ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${k}</button></td>`);
  }
  while (cells.length % 7) cells.push('<td role="gridcell"></td>');
  const rows = []; for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
  const prevOk = S.month > T.slice(0, 7), nextOk = S.month < LAST.slice(0, 7);
  return `<div class="cal-head">
<button type="button" class="cal-nav" data-nav="-1" aria-label="Previous month"${prevOk ? '' : ' disabled'}>&lsaquo;</button>
<h3 id="cal-h">${MONTHS[m - 1]} ${y} <span class="tag">simulated availability</span></h3>
<button type="button" class="cal-nav" data-nav="1" aria-label="Next month"${nextOk ? '' : ' disabled'}>&rsaquo;</button>
</div>
<table class="cal" role="grid" aria-labelledby="cal-h" aria-describedby="cal-help">
<thead><tr>${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(w => `<th scope="col" abbr="${w}">${w[0]}</th>`).join('')}</tr></thead>
<tbody>${rows.join('')}</tbody></table>
<p class="sr-only" id="cal-help">Arrow keys move by day and week, Home and End to the start and end of the week, Page Up and Page Down by month. Enter or Space picks the arrive day, then the leave day. Escape clears.</p>`;
}
function summary() {
  if (!S.from) return 'Pick your arrive day on the calendar, or type the dates below.';
  if (!S.to) return `Arrive ${fmtDay(S.from)}. Now pick the leave day.`;
  const n = nights(S.from, S.to);
  if (!isFree(id, S.from, S.to, T)) return `<strong>${fmtDay(S.from)} to ${fmtDay(S.to)}: taken on some nights (simulated), from ${fmtDay(firstTaken(id, S.from, S.to, T))}.</strong> Pick other dates to book; the weather and events below still show your dates.`;
  return `${fmtDay(S.from)} to ${fmtDay(S.to)}: ${plural(n, 'night')}, <strong>${euro(price(S.home.price_eur_invented, S.from, S.to))}</strong> <span class="inv">(invented)</span>.`;
}
function datesStep() {
  const ok = S.from && S.to && isFree(id, S.from, S.to, T);
  return `<h3 class="step-h sr-only" tabindex="-1">Step 1 of 4: dates</h3>
${calendar()}
<ul class="legend" aria-label="Key"><li><i></i>free</li><li><i class="taken"></i>taken (struck through)</li><li><i class="in"></i>your nights</li><li><i class="leave"></i>leave day</li></ul>
<div class="alt-dates">
<div><label for="in-from">Arrive</label><input type="date" id="in-from" min="${T}" max="${LAST}" value="${S.from || ''}"></div>
<div><label for="in-to">Leave</label><input type="date" id="in-to" min="${addDays(T, 1)}" max="${addDays(LAST, 1)}" value="${S.to || ''}"></div>
</div>
<p class="small">Simulated: made up in your browser from the home and today's date. It changes once a day.</p>
<p class="summary" id="cal-sum">${summary()}</p>
<div class="actions"><button type="button" class="btn" data-go="2"${ok ? '' : ' disabled'}>Next: guests</button>${S.from ? '<button type="button" class="btn ghost small" data-clear>Clear dates</button>' : ''}<span class="small">Nothing is kept, sent or charged.</span></div>`;
}
function pick(d) {
  const st = dayState(d);
  if (st.past || st.beyond) { say(`${fmtLong(d)} cannot be picked.`); return; }
  if (S.from && !S.to && d > S.from) {
    if (isFree(id, S.from, d, T)) { S.to = d; say(`Leave ${fmtLong(d)}. ${plural(nights(S.from, d), 'night')}, ${euro(price(S.home.price_eur_invented, S.from, d))}, invented.`); }
    else { say(`Some nights before ${fmtLong(d)} are taken (simulated), from ${fmtLong(firstTaken(id, S.from, d, T))}. Pick an earlier leave day, or another arrive day.`); return; }
  } else {
    if (st.taken) { say(`${fmtLong(d)} is taken (simulated). Pick a free night to arrive.`); return; }
    S.from = d; S.to = null; say(`Arrive ${fmtLong(d)}. Choose the leave date.`);
  }
  S.focus = d;
  datesChanged();
}
function datesChanged() {
  setStayDates(S.to ? S.from : null, S.to ? S.to : null);
  renderBook();
  bookEl.querySelector(`.cal button[data-day="${S.focus}"]`)?.focus();
  if (S.to || !S.from) renderStay();
}
function moveFocus(d) {
  if (d < T) d = T;
  if (d > LAST) d = LAST;
  S.focus = d;
  if (d.slice(0, 7) !== S.month) { S.month = d.slice(0, 7); renderBook(); }
  else for (const b of bookEl.querySelectorAll('.cal button[data-day]')) b.tabIndex = b.dataset.day === d ? 0 : -1;
  bookEl.querySelector(`.cal button[data-day="${d}"]`)?.focus();
}
function addMonths(d, n) {
  const [y, m, k] = d.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const dim = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(k, dim)).padStart(2, '0')}`;
}

// ---------- step 2: guests ----------
function guestsStep() {
  const h = S.home, max = h.sleeps;
  const petsMsg = S.pets === 'yes' ? (h.pets ? `Pets are welcome in the ${h.name.replace(/^The /, '')} (an invented rule).` : `This made-up company does not take pets in the ${h.name.replace(/^The /, '')} (an invented rule).`) : '';
  return `<h3 class="step-h" tabindex="-1">Step 2 of 4: guests</h3>
<p class="small">The ${esc(h.name.replace(/^The /, ''))} sleeps ${max} (invented).</p>
<fieldset><legend>Adults</legend><div class="stepper"><button type="button" data-adj="adults" data-by="-1" aria-label="One adult fewer"${S.adults <= 1 ? ' disabled' : ''}>-</button><output aria-live="polite" id="o-adults">${S.adults}</output><button type="button" data-adj="adults" data-by="1" aria-label="One adult more"${S.adults + S.children >= max ? ' disabled' : ''}>+</button></div></fieldset>
<fieldset><legend>Children</legend><div class="stepper"><button type="button" data-adj="children" data-by="-1" aria-label="One child fewer"${S.children <= 0 ? ' disabled' : ''}>-</button><output aria-live="polite" id="o-children">${S.children}</output><button type="button" data-adj="children" data-by="1" aria-label="One child more"${S.adults + S.children >= max ? ' disabled' : ''}>+</button></div></fieldset>
<fieldset><legend>Pets?</legend>
<label><input type="radio" name="pets" value="no"${S.pets === 'no' ? ' checked' : ''}> No</label>
<label><input type="radio" name="pets" value="yes"${S.pets === 'yes' ? ' checked' : ''}> Yes</label>
<p class="small" id="pets-msg" aria-live="polite">${esc(petsMsg)}</p></fieldset>
<div class="actions"><button type="button" class="btn ghost" data-go="1">Back</button><button type="button" class="btn" data-go="3"${S.pets === 'yes' && !h.pets ? ' disabled' : ''}>Next: details</button></div>`;
}

// ---------- step 3: details (keeps nothing, sends nothing) ----------
function detailsStep() {
  const times = ['not sure yet', '14:00 to 16:00', '16:00 to 18:00', '18:00 to 20:00', '20:00 to 22:00', 'after 22:00'];
  return `<h3 class="step-h" tabindex="-1">Step 3 of 4: details</h3>
<p class="keeps"><strong>This form keeps nothing and sends nothing.</strong> It is part of a demonstration: there is no booking system behind it. Please do not type anything personal.</p>
<form id="details-form" autocomplete="off" novalidate>
<div class="form-row"><label for="f-name">A name for the booking (optional, any word will do)</label><input type="text" id="f-name" maxlength="40" autocomplete="off" spellcheck="false" value="${esc(S.name)}"></div>
<div class="form-row"><label for="f-arrival">Arrival time</label><select id="f-arrival">${times.map(t => `<option${S.arrival === t ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
<div class="form-row"><label for="f-note">A note (optional)</label><textarea id="f-note" rows="3" maxlength="300" autocomplete="off">${esc(S.note)}</textarea></div>
<div class="actions"><button type="button" class="btn ghost" data-go="2">Back</button><button type="submit" class="btn">Next: review</button></div>
</form>`;
}

// ---------- step 4: review ----------
function reviewStep() {
  const h = S.home, n = nights(S.from, S.to);
  const rows = [['Home', `${h.name}, ${h.place} (invented)`], ['Dates', `${fmtDay(S.from)} to ${fmtDay(S.to)}`], ['Nights', String(n)],
    ['Guests', `${plural(S.adults, 'adult')}${S.children ? `, ${plural(S.children, 'child', 'children')}` : ''}`], ['Pets', S.pets === 'yes' ? 'yes' : 'no'],
    ...(S.name ? [['Name', S.name]] : []), ['Arrival time', S.arrival || 'not sure yet'], ...(S.note ? [['Note', S.note]] : []),
    ['Total', `${euro(price(h.price_eur_invented, S.from, S.to))} (invented: nights x ${euro(h.price_eur_invented)}, nothing else)`]];
  return `<h3 class="step-h" tabindex="-1">Step 4 of 4: review</h3>
<div class="review"><dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
<p><strong>Nothing will be sent.</strong> There is no payment step, and nothing is booked.</p>
<div class="actions"><button type="button" class="btn ghost" data-go="3">Back</button><button type="button" class="btn" data-go="5">Finish the demonstration</button></div>`;
}

// ---------- the final screen ----------
function finalStep() {
  return `<div class="final">
${chimney({ width: 72, height: 120, cls: 'final-mark' })}
<h3 class="step-h statement" tabindex="-1">This is a demonstration: nothing was booked, nothing was sent, nothing was charged.</h3>
<p class="small">What you typed has been cleared from this page.</p>
<div class="actions" style="justify-content:center"><button type="button" class="btn" data-restart>Start again</button><a class="btn ghost" href="/agent/?home=${encodeURIComponent(id)}${S.from && S.to ? `&from=${S.from}&to=${S.to}` : ''}">Ask the agent about your stay</a></div>
</div>`;
}

// ---------- wiring ----------
function wire() {
  bookEl.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    const n = Number(b.dataset.go);
    if (n === 5) { S.name = ''; S.note = ''; S.arrival = ''; S.pets = 'no'; S.children = 0; }
    goStep(n);
  }));
  bookEl.querySelector('[data-clear]')?.addEventListener('click', () => { S.from = null; S.to = null; datesChanged(); say('Dates cleared.'); });
  bookEl.querySelector('[data-restart]')?.addEventListener('click', () => { S.from = null; S.to = null; S.step = 1; setStayDates(null, null); renderBook(true); renderStay(); });
  bookEl.querySelectorAll('.cal-nav').forEach(b => b.addEventListener('click', () => {
    S.month = addMonths(`${S.month}-01`, Number(b.dataset.nav)).slice(0, 7); renderBook();
    bookEl.querySelector(`.cal-nav[data-nav="${b.dataset.nav}"]`)?.focus();
  }));
  const grid = bookEl.querySelector('.cal');
  if (grid) {
    grid.addEventListener('click', e => { const b = e.target.closest('button[data-day]'); if (b) pick(b.dataset.day); });
    grid.addEventListener('keydown', e => {
      const b = e.target.closest('button[data-day]'); if (!b) return;
      const d = b.dataset.day; const wd = (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;
      const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (map[e.key] !== undefined) { e.preventDefault(); moveFocus(addDays(d, map[e.key])); }
      else if (e.key === 'Home') { e.preventDefault(); moveFocus(addDays(d, -wd)); }
      else if (e.key === 'End') { e.preventDefault(); moveFocus(addDays(d, 6 - wd)); }
      else if (e.key === 'PageUp') { e.preventDefault(); moveFocus(addMonths(d, -1)); }
      else if (e.key === 'PageDown') { e.preventDefault(); moveFocus(addMonths(d, 1)); }
      else if (e.key === 'Escape') { e.preventDefault(); S.from = null; S.to = null; S.focus = d; datesChanged(); say('Dates cleared.'); }
    });
  }
  const fi = bookEl.querySelector('#in-from'), ti = bookEl.querySelector('#in-to');
  const fromInputs = () => {
    const f = fi.value, t = ti.value;
    if (isDay(f) && f >= T && f <= LAST) {
      S.from = f; S.month = f.slice(0, 7); S.focus = f;
      S.to = isDay(t) && t > f && t <= addDays(LAST, 1) ? t : null;
      setStayDates(S.to ? S.from : null, S.to);
      const n = document.activeElement?.id;
      renderBook(); if (n) bookEl.querySelector(`#${n}`)?.focus();
      if (S.to) { renderStay(); say(summary().replace(/<[^>]+>/g, '')); }
    }
  };
  fi?.addEventListener('change', fromInputs); ti?.addEventListener('change', fromInputs);
  bookEl.querySelectorAll('[data-adj]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.adj, by = Number(b.dataset.by);
    const next = S[k] + by;
    if (next < (k === 'adults' ? 1 : 0) || S.adults + S.children + by > S.home.sleeps) return;
    S[k] = next; renderBook();
    (bookEl.querySelector(`[data-adj="${k}"][data-by="${by}"]:not([disabled])`) || bookEl.querySelector(`[data-adj="${k}"]:not([disabled])`))?.focus();
  }));
  bookEl.querySelectorAll('input[name="pets"]').forEach(r => r.addEventListener('change', () => { S.pets = r.value; renderBook(); bookEl.querySelector(`input[name="pets"][value="${r.value}"]`)?.focus(); }));
  const form = bookEl.querySelector('#details-form');
  if (form) {
    const keep = () => { S.name = form.querySelector('#f-name').value.trim(); S.arrival = form.querySelector('#f-arrival').value; S.note = form.querySelector('#f-note').value.trim(); };
    form.addEventListener('submit', e => { e.preventDefault(); keep(); goStep(4); });
    form.querySelector('[data-go="2"]')?.addEventListener('click', keep, { capture: true });
  }
}

// ======================= the stay panel =======================
function range() {
  if (S.from && S.to) return { from: S.from, to: S.to, picked: true };
  return { from: T, to: addDays(T, 4), picked: false };
}
function failure(what, res, page) {
  return `<div class="status fail" role="alert"><strong>Could not read ${esc(what)} just now</strong> (${esc(res.error)}). Nothing is shown in its place: this page does not guess.
<button type="button" class="btn small retry" data-retry="${esc(res.id)}">Try again</button> ${page ? `<a href="${esc(page)}">See it on the publisher's page</a>` : ''}</div>${sourceLine(res)}`;
}
const blocks = [
  ['forecast', 'IPMA forecast', forecastBlock], ['warnings', 'IPMA warnings', warningsBlock],
  ['sea', 'IPMA sea forecast', seaBlock], ['uv', 'IPMA UV forecast', uvBlock], ['events', 'events', eventsBlock],
];
function renderStay() {
  if (!S.home) return;
  const r = range();
  stayH.textContent = r.picked ? `Your stay: ${fmtDay(r.from)} to ${fmtDay(r.to)}` : 'The next five days';
  staySub.innerHTML = r.picked
    ? `Real data for ${esc(S.home.place)} and the Faro district, read live from data.promptugal.news. Each block names its source.`
    : 'Pick dates on the calendar to see the weather, sea and events for your stay. Until then, the next five days. Real data, read live from data.promptugal.news; each block names its source.';
  stayEl.innerHTML = blocks.map(([k, label]) => `<section class="blk" id="blk-${k}" aria-live="polite"><p class="status loading" role="status">Reading the ${esc(label)}...</p></section>`).join('');
  for (const [k, , fn] of blocks) runBlock(k, fn, r);
}
async function runBlock(k, fn, r) {
  const el = document.getElementById(`blk-${k}`);
  if (!el) return;
  try { el.innerHTML = await fn(r); }
  catch (e) { el.innerHTML = `<div class="status fail" role="alert"><strong>This block could not be drawn</strong> (${esc(e.message)}). Nothing is shown in its place.</div>`; }
  el.querySelectorAll('[data-retry]').forEach(b => b.addEventListener('click', () => {
    forget(b.dataset.retry); el.innerHTML = '<p class="status loading" role="status">Reading again...</p>'; runBlock(k, fn, range());
  }));
}
const n1 = v => (v === null || v === undefined ? '?' : String(Math.round(Number(v) * 10) / 10));

async function forecastBlock(r) {
  const d = S.home.data;
  const { res, place, days, beyond } = await forecastFor(d.forecast_id, r.from, r.to);
  const near = /same/i.test(d.forecast_note || '') ? 'same town' : `the nearest IPMA forecast place to ${S.home.place}`;
  const h = `<h3>Forecast, ${esc(place?.name || d.forecast_name)} <small>(${esc(near)})</small></h3>`;
  if (res.error) return h + failure("IPMA's forecast", res, res.card?.reader_page || 'https://www.ipma.pt/en/otempo/prev.localidade.hora/');
  if (!place) return `${h}<p class="status empty">IPMA's forecast file has no place ${esc(d.forecast_id)} at the time read.</p>${sourceLine(res)}`;
  const note = d.forecast_note && !/same/i.test(d.forecast_note) ? `<p class="small">${esc(d.forecast_note)}</p>` : '';
  let body;
  if (!days.length && beyond.length) {
    body = `<p class="status empty">No forecast yet for these dates. IPMA forecasts five days ahead; this appears on ${esc(fmtDay(addDays(r.from, -4)))}.</p>`;
  } else {
    const dates = dateRange(r.from > T ? r.from : T, r.to).slice(0, 21);
    const tiles = dates.map(dt => {
      const x = days.find(y => y.date === dt);
      if (x) return `<li class="day">${esc(fmtDay(dt))}<b>${esc(n1(x.tmin))} to ${esc(n1(x.tmax))} °C</b>${esc(x.weather)}<br>rain ${esc(x.rain_pct ?? '?')} %<br><span class="small">wind ${esc(x.wind)}</span></li>`;
      if (beyond.includes(dt)) return `<li class="day none">${esc(fmtDay(dt))}<b>not yet</b>appears ${esc(fmtDay(addDays(dt, -4)))}</li>`;
      return '';
    }).join('');
    body = `<ul class="days">${tiles}</ul><p class="small">IPMA gives five days ahead (today and four more); later days appear as they come into range. Weather words from <a href="${WEATHER_CLASS_URL}">IPMA's weather type list</a>.</p>`;
  }
  if (r.from < T) body = `<p class="small">Days before today are not shown.</p>` + body;
  return h + note + body + sourceLine(res, { issued: place.updated });
}

async function warningsBlock(r) {
  const { res, items, furthest } = await warningsFor(S.home.data.warnings_area || 'FAR', r.from, r.to);
  const h = '<h3>Warnings, Faro district <small>(IPMA area FAR, the whole Algarve)</small></h3>';
  if (res.error) return h + failure("IPMA's warnings", res, res.card?.reader_page || 'https://www.ipma.pt/en/otempo/prev-sam/');
  const coast = COAST[id] || 'south';
  // What period the file covers (round 1 FIXES, open item 2): from the read day to the latest
  // warning end in the file, or the read day plus two days when that is later (IPMA issues
  // warnings up to three days ahead). No all-clear is given for days after that.
  const readDay = res.read_at ? today(new Date(res.read_at)) : T;
  const coverFrom = readDay < T ? readDay : T;
  const coverTo = [furthest || '', addDays(readDay, 2)].sort().pop();
  const span = (a, b) => (a === b ? fmtDay(a) : `${fmtDay(a)} to ${fmtDay(b)}`);
  const covers = `<p class="small">The warnings file covers what IPMA had issued at the time read: ${esc(span(coverFrom, coverTo))}. IPMA issues warnings up to three days ahead.</p>`;
  const later = r.to > coverTo && r.from <= coverTo
    ? `<p class="status empty">For ${esc(span(addDays(coverTo, 1) > r.from ? addDays(coverTo, 1) : r.from, r.to))} no warnings are issued yet, so this page cannot say either way. Look again nearer the time.</p>` : '';
  let body;
  if (items.length) {
    body = items.map(w => {
      const west = /ocidental/i.test(w.text), south = /\bsul\b|meridional/i.test(w.text);
      const other = (west && !coast.includes('west')) ? `IPMA's text names the west coast; the ${S.home.name.replace(/^The /, '')} is on the south coast.`
        : (south && !coast.includes('south')) ? `IPMA's text names the south coast; the ${S.home.name.replace(/^The /, '')} is on the west coast.` : '';
      return `<div class="warn ${esc(w.level)}"><p class="lvl">${esc(w.level)}: ${esc(w.type)}</p>
<p>${esc(fmtLocal(w.start))} to ${esc(fmtLocal(w.end))} (Portugal time).${other ? ` ${esc(other)}` : ''}</p>
${w.text ? `<p><span class="pt" lang="pt">"${esc(w.text)}"</span> <span class="small">(IPMA, in Portuguese)</span></p>` : ''}</div>`;
    }).join('') + later;
  } else if (r.from > coverTo) {
    body = `<p class="status empty">No warnings issued for these dates yet, so this page cannot say either way: IPMA issues them up to three days ahead. Look again nearer the time.</p>`;
  } else {
    const a = r.from > T ? r.from : T, b = r.to < coverTo ? r.to : coverTo;
    body = `<p class="status empty">No yellow, orange or red warning for the Algarve (Faro district) for ${esc(span(a, b))} at the time read. IPMA lists yellow, orange and red; green (no warning) is not listed.</p>` + later;
  }
  body += covers;
  return h + body + sourceLine(res);
}

async function seaBlock(r) {
  const d = S.home.data;
  const { res, place, days } = await seaFor(d.sea_id);
  const h = `<h3>Sea, ${esc(place?.name || d.sea_name)}</h3>`;
  if (res.error) return h + failure("IPMA's sea forecast", res, res.card?.reader_page || 'https://www.ipma.pt/en/maritima/costeira/');
  if (!place) return `${h}<p class="status empty">IPMA's sea file has no coast ${esc(d.sea_id)} at the time read.</p>${sourceLine(res)}`;
  const inR = days.filter(x => x.date >= r.from && x.date <= r.to);
  const last = days.length ? days[days.length - 1].date : null;
  let body;
  if (inR.length) body = `<ul class="days">${inR.map(x => `<li class="day">${esc(fmtDay(x.date))}<b>sea ${esc(n1(x.temp_min))} to ${esc(n1(x.temp_max))} °C</b>waves ${esc(n1(x.waves_min))} to ${esc(n1(x.waves_max))} m${x.wave_dir ? ` from ${esc(x.wave_dir)}` : ''}</li>`).join('')}</ul>
${last && r.to > last ? `<p class="small">IPMA's sea forecast covers three days; later days appear as they come into range.</p>` : ''}`;
  else body = `<p class="status empty">The sea forecast covers three days${last ? ` (to ${esc(fmtDay(last))})` : ''}; not yet for these dates.</p>`;
  return h + body + sourceLine(res);
}

async function uvBlock(r) {
  const d = S.home.data;
  let { res, place, days } = await uvFor(d.uv_id);
  let label = d.uv_name || `IPMA UV place ${d.uv_id}`, fell = '';
  if (!res.error && !days.length && d.uv_fallback_id) {
    ({ res, place, days } = await uvFor(d.uv_fallback_id));
    fell = `IPMA's file has no UV place ${d.uv_id} at the time read, so this is Faro (${d.uv_fallback_id}).`;
    label = 'Faro';
  }
  const h = `<h3>UV index, ${esc(label)}</h3>`;
  if (res.error) return h + failure("IPMA's UV forecast", res, res.card?.reader_page || 'https://www.ipma.pt/en/otempo/prev.uv/');
  const inR = days.filter(x => x.date >= r.from && x.date <= r.to);
  const last = days.length ? days[days.length - 1].date : null;
  let body;
  if (inR.length) body = `<ul class="days">${inR.map(x => `<li class="day">${esc(fmtDay(x.date))}<b>${esc(n1(x.index))}</b>${esc(x.band)}</li>`).join('')}</ul><p class="small">Bands: WHO (low, moderate, high, very high, extreme).</p>`;
  else if (!days.length) body = `<p class="status empty">IPMA's UV file has no entry for this place at the time read.</p>`;
  else body = `<p class="status empty">The UV forecast covers five days${last ? ` (to ${esc(fmtDay(last))})` : ''}; not yet for these dates.</p>`;
  return h + (fell ? `<p class="small">${esc(fell)}</p>` : '') + body + sourceLine(res);
}

function evDate(e) {
  const t = s => { const m = /^(\d{4}-\d\d-\d\d)(?:T(\d\d:\d\d))?/.exec(s || ''); return m ? `${fmtDay(m[1])}${m[2] ? `, ${m[2]}` : ''}` : (s || ''); };
  return e.end && String(e.end).slice(0, 10) !== String(e.start).slice(0, 10) ? `${t(e.start)} to ${t(e.end)}` : t(e.start);
}
async function eventsBlock(r) {
  const d = S.home.data;
  const town = d.events_place ? d.events_place[0].toUpperCase() + d.events_place.slice(1) : S.home.place;
  const { res, items } = await eventsFor(d.events_place, r.from, r.to);
  const h = `<h3>On in ${esc(town)} ${r.picked ? 'during your stay' : 'in the next five days'}</h3>`;
  if (res.error) return h + failure('the events list', res, null);
  const note = d.events_note ? `<p class="small">${esc(d.events_note)}</p>` : '';
  if (r.from > addDays(T, 60)) return `${h}${note}<p class="status empty">Events are listed up to 60 days ahead; not yet for these dates.</p>${sourceLine(res)}`;
  const li = e => `<li>${e.url ? `<a href="${esc(e.url)}">${esc(e.name)}</a>` : esc(e.name)}<span class="meta">${esc(evDate(e))}${e.venue ? `, ${esc(e.venue)}` : ''}. Source: ${esc(e.source_name)}. Check details with the organiser.</span></li>`;
  const during = items.filter(e => !e.through), through = items.filter(e => e.through);
  const list = (arr, cap = 10) => arr.length <= cap ? `<ul class="ev">${arr.map(li).join('')}</ul>`
    : `<ul class="ev">${arr.slice(0, cap).map(li).join('')}</ul><details><summary>${arr.length - cap} more</summary><ul class="ev">${arr.slice(cap).map(li).join('')}</ul></details>`;
  let body = '';
  if (during.length) body += list(during);
  if (through.length) body += `<h4>On all through ${r.picked ? 'your stay' : 'these days'}</h4>${list(through, 5)}`;
  if (!items.length) body = `<p class="status empty">No events listed for ${esc(town)} for these dates. An empty list means no source covers the place or the dates, not that nothing is on.</p>`;
  return h + note + body + sourceLine(res);
}

start();
