// The browser walks of the round 5 study's findings 1, 5 and 7 (team/rounds/5/research/STUDY.md); finding 4's
// width sweep is in admin-designs.test.mjs. Outside requests are blocked (tests/browser.mjs), so the live
// blocks show their "could not be read" states; nothing is sent. Skips with the reason without Playwright.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 5. Code Apache-2.0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKIP, playwright, serve, context, overflow } from './browser.mjs';

const movedLine = page => page.evaluate(() => { const e = document.querySelector('.sim-moved'); return e && !e.hidden ? e.textContent.replace(/\s+/g, ' ').trim() : ''; });

test('finding 1: after a Very fast World run, the visitor pages say so, and "Go back to the first day" makes booking possible again', { skip: SKIP, timeout: 300000 }, async () => {
  const srv = await serve(); const browser = await playwright.chromium.launch();
  try {
    for (const width of [390, 1366]) {
      const ctx = await context(browser, { width }); const page = await ctx.newPage();
      await page.goto(`${srv.base}/`, { waitUntil: 'load' });
      await page.waitForSelector('.mode-tools .clock');
      assert.equal(await movedLine(page), '', 'a fresh simulation: no line');
      await page.goto(`${srv.base}/world/`, { waitUntil: 'load' });
      await page.click('button[data-speed="vf"]');
      await page.waitForFunction(() => /31 Dec 2026/.test(document.querySelector('.clock-t')?.textContent || ''), null, { timeout: 120000 });
      for (const p of ['/', '/homes/', '/homes/salt/', '/stay/']) {
        await page.goto(`${srv.base}${p}`, { waitUntil: 'load' });
        await page.waitForSelector('.sim-moved:not([hidden])', { timeout: 10000 });
        const t = await movedLine(page);
        assert.match(t, /This browser's simulation was moved on, in World, the admin or the side-by-side page/, `${p} ${width}`);
        assert.match(t, /the last day with real data, so no stay can be booked now/, `${p} ${width}`);
        assert.match(t, /Go back to the first day/); assert.match(t, /Reset/);
        assert.ok((await overflow(page)) <= 0, `${p} ${width}: no sideways scroll`);
      }
      await page.goto(`${srv.base}/homes/salt/`, { waitUntil: 'load' });
      await page.waitForSelector('.sim-moved:not([hidden])');
      await page.click('.sim-moved [data-moved="first"]');
      await page.waitForFunction(() => document.querySelector('.sim-moved')?.hidden === true, null, { timeout: 10000 });
      assert.match(await page.textContent('.clock-t'), /2026, 09:00/);
      await page.waitForSelector('.cal button[data-day]:not([aria-disabled="true"])', { timeout: 10000 });
      assert.ok(await page.locator('.cal button[data-day]:not([aria-disabled="true"])').count() > 0, 'days can be picked again');
      await ctx.close();
    }
  } finally { await browser.close(); await srv.close(); }
});

test('finding 5: picking the leave day announces the price line first; the data blocks are not live regions', { skip: SKIP, timeout: 120000 }, async () => {
  const srv = await serve(); const browser = await playwright.chromium.launch();
  try {
    const ctx = await context(browser, { width: 1366 }); const page = await ctx.newPage();
    await page.goto(`${srv.base}/homes/salt/`, { waitUntil: 'load' });
    await page.waitForSelector('.cal button[data-day]:not([aria-disabled="true"])');
    assert.equal(await page.evaluate(() => document.querySelectorAll('.blk[aria-live], .blk [role="status"], .blk [role="alert"]').length), 0);
    await page.evaluate(() => {
      window.__said = [];
      const rec = () => { for (const e of document.querySelectorAll('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]')) { const t = e.textContent.trim(); if (t && e.__last !== t) { e.__last = t; window.__said.push(t); } } };
      new MutationObserver(rec).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    const days = await page.$$eval('.cal button[data-day]:not([aria-disabled="true"])', b => b.map(x => x.dataset.day));
    const plus2 = d => new Date(Date.parse(`${d}T12:00:00Z`) + 2 * 86400000).toISOString().slice(0, 10);
    const from = days.find(d => days.includes(plus2(d))), to = plus2(from); // two nights: the minimum stay of every home
    await page.click(`.cal button[data-day="${from}"]`);
    await page.click(`.cal button[data-day="${to}"]`);
    await page.waitForTimeout(2500);
    const said = await page.evaluate(() => window.__said);
    const priceAt = said.findIndex(t => /^Leave .*EUR \d+ in all/.test(t));
    assert.ok(priceAt >= 0, `the price line is announced: ${JSON.stringify(said)}`);
    const before = said.slice(0, priceAt).join(' ').length;
    assert.ok(before < 300, `at most a short line before the price (${before} characters): ${JSON.stringify(said.slice(0, priceAt))}`);
    assert.ok(said.some(t => /Weather, sea, UV and events below are now for your dates/.test(t)), 'one short line for the data');
    assert.ok(said.join(' ').length < 900, `no data block read out (${said.join(' ').length} characters)`);
    await ctx.close();
  } finally { await browser.close(); await srv.close(); }
});

test('finding 7: About this demo says what it is to a house owner, on screen at 390 and 1366', { skip: SKIP, timeout: 120000 }, async () => {
  const srv = await serve(); const browser = await playwright.chromium.launch();
  try {
    for (const width of [390, 1366]) for (const p of ['/', '/admin/']) {
      const ctx = await context(browser, { width }); const page = await ctx.newPage();
      await page.goto(`${srv.base}${p}`, { waitUntil: 'load' });
      await page.click('.mode-tools .about');
      await page.waitForSelector('#about-panel:not([hidden]) #about-owner');
      const r = await page.evaluate(() => { const h = document.getElementById('about-owner'); const para = h.nextElementSibling; para.scrollIntoView({ block: 'nearest' }); const b = para.getBoundingClientRect(); return { text: para.textContent, visible: b.width > 0 && b.height > 0, left: b.left, right: b.right, vw: innerWidth }; });
      assert.match(r.text, /This is a demonstration, not a service\./);
      assert.ok(r.visible && r.left >= 0 && r.right <= r.vw, `${p} ${width}: the paragraph is on screen`);
      assert.ok((await overflow(page)) <= 0, `${p} ${width}: no sideways scroll`);
      await ctx.close();
    }
  } finally { await browser.close(); await srv.close(); }
});
