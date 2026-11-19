const { start } = require('./lib');
(async () => {
  const { browser, page, step, text, B } = await start(1366, 900);
  for (const h of ['salt','lagoon','hill','harbour','cape']) {
    await page.goto(B + '/homes/' + h + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
    const t = await text(); const k = t.indexOf('Rules and access');
    step(h + ': ' + t.slice(k, k + 250).replace(/\n+/g, ' / '));
  }
  await browser.close();
})();
