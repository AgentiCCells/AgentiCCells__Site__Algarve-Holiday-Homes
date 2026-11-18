// Renders src/assets/share/admin.png (1200x630) the way scripts/cards.mjs renders its cards.
import { createRequire } from 'node:module';
import { writeFileSync, statSync } from 'node:fs';
const root = '/home/user/AgentiCCells__Site__Algarve-Holiday-Homes';
const require = createRequire(root + '/scripts/cards.mjs');
const { BRAND, BRAND_LINE } = await import(root + '/scripts/lib.mjs');
const { chimney } = await import(root + '/src/assets/js/houses.js');
const bars = [3,4,6,11,13,20,24,25,19,12,4].map((v,i)=>`<rect x="${30+i*36}" y="${190-v*6}" width="13" height="${v*6}" rx="3" fill="#2a78d6"/><rect x="${44+i*36}" y="${190-Math.round(v*2.2+8)}" width="13" height="${Math.round(v*2.2+8)}" rx="3" fill="#eb6834"/>`).join('');
const art = `<div class="mock"><div class="side">${['Today','Bookings','Calendar','Cleaning','Stock','Issues','Money','Legality','Policies'].map((t,i)=>`<p class="${i===6?'on':''}">${t}</p>`).join('')}</div><div class="body"><div class="tiles"><div><small>Profit before income tax</small><b>simulated</b></div><div><small>VAT 6%</small><b>simulated</b></div><div><small>Policy log</small><b class="deny">DENY</b></div></div><svg viewBox="0 0 430 200">${bars}<line x1="20" x2="425" y1="190" y2="190" stroke="#4E5966"/></svg><p class="cap">Every figure invented; not legal or tax advice</p></div></div>`;
const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>
:root{--bg:#FBF7F0;--surface:#FFFFFF;--ink:#1F2328;--ink-2:#545A62;--line:#D9D2C5;--accent:#A13D1A;--sea:#0E5A72;--wall:#FFFFFF;--roof:#C2643D;--water:#9FD3E3;--green:#5E7D4A}*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:#FBF7F0;color:#1F2328;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;display:grid;grid-template-rows:auto 1fr auto}
.band{background:#FBE7A1;color:#3A2E00;padding:16px 56px;font-size:24px;line-height:1.3}.band strong{font-weight:800}
.top{display:grid;grid-template-columns:1fr 600px;gap:36px;padding:28px 56px 10px;align-items:center}
.brand{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:700;margin:0 0 18px}.brand small{display:block;font-weight:400;font-size:18px;color:#545A62}
h1{font-size:60px;line-height:1.05;margin:0 0 18px}.line{font-size:26px;line-height:1.3;color:#545A62;margin:0}
.mock{display:grid;grid-template-columns:150px 1fr;height:390px;border-radius:12px;overflow:hidden;border:2px solid #DADFE5;background:#F3F5F7}
.side{background:#1E2933;color:#E6EBF0;padding:14px 0;font-size:17px}.side p{margin:0;padding:6px 16px}.side .on{background:#2C3B4A;border-left:5px solid #E8875E;font-weight:700}
.body{padding:14px}.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px}.tiles div{background:#fff;border:1px solid #DADFE5;border-radius:8px;padding:8px}
.tiles small{display:block;font-size:13px;color:#4E5966}.tiles b{font-size:18px;color:#1E3A8A}.tiles b.deny{font-family:ui-monospace,monospace;background:#FBE1DE;color:#8A1C1C;padding:0 6px;border-radius:4px}
.mock svg{width:100%;height:auto;background:#fff;border:1px solid #DADFE5;border-radius:8px}.cap{margin:6px 0 0;font-size:15px;color:#4E5966}
.foot{padding:10px 56px 18px;font-size:19px;color:#545A62;border-top:2px solid #D9D2C5}
</style></head><body>
<div class="band"><strong>Made-up example.</strong> An invented company: bookings, guests, money and the agents are simulated in your browser.</div>
<div class="top"><div><p class="brand">${chimney({ width: 26, height: 44 })}<span>${BRAND}<small>${BRAND_LINE}</small></span></p><h1>The back office</h1><p class="line">Bookings, stock, cleaning, money, the Portuguese rules and the agents' policies of an invented business.</p></div>${art}</div>
<div class="foot">algarve-holiday-homes.agenticcells.site/admin/ · Weather: IPMA, read live via data.promptugal.news · A made-up example by the AgentiCCells agents</div>
</body></html>`;
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: 'load' });
const f = root + '/src/assets/share/admin.png';
writeFileSync(f, await p.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
await b.close(); console.log(f, Math.round(statSync(f).size / 1024), 'KB');
