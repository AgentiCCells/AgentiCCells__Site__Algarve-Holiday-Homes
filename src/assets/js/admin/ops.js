// admin/ops.js: the operations sections of the admin of the Cinco Chaminés simulation (a made-up
// example): Today, Bookings, Calendar, Cleaning, Stock, Issues, Messages and Reviews
// (team/rounds/3/design/PROPOSAL.md, 3.2 to 3.9). Each section is a function of the state that
// returns HTML; the buttons carry data-act and are handled in admin/actions.js through the
// Agent Behaviour Policy guard. Text from guests, reviews and feeds is shown as text, marked.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis (instance D), 2026-11-18, round 3.

import { esc, badge, decisionBadge, actorName, fmtSim, eur, pct, day, homeName, guestName, guestCell, isYours, STATUS_WORD, channelWord,
  bookingsFor, idsFor, occupancyGrid, quote, decisionsFor, addDays, nightsOf, daysBetween, SHORT, HOME_IDS } from './util.js';
import { nightTakenBy, reorderNeeds, CHANNELS } from '../sim/booking.js';
import { registrationDuty } from '../sim/legal.js';
import { lines } from './history.js';
import { sourceLine } from '../data.js';

const opt = (v, t, sel) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(t)}</option>`;
const homeSelect = (name, sel, S) => `<select name="${name}" data-keep="${name}">${HOME_IDS.map(id => opt(id, homeName(S, id), sel)).join('')}</select>`;
const panel = (title, body, extra = '') => `<section class="panel"><div class="pnh"><h2>${title}</h2>${extra}</div>${body}</section>`;
const empty = t => `<p class="empty">${t}</p>`;

// ---------- shared reads ----------
const tonight = (S, b, d) => ['paid', 'checked-in'].includes(b.status) && b.from <= d && d < b.to;
export function pendingDuties(S, home) {
  return bookingsFor(S, home).filter(b => ['paid', 'checked-in', 'checked-out'].includes(b.status))
    .map(b => ({ b, d: registrationDuty(b, S.guests[b.guestId]) })).filter(x => x.d.applies && !x.d.done);
}
export function guestThreads(S, home) {
  const by = new Map();
  for (const m of S.messages) {
    if (m.kind === 'assign' || m.kind === 'review-reply') continue;
    const b = m.bookingId ? S.bookings[m.bookingId] : null;
    if (home !== 'all' && b && b.homeId !== home) continue;
    const k = m.bookingId || 'other';
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(m);
  }
  return [...by.entries()].map(([k, ms]) => ({ id: k, b: S.bookings[k] || null, ms, waiting: ms[ms.length - 1].from === 'guest' }));
}
export function counts(S, ctx) {
  const t = ctx.today, home = 'all';
  const bs = bookingsFor(S, home);
  const issuesOpen = Object.values(S.issues).filter(i => i.status !== 'resolved').length;
  const stockLow = HOME_IDS.reduce((n, id) => n + reorderNeeds(S, id).length, 0);
  const cleaning = Object.values(S.cleaning).filter(j => j.status !== 'done' && j.due <= t).length;
  return {
    today: alertsFor(S, { ...ctx, home }).length,
    bookings: bs.filter(b => ['enquiry', 'held', 'paid', 'checked-in'].includes(b.status)).length,
    cleaning, stock: stockLow, issues: issuesOpen,
    messages: guestThreads(S, home).filter(x => x.waiting).length,
    reviews: S.reviews.filter(r => !S.messages.some(m => m.kind === 'review-reply' && m.reviewId === r.id)).length,
    legality: pendingDuties(S, home).filter(x => x.d.due <= addDays(t, 1)).length,
    policies: (S.policyLog || []).filter(e => e.decision === 'deny').length,
    urgent: { today: true, stock: stockLow > 0, issues: Object.values(S.issues).some(i => i.status !== 'resolved' && i.severity === 'high'), messages: true, legality: true, cleaning: true },
  };
}

// ---------- alerts (Today) ----------
export function alertsFor(S, ctx) {
  const { today, home } = ctx, ids = idsFor(home), out = [];
  for (const b of bookingsFor(S, home).filter(b => b.status === 'enquiry' || b.status === 'held'))
    out.push({ l: 'B', t: `Booking to confirm: ${homeName(S, b.homeId)}`, x: `${guestName(S, b)}, ${day(b.from)} to ${day(b.to)}, ${channelWord(b)}, ${eur(b.quote.price)}.`, k: badge('simulated'), a: `<button type="button" class="btn-s dark" data-act="confirm" data-id="${esc(b.id)}">Confirm</button>` });
  for (const id of ids) {
    const need = reorderNeeds(S, id);
    if (need.length) out.push({ l: 'S', t: `Stock low: ${homeName(S, id)}`, x: need.map(n => `${n.label} (reorder ${n.qty}, ${eur(n.cost)})`).join(', ') + '.', k: badge('simulated'), a: `<button type="button" class="btn-s dark" data-act="reorder-home" data-home="${id}">Reorder</button>` });
  }
  for (const { b, d } of pendingDuties(S, home).filter(x => x.d.due <= addDays(today, 1)))
    out.push({ l: 'L', t: `Guest bulletin due: ${guestName(S, b)}`, x: `Foreign guest at ${homeName(S, b.homeId)}, arrived ${day(b.from)}: the accommodation bulletin is due by ${day(d.due)} (3 working days, Lei 23/2007 art. 16).${d.due < today ? ' Late.' : ''}`, k: `${badge('simulated', 'SIMULATED GUEST')} <span class="small">LEGAL-PT.md §1 · not legal advice</span>`, a: `<button type="button" class="btn-s" data-act="register" data-id="${esc(b.id)}">Record bulletin</button>` });
  for (const i of Object.values(S.issues).filter(i => i.status !== 'resolved' && i.severity === 'high' && (home === 'all' || i.homeId === home)))
    out.push({ l: 'I', t: `Urgent issue: ${i.type}, ${homeName(S, i.homeId)}`, x: `Raised ${fmtSim(i.firstRaisedAt || i.raisedAt, { year: false })}${i.cost ? `, about ${eur(i.cost)} (invented)` : ''}.`, k: badge('simulated'), a: '<a class="btn-s" href="#issues">Board</a>' });
  // Weather: the only real alerts, from IPMA's forecast as issued, for homes with guests tonight.
  for (const id of ids) {
    const w = ctx.weather?.[id];
    const dd = w?.days?.find(x => x.date === today);
    const guests = bookingsFor(S, id).filter(b => tonight(S, b, today));
    if (dd && Number(dd.rain_pct) >= 60 && guests.length)
      out.push({ l: 'W', t: `Rain ${dd.rain_pct}% at ${homeName(S, id)} today`, x: `IPMA, ${esc(w.place?.name || '')}: ${esc(dd.weather)}. ${guests.length} booking${guests.length > 1 ? 's' : ''} in house: suggest indoor plans.`, k: `${badge('real', 'REAL WEATHER')} ${sourceLine(w.res, { terms: false })}`, a: '' , raw: true });
  }
  // When IPMA's forecast could not be read, say so instead of leaving the weather alerts out (review S7).
  const failed = ids.map(id => ctx.weather?.[id]).filter(w => w?.res?.error);
  if (failed.length || ctx.weatherError) {
    const why = ctx.weatherError || failed[0].res.error;
    const some = !ctx.weatherError && failed.length < ids.length ? ' for some homes' : '';
    out.push({ l: 'W', t: 'Weather alerts could not be read', x: `IPMA's forecast (read through data.promptugal.news) could not be read just now (${esc(why)}), so no weather alert is shown${some}. That does not mean the weather is fine. Reload the page to try again.`, k: failed[0] ? sourceLine(failed[0].res, { terms: false }) : '', a: '', raw: true });
  }
  return out;
}

