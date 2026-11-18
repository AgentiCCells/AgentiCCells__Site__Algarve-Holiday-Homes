// /billboard/: "A London billboard, live from the Algarve" (a PROPOSAL). Draws the mock-ups as
// SVG at their real proportions (digital 6-sheet 1080 x 1920, landscape 1920 x 1080, D48
// 2880 x 2160) and fills their figures from the live IPMA files through data.js. A slot whose file
// is missing or stale stays empty: it never shows an old value as current. Camera panels are
// drawn placeholders, never a frame from a real camera.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18. Code Apache-2.0.

import * as D from './data.js';
import { houseSvg } from './houses.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EMPTY = '--';
const n1 = v => (v === null || v === undefined || !Number.isFinite(Number(v))) ? null : String(Math.round(Number(v) * 10) / 10);
const n0 = v => (v === null || v === undefined || !Number.isFinite(Number(v))) ? null : String(Math.round(Number(v)));
const londonTime = iso => {
  const d = new Date(iso); if (isNaN(d)) return null;
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
};

// Colours of the artwork itself (a picture of an advert, the same in light and dark page themes).
const C = { paper: '#FBF7F0', ink: '#1F2328', ink2: '#545A62', accent: '#A13D1A', sea: '#0E5A72', water: '#9FD3E3', band: '#FBE7A1', bandInk: '#3A2E00', grey: '#D9DDE1', warn: '#FFF0B3' };
const FONT = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif';

const t = (x, y, size, text, { w = 400, fill = C.ink, anchor = 'start', slot = '', cls = '' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}" font-family="${FONT}"${slot ? ` data-slot="${slot}"` : ''}${cls ? ` class="${cls}"` : ''}>${esc(text)}</text>`;

function proposalTag(W, H) {
  const h = Math.round(H * 0.04), pad = Math.round(h * 0.35);
  const w = Math.round(h * 4.6);
  return `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" fill="${C.band}" stroke="${C.bandInk}" stroke-width="${Math.max(2, h / 20)}"/>`
    + t(pad + w / 2, pad + h * 0.72, Math.round(h * 0.62), 'PROPOSAL', { w: 800, fill: C.bandInk, anchor: 'middle' });
}
function cameraPanel(x, y, w, h, id, label = 'live camera, with the operator\'s permission') {
  const hatch = `hatch-${id}`;
  // The label on one line if it fits, else two.
  const words = label.split(' ');
  let lines = [label];
  if (label.length * 0.55 * Math.min(w, h) * 0.075 > w * 0.8) {
    let best = 1, diff = Infinity;
    for (let i = 1; i < words.length; i++) { const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length); if (d < diff) { diff = d; best = i; } }
    lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }
  const longest = Math.max(...lines.map(l => l.length));
  const fs = Math.round(Math.min(Math.min(w, h) * 0.09, (w * 0.78) / (longest * 0.56)));
  const boxH = fs * (lines.length * 1.3 + 0.7);
  return `<defs><pattern id="${hatch}" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="40" stroke="${C.ink2}" stroke-width="3" stroke-opacity=".35"/></pattern></defs>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${hatch})" stroke="${C.ink}" stroke-width="${Math.max(4, w / 200)}" stroke-dasharray="${w / 30} ${w / 60}"/>`
    + `<rect x="${x + w * 0.06}" y="${y + h / 2 - boxH / 2}" width="${w * 0.88}" height="${boxH}" fill="${C.paper}"/>`
    + lines.map((l, i) => t(x + w / 2, y + h / 2 - boxH / 2 + fs * (0.35 + 1.3 * i + 1), fs, l, { w: 700, anchor: 'middle', fill: C.ink })).join('');
}
const svgOpen = (W, H, label) => `<svg class="bb-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><rect width="${W}" height="${H}" fill="${C.paper}"/>`;
const svgClose = (W, H) => `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${C.ink}" stroke-width="${Math.round(W / 270)}"/>${proposalTag(W, H)}</svg>`;

