// Persona 2 (invented, synthetic): a guest planning a week in December, on a phone.
const { start } = require('./lib');
(async () => {
  const { browser, page, step, shot, text, B, log } = await start(390, 844);
  await page.goto(B + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  step('ABOVE FOLD: ' + (await page.evaluate(() => { const r=[]; document.querySelectorAll('body *').forEach(e=>{const b=e.getBoundingClientRect(); if(b.top<844 && b.bottom>0 && e.children.length===0 && e.innerText && e.innerText.trim()) r.push(e.innerText.trim());}); return r.join(' | ');})));
  // Try typing December dates in the home page form
  const inputs = await page.$$eval('form input, form select', els => els.map(e => ({ id: e.id, type: e.type, min: e.min, max: e.max, name: e.name })));
  step('FORM FIELDS: ' + JSON.stringify(inputs));
  const arrive = page.getByLabel('Arrive').first();
  const leave = page.getByLabel('Leave').first();
  await arrive.fill('2026-12-12');
  await leave.fill('2026-12-19');
  await page.getByLabel('Guests').first().selectOption('2').catch(e => step('guests select: ' + e.message));
  await page.getByRole('button', { name: /Show free homes/ }).click();
  await page.waitForTimeout(3000);
  step('URL after search: ' + page.url());
  const t = await text();
  const i = t.indexOf('The Algarve now');
  step('AFTER SEARCH (excerpt): ' + t.slice(t.indexOf('Plan your stay'), t.indexOf('Plan your stay') + 2500).replace(/\n+/g, ' / '));
  await shot('p2-guest-december-results');
  // Open the Harbour House (Lagos) with the dates
  const link = page.getByRole('link', { name: /Harbour House/ }).first();
  step('Harbour link href: ' + await link.getAttribute('href'));
  await link.click();
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(2500);
  step('URL home: ' + page.url());
  const h = await text();
  const a = h.indexOf('Availability and booking');
  step('HOME PAGE booking+weather (excerpt): ' + h.slice(a, a + 4000).replace(/\n+/g, ' / '));
  await shot('p2-guest-harbour-december');
  // Proceed through the steps
  const next = page.getByRole('button', { name: 'Next: guests' });
  step('Next: guests enabled? ' + await next.isEnabled().catch(() => 'missing'));
  if (await next.isEnabled().catch(() => false)) {
    await next.click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'One adult more' }).click().catch(()=>{});
    await page.getByRole('button', { name: 'Next: details' }).click();
    await page.waitForTimeout(500);
    await page.getByLabel(/A name for the booking/).fill('Sam');
    await page.getByRole('button', { name: 'Next: review' }).click();
    await page.waitForTimeout(800);
    const r = await text(); const k = r.indexOf('Step 4 of 5');
    step('REVIEW: ' + r.slice(k, k + 1200).replace(/\n+/g, ' / '));
    await shot('p2-guest-review-price');
    await page.getByRole('button', { name: /Book \(pretend\)/ }).click(); await page.waitForTimeout(800);
    const p = await text(); const k2 = p.indexOf('Step 5 of 5');
    step('PAY: ' + p.slice(k2, k2 + 800).replace(/\n+/g, ' / '));
    await page.getByRole('button', { name: 'Pay (pretend)' }).click(); await page.waitForTimeout(800);
    const f = await text(); const k3 = f.indexOf('Booked (pretend)');
    step('FINAL: ' + f.slice(k3, k3 + 600).replace(/\n+/g, ' / '));
    await page.getByRole('link', { name: 'Go to your stay' }).click();
    await page.waitForLoadState('networkidle'); await page.waitForTimeout(3000);
    const s = await text(); const k4 = s.indexOf('Your stay');
    step('STAY: ' + s.slice(k4, k4 + 4000).replace(/\n+/g, ' / '));
    await shot('p2-guest-stay-december');
  }
  // Ask the agent about December weather
  await page.goto(B + '/agent/?q=' + encodeURIComponent('What will the weather be in Lagos from 12 to 19 December?'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const ag = await text(); const k5 = ag.indexOf('Hello. I am');
  step('AGENT: ' + ag.slice(k5, k5 + 1500).replace(/\n+/g, ' / '));
  require('fs').writeFileSync('out/p2.log', log.join('\n'));
  await browser.close();
})();
