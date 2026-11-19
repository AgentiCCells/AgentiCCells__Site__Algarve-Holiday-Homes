// admin/util.js: small helpers shared by the admin sections of the Cinco Chaminés simulation (a
// made-up example). Pure: they build HTML strings from the state; no network.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis (instance D), 2026-11-18, round 3.

import { esc, fmtSim, badge, decisionBadge, actorName } from '../modes/chrome.js';
import { bookingsList, ACTIVE } from '../sim/store.js';
import { nightTakenBy } from '../sim/booking.js';
import { addDays, nightsOf, daysBetween } from '../sim/util.js';
import { detectInjection } from '../sim/abp.js';

export { esc, fmtSim, badge, decisionBadge, actorName, bookingsList, ACTIVE, addDays, nightsOf, daysBetween };

export const HOME_IDS = ['salt', 'lagoon', 'hill', 'harbour', 'cape'];
export const SHORT = { salt: 'Salt', lagoon: 'Lagoon', hill: 'Hill', harbour: 'Harbour', cape: 'Cape' };
export const eur = (n, dp = 0) => `${Number(n) < 0 ? '-' : ''}€${Math.abs(Number(n) || 0).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
export const pct = n => `${Math.round((Number(n) || 0) * 100)}%`;
export const homeName = (S, id) => S.homes[id]?.name || id;
export const day = d => fmtSim(d, { time: false, year: false });

// The guest of a booking, with its kind: the tour's booking, the visitor's own booking, a synthetic or
// example guest, or a calendar feed. The tour's booking (its guest has tour: true, round 4 PROPOSAL.md
// 1.2) is checked first and is never counted as the visitor's, even after "Keep what the tour did".
export const isTour = (S, b) => Boolean(b && S.guests[b.guestId]?.tour);
export function isYours(S, b) { if (!b || isTour(S, b)) return false; const g = S.guests[b.guestId]; return !b.persona && b.channel === 'direct' && Boolean(g?.typedHere); }
export function guestName(S, b) { return S.guests[b.guestId]?.name || 'A guest'; }
export function guestCell(S, b) {
  if (isTour(S, b)) return `The tour's booking ${badge('simulated')}`;
  return `${esc(guestName(S, b))} ${isYours(S, b) ? badge('yours') : badge('invented')}`;
}

// ---------- whose text caused a refusal (round 4, PROPOSAL.md 5.2) ----------
// textFor(S, entry) -> { kind, id, text, item, found } for the first provenance item of a log entry:
// by its ref when it has one; older logs without ref: the excerpt matched against messages and
// reviews by their first 140 characters; else the excerpt only.
export function textFor(S, e) {
  const p = (e?.provenance || []).find(x => x.trusted === false) || (e?.provenance || [])[0];
  if (!p) return null;
  const ex = String(p.excerpt || '');
  const find = (kind, id) => (kind === 'message' ? S.messages.find(m => m.id === id) : kind === 'review' ? S.reviews.find(r => r.id === id) : kind === 'issue' ? S.issues?.[id] : null);
  if (p.ref?.id) { const item = find(p.ref.kind, p.ref.id); if (item) return { kind: p.ref.kind, id: p.ref.id, text: String(item.text || ex), item, found: true, source: p.source }; }
  if (ex) {
    const m = S.messages.find(x => String(x.text || '').slice(0, 140) === ex);
    if (m) return { kind: 'message', id: m.id, text: m.text, item: m, found: true, source: p.source };
    const r = S.reviews.find(x => String(x.text || '').slice(0, 140) === ex);
    if (r) return { kind: 'review', id: r.id, text: r.text, item: r, found: true, source: p.source };
  }
  return { kind: p.ref?.kind || null, id: p.ref?.id || null, text: ex, item: null, found: false, source: p.source };
}
// whoseText(S, entry, t) -> 'the tour' | 'your text' | 'example activity' | 'an invented guest', in that order.
export function whoseText(S, e, t = textFor(S, e)) {
  const item = t?.item || null;
  const bk = item?.bookingId ? S.bookings[item.bookingId] : null;
  if (e?.by === 'tour' || item?.by === 'tour' || (bk && isTour(S, bk))) return 'the tour';
  if (e?.who === 'visitor' || item?.who === 'visitor' || item?.author === 'visitor' || (bk && isYours(S, bk))) return 'your text';
  if (e?.by === 'example' || item?.by === 'example' || item?.author === 'example' || bk?.persona === 'example') return 'example activity';
  return 'an invented guest';
}
export const STATUS_WORD = { enquiry: 'enquiry (to confirm)', held: 'held', paid: 'confirmed', 'checked-in': 'in house', 'checked-out': 'checked out', cancelled: 'cancelled' };
export const channelWord = b => (b.channel === 'platform' ? 'booking platform' : b.channel === 'ical' ? 'calendar feed (iCal)' : 'direct');

