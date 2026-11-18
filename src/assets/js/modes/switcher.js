// modes/switcher.js: the mode switcher of the Cinco Chaminés simulation (a made-up example), as an
// HTML string. Pure: no DOM, no network, so scripts/lib.mjs can write it into every page's header
// at build time and chrome.js can use the same list in the browser. Each mode is a link (an
// address), not a button (team/rounds/3/design/PROPOSAL.md, section 1.2).
// Code Apache-2.0. Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance D),
// 2026-11-18, round 3.

export const MODES = Object.freeze([
  { id: 'visitor', href: '/', label: 'Visitor' },
  { id: 'stay', href: '/stay/', label: 'Guest\'s stay', hint: 'after you book' },
  { id: 'admin', href: '/admin/', label: 'Admin' },
  { id: 'play', href: '/play/', label: 'Side by side' },
  { id: 'world', href: '/world/', label: 'World' },
  { id: 'agents', href: '/agents/', label: 'Agents' },
]);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// modeFor(path) -> the mode id a page belongs to, or null (behind the scenes, Use the data, ...).
export function modeFor(path = '/') {
  const p = String(path || '/');
  for (const m of MODES) if (m.id !== 'visitor' && p.startsWith(m.href)) return m.id;
  if (p === '/' || p === '/index.html' || p.startsWith('/homes/') || p.startsWith('/agent/')) return 'visitor';
  return null;
}

// switcherHTML(path) -> the mode bar: the links, then an empty slot that chrome.js fills with
// the simulated clock, About this demo and Reset when a mode page mounts it.
export function switcherHTML(path = '/') {
  const cur = modeFor(path);
  const links = MODES.map(m => `<a href="${m.href}" data-mode="${m.id}"${m.id === cur ? ' aria-current="page"' : ''}>${esc(m.label)}${m.hint ? `<span class="mode-hint" hidden> (${esc(m.hint)})</span>` : ''}</a>`).join('');
  return `<div class="modebar" data-mode-current="${cur || ''}"><nav class="modes" aria-label="Modes">${links}</nav><div class="mode-tools" id="mode-tools"></div></div>`;
}
