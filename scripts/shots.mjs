// Screenshots for reviews and round reports: each page at 390 px (phone) and 1366 px (laptop).
// Usage: node scripts/shots.mjs [--max-height=N] <base-url> <out-dir> [path ...]   (default paths: / /homes/ /d/)
// --max-height=N keeps only the top N px of a page taller than that (the log says so), to keep files small.
// Writes <out-dir>/<name>-<width>.jpg, full page, JPEG quality 70. Code Apache-2.0.
// From AgentiCCells__Site__Marc-Noah (conductor.marc-noah@, Apache-2.0), copied by conductor.ipma-data@ on 2026-11-18.
// Copied here from AgentiCCells__Site__IPMA-Data by conductor.algarve-holiday-homes@ on 2026-11-18; default paths changed.
// Round 2 (developer.algarve-holiday-homes@, PROPOSAL.md 4): `node scripts/shots.mjs --previews <base-url>` writes
// the /d/ chooser's screenshots instead: src/d/previews/<slug>.jpg, the top 900 px of each design at 1366 px
// wide, saved 800 px wide (JPEG quality 70, each under 120 KB). Rebuild afterwards so /d/ shows them.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === '--previews') {
  const { DESIGNS, PREVIEW_W } = await import('./designs.mjs');
  const { statSync } = await import('node:fs');
  const base = (args[1] || '').replace(/\/$/, '');
  if (!base) { console.error('usage: node scripts/shots.mjs --previews <base-url>'); process.exit(1); }
  mkdirSync('src/d/previews', { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: PREVIEW_W / 1366, colorScheme: 'light' });
  let big = 0;
  for (const d of DESIGNS) {
    const res = await page.goto(base + (d.href || `/d/${d.slug}/`), { waitUntil: 'networkidle' });
    if (!res || !res.ok()) { console.log(`${d.slug}: not built (${res ? res.status() : 'no answer'}), no screenshot`); continue; }
    await page.addStyleTag({ content: '.dock{display:none!important}' }); // the docked agent link would cover the design
    await page.waitForTimeout(400);
    const f = `src/d/previews/${d.slug}.jpg`;
    await page.screenshot({ path: f, type: 'jpeg', quality: 70, clip: { x: 0, y: 0, width: 1366, height: 900 } });
    const kb = Math.round(statSync(f).size / 1024); if (kb >= 120) big++;
    console.log(`${f} ${kb} KB${kb >= 120 ? ' (over 120 KB)' : ''}`);
  }
  await browser.close();
  process.exit(big ? 1 : 0);
}
const maxArg = args.find(a => a.startsWith('--max-height='));
const maxH = maxArg ? Number(maxArg.split('=')[1]) : 0;
const [base, outDir, ...rest] = args.filter(a => a !== maxArg);
if (!base || !outDir) { console.error('usage: node scripts/shots.mjs <base-url> <out-dir> [path ...]'); process.exit(1); }
const paths = rest.length ? rest : ["/", "/homes/", "/d/"];
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const width of [390, 1366]) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 768 }, deviceScaleFactor: 1 });
  for (const p of paths) {
    await page.goto(base.replace(/\/$/, '') + p, { waitUntil: 'networkidle' });
    // Scroll through the page so lazy images load before the full-page shot (round 2: photo-led pages).
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForLoadState('networkidle');
    const name = p.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home';
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const cut = maxH && height > maxH;
    await page.screenshot({ path: `${outDir}/${name}-${width}.jpg`, fullPage: true, type: 'jpeg', quality: 70, ...(cut ? { clip: { x: 0, y: 0, width, height: maxH } } : {}) });
    console.log(`${name}-${width}.jpg${cut ? `  (top ${maxH} px of ${height})` : ''}${overflow > 0 ? `  WARNING: ${overflow}px horizontal overflow` : ''}`);
  }
  await page.close();
}
await browser.close();
