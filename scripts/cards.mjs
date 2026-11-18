// cards.mjs: render the 1200x630 PNG share cards (link previews) into src/assets/share/:
// the home page, the homes list, each of the five homes, the agent, the live cameras, Use the
// data, Use with AI, behind the scenes, the designs chooser /d/ and the five designs. A card holds
// no live figure (it would go stale): a title, one line, a picture or drawing, and the words
// "made-up example". System fonts only; nothing is loaded from another host.
// Round 2: the home page, the homes list and each home use the AI-generated pictures (a photo crop
// labelled as AI-generated), the billboard card is gone (team/rounds/2.md, decision 1), and the
// /d/ and five design cards are new, each in its design's palette (team/rounds/2/design/PROPOSAL.md 3).
// A card with a photo is a large PNG, so a card over 280 KB is reduced to 256 colours with
// Pillow (python3), which keeps it under 300 KB.
// Run: node scripts/cards.mjs [name ...] (needs Playwright's Chromium, and python3 with Pillow for
// the photo cards). Each card must stay under 300 KB.
// Adapted from scripts/cards.mjs in AgentiCCells/AgentiCCells__Site__IPMA-Data (written by
// developer.ipma-data@AgentiCCells.dinis, 2026-11-18, Apache-2.0, same organisation): the card
// frame and the render loop come from there. Changed for this cell by
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.
// Code Apache-2.0; the cards' text and drawings CC BY 4.0.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { BRAND, BRAND_LINE } from './lib.mjs';
import { houseSvg, chimney, HOUSE_IDS } from '../src/assets/js/houses.js';
const require = createRequire(import.meta.url);
const OUT = 'src/assets/share';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let homes = [];
try { homes = JSON.parse(readFileSync('src/data/homes.json', 'utf8')).homes || []; } catch { /* names below */ }
const NAMES = { salt: ['The Salt House', 'Tavira'], lagoon: ['The Lagoon House', 'Faro'], hill: ['The Hill House', 'near Loulé'], harbour: ['The Harbour House', 'Lagos'], cape: ['The Cape House', 'Sagres'] };
for (const h of homes) NAMES[h.id] = [h.name, h.place];

