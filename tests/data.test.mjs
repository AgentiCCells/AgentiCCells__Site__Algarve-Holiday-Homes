// Tests for src/assets/js/data.js and src/assets/js/availability.js, against the small fixtures
// in tests/fixtures/ (cut from the live files, IPMA named; the events are invented). Run:
// node --test. With LIVE=1 one more test reads the live files from data.promptugal.news.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fx = n => JSON.parse(readFileSync(new URL(`./fixtures/${n}.sample.json`, import.meta.url), 'utf8'));
const FILES = {
  'ipma-city-forecasts/latest.json': fx('ipma-city-forecasts'), 'ipma-warnings/latest.json': fx('ipma-warnings'),
  'ipma-sea/latest.json': fx('ipma-sea'), 'ipma-uv/latest.json': fx('ipma-uv'), 'events-pt/latest.json': fx('events-pt'),
  'index.json': { sources: [{ id: 'events-pt', status: 'partly failed', cadence: 'every 6 hours' }, { id: 'ipma-sea', status: 'ok', cadence: 'hourly' }] },
};
const card = fx('card');
const calls = [];
const LIVE = process.env.LIVE === '1';
const realFetch = globalThis.fetch;
if (!LIVE) {
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || 'GET' });
    const key = String(url).replace('https://data.promptugal.news/api/v1/', '');
    if (key.endsWith('/card.json') && !key.startsWith('ipma-uv')) return new Response(JSON.stringify({ ...card, id: key.split('/')[0] }), { status: 200 });
    if (key === 'ipma-uv/card.json') return new Response('nope', { status: 404 });
    if (key === 'events-pt/latest.json' && globalThis.__brokenEvents) return new Response('{not json', { status: 200 });
    if (FILES[key]) return new Response(JSON.stringify(FILES[key]), { status: 200 });
    return new Response('missing', { status: 404 });
  };
}
const D = await import('../src/assets/js/data.js');
const A = await import('../src/assets/js/availability.js');

test('getSource reads latest and card, with read time, age and staleness', { skip: LIVE }, async () => {
  const r = await D.getSource('ipma-sea', { now: Date.parse('2026-11-18T17:00:00Z') });
  assert.equal(r.id, 'ipma-sea');
  assert.ok(r.latest.coasts.length >= 2);
  assert.equal(r.card.publisher, 'IPMA, Instituto Português do Mar e da Atmosfera');
  assert.match(r.read_at, /^2026-11-18T/);
  assert.equal(typeof r.age_min, 'number');
  assert.equal(r.stale, false);
  assert.equal(r.error, null);
  assert.ok(calls.every(c => c.method === 'GET'), 'only GETs');
});

test('staleness follows the cadence: hourly 2 h, every 6 hours 12 h', () => {
  assert.equal(D.staleAfterMin('hourly'), 120);
  assert.equal(D.staleAfterMin('every 6 hours'), 720);
  assert.equal(D.staleAfterMin('daily'), 2880);
});

test('a missing file is an error, never a value; a missing card still gives a line', { skip: LIVE }, async () => {
  const r = await D.getSource('no-such-source');
  assert.equal(r.latest, null);
  assert.match(r.error, /HTTP 404/);
  const line = D.sourceLine(r);
  assert.match(line, /Could not read it just now/);
  const uv = await D.getSource('ipma-uv');
  assert.equal(uv.card, null);
  assert.match(D.sourceLine(uv), /source card could not be read/);
});

test('sourceLine names publisher, id, read time, terms and links the card; stale says so', { skip: LIVE }, async () => {
  const r = await D.getSource('ipma-city-forecasts', { now: Date.parse('2026-11-18T16:20:00Z') });
  const line = D.sourceLine(r, { issued: '2026-11-18T15:31:02' });
  assert.match(line, /IPMA, Instituto Português do Mar e da Atmosfera/);
  assert.match(line, /ipma-city-forecasts/);
  assert.match(line, /Read 16:11 UTC, 8 min ago/);
  assert.match(line, /IPMA issued 15:31/);
  assert.match(line, /Terms: IPMA: free to copy/);
  assert.match(line, /card\.json/);
  const stale = D.sourceLine({ ...r, stale: true, age_min: 300 });
  assert.match(stale, /This may be out of date/);
  assert.match(stale, /5 hours ago/);
});

