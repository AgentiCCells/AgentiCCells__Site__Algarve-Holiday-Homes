// availability.js: simulated availability for the five invented homes of Cinco Chaminés
// (a made-up example). Nothing here is real: the calendar is made up in the browser from the
// home's id and today's date in Portugal, so the same home on the same day shows the same
// calendar on every device, and it changes once a day (design proposal, round 1, section 4).
// Pure functions, no DOM; tested in tests/availability.test.mjs. Code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.

export const HORIZON_DAYS = 365;

// FNV-1a, 32 bit.
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
// mulberry32: a small seeded generator, returns numbers in [0, 1).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const addDays = (ymd, n) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const memo = new Map();
// takenNights(homeId, today) -> Set of YYYY-MM-DD nights that are taken (simulated), from today
// to today + 365: a free gap of 1 to 9 nights, then a taken run of 2 to 7 nights, and so on.
export function takenNights(homeId, today) {
  const key = `${homeId}|${today}`;
  if (memo.has(key)) return memo.get(key);
  const rnd = mulberry32(fnv1a(key));
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const taken = new Set();
  let i = 0;
  while (i <= HORIZON_DAYS) {
    i += int(1, 9);
    const run = int(2, 7);
    for (let k = 0; k < run && i <= HORIZON_DAYS; k++, i++) taken.add(addDays(today, i));
  }
  memo.set(key, taken);
  return taken;
}
export const isTaken = (homeId, day, today) => takenNights(homeId, today).has(day);
export function nights(from, to) { return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000); }
// A stay from arrive to leave is free when every night (arrive up to the night before leave) is
// free, arrive is today or later, and it lies within the simulated year. The leave day itself may be taken.
export function isFree(homeId, from, to, today) {
  if (!from || !to || from >= to || from < today || nights(today, to) > HORIZON_DAYS + 1) return false;
  for (let d = from; d < to; d = addDays(d, 1)) if (isTaken(homeId, d, today)) return false;
  return true;
}
// The first taken night in from..to-1, or null.
export function firstTaken(homeId, from, to, today) {
  for (let d = from; d < to; d = addDays(d, 1)) if (isTaken(homeId, d, today)) return d;
  return null;
}
// Invented price: nights x the home's invented nightly price, nothing else.
export const price = (nightly, from, to) => nightly * nights(from, to);
