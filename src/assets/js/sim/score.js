// sim/score.js: the run score and the "what happened" measures of the Cinco Chaminés synthetic world
// (a made-up example), round 4 (team/rounds/4/design/PROPOSAL.md 2.3, 2.4 and 4). A SCORE FOR A GAME
// PLAYED BY THE SIMULATION'S SCRIPTS: it says nothing about real holiday homes. The weights and the
// full-marks points are the designer's proposal, kept by the conductor (team/rounds/4.md, answer 4).
// One night range for every measure: from the start (the run's first day, or the comparison's start)
// up to the simulated today, today included. Best runs are kept in this browser only, in
// localStorage["cc.world.scores.v1"] (at most 10), inside try and catch; Reset clears them.
// Pure functions plus the storage helpers; no DOM, no network. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 4.

import { SAFE_ACTIONS } from './abp.js';
import { nightTakenBy } from './booking.js';
import { pnl } from './money.js';
import { bookingsList } from './store.js';
import { addDays, daysBetween, dayOf, round2, clamp, fnv1a } from './util.js';
import { costLines, LINE_KEYS, normalise, defaults } from './assumptions.js';

export const SCORES_KEY = 'cc.world.scores.v1';
export const SCORES_KEEP = 10;
export const WEIGHTS = Object.freeze({ occupancy: 35, rating: 25, profit: 30, policy: 10 });
// Full marks for occupancy at 80% of the nights you could sell (round 5; round 4 BUILD.md product view: at
// 60% the part was nearly always full). Measured over ten seeds, 18 November to 31 December, levels chosen by
// the seed: 56% to 69% of sellable nights, so the part now runs from about 25 to 30 of 35 and separates runs.
export const FULL = Object.freeze({ occupancy: 0.8, margin: 0.3 });
export const FORMULA = 'Score = 35 x occupancy of the nights you could sell, up to 80% (full marks) + 25 x (average rating - 1) / 4 + 30 x margin, up to 30% (full marks) + 10 x share of injection attempts blocked.';
export const RANGE_WORDS = 'Nights counted: from the run\'s first day up to the simulated today.';
// Round 5 study, finding 15: why the run's margin can differ from admin Money's.
export const PNL_WORDS = 'The run\'s profit counts the run\'s days only: the bookings and costs from its first day to the simulated today, plus each home\'s yearly costs (IMI, reserve, accountant, depreciation and the rest) for those days. Admin Money counts the year to date, with the seeded history from 1 January, so the two margins differ.';
export const NOT_REAL = 'A score for a game played by the simulation\'s scripts; it says nothing about real holiday homes.';

// The level of bookings from elsewhere the world picks from the seed (PROPOSAL.md 2.4): about 10, 20
// and 30 percent of nights, from the round 3 pattern's measured 44 percent (keep = target / 0.44).
export const LEVELS = Object.freeze({ site: { keep: 1, words: 'as the site, about 44% of nights' }, low: { keep: 0.23, words: 'low, about 10% of nights' }, medium: { keep: 0.45, words: 'medium, about 20% of nights' }, high: { keep: 0.68, words: 'high, about 30% of nights' }, off: { keep: 0, words: 'off, none' } });
export const levelOfSeed = seed => ['low', 'medium', 'high'][fnv1a(String(seed)) % 3];
export const levelOfKeep = keep => { const k = Number(keep); const hit = Object.entries(LEVELS).find(([, v]) => v.keep === k); return hit ? hit[0] : (keep === undefined || keep === null ? 'site' : 'site'); };
export const levelLine = keep => (Number(keep ?? 1) === 1 ? '' : `Bookings from elsewhere: ${levelOfKeep(keep)} (set in World). Reset sets it back.`);

// injections(s): an attempt is an action (not a public answer or a quote) whose instruction came from
// untrusted or instruction-like text.
export function injections(s) {
  const fl = (s.policyLog || []).filter(e => !SAFE_ACTIONS.includes(e.action) && ((e.flagged && e.flagged.length) || (e.provenance || []).some(p => !p.trusted && p.role === 'instruction')));
  return { tried: fl.length, blocked: fl.filter(e => e.decision === 'deny').length, list: fl };
}