const TOKENS = '--bg:#FBF7F0;--surface:#FFFFFF;--ink:#1F2328;--ink-2:#545A62;--line:#D9D2C5;--accent:#A13D1A;--sea:#0E5A72;--band-bg:#FBE7A1;--band-ink:#3A2E00;--wall:#FFFFFF;--roof:#C2643D;--water:#9FD3E3;--green:#5E7D4A';
const row = ids => `<div class="row">${ids.map(i => houseSvg(i, { decorative: true })).join('')}</div>`;
const one = id => `<div class="one">${houseSvg(id, { decorative: true })}</div>`;
// Simple drawings for the pages without a house of their own (boxes and lines, no figures).
const bubble = `<svg viewBox="0 0 420 300" aria-hidden="true"><rect x="20" y="30" width="250" height="90" rx="18" fill="var(--surface)" stroke="var(--ink)" stroke-width="3"/><rect x="150" y="150" width="250" height="90" rx="18" fill="var(--sea)" opacity=".18" stroke="var(--sea)" stroke-width="3"/><path d="M50 65h180M50 92h120M180 185h190M180 212h130" stroke="var(--ink-2)" stroke-width="8" stroke-linecap="round"/><svg x="40" y="170" width="54" height="90" viewBox="0 0 24 40">${chimney({ width: 24, height: 40 }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></svg>`;
const camera = `<svg viewBox="0 0 420 300" aria-hidden="true"><path d="M20 230 Q120 190 200 215 T400 200 V290 H20Z" fill="var(--water)"/><rect x="120" y="60" width="180" height="110" rx="14" fill="var(--surface)" stroke="var(--ink)" stroke-width="4"/><circle cx="210" cy="115" r="34" fill="none" stroke="var(--sea)" stroke-width="8"/><circle cx="210" cy="115" r="12" fill="var(--sea)"/><path d="M300 95l60-25v90l-60-25z" fill="var(--surface)" stroke="var(--ink)" stroke-width="4"/><path d="M210 170v40" stroke="var(--ink)" stroke-width="6"/></svg>`;
const files = `<svg viewBox="0 0 420 300" aria-hidden="true"><rect x="40" y="40" width="150" height="190" rx="10" fill="var(--surface)" stroke="var(--ink)" stroke-width="4"/><path d="M65 85h100M65 115h80M65 145h100M65 175h60" stroke="var(--sea)" stroke-width="8" stroke-linecap="round"/><path d="M200 135h50" stroke="var(--ink)" stroke-width="5"/><path d="M240 120l18 15-18 15" fill="none" stroke="var(--ink)" stroke-width="5"/><rect x="270" y="70" width="120" height="130" rx="10" fill="var(--band-bg)" stroke="var(--ink)" stroke-width="4"/><text x="292" y="150" font-size="44" font-weight="700" fill="var(--band-ink)" font-family="ui-monospace,monospace">{ }</text></svg>`;
const flow = `<svg viewBox="0 0 420 300" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${30 + (i % 3) * 130}" y="${50 + Math.floor(i / 3) * 120}" width="110" height="70" rx="10" fill="var(--surface)" stroke="var(--accent)" stroke-width="4"/>`).join('')}<path d="M140 85h20M270 85h20M140 205h20M270 205h20M345 120v30" stroke="var(--ink-2)" stroke-width="5"/></svg>`;

// Round 3: the stay's timeline of day cards and the two frames with a slider (drawn, no figures).
const stayArt = `<svg viewBox="0 0 420 300" aria-hidden="true">${[0, 1, 2, 3].map(i => `<rect x="${12 + i * 102}" y="${i === 2 ? 34 : 40}" width="92" height="120" rx="10" fill="${i < 2 ? '#F1ECE3' : 'var(--surface)'}" stroke="var(--ink)" stroke-width="${i === 2 ? 5 : 2}"/><path d="M${30 + i * 102} 70h40" stroke="var(--ink-2)" stroke-width="7" stroke-linecap="round"/>${i < 3 ? `<circle cx="${50 + i * 102}" cy="108" r="14" fill="none" stroke="var(--sea)" stroke-width="5"/>` : `<rect x="${24 + i * 102}" y="92" width="68" height="40" rx="5" fill="none" stroke="var(--ink-2)" stroke-width="3" stroke-dasharray="7 5"/>`}`).join('')}<rect x="208" y="12" width="112" height="22" rx="5" fill="#1E3A8A"/><text x="264" y="28" font-size="12" font-weight="700" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">Simulated today</text><rect x="12" y="185" width="396" height="100" rx="10" fill="var(--surface)" stroke="var(--line)" stroke-width="3"/>${[0, 1, 2].map(i => `<circle cx="38" cy="${212 + i * 26}" r="7" fill="none" stroke="var(--accent)" stroke-width="4"/><path d="M58 ${212 + i * 26}h${220 - i * 50}" stroke="var(--ink-2)" stroke-width="7" stroke-linecap="round"/>`).join('')}</svg>`;
const playArt = `<svg viewBox="0 0 420 300" aria-hidden="true"><rect x="10" y="20" width="400" height="44" rx="10" fill="var(--surface)" stroke="var(--line)" stroke-width="3"/><path d="M36 42h348" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/><rect x="36" y="34" width="60" height="16" rx="3" fill="#DCF2E3" stroke="#14532D" stroke-width="2"/><path d="M60 52h324" stroke="var(--sea)" stroke-width="3"/><circle cx="84" cy="42" r="13" fill="var(--ink)" stroke="#fff" stroke-width="3"/><rect x="10" y="80" width="165" height="205" rx="10" fill="var(--surface)" stroke="var(--ink)" stroke-width="3"/><rect x="245" y="80" width="165" height="205" rx="10" fill="var(--surface)" stroke="var(--ink)" stroke-width="3"/><rect x="185" y="80" width="50" height="205" rx="8" fill="#FFF0C7" stroke="var(--line)" stroke-width="2"/>${[0, 1, 2, 3].map(i => `<path d="M193 ${102 + i * 44}h34" stroke="var(--ink-2)" stroke-width="5" stroke-linecap="round"/>`).join('')}<path d="M28 112h120M28 136h90" stroke="var(--ink-2)" stroke-width="7" stroke-linecap="round"/><rect x="28" y="160" width="128" height="70" rx="6" fill="var(--water)"/><rect x="262" y="104" width="38" height="30" rx="4" fill="#E0E8FB"/><rect x="308" y="104" width="38" height="30" rx="4" fill="#E0E8FB"/><rect x="354" y="104" width="38" height="30" rx="4" fill="#FBE1DE"/>${[0, 1, 2, 3].map(i => `<path d="M262 ${160 + i * 26}h${120 - i * 18}" stroke="var(--ink-2)" stroke-width="6" stroke-linecap="round"/>`).join('')}</svg>`;

