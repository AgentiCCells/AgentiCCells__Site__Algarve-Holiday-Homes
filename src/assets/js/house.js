// house.js: one home's page on the Cinco Chaminés site (a made-up example).
// - The availability calendar: a keyboard grid with one tab stop, plus two plain date inputs kept
//   in sync. Round 3: it reads the simulation in this browser (sim/booking.js over the store in
//   localStorage "cc.sim.v1", with the store's simulated clock), so the visitor side and /admin/
//   show the same nights. Only real-data dates can be picked: from the simulated today to the
//   end of the window where real weather or events exist (sim/clock.js bounds).
// - The booking: dates, guests, details, review with the full invented total (nights, cleaning,
//   VAT included, tourist tax), then "Book (pretend)" makes a HELD booking, then "Pay (pretend)"
//   marks it paid in the simulation. No card fields, no payment code: nothing is charged and
//   nothing is sent. The final screen says "This is a demonstration: nothing was booked, nothing
//   was sent, nothing was charged." and links to the guest's stay (/stay/). Every step goes
//   through the browser Agent Behaviour Policy guard (sim/abp.js) and is logged.
// - The stay panel: the IPMA forecast, warnings, sea and UV and the events-pt events for the
//   chosen dates, read live from data.promptugal.news, each block with its source line and its
//   loading, failure, stale and out-of-range states. Never a guessed value.
// Design: team/rounds/1/design/PROPOSAL.md, sections 4 to 6; round 3: team/rounds/3/design/PROPOSAL.md 2.1.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1;
// round 3 (instance E): the simulation, the real-data window, the held booking and the pretend payment.
import { sourceLine, forecastFor, warningsFor, seaFor, uvFor, eventsFor, stayDates, setStayDates, home as getHome,
  today, addDays, daysBetween, dateRange, fmtDay, fmtLong, fmtLocal, esc, isDay, forget, WEATHER_CLASS_URL } from './data.js';
import { chimney } from './houses.js';
import { sim, ownBookings, markEmbed, chrome, kb, db, fmtSim, eur } from './stay/sim-page.js';
import { nightTakenBy } from './sim/booking.js';
import { untrusted } from './sim/abp.js';

const RT = today(); // the real today: the live data panel
let T = RT;         // the simulated today: the calendar and the booking
let LAST = addDays(RT, 4); // the last day of the real-data window (a leave day at the latest)
let SIM = null;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const id = document.body.dataset.home;
const bookEl = document.getElementById('book-body');
const stayEl = document.getElementById('stay-blocks');
const stayH = document.getElementById('stay-h');
const staySub = document.getElementById('stay-sub');
// Which coast each invented home is on, to note when IPMA's warning text names another coast.
const COAST = { salt: 'south', lagoon: 'south', hill: 'south', harbour: 'south', cape: 'west and south' };

const S = { home: null, from: null, to: null, month: RT.slice(0, 7), focus: RT, step: 1,
  adults: 2, children: 0, pets: 'no', name: '', arrival: '', note: '', bookingId: null, error: null, alt: null };

const live = document.createElement('p');
live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.setAttribute('role', 'status');
document.body.append(live);
const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };

const plural = (n, a, b = `${a}s`) => `${n} ${n === 1 ? a : b}`;
const nights = (a, b) => daysBetween(a, b);
const guestsObj = () => ({ adults: S.adults, children: Array.from({ length: S.children }, () => 10) });
const state = () => SIM.store.getState();
const now = () => SIM.store.clock().now;
const takenBy = d => nightTakenBy(state(), id, d, { now: now() });
const isFree = (a, b) => SIM.booking.availability(id, a, b).free;
const firstTaken = (a, b) => SIM.booking.availability(id, a, b).taken[0]?.date || null;
const quote = () => (S.from && S.to ? SIM.booking.quote(id, S.from, S.to, guestsObj()) : null);

