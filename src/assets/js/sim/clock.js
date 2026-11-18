// sim/clock.js: the simulated "now" of the Cinco Chaminés simulation (a made-up example).
// The time is kept in the store's document (doc.clock, not in the event log), so every tab and
// iframe shares one clock. It moves on a slider and can play: speed is simulated seconds per
// real second (1 = real time, 3600 = an hour a second, 86400 = a day a second, SPEEDS.superFast
// = a week a second).
// It is bounded by the real-data window (team/rounds/2/research/REAL-DATES.md): weather as IPMA
// issued it (the vault copy of 17 November 2026, 19:29 UTC, covering 17 to 21 November, plus
// the live file: today to today + 4) and events (18 November to 31 December 2026). The bounds
// are computed at run time from the live files' dates where they can be read, with the
// researched constants as the fallback. A day without a real forecast says so; nothing is
// invented. Reads only data.promptugal.news (through data.js); sends nothing.
// Code Apache-2.0. Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance C),
// 2026-11-18, round 3.

import { addMinutes, toMs, fromMs, dayOf, addDays, isDay } from './util.js';

export const SPEEDS = Object.freeze({ paused: 0, real: 1, minute: 60, hour: 3600, day: 86400, superFast: 7 * 86400 });
export const TICK_MS = 200;
// Researched constants (REAL-DATES.md, read 18 November 2026, 17:25 UTC).
export const FALLBACK = Object.freeze({
  weather: [
    { from: '2026-11-17', to: '2026-11-21', how: 'IPMA forecast as issued on 17 November 2026, 19:29 UTC (vault copy)', kind: 'vault' },
    { from: '2026-11-18', to: '2026-11-22', how: 'IPMA forecast as issued, live file read 18 November 2026', kind: 'live' },
  ],
  sea: [{ from: '2026-11-17', to: '2026-11-20', how: 'IPMA sea forecast (today plus two)', kind: 'live' }],
  events: { from: '2026-11-18', to: '2026-12-31', how: 'events-pt agendas via data.promptugal.news' },
});

// computeBounds({ forecast, sea, events, archive }) -> bounds. Each argument is a parsed live file
// (or null); archive is the vault ranges list (default: the 17 November copy). Pure.
export function computeBounds({ forecast = null, sea = null, events = null, archive = [FALLBACK.weather[0]] } = {}) {
  const live = { weather: false, sea: false, events: false };
  const weather = [...archive];
  const fDays = (forecast?.cities || []).flatMap(c => (c.days || []).map(d => d.date)).filter(isDay).sort();
  if (fDays.length) { weather.push({ from: fDays[0], to: fDays[fDays.length - 1], how: 'IPMA forecast as issued, live file', kind: 'live' }); live.weather = true; }
  else weather.push(FALLBACK.weather[1]);
  const sDays = (sea?.coasts || []).flatMap(c => (c.days || []).map(d => d.date)).filter(isDay).sort();
  const seaR = sDays.length ? [{ from: sDays[0], to: sDays[sDays.length - 1], how: 'IPMA sea forecast, live file', kind: 'live' }] : [...FALLBACK.sea];
  if (sDays.length) live.sea = true;
  let ev = { ...FALLBACK.events };
  const evs = events?.places ? Object.values(events.places).flat() : [];
  const starts = evs.map(e => String(e?.startDate || '').slice(0, 10)).filter(isDay).sort();
  if (starts.length) {
    const read = String(events.read_at || events.provenance?.read_at || '').slice(0, 10);
    ev = { from: isDay(read) && read > FALLBACK.events.from ? read : FALLBACK.events.from, to: starts[starts.length - 1], how: 'events-pt agendas, live file' };
    live.events = true;
  }
  const all = [...weather, ev];
  const from = all.map(r => r.from).sort()[0];
  const to = all.map(r => r.to).sort().reverse()[0];
  return { from, to, weather, sea: seaR, events: ev, live, fallback: !(live.weather && live.events) };
}
export const FALLBACK_BOUNDS = computeBounds();

