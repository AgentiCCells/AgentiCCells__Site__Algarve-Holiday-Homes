const { start } = require('./lib');
(async () => {
  const { browser, page, step, text, B } = await start(1366, 900);
  const prices = async (label) => { await page.goto(B + '/homes/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500); const t = await text(); step(label + ' /homes/: ' + (t.match(/From EUR \d+ a night[^\n]*/g) || []).join(' | ')); await page.goto(B + '/homes/harbour/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500); const h = await text(); step(label + ' harbour page: ' + (h.match(/From EUR \d+ a night[^\n]*/) || [''])[0]); };
  await prices('BEFORE');
  await page.goto(B + '/world/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Very fast' }).click(); await page.waitForTimeout(9000);
  await prices('AFTER WORLD');
  await page.goto(B + '/admin/#rates', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const r = await text(); const k = r.indexOf('Rates and rules INVENTED'); step('ADMIN rates after world: ' + r.slice(k, k + 500).replace(/\n+/g, ' / '));
  await browser.close();
})();
