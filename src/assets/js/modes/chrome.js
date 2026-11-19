// modes/chrome.js: the shared frame of every mode page of the Cinco Chaminés simulation (a made-up
// example): the mode switcher's state, the simulated clock pill, the "About this demo" panel, the
// Reset button and the policy log drawer (team/rounds/3/design/PROPOSAL.md, sections 0 and 1).
// Every state lives in the visitor's own browser (sim/store.js, localStorage "cc.sim.v1");
// nothing is sent anywhere. Works inside an iframe (no frame-busting); with ?embed in the address
// the drawer is left out (the side-by-side page shows its own).
//
//   import { mountChrome, getSim, badge, decisionBadge } from '/assets/js/modes/chrome.js';
//   const sim = mountChrome({ mode: 'admin' });   // -> { store, clock, guard, booking, embed, unmount }
//   badge('real') / badge('simulated') / badge('invented') / badge('ai') / badge('untrusted') -> HTML
//   decisionBadge('deny', 'N-untrusted-instruction') -> HTML (links to the rule on /admin/#policies)
//
// Code Apache-2.0. Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance D),
// 2026-11-18, round 3.

import { createStore, bookingsList, playedWhen } from '../sim/store.js';
import { createClock, loadBounds, FALLBACK_BOUNDS } from '../sim/clock.js';
import { createGuard, POLICIES } from '../sim/abp.js';
import { createBooking } from '../sim/booking.js';
import { MODES, modeFor } from './switcher.js';

export { MODES, modeFor };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- one simulation per page ----------
let SIM = null;
// getSim() -> { store, clock, guard, booking, persistent }: the page's one store, clock, guard and
// booking API. Every module on a page should use this, so they share one copy of the state.
export function getSim(opts = {}) {
  if (SIM) return SIM;
  const store = createStore(opts.homes ? { homes: opts.homes } : {});
  store.load();
  const clock = createClock({ store, bounds: FALLBACK_BOUNDS });
  const guard = createGuard({ store });
  const booking = createBooking({ store, guard });
  SIM = { store, clock, guard, booking, persistent: storageWorks(), boundsReady: null };
  // The real-data window from the live files (data.promptugal.news only); the researched constants until then.
  SIM.boundsReady = loadBounds().then(b => { clock.setBounds(b); return b; }).catch(() => FALLBACK_BOUNDS);
  return SIM;
}
function storageWorks() {
  try { const s = globalThis.localStorage; const k = '__cc_chrome_test__'; s.setItem(k, '1'); s.removeItem(k); return true; } catch { return false; }
}

// ---------- small shared helpers ----------
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// fmtSim('2026-11-21T09:40') -> 'Sat 21 Nov 2026, 09:40' (simulated time, Portugal local, no zone).
export function fmtSim(t, { time = true, year = true } = {}) {
  const s = String(t || '');
  const d = new Date(`${s.slice(0, 10)}T12:00:00Z`);
  if (isNaN(d)) return s;
  const day = `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}${year ? ` ${d.getUTCFullYear()}` : ''}`;
  return time && s.length >= 16 ? `${day}, ${s.slice(11, 16)}` : day;
}
// Short names for the actors in the policy log.
export const ACTOR_NAMES = Object.freeze({
  'agent.cinco-chamines': 'site agent', 'guest-assistant': 'guest\'s assistant', 'host-assistant': 'host\'s assistant',
  housekeeper: 'housekeeper', owner: 'owner', bookkeeper: 'bookkeeper', visitor: 'visitor',
});
export const actorName = e => ACTOR_NAMES[e?.policy] || ACTOR_NAMES[e?.actor] || String(e?.actor || 'unknown');

