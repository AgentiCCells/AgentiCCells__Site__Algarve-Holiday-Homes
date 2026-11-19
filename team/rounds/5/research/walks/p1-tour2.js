const { start } = require('./lib');
(async () => {
  const { browser, page, step, shot, text, B, log } = await start(1366, 900);
  await page.goto(B + '/play/', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /Show me how it works/ }).click(); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Start the tour|Start anyway/ }).click();
  let last = ''; const t0 = Date.now();
  for (let i = 0; i < 50; i++) {
    await page.waitForTimeout(2000);
    let c = '';
    for (const f of page.frames()) {
      try { c += await f.evaluate(() => { const out = []; document.querySelectorAll('[aria-labelledby=tour-h],[aria-labelledby=tour-dh]').forEach(e => { if (e.offsetParent || getComputedStyle(e).display !== 'none') out.push(e.innerText); }); return out.join(' ## '); }); } catch (e) {}
    }
    c = c.trim();
    if (c && c !== last) { last = c; step(`CARD t=${Math.round((Date.now()-t0)/1000)}s: ` + c.replace(/\n+/g, ' / ').slice(0, 600)); }
    if (/Step 6 of 10/.test(c) && !log.some(l => l.includes('SHOT p1-owner-tour'))) await shot('p1-owner-tour');
    if (/That was the tour/.test(c)) break;
    if (i % 2 === 1) { for (const f of page.frames()) { const b = f.locator('[aria-labelledby=tour-h] [data-tk=next]'); if (await b.count().catch(()=>0)) { await b.first().click().catch(()=>{}); break; } } }
  }
  require('fs').writeFileSync('out/p1tour2.log', log.join('\n'));
  await browser.close();
})();
