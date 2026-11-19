// Tests for round 5 (team/rounds/5/design/PROPOSAL.md, passed for build; team/rounds/5.md answers 1 to 7;
// round 4's open items in team/rounds/4/review/RECHECK.md and BUILD.md) that need no browser: the token
// refactor and the theme rules, the boot script, the pins, the assistants' names, same-day check-ins,
// each home's own check-out time, step 6's words, the typed-rate redraw, and a score whose occupancy part
// separates runs. The browser checks are in admin-designs.test.mjs and ledger-unchanged.test.mjs.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 5. Code Apache-2.0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const R = new URL('../src/assets/js/', import.meta.url);
const S = await import(new URL('sim/store.js', R));
const C = await import(new URL('sim/clock.js', R));
const B = await import(new URL('sim/booking.js', R));
const P = await import(new URL('sim/personas.js', R));
const Sc = await import(new URL('sim/score.js', R));
const U = await import(new URL('admin/util.js', R));
const CH = await import(new URL('modes/chrome.js', R));
const { createGuard } = await import(new URL('sim/abp.js', R));
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const homes = JSON.parse(read('src/data/homes.json')).homes;
const cast = P.castFrom(JSON.parse(read('src/assets/js/sim/cast.json')));
const THEMES = ['revista', 'azulejo', 'linho', 'costa', 'postal'];
const sim = (seed = 'r5', now) => { const store = S.createStore({ storage: S.memoryStorage(), channel: null, homes, listenStorageEvents: false }); store.reset(seed, now ? { now } : {}); const clock = C.createClock({ store, timers: null }); const guard = createGuard({ store }); return { store, clock, guard, booking: B.createBooking({ store, guard }) }; };