// badge(kind, label?) -> HTML. kind: real | simulated | invented | ai | untrusted | yours.
const KINDS = { real: ['real', 'REAL'], simulated: ['sim', 'SIMULATED'], sim: ['sim', 'SIMULATED'], invented: ['inv', 'INVENTED'], ai: ['ai', 'AI-GENERATED'], 'ai-generated': ['ai', 'AI-GENERATED'], untrusted: ['untr', 'UNTRUSTED TEXT'], yours: ['yours', 'YOUR BOOKING'],
  // Round 4: a value the owner can change and that nobody has checked for them (PROPOSAL.md 0.2).
  assumption: ['assum', 'ASSUMPTION'], tour: ['sim', 'THE TOUR\'S BOOKING'] };
export function badge(kind, label) {
  const [cls, word] = KINDS[String(kind).toLowerCase()] || ['sim', String(kind).toUpperCase()];
  return `<span class="k ${cls}">${esc(label || word)}</span>`;
}
// decisionBadge(decision, rule, { link }) -> HTML: ALLOW / ASK / DENY, monospace, always with the rule id.
export function decisionBadge(decision, rule, { link = true } = {}) {
  const d = ['allow', 'ask', 'deny'].includes(decision) ? decision : 'deny';
  const text = `${d.toUpperCase()}${rule ? ` · ${rule}` : ''}`;
  return link && rule ? `<a class="d ${d}" href="/admin/#policies/${encodeURIComponent(rule)}" title="Show the rule">${esc(text)}</a>` : `<span class="d ${d}">${esc(text)}</span>`;
}
// The visitor's own booking (made on this site in this browser, not by a synthetic visitor).
export function visitorBooking(state) {
  const mine = bookingsList(state).filter(b => !b.persona && b.channel === 'direct' && ['held', 'paid', 'checked-in', 'checked-out'].includes(b.status));
  return mine.length ? mine[mine.length - 1] : null;
}

// ---------- the band, per mode (the made-up band is always first in <body>) ----------
export const BANDS = Object.freeze({
  visitor: 'Cinco Chaminés is invented: homes, prices, availability and bookings are simulated in your browser, and the pictures are AI-generated. The weather, sea, UV and events are real, read live from data.promptugal.news.',
  stay: 'Cinco Chaminés is invented: this booking, the guest, the host and the check-in details are simulated in your browser. The weather and events are real, read from data.promptugal.news.',
  admin: 'The back office of an invented business: every booking, guest, cost and figure here is simulated in your browser. Weather and warnings are real (IPMA via data.promptugal.news). Not legal or tax advice.',
  play: 'The visitor site and the admin of an invented business, side by side, simulated in your browser. The weather and events are real, read from data.promptugal.news.',
  world: 'Synthetic people, invented and AI-made, play out an invented business in your browser. The weather and events they meet are real, read from data.promptugal.news.',
  agents: 'Two assistants, shown as Claude (simulated: scripted, no live model), act for an invented guest and an invented host in your browser. The weather and events are real.',
});

