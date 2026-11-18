// stay/sim-page.js: what the visitor pages of Cinco Chaminés (a made-up example) share to talk
// to the simulation in this browser: one store (localStorage "cc.sim.v1"), one guard (the
// browser Agent Behaviour Policies), the booking API and the clock bounded by the real-data
// window, made once per page. Plus the visitor's own bookings, the frame check for /play/, the
// four kind badges and the three decision badges, and the shared frame (mode switcher, clock,
// About this demo, reset, policy log) when the modes module is there.
// Nothing here sends anything: the only reads are the site's own files and data.promptugal.news
// (through clock.loadBounds and data.js). Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance E), 2026-11-18, round 3.
import { createStore, bookingsList } from '../sim/store.js';
import { createClock, loadBounds, FALLBACK_BOUNDS } from '../sim/clock.js';
import { createBooking } from '../sim/booking.js';
import { createGuard } from '../sim/abp.js';
import { addMinutes, toMs } from '../sim/util.js';
import { hostReply } from './content.js';

let P = null;
let CHROME = null;
const loadChrome = () => (CHROME ||= import('/assets/js/modes/chrome.js').catch(() => null));
// sim() -> Promise<{ store, guard, booking, clock, bounds: Promise<bounds> }>, once per page. When the
// shared frame's module (modes/chrome.js, developer instance D) is there, its getSim() is used, so
// the page and the frame (clock pill, policy log drawer) share one store; otherwise the same parts
// are made here.
export function sim() {
  if (P) return P;
  P = (async () => {
    const m = await loadChrome();
    if (m && typeof m.getSim === 'function') {
      const S = m.getSim();
      return { store: S.store, guard: S.guard, booking: S.booking, clock: S.clock, bounds: S.boundsReady || Promise.resolve(S.clock.bounds()) };
    }
    const store = createStore();
    store.load();
    const guard = createGuard({ store });
    const booking = createBooking({ store, guard });
    const clock = createClock({ store, bounds: FALLBACK_BOUNDS });
    const bounds = loadBounds().then(b => { clock.setBounds(b); return b; }).catch(() => FALLBACK_BOUNDS);
    return { store, guard, booking, clock, bounds };
  })();
  return P;
}

// The visitor's own bookings: made on this site in this browser (guest typed here), newest first.
export const OWN_STATUSES = ['held', 'paid', 'checked-in', 'checked-out'];
export function ownBookings(state, statuses = OWN_STATUSES) {
  return bookingsList(state).filter(b => state.guests[b.guestId]?.typedHere && statuses.includes(b.status)).reverse();
}
// The booking the visitor would call "my stay": the first paid or checked-in one by arrival, else the last checked-out.
export function currentStay(state) {
  const live = ownBookings(state, ['paid', 'checked-in']).sort((a, b) => a.from.localeCompare(b.from));
  return live[0] || ownBookings(state, ['checked-out'])[0] || null;
}

// Inside /play/ (or with ?embed) the outer page carries the band, header and log: hide ours.
export function isEmbedded() {
  let framed = false;
  try { framed = window.self !== window.top; } catch { framed = true; }
  let q = false;
  try { q = new URLSearchParams(location.search).has('embed'); } catch { /* no address */ }
  return framed || q;
}
export function markEmbed() {
  if (!isEmbedded()) return false;
  document.documentElement.classList.add('embed');
  if (!document.getElementById('cc-embed-style')) {
    const st = document.createElement('style');
    st.id = 'cc-embed-style';
    st.textContent = 'html.embed .band,html.embed .site-head,html.embed .site-foot,html.embed .dock,html.embed .skip,html.embed .cc-chrome-hide{display:none!important}html.embed body{padding-bottom:16px}';
    document.head.append(st);
  }
  return true;
}

