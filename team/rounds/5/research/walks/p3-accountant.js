// Persona 3 (invented, synthetic): an accountant checking the money and the legality.
const { start } = require('./lib');
const fs = require('fs');
(async () => {
  const { browser, ctx, page, step, shot, text, B, log } = await start(1366, 900);
  const quote = async (home, from, to, adults, children) => {
    await page.goto(`${B}/homes/${home}/?from=${from}&to=${to}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    const nx = page.getByRole('button', { name: 'Next: guests' });
    if (!(await nx.isEnabled())) { const t = await text(); const k = t.indexOf(t.match(/\w{3} \d+ \w{3} to \w{3} \d+ \w{3}:/)?.[0] || 'zz'); step(`QUOTE ${home} ${from}..${to}: not bookable: ` + t.slice(k, k + 200).replace(/\n+/g, ' / ')); return; }
    await nx.click(); await page.waitForTimeout(300);
    const setTo = async (id, more, fewer, n) => { for (let g = 0; g < 8; g++) { const v = Number(await page.locator('#' + id).innerText()); if (v === n) break; const b = page.getByRole('button', { name: v < n ? more : fewer }); if (!(await b.isEnabled())) { step('cannot reach ' + n + ' for ' + id + ' (at ' + v + ')'); break; } await b.click(); } };
    await setTo('o-adults', 'One adult more', 'One adult fewer', adults);
    await setTo('o-children', 'One child more', 'One child fewer', children);
    await page.getByRole('button', { name: 'Next: details' }).click(); await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Next: review' }).click(); await page.waitForTimeout(600);
    const r = await text(); const k = r.indexOf('Step 4 of 5');
    step(`QUOTE ${home} ${from}..${to} ${adults}a${children}c: ` + r.slice(k, r.indexOf('Book (pretend)', k)).replace(/\n+/g, ' / '));
  };
  await quote('hill', '2026-11-23', '2026-11-30', 4, 1);
  await quote('hill', '2026-12-05', '2026-12-12', 4, 1);   // Loulé, winter, 7 nights, cap 5
  await quote('lagoon', '2026-11-27', '2026-11-29', 2, 0); // Faro, weekend
  await quote('salt', '2026-12-19', '2026-12-24', 2, 1);   // Tavira, over the 20 Dec uplift
  await quote('cape', '2026-12-26', '2026-12-31', 3, 0);   // Vila do Bispo, late December
  await shot('p3-accountant-quote-cape');
  // Admin Today, untouched simulation
  await page.goto(B + '/admin/#today', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  let t = await text();
  step('TODAY (fresh, own bookings above kept): ' + t.slice(t.indexOf('Homes occupied tonight'), t.indexOf('Homes occupied tonight') + 500).replace(/\n+/g, ' / '));
  // Money
  await page.goto(B + '/admin/#money', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  t = await text();
  const k = t.indexOf('Profit and loss per home, year to date');
  step('P&L TABLE: ' + t.slice(k, k + 3000).replace(/\n+/g, ' / '));
  const a = t.indexOf('Assumptions behind these figures');
  // open the assumptions
  const det = page.locator('summary', { hasText: 'Assumptions behind these figures' });
  if (await det.count()) { await det.first().click(); await page.waitForTimeout(600); }
  t = await text();
  const a2 = t.indexOf('Assumptions behind these figures');
  step('ASSUMPTIONS: ' + t.slice(a2, a2 + 4000).replace(/\n+/g, ' / '));
  await shot('p3-accountant-assumptions');
  // the IRS line and any explanation
  const irs = (t.match(/[^\n]*(IRS|coefficient|15%|simplified|organised)[^\n]*/g) || []).slice(0, 15);
  step('IRS LINES: ' + irs.join(' || '));
  // CSV export
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }).catch(() => null), page.getByRole('button', { name: /Export CSV/ }).click().catch(() => page.getByRole('link', { name: /Export CSV/ }).click())]);
  if (dl) { const p = '/tmp/claude-0/-home-user-AgentiCCells--Site--Algarve-Holiday-Homes/e9db6ddf-b9cb-59f3-8762-01cd662ba625/scratchpad/out/pnl.csv'; await dl.saveAs(p); step('CSV saved: ' + fs.readFileSync(p, 'utf8').slice(0, 3000)); }
  // Legality: tourist tax rows
  await page.goto(B + '/admin/#legality', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  t = await text();
  const tt = (t.match(/[^\n]*(tourist tax|taxa|Lagos|Loulé|Faro)[^\n]*/gi) || []).slice(0, 30);
  step('LEGALITY TOURIST TAX LINES: ' + tt.join(' || '));
  for (const btn of ['The Lagoon House (Faro)', 'The Hill House (Loulé)', 'The Harbour House (Lagos)']) {
    const s = page.locator('summary', { hasText: btn });
    if (await s.count()) { await s.first().click(); await page.waitForTimeout(300); }
  }
  t = await text();
  const kk = t.indexOf('The Lagoon House (Faro)');
  step('LEGALITY HOMES: ' + t.slice(kk, kk + 3500).replace(/\n+/g, ' / '));
  fs.writeFileSync('out/p3.log', log.join('\n'));
  await browser.close();
})();
