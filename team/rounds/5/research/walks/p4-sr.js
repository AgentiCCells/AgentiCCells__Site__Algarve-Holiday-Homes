// Persona 4 (invented, synthetic): a person who uses a screen reader. Keyboard and the accessibility tree only.
const { start } = require('./lib');
const fs = require('fs');
(async () => {
  const { browser, page, step, shot, text, B, log } = await start(1366, 900);
  const focused = () => page.evaluate(() => { const e = document.activeElement; if (!e) return '(none)'; const name = e.getAttribute('aria-label') || (e.labels && e.labels[0] && e.labels[0].innerText) || e.innerText || e.value || ''; return `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : ''} "${name.trim().replace(/\s+/g, ' ').slice(0, 90)}"`; });
  const tabs = async (n, label) => { const seq = []; for (let i = 0; i < n; i++) { await page.keyboard.press('Tab'); seq.push(await focused()); } step(`TAB x${n} ${label}: ` + seq.map((s, i) => (i + 1) + '. ' + s).join(' | ')); return seq; };
  const live = () => page.evaluate(() => [...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map(e => e.innerText.trim()).filter(Boolean).join(' || ').slice(0, 600));
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const snap = await page.locator('body').ariaSnapshot();
  fs.writeFileSync('out/p4-home-aria.txt', snap);
  step('HOME headings: ' + (snap.match(/heading "[^"]*" \[level=\d\]/g) || []).join(' | '));
  step('HOME landmarks: ' + (snap.match(/^\s*- (banner|navigation|main|contentinfo|complementary|region|dialog)[^\n]*/gm) || []).map(s => s.trim()).join(' | '));
  await tabs(30, 'home page from the top');
  // Skip link then the date form
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  await page.keyboard.press('Tab'); step('first stop: ' + await focused());
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  await tabs(6, 'after the skip link');
  // Go to the Salt House via keyboard: tab until the link named Salt House
  let found = false;
  for (let i = 0; i < 80; i++) { await page.keyboard.press('Tab'); const f = await focused(); if (/Salt House/.test(f) && /^a/.test(f)) { step('reached after ' + (i + 1) + ' more tabs: ' + f); found = true; break; } }
  if (found) { await page.keyboard.press('Enter'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1500); }
  else await page.goto(B + '/homes/salt/', { waitUntil: 'networkidle' });
  const s2 = await page.locator('body').ariaSnapshot();
  fs.writeFileSync('out/p4-salt-aria.txt', s2);
  step('SALT headings: ' + (s2.match(/heading "[^"]*" \[level=\d\]/g) || []).join(' | '));
  // How many tabs to the calendar?
  let n = 0; let f = '';
  for (; n < 120; n++) { await page.keyboard.press('Tab'); f = await focused(); if (/data-day|gridcell|^button.*(Nov|Dec|\d{1,2})/.test(f) && /cal|Nov|Wednesday|Thursday|November/.test(f)) break; }
  step('calendar reached after ' + (n + 1) + ' tabs: ' + f);
  // describe the focused calendar button
  const calBtn = await page.evaluate(() => { const e = document.activeElement; return e.outerHTML.slice(0, 300); });
  step('calendar button html: ' + calBtn);
  // Move with arrows to Mon 23 Nov and pick, then two nights
  for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight']) { await page.keyboard.press(k); }
  step('after 5 x right: ' + await focused());
  await page.keyboard.press('Enter'); await page.waitForTimeout(300); step('live after Enter: ' + await live());
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  step('focus: ' + await focused());
  await page.keyboard.press('Enter'); await page.waitForTimeout(500); step('live after 2nd Enter: ' + await live());
  // Tab to Next: guests
  for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); if (/Next: guests/.test(await focused())) break; }
  step('focus: ' + await focused());
  await page.keyboard.press('Enter'); await page.waitForTimeout(500); step('after Next: focus ' + await focused());
  await tabs(8, 'guests step');
  for (let i = 0; i < 20; i++) { const ff = await focused(); if (/Next: details/.test(ff)) break; await page.keyboard.press('Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(500); step('details step focus: ' + await focused());
  await tabs(6, 'details step');
  for (let i = 0; i < 10; i++) { const ff = await focused(); if (/Next: review/.test(ff)) break; await page.keyboard.press('Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(600); step('review focus: ' + await focused());
  const rv = await page.locator('.review').ariaSnapshot().catch(() => '(no .review)');
  step('REVIEW aria: ' + rv.replace(/\n/g, ' '));
  for (let i = 0; i < 15; i++) { const ff = await focused(); if (/Book \(pretend\)/.test(ff)) break; await page.keyboard.press('Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(600); step('pay focus: ' + await focused());
  for (let i = 0; i < 10; i++) { const ff = await focused(); if (/Pay \(pretend\)/.test(ff)) break; await page.keyboard.press('Tab'); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(800); step('final focus: ' + await focused());
  step('live at end: ' + await live());
  await shot('p4-screenreader-final-focus');
  // The policy log panel and agent dock: reachable? names?
  const s3 = await page.locator('body').ariaSnapshot(); fs.writeFileSync('out/p4-final-aria.txt', s3);
  // Admin with keyboard: tabs
  await page.goto(B + '/admin/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const s4 = await page.locator('body').ariaSnapshot(); fs.writeFileSync('out/p4-admin-aria.txt', s4);
  step('ADMIN headings: ' + (s4.match(/heading "[^"]*" \[level=\d\]/g) || []).join(' | '));
  await tabs(25, 'admin from the top');
  // World page
  await page.goto(B + '/world/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const s5 = await page.locator('body').ariaSnapshot(); fs.writeFileSync('out/p4-world-aria.txt', s5);
  step('WORLD headings: ' + (s5.match(/heading "[^"]*" \[level=\d\]/g) || []).join(' | '));
  await tabs(20, 'world from the top');
  // Unnamed controls on several pages
  for (const p of ['/', '/homes/salt/', '/admin/', '/world/', '/play/', '/agents/', '/live/', '/stay/']) {
    await page.goto(B + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('a[href],button,input,select,textarea,[role=button],[tabindex]:not([tabindex="-1"])').forEach(e => {
        if (e.closest('[hidden],[aria-hidden=true]')) return; if (!e.offsetParent && e.tagName !== 'BODY') return;
        const n = (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.labels && e.labels.length && e.labels[0].innerText) || e.innerText || e.getAttribute('title') || e.getAttribute('alt') || (e.querySelector('img[alt]') && e.querySelector('img').alt) || '').trim();
        if (!n) bad.push(e.outerHTML.slice(0, 160));
      });
      const imgs = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;
      const svgs = [...document.querySelectorAll('svg')].filter(s => !s.closest('[aria-hidden=true]') && !s.getAttribute('aria-hidden') && !s.getAttribute('role') && !s.querySelector('title') && !s.getAttribute('aria-label')).length;
      const h1 = document.querySelectorAll('h1').length;
      const lang = document.documentElement.lang;
      const iframes = [...document.querySelectorAll('iframe')].map(f => f.title || '(no title)');
      return { unnamed: bad.slice(0, 8), unnamedCount: bad.length, imgNoAlt: imgs, svgUnlabelled: svgs, h1, lang, iframes };
    });
    step('A11Y ' + p + ': ' + JSON.stringify(r));
  }
  fs.writeFileSync('out/p4.log', log.join('\n'));
  await browser.close();
})();
