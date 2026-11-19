// Tests for src/assets/js/sim/personas.js (the seeded synthetic world) and figure.js (the
// little figures). Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis
// (instance C), 2026-11-18, round 3.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const S = await import('../src/assets/js/sim/store.js');
const C = await import('../src/assets/js/sim/clock.js');
const P = await import('../src/assets/js/sim/personas.js');
const F = await import('../src/assets/js/sim/figure.js');
const castJSON = JSON.parse(readFileSync(new URL('../src/assets/js/sim/cast.json', import.meta.url), 'utf8'));
const homes = JSON.parse(readFileSync(new URL('../src/data/homes.json', import.meta.url), 'utf8')).homes;
const cast = P.castFrom(castJSON);
// A stand-in for the real IPMA data on a few days (the page passes the live files' values).
const weatherFor = d => (d >= '2026-11-18' && d <= '2026-11-22' ? { rain_pct: d === '2026-11-19' ? 80 : 10 } : null);

function run30(seed) {
  const store = S.createStore({ storage: S.memoryStorage(), channel: null, homes, listenStorageEvents: false, realNow: () => '2026-11-18T18:00:00Z' });
  store.reset(seed);
  const clock = C.createClock({ store, timers: null });
  P.createWorld({ store, clock, cast, weatherFor }).attach();
  for (let i = 0; i < 30; i++) clock.advance(24 * 60); // 30 simulated days, one day at a time
  return store;
}

test('cast: the copy in sim/ names only invented people and every visitor has a profile', () => {
  const text = JSON.stringify(castJSON);
  assert.ok(!/Dinis|Cruz|@AgentiCCells/i.test(text), 'no real person named');
  assert.equal(cast.invented, true);
  for (const v of cast.visitors) assert.ok(P.PROFILES[v.id], v.id);
  assert.deepEqual(cast.admins.map(a => a.id), ['owner', 'housekeeper', 'bookkeeper']);
});

test('personas: step() is pure and deterministic for the same state and hour', () => {
  const store = S.createStore({ storage: S.memoryStorage(), channel: null, homes, listenStorageEvents: false });
  const st = store.reset('pure');
  const a = P.step(st, '2026-11-18T14:00', { cast }), b = P.step(st, '2026-11-18T14:00', { cast });
  assert.deepEqual(a, b);
  assert.equal(store.getState(), st, 'step does not touch the store');
});

test('personas: a fixed seed over 30 simulated days gives the same world, with bookings, stays, reviews, issues and refusals', () => {
  const a = run30('fixed-seed-42'), b = run30('fixed-seed-42');
  const strip = s => JSON.stringify(JSON.parse(s.exportJSON()).events);
  assert.equal(strip(a), strip(b), 'identical event logs');
  const st = a.getState();
  assert.equal(a.clock().now, '2026-12-18T09:00');
  const statuses = Object.values(st.bookings).map(x => x.status);
  assert.ok(st.stats.visits > 50, `visits ${st.stats.visits}`);
  assert.ok(st.stats.booked >= 5, `booked ${st.stats.booked}`);
  assert.ok(statuses.includes('checked-out'), 'some stays ended');
  assert.ok(st.reviews.length >= 3, 'reviews written');
  assert.ok(st.reviews.every(r => r.trusted === false && r.rating >= 1 && r.rating <= 5));
  assert.ok(Object.keys(st.stats.left).length >= 2, 'visitors leave for different reasons');
  assert.ok(st.policyLog.some(l => l.rule === 'N-untrusted-instruction'), 'injections refused');
  assert.ok(st.policyLog.every(l => ['allow', 'ask', 'deny'].includes(l.decision)));
  assert.ok(Object.values(st.cleaning).some(j => j.status === 'done'), 'the housekeeper cleaned');
  assert.ok(st.taxDrafts.some(t => t.period === '2026-11' && t.decision === 'ask'), 'the bookkeeper drafted November\'s tourist tax for a person to submit');
  assert.ok(st.ledger.some(l => l.kind === 'utilities') && st.ledger.some(l => l.kind === 'insurance'));
  const reg = Object.values(st.bookings).filter(x => x.registeredAt);
  assert.ok(reg.length >= 1, 'guest bulletins recorded (simulated)');
  // stock went down somewhere
  const init = S.initialStock;
  assert.ok(st.homeOrder.some(id => st.stock[id].welcome.qty !== init(st.homes[id]).welcome.qty || st.stock[id].cleaning.qty !== init(st.homes[id]).cleaning.qty));
  const other = run30('another-seed');
  assert.notEqual(strip(other), strip(a), 'a different seed gives a different world');
});