// ---------- Today ----------
export function today(S, ctx) {
  const { today: t, home, now } = ctx, ids = idsFor(home), bs = bookingsFor(S, home);
  if (!bs.length && !S.reviews.length) return quiet(ctx) + todayBody(S, ctx, ids, bs, t, now);
  return todayBody(S, ctx, ids, bs, t, now);
}
function quiet(ctx) {
  return `<div class="quiet"><h2>Quiet: nothing booked in this browser yet</h2><p>Book a home in <a href="/">Visitor</a> mode and it appears here at once (in this tab and any other). Or load a few invented guests, a message, an issue and two reviews, made for this demonstration around the simulated today.</p><p><button type="button" class="btn-s dark" data-act="examples">Load example activity (simulated)</button></p></div>`;
}
function todayBody(S, ctx, ids, bs, t, now) {
  const occupied = ids.filter(id => nightTakenBy(S, id, t, { now })).length;
  const guests = bs.filter(b => tonight(S, b, t)).reduce((n, b) => n + (b.guests?.total || 0), 0);
  const arr = bs.filter(b => b.from === t && ['held', 'paid', 'checked-in'].includes(b.status));
  const dep = bs.filter(b => b.to === t && ['paid', 'checked-in', 'checked-out'].includes(b.status));
  const jobs = Object.values(S.cleaning).filter(j => j.due === t && (ctx.home === 'all' || j.homeId === ctx.home));
  const issues = Object.values(S.issues).filter(i => i.status !== 'resolved' && (ctx.home === 'all' || i.homeId === ctx.home));
  const alerts = alertsFor(S, ctx);
  const m = Number(t.slice(5, 7));
  const rev = lines(S, { homeId: ctx.home === 'all' ? null : ctx.home, month: m, to: t });
  const tile = (label, big, small, warn) => `<div class="kpi${warn ? ' warn' : ''}"><p class="kl">${label}</p><p class="kv">${big}</p><p class="ks">${small}</p></div>`;
  const kpis = `<div class="kpis">${[
    tile('Homes occupied tonight', `${occupied} of ${ids.length}`, `${pct(occupied / ids.length)} · ${guests} guest${guests === 1 ? '' : 's'} here`),
    tile('Arrivals', arr.length, arr.map(b => `${SHORT[b.homeId]}, ${S.homes[b.homeId].check_in}`).join('; ') || 'none'),
    tile('Departures', dep.length, dep.map(b => `${SHORT[b.homeId]}, by ${S.homes[b.homeId].check_out}`).join('; ') || 'none'),
    tile('Cleanings', jobs.filter(j => j.status !== 'done').length, jobs.length ? `${jobs.filter(j => j.status === 'done').length} done` : 'none due'),
    tile('Open issues', issues.length, `${issues.filter(i => i.severity === 'high').length} urgent`, issues.length > 0),
    tile('Alerts', alerts.length, [...new Set(alerts.map(a => ({ B: 'booking', S: 'stock', L: 'bulletin', I: 'issue', W: 'weather' }[a.l])))].join(', ') || 'none', alerts.length > 0),
    tile(`${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} revenue to date`, eur(rev.revenue), badge('simulated')),
  ].join('')}</div>`;
  const ready = b => {
    if (b.to === t) return b.status === 'checked-out' ? '<span class="chip ok">key returned</span>' : `<span class="chip">leaves by ${S.homes[b.homeId].check_out}</span> <button type="button" class="btn-s" data-act="checkout" data-id="${esc(b.id)}">Check out</button>`;
    const job = Object.values(S.cleaning).find(j => j.homeId === b.homeId && j.status !== 'done');
    if (b.status === 'checked-in') return '<span class="chip ok">in house</span>';
    return `${job ? '<span class="chip warn">clean by 13:00</span>' : '<span class="chip ok">ready</span>'} ${b.status === 'paid' ? `<button type="button" class="btn-s" data-act="checkin" data-id="${esc(b.id)}">Check in</button>` : `<button type="button" class="btn-s" data-act="confirm" data-id="${esc(b.id)}">Confirm</button>`}`;
  };
  const inHouseYours = bs.filter(b => isYours(S, b) && tonight(S, b, t) && b.from !== t);
  const adRows = [...dep, ...arr, ...inHouseYours];
  const ad = adRows.length ? `<div class="tscroll"><table class="tbl"><thead><tr><th>Home</th><th>Guest</th><th>When</th><th class="n">Nights</th><th>Channel</th><th>Ready?</th></tr></thead><tbody>${adRows.map(b => `<tr><td>${esc(homeName(S, b.homeId))}</td><td>${guestCell(S, b)}</td><td>${b.to === t ? `leaves by ${S.homes[b.homeId].check_out}` : b.from === t ? `arrives ${S.homes[b.homeId].check_in}` : `in house, day ${daysBetween(b.from, t) + 1}`}</td><td class="n">${daysBetween(b.from, b.to)}</td><td>${channelWord(b)}</td><td>${ready(b)}</td></tr>`).join('')}</tbody></table></div>`
    : empty(`No arrivals or departures on ${esc(day(t))}.${nextArrival(S, ctx)}`);
  const occ = occupancyGrid(S, ids, t, 14, { now, today: t, realDay: d => ctx.clock.realDataFor(d).weather === 'issued' });
  const al = alerts.length ? `<ul class="alerts">${alerts.map(a => `<li><span class="disc d-${a.l}" aria-hidden="true">${a.l}</span><div><p><b>${esc(a.t)}</b> ${a.raw ? a.x : esc(a.x)}</p><div class="src">${a.k}</div></div><div class="aa">${a.a}</div></li>`).join('')}</ul>` : empty('No alerts. Stock is above the reorder points, no bulletin is due and no urgent issue is open.');
  const cl = jobs.length ? `<ul class="list">${jobs.map(j => `<li><b>${esc(homeName(S, j.homeId))}</b>: ${esc(j.note || 'turnover')} <span class="chip ${j.status === 'done' ? 'ok' : 'warn'}">${j.status === 'done' ? 'done' : 'to do'}</span>${j.status !== 'done' ? ` <button type="button" class="btn-s" data-act="clean-done" data-id="${esc(j.id)}">Mark done</button>` : ''}</li>`).join('')}</ul>` : empty('No cleaning due today.');
  const iss = issuesMini(S, ctx);
  const th = guestThreads(S, ctx.home).slice(-2).reverse();
  const msgs = th.length ? th.map(x => { const m = x.ms[x.ms.length - 1]; return `<div class="msg"><p><b>${esc(x.b ? guestName(S, x.b) : m.who || 'A guest')}</b> ${badge('invented')} · ${esc(x.b ? homeName(S, x.b.homeId) : '')} · ${esc(fmtSim(m.at, { year: false }))}</p>${m.from === 'guest' ? quote(m.text, m.flagged ?? undefined) : `<p>${esc(m.text)}</p>`}${lastDecision(S, x.id)}<p><a href="#messages">Reply</a></p></div>`; }).join('') : empty('No messages yet.');
  const rv = S.reviews.filter(r => ctx.home === 'all' || r.homeId === ctx.home).slice(-1)[0];
  const rev1 = rv ? `<p><b>${rv.rating} of 5</b> · ${esc(homeName(S, rv.homeId))} · ${esc(rv.authorName || 'a guest')} ${badge('invented')} ${badge('simulated', 'SIMULATED REVIEW')}</p>${quote(rv.text, rv.flagged)}<p><a href="#reviews">Reply</a></p>` : empty('No reviews yet.');
  return `${kpis}<div class="cols"><div class="col">
${panel('Arrivals and departures', ad, '<a href="#bookings">All bookings</a>')}
${panel(`Occupancy, next 14 days ${badge('simulated')}`, occ, '<a href="#calendar">Calendar</a>')}
${panel('Issues', iss, '<a href="#issues">Board</a>')}
</div><div class="col">
${panel('Alerts', al)}
${panel('Cleaning today', cl, '<a href="#cleaning">Schedule</a>')}
${panel('Messages', msgs, '<a href="#messages">Inbox</a>')}
${panel('Latest review', rev1, '<a href="#reviews">Reviews</a>')}
</div></div>`;
}
function nextArrival(S, ctx) {
  const n = bookingsFor(S, ctx.home).filter(b => b.from > ctx.today && ['held', 'paid'].includes(b.status)).sort((a, b) => a.from.localeCompare(b.from))[0];
  return n ? ` Next arrival: ${esc(guestName(S, n))} at ${esc(homeName(S, n.homeId))} on ${esc(day(n.from))}.` : '';
}
function lastDecision(S, target) {
  const e = decisionsFor(S, target).slice(-1)[0];
  return e ? `<p class="dec">${decisionBadge(e.decision, e.rule)} ${esc(actorName(e))}: ${esc(e.action)}. ${esc(e.reason)}</p>` : '';
}
function issuesMini(S, ctx) {
  const all = Object.values(S.issues).filter(i => ctx.home === 'all' || i.homeId === ctx.home);
  const col = (t, xs) => `<div><h3>${t} (${xs.length})</h3>${xs.slice(-3).map(i => `<div class="card-s"><b>${esc(i.type)}, ${esc(SHORT[i.homeId] || i.homeId)}</b><br><span class="small">${esc(i.severity)}${i.cost ? ` · ${eur(i.cost)} est.` : ''}</span></div>`).join('') || '<p class="small">none</p>'}</div>`;
  return `<div class="mini3">${col('New', all.filter(i => i.status !== 'resolved' && !i.started))}${col('In progress', all.filter(i => i.status !== 'resolved' && i.started))}${col('Done', all.filter(i => i.status === 'resolved'))}</div>`;
}

