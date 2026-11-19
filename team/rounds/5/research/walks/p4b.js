const { start } = require('./lib');
const fs = require('fs');
(async () => {
  const { browser, page, step, shot, text, B, log } = await start(1366, 900);
  const focused = () => page.evaluate(() => { const e = document.activeElement; if (!e) return '(none)'; const name = e.getAttribute('aria-label') || (e.labels && e.labels[0] && e.labels[0].innerText) || e.innerText || ''; return `${e.tagName.toLowerCase()}${e.closest('.cal') ? '[cal]' : ''} "${name.trim().replace(/\s+/g, ' ').slice(0, 110)}"`; });
  await page.goto(B + '/homes/salt/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  // record what live regions announce: observe text changes in aria-live / role=status elements
  await page.evaluate(() => { window.__ann = []; const obs = new MutationObserver(ms => { for (const m of ms) { const el = (m.target.nodeType === 1 ? m.target : m.target.parentElement).closest('[aria-live],[role=status],[role=alert]'); if (el && el.getAttribute('aria-live') !== 'off') { const t = el.innerText.trim(); if (t && window.__ann[window.__ann.length - 1] !== t) window.__ann.push(t.slice(0, 200) + ' [' + t.length + ' chars]'); } } }); obs.observe(document.body, { subtree: true, childList: true, characterData: true }); });
  const ann = async (label) => { const a = await page.evaluate(() => { const x = window.__ann || []; window.__ann = []; return x; }); step(`ANNOUNCED after ${label}: (${a.length}) ` + a.map(s => s.replace(/\n+/g, ' / ')).join(' || ').slice(0, 1500)); };
  let n = 0; let f = '';
  for (; n < 150; n++) { await page.keyboard.press('Tab'); f = await focused(); if (f.includes('[cal]') && !/month/.test(f)) break; }
  step('calendar day reached after ' + (n + 1) + ' tabs: ' + f);
  await ann('tabbing');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  step('after 5 x Right: ' + await focused());
  await page.keyboard.press('Enter'); await page.waitForTimeout(1500); step('focus: ' + await focused()); await ann('Enter (arrive)');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); step('focus: ' + await focused());
  await page.keyboard.press('Enter'); await page.waitForTimeout(2500); step('focus: ' + await focused()); await ann('Enter (leave)');
  let k = 0; for (; k < 30; k++) { await page.keyboard.press('Tab'); if (/Next: guests/.test(await focused())) break; }
  step('Next: guests after ' + (k + 1) + ' tabs');
  await page.keyboard.press('Enter'); await page.waitForTimeout(600); step('after Next: guests, focus ' + await focused()); await ann('Next: guests');
  const seq = []; for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); seq.push(await focused()); } step('guests tabs: ' + seq.join(' | '));
  for (let i = 0; i < 20; i++) { if (/Next: details/.test(await focused())) break; await page.keyboard.press('Shift+Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(600); step('details focus: ' + await focused());
  const seq2 = []; for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); seq2.push(await focused()); } step('details tabs: ' + seq2.join(' | '));
  for (let i = 0; i < 10; i++) { if (/Next: review/.test(await focused())) break; await page.keyboard.press('Shift+Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(800); step('review focus: ' + await focused()); await ann('Next: review');
  const rv = await page.locator('.review').ariaSnapshot().catch(() => '(no .review)'); step('REVIEW aria: ' + rv.replace(/\n/g, ' '));
  for (let i = 0; i < 15; i++) { if (/Book \(pretend\)/.test(await focused())) break; await page.keyboard.press('Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(800); step('pay focus: ' + await focused()); await ann('Book (pretend)');
  for (let i = 0; i < 10; i++) { if (/Pay \(pretend\)/.test(await focused())) break; await page.keyboard.press('Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(1000); step('final focus: ' + await focused()); await ann('Pay (pretend)');
  await shot('p4-screenreader-final-focus');
  // The policy log dock: is it reachable, and what does it say?
  const dock = await page.getByRole('region', { name: 'Policy log' }).ariaSnapshot().catch(e => e.message); step('POLICY LOG region: ' + dock.replace(/\n/g, ' ').slice(0, 600));
  // Agent dock on the home page
  const ag = await page.locator('body').ariaSnapshot(); const i = ag.indexOf('Ask the agent'); step('agent dock aria (tail): ' + ag.slice(ag.lastIndexOf('Ask the agent') - 200, ag.lastIndexOf('Ask the agent') + 400).replace(/\n/g, ' '));
  // Stay page aria heading structure
  await page.goto(B + '/stay/', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const st = await page.locator('body').ariaSnapshot(); fs.writeFileSync('out/p4-stay-aria.txt', st);
  step('STAY headings: ' + (st.match(/heading "[^"]*" \[level=\d\]/g) || []).join(' | '));
  // World: can the stage be understood without sight?
  await page.goto(B + '/world/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Very fast' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(8000);
  const w = await page.evaluate(() => [...document.querySelectorAll('[aria-live],[role=status],[role=log]')].map(e => (e.getAttribute('aria-live') || e.getAttribute('role')) + ': ' + e.innerText.trim().slice(0, 300)).join(' || '));
  step('WORLD live regions after Very fast: ' + w.replace(/\n+/g, ' / ').slice(0, 1500));
  const stage = await page.getByRole('region', { name: /stage/i }).ariaSnapshot().catch(e => '(no region named stage) ' + e.message.slice(0, 80)); step('WORLD stage aria: ' + stage.replace(/\n/g, ' ').slice(0, 800));
  fs.writeFileSync('out/p4b.log', log.join('\n'));
  await browser.close();
})();
