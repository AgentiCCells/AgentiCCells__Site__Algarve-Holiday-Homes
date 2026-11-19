// Persona 1 (invented, synthetic): a house owner thinking of letting a house in the Algarve.
const { start } = require('./lib');
const clip = (t, from, n) => { const k = t.indexOf(from); return k < 0 ? '(not found: ' + from + ')' : t.slice(k, k + n).replace(/\n+/g, ' / '); };
(async () => {
  const { browser, page, step, shot, text, B, log } = await start(1366, 900);
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  // About this demo
  const about = page.getByRole('button', { name: 'About this demo' }).first();
  if (await about.count()) { await about.click(); } else { await page.getByRole('link', { name: 'About this demo' }).first().click(); }
  await page.waitForTimeout(1200);
  step('ABOUT URL: ' + page.url());
  const dlg = await page.evaluate(() => { const d = document.querySelector('dialog[open], [role=dialog]'); return d ? d.innerText : null; });
  step('ABOUT DIALOG: ' + (dlg ? dlg.replace(/\n+/g, ' / ').slice(0, 3000) : '(no dialog)'));
  await shot('p1-owner-about');
  await page.keyboard.press('Escape');
  // Search for an owner-facing offer
  for (const p of ['/', '/behind-the-scenes/', '/use-the-data/']) {
    await page.goto(B + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
    const t = await text();
    const hits = (t.match(/[^\n]*(owner|your house|your home|let your|contact|price of|cost you|integrat|booking platform)[^\n]*/gi) || []).slice(0, 12);
    step('OWNER WORDS on ' + p + ': ' + hits.join(' || '));
  }
  // Admin
  await page.goto(B + '/admin/#today', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Load example activity/ }).click().catch(e => step('load ex: ' + e.message));
  await page.waitForTimeout(1500);
  let t = await text();
  step('TODAY after example: ' + clip(t, 'Today, Wednesday', 2500));
  await shot('p1-owner-admin-today');
  for (const tab of ['money', 'legality', 'integrations', 'rates', 'policies']) {
    await page.getByRole('link', { name: new RegExp('^' + tab, 'i') }).first().click().catch(async () => { await page.goto(B + '/admin/#' + tab); });
    await page.waitForTimeout(1500);
    t = await text();
    const k = t.indexOf('Signed in as the owner');
    step('ADMIN ' + tab.toUpperCase() + ': ' + t.slice(k, k + 3500).replace(/\n+/g, ' / '));
    if (tab === 'money') await shot('p1-owner-admin-money');
  }
  // The tour from /play/
  await page.goto(B + '/play/', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /Show me how it works/ }).click();
  await page.waitForTimeout(1500);
  const d2 = await page.evaluate(() => { const d = document.querySelector('dialog[open], [role=dialog]'); return d ? d.innerText : document.body.innerText.slice(0, 600); });
  step('TOUR START: ' + d2.replace(/\n+/g, ' / ').slice(0, 1200));
  const startBtn = page.getByRole('button', { name: /^(Start|Start the tour|Begin)/ });
  if (await startBtn.count()) { await startBtn.first().click(); }
  const seen = new Set();
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(5000);
    const s = await page.evaluate(() => { const e = document.querySelector('[class*=tour] [aria-live], .tour-card, [class*=tour-step], [data-tour-card], .tour'); return e ? e.innerText : ''; });
    if (s && !seen.has(s)) { seen.add(s); step('TOUR STEP ' + i + ': ' + s.replace(/\n+/g, ' / ').slice(0, 500)); }
    if (i === 6) await shot('p1-owner-tour');
  }
  require('fs').writeFileSync('out/p1.log', log.join('\n'));
  await browser.close();
})();
