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

// The guest of a booking, with its kind: the visitor's own booking, a synthetic or example guest, or a calendar feed.
export function isYours(S, b) { const g = S.guests[b.guestId]; return !b.persona && b.channel === 'direct' && Boolean(g?.typedHere); }
export function guestName(S, b) { return S.guests[b.guestId]?.name || 'A guest'; }
export function guestCell(S, b) {
  return `${esc(guestName(S, b))} ${isYours(S, b) ? badge('yours') : badge('invented')}`;
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
        cls = isYours(S, b) ? 'yours' : b.channel === 'platform' ? 'platform' : 'direct';
        if (b.status === 'held') cls += ' held';
        label = guestName(S, b); title = `${label}: ${STATUS_WORD[b.status] || b.status}, ${channelWord(b)}, ${b.from} to ${b.to}`;
      } else if (sg.t.blockId) {
        const k = S.blocks.find(x => x.id === sg.t.blockId) || {};
        cls = k.owner ? 'block' : 'platform';
        label = k.owner ? (k.summary || 'blocked') : 'calendar feed';
        title = `${k.owner ? 'Blocked by the owner' : 'Imported from a calendar feed (iCal), simulated'}: ${k.summary || ''}${k.flagged ? ' (instruction-like text marked)' : ''}`;
      }
      return `<div class="oc-b ${cls}" style="grid-column:${sg.start + 2} / span ${sg.n};grid-row:${r + 2}" title="${esc(title)}"><span>${sg.n > 1 || cls !== 'bg' ? esc(label) : ''}</span></div>`;
    }).join('');
    return `<div class="oc-name" style="grid-row:${r + 2}">${esc(homeName(S, id))}</div>${cells}${bars}`;
  }).join('');
  return `<div class="oc-scroll" tabindex="0" role="region" aria-label="Occupancy, ${days} days from ${esc(day(from))}"><div class="oc" style="grid-template-columns:8.5rem repeat(${days}, minmax(2.1rem, 1fr))">${head}${rows}</div></div>
<p class="oc-legend"><span class="sw yours"></span>your booking <span class="sw direct"></span>direct (simulated) <span class="sw platform"></span>booking platform or calendar feed (simulated) <span class="sw block"></span>blocked by the owner <span class="sw bg"></span>booked elsewhere (simulated background) <span class="ul">underline: real weather exists</span></p>`;
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
