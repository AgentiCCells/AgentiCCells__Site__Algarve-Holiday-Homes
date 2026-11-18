// site.js: on every page of the Cinco Chaminés site (a made-up example): the "Menu" button
// that opens the navigation on narrow screens. Stores nothing, sends nothing. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.
const btn = document.querySelector('.site-head .menu');
const nav = document.getElementById('site-nav');
if (btn && nav) {
  const set = open => { btn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); } });
}