// Pictures as data: URIs (the card is rendered from a string, so it cannot read files by path).
const img = name => `data:image/jpeg;base64,${readFileSync(`src/assets/img/${name}-800.jpg`).toString('base64')}`;
const heroOf = id => (homes.find(h => h.id === id)?.images?.hero?.src) || `${id}-hero`;
const photo = (name, chip) => `<div class="photo"><img src="${img(name)}" alt=""><span class="chip">${esc(chip)}</span></div>`;
const strip = ids => `<div class="strip">${ids.map(i => `<img src="${img(heroOf(i))}" alt="">`).join('')}<span class="chip">AI-generated pictures of invented houses, not photographs</span></div>`;

const PAGES = [
  ['home', 'Five homes, five chimneys, one coast', 'An invented company with five holiday homes in the Algarve, and the real weather, sea and events for your dates.', photo('algarve-cliffs', 'AI-generated picture of the Algarve, not a photograph')],
  ['homes', 'The five homes', 'From Tavira to Sagres: invented homes, invented prices and simulated availability.', strip(HOUSE_IDS)],
  ...HOUSE_IDS.map(id => [`home-${id}`, NAMES[id][0], `${NAMES[id][1][0].toUpperCase()}${NAMES[id][1].slice(1)}. An invented home with a simulated calendar, a demonstration booking and the real IPMA forecast for your dates.`, photo(heroOf(id), 'AI-generated picture of an invented house, not a photograph')]),
  ['agent', 'Ask the agent', 'A scripted agent: pre-written answers matched in your browser, no live model. A simulation.', `<div class="art">${bubble}</div>`],
  ['live', 'Live from the Algarve', 'Public live cameras along the coast, with their operators named. Link out only.', `<div class="art">${camera}</div>`],
  ['use-the-data', 'Use the data', 'How this site reads IPMA and events data from data.promptugal.news, and how you can.', `<div class="art">${files}</div>`],
  ['use-with-ai', 'Use with AI', 'Markdown twins, llms.txt and the data addresses, with each source\'s terms.', `<div class="art">${files}</div>`],
  ['behind-the-scenes', 'Behind the scenes', 'The agent team that makes this site: roles, policies, rounds and every commit.', `<div class="art">${flow}</div>`],
  // Round 3 (instance E): the guest's stay and side by side; simple drawings, no live figure.
  ['stay', 'Your stay, day by day', 'After a pretend booking: the days of your stay with the real IPMA forecast as issued, real local events, and a plan you build.', `<div class="art">${stayArt}</div>`],
  ['play', 'Side by side', 'The visitor and the admin of an invented business, one simulation in your browser, and a time slider bounded by the days with real data.', `<div class="art">${playArt}</div>`],
];

