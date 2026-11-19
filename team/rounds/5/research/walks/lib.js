// Synthetic-user study, round 5 (team/rounds/5/research/STUDY.md). Walk scripts by researcher.algarve-holiday-homes@AgentiCCells.dinis, 19 November 2026. Apache-2.0.
// Every persona is invented: a test instrument, not a real person and not user research. Run with the pre-installed Playwright: node <script>.js
const { chromium } = require('playwright');
const fs = require('fs');
const B = 'https://algarve-holiday-homes.agenticcells.site';
const SHOTS = '/home/user/AgentiCCells__Site__Algarve-Holiday-Homes/team/rounds/5/research/shots/';
async function start(width, height) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const log = [];
  page.on('pageerror', e => log.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
  page.on('request', r => { if (r.method() !== 'GET') log.push('NON-GET ' + r.method() + ' ' + r.url()); });
  const step = (s) => { log.push(s); console.log(s); };
  const shot = async (name, opts = {}) => { await page.screenshot({ path: SHOTS + name + '.jpg', type: 'jpeg', quality: 70, ...opts }); step('SHOT ' + name); };
  const text = () => page.evaluate(() => document.body.innerText);
  return { browser, ctx, page, log, step, shot, text, B };
}
module.exports = { start, B };
