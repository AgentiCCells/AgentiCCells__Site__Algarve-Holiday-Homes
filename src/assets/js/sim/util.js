// sim/util.js: small shared helpers for the Cinco Chaminés simulation (a made-up example).
// Dates are local Portugal dates as YYYY-MM-DD; times are ISO strings "YYYY-MM-DDTHH:MM" in
// Portugal local time, kept as plain strings so the simulation never depends on the
// machine's time zone. Pure functions, no DOM, no network. Code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance C), 2026-11-18, round 3.

export { fnv1a, mulberry32 } from '../availability.js';
import { fnv1a, mulberry32 } from '../availability.js';

export const DAY_MS = 86400000;
export const addDays = (ymd, n) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY_MS);
export const isDay = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(`${s}T12:00:00Z`));
// The nights of a stay: arrival night up to the night before departure.
export function nightsOf(from, to) { const out = []; for (let d = from; d < to; d = addDays(d, 1)) out.push(d); return out; }
export const month = ymd => Number(ymd.slice(5, 7));
export const weekday = ymd => new Date(`${ymd}T12:00:00Z`).getUTCDay(); // 0 Sunday

// Simulated time: "YYYY-MM-DDTHH:MM" (Portugal local, no zone). Arithmetic is done as if UTC.
export const toMs = t => Date.parse(`${String(t).slice(0, 16)}:00Z`);
export const fromMs = ms => new Date(ms).toISOString().slice(0, 16);
export const dayOf = t => String(t).slice(0, 10);
export const hourOf = t => Number(String(t).slice(11, 13));
export const addMinutes = (t, m) => fromMs(toMs(t) + m * 60000);
export const atHour = (ymd, h) => `${ymd}T${String(h).padStart(2, '0')}:00`;

export const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A seeded generator for a key: same key, same numbers.
export function rng(key) {
  const r = mulberry32(fnv1a(String(key)));
  const api = () => r();
  api.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  api.pick = arr => arr[Math.floor(r() * arr.length)];
  api.chance = p => r() < p;
  return api;
}
// A short deterministic id: prefix + base-36 hash of the key.
export const hid = (prefix, key) => `${prefix}-${fnv1a(String(key)).toString(36)}`;

// Plain-text escape for strings put into HTML or SVG.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Every result the simulation shows carries these marks.
export const SIM_MARK = Object.freeze({ simulated: true, invented: true });