// ---------- mountChrome ----------
// mountChrome({ mode, sim, band }) -> sim plus { embed, unmount }.
//   mode: 'visitor' | 'stay' | 'admin' | 'play' | 'world' | 'agents'
//   sim: an existing getSim() result (default: getSim())
//   band: false to leave the page's band words as they are
export function mountChrome({ mode = 'visitor', sim = null, band = true } = {}) {
  const S = sim || getSim();
  const { store, clock } = S;
  const doc = document, root = doc.documentElement;
  const embed = new URLSearchParams(location.search).has('embed');
  root.classList.add('has-chrome', `mode-${mode}`);
  if (mode !== 'visitor') root.classList.add('mode-app');
  if (embed) root.classList.add('embed');
  const cleanups = [];

  // The band: per mode, and the warning when this browser keeps nothing.
  const bandEl = doc.querySelector('.band');
  if (bandEl && band) {
    const words = BANDS[mode] || BANDS.visitor;
    bandEl.innerHTML = `<strong>Made-up example.</strong> ${esc(words)} <button type="button" class="linklike" data-about-open>About this demo</button>`;
  }
  if (bandEl && !S.persistent) bandEl.insertAdjacentHTML('beforeend', ' <strong class="band-warn">Your browser is not keeping this simulation; it ends when you close the page.</strong>');

  // The mode switcher (rendered at build time by scripts/lib.mjs; made here if the page has none).
  let bar = doc.querySelector('.modebar');
  if (!bar) {
    const holder = doc.createElement('div');
    holder.innerHTML = `<div class="modebar"><nav class="modes" aria-label="Modes">${MODES.map(m => `<a href="${m.href}" data-mode="${m.id}">${esc(m.label)}${m.hint ? `<span class="mode-hint" hidden> (${esc(m.hint)})</span>` : ''}</a>`).join('')}</nav><div class="mode-tools" id="mode-tools"></div></div>`;
    bar = holder.firstElementChild;
    (bandEl || doc.body.firstElementChild)?.insertAdjacentElement(bandEl ? 'afterend' : 'beforebegin', bar);
  }
  for (const a of bar.querySelectorAll('.modes a')) { if (a.dataset.mode === mode) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
  if (embed) for (const a of bar.querySelectorAll('.modes a')) a.target = '_top';
  const cur = bar.querySelector('.modes a[aria-current]');
  if (cur && bar.querySelector('.modes').scrollWidth > bar.querySelector('.modes').clientWidth) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  const tools = bar.querySelector('.mode-tools');
  tools.innerHTML = `
<div class="clockwrap"><button type="button" class="clock" aria-expanded="false" aria-controls="clock-menu" title="The simulated time: change it here or on the side-by-side page"><span class="clock-t">Simulated: ${esc(fmtSim(store.clock().now))}</span><span class="clock-behind" hidden></span></button>
<div class="clock-menu" id="clock-menu" hidden role="group" aria-label="Move the simulated clock">
<button type="button" data-clock="-1440">Back one day</button><button type="button" data-clock="60">Forward one hour</button><button type="button" data-clock="1440">Forward one day</button><button type="button" data-clock="first">Back to the first real day</button>
<p class="clock-note">The clock is simulated and stays inside the days with real data (<span class="clock-range"></span>).</p></div></div>
<button type="button" class="tbtn about" aria-expanded="false" aria-controls="about-panel" data-about-open>About this demo</button>
<button type="button" class="tbtn reset">Reset</button>`;

  // About this demo
  const about = doc.createElement('div');
  about.className = 'about-panel'; about.id = 'about-panel'; about.hidden = true;
  about.setAttribute('role', 'dialog'); about.setAttribute('aria-labelledby', 'about-h'); about.tabIndex = -1;
  about.innerHTML = `<h2 id="about-h">This is a demo of ...</h2>
<p>... a small holiday-home business run with agents, all in your browser. Nothing is sent anywhere.</p>
<ul>
<li>${badge('real')}<span>Weather, sea, UV and warnings as IPMA issued them; events from public agendas. Both via data.promptugal.news, with the time each was read.</span></li>
<li>${badge('simulated')}<span>Availability, bookings, payments (pretend), guests, stock, cleaning, issues, messages, reviews, money, the agents and their decisions.</span></li>
<li>${badge('invented')}<span>The company Cinco Chaminés, the five homes, prices, rules, check-in details, suggestions of places to eat, every person.</span></li>
<li>${badge('ai')}<span>Every picture of a home or of the Algarve (an image model); no photograph.</span></li>
</ul>
<p class="foot">State is kept in this browser only (localStorage). Reset clears it. Taxes and rules shown are a simulation, not legal or tax advice. The assistants are scripted, not a live model. <a href="/behind-the-scenes/">How it was made</a></p>
<button type="button" class="tbtn about-close">Close</button>`;
  bar.insertAdjacentElement('afterend', about);
  const aboutBtn = tools.querySelector('.about');
  let aboutReturn = null;
  const setAbout = (open, from) => {
    about.hidden = !open; aboutBtn.setAttribute('aria-expanded', String(open));
    if (open) { aboutReturn = from || aboutBtn; about.focus(); } else if (aboutReturn) { aboutReturn.focus(); aboutReturn = null; }
  };
  for (const b of doc.querySelectorAll('[data-about-open]')) b.addEventListener('click', e => setAbout(about.hidden, e.currentTarget));
  about.querySelector('.about-close').addEventListener('click', () => setAbout(false));

  // The clock pill and its menu
  const clockBtn = tools.querySelector('.clock'), clockMenu = tools.querySelector('.clock-menu');
  const setClockMenu = open => { clockMenu.hidden = !open; clockBtn.setAttribute('aria-expanded', String(open)); if (open) clockMenu.querySelector('button').focus(); };
  clockBtn.addEventListener('click', () => setClockMenu(clockMenu.hidden));
  clockMenu.addEventListener('click', e => {
    const v = e.target.closest('button')?.dataset.clock; if (!v) return;
    if (v === 'first') clock.setTime(`${clock.bounds().from}T09:00`);
    else clock.setTime(addMin(store.clock().now, Number(v)));
    try { S.booking.expireHolds(); } catch { /* nothing to expire */ }
  });
  const showClock = () => {
    const c = store.clock(), p = typeof store.playedTo === 'function' ? store.playedTo() : null;
    tools.querySelector('.clock-t').textContent = `Simulated: ${fmtSim(c.now)}`;
    const cb = tools.querySelector('.clock-behind'), behindNow = Boolean(p && c.now < p);
    cb.hidden = !behindNow; cb.textContent = behindNow ? `(earlier than played, ${playedWhen(p)})` : '';
    const b = clock.bounds(); tools.querySelector('.clock-range').textContent = `${fmtSim(b.from, { time: false })} to ${fmtSim(b.to, { time: false })}`;
  };

  // Reset, with a confirm
  const dlg = doc.createElement('dialog');
  dlg.className = 'reset-dlg'; dlg.setAttribute('aria-labelledby', 'reset-h');
  dlg.innerHTML = `<h2 id="reset-h">Reset the simulation?</h2><p>${esc(RESET_WORDS)}</p><div class="row"><button type="button" class="tbtn reset" data-do="reset">Reset</button> <button type="button" class="tbtn" data-do="keep">Keep</button></div>`;
  doc.body.appendChild(dlg);
  const doReset = () => { clock.pause(); resetAll(store); };
  tools.querySelector('.reset').addEventListener('click', () => {
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else if (globalThis.confirm(`Reset the simulation? ${RESET_WORDS}`)) doReset();
  });
  dlg.addEventListener('click', e => { const d = e.target.closest('button')?.dataset.do; if (!d) return; dlg.close(); if (d === 'reset') doReset(); tools.querySelector('.reset').focus(); });

  // Escape and clicks outside close the popovers
  const onKey = e => {
    if (e.key !== 'Escape') return;
    if (!about.hidden) setAbout(false);
    if (!clockMenu.hidden) { setClockMenu(false); clockBtn.focus(); }
  };
  const onClick = e => {
    if (!about.hidden && !about.contains(e.target) && !e.target.closest('[data-about-open]')) { about.hidden = true; aboutBtn.setAttribute('aria-expanded', 'false'); }
    if (!clockMenu.hidden && !e.target.closest('.clockwrap')) setClockMenu(false);
  };
  doc.addEventListener('keydown', onKey); doc.addEventListener('click', onClick);
  cleanups.push(() => { doc.removeEventListener('keydown', onKey); doc.removeEventListener('click', onClick); });

  // The policy log drawer
  const drawer = embed ? null : mountDrawer(doc, store);
  if (drawer) root.classList.add('has-pdrawer');

  // A tour left half-way (round 4, PROPOSAL.md 1.2 item 5): offer to put the simulation back. Not on
  // /play/ while its own tour runs there, and not inside a frame.
  if (!embed) {
    const bar2 = doc.createElement('div');
    bar2.className = 'tour-left'; bar2.hidden = true; bar2.setAttribute('role', 'region'); bar2.setAttribute('aria-label', 'A tour was stopped');
    bar2.innerHTML = '<p><b>A tour was stopped before the end.</b> Put your simulation back as it was before the tour? <button type="button" class="tbtn" data-tour-left="back">Put it back</button> <button type="button" class="tbtn" data-tour-left="keep">Keep as it is</button></p>';
    about.insertAdjacentElement('afterend', bar2);
    const showLeft = () => { bar2.hidden = !(tourBackup() && !globalThis.__ccTourRunning); };
    bar2.addEventListener('click', e => {
      const v = e.target.closest('[data-tour-left]')?.dataset.tourLeft; if (!v) return;
      if (v === 'back') { const t = tourBackup(); if (t) store.importJSON(t); }
      clearTourBackup(); showLeft();
    });
    showLeft();
    globalThis.addEventListener?.('storage', showLeft);
    cleanups.push(store.subscribe(showLeft));
  }

  // Guest's stay is greyed until the visitor has a booking here.
  const stayLink = bar.querySelector('.modes a[data-mode="stay"]');
  const showStay = state => {
    if (!stayLink) return;
    const has = Boolean(visitorBooking(state));
    stayLink.classList.toggle('waiting', !has);
    const hint = stayLink.querySelector('.mode-hint'); if (hint) hint.hidden = has;
  };

  const render = (state, info = {}) => {
    showClock(); showStay(state);
    if (drawer) drawer.update(state, info);
  };
  render(store.getState(), { kind: 'load' });
  cleanups.push(store.subscribe(render));
  S.boundsReady?.then(() => showClock());
  return { ...S, embed, unmount: () => { for (const c of cleanups) c(); } };
}
// ---------- Reset and the keys this site keeps (round 4, PROPOSAL.md 0.3) ----------
export const RESET_WORDS = 'This deletes, in this browser only: your simulation (bookings, messages, the admin\'s changes), your stay plan, your cost assumptions, your best scores, and a tour\'s saved copy if one is waiting. Real data is read again.';
export const KEPT_KEYS = Object.freeze(['cc.stay.v1', 'cc.assumptions.v1', 'cc.world.scores.v1', 'cc.tour.backup.v1']);
export function tourBackup() { try { return globalThis.localStorage?.getItem('cc.tour.backup.v1') || null; } catch { return null; } }
export function clearTourBackup() { try { globalThis.localStorage?.removeItem('cc.tour.backup.v1'); } catch { /* blocked */ } }
// resetAll(store): the simulation back to its first day (every setting to its default, so the level
// of bookings from elsewhere is 1 again), and every other key this site keeps removed.
export function resetAll(store, { storage, session } = {}) {
  store.reset();
  const ls = storage === undefined ? (() => { try { return globalThis.localStorage; } catch { return null; } })() : storage;
  for (const k of KEPT_KEYS) { try { ls?.removeItem(k); } catch { /* blocked */ } }
  // The dates this tab kept (sessionStorage cc-stay, review S11).
  if (session === undefined) { try { globalThis.sessionStorage?.removeItem('cc-stay'); } catch { /* blocked */ } }
  else { try { session?.removeItem('cc-stay'); } catch { /* blocked */ } }
  try { globalThis.dispatchEvent?.(new Event('cc-reset')); } catch { /* not a browser */ }
}
const addMin = (t, m) => new Date(Date.parse(`${String(t).slice(0, 16)}:00Z`) + m * 60000).toISOString().slice(0, 16);

// ---------- the drawer ----------
function provenanceText(e) {
  const p = (e.provenance || [])[0];
  if (!p) return 'source: the actor\'s own principal';
  return `source: ${p.source}${p.trusted === false ? ' (untrusted)' : ''}`;
}
function mountDrawer(doc, store) {
  const el = doc.createElement('section');
  el.className = 'pdrawer'; el.setAttribute('aria-label', 'Policy log');
  el.innerHTML = `<div class="pd-bar"><b>Policy log</b><span class="pd-cnt"></span><span class="pd-last"></span><button type="button" class="pd-open" aria-expanded="false" aria-controls="pd-sheet">Open log</button></div>
<div class="pd-sheet" id="pd-sheet" hidden>
<div class="pd-filters"><label>Actor <select class="pd-actor"><option value="">all</option>${Object.entries(ACTOR_NAMES).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('')}</select></label>
<label>Decision <select class="pd-dec"><option value="">all</option><option value="allow">allow</option><option value="ask">ask</option><option value="deny">deny</option></select></label>
<span class="pd-note">Every action in this simulation passes the Agent Behaviour Policy guard in your browser. Newest first.</span></div>
<div class="pd-table" tabindex="0" role="region" aria-label="Policy decisions"></div></div>
<p class="sr-only" aria-live="polite"></p>`;
  doc.body.appendChild(el);
  const live = el.querySelector('[aria-live]');
  const btn = el.querySelector('.pd-open'), sheet = el.querySelector('.pd-sheet');
  btn.addEventListener('click', () => { const open = sheet.hidden; sheet.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close log' : 'Open log'; el.classList.toggle('open', open); if (open) table(store.getState()); });
  el.querySelector('.pd-actor').addEventListener('change', () => table(store.getState()));
  el.querySelector('.pd-dec').addEventListener('change', () => table(store.getState()));
  let lastSeen = (store.getState().policyLog || []).length ? store.getState().policyLog[store.getState().policyLog.length - 1].seq : 0;
  function table(state) {
    if (sheet.hidden) return;
    const a = el.querySelector('.pd-actor').value, d = el.querySelector('.pd-dec').value;
    const rows = (state.policyLog || []).filter(e => (!a || e.policy === a || e.actor === a) && (!d || e.decision === d)).slice(-200).reverse();
    el.querySelector('.pd-table').innerHTML = rows.length ? `<table><thead><tr><th scope="col">Time (sim)</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Decision</th><th scope="col">Rule says</th><th scope="col">Instruction source</th></tr></thead><tbody>${rows.map(e => `<tr><td>${esc(fmtSim(e.at, { year: false }))}</td><td>${esc(actorName(e))}</td><td>${esc(e.action)}</td><td>${esc(e.target ?? '')}${e.amount != null ? ` (EUR ${esc(e.amount)})` : ''}</td><td>${decisionBadge(e.decision, e.rule)}</td><td>${esc(e.reason)}</td><td>${esc(provenanceText(e))}${(e.flagged || []).length ? ' <span class="k untr">INJECTION FLAGGED</span>' : ''}</td></tr>`).join('')}</tbody></table>`
      : '<p class="pd-empty">No decisions yet. Ask the agent something, or book a home.</p>';
  }
  function update(state, info) {
    const log = state.policyLog || [];
    const denied = log.filter(e => e.decision === 'deny').length, asked = log.filter(e => e.decision === 'ask').length;
    el.querySelector('.pd-cnt').textContent = `${log.length} decision${log.length === 1 ? '' : 's'} · ${denied} denied · ${asked} asked`;
    const last = log[log.length - 1];
    el.querySelector('.pd-last').innerHTML = last ? `${decisionBadge(last.decision, last.rule, { link: false })} ${esc(actorName(last))} · ${esc(last.action)} · "${esc(String(last.reason || '').slice(0, 90))}" · ${esc(provenanceText(last))} · sim ${esc(String(last.at || '').slice(11, 16))}`
      : 'No decisions yet. Ask the agent something, or book a home.';
    const fresh = log.filter(e => e.seq > lastSeen);
    if (info.kind !== 'load' && info.kind !== 'reset') {
      const deny = fresh.filter(e => e.decision === 'deny');
      if (deny.length) {
        const e = deny[deny.length - 1];
        live.textContent = `Denied: ${actorName(e)}, ${e.action}, rule ${e.rule}. ${e.reason}`;
        el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      }
    }
    lastSeen = last ? last.seq : 0;
    table(state);
  }
  return { el, update };
}

// The policies, for pages that list them (from sim/abp.js; the same as sim/policies.json).
export { POLICIES };