test('2.2, 2.8: every colour in an admin.css rule is a token; Ledger\'s needs-action colour is its ink (answer 6)', () => {
  const css = read('src/assets/admin.css');
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !/^(:root|@media \(prefers-color-scheme:dark\)\{:root|--)/.test(l.trim()));
  const lit = rules.flatMap(l => l.match(/#[0-9A-Fa-f]{3,8}\b/g) || []);
  assert.deepEqual(lit, [], 'no colour literal outside the token definitions');
  assert.match(css, /--a-hot:var\(--a-ink\);--a-hot-ink:var\(--a-surface\);--a-hot-edge:var\(--a-ink\)/);
  assert.match(css, /--a-danger-ink:#FBE1DE/, 'the dark danger button text (answer 6)');
  assert.match(css, /\.btn-s\.danger\{border-color:var\(--m-deny-edge\);color:var\(--a-danger-ink\)\}/);
});

test('2.3, 2.7: the five theme files set only design tokens, keep meaning colours and labels, and load nothing from elsewhere', () => {
  for (const t of THEMES) {
    const css = read(`src/assets/admin-themes/${t}.css`);
    assert.match(css, new RegExp(`--a-theme-ok:${t}`), `${t}: the sentinel`);
    assert.doesNotMatch(css, /--m-[a-z-]+\s*:/, `${t}: no meaning token set`);
    assert.doesNotMatch(css, /--a-(wbg|wink|ok|ok-ink)\s*:/, `${t}: warn and ok chips unchanged`);
    assert.doesNotMatch(css, /\.(k|d|sure|src|note-box|res|whose|untr-q|disclaimer|band|adm-who|srcn)\b[^{]*\{[^}]*(display:\s*none|visibility:\s*hidden)/, `${t}: no label hidden`);
    assert.doesNotMatch(css, /font-size:\s*(?:[0-9](?:\.\d+)?px|1[01](?:\.\d+)?px|0?\.[0-6]\d*rem|0?\.7[0-4]\d*rem)/, `${t}: nothing under 12 px`);
    assert.doesNotMatch(css, /url\((?!["']?data:)/, `${t}: only data: images`);
    assert.doesNotMatch(css, /@import|@font-face|position:\s*fixed|animation/, `${t}: no imports, fonts, fixed layers or animation`);
    assert.match(read('src/admin/index.html'), new RegExp(`/assets/admin-themes/${t}\\.css`));
    assert.doesNotMatch(css, /content:\s*"[^"]+"/, `${t}: no text in pseudo-elements`);
  }
  assert.match(read('src/assets/admin-themes/costa.css'), /content:attr\(data-pin\) \/ "";/, 'the pin number is not read aloud');
});

test('2.4: the boot script: ?design for this view only, a stored choice, unknown values removed, light only in an embedded frame', () => {
  const code = read('src/assets/js/admin/design-boot.js');
  const run = (search, stored) => {
    const store = new Map(stored ? [['cc.admin.design.v1', stored]] : []);
    const attrs = {};
    vm.runInNewContext(code, { location: { search }, URLSearchParams, localStorage: { getItem: k => store.get(k) ?? null, removeItem: k => store.delete(k), setItem: (k, v) => store.set(k, v) }, document: { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } } });
    return { attrs, stored: store.get('cc.admin.design.v1') ?? null };
  };
  assert.deepEqual(run('', null).attrs, { 'data-design': 'ledger' });
  assert.deepEqual(run('?design=costa', null), { attrs: { 'data-design': 'costa' }, stored: null }, 'not stored');
  assert.deepEqual(run('', 'linho').attrs, { 'data-design': 'linho' });
  assert.deepEqual(run('', 'nonsense'), { attrs: { 'data-design': 'ledger' }, stored: null }, 'an unknown value is removed');
  assert.deepEqual(run('?embed&design=revista&theme=light', null).attrs, { 'data-design': 'revista', 'data-theme': 'light' });
  assert.deepEqual(run('?design=revista&theme=light', null).attrs, { 'data-design': 'revista' }, 'theme only with embed');
  const blocked = vm.runInNewContext(`${code};1`, { location: { search: '' }, URLSearchParams, get localStorage() { throw new Error('blocked'); }, document: { documentElement: { setAttribute() {} } } });
  assert.equal(blocked, 1, 'storage blocked: no error');
  assert.ok(CH.KEPT_KEYS.includes('cc.admin.design.v1'), 'Reset clears it (answer 4)');
  assert.match(CH.RESET_WORDS, /your admin design/);
});

test('2.7, 4: the pins, and the assistants as /agents/ names them', () => {
  const X = sim();
  const g = U.occupancyGrid(X.store.getState(), ['salt', 'lagoon', 'hill', 'harbour', 'cape'], '2026-11-18', 7, { now: X.clock.now() });
  for (const [id, n] of Object.entries(U.PIN)) assert.match(g, new RegExp(`data-pin="${n}"[^>]*>${X.store.getState().homes[id].name}<`), `${id} pin ${n}, name written beside it`);
  assert.equal(CH.ACTOR_NAMES['host-assistant'], 'Claude, the host\'s assistant (simulated)');
  assert.equal(CH.ACTOR_NAMES['guest-assistant'], 'Claude, the guest\'s assistant (simulated)');
  assert.equal(CH.ACTOR_NAMES.visitor, 'visitor', 'the guest is a person, kept apart');
  assert.match(read('src/assets/js/play/play.js'), /"host-assistant": "Claude, the host's assistant \(simulated\)"/);
});

test('round 4 RECHECK.md items 2 and 3: same-day bookings check in after the hour; each home checks out at its own time', () => {
  const X = sim('r5-ci', '2026-11-19T08:00');
  P.createWorld({ store: X.store, clock: X.clock, cast: { ...cast, visitors: [] } }).attach();
  X.clock.setTime('2026-11-19T17:10');
  const late = X.booking.book({ homeId: 'salt', from: '2026-11-19', to: '2026-11-21', guests: 2, guest: { name: 'A (invented)' } });
  assert.equal(late.ok, true, late.error);
  const lag = X.booking.book({ homeId: 'lagoon', from: '2026-11-19', to: '2026-11-21', guests: 2, guest: { name: 'B (invented)' } });
  assert.equal(lag.ok, true, lag.error);
  X.clock.setTime('2026-11-19T18:00');
  const st = X.store.getState();
  assert.equal(st.bookings[late.booking.id].status, 'checked-in', 'made at 17:10, after Salt\'s 16:00: checked in at 18:00');
  assert.equal(st.bookings[lag.booking.id].status, 'checked-in');
  X.clock.setTime('2026-11-21T10:30');
  assert.equal(X.store.getState().bookings[late.booking.id].status, 'checked-out', 'Salt checks out at 10:00');
  assert.equal(X.store.getState().bookings[lag.booking.id].status, 'checked-in', 'Lagoon not before 11:00');
  X.clock.setTime('2026-11-21T11:30');
  const out = X.store.getState().bookings[lag.booking.id];
  assert.equal(out.status, 'checked-out');
  assert.equal(out.history.find(h => h.status === 'checked-out').at, '2026-11-21T11:00');
  const admin = read('src/assets/js/admin/admin.js');
  assert.doesNotMatch(admin, /T16:00|T10:00/, 'no fixed check-in or check-out time in the admin');
  assert.doesNotMatch(read('src/assets/js/sim/personas.js'), /hour === (10|16)\)/);
});

test('round 4 RECHECK.md items 1 and 4: the typed rate redraws on focusout; step 6\'s words with data blocked', () => {
  assert.match(read('src/assets/js/world/world.js'), /\$\('rates'\)\.addEventListener\('focusout', \(\) => setTimeout\(\(\) => renderRates\(store\.getState\(\)\), 0\)\)/);
  const tour = read('src/assets/js/play/tour.js');
  assert.match(tour, /IPMA has no forecast for these days on this page, and the page says why; nothing is invented\./);
  assert.doesNotMatch(tour, /no forecast for these days yet/);
});

test('round 4 BUILD.md: the score\'s occupancy part is not nearly always full: full marks at 80%, and runs differ', () => {
  assert.equal(Sc.FULL.occupancy, 0.8);
  assert.match(Sc.FORMULA, /up to 80% \(full marks\)/);
  const pts = [];
  for (const seed of ['cc-1', 'cc-5', 'cc-7']) {
    const X = sim(seed);
    X.store.dispatch({ type: 'setting.set', data: { key: 'backgroundKeep', value: Sc.LEVELS[Sc.levelOfSeed(seed)].keep } });
    P.createWorld({ store: X.store, clock: X.clock, cast }).attach();
    for (let i = 0; i < 44; i++) X.clock.advance(1440);
    const s = Sc.score(X.store.getState(), { today: X.clock.today() });
    assert.ok(s.parts.occupancy.value > 0.4 && s.parts.occupancy.value < 0.8, `${seed}: ${s.parts.occupancy.value}`);
    pts.push(Math.round(s.parts.occupancy.points));
    assert.equal(Object.values(X.store.getState().bookings).filter(b => b.status === 'paid' && b.from < X.clock.today()).length, 0, `${seed}: no stay left "paid" in the past`);
  }
  assert.ok(pts.every(p => p < 35), `occupancy points ${pts.join(', ')}: none full`);
  assert.ok(new Set(pts).size >= 2, `occupancy points ${pts.join(', ')}: they separate runs`);
});
