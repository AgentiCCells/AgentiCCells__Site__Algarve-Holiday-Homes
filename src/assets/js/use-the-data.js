// use-the-data.js: fills the "Status now" column on /use-the-data/ from the catalogue,
// https://data.promptugal.news/api/v1/index.json (each source's status and read_at), read in
// the browser when the page opens. Sends nothing; on failure says so and shows no status.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1 fixes (review S6). Code Apache-2.0.
import { API, getJSON, fmtUTC, ago, staleAfterMin, esc } from './data.js';

const cells = [...document.querySelectorAll('[data-status]')];
const note = document.getElementById('status-note');
async function fill() {
  if (!cells.length) return;
  for (const c of cells) c.textContent = 'reading...';
  const r = await getJSON(`${API}/index.json`);
  const when = new Date();
  if (!r.ok) {
    for (const c of cells) c.innerHTML = '<span class="muted">could not read the catalogue</span>';
    if (note) note.textContent = `The catalogue could not be read just now (${r.error}); no status is shown in its place.`;
    return;
  }
  for (const c of cells) {
    const s = (r.data.sources || []).find(x => x.id === c.dataset.status);
    if (!s) { c.innerHTML = '<span class="muted">not in the catalogue</span>'; continue; }
    const t = Date.parse(s.read_at);
    const min = Number.isFinite(t) ? Math.max(0, Math.round((when - t) / 60000)) : null;
    const stale = min === null || min > staleAfterMin(s.cadence);
    const read = `read ${fmtUTC(s.read_at)}, ${ago(min)}`;
    c.innerHTML = `${esc(s.status || 'no status')}; ${stale ? `<strong class="stale">${esc(read)}, may be out of date</strong>` : esc(read)}`;
  }
  if (note) note.textContent = `Status and read time from the catalogue (api/v1/index.json), read by your browser at ${fmtUTC(when.toISOString())}.`;
}
fill();