function card(title, line, art) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>
:root{${TOKENS}}*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;display:grid;grid-template-rows:auto 1fr auto}
.band{background:var(--band-bg);color:var(--band-ink);padding:16px 56px;font-size:24px;line-height:1.3}
.band strong{font-weight:800}
.top{display:grid;grid-template-columns:1fr 1fr;gap:36px;padding:30px 56px 10px;align-items:center;min-height:0}
.top.wide{grid-template-columns:1fr}
.brand{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:700;margin:0 0 18px}
.brand small{display:block;font-weight:400;font-size:18px;color:var(--ink-2)}
h1{font-size:${title.length > 26 ? 52 : 64}px;line-height:1.05;margin:0 0 18px}
.line{font-size:27px;line-height:1.3;color:var(--ink-2);margin:0}
.row{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:0 56px 18px}
.row svg{width:100%;height:auto;background:var(--surface);border:2px solid var(--line);border-radius:8px}
.one svg{width:100%;height:auto;background:var(--surface);border:2px solid var(--line);border-radius:10px}
.art svg{width:100%;height:auto;max-height:330px}
.photo{position:relative;height:380px;border-radius:10px;overflow:hidden;background:var(--sea)}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.chip{position:absolute;left:12px;bottom:12px;background:rgba(20,16,12,.72);color:#fff;font-size:17px;padding:4px 10px;border-radius:5px}
.strip{position:relative;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:0 56px 18px}
.strip img{width:100%;height:170px;object-fit:cover;border-radius:8px;display:block}
.strip .chip{left:68px;bottom:30px}
.foot{padding:10px 56px 18px;font-size:19px;color:var(--ink-2);border-top:2px solid var(--line)}
</style></head><body>
<div class="band"><strong>Made-up example.</strong> An invented company: homes, prices, availability and bookings are simulated${/<img /.test(art) ? '; the pictures are AI-generated' : ''}.</div>
${/^<div class="(row|strip)">/.test(art) ? `<div class="top wide"><div><p class="brand">${chimney({ width: 26, height: 44 })}<span>${esc(BRAND)}<small>${esc(BRAND_LINE)}</small></span></p><h1>${esc(title)}</h1><p class="line">${esc(line)}</p></div></div>${art}`
    : `<div class="top"><div><p class="brand">${chimney({ width: 26, height: 44 })}<span>${esc(BRAND)}<small>${esc(BRAND_LINE)}</small></span></p><h1>${esc(title)}</h1><p class="line">${esc(line)}</p></div>${art}</div>`}
<div class="foot">algarve-holiday-homes.agenticcells.site · Weather: IPMA, read live via data.promptugal.news · A made-up example by the AgentiCCells agents</div>
</body></html>`;
}

// ---------- the designs chooser and the five designs (round 2, PROPOSAL.md 3 and 4) ----------
// Each card in its design's own palette and type stack (system fonts), with the made-up line.
const DESIGNS = [
  { slug: 'revista', name: 'Revista', line: 'A calm travel-magazine issue: masthead, dateline, a cover story and one feature per home.', pic: 'algarve-street',
    c: { bg: '#FAF8F3', ink: '#1C1B19', ink2: '#5C5850', accent: '#8E3A1E', band: '#EFE3C2' }, font: '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua","URW Palladio L",Georgia,serif' },
  { slug: 'azulejo', name: 'Azulejo', line: 'Blue and white tiles: tile-framed pictures, the live figures in square tiles.', pic: 'harbour-hero',
    c: { bg: '#F6F8FC', ink: '#14306E', ink2: '#3D4F75', accent: '#1F4FA3', band: '#DCE6F7' }, font: 'Optima,Candara,"Gill Sans","Gill Sans MT","Noto Sans","Segoe UI",sans-serif' },
  { slug: 'linho', name: 'Linho', line: 'A quiet boutique-hotel page: one large picture per screen, linen and black, few words.', pic: 'cape-hero',
    c: { bg: '#F4F1EB', ink: '#141414', ink2: '#5E5A53', accent: '#7B5B34', band: '#E7E0D3' }, font: 'Didot,"Bodoni 72","Bodoni MT","Noto Serif Display","DejaVu Serif",Georgia,serif' },
  { slug: 'costa', name: 'Costa', line: 'The coast first: a drawn map from Sagres to Tavira, each home pinned with its own forecast.', pic: null,
    c: { bg: '#F5EBD6', ink: '#10252D', ink2: '#3F5961', accent: '#A63D17', band: '#FBE7A1', sea: '#CFE8EE' }, font: 'ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Segoe UI",system-ui,sans-serif' },
  { slug: 'postal', name: 'Postal', line: 'Warm postcards: each home a card with a stamp, and a postmark that carries the forecast.', pic: 'algarve-dawn',
    c: { bg: '#F3E9D8', ink: '#2A1F17', ink2: '#5E4B3C', accent: '#A3361F', band: '#F2D27A' }, font: 'Rockwell,"Roboto Slab","Zilla Slab","DejaVu Serif",Georgia,serif' },
];
// Costa has no hero picture (the map is its hero): a plain drawn coast (land above, sea below) with five pins, not a real map.
const coast = c => `<svg viewBox="0 0 520 380" aria-hidden="true" style="width:100%;height:100%;display:block;background:${c.sea}"><path d="M40 0 C32 45 24 90 12 122 C60 112 75 150 120 165 C190 185 230 175 300 190 C370 205 430 200 520 215 V0 Z" fill="${c.bg}" stroke="${c.ink}" stroke-width="3"/>${[[60, 150], [175, 182], [275, 200], [360, 214], [450, 220]].map(([x, y], i) => `<circle cx="${x}" cy="${y - 22}" r="16" fill="${c.accent}" stroke="#fff" stroke-width="3"/><text x="${x}" y="${y - 16}" font-size="17" font-weight="700" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">${i + 1}</text>`).join('')}</svg>`;
function designCard(d) {
  const c = d.c;
  const art = d.pic ? `<img src="${img(d.pic)}" alt=""><span class="chip">AI-generated picture, not a photograph</span>` : coast(c);
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:${c.bg};color:${c.ink};font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;display:grid;grid-template-rows:auto 1fr auto}
.band{background:${c.band};color:${c.ink};padding:14px 56px;font-size:23px;line-height:1.3}
.top{display:grid;grid-template-columns:1fr 520px;gap:40px;padding:28px 56px 18px;align-items:center}
.kick{font-size:19px;letter-spacing:.14em;text-transform:uppercase;color:${c.ink2};margin:0 0 10px}
h1{font-family:${d.font};font-size:88px;line-height:1;margin:0 0 18px;color:${c.ink};font-weight:${d.slug === 'linho' ? 400 : 700}}
.line{font-size:27px;line-height:1.3;color:${c.ink2};margin:0}
.pic{position:relative;height:380px;border-radius:${d.slug === 'linho' ? 0 : 10}px;overflow:hidden;${d.slug === 'azulejo' ? `outline:10px solid ${c.accent};outline-offset:-10px;` : ''}${d.slug === 'postal' ? 'border:12px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.2);transform:rotate(1.5deg);' : ''}}
.pic img{width:100%;height:100%;object-fit:cover;display:block}
.chip{position:absolute;left:12px;bottom:12px;background:rgba(20,16,12,.72);color:#fff;font-size:16px;padding:4px 10px;border-radius:5px}
.foot{padding:10px 56px 18px;font-size:19px;color:${c.ink2};border-top:2px solid ${c.ink}22}
</style></head><body>
<div class="band"><strong>Made-up example.</strong> One of five designs of an invented company's site: homes and prices are invented${d.pic ? ', pictures AI-generated' : ''}.</div>
<div class="top"><div><p class="kick">${esc(BRAND)} · design ${DESIGNS.indexOf(d) + 1} of 5</p><h1>${esc(d.name)}</h1><p class="line">${esc(d.line)}</p></div><div class="pic">${art}</div></div>
<div class="foot">algarve-holiday-homes.agenticcells.site/d/${d.slug}/ · Weather: IPMA, read live via data.promptugal.news · A made-up example</div>
</body></html>`;
}
// The chooser: six tiles, the main design first, each in its palette with its name.
const MAIN = { name: 'The main site', c: { bg: '#FBF7F0', ink: '#1F2328', accent: '#A13D1A' }, font: 'system-ui,sans-serif' };
const chooserArt = `<div class="tiles">${[MAIN, ...DESIGNS].map(d => `<div class="tile" style="background:${d.c.bg};color:${d.c.ink};border-top:10px solid ${d.c.accent}"><b style="font-family:${d.font.replace(/"/g, "'")}">${esc(d.name)}</b></div>`).join('')}</div>`;