async function start() {
  markEmbed();
  chrome('visitor');
  S.home = await getHome(id);
  if (!S.home) {
    bookEl.innerHTML = '<p class="status fail">The list of homes (/data/homes.json) could not be read, so the calendar cannot be made up. Try reloading the page.</p>';
    stayEl.innerHTML = '';
    return;
  }
  SIM = await sim();
  T = SIM.clock.today(); LAST = SIM.clock.bounds().to;
  S.month = T.slice(0, 7); S.focus = T;
  const s = stayDates();
  if (s.from && s.to && s.from >= T && s.to <= LAST) { S.from = s.from; S.to = s.to; S.month = s.from.slice(0, 7); S.focus = s.from; }
  S.adults = Math.min(2, S.home.sleeps);
  try { if (new URLSearchParams(location.search).has('guests')) setStayDates(S.from, S.to); } catch { /* no address */ }
  renderBook();
  renderStay();
  SIM.bounds.then(b => { LAST = b.to; if (S.step === 1) refresh(); });
  SIM.store.subscribe(() => refresh());
}

// The simulation changed (another tab, the admin in /play/, the clock): redraw what depends on it,
// keeping the keyboard focus where it was.
function refresh() {
  const t = SIM.clock.today();
  const moved = t !== T; T = t;
  if (S.step === 1) {
    if (moved && S.from && S.from < T) { S.from = null; S.to = null; setStayDates(null, null); }
    if (S.focus < T) S.focus = T;
    if (S.month < T.slice(0, 7)) S.month = T.slice(0, 7);
    const f = document.activeElement && bookEl.contains(document.activeElement) ? (document.activeElement.dataset.day ? `.cal button[data-day="${document.activeElement.dataset.day}"]` : document.activeElement.id ? `#${document.activeElement.id}` : null) : null;
    renderBook();
    if (f) bookEl.querySelector(f)?.focus();
  } else if (S.step === 5) {
    const had = document.activeElement && bookEl.contains(document.activeElement);
    renderBook(); if (had) bookEl.querySelector('.step-h')?.focus();
  }
}

// ======================= booking: the steps =======================
const STEPS = ['Dates', 'Guests', 'Details', 'Review', 'Pay (pretend)'];
function stepList() {
  return `<ol class="steps" aria-label="Booking steps (a simulation)">${STEPS.map((t, i) => {
    const n = i + 1; const cur = S.step === n;
    return `<li${cur ? ' aria-current="step"' : ''}${S.step > n ? ' class="done"' : ''}>${n} ${t}</li>`;
  }).join('')}</ol>`;
}
function ownLine() {
  const mine = ownBookings(state(), ['paid', 'checked-in']);
  if (!mine.length) return '';
  const b = mine[0], h = state().homes[b.homeId];
  return `<p class="own-stay small">${kb('sim', 'Your booking')} ${esc(h?.name || b.homeId)}, ${esc(fmtDay(b.from))} to ${esc(fmtDay(b.to))}. <a href="/stay/?booking=${encodeURIComponent(b.id)}">Open your stay</a></p>`;
}
function renderBook(focusHeading = false) {
  if (S.step === 1) bookEl.innerHTML = ownLine() + stepList() + datesStep();
  else if (S.step === 2) bookEl.innerHTML = stepList() + guestsStep();
  else if (S.step === 3) bookEl.innerHTML = stepList() + detailsStep();
  else if (S.step === 4) bookEl.innerHTML = stepList() + reviewStep();
  else if (S.step === 5) bookEl.innerHTML = stepList() + payStep();
  else bookEl.innerHTML = finalStep();
  wire();
  if (focusHeading) bookEl.querySelector('.step-h')?.focus();
}
const goStep = n => { S.step = n; renderBook(true); };

