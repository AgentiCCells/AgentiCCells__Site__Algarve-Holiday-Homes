const { start } = require('./lib');
(async () => {
  const { browser, page, step, shot, text, B } = await start(390, 844);
  await page.goto(B + '/world/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Very fast' }).click(); await page.waitForTimeout(9000);
  await page.goto(B + '/homes/harbour/', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  let t = await text(); let k = t.indexOf('Availability and booking');
  step('HARBOUR after world run: ' + t.slice(k, k + 1600).replace(/\n+/g, ' / '));
  await shot('p5-sceptic-after-world-run');
  await page.goto(B + '/?from=2026-12-12&to=2026-12-19', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  t = await text(); k = t.indexOf('Plan your stay');
  step('HOME after world run: ' + t.slice(k, k + 900).replace(/\n+/g, ' / '));
  await page.goto(B + '/stay/', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  t = await text(); k = t.indexOf('Your stay');
  step('STAY after world run: ' + t.slice(k, k + 600).replace(/\n+/g, ' / '));
  await browser.close();
})();