// A. "Right now in the Algarve": digital 6-sheet, portrait 1080 x 1920.
function mockA() {
  const W = 1080, H = 1920;
  let s = svgOpen(W, H, 'Mock-up A, portrait 1080 by 1920: a camera placeholder above, then Right now in the Algarve with Faro temperature, sea temperature and UV from IPMA. Marked PROPOSAL.');
  s += cameraPanel(60, 150, 960, 618, 'a');
  s += t(80, 900, 92, 'Right now', { w: 800 }) + t(80, 1000, 92, 'in the Algarve', { w: 800, fill: C.accent });
  s += t(80, 1210, 170, EMPTY, { w: 800, slot: 'a-temp' }) + t(80, 1270, 44, 'Faro, maximum today', { fill: C.ink2 });
  s += t(80, 1460, 120, EMPTY, { w: 800, fill: C.sea, slot: 'a-sea' }) + t(80, 1515, 44, 'sea, Faro coast', { fill: C.ink2 });
  s += t(620, 1460, 120, EMPTY, { w: 800, slot: 'a-uv' }) + t(620, 1515, 44, 'UV, Faro', { fill: C.ink2 });
  s += `<line x1="80" y1="1600" x2="1000" y2="1600" stroke="${C.ink}" stroke-width="3"/>`;
  s += t(80, 1680, 46, EMPTY, { w: 600, slot: 'a-time' });
  s += t(80, 1750, 40, 'Source: IPMA, via data.promptugal.news', { fill: C.ink2 });
  s += t(80, 1840, 28, 'A made-up example. A proposal by the AgentiCCells agents.', { fill: C.ink2 });
  return s + svgClose(W, H);
}

// B. "London ... Faro ...": D48, landscape 4:3, 2880 x 2160.
function mockB() {
  const W = 2880, H = 2160;
  let s = svgOpen(W, H, 'Mock-up D, roadside D48 2880 by 2160: London on the left with an empty slot that needs a source, Faro on the right with today\'s maximum from IPMA. Marked PROPOSAL.');
  s += `<rect x="0" y="0" width="1440" height="${H}" fill="${C.grey}"/>`;
  s += t(720, 640, 200, 'London', { w: 700, anchor: 'middle', fill: C.ink2 });
  s += `<rect x="220" y="760" width="1000" height="420" fill="none" stroke="${C.ink2}" stroke-width="10" stroke-dasharray="40 24"/>`;
  s += t(720, 1000, 90, 'needs a source', { w: 600, anchor: 'middle', fill: C.ink2 });
  s += t(720, 1100, 60, '(no London data in our files)', { anchor: 'middle', fill: C.ink2 });
  s += t(2160, 640, 200, 'Faro', { w: 700, anchor: 'middle', fill: C.accent });
  s += t(2160, 1080, 380, EMPTY, { w: 800, anchor: 'middle', slot: 'b-temp' });
  s += t(2160, 1220, 70, 'maximum today, IPMA', { anchor: 'middle', fill: C.ink2 });
  const house = houseSvg('lagoon', { cls: 'bb-house', decorative: true }).replace('<svg class=', '<svg x="1860" y="1300" width="600" height="400" class=');
  s += house;
  s += t(W / 2, 1880, 84, 'Five holiday homes in the Algarve (a made-up example)', { w: 700, anchor: 'middle' });
  s += t(W / 2, 2010, 60, EMPTY, { anchor: 'middle', fill: C.ink2, slot: 'b-src' });
  return s + svgClose(W, H);
}