// ---------- step 1: dates and the calendar ----------
function dayState(d) {
  const past = d < T, beyond = d > LAST;
  const tb = !past && !beyond ? takenBy(d) : null;
  const inStay = S.from && (S.to ? d >= S.from && d < S.to : d === S.from);
  const leave = S.to && d === S.to;
  return { past, beyond, taken: Boolean(tb), why: tb?.why || null, inStay, leave, lastDay: d === LAST };
}
function dayLabel(d, st) {
  const bits = [fmtLong(d)];
  if (d === T) bits.push('simulated today');
  if (st.past) bits.push('before the simulated today');
  else if (st.beyond) bits.push('no real data for this day');
  else if (st.taken) bits.push(st.why === 'booking' ? 'taken by a booking in the simulation' : 'taken (simulated)');
  else if (st.lastDay) bits.push('last day with real data: a leave day only');
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
    const cls = ['d', st.past || st.beyond ? 'past' : '', st.beyond ? 'nodata' : '', st.taken ? 'taken' : '', st.inStay ? 'in' : '', st.leave ? 'leave' : '', d === T ? 'today' : ''].filter(Boolean).join(' ');
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
  if (!isFree(S.from, S.to)) return `<strong>${fmtDay(S.from)} to ${fmtDay(S.to)}: taken on some nights (simulated), from ${fmtDay(firstTaken(S.from, S.to))}.</strong> Pick other dates to book; the weather and events below still show your dates.`;
  const q = quote();
  if (q && !q.ok) return `<strong>${fmtDay(S.from)} to ${fmtDay(S.to)}: ${esc(q.reasons.join('; '))}.</strong>`;
  return `${fmtDay(S.from)} to ${fmtDay(S.to)}: ${plural(n, 'night')}, <strong>${eur(q.guestPays)}</strong> in all for ${plural(S.adults + S.children, 'guest')} <span class="inv">(invented prices; VAT and any tourist tax included, see the review)</span>.`;
}
function datesStep() {
  const q = quote();
  const ok = q && q.ok;
  return `<h3 class="step-h sr-only" tabindex="-1">Step 1 of 5: dates</h3>
${calendar()}
<ul class="legend" aria-label="Key"><li><i></i>free</li><li><i class="taken"></i>taken (struck through)</li><li><i class="in"></i>your nights</li><li><i class="leave"></i>leave day</li><li><i class="nodata"></i>no real data for this day</li></ul>
<div class="alt-dates">
<div><label for="in-from">Arrive</label><input type="date" id="in-from" min="${T}" max="${addDays(LAST, -1)}" value="${S.from || ''}"></div>
<div><label for="in-to">Leave</label><input type="date" id="in-to" min="${addDays(T, 1)}" max="${LAST}" value="${S.to || ''}"></div>
</div>
<p class="small">Simulated: the nights taken come from the simulation in your browser, the same one the admin side reads. Simulated today: <b>${esc(fmtSim(now()))}</b>. You can pick days from then to ${esc(fmtDay(LAST))}, the last day with real data (real weather as IPMA issued it, or real events); nothing later is offered.</p>
<p class="summary" id="cal-sum">${summary()}</p>
<div class="actions"><button type="button" class="btn" data-go="2"${ok ? '' : ' disabled'}>Next: guests</button>${S.from ? '<button type="button" class="btn ghost small" data-clear>Clear dates</button>' : ''}<span class="small">Nothing is sent or charged.</span></div>`;
}
function pick(d) {
  const st = dayState(d);
  if (st.past || st.beyond) { say(`${fmtLong(d)} cannot be picked: ${st.past ? 'it is before the simulated today' : 'no real data for this day'}.`); return; }
  if (S.from && !S.to && d > S.from) {
    if (isFree(S.from, d)) { S.to = d; const q = quote(); say(`Leave ${fmtLong(d)}. ${plural(nights(S.from, d), 'night')}${q?.ok ? `, ${eur(q.guestPays)} in all, invented` : q ? `. ${q.reasons.join('; ')}` : ''}.`); }
    else { say(`Some nights before ${fmtLong(d)} are taken (simulated), from ${fmtLong(firstTaken(S.from, d))}. Pick an earlier leave day, or another arrive day.`); return; }
  } else {
    if (st.taken) { say(`${fmtLong(d)} is taken (simulated). Pick a free night to arrive.`); return; }
    if (st.lastDay) { say(`${fmtLong(d)} is the last day with real data: it can only be a leave day.`); return; }
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
  return `<h3 class="step-h" tabindex="-1">Step 2 of 5: guests</h3>
<p class="small">The ${esc(h.name.replace(/^The /, ''))} sleeps ${max} (invented). The number of guests sets the tourist tax where the town has one.</p>
<fieldset><legend>Adults</legend><div class="stepper"><button type="button" data-adj="adults" data-by="-1" aria-label="One adult fewer"${S.adults <= 1 ? ' disabled' : ''}>-</button><output aria-live="polite" id="o-adults">${S.adults}</output><button type="button" data-adj="adults" data-by="1" aria-label="One adult more"${S.adults + S.children >= max ? ' disabled' : ''}>+</button></div></fieldset>
<fieldset><legend>Children under 16</legend><div class="stepper"><button type="button" data-adj="children" data-by="-1" aria-label="One child fewer"${S.children <= 0 ? ' disabled' : ''}>-</button><output aria-live="polite" id="o-children">${S.children}</output><button type="button" data-adj="children" data-by="1" aria-label="One child more"${S.adults + S.children >= max ? ' disabled' : ''}>+</button></div></fieldset>
<fieldset><legend>Pets?</legend>
<label><input type="radio" name="pets" value="no"${S.pets === 'no' ? ' checked' : ''}> No</label>
<label><input type="radio" name="pets" value="yes"${S.pets === 'yes' ? ' checked' : ''}> Yes</label>
<p class="small" id="pets-msg" aria-live="polite">${esc(petsMsg)}</p></fieldset>
<div class="actions"><button type="button" class="btn ghost" data-go="1">Back</button><button type="button" class="btn" data-go="3"${S.pets === 'yes' && !h.pets ? ' disabled' : ''}>Next: details</button></div>`;
}

// ---------- step 3: details (kept in this browser only, sent nowhere) ----------
function detailsStep() {
  const times = ['not sure yet', '14:00 to 16:00', '16:00 to 18:00', '18:00 to 20:00', '20:00 to 22:00', 'after 22:00'];
  return `<h3 class="step-h" tabindex="-1">Step 3 of 5: details</h3>
<p class="keeps"><strong>What you type here stays in this browser only</strong> (the simulation in localStorage, cleared by Reset) and is sent nowhere. Please do not type anything personal: any name will do.</p>
<form id="details-form" autocomplete="off" novalidate>
<div class="form-row"><label for="f-name">A name for the booking (optional, any word will do)</label><input type="text" id="f-name" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Any name, it stays in your browser" value="${esc(S.name)}"></div>
<div class="form-row"><label for="f-arrival">Arrival time</label><select id="f-arrival">${times.map(t => `<option${S.arrival === t ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
<div class="form-row"><label for="f-note">A note for the host (optional)</label><textarea id="f-note" rows="3" maxlength="300" autocomplete="off">${esc(S.note)}</textarea>
<p class="small">The host's side reads your note as untrusted text: the policies never act on instructions written in it.</p></div>
<div class="actions"><button type="button" class="btn ghost" data-go="2">Back</button><button type="submit" class="btn">Next: review</button></div>
</form>`;
}

// ---------- step 4: review, with the whole invented total before anything is held ----------
function priceRows(q) {
  const rates = [...new Set(q.nights.map(n => n.rate))];
  return [
    ['Nights', `${plural(q.nightCount, 'night')}: ${eur(q.accommodation)} (${rates.length === 1 ? `${eur(rates[0])} a night` : `${eur(Math.min(...rates))} to ${eur(Math.max(...rates))} a night, by season and weekend`})`],
    ['Cleaning', eur(q.cleaningFee)],
    ['Price', `${eur(q.price)} (${q.vat ? `VAT 6 percent included: ${eur(q.vat)}` : 'no VAT: the article 53 exemption is on in the simulation'})`],
    ['Tourist tax', q.touristTax ? `${eur(q.touristTax)} (${q.touristTaxNote})` : q.touristTaxNote],
    ['You pay', eur(q.guestPays)],
  ];
}
function reviewStep() {
  const h = S.home, q = quote();
  if (!q || !q.ok) return `<h3 class="step-h" tabindex="-1">Step 4 of 5: review</h3><p class="status fail">${esc(q ? q.reasons.join('; ') : 'Pick dates first.')}</p><div class="actions"><button type="button" class="btn ghost" data-go="1">Back to the dates</button></div>`;
  const rows = [['Home', `${h.name}, ${h.place} (invented)`], ['Dates', `${fmtDay(S.from)} to ${fmtDay(S.to)}`],
    ['Guests', `${plural(S.adults, 'adult')}${S.children ? `, ${plural(S.children, 'child', 'children')} under 16` : ''}`], ['Pets', S.pets === 'yes' ? 'yes' : 'no'],
    ...(S.name ? [['Name', S.name]] : []), ['Arrival time', S.arrival || 'not sure yet'], ...(S.note ? [['Note', S.note]] : []), ...priceRows(q)];
  return `<h3 class="step-h" tabindex="-1">Step 4 of 5: review</h3>
<div class="review"><dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
<p class="small">${kb('inv')} prices, rates and the cleaning fee are invented. Tax rules from public sources, as a simulation: not legal or tax advice.</p>
${S.error ? errorBox() : ''}
<p><strong>Next, the dates are held for you in the simulation</strong> for ${esc(String(state().settings.holdMinutes))} simulated minutes while you pay (pretend). Nothing is sent.</p>
<div class="actions"><button type="button" class="btn ghost" data-go="3">Back</button><button type="button" class="btn" data-hold>Book (pretend): hold these dates</button></div>`;
}
function errorBox() {
  const e = S.error;
  const alt = (S.alt || []).map(a => `<li><a href="/homes/${encodeURIComponent(a.id)}/?from=${S.from}&amp;to=${S.to}">${esc(a.name)}, ${esc(a.place)}</a>: free, ${eur(a.guestPays)} in all (invented)</li>`).join('');
  return `<div class="agent-note" role="alert"><p><strong>Chaminé, the site's agent</strong> ${kb('sim', 'SIMULATED, SCRIPTED')}</p>
<p>${esc(e.text)} ${e.decision ? db(e.decision) : ''}</p>
${alt ? `<p>The same dates are free in:</p><ul>${alt}</ul>` : e.taken ? '<p>No other home is free for all these nights. Try other dates.</p>' : ''}</div>`;
}
function findAlternatives() {
  const st = state();
  return st.homeOrder.filter(h => h !== id).map(h => ({ h, q: SIM.booking.quote(h, S.from, S.to, guestsObj()) }))
    .filter(x => x.q.ok).map(x => ({ id: x.h, name: st.homes[x.h].name, place: st.homes[x.h].place, guestPays: x.q.guestPays }));
}
function doHold() {
  S.error = null; S.alt = null;
  const notes = [S.arrival && S.arrival !== 'not sure yet' ? `Arrival ${S.arrival}.` : '', S.note].filter(Boolean).join(' ');
  const ctx = { actor: 'visitor', provenance: S.note ? [untrusted('guest-note', S.note, 'data')] : [] };
  const e = SIM.booking.enquire({ homeId: id, from: S.from, to: S.to, guests: guestsObj(), guest: { name: S.name || 'You (this browser)', typedHere: true }, channel: 'direct', notes }, ctx);
  if (!e.ok) return failHold(e);
  const h = SIM.booking.hold(e.booking.id, { actor: 'visitor', ownGuestId: e.booking.guestId });
  if (!h.ok) return failHold(h);
  S.bookingId = e.booking.id;
  say('The dates are held for you in the simulation. Now pay (pretend).');
  goStep(5);
}
function failHold(r) {
  const denied = r.decision && r.decision.decision !== 'allow';
  const taken = !denied && /taken/.test(r.error || '');
  S.error = { text: denied ? `The policy refused this booking: ${r.decision.reason}` : taken ? `Sorry: ${S.home.name} was taken in the meantime for some of these nights (${r.error}), perhaps in another tab or by the admin.` : `This could not be booked: ${r.error}.`, decision: r.decision, taken };
  S.alt = taken ? findAlternatives() : null;
  renderBook(); bookEl.querySelector('.agent-note')?.focus?.();
  say(S.error.text);
}

// ---------- step 5: the pretend payment (no card fields, no payment code) ----------
function payStep() {
  const b = state().bookings[S.bookingId];
  if (!b) return `<h3 class="step-h" tabindex="-1">Step 5 of 5: pay (pretend)</h3><p class="status fail">The held booking is not in the simulation any more (was it reset?).</p><div class="actions"><button type="button" class="btn" data-restart>Start again</button></div>`;
  const expired = b.status === 'cancelled' || (b.status === 'held' && b.until && b.until <= now());
  return `<h3 class="step-h" tabindex="-1">Step 5 of 5: pay (pretend)</h3>
<p>${kb('sim', 'Held')} <strong>${esc(S.home.name)}, ${esc(fmtDay(b.from))} to ${esc(fmtDay(b.to))}</strong>: booking <code>${esc(b.id)}</code>${b.until ? `, held until ${esc(fmtSim(b.until))} (simulated time)` : ''}.</p>
<div class="pretend-pay"><p><strong>No card is asked for. This is a simulation.</strong></p>
<p>Amount: <b>${eur(b.quote.guestPays)}</b> (invented). "Pay (pretend)" marks the booking paid in the simulation in this browser. Nothing is charged and nothing is sent.</p>
${expired ? '<p class="status fail">The hold has run out in simulated time (the clock moved on). Start again to hold the dates anew.</p>' : ''}
${S.error ? errorBox() : ''}
<div class="actions"><button type="button" class="btn ghost" data-cancel-hold>Cancel the hold</button>${expired ? '<button type="button" class="btn" data-restart>Start again</button>' : '<button type="button" class="btn" data-pay>Pay (pretend)</button>'}</div></div>`;
}
function doPay() {
  S.error = null;
  const b = state().bookings[S.bookingId];
  const p = SIM.booking.pay(S.bookingId, { actor: 'visitor', ownGuestId: b?.guestId });
  if (!p.ok) { S.error = { text: p.decision && p.decision.decision !== 'allow' ? `The policy refused the payment: ${p.decision.reason}` : `The pretend payment did not go through: ${p.error}.`, decision: p.decision }; renderBook(); say(S.error.text); return; }
  S.name = ''; S.note = ''; S.arrival = ''; S.pets = 'no';
  goStep(6);
}

// ---------- the final screen ----------
function finalStep() {
  const b = state().bookings[S.bookingId];
  const h = b ? state().homes[b.homeId] : null;
  return `<div class="final">
${chimney({ width: 72, height: 120, cls: 'final-mark' })}
${b ? `<p class="booked"><strong>Booked (pretend): ${esc(h?.name || S.home.name)}, ${esc(fmtDay(b.from))} to ${esc(fmtDay(b.to))}.</strong> Booking <code>${esc(b.id)}</code>, ${esc(b.status)} (pretend) in the simulation.</p>` : ''}
<h3 class="step-h statement" tabindex="-1">This is a demonstration: nothing was booked, nothing was sent, nothing was charged.</h3>
<p>In this simulation your booking is now in the admin.</p>
<p class="small">It lives in this browser only (localStorage); Reset clears it.</p>
<div class="actions" style="justify-content:center"><a class="btn" href="/stay/${b ? `?booking=${encodeURIComponent(b.id)}` : ''}">Go to your stay</a><button type="button" class="btn ghost" data-restart>Book another stay</button></div>
</div>`;
}

// ---------- wiring ----------
function wire() {
  bookEl.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { S.error = null; goStep(Number(b.dataset.go)); }));
  bookEl.querySelector('[data-hold]')?.addEventListener('click', doHold);
  bookEl.querySelector('[data-pay]')?.addEventListener('click', doPay);
  bookEl.querySelector('[data-cancel-hold]')?.addEventListener('click', () => {
    const b = state().bookings[S.bookingId];
    if (b && b.status === 'held') SIM.booking.cancel(b.id, { actor: 'visitor', ownGuestId: b.guestId, reason: 'the visitor cancelled the hold' });
    S.bookingId = null; S.error = null; goStep(4); say('The hold is cancelled; the nights are free again.');
  });
  bookEl.querySelector('[data-clear]')?.addEventListener('click', () => { S.from = null; S.to = null; datesChanged(); say('Dates cleared.'); });
  bookEl.querySelectorAll('[data-restart]').forEach(x => x.addEventListener('click', () => { S.from = null; S.to = null; S.step = 1; S.bookingId = null; S.error = null; S.alt = null; setStayDates(null, null); renderBook(true); renderStay(); }));
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
    if (isDay(f) && f >= T && f < LAST) {
      S.from = f; S.month = f.slice(0, 7); S.focus = f;
      S.to = isDay(t) && t > f && t <= LAST ? t : null;
      setStayDates(S.to ? S.from : null, S.to);
      const n = document.activeElement?.id;
      renderBook(); if (n) bookEl.querySelector(`#${n}`)?.focus();
      if (S.to) { renderStay(); say(summary().replace(/<[^>]+>/g, '')); }
    } else if (isDay(f)) say(`${fmtLong(f)} cannot be the arrive day: pick a day from ${fmtLong(T)} to ${fmtLong(addDays(LAST, -1))}.`);
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
  return { from: RT, to: addDays(RT, 4), picked: false };
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
    const dates = dateRange(r.from > RT ? r.from : RT, r.to).slice(0, 21);
    const tiles = dates.map(dt => {
      const x = days.find(y => y.date === dt);
      if (x) return `<li class="day">${esc(fmtDay(dt))}<b>${esc(n1(x.tmin))} to ${esc(n1(x.tmax))} °C</b>${esc(x.weather)}<br>rain ${esc(x.rain_pct ?? '?')} %<br><span class="small">wind ${esc(x.wind)}</span></li>`;
      if (beyond.includes(dt)) return `<li class="day none">${esc(fmtDay(dt))}<b>not yet</b>appears ${esc(fmtDay(addDays(dt, -4)))}</li>`;
      return '';
    }).join('');
    body = `<ul class="days">${tiles}</ul><p class="small">IPMA gives five days ahead (today and four more); later days appear as they come into range. Weather words from <a href="${WEATHER_CLASS_URL}">IPMA's weather type list</a>.</p>`;
  }
  if (r.from < RT) body = `<p class="small">Days before today are not shown.</p>` + body;
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
  const readDay = res.read_at ? today(new Date(res.read_at)) : RT;
  const coverFrom = readDay < RT ? readDay : RT;
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
    const a = r.from > RT ? r.from : RT, b = r.to < coverTo ? r.to : coverTo;
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
  if (r.from > addDays(RT, 60)) return `${h}${note}<p class="status empty">Events are listed up to 60 days ahead; not yet for these dates.</p>${sourceLine(res)}`;
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