const ALL = [
  ...PAGES.map(([name, title, line, art]) => [name, card(title, line, art)]),
  ['d', card('Five designs, one made-up example', 'The same invented homes and the same live data, laid out five ways.', `<div class="row">${''}</div>`).replace('<div class="row"></div>', chooserArt).replace('</style>', '.tiles{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;padding:0 56px 22px}.tile{height:150px;border-radius:8px;border:2px solid #D9D2C5;display:flex;align-items:flex-end;padding:12px}.tile b{font-size:24px;line-height:1.1}</style>')],
  ...DESIGNS.map(d => [`d-${d.slug}`, designCard(d)]),
];

const { chromium } = require('playwright');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let bad = 0;
const only = process.argv.slice(2);
const todo = ALL.filter(([name]) => !only.length || only.includes(name));
for (const [name, html] of todo) {
  if (!/made-up example/i.test(html)) { console.error(`${name}: no "made-up example"`); bad++; }
  await page.setContent(html, { waitUntil: 'load' });
  const f = `${OUT}/${name}.png`;
  writeFileSync(f, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
  let note = '';
  if (statSync(f).size > 280 * 1024) {
    // A photo card: reduce to 256 colours (dithered), the usual way to keep a photo PNG small.
    execFileSync('python3', ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");im.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).save(sys.argv[1],optimize=True)', f]);
    note = ' (256 colours)';
  }
  const kb = Math.round(statSync(f).size / 1024);
  if (kb >= 300) bad++;
  console.log(`${f} ${kb} KB${note}${kb >= 300 ? ' (too big: over 300 KB)' : ''}`);
}
await browser.close();
if (bad) { console.error(`FAILED: ${bad} card(s) over 300 KB or without "made-up example"`); process.exit(1); }
console.log(`OK: ${todo.length} cards`);
