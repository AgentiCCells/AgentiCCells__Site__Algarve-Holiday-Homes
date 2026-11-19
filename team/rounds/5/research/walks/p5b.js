const { start } = require('./lib');
(async () => {
  const { browser, page, step, shot, text, B, log } = await start(1366, 900);
  await page.goto(B + '/behind-the-scenes/', { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  const t = await text(); step('DINIS lines: ' + (t.match(/[^\n]*Dinis[^\n]*/g) || []).slice(0, 6).map(s => s.slice(0, 250)).join(' || '));
  await page.goto(B + '/world/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Very fast' }).click(); await page.waitForTimeout(9000);
  const w = await text();
  for (const h of ['Reviews', 'The people', 'WHAT THIS RUN FOUND', 'Profit and loss, this run']) { const k = w.indexOf(h); step('WORLD ' + h + ': ' + (k < 0 ? 'not found' : w.slice(k, k + 1400).replace(/\n+/g, ' / '))); }
  await page.getByRole('heading', { name: /^Reviews/ }).scrollIntoViewIfNeeded().catch(()=>{});
  await shot('p5-sceptic-world-reviews');
  // Simulated today vs real today on the home page
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const h = await text(); step('HOME clock vs today: ' + (h.match(/Simulated: [^\n]*/) || [''])[0] + ' || ' + (h.match(/Faro today[^\n]*/) || [''])[0]);
  await page.screenshot({ path: 'out/home-top.jpg', type: 'jpeg', quality: 70 });
  await browser.close();
})();