// The four kinds and three decisions (PROPOSAL.md section 0): the word is always there.
const KIND = { real: 'REAL', sim: 'SIMULATED', simulated: 'SIMULATED', inv: 'INVENTED', invented: 'INVENTED', ai: 'AI-GENERATED' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// kb('real', 'REAL FORECAST') -> a badge; the second argument replaces the word, keeping the colour.
export function kb(kind, words) {
  const k = kind === 'simulated' ? 'sim' : kind === 'invented' ? 'inv' : kind;
  return `<span class="kb ${esc(k)}">${esc(words || KIND[kind] || kind)}</span>`;
}
// db({ decision, rule }) -> "ALLOW · V10"
export function db(d) {
  if (!d) return '';
  const w = String(d.decision || '').toLowerCase();
  return `<span class="db ${esc(w)}">${esc(w.toUpperCase())}${d.rule ? ` · ${esc(d.rule)}` : ''}</span>`;
}

// The shared frame from the modes module (developer instance D), when it exists: mode switcher
// state, clock pill, About this demo, Reset and the policy log drawer. Never inside a frame of
// /play/ (the outer page carries them).
export async function chrome(mode) {
  if (isEmbedded()) return null;
  const m = await loadChrome();
  if (!m || typeof m.mountChrome !== 'function') return null;
  try { await sim(); return m.mountChrome({ mode }); } catch (e) { if (globalThis.console) console.error('cc chrome failed', e); return null; }
}

// Simulated time in words: "Sat 21 Nov 2026, 09:40".
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtSim(t) {
  const s = String(t || ''); const d = new Date(`${s.slice(0, 10)}T12:00:00Z`);
  if (isNaN(d)) return s;
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${s.slice(11, 16)}`;
}
export const eur = n => `EUR ${Number(n || 0).toFixed(2).replace(/\.00$/, '')}`;

// The visitor's own stay follows the simulated clock: check-in at the home's check-in time on the
// arrival day, check-out at its check-out time on the departure day (stock used, cleaning job),
// and the scripted host answers each guest message 20 simulated minutes later. Every step goes
// through the guard. One writer per tab: /stay/ runs it on its own, /play/ runs it for its frames.
// The guard logs before the change lands, so re-entry from the store's notifications is blocked.
let busy = false;
export function ownLifecycle(S) {
  if (busy) return;
  busy = true;
  try {
    const st = S.store.getState(), now = S.store.clock().now;
    for (const b of ownBookings(st, ['paid', 'checked-in'])) {
      const h = st.homes[b.homeId];
      if (b.status === 'paid' && toMs(now) >= toMs(`${b.from}T${h?.check_in || '16:00'}`)) S.booking.checkIn(b.id, { actor: 'visitor', ownGuestId: b.guestId });
      const cur = S.store.getState().bookings[b.id];
      if (cur.status === 'checked-in' && toMs(now) >= toMs(`${b.to}T${h?.check_out || '10:00'}`)) S.booking.checkOut(b.id, { actor: 'visitor', ownGuestId: b.guestId });
    }
    const s2 = S.store.getState();
    const own = new Set(ownBookings(s2).map(b => b.id));
    for (const m of s2.messages.filter(x => x.from === 'guest' && x.who === 'visitor' && own.has(x.bookingId))) {
      if (S.store.getState().messages.some(x => x.replyTo === m.id)) continue;
      const due = addMinutes(m.at, 20);
      if (toMs(now) < toMs(due)) continue;
      const d = S.guard('owner', 'message.send', { who: 'owner', target: m.bookingId, provenance: [{ source: 'scripted host reply', trusted: true, role: 'instruction', text: 'reply to the guest' }] });
      if (d.decision === 'allow') S.store.dispatch({ type: 'message.added', at: due, actor: 'owner', data: { message: { id: `${m.id}-r`, replyTo: m.id, from: 'host', who: 'owner', bookingId: m.bookingId, homeId: m.homeId, text: hostReply(m.text), trusted: true, scripted: true } } });
    }
  } finally { busy = false; }
}
