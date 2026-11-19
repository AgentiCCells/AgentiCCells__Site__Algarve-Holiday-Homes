// tests/ledger-record.mjs: records the Ledger fixtures (round 5, PROPOSAL.md 2.9): for the default admin
// (no data-design), after "Load example activity (simulated)", all 13 sections at 390 and 1366 px, light
// and dark (52 views): the computed colours of every element (tests/fixtures/ledger-colours.json, one
// SHA-256 per view over [element path, 11 colour properties] in document order, with the count of
// elements) and a full-page PNG screenshot at deviceScaleFactor 1 (tests/fixtures/ledger-shots.json,
// its SHA-256, with the Chromium version and the platform).
// Run: node tests/ledger-record.mjs "<reason>" [--shots-only]. Every re-recording writes its reason
// into the fixture, and the build notes say why. Not a test itself (tests/ledger-unchanged.test.mjs is).
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 5.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { playwright, SKIP, serve, context, adminWithExamples, section, colours, sha, SECTIONS, VIEWS, ROOT } from './browser.mjs';

export async function measure({ query = '', views = VIEWS(), sections = SECTIONS, shots = true } = {}) {
  const srv = await serve();
  const browser = await playwright.chromium.launch();
  const out = { colours: {}, shots: {}, chromium: browser.version(), platform: `${process.platform}-${process.arch}` };
  try {
    for (const v of views) {
      const ctx = await context(browser, v);
      const page = await ctx.newPage();
      await adminWithExamples(page, srv.base, query);
      for (const s of sections) {
        await section(page, s);
        const c = await colours(page);
        out.colours[`${s}|${v.key}`] = { elements: c.length, sha256: sha(c) };
        if (shots) out.shots[`${s}|${v.key}`] = sha(await page.screenshot({ fullPage: true, type: 'png', animations: 'disabled', caret: 'hide' }));
      }
      await ctx.close();
    }
  } finally { await browser.close(); await srv.close(); }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('ledger-record.mjs')) {
  if (SKIP) { console.error(SKIP); process.exit(1); }
  const reason = process.argv[2] || '';
  if (!reason) { console.error('usage: node tests/ledger-record.mjs "<reason>" [--shots-only]'); process.exit(1); }
  const shotsOnly = process.argv.includes('--shots-only');
  const m = await measure();
  const fx = join(ROOT, 'tests', 'fixtures');
  const when = new Date().toISOString().slice(0, 16) + 'Z';
  const hist = f => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).history || [] : []);
  if (!shotsOnly) {
    const f = join(fx, 'ledger-colours.json');
    writeFileSync(f, JSON.stringify({ about: 'Computed colours of the default admin (Ledger), 52 views; see tests/ledger-record.mjs.', chromium: m.chromium, platform: m.platform, history: [...hist(f), { at: when, reason }], views: m.colours }, null, 1) + '\n');
  }
  const f2 = join(fx, 'ledger-shots.json');
  writeFileSync(f2, JSON.stringify({ about: 'SHA-256 of full-page PNG screenshots of the default admin (Ledger), 52 views; compared only on the same Chromium and platform.', chromium: m.chromium, platform: m.platform, history: [...hist(f2), { at: when, reason }], views: m.shots }, null, 1) + '\n');
  console.log(`recorded ${Object.keys(m.colours).length} views (${Object.values(m.colours).reduce((t, v) => t + v.elements, 0)} elements) on Chromium ${m.chromium}, ${m.platform}${shotsOnly ? ' (screenshots only)' : ''}`);
}