// C. "Sagres, right now": digital 6-sheet, portrait 1080 x 1920.
function mockC() {
  const W = 1080, H = 1920;
  let s = svgOpen(W, H, 'Mock-up B, portrait 1080 by 1920: Sagres, right now, with temperature, rain, waves and sea temperature from IPMA over a drawn sea, and a camera placeholder. Marked PROPOSAL.');
  s += t(80, 230, 100, 'Sagres,', { w: 800 }) + t(80, 340, 100, 'right now', { w: 800, fill: C.accent });
  s += t(80, 540, 150, EMPTY, { w: 800, slot: 'c-temp' }) + t(80, 600, 42, 'maximum today', { fill: C.ink2 });
  s += t(600, 540, 120, EMPTY, { w: 800, fill: C.sea, slot: 'c-rain' }) + t(600, 600, 42, 'chance of rain', { fill: C.ink2 });
  s += cameraPanel(60, 680, 960, 560, 'c', 'live camera view here, with the operator\'s permission');
  s += `<rect x="0" y="1280" width="${W}" height="520" fill="${C.water}"/>`;
  s += `<path d="M0 1330 q90 -50 180 0 t180 0 t180 0 t180 0 t180 0 t180 0" fill="none" stroke="${C.sea}" stroke-width="8"/>`;
  s += t(80, 1500, 140, EMPTY, { w: 800, fill: C.ink, slot: 'c-waves' }) + t(80, 1560, 42, 'waves, Sagres coast', { fill: C.ink });
  s += t(600, 1500, 140, EMPTY, { w: 800, fill: C.ink, slot: 'c-sea' }) + t(600, 1560, 42, 'sea temperature', { fill: C.ink });
  s += t(80, 1720, 38, EMPTY, { fill: C.ink, slot: 'c-src' });
  s += t(80, 1860, 32, 'A proposal by the AgentiCCells agents (a made-up example).', { fill: C.ink2 });
  return s + svgClose(W, H);
}

// D. "Five chimneys": D48, landscape 4:3, 2880 x 2160.
const FIVE = [['salt', 'Tavira', 1080500, 'Faro forecast'], ['lagoon', 'Faro', 1080500, ''], ['hill', 'Loulé', 1080800, ''], ['harbour', 'Lagos', 1081100, 'Portimão forecast'], ['cape', 'Sagres', 1081505, '']];
function mockD() {
  const W = 2880, H = 2160;
  let s = svgOpen(W, H, 'Mock-up E, roadside D48 2880 by 2160: Five chimneys, the five made-up houses in a row with each town\'s maximum temperature today from IPMA. Marked PROPOSAL.');
  s += t(W / 2, 420, 220, 'Five chimneys', { w: 800, anchor: 'middle' });
  s += t(W / 2, 560, 90, 'Today\'s maximum in the Algarve', { anchor: 'middle', fill: C.ink2 });
  FIVE.forEach(([id, town, , note], i) => {
    const x = 90 + i * 545;
    s += houseSvg(id, { cls: 'bb-house', decorative: true }).replace('<svg class=', `<svg x="${x}" y="760" width="510" height="340" class=`);
    s += t(x + 255, 1290, 100, town, { w: 700, anchor: 'middle' });
    s += t(x + 255, 1520, 150, EMPTY, { w: 800, anchor: 'middle', fill: C.accent, slot: `d-${i}` });
    if (note) s += t(x + 255, 1610, 54, `(${note})`, { anchor: 'middle', fill: C.ink2 });
  });
  s += t(W / 2, 1880, 76, 'Cinco Chaminés: five holiday homes in the Algarve (a made-up example)', { w: 700, anchor: 'middle' });
  s += t(W / 2, 2010, 60, EMPTY, { anchor: 'middle', fill: C.ink2, slot: 'd-src' });
  return s + svgClose(W, H);
}

// E. "Meanwhile, in the Algarve": landscape 1920 x 1080 (the writer's second mock-up).
const STRIP = [['Faro', 1080500], ['Loulé', 1080800], ['Portimão', 1081100], ['Sagres', 1081505]];
function mockE() {
  const W = 1920, H = 1080;
  let s = svgOpen(W, H, 'Mock-up C, landscape 1920 by 1080: Meanwhile, in the Algarve, four places with today\'s minimum and maximum and weather from IPMA, UV for Faro, a warning line and a camera placeholder. Marked PROPOSAL.');
  s += t(80, 190, 96, 'Meanwhile, in the Algarve', { w: 800 });
  s += cameraPanel(1240, 250, 600, 420, 'e');
  STRIP.forEach(([name], i) => {
    const y = 300 + i * 105;
    s += t(80, y, 52, name, { w: 700 });
    s += t(420, y, 52, EMPTY, { w: 700, fill: C.accent, slot: `e-t${i}` });
    s += t(720, y, 40, EMPTY, { fill: C.ink2, slot: `e-w${i}` });
  });
  s += t(80, 760, 52, 'UV, Faro', { w: 700 }) + t(420, 760, 52, EMPTY, { w: 700, slot: 'e-uv' });
  s += `<rect x="60" y="820" width="1800" height="90" fill="${C.warn}" stroke="${C.ink}" stroke-width="3" data-slot-box="e-warn"/>`;
  s += t(90, 880, 44, EMPTY, { w: 600, slot: 'e-warn' });
  s += t(80, 1010, 34, EMPTY, { fill: C.ink2, slot: 'e-src' });
  return s + svgClose(W, H);
}