// ---------- Bookings ----------
export function bookings(S, ctx) {
  const bs = bookingsFor(S, ctx.home).slice().sort((a, b) => (ctx.sortDesc ? b.from.localeCompare(a.from) : a.from.localeCompare(b.from)));
  const sel = ctx.arg && S.bookings[ctx.arg];
  const rows = bs.map(b => {
    const q = b.quote || {};
    const duty = registrationDuty(b, S.guests[b.guestId]);
    const g = b.guests || {};
    return `<tr${sel && sel.id === b.id ? ' class="sel"' : ''}><td><a href="#bookings/${esc(b.id)}">${esc(b.id)}</a></td><td>${esc(SHORT[b.homeId])}</td><td>${guestCell(S, b)}</td><td>${esc(day(b.from))} to ${esc(day(b.to))}</td><td class="n">${daysBetween(b.from, b.to)}</td><td>${g.adults || 0} adult${g.adults === 1 ? '' : 's'}${(g.children || []).length ? `, children ${g.children.join(', ')}` : ''}</td><td>${channelWord(b)}</td><td class="n">${eur(q.price)}</td><td class="n">${eur(q.vat, 2)}</td><td class="n">${eur(q.touristTax, 2)}</td><td>${esc(STATUS_WORD[b.status] || b.status)}</td><td>${!duty.applies ? 'not needed' : b.registeredAt ? 'recorded' : ['paid', 'checked-in', 'checked-out'].includes(b.status) ? `due ${esc(day(duty.due))}` : 'later'}</td></tr>`;
  }).join('');
  const table = bs.length ? `<div class="tscroll" tabindex="0" role="region" aria-label="Bookings table"><table class="tbl wide"><thead><tr><th>Ref</th><th>Home</th><th>Guest</th><th><button type="button" class="linkbtn" data-act="sort">Dates ${ctx.sortDesc ? '(newest first)' : '(by arrival)'}</button></th><th class="n">Nights</th><th>Guests</th><th>Channel</th><th class="n">Gross</th><th class="n">VAT</th><th class="n">Tourist tax</th><th>Status</th><th>Bulletin</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : empty('No bookings in this browser yet. Book a home in Visitor mode, or load the example activity on Today.');
  return `${sel ? bookingSheet(S, ctx, sel) : ''}${panel(`Bookings ${badge('simulated')}`, `${table}<p class="small">Gross includes VAT (6%); the tourist tax is collected and passed on. Amounts invented; payments pretend: nothing was charged.</p>`, '<button type="button" class="btn-s" data-act="export-bookings">Export CSV (to your device)</button>')}`;
}
function bookingSheet(S, ctx, b) {
  const q = b.quote || {};
  const hist = (b.history || []).map(h => `<li>${esc(fmtSim(h.at, { year: false }))}: ${esc(STATUS_WORD[h.status] || h.status)}${h.by ? ` (by ${esc(h.by)})` : ''}</li>`).join('');
  const decs = decisionsFor(S, b.id).slice(-8).map(e => `<li>${decisionBadge(e.decision, e.rule)} ${esc(actorName(e))} · ${esc(e.action)} · ${esc(fmtSim(e.at, { year: false }))}</li>`).join('');
  const notes = (b.notes || []).map(n => `<li>${n.trusted === false ? quote(n.text) : esc(n.text)}</li>`).join('');
  const can = s => s.includes(b.status);
  const acts = [
    can(['enquiry', 'held']) && `<button type="button" class="btn-s dark" data-act="confirm" data-id="${esc(b.id)}">Confirm (pretend payment)</button>`,
    can(['paid']) && `<button type="button" class="btn-s" data-act="checkin" data-id="${esc(b.id)}">Check in</button>`,
    can(['checked-in']) && `<button type="button" class="btn-s" data-act="checkout" data-id="${esc(b.id)}">Check out</button>`,
    can(['enquiry', 'held', 'paid']) && `<button type="button" class="btn-s danger" data-act="cancel" data-id="${esc(b.id)}">Cancel (refund rule: 14+ days 100%, 7 to 13 days 50%)</button>`,
  ].filter(Boolean).join(' ');
  const move = can(['enquiry', 'held', 'paid']) ? `<div class="form-row"><label>Move to <input type="date" name="mv-from" data-keep="mv-from-${esc(b.id)}" value="${esc(b.from)}" min="${esc(ctx.clock.bounds().from)}" max="${esc(ctx.clock.bounds().to)}"></label><label>until <input type="date" name="mv-to" data-keep="mv-to-${esc(b.id)}" value="${esc(b.to)}" min="${esc(ctx.clock.bounds().from)}" max="${esc(addDays(ctx.clock.bounds().to, 1))}"></label><button type="button" class="btn-s" data-act="move" data-id="${esc(b.id)}">Move dates</button></div><p class="small">Inside the real-data window only (${esc(day(ctx.clock.bounds().from))} to ${esc(day(ctx.clock.bounds().to))}).</p>` : '';
  const note = `<div class="form-row"><label class="grow">Note <input type="text" name="note" data-keep="note-${esc(b.id)}" maxlength="200" placeholder="for example: late arrival, 22:00"></label><button type="button" class="btn-s" data-act="note" data-id="${esc(b.id)}">Add note</button></div>`;
  return panel(`Booking ${esc(b.id)} ${isYours(S, b) ? badge('yours') : badge('simulated')}`, `<div class="sheet">
<p><b>${esc(guestName(S, b))}</b> at ${esc(homeName(S, b.homeId))}, ${esc(day(b.from))} to ${esc(day(b.to))} (${daysBetween(b.from, b.to)} nights), ${esc(channelWord(b))}. Status: <b>${esc(STATUS_WORD[b.status] || b.status)}</b>.</p>
<p>Price ${eur(q.price, 2)} (VAT ${eur(q.vat, 2)}), tourist tax ${eur(q.touristTax, 2)}, guest pays ${eur(q.guestPays, 2)}${q.commission ? `, platform commission ${eur(q.commission, 2)}` : ''}. ${b.payment ? esc(b.payment.note) : ''}</p>
<div class="acts">${acts || '<span class="small">No action: the stay is over or cancelled.</span>'}</div>${move}${note}
<div class="cols2"><div><h3>History (from the event log)</h3><ul class="list">${hist}</ul>${notes ? `<h3>Notes</h3><ul class="list">${notes}</ul>` : ''}</div><div><h3>Policy decisions on this booking</h3><ul class="list">${decs || '<li class="small">none yet</li>'}</ul></div></div>
<p><a href="#bookings">Close</a></p></div>`);
}

// ---------- Calendar ----------
export function calendar(S, ctx) {
  const b = ctx.clock.bounds(), from = b.from, days = daysBetween(b.from, b.to) + 1, ids = idsFor(ctx.home);
  const occ = ids.map(id => { const n = nightsOf(from, addDays(b.to, 1)); const t = n.filter(d => nightTakenBy(S, id, d, { now: ctx.now })).length; return { id, t, n: n.length }; });
  const tot = occ.reduce((a, o) => a + o.t, 0) / Math.max(1, occ.reduce((a, o) => a + o.n, 0));
  const head = `<p>Occupancy ${esc(day(from))} to ${esc(day(b.to))}: ${occ.map(o => `${esc(SHORT[o.id])} ${pct(o.t / o.n)}`).join(' · ')} · <b>total ${pct(tot)}</b> ${badge('simulated')}</p>`;
  const grid = occupancyGrid(S, ids, from, days, { now: ctx.now, today: ctx.today, realDay: d => ctx.clock.realDataFor(d).weather === 'issued' });
  const form = `<h3>Block days (owner use, maintenance)</h3><div class="form-row">${homeSelect('bl-home', ctx.home === 'all' ? 'salt' : ctx.home, S)}<label>From <input type="date" name="bl-from" data-keep="bl-from" min="${esc(from)}" max="${esc(b.to)}" value="${esc(ctx.today)}"></label><label>until <input type="date" name="bl-to" data-keep="bl-to" min="${esc(from)}" max="${esc(addDays(b.to, 1))}" value="${esc(addDays(ctx.today, 2))}"></label><label class="grow">Reason <input type="text" name="bl-why" data-keep="bl-why" maxlength="60" value="owner use"></label><button type="button" class="btn-s dark" data-act="block">Block</button></div><p class="small">A block over a booking, or over nights booked elsewhere, is refused with the reason.</p>`;
  const feeds = `<h3>Calendar feeds (iCal)</h3><ul class="list">${ids.map(id => `<li><b>${esc(homeName(S, id))}</b>: <button type="button" class="btn-s" data-act="export-ical" data-home="${id}">Export feed (iCal), to your device</button> <span class="small">Imported from: ${S.blocks.some(k => k.homeId === id && !k.owner) ? 'booking platform feed (simulated)' : 'nothing yet'}; see <a href="#integrations">Integrations</a>.</span></li>`).join('')}</ul>`;
  return panel(`Calendar and occupancy ${badge('simulated')}`, head + grid + form + feeds);
}

// ---------- Cleaning ----------
export function cleaning(S, ctx) {
  const t = ctx.today, days = Array.from({ length: 7 }, (_, i) => addDays(t, i));
  const assigned = id => S.messages.filter(m => m.kind === 'assign' && m.jobId === id).slice(-1)[0];
  const itemsFor = d => {
    const out = [];
    for (const j of Object.values(S.cleaning).filter(j => j.due === d && (ctx.home === 'all' || j.homeId === ctx.home))) out.push({ job: j, homeId: j.homeId, what: j.note || 'turnover', status: j.status });
    for (const b of bookingsFor(S, ctx.home).filter(b => b.to === d && ['paid', 'checked-in'].includes(b.status)))
      if (!out.some(o => o.job && o.job.bookingId === b.id)) out.push({ planned: b, homeId: b.homeId, what: `turnover after ${guestName(S, b)} leaves`, status: 'planned' });
    for (const o of out) {
      const next = bookingsFor(S, o.homeId).find(b => b.from === d && ['held', 'paid'].includes(b.status));
      const h = S.homes[o.homeId];
      o.window = next ? `${h.check_out} to ${h.check_in}` : `from ${h.check_out}, nobody arrives`;
      o.next = next;
      o.linen = `${h.bedrooms} linen set${h.bedrooms > 1 ? 's' : ''}, ${Math.min(h.sleeps * 2, 12)} towels`;
    }
    return out;
  };
  const card = o => {
    const a = o.job && assigned(o.job.id);
    return `<div class="card-s"><b>${esc(SHORT[o.homeId])}</b>: ${esc(o.what)}<br><span class="small">${esc(o.window)} · ${esc(o.linen)}</span><br>${o.status === 'done' ? '<span class="chip ok">done</span>' : o.status === 'planned' ? '<span class="chip">planned (after check-out)</span>' : `<span class="chip warn">to do</span> ${a ? `<span class="small">${esc(a.to === 'housekeeper' ? 'Fátima' : a.to)} ${badge('invented')}</span>` : `<button type="button" class="btn-s" data-act="assign" data-id="${esc(o.job.id)}">Assign to Fátima</button>`} <button type="button" class="btn-s" data-act="clean-done" data-id="${esc(o.job.id)}">Mark done</button>`}</div>`;
  };
  const two = [t, addDays(t, 1)].map(d => { const xs = itemsFor(d); return `<li><h3>${d === t ? 'Today' : 'Tomorrow'}, ${esc(day(d))}</h3>${xs.length ? xs.map(o => `<p>${esc(SHORT[o.homeId])}: ${o.next ? `${esc(guestName(S, o.next))} comes at ${esc(S.homes[o.homeId].check_in)}` : 'nobody arrives'}; ${esc(o.what)}.</p>`).join('') : '<p class="small">Nobody leaves.</p>'}</li>`; }).join('');
  const board = `<div class="board7" tabindex="0" role="region" aria-label="Cleaning, next 7 days">${days.map(d => { const xs = itemsFor(d); const turn = xs.filter(o => o.status !== 'done').length; return `<div class="bcol"><h3>${esc(day(d))}</h3>${turn > 1 ? `<p class="flag">Conflict: ${turn} turnovers, one cleaner</p>` : ''}${xs.map(card).join('') || '<p class="small">nothing</p>'}</div>`; }).join('')}</div>`;
  return panel('Who leaves today, and who comes at three?', `<ul class="two">${two}</ul>`) + panel(`Cleaning schedule, next 7 days ${badge('simulated')}`, `${board}<p class="small">Cleaning jobs are made when a guest checks out. Fátima is an invented person; "Assign" sends her a message inside the simulation (nothing leaves the browser). Turnover cost ${eur(S.settings.cleaningCost)} plus laundry ${eur(S.settings.laundryCost)} (invented).</p>`);
}

// ---------- Stock ----------
export function stock(S, ctx) {
  const m = ctx.today.slice(0, 7);
  const used = {};
  for (const e of ctx.events) if (e.type === 'stock.changed' && String(e.at).startsWith(m)) for (const [k, n] of Object.entries(e.data.delta || {})) if (n < 0) { const key = `${e.data.homeId}|${k}`; used[key] = (used[key] || 0) - n; }
  const elapsed = Math.max(1, Number(ctx.today.slice(8, 10)) - (m === '2026-11' ? 16 : 0));
  const tables = idsFor(ctx.home).map(id => {
    const st = S.stock[id] || {}, l = S.laundry[id] || {};
    const rows = Object.entries(st).map(([k, v]) => {
      const u = used[`${id}|${k}`] || 0, perDay = u / elapsed;
      const low = v.qty + (v.laundered ? (l[k] || 0) : 0) <= v.min;
      return `<tr class="${low ? 'low' : ''}"><td>${esc(v.label)}</td><td class="n">${v.qty <= 0 ? '0 <span class="small">count needed</span>' : esc(v.qty)}</td><td class="n">${v.laundered ? esc(l[k] || 0) : '-'}</td><td class="n">${u ? esc(Math.round(u * 10) / 10) : '0'}</td><td class="n">${esc(v.min)}</td><td class="n">${perDay ? Math.floor(v.qty / perDay) : 'no use yet'}</td><td class="n">${eur(v.unitCost, 2)}</td><td>${low ? '<span class="chip warn hatch">Reorder</span>' : '<span class="chip ok">ok</span>'} <button type="button" class="btn-s" data-act="reorder" data-home="${id}" data-item="${esc(k)}">Reorder ${esc(v.reorderQty)} (${eur(v.reorderQty * v.unitCost)})</button></td></tr>`;
    }).join('');
    return `<h3>${esc(homeName(S, id))}</h3><div class="tscroll" tabindex="0" role="region" aria-label="Stock, ${esc(homeName(S, id))}"><table class="tbl wide"><thead><tr><th>Item</th><th class="n">On hand</th><th class="n">At the laundry</th><th class="n">Used this month</th><th class="n">Reorder point</th><th class="n">Days left at this use</th><th class="n">Unit cost</th><th>State</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');
  return panel(`Stock and reorder ${badge('simulated')}`, `${tables}<p class="small">Stock goes down when guests check out (welcome pack, cleaning kit, linen and towels to the laundry, gas, firewood, pool chemicals) and linen comes back when the cleaning is done. A reorder is placed by the host's assistant from a cash-and-carry (a type of supplier, invented prices): up to ${eur(S.settings.spendLimit)} it may order alone, above that the owner approves (rule H14-limit). Quantities and costs invented.</p>`);
}

