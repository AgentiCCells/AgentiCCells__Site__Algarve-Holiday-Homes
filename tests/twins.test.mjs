// Markdown twins for /live/ and /d/ (review M4), and the round 2 changes: run after `node scripts/build.mjs`.
// Round 2: /billboard/ is gone (team/rounds/2.md, decision 1); the public pages name no person (decision 5).
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1 fixes. Code Apache-2.0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const built = existsSync('_site/index.html');
const BAND = /^\*\*Made-up example\. Cinco Chaminés is an invented company/m;

test('the /live/ and /d/ twins exist, are generated, and carry the made-up line', { skip: !built && 'run node scripts/build.mjs first' }, () => {
  for (const p of ['_site/live/index.md', '_site/d/index.md']) {
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

test('round 2: no billboard page, link or nav item is left on the site', { skip: !built && 'run node scripts/build.mjs first' }, () => {
  assert.ok(!existsSync('_site/billboard'), '_site/billboard/ is gone');
  assert.ok(!existsSync('_site/assets/share/billboard.png'), 'the billboard share card is gone');
  for (const f of ['_site/index.html', '_site/llms.txt', '_site/homes/salt/index.html']) assert.doesNotMatch(readFileSync(f, 'utf8'), /\/billboard\//, `${f} has no /billboard/ link`);
});

test('round 2: the footer and the public pages outside behind the scenes do not name Dinis Cruz', { skip: !built && 'run node scripts/build.mjs first' }, () => {
  for (const f of ['_site/index.html', '_site/homes/salt/index.html', '_site/agent/index.html', '_site/live/index.html', '_site/d/index.html', '_site/llms.txt', '_site/assets/js/agent-script.js']) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /Dinis/, `${f} names no person`);
  }
});

test('round 2: every home picture has alt text, width, height and an AI-generated caption', { skip: !built && 'run node scripts/build.mjs first' }, () => {
  for (const id of ['salt', 'lagoon', 'hill', 'harbour', 'cape']) {
    const s = readFileSync(`_site/homes/${id}/index.html`, 'utf8');
    const imgs = [...s.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
    assert.equal(imgs.length, 3, `${id}: three pictures`);
    for (const i of imgs) {
      assert.match(i, /alt="AI-generated/, `${id}: alt starts with AI-generated`);
      assert.match(i, /width="\d+" height="\d+"/, `${id}: width and height set`);
      assert.match(i, /srcset="[^"]+800w, [^"]+1264w"/, `${id}: srcset`);
    }
    assert.equal((s.match(/<figcaption>[^<]*AI-generated/g) || []).length, 3, `${id}: three AI-generated captions`);
  }
  const home = readFileSync('_site/index.html', 'utf8');
  for (const i of [...home.matchAll(/<img\b[^>]*>/g)].map(m => m[0])) assert.match(i, /alt="AI-generated[^"]*" loading="lazy"|fetchpriority="high"/, 'home page: lazy below the fold, the hero alone eager');
});
