// world/frame.js: the shared frame for /world/ and /agents/ of the Cinco Chaminés simulation
// (a made-up example). Uses the shared chrome (/assets/js/modes/chrome.js: mode switcher, clock,
// About this demo, Reset, policy log drawer) and, only if that file cannot be loaded, draws a
// small stand-in with the same parts so the page still says what it is. Also the four kind
// badges and the three decision badges, as the design proposal sets them (section 0).
// Sends nothing, stores nothing itself. Code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance F), 2026-11-18, round 3.

import { esc } from '../sim/util.js';

const KINDS = { real: 'Real', sim: 'Simulated', inv: 'Invented', ai: 'AI-generated' };
export const kindBadge = (kind, text) => `<span class="k ${esc(kind)}">${esc(text || KINDS[kind] || kind)}</span>`;
export function decisionChip(d, { reason = false } = {}) {
  if (!d) return '';
  const dec = String(d.decision || d).toLowerCase();
  const cls = dec === 'allow' ? 'allow' : dec === 'ask' ? 'ask' : 'deny';
  return `<span class="d ${cls}" title="${esc(d.reason || '')}">${esc(dec.toUpperCase())}${d.rule ? ` ${esc(d.rule)}` : ''}</span>${reason && d.reason ? ` <span class="d-why">${esc(d.reason)}</span>` : ''}`;
}

const MODES = [['/', 'Visitor'], ['/stay/', "Guest's stay"], ['/admin/', 'Admin'], ['/play/', 'Side by side'], ['/world/', 'World'], ['/agents/', 'Agents']];

// mountFrame(mode, { homes }) -> { shared, store, clock, guard, booking }: one simulation for the page.
// With the shared chrome, its getSim() store is used, so the frame and the page share one state.
export async function mountFrame(mode, { homes = null, chromeUrl = '/assets/js/modes/chrome.js' } = {}) {
  try {
    // Only ask for the shared chrome if it is there (a HEAD to this site, so a missing file is not an error).
    const r = await fetch(chromeUrl, { method: 'HEAD', cache: 'no-store' });
    if (r.ok) {
      const m = await import(chromeUrl);
      if (typeof m.mountChrome === 'function' && typeof m.getSim === 'function') {
        const sim = m.getSim(homes ? { homes } : {});
        m.mountChrome({ mode, sim });
        return { shared: true, ...sim };
      }
    }
  } catch (e) { /* fall back to the stand-in */ }
  const [{ createStore }, { createClock }, { createGuard }, { createBooking }] = await Promise.all([import('../sim/store.js'), import('../sim/clock.js'), import('../sim/abp.js'), import('../sim/booking.js')]);
  const store = createStore(homes ? { homes } : {});
  store.load();
  const clock = createClock({ store, timers: null });
  const guard = createGuard({ store });
  standIn(mode, store);
  return { shared: false, store, clock, guard, booking: createBooking({ store, guard }) };
}

// The stand-in: modes, the simulated clock, About this demo, Reset (with a confirm) and a one-line policy log.
function standIn(mode, store) {
  if (document.querySelector('.ccf')) return;
  const bar = document.createElement('div');
  bar.className = 'ccf';
  bar.innerHTML = `<nav class="ccf-modes" aria-label="Modes">${MODES.map(([h, t]) => `<a href="${h}"${h === `/${mode}/` ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('')}</nav>
<div class="ccf-tools"><span class="ccf-clock" id="ccf-clock">Simulated: ...</span>
<button type="button" class="tbtn about" id="ccf-about" aria-expanded="false" aria-controls="ccf-about-p">About this demo</button>
<button type="button" class="tbtn reset" id="ccf-reset">Reset</button></div>
<div class="ccf-about" id="ccf-about-p" hidden>
<h2>This is a demo of ...</h2><p>... a small holiday-home business run with agents, all in your browser. Nothing is sent anywhere.</p>
<ul><li>${kindBadge('real')} Weather, sea and warnings as IPMA issued them; events from public agendas; both via data.promptugal.news.</li>
<li>${kindBadge('sim')} Availability, bookings, payments, guests, stock, cleaning, issues, messages, reviews, money, the agents and their decisions.</li>
<li>${kindBadge('inv')} The company, the five homes, prices, rules, every person.</li>
<li>${kindBadge('ai')} Every picture of a home or of the Algarve.</li></ul>
<p class="mini">State is kept in this browser only (localStorage). Reset clears it. Taxes and rules shown are a simulation, not legal or tax advice. <a href="/behind-the-scenes/">Behind the scenes</a></p></div>`;
  const main = document.getElementById('main');
  main.parentNode.insertBefore(bar, main);
  const drawer = document.createElement('div');
  drawer.className = 'ccf-drawer';
  drawer.innerHTML = '<b>Policy log</b> <span id="ccf-log" class="ccf-last">No decisions yet.</span>';
  document.body.appendChild(drawer);
  document.body.classList.add('has-ccf');
  const about = bar.querySelector('#ccf-about'), panel = bar.querySelector('#ccf-about-p');
  const setAbout = open => { about.setAttribute('aria-expanded', String(open)); panel.hidden = !open; };
  about.addEventListener('click', () => setAbout(panel.hidden));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setAbout(false); about.focus(); } });
  bar.querySelector('#ccf-reset').addEventListener('click', () => {
    if (store && confirm('Reset the simulation? Bookings, messages and the admin\'s changes in this browser are deleted.')) store.reset();
  });
  const paint = () => {
    if (!store) return;
    const s = store.getState(), c = store.clock();
    const d = new Date(`${c.now}:00Z`);
    bar.querySelector('#ccf-clock').textContent = `Simulated: ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}, ${c.now.slice(11, 16)}`;
    const log = s.policyLog || [], last = log[log.length - 1];
    drawer.querySelector('#ccf-log').innerHTML = `${log.length} decisions &middot; ${s.stats?.denied || 0} denied${last ? ` &middot; ${decisionChip(last)} ${esc(last.who || last.actor)} &rarr; ${esc(last.action)}` : ''}`;
  };
  if (store) { store.subscribe(paint); paint(); }
}