const inRanges = (ranges, d) => ranges.filter(r => d >= r.from && d <= r.to);
// realDataFor(date, bounds) -> { weather: 'issued'|'none', events: bool, sea: bool, how: [...], message }
export function realDataFor(date, bounds = FALLBACK_BOUNDS) {
  const w = inRanges(bounds.weather, date), s = inRanges(bounds.sea, date);
  const events = date >= bounds.events.from && date <= bounds.events.to;
  return { date, weather: w.length ? 'issued' : 'none', events, sea: s.length > 0, how: w.map(r => r.how),
    message: w.length ? 'Real forecast as IPMA issued it.' : 'No real forecast for this day yet: IPMA publishes five days ahead, and nothing is invented.' };
}

// loadBounds({ getSource }) -> Promise<bounds>. getSource defaults to data.js's (live files, browser).
export async function loadBounds({ getSource } = {}) {
  try {
    const gs = getSource || (await import('../data.js')).getSource;
    const [f, s, e] = await Promise.all([gs('ipma-city-forecasts'), gs('ipma-sea'), gs('events-pt')]);
    return computeBounds({ forecast: f?.latest || null, sea: s?.latest || null, events: e?.latest || null });
  } catch { return FALLBACK_BOUNDS; }
}

// createClock({ store, bounds, timers }) -> clock. timers: { setInterval, clearInterval } (injectable for tests).
export function createClock({ store, bounds = FALLBACK_BOUNDS, timers = globalThis } = {}) {
  let b = bounds, timer = null, carry = 0;
  const listeners = new Set();
  const lo = () => `${b.from}T00:00`, hi = () => `${b.to}T23:59`;
  const clampT = t => (toMs(t) < toMs(lo()) ? lo() : toMs(t) > toMs(hi()) ? hi() : t);
  function moveTo(t) {
    const from = store.clock().now, to = clampT(String(t).slice(0, 16));
    if (to === from) return to;
    store.setClock({ now: to });
    for (const fn of [...listeners]) { try { fn(from, to); } catch (e) { if (globalThis.console) console.error('cc-sim clock listener failed', e); } }
    if (to === hi() && timer) clock.pause();
    return to;
  }
  const clock = {
    now: () => store.clock().now,
    today: () => dayOf(store.clock().now),
    bounds: () => b,
    setBounds(nb) { b = nb; const n = clampT(store.clock().now); if (n !== store.clock().now) store.setClock({ now: n }); return b; },
    setDay(date, time) { if (!isDay(date)) return clock.now(); const hhmm = time || store.clock().now.slice(11, 16) || '09:00'; return moveTo(`${date}T${hhmm}`); },
    setTime: t => moveTo(t),
    advance: minutes => moveTo(addMinutes(store.clock().now, Math.max(0, Number(minutes) || 0))),
    // play(speed): simulated seconds per real second.
    play(speed = SPEEDS.day) {
      clock.pause(false);
      const sp = Math.max(0, Number(speed) || 0);
      store.setClock({ playing: sp > 0, speed: sp });
      if (sp > 0 && timers?.setInterval) timer = timers.setInterval(() => clock.tick(TICK_MS), TICK_MS);
      return sp;
    },
    pause(save = true) { if (timer && timers?.clearInterval) timers.clearInterval(timer); timer = null; carry = 0; if (save) store.setClock({ playing: false }); },
    // tick(realMs): move the clock as play() would after realMs of real time (used by the timer and by tests).
    tick(realMs) {
      const sp = store.clock().speed || 0;
      carry += (sp * realMs) / 60000; // simulated minutes
      const whole = Math.floor(carry);
      if (whole >= 1) { carry -= whole; return clock.advance(whole); }
      return clock.now();
    },
    playing: () => Boolean(timer),
    onAdvance(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    realDataFor: date => realDataFor(date, b),
    // Every day in the window with what is real for it (for the slider's marks).
    days() { const out = []; for (let d = b.from; d <= b.to; d = addDays(d, 1)) out.push(realDataFor(d, b)); return out; },
  };
  return clock;
}
export { fromMs };