// ---------- Issues ----------
export function issues(S, ctx) {
  const all = Object.values(S.issues).filter(i => ctx.home === 'all' || i.homeId === ctx.home);
  const card = i => {
    const b = i.bookingId ? S.bookings[i.bookingId] : null;
    const fromGuest = i.trusted === false && i.reportedBy !== 'housekeeper' && i.reportedBy !== 'owner';
    return `<div class="card-s"><b>${esc(i.type)}</b>, ${esc(homeName(S, i.homeId))}<br><span class="small">from ${esc(fromGuest ? 'a guest report' : i.reportedBy || 'the simulation')} · ${esc(i.severity)} · ${i.cost ? `${eur(i.cost)} est. (invented)` : 'no cost'}${b ? ` · ${esc(guestName(S, b))}` : ''} · ${esc(fmtSim(i.firstRaisedAt || i.raisedAt, { year: false }))}</span>
${fromGuest && i.text ? quote(i.text, i.flagged) : ''}
${i.status === 'resolved' ? `<p class="small">Resolved ${esc(fmtSim(i.resolvedAt, { year: false }))}${i.cost ? `, ${eur(i.cost)} to repairs` : ''}.</p>` : `<div class="acts">${!i.started ? `<button type="button" class="btn-s" data-act="issue-start" data-id="${esc(i.id)}">Start (book the repair)</button>` : ''}<label class="inl">Cost <input type="number" min="0" max="5000" step="1" name="cost" data-keep="cost-${esc(i.id)}" value="${esc(i.cost || 0)}"></label><button type="button" class="btn-s dark" data-act="issue-done" data-id="${esc(i.id)}">Done</button>${fromGuest ? ` <button type="button" class="btn-s" data-act="assistant-act" data-kind="issue" data-id="${esc(i.id)}">Let the host's assistant act on the guest's words</button>` : ''}</div>${lastDecision(S, `issue ${i.id}`)}`}</div>`;
  };
  const col = (t, xs) => `<div class="bcol"><h3>${t} (${xs.length})</h3>${xs.map(card).join('') || '<p class="small">none</p>'}</div>`;
  const form = `<h3>Report an issue (as the housekeeper)</h3><div class="form-row">${homeSelect('is-home', ctx.home === 'all' ? 'cape' : ctx.home, S)}<label class="grow">What <input type="text" name="is-what" data-keep="is-what" maxlength="80" placeholder="for example: dripping tap"></label><label>Urgency <select name="is-sev" data-keep="is-sev">${opt('low', 'low')}${opt('medium', 'medium', 'medium')}${opt('high', 'high')}</select></label><button type="button" class="btn-s dark" data-act="issue-raise">Report</button></div>`;
  return panel(`Issues board ${badge('simulated')}`, `<div class="board3">${col('New', all.filter(i => i.status !== 'resolved' && !i.started))}${col('In progress', all.filter(i => i.status !== 'resolved' && i.started))}${col('Done', all.filter(i => i.status === 'resolved'))}</div>${form}<p class="small">Text from guests is shown inside a quote, marked untrusted. The host's assistant may read it, but any action whose instruction comes from that text is denied (rule N-untrusted-instruction) and logged.</p>`);
}

