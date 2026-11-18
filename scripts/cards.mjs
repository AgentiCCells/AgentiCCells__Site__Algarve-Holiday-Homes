// cards.mjs: render the 1200x630 PNG share cards (link previews) into src/assets/share/:
// the home page, the homes list, each of the five homes, the agent, the live cameras, the
// billboard proposal, Use the data, Use with AI and behind the scenes. A card holds no live
// figure (it would go stale): a title, one line, the house drawings, and the words "made-up
// example" in the band. System fonts only; nothing is loaded from another host.
// Run: node scripts/cards.mjs (needs Playwright's Chromium). Each card must stay under 300 KB.
// Adapted from scripts/cards.mjs in AgentiCCells/AgentiCCells__Site__IPMA-Data (written by
// developer.ipma-data@AgentiCCells.dinis, 2026-11-18, Apache-2.0, same organisation): the card
// frame and the render loop come from there. Changed for this cell by
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.
// Code Apache-2.0; the cards' text and drawings CC BY 4.0.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
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
const billboard = `<svg viewBox="0 0 420 300" aria-hidden="true"><rect x="40" y="30" width="340" height="190" fill="var(--surface)" stroke="var(--ink)" stroke-width="5"/><rect x="40" y="30" width="120" height="30" fill="var(--band-bg)"/><text x="52" y="52" font-size="18" font-weight="700" fill="var(--band-ink)" font-family="system-ui,sans-serif">PROPOSAL</text><path d="M70 110h200M70 150h140" stroke="var(--ink-2)" stroke-width="14" stroke-linecap="round"/><path d="M120 220v60M300 220v60" stroke="var(--ink)" stroke-width="8"/><svg x="300" y="90" width="48" height="80" viewBox="0 0 24 40">${chimney({ width: 24, height: 40 }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></svg>`;
const files = `<svg viewBox="0 0 420 300" aria-hidden="true"><rect x="40" y="40" width="150" height="190" rx="10" fill="var(--surface)" stroke="var(--ink)" stroke-width="4"/><path d="M65 85h100M65 115h80M65 145h100M65 175h60" stroke="var(--sea)" stroke-width="8" stroke-linecap="round"/><path d="M200 135h50" stroke="var(--ink)" stroke-width="5"/><path d="M240 120l18 15-18 15" fill="none" stroke="var(--ink)" stroke-width="5"/><rect x="270" y="70" width="120" height="130" rx="10" fill="var(--band-bg)" stroke="var(--ink)" stroke-width="4"/><text x="292" y="150" font-size="44" font-weight="700" fill="var(--band-ink)" font-family="ui-monospace,monospace">{ }</text></svg>`;
const flow = `<svg viewBox="0 0 420 300" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${30 + (i % 3) * 130}" y="${50 + Math.floor(i / 3) * 120}" width="110" height="70" rx="10" fill="var(--surface)" stroke="var(--accent)" stroke-width="4"/>`).join('')}<path d="M140 85h20M270 85h20M140 205h20M270 205h20M345 120v30" stroke="var(--ink-2)" stroke-width="5"/></svg>`;

const PAGES = [
  ['home', 'Five homes, five chimneys, one coast', 'An invented company with five holiday homes in the Algarve, and the real weather, sea and events for your dates.', row(HOUSE_IDS)],
  ['homes', 'The five homes', 'From Tavira to Sagres: drawings, invented prices and simulated availability.', row(HOUSE_IDS)],
  ...HOUSE_IDS.map(id => [`home-${id}`, NAMES[id][0], `${NAMES[id][1][0].toUpperCase()}${NAMES[id][1].slice(1)}. An invented home with a simulated calendar, a demonstration booking and the real IPMA forecast for your dates.`, one(id)]),
  ['agent', 'Ask the agent', 'A scripted agent: pre-written answers matched in your browser, no live model. A simulation.', `<div class="art">${bubble}</div>`],
  ['live', 'Live from the Algarve', 'Public live cameras along the coast, with their operators named. Link out only.', `<div class="art">${camera}</div>`],
  ['billboard', 'A London billboard, live from the Algarve', 'A proposal, drawn as mock-ups: what a digital billboard could show from live data.', `<div class="art">${billboard}</div>`],
  ['use-the-data', 'Use the data', 'How this site reads IPMA and events data from data.promptugal.news, and how you can.', `<div class="art">${files}</div>`],
  ['use-with-ai', 'Use with AI', 'Markdown twins, llms.txt and the data addresses, with each source\'s terms.', `<div class="art">${files}</div>`],
  ['behind-the-scenes', 'Behind the scenes', 'The agent team that makes this site: roles, policies, rounds and every commit.', `<div class="art">${flow}</div>`],
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
.foot{padding:10px 56px 18px;font-size:19px;color:var(--ink-2);border-top:2px solid var(--line)}
</style></head><body>
<div class="band"><strong>Made-up example.</strong> An invented company: homes, prices, availability and bookings are simulated.</div>
${art.startsWith('<div class="row">') ? `<div class="top wide"><div><p class="brand">${chimney({ width: 26, height: 44 })}<span>${esc(BRAND)}<small>${esc(BRAND_LINE)}</small></span></p><h1>${esc(title)}</h1><p class="line">${esc(line)}</p></div></div>${art}`
    : `<div class="top"><div><p class="brand">${chimney({ width: 26, height: 44 })}<span>${esc(BRAND)}<small>${esc(BRAND_LINE)}</small></span></p><h1>${esc(title)}</h1><p class="line">${esc(line)}</p></div>${art}</div>`}
<div class="foot">algarve-holiday-homes.agenticcells.site · Weather: IPMA, read live via data.promptugal.news · A made-up example by the AgentiCCells agents</div>
</body></html>`;
}

const { chromium } = require('playwright');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let bad = 0;
for (const [name, title, line, art] of PAGES) {
  const html = card(title, line, art);
  if (!/made-up example/i.test(html)) { console.error(`${name}: no "made-up example"`); bad++; }
  await page.setContent(html, { waitUntil: 'load' });
  const f = `${OUT}/${name}.png`;
  writeFileSync(f, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
  const kb = Math.round(statSync(f).size / 1024);
  if (kb >= 300) bad++;
  console.log(`${f} ${kb} KB${kb >= 300 ? ' (too big: over 300 KB)' : ''}`);
}
await browser.close();
if (bad) { console.error(`FAILED: ${bad} card(s) over 300 KB or without "made-up example"`); process.exit(1); }
console.log(`OK: ${PAGES.length} cards`);
