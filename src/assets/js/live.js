// /live/: Live from the Algarve. Draws the camera list and an inline SVG map from
// /data/cameras.json (the researcher's file), read in the browser. No tiles, no third party,
// no embeds: every camera links out to its operator's own page.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18. Code Apache-2.0.

import { homes as loadHomes } from './data.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// The camera page's host and path, shown in small text under its link (review S11).
const hostPath = u => { try { const x = new URL(u); return x.host.replace(/^www\./, '') + x.pathname; } catch { return String(u || ''); } };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateWords = iso => { const d = new Date(`${iso}T12:00:00Z`); return isNaN(d) ? String(iso || 'unknown') : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const shortOp = op => String(op || '').split(' (')[0];
const km = (a, b) => {
  const R = 6371, r = x => x * Math.PI / 180, dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Equirectangular map: lon -9.0 to -7.35, lat 36.95 to 37.35, x scaled by cos(37.15 degrees).
const LON0 = -9.0, LON1 = -7.35, LAT0 = 36.95, LAT1 = 37.35, K = 1000, CX = Math.cos(37.15 * Math.PI / 180);
const W = Math.round((LON1 - LON0) * CX * K), H = Math.round((LAT1 - LAT0) * K);
const px = (lon, lat) => [Math.round((lon - LON0) * CX * K * 10) / 10, Math.round((LAT1 - lat) * K * 10) / 10];

// Coast: about thirty rough points (lon, lat), west coast north of Arrifana round to the Guadiana.
const COAST = [
  [-8.83, 37.35], [-8.86, 37.30], [-8.875, 37.25], [-8.905, 37.17], [-8.93, 37.10], [-8.965, 37.06], [-8.997, 37.023],
  [-8.96, 37.008], [-8.94, 37.0], [-8.90, 37.02], [-8.80, 37.06], [-8.73, 37.083], [-8.67, 37.10], [-8.60, 37.115],
  [-8.53, 37.113], [-8.40, 37.09], [-8.25, 37.083], [-8.15, 37.078], [-8.10, 37.065], [-8.00, 37.02], [-7.93, 36.99],
  [-7.87, 36.962], [-7.77, 37.025], [-7.65, 37.10], [-7.55, 37.15], [-7.42, 37.18], [-7.43, 37.25], [-7.44, 37.35]
];
const TOWNS = [['Aljezur', -8.80, 37.315], ['Sagres', -8.88, 36.985], ['Lagos', -8.67, 37.145], ['Portimão', -8.53, 37.15],
  ['Albufeira', -8.25, 37.10], ['Loulé', -8.02, 37.17], ['Faro', -7.93, 37.055], ['Tavira', -7.65, 37.16], ['Vila Real de S. António', -7.46, 37.215, 'end']];

function spread(points, r) {
  const p = points.map(([x, y]) => [x, y]);
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
      let dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1];
      let d = Math.hypot(dx, dy);
      const min = 2 * r + 3;
      if (d < min) {
        if (d < 0.01) { dx = 0; dy = 1; d = 1; }
        const push = (min - d) / 2;
        p[i][0] -= dx / d * push; p[i][1] -= dy / d * push;
        p[j][0] += dx / d * push; p[j][1] += dy / d * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return p;
}

function houseGlyph(x, y, label) {
  return `<g class="live-home" transform="translate(${x - 9} ${y - 18})" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>
<path d="M1 9 9 2l8 7v9H1z" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M0 9.5 9 1.5l9 8" fill="none" stroke="var(--roof)" stroke-width="2.4" stroke-linecap="round"/>
<rect x="12" y="0" width="3" height="5" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.2"/></g>`;
}

function mapSvg(rows, homeList) {
  const R = 13;
  const truePts = rows.map(r => px(r.c.lon, r.c.lat));
  const shown = spread(truePts, R);
  const coast = COAST.map(([lo, la]) => px(lo, la).join(',')).join(' ');
  const land = `${coast} ${px(-7.44, LAT1).join(',')} ${px(-8.83, LAT1).join(',')}`;
  let s = `<svg class="live-map" viewBox="0 0 ${W} ${H}" role="group" aria-label="Drawn map of the Algarve coast with ${rows.length} numbered cameras and the five made-up homes">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--water)" fill-opacity=".4"/>`;
  s += `<polygon points="${land}" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<text x="${W / 2}" y="${H - 18}" class="live-sea-label" text-anchor="middle">Atlantic Ocean</text>`;
  for (const [n, lo, la, anchor] of TOWNS) { const [x, y] = px(lo, la); s += `<text x="${x}" y="${y}" class="live-town" text-anchor="${anchor || 'middle'}">${esc(n)}</text>`; }
  for (const h of homeList) { const [x, y] = px(h.lon, h.lat); s += houseGlyph(x, y, `${h.name}, ${h.place} (made-up home)`); }
  rows.forEach((r, i) => {
    const [tx, ty] = truePts[i], [x, y] = shown[i];
    if (Math.hypot(x - tx, y - ty) > 1) s += `<line x1="${tx}" y1="${ty}" x2="${x}" y2="${y}" stroke="var(--sea)" stroke-width="1.5"/><circle cx="${tx}" cy="${ty}" r="3" fill="var(--sea)"/>`;
    s += `<a href="${esc(r.c.url)}" target="_blank" rel="noopener" class="live-marker" aria-label="${r.n}: ${esc(r.c.title)}, ${esc(shortOp(r.c.operator))} (opens the operator's page)">`
      + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R}" fill="var(--sea)" stroke="var(--surface)" stroke-width="2"/>`
      + `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" class="live-num">${r.n}</text></a>`;
  });
  return s + '</svg>';
}

function listHtml(groups, checkedAll) {
  let s = '';
  for (const g of groups) {
    s += `<h3>${esc(g.title)}</h3><table class="live-table"><caption class="visually-hidden">${esc(g.title)}: cameras, operators and links</caption>
<thead><tr><th scope="col">No.</th><th scope="col">Camera</th><th scope="col">Place</th><th scope="col">Operator</th><th scope="col">Link</th><th scope="col">Checked</th><th scope="col">Status</th><th scope="col">Embed</th></tr></thead><tbody>`;
    for (const r of g.rows) {
      const c = r.c;
      s += `<tr>
<td data-label="No."><span class="live-badge" aria-hidden="true">${r.n}</span><span class="visually-hidden">${r.n}</span></td>
<td data-label="Camera"><strong>${esc(c.title)}</strong></td>
<td data-label="Place">${esc(c.place)}</td>
<td data-label="Operator">${esc(c.operator)}</td>
<td data-label="Link"><a href="${esc(c.url)}" target="_blank" rel="noopener">Open on ${esc(shortOp(c.operator))}'s site<span class="visually-hidden"> (opens in a new tab)</span></a><br><span class="live-url">${esc(hostPath(c.url))}</span>${c.terms_url ? `<br><a class="live-terms" href="${esc(c.terms_url)}" target="_blank" rel="noopener">Operator's terms</a>` : ''}</td>
<td data-label="Checked">checked ${esc(dateWords(c.checked || checkedAll))}</td>
<td data-label="Status" class="live-status">${esc(c.status || 'not recorded')}</td>
<td data-label="Embed">${c.embed === true && c.embed_url ? 'Allowed by the operator; not shown here yet' : 'No: link only'}</td>
</tr>`;
    }
    s += '</tbody></table>';
  }
  return s;
}

async function main() {
  const mapEl = document.getElementById('live-map');
  const listEl = document.getElementById('live-list');
  if (!mapEl || !listEl) return;
  let data;
  try {
    const r = await fetch('/data/cameras.json');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    data = await r.json();
    if (!Array.isArray(data.cameras)) throw new Error('no camera list in the file');
  } catch (e) {
    const msg = `<p class="live-error" role="alert">The camera list could not load (${esc(e.message || e)}). The file is at <a href="/data/cameras.json">/data/cameras.json</a>.</p>`;
    mapEl.innerHTML = msg; listEl.innerHTML = '';
    return;
  }
  let homeList = [];
  try { homeList = (await loadHomes()) || []; } catch { homeList = []; }
  // Group by the nearest made-up home (within 35 km), in the homes' order; the rest go last.
  const groups = homeList.map(h => ({ title: `Near ${String(h.name).replace(/^The /, "the ")} (${h.place})`, home: h, rows: [] }));
  const further = { title: 'Further along the coast', rows: [] };
  for (const c of data.cameras) {
    let best = null;
    for (const g of groups) { const d = km(g.home, c); if (d <= 35 && (!best || d < best.d)) best = { g, d }; }
    (best ? best.g : further).rows.push({ c, d: best ? best.d : null });
  }
  for (const g of groups) g.rows.sort((a, b) => a.d - b.d);
  const used = [...groups, further].filter(g => g.rows.length);
  let n = 0;
  for (const g of used) for (const r of g.rows) r.n = ++n;
  const rows = used.flatMap(g => g.rows);
  mapEl.innerHTML = mapSvg(rows, homeList);
  listEl.innerHTML = `<p class="live-count">${rows.length} cameras from ${new Set(rows.map(r => shortOp(r.c.operator))).size} operators, checked ${esc(dateWords(data.checked))}. None is shown here: each link opens the operator's own page.</p>` + listHtml(used, data.checked);
}
main();