// ---------- Messages ----------
export function messages(S, ctx) {
  const th = guestThreads(S, ctx.home).reverse();
  const body = th.length ? th.map(x => {
    const ms = x.ms.map(m => `<div class="bub ${m.from === 'guest' ? 'in' : 'out'}"><p class="small">${esc(m.from === 'guest' ? (x.b ? guestName(S, x.b) : m.who || 'a guest') : m.from === 'owner' ? 'You (the owner, simulated)' : m.from)} · ${esc(fmtSim(m.at, { year: false }))}${m.held ? ' <span class="k untr">HELD BY THE POLICY: NOT PASSED ON</span>' : ''}</p>${m.from === 'guest' ? quote(m.text, m.flagged) : `<p>${esc(m.text)}</p>`}</div>`).join('');
    return `<article class="thread"><h3>${x.b ? `${esc(guestName(S, x.b))} ${isYours(S, x.b) ? badge('yours') : badge('invented')} · ${esc(homeName(S, x.b.homeId))}, ${esc(day(x.b.from))} to ${esc(day(x.b.to))}` : 'Other messages'}</h3>${ms}${lastDecision(S, `message ${x.id}`)}
<div class="form-row"><label class="grow">Reply <textarea name="reply" rows="2" maxlength="600" data-keep="reply-${esc(x.id)}"></textarea></label></div><div class="acts"><button type="button" class="btn-s dark" data-act="reply" data-id="${esc(x.id)}">Send reply</button> <button type="button" class="btn-s" data-act="assistant-act" data-kind="message" data-id="${esc(x.id)}">Let the host's assistant act on the guest's words</button></div></article>`;
  }).join('') : empty('No messages yet. A guest can write from their stay page; synthetic guests write in World mode; or load the example activity on Today.');
  return panel(`Messages ${badge('simulated')}`, `${body}<p class="small">Replies stay in this browser: nothing is emailed or sent.</p>`);
}