// ---------- filling ----------
function setSlot(root, id, text) {
  const el = root.querySelector(`[data-slot="${id}"]`);
  if (el) el.textContent = text ?? EMPTY;
}
const usable = res => res && !res.error && !res.stale;
const previewRow = (label, value, res, note = '') => `<li><span class="bb-pv-label">${esc(label)}</span> <strong>${value === null || value === undefined ? '<span class="bb-empty">value unavailable</span>' : esc(value)}</strong>${note ? ` <span class="bb-pv-note">${esc(note)}</span>` : ''}</li>`;
function preview(el, rows, resList) {
  if (!el) return;
  const bad = resList.filter(r => r && (r.error || r.stale));
  let html = `<ul class="bb-pv-list">${rows.join('')}</ul>`;
  if (bad.length) html += `<p class="bb-pv-fail">Value unavailable: the slot stays empty, it never shows an old value as current.</p>`;
  const seen = new Set();
  for (const r of resList) if (r && !seen.has(r.id)) { seen.add(r.id); html += D.sourceLine(r); }
  el.innerHTML = html;
}

async function fill() {
  const today = D.today();
  const safe = p => p.catch(e => ({ res: { id: 'unknown', error: String(e) }, days: [], items: [] }));
  const [fFaro, fLoule, fPort, fSagres, seaFaro, seaSagres, uvFaro, warn] = await Promise.all([
    safe(D.forecastFor(1080500, today, today)), safe(D.forecastFor(1080800, today, today)), safe(D.forecastFor(1081100, today, today)), safe(D.forecastFor(1081505, today, today)),
    safe(D.seaFor(1080526)), safe(D.seaFor(1081526)), safe(D.uvFor(1080500)), safe(D.warningsFor('FAR', today, today))
  ]);
  const fc = { 1080500: fFaro, 1080800: fLoule, 1081100: fPort, 1081505: fSagres };
  const day0 = r => usable(r.res) ? (r.days || []).find(d => d.date === today) || null : null;
  const deg = v => v === null ? null : `${v} °C`;
  const tmax = r => { const d = day0(r); return d ? n0(d.tmax) : null; };
  const seaDay = r => usable(r.res) ? (r.days || []).find(d => d.date === today) || null : null;
  const uvDay = r => usable(r.res) ? (r.days || []).find(d => d.date === today) || null : null;
  const fRead = fFaro.res && fFaro.res.read_at ? londonTime(fFaro.res.read_at) : null;
  const srcLine = res => usable(res) ? `Source: IPMA, read ${londonTime(res.read_at)} London time` : 'Source: IPMA. Figures unavailable just now: slots left empty';

  // A
  const a = document.getElementById('bb-a');
  if (a) {
    const sea = seaDay(seaFaro), uv = uvDay(uvFaro);
    const vT = deg(tmax(fFaro)), vS = sea ? deg(n1(sea.temp_max)) : null, vU = uv ? n1(uv.index) : null;
    setSlot(a, 'a-temp', vT); setSlot(a, 'a-sea', vS); setSlot(a, 'a-uv', vU);
    setSlot(a, 'a-time', usable(fFaro.res) ? `Faro, ${fRead} London time` : 'Faro, time unavailable');
    preview(document.getElementById('bb-a-pv'), [
      previewRow('Faro, maximum today', vT, fFaro.res), previewRow('Sea temperature, Faro coast', vS, seaFaro.res), previewRow('UV index, Faro', vU === null ? null : `${vU} (${D.uvBand(Number(vU))})`, uvFaro.res)
    ], [fFaro.res, seaFaro.res, uvFaro.res]);
  }
  // B
  const b = document.getElementById('bb-b');
  if (b) {
    const vT = deg(tmax(fFaro));
    setSlot(b, 'b-temp', vT); setSlot(b, 'b-src', srcLine(fFaro.res));
    preview(document.getElementById('bb-b-pv'), [previewRow('Faro, maximum today', vT, fFaro.res), previewRow('London', null, null, 'needs a source: there is no London data in our files')], [fFaro.res]);
  }
  // C
  const c = document.getElementById('bb-c');
  if (c) {
    const d = day0(fSagres), sea = seaDay(seaSagres);
    const vT = d ? deg(n0(d.tmax)) : null, vR = d && n0(d.rain_pct) !== null ? `${n0(d.rain_pct)} %` : null;
    const vW = sea && n1(sea.waves_max) !== null ? `${n1(sea.waves_max)} m` : null, vS = sea ? deg(n1(sea.temp_max)) : null;
    setSlot(c, 'c-temp', vT); setSlot(c, 'c-rain', vR); setSlot(c, 'c-waves', vW); setSlot(c, 'c-sea', vS);
    setSlot(c, 'c-src', srcLine(fSagres.res));
    preview(document.getElementById('bb-c-pv'), [
      previewRow('Sagres, maximum today', vT, fSagres.res), previewRow('Sagres, chance of rain', vR, fSagres.res),
      previewRow('Waves, Sagres coast (highest)', vW, seaSagres.res), previewRow('Sea temperature, Sagres coast', vS, seaSagres.res)
    ], [fSagres.res, seaSagres.res]);
  }
  // D
  const dEl = document.getElementById('bb-d');
  if (dEl) {
    const rows = [];
    FIVE.forEach(([, town, id, note], i) => { const v = deg(tmax(fc[id])); setSlot(dEl, `d-${i}`, v); rows.push(previewRow(`${town}${note ? ' (' + note + ')' : ''}`, v, fc[id].res)); });
    setSlot(dEl, 'd-src', srcLine(fFaro.res));
    preview(document.getElementById('bb-d-pv'), rows, [fFaro.res]);
  }
  // E
  const e = document.getElementById('bb-e');
  if (e) {
    const rows = [];
    STRIP.forEach(([name, id], i) => {
      const d = day0(fc[id]);
      const v = d && n0(d.tmin) !== null && n0(d.tmax) !== null ? `${n0(d.tmin)} to ${n0(d.tmax)} °C` : null;
      setSlot(e, `e-t${i}`, v); setSlot(e, `e-w${i}`, d ? d.weather : null);
      rows.push(previewRow(`${name}, today`, v === null ? null : `${v}, ${d.weather}`, fc[id].res));
    });
    const uv = uvDay(uvFaro), vU = uv ? `${n1(uv.index)} (${D.uvBand(uv.index)})` : null;
    setSlot(e, 'e-uv', vU); rows.push(previewRow('UV index, Faro', vU, uvFaro.res));
    let wText;
    if (!usable(warn.res)) wText = 'Warnings unavailable just now: the advert would not run without them';
    else if (warn.items.length) { const w = warn.items[0]; wText = `IPMA ${w.level} warning, ${w.type}: the advert would pause`; }
    else wText = 'No IPMA warning for the Faro district today';
    setSlot(e, 'e-warn', wText); rows.push(previewRow('Warnings, Faro district', wText, warn.res));
    setSlot(e, 'e-src', `${srcLine(fFaro.res)}. PROPOSAL, a made-up example.`);
    preview(document.getElementById('bb-e-pv'), rows, [fFaro.res, uvFaro.res, warn.res]);
  }
}

function draw() {
  const put = (id, svg) => { const el = document.getElementById(id); if (el) el.innerHTML = svg; };
  put('bb-a', mockA()); put('bb-b', mockB()); put('bb-c', mockC()); put('bb-d', mockD()); put('bb-e', mockE());
}
draw();
fill().catch(() => {
  for (const id of ['a', 'b', 'c', 'd', 'e']) { const el = document.getElementById(`bb-${id}-pv`); if (el) el.innerHTML = '<p class="bb-pv-fail">Could not read the live files just now. Value unavailable: the slots stay empty, they never show an old value as current.</p>'; }
});