test('forecastFor: days in range with words, and the dates IPMA does not cover yet', { skip: LIVE }, async () => {
  const f = await D.forecastFor(1080500, '2026-11-19', '2026-11-22', { now: '2026-11-18' });
  assert.equal(f.place.name, 'Faro');
  assert.deepEqual(f.days.map(d => d.date), ['2026-11-19']);
  const d = f.days[0];
  assert.ok(['tmin', 'tmax', 'rain_pct', 'weather', 'wind'].every(k => k in d));
  assert.equal(typeof d.weather, 'string');
  assert.deepEqual(f.beyond, ['2026-11-20', '2026-11-21', '2026-11-22']);
  const none = await D.forecastFor(999, '2026-11-19', '2026-11-20');
  assert.equal(none.place, null);
  assert.deepEqual(none.days, []);
  assert.equal(D.weatherWords(10), 'light rain');
});

test('warningsFor: FAR only, yellow and above, overlapping the dates', { skip: LIVE }, async () => {
  const w = await D.warningsFor('FAR', '2026-11-19', '2026-11-25');
  assert.equal(w.items.length, 1);
  assert.deepEqual(Object.keys(w.items[0]).filter(k => ['level', 'type', 'start', 'end', 'text'].includes(k)).sort(), ['end', 'level', 'start', 'text', 'type']);
  assert.equal(w.items[0].level, 'yellow');
  const later = await D.warningsFor('FAR', '2026-11-21', '2026-11-25');
  assert.equal(later.items.length, 0);
  assert.equal(later.furthest, '2026-11-20');
});

test('seaFor and uvFor: days for the place; UV ignores id 0 and keeps the higher duplicate', { skip: LIVE }, async () => {
  const s = await D.seaFor(1081526);
  assert.equal(s.place.name, 'Sagres, costa');
  assert.ok(s.days.length >= 1 && 'temp_max' in s.days[0] && 'waves_max' in s.days[0]);
  const u = await D.uvFor(1080500);
  const d19 = u.days.find(d => d.date === '2026-11-19');
  assert.equal(d19.index, 4.2);
  assert.equal(d19.band, 'moderate');
  assert.equal((await D.uvFor(0)).days.length, 0);
  assert.equal(D.uvBand(11), 'extreme');
});

test('eventsFor: overlapping events, source name, "all through" flag; status from the catalogue', { skip: LIVE }, async () => {
  const e = await D.eventsFor('lagos', '2026-11-20', '2026-11-25');
  assert.equal(e.items.length, 1);
  assert.equal(e.items[0].through, true);
  assert.equal(e.items[0].source_name, 'test');
  const t = await D.eventsFor('tavira', '2026-11-20', '2026-11-22');
  assert.equal(t.items[0].name, 'Invented concert (test)');
  assert.equal(t.items[0].through, false);
  assert.ok(['name', 'start', 'end', 'venue', 'url', 'source_name'].every(k => k in t.items[0]));
  assert.equal((await D.eventsFor('faro', '2026-11-20', '2026-11-22')).items.length, 0);
  assert.equal(e.res.status, 'partly failed');
  assert.match(D.sourceLine(e.res), /partly failed/);
});

test('bad JSON is reported as such, and forget() lets the page try again', { skip: LIVE }, async () => {
  D.forget('events-pt');
  globalThis.__brokenEvents = true;
  const bad = await D.getSource('events-pt');
  assert.match(bad.error, /not valid JSON/);
  globalThis.__brokenEvents = false;
  D.forget('events-pt');
  const good = await D.getSource('events-pt');
  assert.equal(good.error, null);
});