// ---------- Reviews ----------
export function reviews(S, ctx) {
  const rs = S.reviews.filter(r => ctx.home === 'all' || r.homeId === ctx.home).slice().reverse();
  const avg = HOME_IDS.map(id => { const x = S.reviews.filter(r => r.homeId === id && !r.held); return x.length ? `${SHORT[id]} ${(x.reduce((a, r) => a + r.rating, 0) / x.length).toFixed(1)} (${x.length})` : `${SHORT[id]} none`; }).join(' · ');
  const body = rs.length ? rs.map(r => {
    const replies = S.messages.filter(m => m.kind === 'review-reply' && m.reviewId === r.id);
    const b = S.bookings[r.bookingId];
    return `<article class="thread"><h3>${r.rating ? `${r.rating} of 5` : 'No rating'} · ${esc(homeName(S, r.homeId))} · ${esc(r.authorName || 'a guest')} ${badge('invented')} ${badge('simulated', 'SIMULATED REVIEW')}${r.held ? ' <span class="k untr">HELD BY THE POLICY: NOT PUBLISHED</span>' : ''}</h3><p class="small">${b ? `Stay ${esc(day(b.from))} to ${esc(day(b.to))} · ` : ''}posted ${esc(fmtSim(r.at, { year: false }))}</p>${quote(r.text, r.flagged)}
${replies.map(m => `<div class="bub out"><p class="small">Your public reply · ${esc(fmtSim(m.at, { year: false }))}</p><p>${esc(m.text)}</p></div>`).join('')}${lastDecision(S, `review ${r.id}`)}
<div class="form-row"><label class="grow">Reply <textarea name="rreply" rows="2" maxlength="600" data-keep="rreply-${esc(r.id)}"></textarea></label></div><div class="acts"><button type="button" class="btn-s" data-act="draft-reply" data-id="${esc(r.id)}">Draft a reply with the assistant</button> <button type="button" class="btn-s dark" data-act="publish-reply" data-id="${esc(r.id)}">Publish reply</button>${r.flagged ? ` <button type="button" class="btn-s" data-act="assistant-act" data-kind="review" data-id="${esc(r.id)}">Let the host's assistant act on this review</button>` : ''}</div></article>`;
  }).join('') : empty('No reviews yet. Guests review after check-out (World mode), or load the example activity on Today.');
  return panel(`Reviews ${badge('simulated')}`, `<p>Average per home: ${esc(avg)}</p>${body}<p class="small">A review that holds an instruction is shown as written; the host's assistant refuses to act on it (the decision shows beside it and in the policy log). The assistant only drafts replies; the owner publishes them (rule H8).</p>`);
}
export { CHANNELS };
