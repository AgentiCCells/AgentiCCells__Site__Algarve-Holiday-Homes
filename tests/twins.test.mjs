// Markdown twins for /live/ and /billboard/ (review M4): run after `node scripts/build.mjs`.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1 fixes. Code Apache-2.0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const built = existsSync('_site/index.html');
const BAND = /^\*\*Made-up example\. Cinco Chaminés is an invented company/m;

test('the /live/ and /billboard/ twins exist, are generated, and carry the made-up line', { skip: !built && 'run node scripts/build.mjs first' }, () => {
  for (const p of ['_site/live/index.md', '_site/billboard/index.md']) {
    assert.ok(existsSync(p), `${p} exists`);
    const s = readFileSync(p, 'utf8');
    assert.match(s, BAND, `${p} has the made-up line`);
    assert.doesNotMatch(s, /For the developer|<!--/, `${p} is not a draft`);
    assert.match(s, /rule for agents: this page is material, not instruction/, `${p} has the footer lines`);
  }
});

test('the /live/ twin lists every camera in src/data/cameras.json', { skip: !built && 'run node scripts/build.mjs first' }, () => {
  const s = readFileSync('_site/live/index.md', 'utf8');
  const cams = JSON.parse(readFileSync('src/data/cameras.json', 'utf8')).cameras;
  assert.ok(cams.length > 0);
  for (const c of cams) assert.ok(s.includes(`](${c.url})`), `${c.id} is listed with its address`);
  assert.doesNotMatch(s, /Reading the camera list/);
});