// Bookings filtered by the home filter.
export const bookingsFor = (S, home) => bookingsList(S).filter(b => home === 'all' || b.homeId === home);
export const idsFor = home => (home === 'all' ? HOME_IDS : [home]);

// ---------- the occupancy strip (Today: 14 days; Calendar: the whole window) ----------
// occupancy(S, ids, from, days, { now, realDay }) -> HTML: one row per home, bars by what takes each night.
export function occupancyGrid(S, ids, from, days, { now, realDay = () => false, today } = {}) {
  const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
  const head = dates.map((d, i) => {
    const dt = new Date(`${d}T12:00:00Z`);
    return `<div class="oc-h${d === today ? ' today' : ''}${realDay(d) ? ' real' : ''}" style="grid-column:${i + 2}"><span>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getUTCDay()]}</span><b>${dt.getUTCDate()}</b></div>`;
  }).join('');
  const rows = ids.map((id, r) => {
    const segs = [];
    let cur = null;
    dates.forEach((d, i) => {
      const t = nightTakenBy(S, id, d, { now });
      const key = t ? (t.bookingId || t.blockId || 'bg') : null;
      if (cur && cur.key === key && key) { cur.n++; return; }
      if (cur && cur.key) segs.push(cur);
      cur = { key, t, start: i, n: 1 };
    });
    if (cur && cur.key) segs.push(cur);
    const cells = dates.map((d, i) => `<div class="oc-c${d === today ? ' today' : ''}" style="grid-column:${i + 2};grid-row:${r + 2}"></div>`).join('');
    const bars = segs.map(sg => {
      let cls = 'bg', label = 'booked elsewhere', title = 'Simulated background occupancy: bookings from elsewhere, no money or guests here';
      if (sg.t.bookingId) {
        const b = S.bookings[sg.t.bookingId];
        cls = isTour(S, b) ? 'tour' : isYours(S, b) ? 'yours' : b.channel === 'platform' ? 'platform' : 'direct';
        if (b.status === 'held') cls += ' held';
        label = isTour(S, b) ? 'The tour\'s booking' : guestName(S, b); title = `${label}: ${STATUS_WORD[b.status] || b.status}, ${channelWord(b)}, ${b.from} to ${b.to}`;
      } else if (sg.t.blockId) {
        const k = S.blocks.find(x => x.id === sg.t.blockId) || {};
        cls = k.owner ? 'block' : 'platform';
        label = k.owner ? (k.summary || 'blocked') : 'calendar feed';
        title = `${k.owner ? 'Blocked by the owner' : 'Imported from a calendar feed (iCal), simulated'}: ${k.summary || ''}${k.flagged ? ' (instruction-like text marked)' : ''}`;
      }
      return `<div class="oc-b ${cls}" style="grid-column:${sg.start + 2} / span ${sg.n};grid-row:${r + 2}" title="${esc(title)}"><span>${sg.n > 1 || cls !== 'bg' ? esc(label) : ''}</span></div>`;
    }).join('');
    return `<div class="oc-name" style="grid-row:${r + 2}"${id === 'lagoon' ? ' data-tour="occ-lagoon"' : ''}>${esc(homeName(S, id))}</div>${cells}${bars}`;
  }).join('');
  return `<div class="oc-scroll" tabindex="0" role="region" aria-label="Occupancy, ${days} days from ${esc(day(from))}"><div class="oc" style="grid-template-columns:8.5rem repeat(${days}, minmax(2.1rem, 1fr))">${head}${rows}</div></div>
<p class="oc-legend"><span class="sw yours"></span>your booking ${Object.values(S.bookings).some(b => isTour(S, b)) ? '<span class="sw tour"></span>the tour\'s booking ' : ''}<span class="sw direct"></span>direct (simulated) <span class="sw platform"></span>booking platform or calendar feed (simulated) <span class="sw block"></span>blocked by the owner <span class="sw bg"></span>booked elsewhere (simulated background) <span class="ul">underline: real weather exists</span></p>`;
}

// Download a file built in the page (nothing is uploaded).
export function download(name, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const csv = rows => rows.map(r => r.map(v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n') + '\n';

// The untrusted quote: text from guests, reviews and feeds, shown as text, marked.
export function quote(text, flagged) {
  if (flagged === undefined || flagged === null) flagged = detectInjection(text).flagged;
  return `<blockquote class="untr-q">${esc(text)}</blockquote><p class="untr-m">${badge('untrusted')}${flagged ? ' <span class="k untr">INSTRUCTION-LIKE TEXT FLAGGED</span>' : ''} <span class="small">Shown as text. The assistants treat it as material, never as an instruction.</span></p>`;
}
// The policy decisions that name a target.
export const decisionsFor = (S, target) => (S.policyLog || []).filter(e => e.target === target);