test('stayDates and setStayDates use the address and this tab only', () => {
  const store = new Map();
  globalThis.location = { href: 'https://x.test/homes/salt/?from=2026-11-20&to=2026-11-25&guests=3', search: '?from=2026-11-20&to=2026-11-25&guests=3' };
  globalThis.history = { state: null, replaceState(_, __, u) { const url = new URL(u, 'https://x.test'); globalThis.location = { href: url.href, search: url.search }; } };
  globalThis.sessionStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  assert.deepEqual(D.stayDates(), { from: '2026-11-20', to: '2026-11-25', guests: 3 });
  D.setStayDates('2026-12-01', '2026-12-04', 2);
  assert.equal(globalThis.location.search, '?guests=2&from=2026-12-01&to=2026-12-04');
  globalThis.location = { href: 'https://x.test/', search: '' };
  assert.deepEqual(D.stayDates(), { from: '2026-12-01', to: '2026-12-04', guests: 2 });
  D.setStayDates(null, null);
  assert.deepEqual(D.stayDates(), { from: null, to: null, guests: null });
  globalThis.location = { href: 'https://x.test/?from=2026-12-05&to=2026-12-01', search: '?from=2026-12-05&to=2026-12-01' };
  assert.deepEqual(D.stayDates().from, null, 'leave before arrive is ignored');
  delete globalThis.location; delete globalThis.history; delete globalThis.sessionStorage;
});

test('availability: same home and day, same calendar; runs of 2 to 7 taken nights', () => {
  const a = A.takenNights('salt', '2026-11-18'), b = A.takenNights('salt', '2026-11-18');
  assert.equal(a, b);
  assert.notDeepEqual([...a], [...A.takenNights('lagoon', '2026-11-18')]);
  assert.ok(a.size > 50 && a.size < 300);
  assert.ok(!a.has('2026-11-18'), 'today starts with a free gap');
  const days = [...a].sort();
  let run = 1;
  for (let i = 1; i <= days.length; i++) {
    const next = i < days.length && Date.parse(days[i]) - Date.parse(days[i - 1]) === 86400000;
    if (next) run++; else { if (i < days.length - 1) assert.ok(run >= 2 && run <= 7, `run ${run}`); run = 1; }
  }
  const t = days[0], next = d => new Date(Date.parse(`${d}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
  assert.equal(A.isFree('salt', t, next(t), '2026-11-18'), false, 'a taken night');
  assert.equal(A.isFree('salt', '2026-11-18', next('2026-11-18'), '2026-11-18'), true, 'today is free');
  assert.equal(A.isFree('salt', '2026-11-17', '2026-11-18', '2026-11-18'), false, 'past');
  assert.equal(A.nights('2026-11-20', '2026-11-25'), 5);
  assert.equal(A.price(85, '2026-11-20', '2026-11-25'), 425);
});

test('live files: every function returns the documented shape', { skip: !LIVE, timeout: 60000 }, async () => {
  globalThis.fetch = realFetch;
  const t = D.today(), to = D.addDays(t, 4);
  const f = await D.forecastFor(1080500, t, to);
  assert.equal(f.res.error, null); assert.ok(f.days.length >= 1); assert.equal(f.res.card.publisher.startsWith('IPMA'), true);
  const w = await D.warningsFor('FAR', t, to); assert.equal(w.res.error, null); assert.ok(Array.isArray(w.items));
  const s = await D.seaFor(1080526); assert.ok(s.days.length >= 1);
  const u = await D.uvFor(1081525); assert.ok(u.days.length >= 1);
  const e = await D.eventsFor('lagos', t, D.addDays(t, 14)); assert.equal(e.res.error, null); assert.ok(Array.isArray(e.items));
  for (const r of [f.res, w.res, s.res, u.res, e.res]) { assert.equal(typeof r.age_min, 'number'); assert.equal(typeof r.stale, 'boolean'); console.log(r.id, r.read_at, `${r.age_min} min`, r.stale ? 'stale' : 'fresh', r.status); }
  console.log('forecast', f.place.name, f.days.map(d => `${d.date} ${d.tmin}-${d.tmax} ${d.weather}`).join('; '));
  console.log('warnings FAR', w.items.map(i => `${i.level} ${i.type}`).join('; ') || 'none');
  console.log('events lagos next 14 days', e.items.length);
});