test('personas: weather from the real data shapes ratings; a missing forecast changes nothing', () => {
  const store = S.createStore({ storage: S.memoryStorage(), channel: null, homes, listenStorageEvents: false });
  let st = store.reset('weather', { settings: { background: false } });
  // a paid stay ending today, then the check-out step (11:00 at The Cape House) checks it out and reviews it
  const ev = [
    { type: 'guest.added', at: '2026-11-18T09:00', data: { guest: { id: 'g1', name: 'Rafa and Jo (invented)', country: 'PT' } } },
    { type: 'booking.created', at: '2026-11-18T09:00', data: { booking: { id: 'b1', homeId: 'cape', guestId: 'g1', from: '2026-11-18', to: '2026-11-21', guests: { adults: 2, children: [], total: 2 }, channel: 'direct', status: 'checked-in', persona: 'surf-couple', quote: { price: 400, guestPays: 400, touristTax: 0, vat: 22.64, commission: 0 } } } },
  ];
  store.dispatch(ev); st = store.getState();
  // Round 5: each home checks out at its own time; The Cape House's check-out is 11:00.
  const rainy = P.step(st, '2026-11-21T11:00', { cast, weatherFor: () => ({ rain_pct: 90 }) }).find(e => e.type === 'review.added');
  const none = P.step(st, '2026-11-21T11:00', { cast, weatherFor: () => null }).find(e => e.type === 'review.added');
  assert.ok(rainy && none);
  assert.ok(rainy.data.review.rating < none.data.review.rating || none.data.review.rating === 1);
  assert.match(rainy.data.review.text, /as IPMA had forecast/);
  assert.doesNotMatch(none.data.review.text, /IPMA/);
});

test('figure: valid SVG for every cast member, pose, mood and prop', () => {
  const balanced = svg => {
    const stack = [];
    for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
      if (m[3] === '/') continue;
      if (m[1] === '/') { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]);
    }
    return stack.length === 0;
  };
  const check = svg => {
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[-\d. ]+" width="[\d.]+" height="[\d.]+" role="img" aria-label="[^"]+"><title>/);
    assert.ok(svg.endsWith('</svg>'));
    assert.ok(balanced(svg), 'tags balance');
    assert.ok(!/NaN|undefined|<script|on[a-z]+=/i.test(svg));
  };
  for (const ch of [...castJSON.characters, ...castJSON.agents]) check(F.figureFor(ch, { mood: 'happy' }));
  const look = castJSON.characters[0].look;
  for (const pose of F.POSES) check(F.figure(look, { pose }));
  for (const mood of F.MOODS) check(F.figure(look, { mood }));
  for (const prop of F.PROPS) check(F.figure(look, { prop }));
  check(F.figure(look, { hat: 'sun', outfit: 'holiday', pose: 'wave', scale: 2, flip: true }));
  check(F.figure({ colour: '#0f766e' }, { kind: 'agent', mood: 'thinking' }));
  const evil = F.figure({ shirt: '"><script>alert(1)</script>', skin: 'url(javascript:x)' }, { label: '<b>x</b>' });
  check(evil);
  assert.ok(evil.includes('#2563eb'), 'unsafe colours fall back to defaults');
  assert.ok(evil.includes('&lt;b&gt;'), 'labels are escaped');
  assert.match(F.figure(look, { scale: 2 }), /width="140" height="264"/);
  assert.match(F.figure(look, { prop: 'laptop' }), /data-pose="hold"/);
});
