// tests/browser.mjs: what the browser tests share (round 5, team/rounds/5/design/PROPOSAL.md 2.9 and 10).
// It serves _site on a free port of this machine (node:http, GET only), loads the pre-installed
// Playwright if there is one, and blocks every request that leaves this site, so the pages show
// their "could not be read" states and the results do not depend on the live data. Nothing is sent.
// Without Playwright, or without a built _site, the tests skip with the reason given here.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 5.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

export const ROOT = new URL('../', import.meta.url).pathname;
export const SITE = join(ROOT, '_site');
let pw = null;
try { pw = createRequire(import.meta.url)('playwright'); } catch { pw = null; }
export const playwright = pw;
export const SKIP = !pw ? 'Playwright is not installed: the browser checks did not run'
  : !existsSync(join(SITE, 'admin', 'index.html')) ? 'the site is not built: run node scripts/build.mjs first'
  : false;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain', '.md': 'text/plain', '.ico': 'image/x-icon', '.xml': 'application/xml' };
// serve() -> { base, close() }: _site on 127.0.0.1 and a free port.
export function serve() {
  return new Promise(resolve => {
    const srv = createServer(async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
      let f = join(SITE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); const b = await readFile(f); res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(b); }
      catch { res.writeHead(404); res.end('not found'); }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ base: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise(r => srv.close(r)) }));
  });
}
// context(browser, { width, dark }) -> a context that answers only this site.
export async function context(browser, { width, dark = false, reducedMotion = 'reduce' }) {
  const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 900 : 844 }, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light', reducedMotion });
  await ctx.route(url => !/^http:\/\/127\.0\.0\.1:/.test(url.href), route => route.abort());
  return ctx;
}
export const SECTIONS = ['today', 'bookings', 'calendar', 'cleaning', 'stock', 'issues', 'messages', 'reviews', 'rates', 'money', 'legality', 'integrations', 'policies'];
// adminWithExamples(page, base, query): a fresh admin with "Load example activity (simulated)".
export async function adminWithExamples(page, base, query = '') {
  await page.goto(`${base}/admin/${query}#today`, { waitUntil: 'load' });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(`${base}/admin/${query}#today`, { waitUntil: 'load' });
  await page.waitForSelector('[data-act="examples"]', { timeout: 10000 });
  await page.click('[data-act="examples"]');
  await page.waitForTimeout(400);
}
export async function section(page, sec) {
  await page.evaluate(s => { location.hash = `#${s}`; }, sec);
  await page.waitForFunction(s => document.querySelector(`.adm-side a[data-sec="${s}"]`)?.getAttribute('aria-current') === 'page', sec, { timeout: 5000 });
  await settle(page);
}
// settle(page): no request in flight, the fonts loaded and two frames drawn, then a short pause. Under the
// parallel test run a fixed pause alone sometimes caught a section before its last redraw (round 5 study pass).
export async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => new Promise(r => { const go = () => requestAnimationFrame(() => requestAnimationFrame(r)); document.fonts?.ready ? document.fonts.ready.then(go) : go(); }));
  await page.waitForTimeout(250);
}
// colours(page) -> [path, values...] for every element of the page, in document order.
export const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'box-shadow', 'fill', 'stroke'];
export async function colours(page) {
  return page.evaluate(props => {
    const out = [];
    const path = el => { const p = []; for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) { let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) i++; p.push(`${e.tagName.toLowerCase()}:${i}`); } return p.reverse().join('/'); };
    for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); out.push([path(el), ...props.map(k => cs.getPropertyValue(k))]); }
    return out;
  }, PROPS);
}
// The first 40 hex characters of SHA-256 (the leak scan reads longer hex as a possible secret).
export const sha = x => createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex').slice(0, 40);
export const VIEWS = () => { const v = []; for (const w of [390, 1366]) for (const dark of [false, true]) v.push({ width: w, dark, key: `${w}-${dark ? 'dark' : 'light'}` }); return v; };

// small(page) -> the visible elements whose own text renders under 12 px (SVG text scaled by its drawing).
export async function small(page, { selector = 'body *', min = 11.95 } = {}) {
  return page.evaluate(({ selector, min }) => {
    const out = [];
    for (const el of document.querySelectorAll(selector)) {
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      let px = parseFloat(cs.fontSize);
      if (el instanceof SVGElement && el.getScreenCTM) { const m = el.getScreenCTM(); if (m) px *= Math.hypot(m.a, m.b); }
      if (px < min) out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} ${px.toFixed(1)}px "${el.textContent.trim().slice(0, 30)}"`);
    }
    return out;
  }, { selector, min });
}
export const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// kpiFit(page) -> tiles whose figure is cut off by its tile ("clipped"), or with a word broken across lines ("split").
// Added in the round 5 build walk, which found Linho's tiles four across at 390 and Postal's figures cut off at 1366.
export const kpiFit = page => page.evaluate(() => {
  const out = [];
  for (const k of document.querySelectorAll('.kpi')) {
    if (!k.getClientRects().length) continue;
    for (const v of k.querySelectorAll('.kv')) if (v.scrollWidth > v.clientWidth + 1 || v.getBoundingClientRect().right > k.getBoundingClientRect().right + 1) out.push(`clipped "${v.textContent.trim()}"`);
    const w = document.createTreeWalker(k, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const re = /\S+/g; let m;
      while ((m = re.exec(n.textContent))) {
        if (m[0].length < 2) continue;
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        if (new Set([...r.getClientRects()].filter(x => x.width).map(x => Math.round(x.top))).size > 1) out.push(`split "${m[0]}"`);
      }
    }
  }
  return out;
});

// figureSplits(page, root) -> figures (money, percentages, counts) broken across two lines anywhere in root,
// outside the KPI tiles too (round 5 study, finding 4: "€111,3" over "64").
export const figureSplits = (page, root = 'main, .adm-main, body') => page.evaluate(sel => {
  const out = [], top = document.querySelector(sel); if (!top) return out;
  const w = document.createTreeWalker(top, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    // A figure on its own: not part of a word, an id or a link (nothing alphanumeric, hyphen, slash or dot touching it).
    const re = /(?<![\p{L}\p{N}\-_/.:#])(?:[-−]?[€$]?\d[\d.,]*\d%?|[€$]\d|\d%)(?![\p{L}\p{N}\-_/])/gu; let m;
    while ((m = re.exec(n.textContent))) {
      if (m[0].length < 3) continue;
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const rects = [...r.getClientRects()].filter(x => x.width && x.height);
      if (new Set(rects.map(x => Math.round(x.top))).size > 1) out.push(`figure split "${m[0]}" in "${n.textContent.trim().slice(Math.max(0, m.index - 20), m.index + 30)}"`);
    }
  }
  return out;
}, root);