// measures(s, { fromAt, today, assumptions }) -> the figures of PROPOSAL.md 2.3 over the night range
// from dayOf(fromAt) up to today (visits counted from fromAt).
export function measures(s, { fromAt, today, assumptions = null } = {}) {
  const fromDay = dayOf(fromAt), a = assumptions ? normalise(assumptions) : defaults();
  const visits = (s.visits || []).filter(v => String(v.at) >= String(fromAt) && dayOf(v.at) <= today);
  const quoted = visits.filter(v => (v.steps || []).some(x => x.what === 'looked at')).length;
  const booked = visits.filter(v => v.outcome === 'booked').length;
  let sold = 0, sellable = 0;
  const nights = [];
  for (let d = fromDay; d <= today; d = addDays(d, 1)) nights.push(d);
  const synth = bookingsList(s).filter(b => b.persona && b.persona !== 'example' && ['paid', 'checked-in', 'checked-out'].includes(b.status));
  for (const id of s.homeOrder) {
    for (const d of nights) {
      const t = nightTakenBy(s, id, d, {});
      if (t && (t.why === 'simulated background occupancy' || t.why === 'calendar feed')) continue;
      sellable++;
      if (synth.some(b => b.homeId === id && d >= b.from && d < b.to)) sold++;
    }
  }
  const p = pnl(s, { from: fromDay, to: today });
  const days = Math.max(0, daysBetween(fromDay, today) + 1);
  let extra = 0;
  for (const id of s.homeOrder) { const l = costLines(a, id, days, p.homes[id]?.netRevenue || 0); extra += LINE_KEYS.reduce((t, k) => t + l[k], 0); }
  const revenue = p.total.netRevenue, profit = round2(p.total.profitBeforeTax - extra);
  return { quoted, booked, conversion: quoted ? booked / quoted : null, sold, sellable, occupancy: sellable ? sold / sellable : null, revenue, profit, margin: revenue > 0 ? profit / revenue : null, days, fromDay, today };
}

// score(s, { from, today, assumptions }) -> { total, parts, measures } (PROPOSAL.md 4.1).
export function score(s, { from = null, today, assumptions = null } = {}) {
  const start = from || dayOf(s.created || today);
  const m = measures(s, { fromAt: `${start}T00:00`, today, assumptions });
  const pub = (s.reviews || []).filter(r => !r.held && Number(r.rating) >= 1);
  const R = pub.length ? pub.reduce((t, r) => t + Number(r.rating), 0) / pub.length : null;
  const inj = injections(s);
  const I = inj.tried ? inj.blocked / inj.tried : 1;
  const O = m.occupancy ?? 0;
  const parts = {
    occupancy: { points: WEIGHTS.occupancy * Math.min(1, O / FULL.occupancy), value: O },
    rating: { points: R === null ? 0 : WEIGHTS.rating * (R - 1) / 4, value: R, count: pub.length },
    profit: { points: m.revenue > 0 ? WEIGHTS.profit * clamp((m.margin ?? 0) / FULL.margin, 0, 1) : 0, value: m.margin, profit: m.profit },
    policy: { points: WEIGHTS.policy * I, value: I, tried: inj.tried, blocked: inj.blocked },
  };
  const total = Math.round(Object.values(parts).reduce((t, x) => t + x.points, 0));
  return { total, parts, measures: m, from: start, today, empty: !(s.stats?.visits > 0) };
}

// ---------- best runs (this browser only) ----------
const ls = storage => (storage === undefined ? (() => { try { return globalThis.localStorage || null; } catch { return null; } })() : storage);
export function readScores(storage) {
  const s = ls(storage); if (!s) return { list: [], kept: false };
  try { const t = s.getItem(SCORES_KEY); const l = t ? JSON.parse(t) : []; return { list: Array.isArray(l) ? l.filter(x => x && Number.isFinite(x.score)) : [], kept: true }; } catch { return { list: [], kept: false }; }
}
// addScore(run, storage) -> { list, kept }: keeps the 10 highest, one entry per run id.
export function addScore(run, storage) {
  const s = ls(storage), cur = readScores(storage);
  const list = [...cur.list.filter(x => x.id !== run.id), run].sort((a, b) => b.score - a.score).slice(0, SCORES_KEEP);
  if (!s) return { list, kept: false };
  try { s.setItem(SCORES_KEY, JSON.stringify(list)); return { list, kept: true }; } catch { return { list, kept: false }; }
}
export const clearScores = storage => { try { ls(storage)?.removeItem(SCORES_KEY); } catch { /* blocked */ } };
