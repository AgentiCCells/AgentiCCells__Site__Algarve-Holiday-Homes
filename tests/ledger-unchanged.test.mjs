// The default admin (Ledger) is unchanged by the round 5 designs (team/rounds/5/design/PROPOSAL.md 2.9,
// review must 5): with no data-design, after "Load example activity (simulated)", the computed colours of
// every element in the 13 sections at 390 and 1366 px, light and dark, equal the recorded fixture, and so
// do the full-page screenshots when this is the Chromium and platform they were recorded on. A fixture
// changes only in a recorded step with its reason (tests/ledger-record.mjs; the history in each fixture
// and team/rounds/5/build/NOTES.md). Skips with the reason when Playwright or the built site is missing.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 5.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKIP, playwright, VIEWS } from './browser.mjs';

const fx = n => JSON.parse(readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8'));

test('Ledger unchanged: colours of every element in 52 views, and the screenshots on the recorded Chromium', { skip: SKIP, timeout: 300000 }, async t => {
  const colours = fx('ledger-colours.json'), shots = fx('ledger-shots.json');
  const { chromium } = playwright;
  const b = await chromium.launch(); const version = b.version(); await b.close();
  const sameEngine = version === shots.chromium && `${process.platform}-${process.arch}` === shots.platform;
  const { measure } = await import('./ledger-record.mjs');
  const m = await measure({ shots: sameEngine });
  const keys = Object.keys(colours.views);
  assert.equal(keys.length, 52, '13 sections x 2 widths x 2 modes');
  const diff = keys.filter(k => m.colours[k]?.sha256 !== colours.views[k].sha256);
  assert.deepEqual(diff, [], `colour differences in: ${diff.join(', ')}`);
  if (!sameEngine) { t.diagnostic(`screenshots not compared: recorded on Chromium ${shots.chromium} ${shots.platform}, this is ${version} ${process.platform}-${process.arch}`); return; }
  let sd = Object.keys(shots.views).filter(k => m.shots[k] !== shots.views[k]);
  // Under the parallel test run Chromium sometimes rasterises the clock pill's text with different sub-pixel
  // anti-aliasing (measured in the round 5 study pass: 987 bytes in one 15 px band, the same text). A real change
  // shows on every capture, so a view that differs is captured once more, alone, and must then match exactly.
  if (sd.length) {
    t.diagnostic(`screenshots re-taken once: ${sd.join(', ')}`);
    const again = [];
    for (const k of sd) {
      const [sec, key] = k.split('|');
      const v = VIEWS().find(x => x.key === key);
      const r = await measure({ views: [v], sections: [sec], shots: true });
      if (r.shots[k] !== shots.views[k]) again.push(k);
    }
    sd = again;
  }
  assert.deepEqual(sd, [], `screenshot differences in: ${sd.join(', ')}`);
});
